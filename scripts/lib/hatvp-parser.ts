/**
 * Shared HATVP XML parsing functions.
 * Used by both ingest-declarations.ts and audit-declarations.ts.
 */

export interface ParsedDeclaration {
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

export function parseFrenchDate(s: string | null | undefined): Date | null {
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

export function parseMontant(s: string | null | undefined): number | null {
  if (!s) return null;
  // "46 775" or "46775" or "0" — strip spaces
  const clean = s.replace(/\s/g, "").replace(/,/g, ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

export function extractText(
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

export function extractBlock(
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

export function extractAllBlocks(xml: string, tag: string): string[] {
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

export function parseAllMontants(
  remunerationBlock: string
): { annee: number; montant: number }[] {
  const results: { annee: number; montant: number }[] = [];
  const re = /<annee>\s*(\d{4})\s*<\/annee>\s*<montant>\s*([^<]+)<\/montant>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(remunerationBlock)) !== null) {
    const annee = parseInt(m[1], 10);
    const montant = parseMontant(m[2]);
    if (!isNaN(annee) && montant !== null) {
      results.push({ annee, montant });
    }
  }
  return results;
}

export function parseLatestMontant(
  remunerationBlock: string
): { annee: number; montant: number } | null {
  const all = parseAllMontants(remunerationBlock);
  if (all.length === 0) return null;
  return all.reduce((best, cur) => (cur.annee > best.annee ? cur : best));
}

function pushRevenus(
  revenus: ParsedDeclaration["revenus"],
  target: string,
  type: string,
  descTag: string,
  employeurTag: string | null
) {
  const remuBlock = extractBlock(target, "remuneration");
  if (!remuBlock) return;
  const allYears = parseAllMontants(remuBlock.value);
  const description = extractText(target, descTag)?.value ?? null;
  const employeur = employeurTag
    ? extractText(target, employeurTag)?.value ?? null
    : null;
  for (const { annee, montant } of allYears) {
    revenus.push({ type, description, employeur, annee, montant });
  }
}

function parseActivitySection(
  xml: string,
  revenus: ParsedDeclaration["revenus"],
  sectionTag: string,
  type: string,
  descTag: string,
  employeurTag: string | null
) {
  const block = extractBlock(xml, sectionTag);
  if (!block) return;
  const items = extractAllBlocks(block.value, "items");
  for (const item of items) {
    const innerItems = extractAllBlocks(item, "items");
    const targets = innerItems.length > 0 ? innerItems : [item];
    for (const target of targets) {
      pushRevenus(revenus, target, type, descTag, employeurTag);
    }
  }
}

export function parseDeclaration(xml: string): ParsedDeclaration | null {
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
  parseActivitySection(xml, revenus, "activProfCinqDerniereDto", "professionnel", "description", "employeur");
  parseActivitySection(xml, revenus, "mandatElectifDto", "mandat_electif", "descriptionMandat", null);
  parseActivitySection(xml, revenus, "activConsultantDto", "consultant", "descriptionActivite", "nomEmployeur");
  parseActivitySection(xml, revenus, "participationDirigeantDto", "dirigeant", "activite", "nomSociete");

  // Compute totals
  const totalParticipations = participations.reduce(
    (sum, p) => sum + (p.evaluation ?? 0),
    0
  );
  const revenueGroups = new Map<string, { annee: number; montant: number }>();
  for (const r of revenus) {
    const key = `${r.type}|${r.description}|${r.employeur}`;
    const existing = revenueGroups.get(key);
    if (!existing || (r.annee ?? 0) > existing.annee) {
      revenueGroups.set(key, { annee: r.annee ?? 0, montant: r.montant ?? 0 });
    }
  }
  const totalRevenus = Array.from(revenueGroups.values()).reduce(
    (sum, g) => sum + g.montant,
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

export function splitDeclarations(xml: string): string[] {
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
