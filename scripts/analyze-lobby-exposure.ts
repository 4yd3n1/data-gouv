/**
 * Phase 4: Lobby Exposure Cross-Reference
 *
 * For each Lecornu II minister, quantifies AGORA lobbying targeting their
 * ministry and checks if any top lobbying org matches a former employer.
 */

import "dotenv/config";
import { writeFileSync } from "fs";
import { prisma } from "../src/lib/db";

// All ministers with their ministereCode and key career organisations
const MINISTERS = [
  { slug: "sebastien-lecornu", ministereCode: "MATIGNON", careerOrgs: [] as string[] },
  { slug: "laurent-nunez", ministereCode: "INTERIEUR", careerOrgs: ["DGSI", "Préfecture de police"] },
  { slug: "catherine-vautrin", ministereCode: "ARMEES", careerOrgs: ["CIGNA"] },
  { slug: "jean-pierre-farandou", ministereCode: "TRAVAIL_SOLIDARITES", careerOrgs: ["SNCF", "Keolis"] },
  { slug: "monique-barbut", ministereCode: "TRANSITION_ECOLOGIQUE", careerOrgs: ["UNCCD", "GEF", "FEM"] },
  { slug: "gerald-darmanin", ministereCode: "JUSTICE", careerOrgs: [] },
  { slug: "roland-lescure", ministereCode: "ECONOMIE_FINANCES", careerOrgs: ["Natixis", "Groupama", "CDPQ", "Caisse de dépôt"] },
  { slug: "serge-papin", ministereCode: "PME_COMMERCE", careerOrgs: ["Système U", "Systeme U"] },
  { slug: "annie-genevard", ministereCode: "AGRICULTURE", careerOrgs: [] },
  { slug: "edouard-geffray", ministereCode: "EDUCATION_NATIONALE", careerOrgs: ["CNIL"] },
  { slug: "jean-noel-barrot", ministereCode: "AFFAIRES_ETRANGERES", careerOrgs: [] },
  { slug: "catherine-pegard", ministereCode: "CULTURE", careerOrgs: ["Le Point", "Versailles"] },
  { slug: "stephanie-rist", ministereCode: "SANTE_FAMILLE", careerOrgs: [] },
  { slug: "naima-moutchou", ministereCode: "OUTREMER", careerOrgs: [] },
  { slug: "francoise-gatel", ministereCode: "AMENAGEMENT_TERRITOIRE", careerOrgs: [] },
  { slug: "david-amiel", ministereCode: "ECONOMIE_FINANCES", careerOrgs: ["Élysée"] },
  { slug: "philippe-baptiste", ministereCode: "ENSEIGNEMENT_SUPERIEUR", careerOrgs: ["CNES", "IBM", "Total", "BCG"] },
  { slug: "marina-ferrari", ministereCode: "SPORTS_JEUNESSE", careerOrgs: [] },
  { slug: "philippe-tabarot", ministereCode: "TRANSPORTS", careerOrgs: [] },
  { slug: "vincent-jeanbrun", ministereCode: "VILLE_LOGEMENT", careerOrgs: [] },
  { slug: "laurent-panifous", ministereCode: "MATIGNON", careerOrgs: [] },
  { slug: "maud-bregeon", ministereCode: "TRANSITION_ECOLOGIQUE", careerOrgs: ["EDF", "Électricité de France"] },
  { slug: "aurore-berge", ministereCode: "EGALITE_FEMMES_HOMMES", careerOrgs: [] },
  { slug: "jean-didier-berger", ministereCode: "INTERIEUR", careerOrgs: [] },
  { slug: "marie-pierre-vedrenne", ministereCode: "INTERIEUR", careerOrgs: [] },
  { slug: "alice-rufo", ministereCode: "ARMEES", careerOrgs: [] },
  { slug: "catherine-chabaud", ministereCode: "AGRICULTURE", careerOrgs: [] },
  { slug: "mathieu-lefevre", ministereCode: "TRANSITION_ECOLOGIQUE", careerOrgs: [] },
  { slug: "sebastien-martin", ministereCode: "INDUSTRIE_NUMERIQUE", careerOrgs: [] },
  { slug: "anne-le-henanff", ministereCode: "INDUSTRIE_NUMERIQUE", careerOrgs: ["Bacardi", "Saupiquet"] },
  { slug: "benjamin-haddad", ministereCode: "AFFAIRES_ETRANGERES", careerOrgs: ["Atlantic Council", "Hudson Institute"] },
  { slug: "nicolas-forissier", ministereCode: "ECONOMIE_FINANCES", careerOrgs: [] },
  { slug: "eleonore-caroit", ministereCode: "AFFAIRES_ETRANGERES", careerOrgs: [] },
  { slug: "camille-galliard-minier", ministereCode: "SANTE_FAMILLE", careerOrgs: [] },
  { slug: "sabrina-agresti-roubache", ministereCode: "EDUCATION_NATIONALE", careerOrgs: [] },
  { slug: "michel-fournier", ministereCode: "AGRICULTURE", careerOrgs: [] },
];

interface LobbyExposure {
  slug: string;
  ministereCode: string;
  totalActions: number;
  topOrgs: Array<{ nom: string; count: number }>;
  topDomains: Array<{ domaine: string; count: number }>;
  careerOverlaps: Array<{ careerOrg: string; lobbyOrg: string; count: number }>;
  yearRange: string;
}

async function analyzeMinister(minister: typeof MINISTERS[0]): Promise<LobbyExposure | null> {
  const actions = await prisma.actionLobby.findMany({
    where: { ministereCode: minister.ministereCode },
    select: {
      representantNom: true,
      domaine: true,
      exercice: true,
    },
  });

  if (actions.length === 0) return null;

  // Top orgs
  const orgCounts = new Map<string, number>();
  for (const a of actions) {
    orgCounts.set(a.representantNom, (orgCounts.get(a.representantNom) ?? 0) + 1);
  }
  const topOrgs = [...orgCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Top domains
  const domainCounts = new Map<string, number>();
  for (const a of actions) {
    if (!a.domaine) continue;
    for (const d of a.domaine.split(",").map((s) => s.trim()).filter(Boolean)) {
      domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    }
  }
  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Check career overlaps
  const careerOverlaps: LobbyExposure["careerOverlaps"] = [];
  for (const careerOrg of minister.careerOrgs) {
    const norm = careerOrg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [lobbyOrg, count] of orgCounts) {
      const lobbyNorm = lobbyOrg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lobbyNorm.includes(norm) || norm.includes(lobbyNorm)) {
        careerOverlaps.push({ careerOrg, lobbyOrg, count });
      }
    }
  }

  // Year range
  const years = [...new Set(actions.map((a) => a.exercice).filter(Boolean))].sort();
  const yearRange = years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : (years[0] ?? "N/A");

  return {
    slug: minister.slug,
    ministereCode: minister.ministereCode,
    totalActions: actions.length,
    topOrgs: topOrgs.map(([nom, count]) => ({ nom, count })),
    topDomains: topDomains.map(([domaine, count]) => ({ domaine, count })),
    careerOverlaps,
    yearRange,
  };
}

async function main() {
  console.log("=== Lobby Exposure Analysis — Lecornu II ===\n");

  // Group by unique ministereCode to avoid duplicate queries
  const codeToSlugs = new Map<string, string[]>();
  for (const m of MINISTERS) {
    const existing = codeToSlugs.get(m.ministereCode) ?? [];
    existing.push(m.slug);
    codeToSlugs.set(m.ministereCode, existing);
  }

  const results: LobbyExposure[] = [];

  for (const minister of MINISTERS) {
    const result = await analyzeMinister(minister);
    if (result) {
      results.push(result);
    }
  }

  // Deduplicate by ministereCode (multiple ministers share same code)
  const seen = new Set<string>();
  const uniqueResults: LobbyExposure[] = [];
  for (const r of results) {
    const key = `${r.slug}:${r.ministereCode}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(r);
    }
  }

  // Sort by totalActions descending
  uniqueResults.sort((a, b) => b.totalActions - a.totalActions);

  console.log("=== LOBBY EXPOSURE BY MINISTRY ===\n");

  // Group by ministereCode for summary
  const byCode = new Map<string, LobbyExposure>();
  for (const r of uniqueResults) {
    if (!byCode.has(r.ministereCode)) {
      byCode.set(r.ministereCode, r);
    }
  }

  for (const [code, data] of [...byCode.entries()].sort((a, b) => b[1].totalActions - a[1].totalActions)) {
    const ministers = MINISTERS.filter((m) => m.ministereCode === code).map((m) => m.slug);
    const severity = data.totalActions > 5000 ? "CRITIQUE" : data.totalActions > 1500 ? "NOTABLE" : "INFORMATIF";
    console.log(`\n${severity} ${code} (${data.totalActions.toLocaleString()} actions, ${data.yearRange})`);
    console.log(`  Ministers: ${ministers.join(", ")}`);
    console.log(`  Top 5 orgs:`);
    for (const org of data.topOrgs.slice(0, 5)) {
      console.log(`    - ${org.nom} (${org.count})`);
    }
    console.log(`  Top 5 domains:`);
    for (const dom of data.topDomains.slice(0, 5)) {
      console.log(`    - ${dom.domaine} (${dom.count})`);
    }
  }

  // Print career overlaps
  const overlaps = uniqueResults.filter((r) => r.careerOverlaps.length > 0);
  if (overlaps.length > 0) {
    console.log("\n\n=== CAREER-LOBBY OVERLAPS (Former employer → Now lobbying their ministry) ===\n");
    for (const r of overlaps) {
      for (const o of r.careerOverlaps) {
        console.log(`  ${r.slug}: "${o.careerOrg}" in career → "${o.lobbyOrg}" lobbies ${r.ministereCode} (${o.count} actions)`);
      }
    }
  }

  writeFileSync("data/lobby-exposure.json", JSON.stringify(uniqueResults, null, 2));
  console.log(`\nWrote ${uniqueResults.length} results to data/lobby-exposure.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
