/**
 * Ingest INSEE local stats via the Mélodi API — StatLocale.
 *
 * Ingests FILOSOFI (income/poverty) and Recensement (population/employment)
 * for all 101 French départements.
 *
 * No API key required — Mélodi "libre" plan is fully anonymous.
 *
 * Sources:
 *   DS_FILOSOFI_CC         → FILOSOFI 2021 (median income, poverty, D1/D9)
 *   DS_RP_POPULATION_PRINC → Recensement 2022 (population by age)
 *   DS_RP_EMPLOI_LR_PRINC  → Recensement 2022 (employment rates)
 *
 * Rate limit: 30 req/min → ~10 min for 101 depts × 3 datasets
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";
import {
  fetchFilosofiDep,
  fetchPopulationDep,
  fetchEmploiDep,
  fetchLogementDep,
  fetchEducationDep,
  type InseeLocalValue,
} from "./lib/insee-client";

async function upsertStatLocale(values: InseeLocalValue[]): Promise<number> {
  let count = 0;
  for (const v of values) {
    await prisma.statLocale.upsert({
      where: {
        source_indicateur_annee_geoType_geoCode: {
          source: v.source,
          indicateur: v.indicateur,
          annee: v.annee,
          geoType: v.geoType,
          geoCode: v.geoCode,
        },
      },
      update: { valeur: v.valeur, unite: v.unite },
      create: {
        source: v.source,
        indicateur: v.indicateur,
        annee: v.annee,
        geoType: v.geoType,
        geoCode: v.geoCode,
        valeur: v.valeur,
        unite: v.unite,
      },
    });
    count++;
  }
  return count;
}

export async function ingestInseeLocal() {
  await logIngestion("insee-local", async () => {
    const depts = await prisma.departement.findMany({
      select: { code: true, libelle: true },
      orderBy: { code: "asc" },
    });

    console.log(`  [INSEE Local] Processing ${depts.length} départements...`);
    let totalRows = 0;
    let processed = 0;

    for (const dept of depts) {
      const code = dept.code;
      const label = dept.libelle;
      processed++;

      // Fetch all 5 datasets for this département (rate-limited internally)
      const [filosofiValues, popValues, emploiValues, logementValues, educValues] = await Promise.all([
        fetchFilosofiDep(code),
        fetchPopulationDep(code),
        fetchEmploiDep(code),
        fetchLogementDep(code),
        fetchEducationDep(code),
      ]);

      const allValues = [...filosofiValues, ...popValues, ...emploiValues, ...logementValues, ...educValues];
      const upserted = await upsertStatLocale(allValues);
      totalRows += upserted;

      if (processed % 10 === 0 || processed === depts.length) {
        console.log(
          `  [INSEE Local] ${processed}/${depts.length} — ${label} (${code}) → ${allValues.length} stats`
        );
      }
    }

    console.log(`  [INSEE Local] Total: ${totalRows} StatLocale rows upserted`);

    return {
      rowsIngested: totalRows,
      metadata: {
        deptsProcessed: depts.length,
        filosofiDataset: "DS_FILOSOFI_CC",
        populationDataset: "DS_RP_POPULATION_PRINC",
        emploiDataset: "DS_RP_EMPLOI_LR_PRINC",
        logementDataset: "DS_RP_LOGEMENT_PRINC",
        educationDataset: "DS_RP_DIPLOMES_PRINC",
      },
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestInseeLocal()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
