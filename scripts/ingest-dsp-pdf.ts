import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { prisma } from "../src/lib/db";
import { normalizeName } from "../src/lib/normalize-name";
import { logIngestion } from "./lib/ingestion-log";

const PDF_DIR = "documentation/HATVP-PDF";

const RUBRIQUE_TITRES: Record<number, string> = {
  1: "Les immeubles bâtis et non bâtis",
  2: "Les parts de sociétés civiles immobilières",
  3: "Les autres valeurs mobilières non cotées en bourse",
  4: "Les instruments financiers",
  5: "Les assurances vie",
  6: "Les comptes bancaires courants et les produits d'épargne",
  7: "Les biens mobiliers divers, lorsque leur valeur unitaire est égale ou supérieure à 10 000 €",
  8: "Les véhicules à moteur",
  9: "Les fonds de commerce, les clientèles, les charges et les offices",
  10: "Les espèces et les autres biens, dont les comptes courants de société ou les stock-options, d'une valeur supérieure ou égale à 10 000 €",
  11: "Les biens mobiliers, immobiliers et les comptes détenus à l'étranger",
  12: "Les éléments du passif, y compris les dettes de nature fiscale",
};

type RawRow = {
  description: Record<string, string>;
  valeur: Record<string, number | string>;
};

function pdftotext(file: string, layout: boolean): string {
  const args = layout ? ["-layout", file, "-"] : [file, "-"];
  const result = spawnSync("pdftotext", args, { encoding: "utf-8", maxBuffer: 32_000_000 });
  if (result.status !== 0) {
    throw new Error(`pdftotext failed for ${file}: ${result.stderr}`);
  }
  return result.stdout;
}

function parseAmount(s: string): number | null {
  const m = s.match(/(-?\d[\d\s]*)\s*€/);
  if (!m) return null;
  const n = Number(m[1].replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseFrenchDateTime(s: string): Date | null {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, d, mo, y, hh, mm, ss] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh ?? 0),
    Number(mm ?? 0),
    Number(ss ?? 0),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractKeyValues(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([^:]{2,40})\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim();
    if (!value) continue;
    if (key in out) continue;
    out[key] = value;
  }
  return out;
}

function extractAmounts(text: string): number[] {
  const out: number[] = [];
  // Allow ASCII space and non-breaking space inside the digits (French thousands)
  // but NEVER newlines — that conflated "Date : 2023" with "225000 €".
  const re = /(-?\d[\d  ]{0,15})\s*€/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const n = Number(m[1].replace(/[\s ]/g, ""));
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

type CoverInfo = {
  nom: string;
  prenom: string;
  organe: string | null;
  dateDebutMandat: Date | null;
  dateDepot: Date | null;
  regimeMatrimonial: string | null;
};

/**
 * Cover page in HATVP DSP PDFs is rendered as an image and not extractable via
 * pdftotext. We instead parse the running header `DSP/SURNAME-Prenom` that
 * appears at the top of every body page. Pattern: surname is uppercase
 * (possibly with spaces, accents, hyphens), prenom is mixed-case OR uppercase.
 *
 * If both sides of the header are uppercase (FERRARI-MARINA, NUNEZ-LAURENT),
 * fall back to the filename's tokenised last segment as prenom.
 */
function parseHeader(headerLine: string, filename: string): { nom: string; prenom: string } | null {
  // Strip "DSP/", "DSPM/", "DSPFM/" prefix
  const m = headerLine.match(/^(?:DSP|DSPM|DSPFM)\/(.+)$/);
  if (!m) return null;
  const body = m[1].trim();

  // Find first hyphen where the right side has lowercase letters (= mixed-case prenom)
  const firstHyphenIdx = body.indexOf("-");
  if (firstHyphenIdx < 0) return null;
  const left = body.slice(0, firstHyphenIdx);
  const right = body.slice(firstHyphenIdx + 1);

  // Right side has lowercase → standard split
  if (/[a-zà-ÿ]/.test(right)) {
    return { nom: left, prenom: right };
  }

  // Right side is fully uppercase (FERRARI-MARINA case) — use filename to
  // determine boundary, then echo the running-header casing.
  // Filename: e.g. "ferrari-marina-dsp34850-gouvernement.pdf" → tokens before -dsp:
  const fnameBase = filename.replace(/-(dsp|dspm|dspfm)\d+-gouvernement\.pdf$/i, "");
  const tokens = fnameBase.split("-");
  if (tokens.length < 2) return null;
  // Last token = prenom; everything before = nom
  const filePrenom = tokens[tokens.length - 1];
  // Find that prenom in the header (case-insensitive, whitespace-tolerant)
  const headerLower = body.toLowerCase().replace(/\s+/g, "-");
  const prenomLcIdx = headerLower.lastIndexOf(`-${filePrenom.toLowerCase()}`);
  if (prenomLcIdx > 0) {
    return {
      nom: body.slice(0, prenomLcIdx).trim(),
      prenom: body.slice(prenomLcIdx + 1).trim(),
    };
  }
  // Last-resort: split at first hyphen
  return { nom: left, prenom: right };
}

function parseCover(text: string, filename: string): CoverInfo | null {
  const headerLine = text.split("\n").find((l) => /^(?:DSP|DSPM|DSPFM)\//.test(l.trim()))?.trim();
  if (!headerLine) return null;

  const np = parseHeader(headerLine, filename);
  if (!np) return null;

  // Cover page is an image: dates and metadata aren't recoverable from
  // pdftotext. Leave null; renderer/UI handles missing dates gracefully.
  return {
    nom: np.nom,
    prenom: np.prenom,
    organe: null,
    dateDebutMandat: null,
    dateDepot: null,
    regimeMatrimonial: null,
  };
}

function splitSections(text: string): Map<number, string> {
  const out = new Map<number, string>();
  const headerRe = /^\s*(\d{1,2})°\s+(.+?)$/gm;
  const headers: { num: number; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(text))) {
    const num = Number(m[1]);
    if (num >= 1 && num <= 12) {
      headers.push({ num, index: m.index });
    }
  }
  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index;
    const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
    out.set(headers[i].num, text.slice(start, end));
  }
  return out;
}

function parseGeneric(sectionText: string): RawRow[] {
  const lines = sectionText.split("\n").slice(1);
  const body = lines.join("\n");
  if (/\bNéant\b/.test(body)) return [];
  const raw = body.replace(/\s*Page \d+\/\d+\s*$/m, "").trim();
  if (!raw) return [];
  return [{ description: { _raw: raw }, valeur: {} }];
}

/**
 * §1° uses the -layout text because linear mode separates columns from rows.
 * Each row begins with the Type word (Maison, Appartement, Terrain, …) at
 * column 0. Within a row block, amounts appear in column order:
 *   1st = Prix d'acquisition, 2nd = Valeur vénale, 3rd = Montant des travaux.
 */
const TYPE_RE =
  /^(Appartement|Maison(?:\s+individuelle)?|Terrain|Studio|Garage|Parking|Bureau|Local|Bois|Champ|Forêt|Pâture|Pré|Verger|Vigne|Étang|Hangar|Chalet|Villa|Pavillon|Immeuble|Box|Cellier|Cave)\b/i;

function parseImmeublesLayout(layoutSectionText: string): RawRow[] {
  if (/\bNéant\b/.test(layoutSectionText)) return [];

  const lines = layoutSectionText.split("\n").slice(1); // drop section header

  // Skip the column-header lines: "Description", "Régime juridique", "Entrée dans",
  // "le patrimoine", "Prix d'acquisition", "Valeur vénale", "Page X/Y"
  // We detect rows by the Type word appearing at column 0 (start of line).

  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    // Skip page header echoes
    if (/^\s*DSP\//.test(line)) continue;
    if (/^\s*Page \d+\/\d+\s*$/.test(line)) continue;

    if (TYPE_RE.test(line.trim()) && /^\S/.test(line)) {
      // Type word at column 0 = new row
      if (current.length) blocks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  return blocks
    .filter((b) => b.trim().length > 5 && TYPE_RE.test(b.trim().split("\n")[0]))
    .map((block) => {
      const description: Record<string, string> = {};

      const firstLine = block.split("\n")[0];
      const typeMatch = firstLine.match(TYPE_RE);
      if (typeMatch) description["Type"] = typeMatch[0];

      // Per-line key:value extraction is fragile in -layout (multi-column
      // values get jammed together). Use targeted regexes for fields we want.
      const blockText = block;
      const dept = blockText.match(/Département\s*:\s*(\d{2,3})/);
      const surfBati = blockText.match(/Superficie bati\s*:\s*([0-9., ]+m\s*2?)/);
      const surfNonBati = blockText.match(/Superficie non-bati\s*:\s*([0-9., ]+ha)/);
      const date = blockText.match(/Date\s*:\s*(\d{4}|\d{2}\/\d{2}\/\d{4})/);
      const droitReel = blockText.match(/Droit-?réel\s*:\s*([^\n]+?)(?:\s{2}|$)/);
      const quotePart = blockText.match(/Quote-part détenue\s*:\s*([0-9.,]+\s*%)/);
      const origine = blockText.match(/Origine de propriété\s*:\s*([A-Za-zÀ-ÿ ]+)/);
      const regimeJuridique = blockText.match(
        /\b(Bien commun|Bien propre|Bien personnel|Indivision|Bien en indivision|Démembrement)\b/i,
      );

      if (dept) description["Département"] = dept[1];
      if (surfBati) description["Superficie bâtie"] = surfBati[1].replace(/\s+/g, " ").trim();
      if (surfNonBati)
        description["Superficie non bâtie"] = surfNonBati[1].replace(/\s+/g, " ").trim();
      if (date) description["Date d'acquisition"] = date[1];
      if (droitReel) description["Droit réel"] = droitReel[1].trim();
      if (quotePart) description["Quote-part détenue"] = quotePart[1].trim();
      if (origine) description["Origine de propriété"] = origine[1].trim();
      if (regimeJuridique) description["Régime juridique"] = regimeJuridique[1];

      const amounts = extractAmounts(blockText);
      const valeur: Record<string, number | string> = {};
      // Column order in the PDF: Prix d'acquisition, Valeur vénale, [Montant des travaux]
      if (amounts.length >= 1) valeur["Prix d'acquisition"] = amounts[0];
      if (amounts.length >= 2) valeur["Valeur vénale"] = amounts[1];
      if (amounts.length >= 3) valeur["Montant des travaux"] = amounts[2];

      return { description, valeur };
    });
}

function parseDescriptionBlocks(sectionText: string, valueLabel: string): RawRow[] {
  if (/\bNéant\b/.test(sectionText)) return [];
  const body = sectionText.split("\n").slice(1).join("\n");

  const cleaned = body
    .split("\n")
    .filter(
      (l) =>
        !/^(Description|Solde|Valeur vénale|Valeur de rachat|Entrée dans le patrimoine)\s*$/.test(
          l.trim(),
        ),
    )
    .filter((l) => !/^Page \d+\/\d+\s*$/.test(l.trim()))
    .join("\n");

  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of cleaned.split("\n")) {
    if (/^Description\s*:/.test(line)) {
      if (current.length) blocks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  const descBlocks = blocks.filter((b) => /Description\s*:/.test(b));
  // Sometimes amounts are on a trailing block, sometimes they all land on the
  // last description block. Compute global amounts across the whole section
  // and use them positionally when the count matches the block count.
  const globalAmounts = extractAmounts(cleaned);
  const localFirstAmounts = descBlocks.map((b) => {
    const a = extractAmounts(b);
    return a.length > 0 ? a[0] : null;
  });
  const localFirstCount = localFirstAmounts.filter((x) => x != null).length;

  const usePositional =
    globalAmounts.length === descBlocks.length && localFirstCount < descBlocks.length;

  return descBlocks.map((block, i) => {
    const description = extractKeyValues(block);
    const amounts = extractAmounts(block);
    const valeur: Record<string, number | string> = {};

    let amount: number | null = null;
    if (usePositional) {
      amount = globalAmounts[i];
    } else if (amounts.length > 0) {
      amount = amounts[0];
    }

    if (amount != null) valeur[valueLabel] = amount;
    return { description, valeur };
  });
}

function parseAssurancesVie(sectionText: string): RawRow[] {
  if (/\bNéant\b/.test(sectionText)) return [];
  const body = sectionText.split("\n").slice(1).join("\n");

  const cleaned = body
    .split("\n")
    .filter((l) => !/^(Description|Valeur de rachat)\s*$/.test(l.trim()))
    .filter((l) => !/^Page \d+\/\d+\s*$/.test(l.trim()))
    .join("\n");

  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of cleaned.split("\n")) {
    if (/^Etablissement\s*:/.test(line)) {
      if (current.length) blocks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  const etabBlocks = blocks.filter((b) => /Etablissement\s*:/.test(b));
  const trailing = blocks.find((b, i) => i > 0 && !/Etablissement\s*:/.test(b));
  const trailingAmounts = trailing ? extractAmounts(trailing) : [];

  return etabBlocks.map((block, i) => {
    const description = extractKeyValues(block);
    const amounts = extractAmounts(block);
    const valeur: Record<string, number | string> = {};
    let amount: number | null = null;
    if (amounts.length > 0) amount = amounts[0];
    else if (trailingAmounts.length > i) amount = trailingAmounts[i];
    if (amount != null) valeur["Valeur de rachat"] = amount;
    return { description, valeur };
  });
}

function parsePassif(sectionText: string): RawRow[] {
  if (/\bNéant\b/.test(sectionText)) return [];
  let body = sectionText.split("\n").slice(1).join("\n");

  // Cut everything from "Observations" footer down — that's the signature block,
  // not part of the passif data.
  const obsIdx = body.search(/^\s*Observations\s*$/m);
  if (obsIdx >= 0) body = body.slice(0, obsIdx);

  const HEADER_FRAGMENTS = new Set([
    "Identification et",
    "adresse du créancier",
    "Nature, date et objet de la dette",
    "Nature",
    "date et objet",
    "de la dette",
    "Montant total",
    "Montant total de l'emprunt",
    "de l'emprunt",
    "Montant des",
    "Montant des mensualités",
    "Mensualités",
    "Somme restant",
    "Somme restant à rembourser",
    "à rembourser",
    "Identification",
    "adresse",
    "des",
    "total",
    "restant",
    "Pour les fonds",
  ]);

  const cleaned = body
    .split("\n")
    .filter((l) => !/^Page \d+\/\d+\s*$/.test(l.trim()))
    .filter((l) => l.trim().length > 0)
    .filter((l) => !HEADER_FRAGMENTS.has(l.trim()))
    .join("\n")
    .trim();

  if (!cleaned) return [];

  const description = extractKeyValues(cleaned);
  // Drop bleed-throughs from observations or columns
  delete description["Identification et"];
  delete description["Fait, le"];
  delete description["Signature"];
  delete description["Fait"];

  // First non-empty non-key:value line is the créancier (e.g. "La Banque Postale")
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstPlainLine = lines.find((l) => !l.includes(":"));
  if (firstPlainLine && !description["Créancier"]) description["Créancier"] = firstPlainLine;

  const amounts = extractAmounts(cleaned);
  const valeur: Record<string, number | string> = {};
  const sorted = [...new Set(amounts)].sort((a, b) => b - a);
  if (sorted.length >= 1) valeur["Montant total de l'emprunt"] = sorted[0];
  if (sorted.length >= 2) valeur["Somme restant à rembourser"] = sorted[1];
  if (sorted.length >= 3) valeur["Montant des mensualités"] = sorted[sorted.length - 1];
  return [{ description, valeur }];
}

type ParsedDeclaration = {
  cover: CoverInfo;
  rows: Array<{
    rubriqueNum: number;
    ordre: number;
    isNeant: boolean;
    description: Record<string, unknown>;
    valeur: Record<string, unknown>;
  }>;
};

function parseDsp(filePath: string): ParsedDeclaration | null {
  const linear = pdftotext(filePath, false);
  const layout = pdftotext(filePath, true);
  const cover = parseCover(linear, basename(filePath));
  if (!cover) {
    console.warn(`  cover-page parse failed for ${basename(filePath)}`);
    return null;
  }

  const sections = splitSections(linear);
  const layoutSections = splitSections(layout);
  const rows: ParsedDeclaration["rows"] = [];

  for (let n = 1; n <= 12; n++) {
    const text = sections.get(n) ?? "";
    const layoutText = layoutSections.get(n) ?? "";
    let parsed: RawRow[] = [];

    if (!text || /\bNéant\b/.test(text)) {
      rows.push({
        rubriqueNum: n,
        ordre: 0,
        isNeant: true,
        description: {},
        valeur: {},
      });
      continue;
    }

    try {
      switch (n) {
        case 1:
          parsed = parseImmeublesLayout(layoutText);
          break;
        case 4:
        case 7:
        case 8:
        case 10:
        case 11:
          parsed = parseDescriptionBlocks(text, "Valeur vénale");
          break;
        case 5:
          parsed = parseAssurancesVie(text);
          break;
        case 6:
          parsed = parseDescriptionBlocks(text, "Solde");
          break;
        case 12:
          parsed = parsePassif(text);
          break;
        default:
          parsed = parseGeneric(text);
      }
    } catch (e) {
      console.warn(`  section ${n}° parse failed: ${e instanceof Error ? e.message : e}`);
      parsed = parseGeneric(text);
    }

    if (parsed.length === 0) {
      const raw = text.replace(/^\s*\d+°\s.*\n/, "").trim();
      if (raw) {
        rows.push({
          rubriqueNum: n,
          ordre: 0,
          isNeant: false,
          description: { _raw: raw },
          valeur: {},
        });
      }
    } else {
      parsed.forEach((r, ordre) =>
        rows.push({
          rubriqueNum: n,
          ordre,
          isNeant: false,
          description: r.description,
          valeur: r.valeur,
        }),
      );
    }
  }

  return { cover, rows };
}

const FILENAME_RE = /^(.+)-(dsp|dspm|dspfm)(\d+)-gouvernement\.pdf$/i;

async function ingestDspPdfs() {
  const allFiles = readdirSync(PDF_DIR).filter((f) =>
    /-(dsp|dspm|dspfm)\d+-gouvernement\.pdf$/i.test(f),
  );
  console.log(`Found ${allFiles.length} DSP/DSPM/DSPFM PDFs`);

  let rowsTotal = 0;
  let unmatched = 0;

  for (const fname of allFiles) {
    const fullPath = join(PDF_DIR, fname);
    const stat = statSync(fullPath);
    if (!stat.isFile()) continue;

    const fnameMatch = fname.match(FILENAME_RE);
    if (!fnameMatch) continue;
    const typeDeclaration = fnameMatch[2].toUpperCase();
    const dossierNumber = fnameMatch[3];
    const declarationId = `${fnameMatch[2].toLowerCase()}${dossierNumber}`;
    const sourcePdfUrl = `https://www.hatvp.fr/livraison/dossiers/${fname}`;

    const parsed = parseDsp(fullPath);
    if (!parsed) {
      console.warn(`  skipped: ${fname}`);
      continue;
    }

    const nomNormalise = normalizeName(parsed.cover.nom);
    const prenomNormalise = normalizeName(parsed.cover.prenom);

    const person = await prisma.personnalitePublique.findFirst({
      where: { nomNormalise, prenomNormalise },
      select: { id: true },
    });
    if (!person) unmatched++;

    await prisma.declarationPatrimoine.upsert({
      where: { id: declarationId },
      create: {
        id: declarationId,
        personnaliteId: person?.id ?? null,
        nomNormalise,
        prenomNormalise,
        organe: parsed.cover.organe,
        dateDebutMandat: parsed.cover.dateDebutMandat,
        dateDepot: parsed.cover.dateDepot,
        regimeMatrimonial: parsed.cover.regimeMatrimonial,
        sourcePdfUrl,
        typeDeclaration,
      },
      update: {
        personnaliteId: person?.id ?? null,
        organe: parsed.cover.organe,
        dateDebutMandat: parsed.cover.dateDebutMandat,
        dateDepot: parsed.cover.dateDepot,
        regimeMatrimonial: parsed.cover.regimeMatrimonial,
        sourcePdfUrl,
        typeDeclaration,
      },
    });

    await prisma.patrimoineRow.deleteMany({ where: { declarationId } });
    if (parsed.rows.length > 0) {
      await prisma.patrimoineRow.createMany({
        data: parsed.rows.map((r) => ({
          declarationId,
          rubriqueNum: r.rubriqueNum,
          rubriqueTitre: RUBRIQUE_TITRES[r.rubriqueNum] ?? `§${r.rubriqueNum}°`,
          ordre: r.ordre,
          isNeant: r.isNeant,
          description: r.description as object,
          valeur: r.valeur as object,
        })),
      });
    }
    rowsTotal += parsed.rows.length;

    console.log(
      `  ${declarationId} · ${parsed.cover.nom} ${parsed.cover.prenom} · ${parsed.rows.length} rows · ${person ? "linked" : "UNMATCHED"}`,
    );
  }

  return { rowsTotal, unmatched, files: allFiles.length };
}

async function main() {
  await logIngestion("dsp-pdf", async () => {
    const { rowsTotal, unmatched, files } = await ingestDspPdfs();
    return {
      rowsIngested: rowsTotal,
      metadata: { files, unmatched },
    };
  });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
