/**
 * update-research-output-labels.ts — re-apply accented labels to EntreeCarriere
 * and EvenementJudiciaire rows that were ingested by ingest-research-output.ts.
 *
 * The ingest script uses `create` (not upsert) and skips entries with
 * `_ingested: true`, so simply re-running the ingest after fixing accents in
 * JSON files is a no-op. This script matches existing DB rows by a set of
 * stable keys and updates the text fields in place.
 *
 * Match keys:
 *   EntreeCarriere:     personnaliteId + sourceUrl + dateDebut (nullable)
 *   EvenementJudiciaire: personnaliteId + sourceUrl + date
 *
 * Run: npx tsx scripts/update-research-output-labels.ts
 */

import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/db";

const RESEARCH_DIR = path.join(__dirname, "..", "data", "research-output");

interface CareerEntry {
  dateDebut: string;
  dateFin: string | null;
  categorie: string;
  titre: string;
  organisation?: string;
  description?: string;
  sourceUrl: string;
  sourcePrincipale?: string;
  sourceDate?: string;
  _ingested?: boolean;
}

interface JudicialEvent {
  date: string;
  type: string;
  nature: string;
  juridiction?: string;
  statut?: string;
  resume: string;
  sourcePrincipale?: string;
  sourceUrl: string;
  sourceDate?: string;
  _ingested?: boolean;
}

interface ResearchOutput {
  slug: string;
  career_entries?: CareerEntry[];
  judicial_events?: JudicialEvent[];
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  if (/^\d{4}$/.test(s)) return new Date(`${s}-01-01T00:00:00Z`);
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(`${s}-01T00:00:00Z`);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function main() {
  console.log("Updating EntreeCarriere + EvenementJudiciaire labels from research-output JSONs...\n");

  const files = fs
    .readdirSync(RESEARCH_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  let careerUpdated = 0;
  let careerSkipped = 0;
  let judicialUpdated = 0;
  let judicialSkipped = 0;

  for (const file of files) {
    const filePath = path.join(RESEARCH_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const output: ResearchOutput = JSON.parse(raw);

    const p = await prisma.personnalitePublique.findUnique({
      where: { slug: output.slug },
      select: { id: true },
    });
    if (!p) continue;

    for (const entry of output.career_entries ?? []) {
      if (!entry._ingested) continue;
      const dateDebut = parseDate(entry.dateDebut);
      const row = await prisma.entreeCarriere.findFirst({
        where: {
          personnaliteId: p.id,
          sourceUrl: entry.sourceUrl,
          ...(dateDebut ? { dateDebut } : {}),
        },
        select: { id: true, titre: true },
      });
      if (!row) {
        careerSkipped++;
        continue;
      }
      await prisma.entreeCarriere.update({
        where: { id: row.id },
        data: {
          titre: entry.titre,
          organisation: entry.organisation ?? null,
          description: entry.description ?? null,
        },
      });
      careerUpdated++;
    }

    for (const ev of output.judicial_events ?? []) {
      if (!ev._ingested) continue;
      const date = parseDate(ev.date);
      if (!date) {
        judicialSkipped++;
        continue;
      }
      const row = await prisma.evenementJudiciaire.findFirst({
        where: {
          personnaliteId: p.id,
          sourceUrl: ev.sourceUrl,
          date,
        },
        select: { id: true, nature: true },
      });
      if (!row) {
        judicialSkipped++;
        continue;
      }
      await prisma.evenementJudiciaire.update({
        where: { id: row.id },
        data: {
          nature: ev.nature,
          juridiction: ev.juridiction ?? null,
          ...(ev.statut ? { statut: ev.statut as "EN_COURS" | "CLOS" | "APPEL_EN_COURS" } : {}),
          resume: ev.resume,
        },
      });
      judicialUpdated++;
    }
  }

  console.log(`\nEntreeCarriere:       ${careerUpdated} updated · ${careerSkipped} skipped (not found)`);
  console.log(`EvenementJudiciaire:  ${judicialUpdated} updated · ${judicialSkipped} skipped (not found)`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
