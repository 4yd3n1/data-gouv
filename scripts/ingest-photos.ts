/**
 * Set photo URLs for deputies and senators.
 * - Deputies: Official AN photo URL pattern
 * - Senators: Official Sénat photo URL pattern
 * - Ministers: Copy local photos to public/photos/ministres/
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

export async function ingestPhotos() {
  await logIngestion("photos", async () => {
    let updatedCount = 0;

    // Deputies: set AN photo URL
    const deputes = await prisma.depute.findMany({
      where: { photoUrl: null },
      select: { id: true },
    });
    console.log(`  Setting photo URLs for ${deputes.length} deputies...`);

    for (let i = 0; i < deputes.length; i += 500) {
      const batch = deputes.slice(i, i + 500);
      for (const d of batch) {
        await prisma.depute.update({
          where: { id: d.id },
          data: {
            photoUrl: `https://www.assemblee-nationale.fr/dyn/deputes/${d.id}/image`,
          },
        });
      }
      updatedCount += batch.length;
    }
    console.log(`  ${deputes.length} deputy photo URLs set`);

    // Senators: set Sénat photo URL
    const senateurs = await prisma.senateur.findMany({
      where: { photoUrl: null },
      select: { id: true },
    });
    console.log(`  Setting photo URLs for ${senateurs.length} senators...`);

    for (const s of senateurs) {
      await prisma.senateur.update({
        where: { id: s.id },
        data: {
          photoUrl: `https://www.senat.fr/senimg/senateur${s.id}.jpg`,
        },
      });
    }
    updatedCount += senateurs.length;
    console.log(`  ${senateurs.length} senator photo URLs set`);

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

    return {
      rowsIngested: updatedCount + ministerCount,
      metadata: {
        deputies: deputes.length,
        senators: senateurs.length,
        ministers: ministerCount,
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
