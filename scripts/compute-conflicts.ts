/**
 * Compute ConflictSignal records by cross-referencing:
 *   DeclarationInteret (HATVP financial participations)
 *   × ScrutinTag (parliamentary vote topics)
 *   × VoteRecord (individual deputy votes)
 *
 * For each deputy/senator with declared financial interests, this script:
 * 1. Groups their ParticipationFinanciere by company name
 * 2. Maps each company to ScrutinTag tags via keyword matching
 * 3. Counts how many times they voted on scrutins tagged with those topics
 * 4. Upserts one ConflictSignal per (person × company × tag) combination
 *
 * Run after tagScrutins (Wave 5c) — requires ScrutinTag to be populated.
 * Idempotent: uses upsert on unique constraint.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { matchSectorToTags } from "./lib/sector-tag-map";

export async function computeConflicts(): Promise<void> {
  const start = Date.now();
  console.log("  Computing conflict signals...");

  // Load all declarations with participations in one query
  const declarations = await prisma.declarationInteret.findMany({
    where: { totalParticipations: { gt: 0 } },
    include: { participations: true },
  });

  // Build nom+prenom → deputeId map for active deputies
  const deputes = await prisma.depute.findMany({
    select: { id: true, nom: true, prenom: true },
  });
  const deputeMap = new Map<string, string>();
  for (const d of deputes) {
    deputeMap.set(`${d.nom.toUpperCase()}|${d.prenom.toUpperCase()}`, d.id);
  }

  let upsertCount = 0;

  for (const decl of declarations) {
    const deputeId =
      decl.typeMandat === "Député"
        ? (deputeMap.get(`${decl.nom.toUpperCase()}|${decl.prenom.toUpperCase()}`) ?? null)
        : null;

    // Group participations by company name
    const companySums = new Map<string, { count: number; total: number }>();
    for (const p of decl.participations) {
      if (!p.nomSociete?.trim()) continue;
      const key = p.nomSociete.trim();
      const existing = companySums.get(key) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += p.evaluation ?? 0;
      companySums.set(key, existing);
    }

    if (companySums.size === 0) continue;

    // Aggregate per tag: which companies map to which tags, and with what totals
    const tagSignals = new Map<
      string,
      { primarySecteur: string; participationCount: number; totalMontant: number }
    >();
    for (const [company, sums] of companySums) {
      const tags = matchSectorToTags(company);
      for (const tag of tags) {
        const existing = tagSignals.get(tag);
        if (existing) {
          // Accumulate across companies that share the same tag
          existing.participationCount += sums.count;
          existing.totalMontant += sums.total;
        } else {
          tagSignals.set(tag, {
            primarySecteur: company,
            participationCount: sums.count,
            totalMontant: sums.total,
          });
        }
      }
    }

    if (tagSignals.size === 0) continue;

    // Look up vote counts per tag (only for deputies with a matched ID)
    for (const [tag, signal] of tagSignals) {
      let voteCount = 0;
      let votePour = 0;
      let voteContre = 0;
      let voteAbstention = 0;
      let lastScrutinDate: Date | null = null;

      if (deputeId) {
        const votes = await prisma.voteRecord.findMany({
          where: {
            deputeId,
            scrutin: { tags: { some: { tag } } },
          },
          select: {
            position: true,
            scrutin: { select: { dateScrutin: true } },
          },
        });
        voteCount = votes.length;
        votePour = votes.filter((v) => v.position === "pour").length;
        voteContre = votes.filter((v) => v.position === "contre").length;
        voteAbstention = votes.filter((v) => v.position === "abstention").length;
        if (votes.length > 0) {
          lastScrutinDate = votes.reduce(
            (max, v) => (v.scrutin.dateScrutin > max ? v.scrutin.dateScrutin : max),
            votes[0].scrutin.dateScrutin
          );
        }
      }

      await prisma.conflictSignal.upsert({
        where: {
          nom_prenom_typeMandat_secteurDeclaration_tag: {
            nom: decl.nom,
            prenom: decl.prenom,
            typeMandat: decl.typeMandat,
            secteurDeclaration: signal.primarySecteur,
            tag,
          },
        },
        update: {
          deputeId,
          participationCount: signal.participationCount,
          totalMontant: signal.totalMontant,
          voteCount,
          votePour,
          voteContre,
          voteAbstention,
          lastScrutinDate,
          computedAt: new Date(),
        },
        create: {
          nom: decl.nom,
          prenom: decl.prenom,
          typeMandat: decl.typeMandat,
          deputeId,
          secteurDeclaration: signal.primarySecteur,
          participationCount: signal.participationCount,
          totalMontant: signal.totalMontant,
          tag,
          voteCount,
          votePour,
          voteContre,
          voteAbstention,
          lastScrutinDate,
        },
      });
      upsertCount++;
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`  ✓ ${upsertCount} conflict signals computed in ${duration}s`);
}

// Standalone entrypoint
if (require.main === module) {
  computeConflicts()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
