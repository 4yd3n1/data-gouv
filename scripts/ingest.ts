/**
 * Master ingestion orchestrator.
 * Runs all ingestion scripts in dependency order.
 *
 * Order:
 * 1. Territories (must be first — other models FK into these)
 * 2. Governance (deputes, senateurs, lobbyistes) — parallel
 * 3. Economy (GDP + BDM series, expanded to 15+ indicators)
 * 4. Culture (musees, monuments) — parallel
 * 5. AN open data (organes, scrutins, deports)
 * 5c. Tag scrutins with topic keywords
 * 6. Photos
 * 7. RNE elus, elections, party accounts — parallel
 * 8. Local data (INSEE local stats, DGFIP budgets) — parallel
 * 9. New data sources (crime stats, medical density) — parallel
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { ingestTerritoires } from "./ingest-territoires";
import { ingestDeputes } from "./ingest-deputes";
import { ingestSenateurs } from "./ingest-senateurs";
import { ingestLobbyistes } from "./ingest-lobbyistes";
import { ingestEconomie } from "./ingest-economie";
import { ingestMusees } from "./ingest-musees";
import { ingestMonuments } from "./ingest-monuments";
import { ingestDeclarations } from "./ingest-declarations";
import { ingestOrganes } from "./ingest-organes";
import { ingestScrutins } from "./ingest-scrutins";
import { ingestDeports } from "./ingest-deports";
import { tagScrutins } from "./tag-scrutins";
import { ingestPhotos } from "./ingest-photos";
import { ingestElus } from "./ingest-elus";
import { ingestElections } from "./ingest-elections";
import { ingestPartis } from "./ingest-partis";
import { ingestInseeLocal } from "./ingest-insee-local";
import { ingestBudgets } from "./ingest-budgets";
import { ingestCriminalite } from "./ingest-criminalite";
import { ingestMedecins } from "./ingest-medecins";

async function main() {
  const start = Date.now();
  console.log("=== data-gouv Full Ingestion ===\n");

  // Wave 1: Territory reference data (required by everything else)
  console.log("── Wave 1a: Territories ──");
  await ingestTerritoires();

  // Wave 1: Governance (can run in parallel)
  console.log("\n── Wave 1b: Governance ──");
  await Promise.all([
    ingestDeputes(),
    ingestSenateurs(),
    ingestLobbyistes(),
  ]);

  // Wave 2: Economy
  console.log("\n── Wave 2: Economy ──");
  await ingestEconomie();

  // Wave 3: Culture (can run in parallel)
  console.log("\n── Wave 3: Culture ──");
  await Promise.all([
    ingestMusees(),
    ingestMonuments(),
  ]);

  // Wave 4: HATVP Declarations (large download, runs alone)
  console.log("\n── Wave 4: Declarations ──");
  await ingestDeclarations();

  // Wave 5: AN open data (organes must come first, then scrutins + deports)
  console.log("\n── Wave 5a: Organes ──");
  await ingestOrganes();

  console.log("\n── Wave 5b: Scrutins + Déports ──");
  await Promise.all([
    ingestScrutins(),
    ingestDeports(),
  ]);

  // Wave 5c: Tag scrutins with policy domain keywords (must run after scrutins)
  console.log("\n── Wave 5c: Tag Scrutins ──");
  await tagScrutins();

  // Wave 6: Photo enrichment
  console.log("\n── Wave 6: Photos ──");
  await ingestPhotos();

  // Wave 7: RNE + Elections + Parties (can run in parallel, territories already loaded)
  console.log("\n── Wave 7: Élus, Élections, Partis ──");
  await Promise.all([
    ingestElus(),
    ingestElections(),
    ingestPartis(),
  ]);

  // Wave 8: Local data (INSEE Données Locales + DGFIP budgets)
  console.log("\n── Wave 8: Données Locales (INSEE + DGFIP) ──");
  await Promise.all([
    ingestInseeLocal(),
    ingestBudgets(),
  ]);

  // Wave 9: Crime stats + medical density
  console.log("\n── Wave 9: Criminalité + Densité médicale ──");
  await Promise.all([
    ingestCriminalite(),
    ingestMedecins(),
  ]);

  const duration = ((Date.now() - start) / 1000).toFixed(1);

  // Summary
  console.log("\n=== Ingestion Complete ===");
  console.log(`Total time: ${duration}s\n`);

  const logs = await prisma.ingestionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log("Recent ingestion logs:");
  console.log("─".repeat(70));
  for (const log of logs.reverse()) {
    const status = log.status === "success" ? "OK" : "FAIL";
    console.log(
      `  [${status}] ${log.source.padEnd(15)} ${String(log.rowsIngested).padStart(7)} rows  ${(log.duration / 1000).toFixed(1)}s`
    );
  }
  console.log("─".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
