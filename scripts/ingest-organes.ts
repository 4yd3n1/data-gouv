/**
 * Ingest AN organes (institutional bodies: political groups, committees, etc.)
 * Source: 7,137 JSON files at documentation/hatvp-old-context/an-data/json/organe/
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const ORGANE_DIR = path.resolve(__dirname, "../documentation/hatvp-old-context/an-data/json/organe");

function parseDateSafe(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseIntSafe(s?: string | null): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

export async function ingestOrganes() {
  await logIngestion("organes", async () => {
    const files = fs.readdirSync(ORGANE_DIR).filter((f) => f.endsWith(".json"));
    console.log(`  Found ${files.length} organe JSON files`);

    let count = 0;

    for (const file of files) {
      const raw = fs.readFileSync(path.join(ORGANE_DIR, file), "utf-8");
      const json = JSON.parse(raw);
      const o = json.organe;
      if (!o?.uid) continue;

      await prisma.organe.upsert({
        where: { id: o.uid },
        update: {
          codeType: o.codeType ?? "UNKNOWN",
          libelle: o.libelle ?? o.uid,
          libelleAbrege: o.libelleAbrege ?? null,
          libelleAbrev: o.libelleAbrev ?? null,
          dateDebut: parseDateSafe(o.viMoDe?.dateDebut),
          dateFin: parseDateSafe(o.viMoDe?.dateFin),
          legislature: parseIntSafe(o.legislature),
          couleur: o.couleurAssociee ?? null,
        },
        create: {
          id: o.uid,
          codeType: o.codeType ?? "UNKNOWN",
          libelle: o.libelle ?? o.uid,
          libelleAbrege: o.libelleAbrege ?? null,
          libelleAbrev: o.libelleAbrev ?? null,
          dateDebut: parseDateSafe(o.viMoDe?.dateDebut),
          dateFin: parseDateSafe(o.viMoDe?.dateFin),
          legislature: parseIntSafe(o.legislature),
          couleur: o.couleurAssociee ?? null,
        },
      });
      count++;

      if (count % 1000 === 0) {
        console.log(`  ${count} organes processed...`);
      }
    }

    console.log(`  ${count} organes upserted`);
    return { rowsIngested: count, rowsTotal: files.length };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestOrganes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
