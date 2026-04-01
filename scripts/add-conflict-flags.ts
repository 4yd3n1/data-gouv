/**
 * Phase 2 + 3 + 4: Add conflict flags to research output JSON files.
 *
 * Adds:
 * - Revolving door flags with lobby data
 * - Vote contradiction summaries
 * - Lobby-career overlap data
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data/research-output");

interface ConflictFlag {
  type: string;
  description: string;
  sourceUrl?: string;
  sourcePrincipale?: string;
  severity: string;
  data?: Record<string, unknown>;
  _ingested?: boolean;
}

interface ResearchOutput {
  slug: string;
  nom: string;
  prenom: string;
  researched_at: string;
  conflict_flags: ConflictFlag[];
  [key: string]: unknown;
}

function readJson(slug: string): ResearchOutput | null {
  const path = join(DATA_DIR, `${slug}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(slug: string, data: ResearchOutput) {
  const path = join(DATA_DIR, `${slug}.json`);
  data.researched_at = "2026-03-27";
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function hasFlag(data: ResearchOutput, type: string): boolean {
  return data.conflict_flags?.some((f) => f.type === type) ?? false;
}

// ═══════════════════════════════════════════════════════
// REVOLVING DOOR FLAGS (with lobby data)
// ═══════════════════════════════════════════════════════

const REVOLVING_DOORS: Array<{
  slug: string;
  careerOrg: string;
  portfolio: string;
  lobbyOrg: string;
  lobbyCount: number;
  description: string;
  sourceUrl: string;
  sourcePrincipale: string;
}> = [
  {
    slug: "maud-bregeon",
    careerOrg: "EDF",
    portfolio: "Énergie",
    lobbyOrg: "EDF SA",
    lobbyCount: 130,
    description:
      "Ancienne salariée d'EDF (2014-2022), nommée ministre déléguée chargée de l'Énergie. EDF a effectué 130 actions de lobbying déclarées ciblant le ministère de la Transition écologique, son ministère de tutelle.",
    sourceUrl:
      "https://reporterre.net/La-pronucleaire-Maud-Bregeon-devient-ministre-deleguee-a-l-Energie",
    sourcePrincipale: "Reporterre / AGORA HATVP",
  },
  {
    slug: "jean-pierre-farandou",
    careerOrg: "SNCF",
    portfolio: "Travail & Solidarités",
    lobbyOrg: "SNCF (toutes entités)",
    lobbyCount: 75,
    description:
      "PDG de la SNCF de 2019 à 2024, puis nommé ministre du Travail et des Solidarités. Les entités du groupe SNCF (SNCF SA, SNCF Voyageurs, SNCF Réseau, Keolis, FRET SNCF) ont effectué 75 actions de lobbying déclarées ciblant son ministère de tutelle.",
    sourceUrl:
      "https://www.lemonde.fr/politique/article/2025/10/12/jean-pierre-farandou-ex-patron-de-la-sncf-ministre-du-travail.html",
    sourcePrincipale: "Le Monde / AGORA HATVP",
  },
  {
    slug: "roland-lescure",
    careerOrg: "Natixis AM / Groupama AM / CDPQ",
    portfolio: "Économie & Finances",
    lobbyOrg: "Natixis IM + Groupama",
    lobbyCount: 33,
    description:
      "Ancien DG délégué de Natixis AM, DGA de Groupama AM, puis premier VP et CIO de la CDPQ (250 Mds$ gérés). Nommé ministre de l'Économie et des Finances. Natixis IM (3 actions) et Groupama (30 actions) figurent parmi les lobbyistes déclarés ciblant son ministère.",
    sourceUrl:
      "https://www.lefigaro.fr/politique/qui-est-roland-lescure-le-nouveau-ministre-de-l-economie-20251012",
    sourcePrincipale: "Le Figaro / AGORA HATVP",
  },
  {
    slug: "philippe-baptiste",
    careerOrg: "IBM / Total / BCG",
    portfolio: "Enseignement supérieur & Recherche",
    lobbyOrg: "IBM France + TotalEnergies",
    lobbyCount: 11,
    description:
      "Ancien cadre d'IBM, de Total et de BCG, puis PDG du CNES. Nommé ministre de l'Enseignement supérieur et de la Recherche. IBM France (10 actions) et TotalEnergies (1 action) figurent parmi les lobbyistes déclarés ciblant son ministère.",
    sourceUrl:
      "https://www.lemonde.fr/sciences/article/2025/10/12/philippe-baptiste-patron-du-cnes-au-gouvernement.html",
    sourcePrincipale: "Le Monde / AGORA HATVP",
  },
  {
    slug: "serge-papin",
    careerOrg: "Système U",
    portfolio: "PME, Commerce & Artisanat",
    lobbyOrg: "Système U Centrale Nationale",
    lobbyCount: 0,
    description:
      "PDG de Système U pendant 13 ans (2005-2018), l'une des plus grandes coopératives de distribution française. Nommé ministre délégué chargé du Commerce, de l'Artisanat, des PME et du Tourisme — portefeuille qui inclut la régulation du commerce de détail dont Système U est un acteur majeur.",
    sourceUrl:
      "https://www.lefigaro.fr/conjoncture/qui-est-serge-papin-ancien-patron-de-systeme-u-nouveau-ministre.html",
    sourcePrincipale: "Le Figaro",
  },
  {
    slug: "catherine-pegard",
    careerOrg: "Le Point",
    portfolio: "Culture",
    lobbyOrg: "N/A",
    lobbyCount: 0,
    description:
      "Journaliste politique au Point pendant plus de 20 ans, puis présidente du Château de Versailles nommée par Nicolas Sarkozy en 2011. Nommée ministre de la Culture. Profil atypique illustrant la porosité entre journalisme politique, nomination présidentielle et ministère de tutelle de l'établissement qu'elle dirigeait.",
    sourceUrl:
      "https://www.lemonde.fr/culture/article/2026/02/26/catherine-pegard-nommee-ministre-de-la-culture.html",
    sourcePrincipale: "Le Monde",
  },
];

// ═══════════════════════════════════════════════════════
// VOTE CONTRADICTION FLAGS (from Phase 3 analysis)
// ═══════════════════════════════════════════════════════

interface VoteContradiction {
  slug: string;
  ministerName: string;
  ministereCode: string;
  relevantTags: string[];
  totalVotesOnPortfolio: number;
  contreVotes: number;
  contreRate: number;
  examples: Array<{
    titre: string;
    dateScrutin: string;
  }>;
}

let voteContradictions: VoteContradiction[] = [];
try {
  voteContradictions = JSON.parse(
    readFileSync("data/vote-contradictions.json", "utf-8"),
  );
} catch {
  console.log("No vote-contradictions.json found, skipping.");
}

// ═══════════════════════════════════════════════════════
// APPLY ALL FLAGS
// ═══════════════════════════════════════════════════════

let updated = 0;

// Revolving doors
for (const rd of REVOLVING_DOORS) {
  const data = readJson(rd.slug);
  if (!data) {
    console.log(`[SKIP] ${rd.slug}: file not found`);
    continue;
  }

  if (!data.conflict_flags) data.conflict_flags = [];

  // Remove old revolving door flags and replace
  data.conflict_flags = data.conflict_flags.filter(
    (f) => f.type !== "PORTE_TOURNANTE" && f.type !== "conflit_interet_potentiel",
  );

  data.conflict_flags.push({
    type: "PORTE_TOURNANTE",
    description: rd.description,
    sourceUrl: rd.sourceUrl,
    sourcePrincipale: rd.sourcePrincipale,
    severity: rd.lobbyCount > 50 ? "critique" : rd.lobbyCount > 10 ? "notable" : "informatif",
    data: {
      careerOrg: rd.careerOrg,
      portfolio: rd.portfolio,
      lobbyOrg: rd.lobbyOrg,
      lobbyCount: rd.lobbyCount,
    },
    _ingested: false,
  });

  writeJson(rd.slug, data);
  console.log(`[UPDATED] ${rd.slug}: PORTE_TOURNANTE (${rd.lobbyCount} lobby actions)`);
  updated++;
}

// Vote contradictions
for (const vc of voteContradictions) {
  if (vc.contreVotes === 0) continue;

  const data = readJson(vc.slug);
  if (!data) continue;

  if (!data.conflict_flags) data.conflict_flags = [];

  // Remove old vote contradiction flags
  data.conflict_flags = data.conflict_flags.filter(
    (f) => f.type !== "VOTE_CONTRADICTION",
  );

  const severity = vc.contreRate > 0.3 ? "critique" : vc.contreRate > 0.15 ? "notable" : "informatif";
  const topExamples = vc.examples.slice(0, 3).map((e) => e.titre.slice(0, 80)).join("; ");

  data.conflict_flags.push({
    type: "VOTE_CONTRADICTION",
    description:
      `En tant que député(e), a voté contre ${vc.contreVotes} scrutin(s) sur ${vc.totalVotesOnPortfolio} ` +
      `portant sur les thématiques ${vc.relevantTags.join(", ")} — domaine(s) relevant de son portefeuille ministériel actuel ` +
      `(taux d'opposition : ${(vc.contreRate * 100).toFixed(0)} %).`,
    severity,
    data: {
      totalVotes: vc.totalVotesOnPortfolio,
      contreVotes: vc.contreVotes,
      contreRate: Math.round(vc.contreRate * 100),
      tags: vc.relevantTags,
      topExamples,
    },
    _ingested: false,
  });

  writeJson(vc.slug, data);
  console.log(`[UPDATED] ${vc.slug}: VOTE_CONTRADICTION (${vc.contreVotes}/${vc.totalVotesOnPortfolio} = ${(vc.contreRate * 100).toFixed(0)}%)`);
  updated++;
}

console.log(`\nDone. Updated ${updated} JSON files.`);
