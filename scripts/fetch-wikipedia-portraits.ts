/**
 * Fetch official portraits from Wikipedia for every PersonnalitePublique
 * without a photoUrl. Uses fr.wikipedia.org REST page-summary endpoint
 * (with en.wikipedia.org fallback), downloads thumbnail.source to
 * public/photos/ministres/<slug>.<ext>, then sets PersonnalitePublique.photoUrl.
 *
 * Idempotent: re-running only touches rows still missing a photoUrl.
 *
 * Usage: pnpm tsx scripts/fetch-wikipedia-portraits.ts [--all]
 *   --all   Re-download even for rows that already have photoUrl (default: skip).
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const PHOTOS_DEST = path.resolve(__dirname, "../public/photos/ministres");
const CREDITS_PATH = path.resolve(
  __dirname,
  "../documentation/photo-credits.json",
);
const USER_AGENT =
  "data-gouv-bot/1.0 (https://github.com/aydenmomika/data-gouv; civic-transparency)";
const REQ_DELAY_MS = 1500; // be polite — upload.wikimedia.org throttles ~100 req/min

type PhotoCredit = {
  slug: string;
  source: "wikipedia-fr" | "wikipedia-en";
  pageUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  fetchedAt: string;
};

type WikiSummary = {
  thumbnail?: { source: string };
  originalimage?: { source: string };
  content_urls?: { desktop?: { page?: string } };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSummary(
  lang: "fr" | "en",
  title: string,
): Promise<WikiSummary | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return null;
  return (await res.json()) as WikiSummary;
}

async function downloadImage(
  imageUrl: string,
  destPath: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(imageUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length === 0) return { ok: false, reason: "empty body" };
        fs.writeFileSync(destPath, buf);
        return { ok: true };
      }
      if (res.status === 429 || res.status >= 500) {
        const wait = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
        await sleep(wait);
        continue;
      }
      return { ok: false, reason: `HTTP ${res.status}` };
    } catch (err) {
      const wait = 1500 * attempt;
      await sleep(wait);
      if (attempt === 4) {
        return { ok: false, reason: `network error: ${(err as Error).message}` };
      }
    }
  }
  return { ok: false, reason: "exhausted retries" };
}

function extFromUrl(url: string): string {
  const m = url.toLowerCase().match(/\.(jpe?g|png|webp|svg)(?:\?|$)/);
  return m ? (m[1] === "jpeg" ? "jpg" : m[1]) : "jpg";
}

async function main() {
  const args = process.argv.slice(2);
  const fetchAll = args.includes("--all");

  await logIngestion("photos:wikipedia", async () => {
    const rows = await prisma.personnalitePublique.findMany({
      where: fetchAll ? {} : { photoUrl: null },
      select: { id: true, slug: true, prenom: true, nom: true },
      orderBy: { slug: "asc" },
    });
    console.log(`  Targeting ${rows.length} PersonnalitePublique rows`);

    fs.mkdirSync(PHOTOS_DEST, { recursive: true });
    const credits: PhotoCredit[] = fs.existsSync(CREDITS_PATH)
      ? (JSON.parse(fs.readFileSync(CREDITS_PATH, "utf8")) as PhotoCredit[])
      : [];
    const existingCreditSlugs = new Set(credits.map((c) => c.slug));

    let downloaded = 0;
    let linked = 0;
    const failed: string[] = [];

    for (const row of rows) {
      const fullName = `${row.prenom} ${row.nom}`.trim();

      let summary = await fetchSummary("fr", fullName);
      let lang: "fr" | "en" = "fr";
      if (!summary?.thumbnail?.source) {
        await sleep(REQ_DELAY_MS);
        summary = await fetchSummary("en", fullName);
        lang = "en";
      }

      const imageUrl =
        summary?.thumbnail?.source ?? summary?.originalimage?.source ?? null;
      if (!imageUrl) {
        failed.push(`${row.slug} (no Wikipedia portrait)`);
        await sleep(REQ_DELAY_MS);
        continue;
      }

      const ext = extFromUrl(imageUrl);
      // Skip SVG (vector) — most ministers won't have these and our pipeline expects raster.
      if (ext === "svg") {
        failed.push(`${row.slug} (SVG image, skipping)`);
        await sleep(REQ_DELAY_MS);
        continue;
      }

      const filename = `${row.slug}.${ext}`;
      const filePath = path.join(PHOTOS_DEST, filename);

      const result = await downloadImage(imageUrl, filePath);
      if (!result.ok) {
        failed.push(`${row.slug} (download failed: ${result.reason})`);
        await sleep(REQ_DELAY_MS);
        continue;
      }
      downloaded++;

      await prisma.personnalitePublique.update({
        where: { id: row.id },
        data: { photoUrl: `/photos/ministres/${encodeURIComponent(filename)}` },
      });
      linked++;

      if (!existingCreditSlugs.has(row.slug)) {
        credits.push({
          slug: row.slug,
          source: lang === "fr" ? "wikipedia-fr" : "wikipedia-en",
          pageUrl:
            summary?.content_urls?.desktop?.page ??
            `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(fullName.replace(/ /g, "_"))}`,
          imageUrl: summary?.originalimage?.source ?? imageUrl,
          thumbnailUrl: imageUrl,
          fetchedAt: new Date().toISOString(),
        });
        existingCreditSlugs.add(row.slug);
      }

      console.log(`  ✓ ${row.slug.padEnd(40)} (${lang})`);
      await sleep(REQ_DELAY_MS);
    }

    fs.writeFileSync(CREDITS_PATH, JSON.stringify(credits, null, 2));
    console.log(`  Wrote ${credits.length} entries to documentation/photo-credits.json`);

    if (failed.length > 0) {
      console.log(`\n  ${failed.length} unmatched (no Wikipedia portrait found):`);
      for (const f of failed) console.log(`    · ${f}`);
    }
    console.log(`\n  Downloaded ${downloaded}, linked ${linked} to PersonnalitePublique`);

    return {
      rowsIngested: linked,
      metadata: {
        targeted: rows.length,
        downloaded,
        linked,
        failed: failed.length,
      },
    };
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
