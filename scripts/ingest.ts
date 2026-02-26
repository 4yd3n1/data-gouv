/**
 * Master ingestion orchestrator.
 * Runs all ingestion scripts in dependency order.
 *
 * Order:
 * 1. Territories (must be first — other models FK into these)
 * 2. Governance (deputes, senateurs, lobbyistes) — parallel
 * 3. Economy (GDP + BDM series)
 * 4. Culture (musees, monuments) — parallel
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
