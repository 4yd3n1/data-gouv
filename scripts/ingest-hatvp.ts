/**
 * Ingest HATVP interest declarations for government officials.
 *
 * Strategy:
 * 1. Download the HATVP CSV index to get government member metadata (name, role, dossier URL).
 * 2. Update PersonnalitePublique.hatvpDossierId from the CSV for existing DB records.
 * 3. Download the merged XML (declarations.xml) and stream-parse it declaration by declaration.
 * 4. For each declaration, check if the declarant matches a PersonnalitePublique in the DB.
 * 5. If match found, upsert InteretDeclare rows for each interest section.
 *
 * Note: As of early 2026, gouvernement declarations in the CSV are all "publication à venir"
 * and thus absent from the merged XML. The script handles this gracefully: it still updates
 * metadata from the CSV, and will find + ingest XMLs automatically once they are published.
 *
 * Run: npx tsx scripts/ingest-hatvp.ts
 */

import "dotenv/config";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";
import { RubriqueInteret } from "@prisma/client";

// ─── Constants ──────────────────────────────────────────────────────────────

const HATVP_CSV_URL = "https://www.hatvp.fr/livraison/opendata/liste.csv";
const HATVP_XML_URL = "https://www.hatvp.fr/livraison/merge/declarations.xml";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HatvpCsvRow {
  civilite: string;
  prenom: string;
  nom: string;
  classement: string; // HATVP person identifier
  type_mandat: string;
  qualite: string; // role title
  type_document: string; // "di", "dsp", "dim", "dspfm"
  date_publication: string;
  date_depot: string;
  url_dossier: string; // e.g. "/pages_nominatives/barrot-jean-noel"
  open_data: string; // XML filename if published
  statut_publication: string;
}

interface DeclarationItem {
  description?: string;
  descriptionMandat?: string;
  nomSociete?: string;
  nomStructure?: string;
  descriptionActivite?: string;
  nomEmployeur?: string;
  activiteProf?: string;
  employeurConjoint?: string;
  nomConjoint?: string;
  commentaire?: string;
  dateDebut?: string;
  dateFin?: string;
  remuneration?: {
    brutNet?: string;
    montant?: { montant: MontantEntry | MontantEntry[] };
  };
  evaluation?: string | number;
  capitalDetenu?: string | number;
}

interface MontantEntry {
  annee?: string | number;
  montant?: string | number;
}

interface InteretInput {
  personnaliteId: string;
  declarationRef: string;
  dateDeclaration: Date | null;
  rubrique: RubriqueInteret;
  contenu: string;
  organisation: string | null;
  montant: number | null;
  dateDebut: Date | null;
  dateFin: Date | null;
}

// ─── Name normalization ───────────────────────────────────────────────────────

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizedKey(prenom: string, nom: string): string {
  return `${normalizeName(prenom)}|${normalizeName(nom)}`;
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

/**
 * Parse HATVP date formats:
 * - "DD/MM/YYYY HH:MM:SS" (dateDepot)
 * - "DD/MM/YYYY" (date_publication / date_depot from CSV)
 * - "MM/YYYY" (dateDebut / dateFin in items — stored as first of month)
 * - "YYYY" (year only — stored as Jan 1)
 */
function parseDateSafe(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // DD/MM/YYYY HH:MM:SS
  const full = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (full) {
    const [, dd, mm, yyyy] = full;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // MM/YYYY
  const monthYear = s.match(/^(\d{2})\/(\d{4})$/);
  if (monthYear) {
    const [, mm, yyyy] = monthYear;
    const d = new Date(`${yyyy}-${mm}-01T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY (year only)
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    const d = new Date(`${yearOnly[1]}-01-01T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Parse a montant string like "46 775" or "1 234 567" to a float.
 * Returns null if empty/zero.
 */
function parseMontant(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).replace(/\s/g, "").replace(/,/g, ".");
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) || n === 0 ? null : n;
}

// ─── CSV fetch ────────────────────────────────────────────────────────────────

async function fetchCsvRows(): Promise<HatvpCsvRow[]> {
  console.log("  Fetching HATVP CSV index...");
  const res = await fetch(HATVP_CSV_URL);
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();

  const lines = text.split("\n");
  const rows: HatvpCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(";");
    if (cols.length < 13) continue;

    rows.push({
      civilite: cols[0]?.trim() ?? "",
      prenom: cols[1]?.trim() ?? "",
      nom: cols[2]?.trim() ?? "",
      classement: cols[3]?.trim() ?? "",
      type_mandat: cols[4]?.trim() ?? "",
      qualite: cols[5]?.trim() ?? "",
      type_document: cols[6]?.trim() ?? "",
      date_publication: cols[8]?.trim() ?? "",
      date_depot: cols[9]?.trim() ?? "",
      url_dossier: cols[11]?.trim() ?? "",
      open_data: cols[12]?.trim() ?? "",
      statut_publication: cols[13]?.trim() ?? "",
    });
  }

  return rows;
}

// ─── XML streaming ────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => name === "items",
  parseTagValue: true,
  trimValues: true,
});

/**
 * Ensure a value is always an array (fast-xml-parser may return a single object or array).
 */
function ensureArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Stream-fetch the merged XML and yield each <declaration> element as a raw string.
 * The file is ~143MB — we read it in 256KB chunks and extract complete <declaration> blocks.
 */
async function* streamDeclarations(): AsyncGenerator<string> {
  console.log("  Streaming declarations XML...");
  const res = await fetch(HATVP_XML_URL);
  if (!res.ok) throw new Error(`XML fetch failed: ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error("XML response has no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const OPEN = "<declaration>";
  const CLOSE = "</declaration>";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let start: number;
    while ((start = buffer.indexOf(OPEN)) !== -1) {
      const end = buffer.indexOf(CLOSE, start);
      if (end === -1) break; // incomplete declaration — wait for more data

      const raw = buffer.slice(start, end + CLOSE.length);
      yield raw;
      buffer = buffer.slice(end + CLOSE.length);
    }

    // Prevent buffer from growing unboundedly if OPEN tag not found
    if (buffer.length > 2 * 1024 * 1024) {
      buffer = buffer.slice(buffer.length - 512 * 1024);
    }
  }
}

// ─── Section parsers ──────────────────────────────────────────────────────────

function buildContenu(item: DeclarationItem, rubrique: RubriqueInteret): string {
  switch (rubrique) {
    case "MANDAT_ELECTIF":
      return item.descriptionMandat?.trim() || "Mandat électif";
    case "ACTIVITE_ANTERIEURE":
      return (
        item.description?.trim() ||
        item.nomEmployeur?.trim() ||
        "Activité professionnelle"
      );
    case "PARTICIPATION":
      return item.nomSociete?.trim() || item.commentaire?.trim() || "Participation";
    case "ACTIVITE_CONJOINT":
      return item.activiteProf?.trim() || item.employeurConjoint?.trim() || "Activité du conjoint";
    case "ACTIVITE_BENEVOLE":
      return (
        item.descriptionActivite?.trim() ||
        item.nomStructure?.trim() ||
        "Activité bénévole"
      );
    case "REVENU":
      return item.description?.trim() || "Revenu";
    case "DON_AVANTAGE":
      return item.description?.trim() || item.commentaire?.trim() || "Don ou avantage";
    default:
      return item.description?.trim() || item.commentaire?.trim() || "";
  }
}

function buildOrganisation(item: DeclarationItem, rubrique: RubriqueInteret): string | null {
  switch (rubrique) {
    case "MANDAT_ELECTIF":
      return null;
    case "ACTIVITE_ANTERIEURE":
      return item.nomEmployeur?.trim() || null;
    case "PARTICIPATION":
      return item.nomSociete?.trim() || null;
    case "ACTIVITE_CONJOINT":
      return item.employeurConjoint?.trim() || null;
    case "ACTIVITE_BENEVOLE":
      return item.nomStructure?.trim() || null;
    default:
      return null;
  }
}

/**
 * Extract the best single montant from a remuneration block.
 * Sums all years to get a total, or returns the evaluation for participations.
 */
function extractMontantFromItem(
  item: DeclarationItem,
  rubrique: RubriqueInteret
): number | null {
  if (rubrique === "PARTICIPATION") {
    const eval_ = parseMontant(item.evaluation);
    return eval_;
  }

  const rem = item.remuneration;
  if (!rem?.montant) return null;

  const entries = ensureArray(rem.montant.montant);
  let total = 0;
  let hasNonZero = false;
  for (const entry of entries) {
    const v = parseMontant(entry.montant);
    if (v !== null) {
      total += v;
      hasNonZero = true;
    }
  }
  return hasNonZero ? total : null;
}

interface SectionDef {
  dtoKey: string;
  rubrique: RubriqueInteret;
}

const SECTIONS: SectionDef[] = [
  { dtoKey: "mandatElectifDto", rubrique: "MANDAT_ELECTIF" },
  { dtoKey: "activProfCinqDerniereDto", rubrique: "ACTIVITE_ANTERIEURE" },
  { dtoKey: "activConsultantDto", rubrique: "ACTIVITE_ANTERIEURE" },
  { dtoKey: "participationDirigeantDto", rubrique: "PARTICIPATION" },
  { dtoKey: "participationFinanciereDto", rubrique: "PARTICIPATION" },
  { dtoKey: "activProfConjointDto", rubrique: "ACTIVITE_CONJOINT" },
  { dtoKey: "fonctionBenevoleDto", rubrique: "ACTIVITE_BENEVOLE" },
  // revenusDto and donAvantageDto appear in gouvernement declarations once published
  { dtoKey: "revenusDto", rubrique: "REVENU" },
  { dtoKey: "donAvantageDto", rubrique: "DON_AVANTAGE" },
];

/**
 * Extract InteretInput records from a parsed declaration object.
 *
 * fast-xml-parser with isArray("items") produces this structure:
 *   sectionDto.items = [ { items: [ ...actual item objects... ] } ]
 * So the actual items are at sectionDto.items[0].items.
 */
function extractInterets(
  parsed: Record<string, unknown>,
  personnaliteId: string,
  declarationRef: string,
  dateDeclaration: Date | null
): InteretInput[] {
  const results: InteretInput[] = [];

  for (const { dtoKey, rubrique } of SECTIONS) {
    const section = parsed[dtoKey] as Record<string, unknown> | undefined;
    if (!section) continue;

    // Skip if neant=true
    const neant = String(section.neant ?? "").toLowerCase();
    if (neant === "true") continue;

    // fast-xml-parser with isArray("items"):
    // The outer <items> wrapper becomes an array: [ { items: [...] } ]
    // The inner <items> elements are also arrays: [...actual item objects...]
    const outerItems = ensureArray(section.items as Record<string, unknown> | Record<string, unknown>[]);
    if (outerItems.length === 0) continue;

    const innerWrapper = outerItems[0];
    if (!innerWrapper) continue;

    const rawItems = (innerWrapper as Record<string, unknown>).items;
    const items = ensureArray(rawItems as DeclarationItem | DeclarationItem[]);

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      const contenu = buildContenu(item, rubrique);
      // Skip clearly empty/placeholder entries
      if (!contenu || contenu.toLowerCase() === "neant" || contenu.toLowerCase() === "aucune") {
        continue;
      }

      const organisation = buildOrganisation(item, rubrique);
      const montant = extractMontantFromItem(item, rubrique);
      const dateDebut = parseDateSafe(item.dateDebut);
      const dateFin = parseDateSafe(item.dateFin);

      results.push({
        personnaliteId,
        declarationRef,
        dateDeclaration,
        rubrique,
        contenu,
        organisation: organisation || null,
        montant,
        dateDebut,
        dateFin,
      });
    }
  }

  return results;
}

// ─── Main ingestion ───────────────────────────────────────────────────────────

export async function ingestHatvp() {
  await logIngestion("hatvp-interets", async () => {
    const stats = {
      csvPersonnes: 0,
      csvGouvernement: 0,
      csvWithXml: 0,
      hatvpDossierUpdated: 0,
      declarationsProcessed: 0,
      declarationsMatched: 0,
      interetsInserted: 0,
      interetsSkipped: 0,
      errors: 0,
    };

    // ── Step 1: Load CSV and build lookup maps ──────────────────────────────

    const csvRows = await fetchCsvRows();
    stats.csvPersonnes = csvRows.length;

    const govRows = csvRows.filter((r) => r.type_mandat === "gouvernement" && r.type_document === "di");
    stats.csvGouvernement = govRows.length;
    stats.csvWithXml = govRows.filter((r) => r.open_data).length;

    console.log(`  CSV: ${stats.csvPersonnes} total rows, ${stats.csvGouvernement} gouvernement DI entries`);
    console.log(`  XML published: ${stats.csvWithXml} (typically 0 until HATVP publishes them)`);

    // Build a map of classement → url_dossier for gouvernement entries
    // classement format: "LASTNAME Firstname12345"
    const dossierByClassement = new Map<string, string>();
    for (const row of govRows) {
      if (row.classement && row.url_dossier) {
        dossierByClassement.set(row.classement, row.url_dossier);
      }
    }

    // Build normalized name → { classement, url_dossier, qualite } lookup from CSV
    // Use only the most recent DI entry per person (classement is unique per person)
    const govByNormName = new Map<
      string,
      { classement: string; url_dossier: string; qualite: string; civilite: string }
    >();
    for (const row of govRows) {
      const key = normalizedKey(row.prenom, row.nom);
      if (!govByNormName.has(key)) {
        govByNormName.set(key, {
          classement: row.classement,
          url_dossier: row.url_dossier,
          qualite: row.qualite,
          civilite: row.civilite,
        });
      }
    }

    // ── Step 2: Load all PersonnalitePublique from DB ─────────────────────

    const allPersonnalites = await prisma.personnalitePublique.findMany({
      select: { id: true, nom: true, prenom: true, hatvpDossierId: true },
    });

    // Build normalized name → personnaliteId lookup
    const personnaliteByNormName = new Map<string, string>();
    for (const p of allPersonnalites) {
      const key = normalizedKey(p.prenom, p.nom);
      personnaliteByNormName.set(key, p.id);
    }

    console.log(`  DB: ${allPersonnalites.length} PersonnalitePublique records`);

    // ── Step 3: Update hatvpDossierId from CSV ────────────────────────────

    let dossierUpdateCount = 0;
    for (const [normKey, meta] of govByNormName) {
      if (!meta.url_dossier) continue;
      const personnaliteId = personnaliteByNormName.get(normKey);
      if (!personnaliteId) continue;

      // Find record to check if update needed
      const existing = allPersonnalites.find((p) => p.id === personnaliteId);
      if (existing && existing.hatvpDossierId !== meta.url_dossier) {
        await prisma.personnalitePublique.update({
          where: { id: personnaliteId },
          data: { hatvpDossierId: meta.url_dossier },
        });
        dossierUpdateCount++;
      }
    }
    stats.hatvpDossierUpdated = dossierUpdateCount;
    console.log(`  Updated hatvpDossierId on ${dossierUpdateCount} records`);

    // ── Step 4: Build set of all names we care about (for fast XML filtering) ──

    // We match ANY PersonnalitePublique in the DB, not just gouvernement
    // This allows matching deputies/senators who also have HATVP declarations
    const knownNormNames = new Set(personnaliteByNormName.keys());

    if (knownNormNames.size === 0) {
      console.log("  No PersonnalitePublique records in DB — XML parsing skipped.");
      console.log("  Run seed-gouvernement.ts first to populate the DB.");
      return {
        rowsIngested: stats.interetsInserted,
        metadata: stats as Record<string, unknown>,
      };
    }

    // ── Step 5: Stream XML and match declarations ─────────────────────────

    console.log("  Streaming and parsing declarations XML (143MB)...");
    console.log("  This may take 1-3 minutes...");

    for await (const rawDecl of streamDeclarations()) {
      stats.declarationsProcessed++;

      if (stats.declarationsProcessed % 1000 === 0) {
        console.log(`    Processed ${stats.declarationsProcessed} declarations, matched ${stats.declarationsMatched}...`);
      }

      let parsed: Record<string, unknown>;
      try {
        const wrapped = `<root>${rawDecl}</root>`;
        const result = xmlParser.parse(wrapped) as { root: { declaration: Record<string, unknown> } };
        parsed = result.root?.declaration ?? {};
      } catch {
        stats.errors++;
        continue;
      }

      // Extract declarant identity
      const general = parsed.general as Record<string, unknown> | undefined;
      const declarant = general?.declarant as Record<string, unknown> | undefined;
      if (!declarant) continue;

      const declNom = String(declarant.nom ?? "").trim();
      const declPrenom = String(declarant.prenom ?? "").trim();
      if (!declNom || !declPrenom) continue;

      // Check type — prefer gouvernement but match any known person
      const qualiteMandat = general?.qualiteMandat as Record<string, unknown> | undefined;
      const codTypeMandatFichier = String(qualiteMandat?.codTypeMandatFichier ?? "");

      const normKey = normalizedKey(declPrenom, declNom);
      const personnaliteId = personnaliteByNormName.get(normKey);
      if (!personnaliteId) continue;

      stats.declarationsMatched++;

      // Extract declaration metadata
      const uuid = String(parsed.uuid ?? "").trim();
      const dateDepotRaw = String(parsed.dateDepot ?? "").trim();
      const dateDeclaration = parseDateSafe(dateDepotRaw);
      const declarationRef = uuid || `${normKey}|${dateDepotRaw}`;

      // Extract all interest entries from the declaration
      const interets = extractInterets(parsed, personnaliteId, declarationRef, dateDeclaration);

      if (interets.length === 0) {
        stats.interetsSkipped++;
        continue;
      }

      // Upsert each interest entry
      // Unique key: personnaliteId + declarationRef + rubrique + contenu (first 200 chars)
      for (const interet of interets) {
        try {
          // Check for existing record to avoid duplicates (no unique constraint with contenu)
          const existing = await prisma.interetDeclare.findFirst({
            where: {
              personnaliteId: interet.personnaliteId,
              declarationRef: interet.declarationRef,
              rubrique: interet.rubrique,
              contenu: interet.contenu.substring(0, 200),
            },
          });

          if (existing) {
            stats.interetsSkipped++;
          } else {
            await prisma.interetDeclare.create({
              data: {
                personnaliteId: interet.personnaliteId,
                declarationRef: interet.declarationRef,
                dateDeclaration: interet.dateDeclaration,
                rubrique: interet.rubrique,
                contenu: interet.contenu.substring(0, 1000),
                organisation: interet.organisation
                  ? interet.organisation.substring(0, 500)
                  : null,
                montant: interet.montant,
                dateDebut: interet.dateDebut,
                dateFin: interet.dateFin,
                alerteConflit: false,
              },
            });
            stats.interetsInserted++;
          }
        } catch (e) {
          stats.errors++;
          if (stats.errors <= 5) {
            console.error(
              `    Error upserting interet for ${declPrenom} ${declNom}:`,
              e instanceof Error ? e.message : String(e)
            );
          }
        }
      }

      // Log type for reference
      if (stats.declarationsMatched <= 3) {
        console.log(
          `    Matched: ${declPrenom} ${declNom} (${codTypeMandatFichier}), uuid=${uuid}, interets=${interets.length}`
        );
      }
    }

    console.log(`\n  XML processing complete.`);
    console.log(`  Declarations processed: ${stats.declarationsProcessed}`);
    console.log(`  Declarations matched:   ${stats.declarationsMatched}`);
    console.log(`  InteretDeclare inserted: ${stats.interetsInserted}`);
    console.log(`  InteretDeclare skipped:  ${stats.interetsSkipped}`);
    console.log(`  Errors: ${stats.errors}`);

    if (stats.declarationsMatched === 0) {
      console.log("\n  Note: 0 matches found. This is expected if:");
      console.log("  - PersonnalitePublique DB is empty (run seed-gouvernement.ts first)");
      console.log("  - Gouvernement declarations are not yet published by HATVP");
      console.log("  - The merged XML only contains non-gouvernement declarations");
    }

    return {
      rowsIngested: stats.interetsInserted,
      rowsTotal: stats.declarationsProcessed,
      metadata: stats as Record<string, unknown>,
    };
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

ingestHatvp()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
