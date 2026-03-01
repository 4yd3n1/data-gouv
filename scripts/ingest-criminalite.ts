/**
 * Ingest crime statistics from SSMSI (Service Statistique Ministériel de la Sécurité Intérieure).
 * Source: "Bases statistiques départementale de la délinquance enregistrée par la police et la gendarmerie"
 * URL: https://www.data.gouv.fr/datasets/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales
 * CSV resource ID: 2b27a675-e3bf-41ef-a852-5fb9ab483967
 *
 * CSV format: semicolon-separated, French decimal commas.
 * Columns: Code_departement;Code_region;annee;indicateur;unite_de_compte;nombre;taux_pour_mille;...
 *
 * Ingests all available years (2016+) for 6 main crime categories into StatCriminalite.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { logIngestion } from "./lib/ingestion-log";

// Static CSV — updated ~annually by SSMSI. Check dataset page for new URL.
const SSMSI_CSV_URL =
  "https://static.data.gouv.fr/resources/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales/20260129-160318/donnee-dep-data.gouv-2025-geographie2025-produit-le2026-01-22.csv";

// Map of SSMSI indicateur labels → our model's indicateur codes
const INDICATEUR_MAP: Record<string, string> = {
  "Coups et blessures volontaires":                  "coups_blessures",
  "Vols sans violence contre des personnes":         "vols_sans_violence",
  "Cambriolages de logement":                        "cambriolages",
  "Violences sexuelles":                             "violences_sexuelles",
  "Escroqueries":                                    "escroqueries",
  "Destructions et dégradations volontaires":        "destructions",
  "Homicides":                                       "homicides",
  "Tentatives d'homicide":                           "tentatives_homicide",
};

function parseFloat_fr(s: string | undefined | null): number | null {
  if (!s || s.trim() === "" || s.trim() === "NA") return null;
  // French decimal: comma → dot
  const normalized = s.replace(",", ".");
  const v = parseFloat(normalized);
  return isNaN(v) ? null : v;
}

function parseInt_fr(s: string | undefined | null): number | null {
  if (!s || s.trim() === "" || s.trim() === "NA") return null;
  const v = parseInt(s.replace(/\s/g, ""), 10);
  return isNaN(v) ? null : v;
}

export async function ingestCriminalite() {
  await logIngestion("criminalite", async () => {
    console.log("  [SSMSI] Downloading departmental crime statistics CSV...");
    const raw = await fetchText(SSMSI_CSV_URL);

    // Split into lines — header first
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("Empty or malformed SSMSI CSV");

    const header = lines[0]!.split(";").map((h) => h.trim().replace(/^"|"$/g, ""));
    const idxDept       = header.indexOf("Code_departement");
    const idxAnnee      = header.indexOf("annee");
    const idxIndicateur = header.indexOf("indicateur");
    const idxNombre     = header.indexOf("nombre");
    const idxTaux       = header.indexOf("taux_pour_mille");

    if ([idxDept, idxAnnee, idxIndicateur, idxNombre, idxTaux].some((i) => i === -1)) {
      throw new Error(`SSMSI CSV missing expected columns. Found: ${header.join(", ")}`);
    }

    // Collect all valid dept codes from our DB for FK validation
    const depts = await prisma.departement.findMany({ select: { code: true } });
    const validDepts = new Set(depts.map((d) => d.code));

    let rowsRead = 0;
    let upserted = 0;
    let skipped = 0;

    const upserts: Promise<unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
      rowsRead++;

      const deptCode  = cols[idxDept]?.trim() ?? "";
      const annee     = parseInt_fr(cols[idxAnnee]);
      const indicRaw  = cols[idxIndicateur]?.trim() ?? "";
      const nombre    = parseInt_fr(cols[idxNombre]);
      const taux      = parseFloat_fr(cols[idxTaux]);

      // Only keep mapped indicateurs
      const indicateur = INDICATEUR_MAP[indicRaw];
      if (!indicateur) { skipped++; continue; }
      if (!annee) { skipped++; continue; }

      // Pad dept code to standard format (1→01, 2A, 75, etc.)
      const deptPadded = deptCode.padStart(2, "0");
      if (!validDepts.has(deptPadded)) { skipped++; continue; }

      upserts.push(
        prisma.statCriminalite.upsert({
          where: { departementCode_indicateur_annee: { departementCode: deptPadded, indicateur, annee } },
          create: { departementCode: deptPadded, indicateur, annee, total: nombre, tauxPour1000: taux },
          update: { total: nombre, tauxPour1000: taux },
        })
      );

      if (upserts.length >= 200) {
        await Promise.all(upserts.splice(0, 200));
        upserted += 200;
      }
    }

    if (upserts.length > 0) {
      await Promise.all(upserts);
      upserted += upserts.length;
    }

    console.log(`  [SSMSI] ${rowsRead} rows read → ${upserted} upserted, ${skipped} skipped (unknown indicateur or dept)`);
    return { rowsIngested: upserted, rowsTotal: rowsRead };
  });
}

// Allow running directly
if (require.main === module) {
  ingestCriminalite().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
