/**
 * Phase 3: Vote Contradiction Analysis
 *
 * For each deputy-minister in Lecornu II, cross-references their parliamentary
 * voting record with their current ministerial portfolio to find contradictions.
 *
 * Output: JSON with contradiction data per minister for integration into
 * research-output files and profile UI.
 */

import "dotenv/config";
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/db";

// ministereCode → relevant ScrutinTag values
const MINISTERECODE_TO_TAGS: Record<string, string[]> = {
  ECONOMIE_FINANCES: ["budget", "fiscalite"],
  SANTE_FAMILLE: ["sante"],
  TRANSITION_ECOLOGIQUE: ["ecologie"],
  EDUCATION_NATIONALE: ["education"],
  JUSTICE: ["securite"],
  TRAVAIL_SOLIDARITES: ["travail", "retraites"],
  AGRICULTURE: ["agriculture"],
  ARMEES: ["defense"],
  CULTURE: ["culture"],
  VILLE_LOGEMENT: ["logement"],
  TRANSPORTS: ["ecologie"],
  INTERIEUR: ["securite", "immigration"],
  SPORTS_JEUNESSE: ["education"],
  AFFAIRES_ETRANGERES: ["defense"],
  INDUSTRIE_NUMERIQUE: ["budget"],
  AMENAGEMENT_TERRITOIRE: ["logement"],
  OUTREMER: ["budget"],
  MATIGNON: ["budget", "fiscalite"],
  ENSEIGNEMENT_SUPERIEUR: ["education"],
  PME_COMMERCE: ["travail", "fiscalite"],
};

// Deputy-ministers with their deputeNom/deputePrenom for lookup
const DEPUTY_MINISTERS = [
  { slug: "roland-lescure", deputePrenom: "Roland", deputeNom: "Lescure", ministereCode: "ECONOMIE_FINANCES" },
  { slug: "annie-genevard", deputePrenom: "Annie", deputeNom: "Genevard", ministereCode: "AGRICULTURE" },
  { slug: "jean-noel-barrot", deputePrenom: "Jean-Noël", deputeNom: "Barrot", ministereCode: "AFFAIRES_ETRANGERES" },
  { slug: "stephanie-rist", deputePrenom: "Stéphanie", deputeNom: "Rist", ministereCode: "SANTE_FAMILLE" },
  { slug: "naima-moutchou", deputePrenom: "Naïma", deputeNom: "Moutchou", ministereCode: "OUTREMER" },
  { slug: "david-amiel", deputePrenom: "David", deputeNom: "Amiel", ministereCode: "ECONOMIE_FINANCES" },
  { slug: "marina-ferrari", deputePrenom: "Marina", deputeNom: "Ferrari", ministereCode: "SPORTS_JEUNESSE" },
  { slug: "laurent-panifous", deputePrenom: "Laurent", deputeNom: "Panifous", ministereCode: "MATIGNON" },
  { slug: "maud-bregeon", deputePrenom: "Maud", deputeNom: "Bregeon", ministereCode: "TRANSITION_ECOLOGIQUE" },
  { slug: "aurore-berge", deputePrenom: "Aurore", deputeNom: "Bergé", ministereCode: "EGALITE_FEMMES_HOMMES" },
  { slug: "mathieu-lefevre", deputePrenom: "Mathieu", deputeNom: "Lefèvre", ministereCode: "TRANSITION_ECOLOGIQUE" },
  { slug: "anne-le-henanff", deputePrenom: "Anne", deputeNom: "Le Hénanff", ministereCode: "INDUSTRIE_NUMERIQUE" },
  { slug: "benjamin-haddad", deputePrenom: "Benjamin", deputeNom: "Haddad", ministereCode: "AFFAIRES_ETRANGERES" },
  { slug: "nicolas-forissier", deputePrenom: "Nicolas", deputeNom: "Forissier", ministereCode: "ECONOMIE_FINANCES" },
  { slug: "eleonore-caroit", deputePrenom: "Éléonore", deputeNom: "Caroit", ministereCode: "AFFAIRES_ETRANGERES" },
  { slug: "camille-galliard-minier", deputePrenom: "Camille", deputeNom: "Galliard-Minier", ministereCode: "SANTE_FAMILLE" },
  { slug: "sabrina-agresti-roubache", deputePrenom: "Sabrina", deputeNom: "Agresti-Roubache", ministereCode: "EDUCATION_NATIONALE" },
];

interface VoteContradiction {
  slug: string;
  ministerName: string;
  ministereCode: string;
  relevantTags: string[];
  deputeId: string;
  totalVotesOnPortfolio: number;
  contreVotes: number;
  abstentionVotes: number;
  contreRate: number;
  examples: Array<{
    scrutinId: string;
    scrutinNumero: number;
    titre: string;
    dateScrutin: string;
    position: string;
    tags: string[];
    sortCode: string;
  }>;
}

async function analyzeMinister(minister: typeof DEPUTY_MINISTERS[0]): Promise<VoteContradiction | null> {
  // Find the deputy by name
  const depute = await prisma.depute.findFirst({
    where: {
      nom: { contains: minister.deputeNom, mode: "insensitive" },
      prenom: { contains: minister.deputePrenom, mode: "insensitive" },
    },
    select: { id: true, nom: true, prenom: true },
  });

  if (!depute) {
    console.log(`  [SKIP] Deputy not found: ${minister.deputePrenom} ${minister.deputeNom}`);
    return null;
  }

  const relevantTags = MINISTERECODE_TO_TAGS[minister.ministereCode] ?? [];
  if (relevantTags.length === 0) {
    console.log(`  [SKIP] No tag mapping for ${minister.ministereCode}`);
    return null;
  }

  // Find all scrutins tagged with relevant topics
  const taggedScrutinIds = await prisma.scrutinTag.findMany({
    where: { tag: { in: relevantTags } },
    select: { scrutinId: true, tag: true },
  });

  const scrutinIdSet = new Set(taggedScrutinIds.map((t) => t.scrutinId));
  const scrutinTagMap = new Map<string, string[]>();
  for (const t of taggedScrutinIds) {
    const existing = scrutinTagMap.get(t.scrutinId) ?? [];
    existing.push(t.tag);
    scrutinTagMap.set(t.scrutinId, existing);
  }

  if (scrutinIdSet.size === 0) {
    console.log(`  [SKIP] No scrutins tagged with ${relevantTags.join(", ")}`);
    return null;
  }

  // Get this deputy's votes on those scrutins
  const votes = await prisma.voteRecord.findMany({
    where: {
      deputeId: depute.id,
      scrutinId: { in: [...scrutinIdSet] },
    },
    include: {
      scrutin: {
        select: {
          id: true,
          numero: true,
          titre: true,
          dateScrutin: true,
          sortCode: true,
        },
      },
    },
    orderBy: { scrutin: { dateScrutin: "desc" } },
  });

  const contreVotes = votes.filter((v) => v.position === "contre");
  const abstentionVotes = votes.filter((v) => v.position === "abstention");

  // Top 10 "contre" votes as examples
  const examples = contreVotes.slice(0, 10).map((v) => ({
    scrutinId: v.scrutin.id,
    scrutinNumero: v.scrutin.numero,
    titre: v.scrutin.titre,
    dateScrutin: v.scrutin.dateScrutin.toISOString().split("T")[0],
    position: v.position,
    tags: scrutinTagMap.get(v.scrutinId) ?? [],
    sortCode: v.scrutin.sortCode,
  }));

  return {
    slug: minister.slug,
    ministerName: `${minister.deputePrenom} ${minister.deputeNom}`,
    ministereCode: minister.ministereCode,
    relevantTags,
    deputeId: depute.id,
    totalVotesOnPortfolio: votes.length,
    contreVotes: contreVotes.length,
    abstentionVotes: abstentionVotes.length,
    contreRate: votes.length > 0 ? contreVotes.length / votes.length : 0,
    examples,
  };
}

async function main() {
  console.log("=== Vote Contradiction Analysis — Lecornu II Deputy-Ministers ===\n");

  const results: VoteContradiction[] = [];

  for (const minister of DEPUTY_MINISTERS) {
    console.log(`Analyzing: ${minister.deputePrenom} ${minister.deputeNom} (${minister.ministereCode})...`);
    const result = await analyzeMinister(minister);
    if (result && result.totalVotesOnPortfolio > 0) {
      results.push(result);
      console.log(`  -> ${result.totalVotesOnPortfolio} votes on portfolio topics, ${result.contreVotes} contre (${(result.contreRate * 100).toFixed(1)}%)`);
    }
  }

  // Sort by contre rate descending
  results.sort((a, b) => b.contreRate - a.contreRate);

  console.log("\n=== RESULTS SUMMARY ===\n");
  for (const r of results) {
    const severity = r.contreRate > 0.3 ? "CRITIQUE" : r.contreRate > 0.15 ? "NOTABLE" : "INFORMATIF";
    console.log(
      `${severity.padEnd(12)} ${r.ministerName.padEnd(30)} ${r.ministereCode.padEnd(25)} ` +
      `${r.totalVotesOnPortfolio} votes, ${r.contreVotes} contre (${(r.contreRate * 100).toFixed(1)}%), ` +
      `${r.abstentionVotes} abstentions`
    );
    if (r.examples.length > 0) {
      for (const ex of r.examples.slice(0, 3)) {
        console.log(`    -> ${ex.dateScrutin} [${ex.position}] ${ex.titre.slice(0, 80)}...`);
      }
    }
  }

  // Write results to file
  writeFileSync(
    "data/vote-contradictions.json",
    JSON.stringify(results, null, 2),
  );
  console.log(`\nWrote ${results.length} results to data/vote-contradictions.json`);

  // prisma from db.ts manages its own lifecycle
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
