/**
 * Ingest déport (conflict-of-interest recusal) declarations from AN open data.
 * Source: 33 JSON files at documentation/hatvp-old-context/an-data/json/deport/
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const DEPORT_DIR = path.resolve(__dirname, "../documentation/hatvp-old-context/an-data/json/deport");

function parseDateSafe(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function safeInt(s?: string | null): number {
  if (!s) return 0;
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

export async function ingestDeports() {
  await logIngestion("deports", async () => {
    const files = fs.readdirSync(DEPORT_DIR).filter((f) => f.endsWith(".json"));
    console.log(`  Found ${files.length} deport JSON files`);

    // Pre-load valid deputy IDs
    const allDeputes = await prisma.depute.findMany({ select: { id: true } });
    const validDeputeIds = new Set(allDeputes.map((d) => d.id));

    let count = 0;
    let skipped = 0;

    for (const file of files) {
      const raw = fs.readFileSync(path.join(DEPORT_DIR, file), "utf-8");
      const json = JSON.parse(raw);
      const d = json.deport;
      if (!d?.uid) continue;

      const deputeId = d.refActeur;
      if (!deputeId || !validDeputeIds.has(deputeId)) {
        skipped++;
        continue;
      }

      await prisma.deport.upsert({
        where: { id: d.uid },
        update: {
          legislature: safeInt(d.legislature),
          deputeId,
          dateCreation: parseDateSafe(d.dateCreation),
          datePublication: parseDateSafe(d.datePublication),
          porteeCode: d.portee?.code ?? null,
          porteeLibelle: d.portee?.libelle ?? null,
          instanceCode: d.instance?.code ?? null,
          instanceLibelle: d.instance?.libelle ?? null,
          cibleType: d.cible?.type?.code ?? null,
          cibleTexte: d.cible?.referenceTextuelle ?? null,
          explication: d.explication ?? null,
        },
        create: {
          id: d.uid,
          legislature: safeInt(d.legislature),
          deputeId,
          dateCreation: parseDateSafe(d.dateCreation),
          datePublication: parseDateSafe(d.datePublication),
          porteeCode: d.portee?.code ?? null,
          porteeLibelle: d.portee?.libelle ?? null,
          instanceCode: d.instance?.code ?? null,
          instanceLibelle: d.instance?.libelle ?? null,
          cibleType: d.cible?.type?.code ?? null,
          cibleTexte: d.cible?.referenceTextuelle ?? null,
          explication: d.explication ?? null,
        },
      });
      count++;
    }

    console.log(`  ${count} deports upserted, ${skipped} skipped (deputy not in DB)`);
    return { rowsIngested: count, rowsTotal: files.length, metadata: { skipped } };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDeports()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
