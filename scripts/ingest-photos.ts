/**
 * Set photo URLs for deputies and senators.
 * - Deputies: Official AN photo URL pattern
 * - Senators: Official Sénat photo URL pattern
 * - Ministers: Copy local photos to public/photos/ministres/, then link
 *   each file to the matching PersonnalitePublique.slug (direct match or alias).
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const MINISTER_PHOTOS_SRC = path.resolve(
  __dirname,
  "../documentation/HATVP-data/backend/public/government"
);
const MINISTER_PHOTOS_DEST = path.resolve(__dirname, "../public/photos/ministres");

// Alias map: filename basename (without extension) → PersonnalitePublique.slug.
// Files NOT in this map are matched by direct basename === slug equality.
// Files matching neither path are left unlinked (warning logged).
const MINISTER_FILENAME_ALIASES: Record<string, string> = {
  buffet_francois_noel: "francois-noel-buffet",
  delattre_nathalie19719d_carre: "nathalie-delattre",
  gatel_francoise14231l_carre: "francoise-gatel",
  letard_valerie01043q_carre: "valerie-letard",
  tabarot_philippe: "philippe-tabarot",
  PANOSYAN: "astrid-panosyan-bouvet",
  marcangelli: "laurent-marcangeli",
  ferraci: "marc-ferracci",
  parmentier: "charlotte-parmentier-lecocq",
  "SAINT-MARTIN-Laurent-2021": "laurent-saint-martin",
  patricia: "patricia-miralles",
  chappaz: "clara-chappaz", // duplicate of clara-chappaz.jpg, kept for resilience
};

export async function ingestPhotos() {
  await logIngestion("photos", async () => {
    let updatedCount = 0;

    // Deputies: AN serves portraits at www2.assemblee-nationale.fr/static/tribun/17/photos/<numeric>.jpg
    // (current XVII° législature). Depute.id is "PA<numeric>"; strip the "PA" prefix.
    // No photoUrl=null filter — overwrite any prior broken value (legacy /dyn/.../image returns 404).
    const deputes = await prisma.depute.findMany({ select: { id: true } });
    console.log(`  Setting photo URLs for ${deputes.length} deputies...`);

    for (const d of deputes) {
      const numeric = d.id.replace(/^PA/, "");
      await prisma.depute.update({
        where: { id: d.id },
        data: {
          photoUrl: `https://www2.assemblee-nationale.fr/static/tribun/17/photos/${numeric}.jpg`,
        },
      });
    }
    updatedCount += deputes.length;
    console.log(`  ${deputes.length} deputy photo URLs set`);

    // Senators: senat.fr rebuilt their site; the legacy /senimg/senateur{id}.jpg pattern
    // and follow-on guesses all 404. Clear the broken URLs so the Avatar fallback
    // renders initials rather than a broken image. Wikipedia portraits handled
    // separately in scripts/fetch-wikipedia-portraits.ts when a PersonnalitePublique link exists.
    const senateurClear = await prisma.senateur.updateMany({
      where: { photoUrl: { not: null } },
      data: { photoUrl: null },
    });
    console.log(
      `  ${senateurClear.count} senator photo URLs cleared (Sénat URL pattern broken — see Wikipedia fetcher)`
    );
    updatedCount += senateurClear.count;

    // Ministers: copy local photos
    let ministerCount = 0;
    if (fs.existsSync(MINISTER_PHOTOS_SRC)) {
      fs.mkdirSync(MINISTER_PHOTOS_DEST, { recursive: true });
      const photos = fs.readdirSync(MINISTER_PHOTOS_SRC).filter((f) =>
        /\.(jpg|jpeg|png|webp)$/i.test(f)
      );
      for (const photo of photos) {
        fs.copyFileSync(
          path.join(MINISTER_PHOTOS_SRC, photo),
          path.join(MINISTER_PHOTOS_DEST, photo)
        );
        ministerCount++;
      }
      console.log(`  ${ministerCount} minister photos copied to public/photos/ministres/`);
    } else {
      console.log(`  Minister photos source not found, skipping`);
    }

    // Link minister photos on disk → PersonnalitePublique.photoUrl (idempotent).
    let linkedCount = 0;
    const unmatchedFiles: string[] = [];
    if (fs.existsSync(MINISTER_PHOTOS_DEST)) {
      const onDisk = fs
        .readdirSync(MINISTER_PHOTOS_DEST)
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

      for (const file of onDisk) {
        const base = file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
        const slug = MINISTER_FILENAME_ALIASES[base] ?? base;
        const photoUrl = `/photos/ministres/${encodeURIComponent(file)}`;

        const result = await prisma.personnalitePublique.updateMany({
          where: { slug },
          data: { photoUrl },
        });

        if (result.count > 0) {
          linkedCount += result.count;
        } else {
          unmatchedFiles.push(file);
        }
      }

      console.log(
        `  ${linkedCount} PersonnalitePublique.photoUrl set from local files`
      );
      if (unmatchedFiles.length > 0) {
        console.log(
          `  ${unmatchedFiles.length} files unmatched (no PP slug — likely historical govt not yet seeded):`
        );
        for (const f of unmatchedFiles) console.log(`    · ${f}`);
      }
    }

    return {
      rowsIngested: updatedCount + ministerCount + linkedCount,
      metadata: {
        deputies: deputes.length,
        senatorsCleared: senateurClear.count,
        ministersCopied: ministerCount,
        ministerPhotosLinked: linkedCount,
        ministerPhotosUnmatched: unmatchedFiles.length,
      },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestPhotos()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
