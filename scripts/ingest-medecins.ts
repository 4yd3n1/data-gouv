/**
 * Ingest medical professional density from DREES (Démographie des professionnels de santé).
 * Source: data.drees.solidarites-sante.gouv.fr
 * Dataset: "La démographie des professionnels de santé depuis 2012"
 * Also available on data.gouv.fr: https://www.data.gouv.fr/datasets/la-demographie-des-professionnels-de-sante-de-2012-a-2024/
 *
 * The DREES Opendatasoft API is queried with filters:
 *   - niveaugeo = "Département" (department-level data only)
 *   - genre = "Ensemble" (all genders)
 *   - age = "Ensemble" (all age groups)
 *   - mode_exercice = "Ensemble" (all practice modes)
 *
 * Ingests into DensiteMedicale for 6 main specialties.
 * Population-based density (pour10k) requires joining with StatLocale POP_TOTAL;
 * it is computed here when available, left null otherwise.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const DREES_API_BASE =
  "https://data.drees.solidarites-sante.gouv.fr/api/explore/v2.1/catalog/datasets/la-demographie-des-professionnels-de-sante-depuis-2012/records";

// Map DREES profession labels → our specialite codes
const SPECIALITE_MAP: Record<string, string> = {
  "Médecin généraliste":          "MG",
  "Médecins généralistes":        "MG",
  "Médecin spécialiste":          "SPEC",
  "Médecins spécialistes":        "SPEC",
  "Infirmier":                    "INFIRMIER",
  "Infirmiers":                   "INFIRMIER",
  "Chirurgien-dentiste":          "DENTISTE",
  "Chirurgiens-dentistes":        "DENTISTE",
  "Pharmacien":                   "PHARMACIEN",
  "Pharmaciens":                  "PHARMACIEN",
  "Masseur-kinésithérapeute":     "KINESITHERAPEUTE",
  "Masseurs-kinésithérapeutes":   "KINESITHERAPEUTE",
};

interface DreesRecord {
  annee?: string | number;
  niveaugeo?: string;
  codgeo?: string;
  libgeo?: string;
  profession?: string;
  genre?: string;
  age?: string;
  mode_exercice?: string;
  nb_actifs?: string | number | null;
}

interface DreesApiResponse {
  total_count: number;
  results: DreesRecord[];
}

async function fetchDreesPage(offset: number, limit = 100): Promise<DreesApiResponse> {
  const params = new URLSearchParams({
    where: `niveaugeo="Département" AND genre="Ensemble" AND age="Ensemble" AND mode_exercice="Ensemble"`,
    select: "annee,niveaugeo,codgeo,libgeo,profession,genre,age,mode_exercice,nb_actifs",
    limit: String(limit),
    offset: String(offset),
  });

  const url = `${DREES_API_BASE}?${params}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    throw new Error(`DREES API error: ${res.status} ${res.statusText}\nURL: ${url}`);
  }
  return res.json() as Promise<DreesApiResponse>;
}

export async function ingestMedecins() {
  await logIngestion("medecins", async () => {
    console.log("  [DREES] Fetching medical professional demographics by département...");

    // Collect all valid dept codes from our DB for FK validation
    const depts = await prisma.departement.findMany({ select: { code: true } });
    const validDepts = new Set(depts.map((d) => d.code));

    // Build a population lookup from StatLocale (POP_TOTAL per dept) for density calc
    const popRows = await prisma.statLocale.findMany({
      where: { indicateur: "POP_TOTAL", geoType: "DEP" },
      select: { geoCode: true, annee: true, valeur: true },
    });
    const popMap = new Map<string, number>(); // key: `${geoCode}:${annee}`
    for (const p of popRows) {
      popMap.set(`${p.geoCode}:${p.annee}`, p.valeur);
    }

    let offset = 0;
    const limit = 100;
    let totalRecords = 0;
    let upserted = 0;
    let skipped = 0;

    // First call to get total_count
    const firstPage = await fetchDreesPage(0, limit);
    totalRecords = firstPage.total_count;
    console.log(`  [DREES] Total records to fetch: ${totalRecords}`);

    const processRecords = async (records: DreesRecord[]) => {
      const ups: Promise<unknown>[] = [];
      for (const r of records) {
        const annee = typeof r.annee === "string" ? parseInt(r.annee, 10) : (r.annee ?? 0);
        const profession = r.profession?.trim() ?? "";
        const specialite = SPECIALITE_MAP[profession];
        if (!specialite || !annee) { skipped++; continue; }

        // Normalize dept code (DREES uses "01", "2A", "75", etc.)
        const rawCode = r.codgeo?.trim() ?? "";
        const deptCode = rawCode.padStart(2, "0");
        if (!validDepts.has(deptCode)) { skipped++; continue; }

        const nombreMedecins = typeof r.nb_actifs === "string"
          ? parseInt(r.nb_actifs, 10)
          : (r.nb_actifs as number | null | undefined) ?? null;
        if (nombreMedecins === null || isNaN(nombreMedecins)) { skipped++; continue; }

        // Try to compute density per 10K using StatLocale population
        let pour10k: number | null = null;
        const pop = popMap.get(`${deptCode}:${annee}`) ?? popMap.get(`${deptCode}:${annee - 1}`);
        if (pop && pop > 0) {
          pour10k = (nombreMedecins / pop) * 10_000;
        }

        ups.push(
          prisma.densiteMedicale.upsert({
            where: { departementCode_specialite_annee: { departementCode: deptCode, specialite, annee } },
            create: { departementCode: deptCode, specialite, annee, nombreMedecins, pour10k, population: pop ?? null },
            update: { nombreMedecins, pour10k, population: pop ?? null },
          })
        );
      }
      await Promise.all(ups);
      upserted += ups.length;
    };

    await processRecords(firstPage.results);
    offset += limit;

    while (offset < totalRecords) {
      const page = await fetchDreesPage(offset, limit);
      await processRecords(page.results);
      offset += limit;
      // Polite delay
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`  [DREES] ${totalRecords} records fetched → ${upserted} upserted, ${skipped} skipped`);
    return { rowsIngested: upserted, rowsTotal: totalRecords };
  });
}

// Allow running directly
if (require.main === module) {
  ingestMedecins().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
