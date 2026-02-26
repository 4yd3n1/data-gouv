/**
 * Ingest museum attendance from Ministère de la Culture.
 * Source: Tabular API resource 7708e380-e7f8-4b56-936a-5d2a262d852d (12,292 rows)
 * Splits into Musee (identity) + FrequentationMusee (yearly attendance).
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchAllPages } from "./lib/api-client";
import { parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";
import { departementCodeFromCommune } from "./lib/departement-lookup";

const RESOURCE_ID = "7708e380-e7f8-4b56-936a-5d2a262d852d";

export async function ingestMusees() {
  await logIngestion("musees", async () => {
    console.log("  Fetching museum attendance data...");

    // Track unique museums for upsert
    const seenMuseums = new Set<string>();
    let rowCount = 0;
    let museeCount = 0;
    let freqCount = 0;

    for await (const batch of fetchAllPages(RESOURCE_ID)) {
      for (const row of batch) {
        rowCount++;
        const museeId = String(row.IDMuseofile ?? "").trim();
        if (!museeId) continue;

        const communeCode = row.codeInseeCommune ? String(row.codeInseeCommune).trim() : null;
        const deptCode = communeCode ? departementCodeFromCommune(communeCode) : null;

        // Upsert museum identity (once per unique ID)
        if (!seenMuseums.has(museeId)) {
          seenMuseums.add(museeId);

          // Verify commune FK exists
          let validCommune = false;
          if (communeCode) {
            const commune = await prisma.commune.findUnique({
              where: { code: communeCode },
              select: { code: true },
            });
            validCommune = !!commune;
          }

          // Verify departement FK exists
          let validDept = false;
          if (deptCode) {
            const dept = await prisma.departement.findUnique({
              where: { code: deptCode },
              select: { code: true },
            });
            validDept = !!dept;
          }

          await prisma.musee.upsert({
            where: { id: museeId },
            update: {
              nom: String(row.nom_du_musee ?? ""),
              ville: row.ville ? String(row.ville) : null,
              communeCode: validCommune ? communeCode : null,
              departementCode: validDept ? deptCode : null,
              region: row.region ? String(row.region) : null,
              idPatrimostat: row.IDPatrimostat ? String(row.IDPatrimostat) : null,
              dateAppellation: row.dateappellation ? String(row.dateappellation) : null,
              ferme: row.ferme ? String(row.ferme) : null,
              anneeFermeture: parseIntSafe(row.anneefermeture),
            },
            create: {
              id: museeId,
              nom: String(row.nom_du_musee ?? ""),
              ville: row.ville ? String(row.ville) : null,
              communeCode: validCommune ? communeCode : null,
              departementCode: validDept ? deptCode : null,
              region: row.region ? String(row.region) : null,
              idPatrimostat: row.IDPatrimostat ? String(row.IDPatrimostat) : null,
              dateAppellation: row.dateappellation ? String(row.dateappellation) : null,
              ferme: row.ferme ? String(row.ferme) : null,
              anneeFermeture: parseIntSafe(row.anneefermeture),
            },
          });
          museeCount++;
        }

        // Upsert attendance for this year
        const annee = parseIntSafe(row.annee);
        if (annee === null) continue;

        await prisma.frequentationMusee.upsert({
          where: {
            museeId_annee: { museeId, annee },
          },
          update: {
            payant: parseIntSafe(row.payant),
            gratuit: parseIntSafe(row.gratuit),
            total: parseIntSafe(row.total),
            individuel: parseIntSafe(row.individuel),
            scolaires: parseIntSafe(row.scolaires),
            groupesHorsScolaires: parseIntSafe(row.groupes_hors_scolaires),
            moins18AnsHorsScolaires: parseIntSafe(row.moins_18_ans_hors_scolaires),
            de18a25Ans: parseIntSafe(row._18_25_ans),
          },
          create: {
            museeId,
            annee,
            payant: parseIntSafe(row.payant),
            gratuit: parseIntSafe(row.gratuit),
            total: parseIntSafe(row.total),
            individuel: parseIntSafe(row.individuel),
            scolaires: parseIntSafe(row.scolaires),
            groupesHorsScolaires: parseIntSafe(row.groupes_hors_scolaires),
            moins18AnsHorsScolaires: parseIntSafe(row.moins_18_ans_hors_scolaires),
            de18a25Ans: parseIntSafe(row._18_25_ans),
          },
        });
        freqCount++;
      }

      if (rowCount % 2000 === 0) {
        console.log(`  ${rowCount} rows processed (${museeCount} museums, ${freqCount} attendance records)...`);
      }
    }

    console.log(`  Done: ${museeCount} museums, ${freqCount} attendance records`);
    return {
      rowsIngested: museeCount + freqCount,
      rowsTotal: rowCount,
      metadata: { museums: museeCount, attendance: freqCount },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestMusees()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
