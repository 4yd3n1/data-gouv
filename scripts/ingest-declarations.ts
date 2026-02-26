/**
 * Ingest HATVP interest declarations from declarations.xml.
 * Source: https://hatvp.fr/livraison/merge/declarations.xml
 *
 * The file is ~150MB XML with all published declarations (DI/DIA).
 * HATVP's server is flaky, so we download with retry + resume logic.
 */

import "dotenv/config";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const DECLARATIONS_URL =
  "https://hatvp.fr/livraison/merge/declarations.xml";
const LOCAL_PATH = join(tmpdir(), "hatvp-declarations.xml");
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

// ─── Download with resume ───

async function downloadWithResume(): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const existingSize = existsSync(LOCAL_PATH)
      ? statSync(LOCAL_PATH).size
      : 0;

    console.log(
      `  Download attempt ${attempts + 1}/${MAX_RETRIES} (resume from ${(existingSize / 1024 / 1024).toFixed(1)}MB)...`
    );

    const headers: Record<string, string> = {};
    if (existingSize > 0) {
      headers["Range"] = `bytes=${existingSize}-`;
    }

    try {
      const res = await fetch(DECLARATIONS_URL, {
        headers,
        signal: AbortSignal.timeout(300_000), // 5 min per attempt
      });

      // If server doesn't support range, start over
      if (existingSize > 0 && res.status === 200) {
        // Server ignored range header, full response — start fresh
        const ws = createWriteStream(LOCAL_PATH, { flags: "w" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if (downloaded % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB downloaded...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      if (res.status === 206) {
        // Partial content — append
        const ws = createWriteStream(LOCAL_PATH, { flags: "a" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = existingSize;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if ((downloaded - existingSize) % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB total...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      if (res.status === 416) {
        // Range not satisfiable — file is complete
        console.log(
          `  File already complete: ${(existingSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      // Full download (no existing file)
      if (res.ok) {
        const ws = createWriteStream(LOCAL_PATH, { flags: "w" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if (downloaded % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB downloaded...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      attempts++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Attempt failed: ${msg}`);
      if (attempts < MAX_RETRIES) {
        console.log(`  Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  // If we have a partial file that's large enough, try to use it
  if (existsSync(LOCAL_PATH)) {
    const size = statSync(LOCAL_PATH).size;
    if (size > 1_000_000) {
      console.log(
        `  Using partial download (${(size / 1024 / 1024).toFixed(1)}MB) after ${MAX_RETRIES} attempts`
      );
      return LOCAL_PATH;
    }
  }

  throw new Error(
    `Failed to download declarations.xml after ${MAX_RETRIES} attempts`
  );
}

// ─── XML Parsing ───

interface ParsedDeclaration {
  uuid: string;
  civilite: string | null;
  nom: string;
  prenom: string;
  dateNaissance: Date | null;
  typeDeclaration: string;
  typeMandat: string;
  organe: string | null;
  qualiteDeclarant: string | null;
  dateDepot: Date | null;
  dateDebutMandat: Date | null;
  participations: {
    nomSociete: string;
    evaluation: number | null;
    remuneration: string | null;
    capitalDetenu: string | null;
    nombreParts: string | null;
  }[];
  revenus: {
    type: string;
    description: string | null;
    employeur: string | null;
    annee: number | null;
    montant: number | null;
  }[];
  totalParticipations: number | null;
  totalRevenus: number | null;
}

function parseFrenchDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // "20/12/2024 20:09:38" or "26/12/1970" or "07/2021"
  const parts = s.trim().split(/[\s/]+/);
  if (parts.length >= 3) {
    const [day, month, year] = parts;
    const d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    return isNaN(d.getTime()) ? null : d;
  }
  if (parts.length === 2) {
    const [month, year] = parts;
    const d = new Date(`${year}-${month.padStart(2, "0")}-01`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function parseMontant(s: string | null | undefined): number | null {
  if (!s) return null;
  // "46 775" or "46775" or "0" — strip spaces
  const clean = s.replace(/\s/g, "").replace(/,/g, ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

function extractText(
  xml: string,
  tag: string,
  startFrom = 0
): { value: string; endIndex: number } | null {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const start = xml.indexOf(openTag, startFrom);
  if (start === -1) return null;
  const contentStart = start + openTag.length;
  const end = xml.indexOf(closeTag, contentStart);
  if (end === -1) return null;
  return {
    value: xml.substring(contentStart, end).trim(),
    endIndex: end + closeTag.length,
  };
}

function extractBlock(
  xml: string,
  tag: string,
  startFrom = 0
): { value: string; endIndex: number } | null {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const start = xml.indexOf(openTag, startFrom);
  if (start === -1) return null;
  const end = xml.indexOf(closeTag, start);
  if (end === -1) return null;
  return {
    value: xml.substring(start + openTag.length, end),
    endIndex: end + closeTag.length,
  };
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  let pos = 0;
  while (true) {
    const result = extractBlock(xml, tag, pos);
    if (!result) break;
    blocks.push(result.value);
    pos = result.endIndex;
  }
  return blocks;
}

function parseLatestMontant(
  remunerationBlock: string
): { annee: number; montant: number } | null {
  // Find all <montant> blocks that contain <annee> and <montant>
  const montantBlocks = extractAllBlocks(remunerationBlock, "montant");
  let latest: { annee: number; montant: number } | null = null;

  for (const block of montantBlocks) {
    const anneeResult = extractText(block, "annee");
    const montantResult = extractText(block, "montant");
    if (anneeResult && montantResult) {
      const annee = parseInt(anneeResult.value, 10);
      const montant = parseMontant(montantResult.value);
      if (!isNaN(annee) && montant !== null) {
        if (!latest || annee > latest.annee) {
          latest = { annee, montant };
        }
      }
    }
  }
  return latest;
}

function parseDeclaration(xml: string): ParsedDeclaration | null {
  const uuid = extractText(xml, "uuid")?.value;
  if (!uuid) return null;

  // Declarant info
  const declarantBlock = extractBlock(xml, "declarant");
  const civilite = declarantBlock
    ? extractText(declarantBlock.value, "civilite")?.value ?? null
    : null;
  const nom = declarantBlock
    ? extractText(declarantBlock.value, "nom")?.value ?? ""
    : "";
  const prenom = declarantBlock
    ? extractText(declarantBlock.value, "prenom")?.value ?? ""
    : "";
  const dateNaissance = declarantBlock
    ? parseFrenchDate(
        extractText(declarantBlock.value, "dateNaissance")?.value
      )
    : null;

  if (!nom) return null;

  // General info
  const generalBlock = extractBlock(xml, "general");
  const typeDecl =
    generalBlock
      ? extractText(generalBlock.value, "id")?.value ?? "DI"
      : "DI";
  const typeMandat =
    generalBlock
      ? extractText(generalBlock.value, "typeMandat")?.value ?? "Inconnu"
      : "Inconnu";
  const organe =
    generalBlock
      ? extractText(generalBlock.value, "qualiteDeclarantForPDF")?.value ?? null
      : null;
  const qualiteDeclarant =
    generalBlock
      ? extractText(generalBlock.value, "qualiteDeclarant")?.value ?? null
      : null;

  const dateDepot = parseFrenchDate(extractText(xml, "dateDepot")?.value);
  const dateDebutMandat = generalBlock
    ? parseFrenchDate(
        extractText(generalBlock.value, "dateDebutMandat")?.value
      )
    : null;

  // Financial participations
  const participations: ParsedDeclaration["participations"] = [];
  const partBlock = extractBlock(xml, "participationFinanciereDto");
  if (partBlock) {
    const items = extractAllBlocks(partBlock.value, "items");
    for (const item of items) {
      // Skip nested items wrapper — find actual items with nomSociete
      const innerItems = extractAllBlocks(item, "items");
      const targets = innerItems.length > 0 ? innerItems : [item];
      for (const target of targets) {
        const nomSociete = extractText(target, "nomSociete")?.value;
        if (!nomSociete) continue;
        participations.push({
          nomSociete,
          evaluation: parseMontant(extractText(target, "evaluation")?.value),
          remuneration: extractText(target, "remuneration")?.value ?? null,
          capitalDetenu: extractText(target, "capitalDetenu")?.value ?? null,
          nombreParts: extractText(target, "nombreParts")?.value ?? null,
        });
      }
    }
  }

  // Revenus from various activity sections
  const revenus: ParsedDeclaration["revenus"] = [];

  // Professional activities (last 5 years)
  const profBlock = extractBlock(xml, "activProfCinqDerniereDto");
  if (profBlock) {
    const items = extractAllBlocks(profBlock.value, "items");
    for (const item of items) {
      const innerItems = extractAllBlocks(item, "items");
      const targets = innerItems.length > 0 ? innerItems : [item];
      for (const target of targets) {
        const remuBlock = extractBlock(target, "remuneration");
        if (!remuBlock) continue;
        const latest = parseLatestMontant(remuBlock.value);
        if (latest) {
          revenus.push({
            type: "professionnel",
            description:
              extractText(target, "description")?.value ?? null,
            employeur: extractText(target, "employeur")?.value ?? null,
            annee: latest.annee,
            montant: latest.montant,
          });
        }
      }
    }
  }

  // Elective mandates
  const mandatBlock = extractBlock(xml, "mandatElectifDto");
  if (mandatBlock) {
    const items = extractAllBlocks(mandatBlock.value, "items");
    for (const item of items) {
      const innerItems = extractAllBlocks(item, "items");
      const targets = innerItems.length > 0 ? innerItems : [item];
      for (const target of targets) {
        const remuBlock = extractBlock(target, "remuneration");
        if (!remuBlock) continue;
        const latest = parseLatestMontant(remuBlock.value);
        if (latest) {
          revenus.push({
            type: "mandat_electif",
            description:
              extractText(target, "descriptionMandat")?.value ?? null,
            employeur: null,
            annee: latest.annee,
            montant: latest.montant,
          });
        }
      }
    }
  }

  // Consultant activities
  const consultBlock = extractBlock(xml, "activConsultantDto");
  if (consultBlock) {
    const items = extractAllBlocks(consultBlock.value, "items");
    for (const item of items) {
      const innerItems = extractAllBlocks(item, "items");
      const targets = innerItems.length > 0 ? innerItems : [item];
      for (const target of targets) {
        const remuBlock = extractBlock(target, "remuneration");
        if (!remuBlock) continue;
        const latest = parseLatestMontant(remuBlock.value);
        if (latest) {
          revenus.push({
            type: "consultant",
            description:
              extractText(target, "descriptionActivite")?.value ?? null,
            employeur: extractText(target, "nomEmployeur")?.value ?? null,
            annee: latest.annee,
            montant: latest.montant,
          });
        }
      }
    }
  }

  // Board/management participation
  const dirigeantBlock = extractBlock(xml, "participationDirigeantDto");
  if (dirigeantBlock) {
    const items = extractAllBlocks(dirigeantBlock.value, "items");
    for (const item of items) {
      const innerItems = extractAllBlocks(item, "items");
      const targets = innerItems.length > 0 ? innerItems : [item];
      for (const target of targets) {
        const remuBlock = extractBlock(target, "remuneration");
        if (!remuBlock) continue;
        const latest = parseLatestMontant(remuBlock.value);
        if (latest) {
          revenus.push({
            type: "dirigeant",
            description: extractText(target, "activite")?.value ?? null,
            employeur: extractText(target, "nomSociete")?.value ?? null,
            annee: latest.annee,
            montant: latest.montant,
          });
        }
      }
    }
  }

  // Compute totals
  const totalParticipations = participations.reduce(
    (sum, p) => sum + (p.evaluation ?? 0),
    0
  );
  const totalRevenus = revenus.reduce(
    (sum, r) => sum + (r.montant ?? 0),
    0
  );

  return {
    uuid,
    civilite,
    nom,
    prenom,
    dateNaissance,
    typeDeclaration: typeDecl,
    typeMandat,
    organe,
    qualiteDeclarant,
    dateDepot,
    dateDebutMandat,
    participations,
    revenus,
    totalParticipations: totalParticipations || null,
    totalRevenus: totalRevenus || null,
  };
}

function splitDeclarations(xml: string): string[] {
  const blocks: string[] = [];
  const openTag = "<declaration>";
  const closeTag = "</declaration>";
  let pos = 0;
  while (true) {
    const start = xml.indexOf(openTag, pos);
    if (start === -1) break;
    const end = xml.indexOf(closeTag, start);
    if (end === -1) break;
    blocks.push(xml.substring(start + openTag.length, end));
    pos = end + closeTag.length;
  }
  return blocks;
}

// ─── Main ───

export async function ingestDeclarations() {
  await logIngestion("declarations", async () => {
    // Download
    console.log("  Downloading declarations.xml (may take several minutes)...");
    const filePath = await downloadWithResume();

    // Read and parse
    console.log("  Reading XML file...");
    const xml = await readFile(filePath, "utf-8");
    console.log(`  File size: ${(xml.length / 1024 / 1024).toFixed(1)}MB`);

    const rawBlocks = splitDeclarations(xml);
    console.log(`  ${rawBlocks.length} declaration blocks found`);

    // Clear existing data
    await prisma.revenuDeclaration.deleteMany({});
    await prisma.participationFinanciere.deleteMany({});
    await prisma.declarationInteret.deleteMany({});

    let declCount = 0;
    let partCount = 0;
    let revCount = 0;
    let skipped = 0;

    for (const block of rawBlocks) {
      const decl = parseDeclaration(block);
      if (!decl) {
        skipped++;
        continue;
      }

      // Same person may have multiple declarations (e.g. DI + DIA, or updates).
      // Use upsert; if duplicate UUID, update with latest data.
      // First delete child records if this UUID already exists.
      await prisma.participationFinanciere.deleteMany({
        where: { declarationId: decl.uuid },
      });
      await prisma.revenuDeclaration.deleteMany({
        where: { declarationId: decl.uuid },
      });

      await prisma.declarationInteret.upsert({
        where: { id: decl.uuid },
        update: {
          civilite: decl.civilite,
          nom: decl.nom,
          prenom: decl.prenom,
          dateNaissance: decl.dateNaissance,
          typeDeclaration: decl.typeDeclaration,
          typeMandat: decl.typeMandat,
          organe: decl.organe,
          qualiteDeclarant: decl.qualiteDeclarant,
          dateDepot: decl.dateDepot,
          dateDebutMandat: decl.dateDebutMandat,
          totalParticipations: decl.totalParticipations,
          totalRevenus: decl.totalRevenus,
          participations: {
            create: decl.participations.map((p) => ({
              nomSociete: p.nomSociete,
              evaluation: p.evaluation,
              remuneration: p.remuneration,
              capitalDetenu: p.capitalDetenu,
              nombreParts: p.nombreParts,
            })),
          },
          revenus: {
            create: decl.revenus.map((r) => ({
              type: r.type,
              description: r.description,
              employeur: r.employeur,
              annee: r.annee,
              montant: r.montant,
            })),
          },
        },
        create: {
          id: decl.uuid,
          civilite: decl.civilite,
          nom: decl.nom,
          prenom: decl.prenom,
          dateNaissance: decl.dateNaissance,
          typeDeclaration: decl.typeDeclaration,
          typeMandat: decl.typeMandat,
          organe: decl.organe,
          qualiteDeclarant: decl.qualiteDeclarant,
          dateDepot: decl.dateDepot,
          dateDebutMandat: decl.dateDebutMandat,
          totalParticipations: decl.totalParticipations,
          totalRevenus: decl.totalRevenus,
          participations: {
            create: decl.participations.map((p) => ({
              nomSociete: p.nomSociete,
              evaluation: p.evaluation,
              remuneration: p.remuneration,
              capitalDetenu: p.capitalDetenu,
              nombreParts: p.nombreParts,
            })),
          },
          revenus: {
            create: decl.revenus.map((r) => ({
              type: r.type,
              description: r.description,
              employeur: r.employeur,
              annee: r.annee,
              montant: r.montant,
            })),
          },
        },
      });

      declCount++;
      partCount += decl.participations.length;
      revCount += decl.revenus.length;

      if (declCount % 100 === 0) {
        console.log(`  ${declCount} declarations processed...`);
      }
    }

    console.log(
      `  ${declCount} declarations, ${partCount} participations, ${revCount} revenus (${skipped} skipped)`
    );

    // Count by type
    const byType: Record<string, number> = {};
    for (const block of rawBlocks) {
      const decl = parseDeclaration(block);
      if (decl) {
        byType[decl.typeMandat] = (byType[decl.typeMandat] ?? 0) + 1;
      }
    }
    console.log("  By mandate type:", byType);

    return {
      rowsIngested: declCount + partCount + revCount,
      rowsTotal: rawBlocks.length,
      metadata: {
        declarations: declCount,
        participations: partCount,
        revenus: revCount,
        skipped,
        byType,
      },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDeclarations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
