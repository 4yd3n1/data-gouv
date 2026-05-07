/**
 * Seed: AffiliationParti — political trajectory of ministers across Macron governments.
 * Idempotent upsert on (personnaliteId, partiCode, dateDebut).
 * Run: npx tsx scripts/seed-affiliations-parti.ts
 */

import { prisma } from "@/lib/db";
import { logIngestion } from "./lib/ingestion-log";
import { AFFILIATIONS_MACRONISTES_FONDATEURS } from "./data/affiliations/macronistes-fondateurs";
import { AFFILIATIONS_EX_DROITE_RALLIES } from "./data/affiliations/ex-droite-rallies";
import { AFFILIATIONS_EX_GAUCHE_RALLIES } from "./data/affiliations/ex-gauche-rallies";
import { AFFILIATIONS_CENTRE_MODEM } from "./data/affiliations/centre-modem";
import { AFFILIATIONS_SOCIETE_CIVILE } from "./data/affiliations/societe-civile";
import { AFFILIATIONS_DIVERS } from "./data/affiliations/divers";
import type { AffiliationPartiSeed } from "./data/affiliations/types";

const ALL_AFFILIATIONS: AffiliationPartiSeed[] = [
  ...AFFILIATIONS_MACRONISTES_FONDATEURS,
  ...AFFILIATIONS_EX_DROITE_RALLIES,
  ...AFFILIATIONS_EX_GAUCHE_RALLIES,
  ...AFFILIATIONS_CENTRE_MODEM,
  ...AFFILIATIONS_SOCIETE_CIVILE,
  ...AFFILIATIONS_DIVERS,
];

async function run() {
  await logIngestion("affiliations-parti", async () => {
    let created = 0;
    let updated = 0;
    const skippedSlugs: string[] = [];

    // Deduplicate by (slug, partiCode, dateDebut) to avoid duplicate upsert keys
    const seen = new Set<string>();
    const deduped: AffiliationPartiSeed[] = [];
    for (const row of ALL_AFFILIATIONS) {
      const key = `${row.slug}::${row.partiCode}::${row.dateDebut}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      }
    }

    // Process in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < deduped.length; i += CHUNK_SIZE) {
      const chunk = deduped.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (row) => {
          const personnalite = await prisma.personnalitePublique.findUnique({
            where: { slug: row.slug },
            select: { id: true },
          });

          if (!personnalite) {
            if (!skippedSlugs.includes(row.slug)) {
              console.warn(`[SKIP] slug not found: ${row.slug}`);
              skippedSlugs.push(row.slug);
            }
            return;
          }

          const dateDebut = new Date(row.dateDebut);
          const dateFin = row.dateFin ? new Date(row.dateFin) : null;
          const sourceDate = row.sourceDate ? new Date(row.sourceDate) : null;

          const existing = await prisma.affiliationParti.findFirst({
            where: {
              personnaliteId: personnalite.id,
              partiCode: row.partiCode,
              dateDebut,
            },
            select: { id: true },
          });

          if (existing) {
            await prisma.affiliationParti.update({
              where: { id: existing.id },
              data: {
                parti: row.parti,
                famille: row.famille,
                dateFin,
                modalite: row.modalite,
                source: row.source,
                sourceUrl: row.sourceUrl ?? null,
                sourceDate,
                notes: row.notes ?? null,
                verifie: row.verifie ?? false,
              },
            });
            updated++;
          } else {
            await prisma.affiliationParti.create({
              data: {
                personnaliteId: personnalite.id,
                parti: row.parti,
                partiCode: row.partiCode,
                famille: row.famille,
                dateDebut,
                dateFin,
                modalite: row.modalite,
                source: row.source,
                sourceUrl: row.sourceUrl ?? null,
                sourceDate,
                notes: row.notes ?? null,
                verifie: row.verifie ?? false,
              },
            });
            created++;
          }
        })
      );
    }

    console.log(`\n--- Affiliations seed summary ---`);
    console.log(`  Total seed rows:   ${deduped.length}`);
    console.log(`  Created:           ${created}`);
    console.log(`  Updated:           ${updated}`);
    console.log(`  Skipped slugs:     ${skippedSlugs.length}`);
    if (skippedSlugs.length > 0) {
      console.log(`  Skipped list:      ${skippedSlugs.join(", ")}`);
    }

    return {
      rowsIngested: created + updated,
      rowsTotal: deduped.length,
      metadata: {
        created,
        updated,
        skipped: skippedSlugs.length,
        skippedSlugs,
        clusters: {
          macronistes_fondateurs: AFFILIATIONS_MACRONISTES_FONDATEURS.length,
          ex_droite_rallies: AFFILIATIONS_EX_DROITE_RALLIES.length,
          ex_gauche_rallies: AFFILIATIONS_EX_GAUCHE_RALLIES.length,
          centre_modem: AFFILIATIONS_CENTRE_MODEM.length,
          societe_civile: AFFILIATIONS_SOCIETE_CIVILE.length,
          divers: AFFILIATIONS_DIVERS.length,
        },
      },
    };
  });
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
