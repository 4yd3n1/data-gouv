/**
 * Ingest HATVP interest declarations from declarations.xml.
 * Source: https://hatvp.fr/livraison/merge/declarations.xml
 *
 * The file is ~150MB XML with all published declarations (DI/DIA).
 * HATVP's server is flaky, so we download with retry + resume logic.
 */

import "dotenv/config";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";
import {
  splitDeclarations,
  parseDeclaration,
  type ParsedDeclaration,
} from "./lib/hatvp-parser";

const DECLARATIONS_URL =
  "https://hatvp.fr/livraison/merge/declarations.xml";
const LOCAL_CACHE_PATH = join(
  import.meta.dirname ?? process.cwd(),
  "..",
  "documentation",
  "hatvp-old-context",
  "declarations.xml"
);
const LOCAL_PATH = join(tmpdir(), "hatvp-declarations.xml");
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

// ─── Download with resume ───

async function downloadWithResume(): Promise<string> {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const existingSize = existsSync(LOCAL_PATH)
      ? statSync(LOCAL_PATH).size
      : 0;

    console.log(
      `  Download attempt ${attempts + 1}/${MAX_RETRIES} (resume from ${(existingSize / 1024 / 1024).toFixed(1)}MB)...`
    );

    const headers: Record<string, string> = {};
    if (existingSize > 0) {
      headers["Range"] = `bytes=${existingSize}-`;
    }

    try {
      const res = await fetch(DECLARATIONS_URL, {
        headers,
        signal: AbortSignal.timeout(300_000), // 5 min per attempt
      });

      // If server doesn't support range, start over
      if (existingSize > 0 && res.status === 200) {
        // Server ignored range header, full response — start fresh
        const ws = createWriteStream(LOCAL_PATH, { flags: "w" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if (downloaded % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB downloaded...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      if (res.status === 206) {
        // Partial content — append
        const ws = createWriteStream(LOCAL_PATH, { flags: "a" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = existingSize;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if ((downloaded - existingSize) % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB total...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      if (res.status === 416) {
        // Range not satisfiable — file is complete
        console.log(
          `  File already complete: ${(existingSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      // Full download (no existing file)
      if (res.ok) {
        const ws = createWriteStream(LOCAL_PATH, { flags: "w" });
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let downloaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ws.write(value);
          downloaded += value.length;
          if (downloaded % (10 * 1024 * 1024) < value.length) {
            console.log(
              `    ${(downloaded / 1024 / 1024).toFixed(1)}MB downloaded...`
            );
          }
        }
        ws.end();
        await new Promise((resolve) => ws.on("finish", resolve));

        const finalSize = statSync(LOCAL_PATH).size;
        console.log(
          `  Download complete: ${(finalSize / 1024 / 1024).toFixed(1)}MB`
        );
        return LOCAL_PATH;
      }

      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (err) {
      attempts++;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Attempt failed: ${msg}`);
      if (attempts < MAX_RETRIES) {
        console.log(`  Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  // If we have a partial file that's large enough, try to use it
  if (existsSync(LOCAL_PATH)) {
    const size = statSync(LOCAL_PATH).size;
    if (size > 1_000_000) {
      console.log(
        `  Using partial download (${(size / 1024 / 1024).toFixed(1)}MB) after ${MAX_RETRIES} attempts`
      );
      return LOCAL_PATH;
    }
  }

  throw new Error(
    `Failed to download declarations.xml after ${MAX_RETRIES} attempts`
  );
}

// ─── Main ───

export async function ingestDeclarations() {
  await logIngestion("declarations", async () => {
    // Use local cached file if available, otherwise download
    let filePath: string;
    if (existsSync(LOCAL_CACHE_PATH) && statSync(LOCAL_CACHE_PATH).size > 1_000_000) {
      console.log(`  Using local XML: ${LOCAL_CACHE_PATH} (${(statSync(LOCAL_CACHE_PATH).size / 1024 / 1024).toFixed(1)}MB)`);
      filePath = LOCAL_CACHE_PATH;
    } else {
      console.log("  Downloading declarations.xml (may take several minutes)...");
      filePath = await downloadWithResume();
    }

    // Read and parse
    console.log("  Reading XML file...");
    const xml = await readFile(filePath, "utf-8");
    console.log(`  File size: ${(xml.length / 1024 / 1024).toFixed(1)}MB`);

    const rawBlocks = splitDeclarations(xml);
    console.log(`  ${rawBlocks.length} declaration blocks found`);

    // Clear existing data
    await prisma.revenuDeclaration.deleteMany({});
    await prisma.participationFinanciere.deleteMany({});
    await prisma.declarationInteret.deleteMany({});

    let declCount = 0;
    let partCount = 0;
    let revCount = 0;
    let skipped = 0;

    for (const block of rawBlocks) {
      const decl = parseDeclaration(block);
      if (!decl) {
        skipped++;
        continue;
      }

      // Same person may have multiple declarations (e.g. DI + DIA, or updates).
      // Use upsert; if duplicate UUID, update with latest data.
      // First delete child records if this UUID already exists.
      await prisma.participationFinanciere.deleteMany({
        where: { declarationId: decl.uuid },
      });
      await prisma.revenuDeclaration.deleteMany({
        where: { declarationId: decl.uuid },
      });

      await prisma.declarationInteret.upsert({
        where: { id: decl.uuid },
        update: {
          civilite: decl.civilite,
          nom: decl.nom,
          prenom: decl.prenom,
          dateNaissance: decl.dateNaissance,
          typeDeclaration: decl.typeDeclaration,
          typeMandat: decl.typeMandat,
          organe: decl.organe,
          qualiteDeclarant: decl.qualiteDeclarant,
          dateDepot: decl.dateDepot,
          dateDebutMandat: decl.dateDebutMandat,
          totalParticipations: decl.totalParticipations,
          totalRevenus: decl.totalRevenus,
          participations: {
            create: decl.participations.map((p) => ({
              nomSociete: p.nomSociete,
              evaluation: p.evaluation,
              remuneration: p.remuneration,
              capitalDetenu: p.capitalDetenu,
              nombreParts: p.nombreParts,
            })),
          },
          revenus: {
            create: decl.revenus.map((r) => ({
              type: r.type,
              description: r.description,
              employeur: r.employeur,
              annee: r.annee,
              montant: r.montant,
            })),
          },
        },
        create: {
          id: decl.uuid,
          civilite: decl.civilite,
          nom: decl.nom,
          prenom: decl.prenom,
          dateNaissance: decl.dateNaissance,
          typeDeclaration: decl.typeDeclaration,
          typeMandat: decl.typeMandat,
          organe: decl.organe,
          qualiteDeclarant: decl.qualiteDeclarant,
          dateDepot: decl.dateDepot,
          dateDebutMandat: decl.dateDebutMandat,
          totalParticipations: decl.totalParticipations,
          totalRevenus: decl.totalRevenus,
          participations: {
            create: decl.participations.map((p) => ({
              nomSociete: p.nomSociete,
              evaluation: p.evaluation,
              remuneration: p.remuneration,
              capitalDetenu: p.capitalDetenu,
              nombreParts: p.nombreParts,
            })),
          },
          revenus: {
            create: decl.revenus.map((r) => ({
              type: r.type,
              description: r.description,
              employeur: r.employeur,
              annee: r.annee,
              montant: r.montant,
            })),
          },
        },
      });

      declCount++;
      partCount += decl.participations.length;
      revCount += decl.revenus.length;

      if (declCount % 100 === 0) {
        console.log(`  ${declCount} declarations processed...`);
      }
    }

    console.log(
      `  ${declCount} declarations, ${partCount} participations, ${revCount} revenus (${skipped} skipped)`
    );

    // Count by type
    const byType: Record<string, number> = {};
    for (const block of rawBlocks) {
      const decl = parseDeclaration(block);
      if (decl) {
        byType[decl.typeMandat] = (byType[decl.typeMandat] ?? 0) + 1;
      }
    }
    console.log("  By mandate type:", byType);

    return {
      rowsIngested: declCount + partCount + revCount,
      rowsTotal: rawBlocks.length,
      metadata: {
        declarations: declCount,
        participations: partCount,
        revenus: revCount,
        skipped,
        byType,
      },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDeclarations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
