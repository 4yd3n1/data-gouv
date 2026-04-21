/**
 * One-shot backfill for nomNormalise + prenomNormalise on existing rows.
 *
 * Ingestion scripts populate these columns on future writes. This script
 * covers pre-existing data. Safe to re-run (idempotent — always overwrites
 * with the same deterministic value).
 *
 * Run: pnpm tsx scripts/backfill-normalized-names.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { normalizeName } from "../src/lib/normalize-name";

const BATCH_SIZE = 1000;

async function backfillModel<
  T extends { id: string; nom: string; prenom: string },
>(label: string, findMany: () => Promise<T[]>, updateOne: (id: string, data: { nomNormalise: string; prenomNormalise: string }) => Promise<unknown>) {
  const rows = await findMany();
  console.log(`  ${label}: ${rows.length} rows`);
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((r) =>
        updateOne(r.id, {
          nomNormalise: normalizeName(r.nom),
          prenomNormalise: normalizeName(r.prenom),
        })
      )
    );
    done += batch.length;
    if (done % 5000 === 0 || done === rows.length) {
      console.log(`    ${done}/${rows.length}`);
    }
  }
}

async function main() {
  console.log("Backfilling normalized name columns...");

  await backfillModel(
    "PersonnalitePublique",
    () => prisma.personnalitePublique.findMany({ select: { id: true, nom: true, prenom: true } }),
    (id, data) => prisma.personnalitePublique.update({ where: { id }, data })
  );

  await backfillModel(
    "DeclarationInteret",
    () => prisma.declarationInteret.findMany({ select: { id: true, nom: true, prenom: true } }),
    (id, data) => prisma.declarationInteret.update({ where: { id }, data })
  );

  await backfillModel(
    "Depute",
    () => prisma.depute.findMany({ select: { id: true, nom: true, prenom: true } }),
    (id, data) => prisma.depute.update({ where: { id }, data })
  );

  await backfillModel(
    "Senateur",
    () => prisma.senateur.findMany({ select: { id: true, nom: true, prenom: true } }),
    (id, data) => prisma.senateur.update({ where: { id }, data })
  );

  await prisma.$disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
