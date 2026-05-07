import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import { cache } from "react";
import {
  ContrastFactCheckPropsSchema,
  PromiseFactCheckPropsSchema,
} from "viral-schemas";
import { z } from "zod";

// ──────────────────────────────────────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────────────────────────────────────

const DRAFTS_DIR =
  process.env.REMOTION_DRAFTS_DIR ??
  path.resolve(process.cwd(), "../remotion/remotion/src/data/drafts");

function draftPath(filename: string): string | null {
  if (
    filename !== path.basename(filename) ||
    filename.startsWith(".") ||
    !filename.endsWith(".json")
  ) {
    return null;
  }
  return `${DRAFTS_DIR}/${filename}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Extended schemas — add slug + _meta fields that predate the base schema
// ──────────────────────────────────────────────────────────────────────────────

const MetaExtensionSchema = z.object({
  slug: z.string().optional(),
  personnaliteSlug: z.string().optional(),
  publishedAt: z.string().optional(),
  _meta: z
    .object({
      published: z.boolean().optional(),
      publishedAt: z.string().optional(),
      format: z.string().optional(),
      compositionId: z.string().optional(),
      sourcingTier: z.string().optional(),
      sourceCorpus: z.array(z.string()).optional(),
      riskFlags: z.array(z.string()).optional(),
      draftedAt: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

const ContrastDraftSchema = ContrastFactCheckPropsSchema.merge(MetaExtensionSchema);
const PromiseDraftSchema = PromiseFactCheckPropsSchema.merge(MetaExtensionSchema);

// A draft is either Contrast (has sideA/sideB) or Promise (has promise/realities).
// We try Contrast first, then Promise. Both schemas share branding/topic/verdict.
const DraftSchema = z.union([ContrastDraftSchema, PromiseDraftSchema]);

export type ContrastDraft = z.infer<typeof ContrastDraftSchema>;
export type PromiseDraft = z.infer<typeof PromiseDraftSchema>;
export type Draft = z.infer<typeof DraftSchema>;

export function isContrastDraft(d: Draft): d is ContrastDraft {
  return "sideA" in d && "sideB" in d;
}
export function isPromiseDraft(d: Draft): d is PromiseDraft {
  return "promise" in d && "realities" in d;
}

/**
 * Return a display title for any draft type.
 * ContrastFactCheck has `framingTitle`; PromiseFactCheck falls back to `topic`.
 */
export function getDraftTitle(d: Draft): string {
  if (isContrastDraft(d)) return d.framingTitle;
  return d.topic;
}

/**
 * Return a display subtitle for any draft type.
 * ContrastFactCheck has `framingSubtitle`; PromiseFactCheck has no direct equivalent.
 */
export function getDraftSubtitle(d: Draft): string | undefined {
  if (isContrastDraft(d)) return d.framingSubtitle;
  return d.promise.quote.length > 120
    ? d.promise.quote.slice(0, 117) + "…"
    : d.promise.quote;
}

// ──────────────────────────────────────────────────────────────────────────────
// Summary type (for index pages / sitemap)
// ──────────────────────────────────────────────────────────────────────────────

export type DraftSummary = {
  slug: string;
  filename: string;
  framingTitle: string;
  category: "ECONOMIE" | "SOCIAL" | "SANTE" | "DEMOCRATIE" | "CLIMAT";
  publishedAt: string | undefined;
  format: "Contrast" | "Promise";
  personnaliteSlug: string | undefined;
};

// ──────────────────────────────────────────────────────────────────────────────
// Slug derivation
// Filename `FactCheck-Lecornu5PM.json` → `lecornu-5pm`
// Filename `kohler.json` → `kohler`
// ──────────────────────────────────────────────────────────────────────────────

export function deriveSlugFromFilename(filename: string): string {
  // Remove extension
  const base = filename.replace(/\.json$/, "");
  // Strip leading "FactCheck-" prefix (case-sensitive, matches Remotion conventions)
  const stripped = base.replace(/^FactCheck-/, "");
  // Convert CamelCase / mixed-case + digits to kebab-case.
  // Strategy: insert a separator at every transition boundary.
  // "Lecornu5PM" → "lecornu-5-pm"
  const kebab = stripped
    // lowercase letter followed by uppercase letter → insert hyphen (CamelCase split)
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    // any letter followed by a digit → insert hyphen (e.g. "u5" → "u-5")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    // uppercase acronym sequence followed by uppercase+lowercase → split (e.g. "PMFoo" → "PM-Foo")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    // Replace underscores and spaces with hyphens
    .replace(/[_\s]+/g, "-")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return kebab;
}

// ──────────────────────────────────────────────────────────────────────────────
// File reader (no cache — cache is applied at the exported function level)
// ──────────────────────────────────────────────────────────────────────────────

async function readTextFile(filePath: string): Promise<string | null> {
  let handle: fs.FileHandle | null = null;
  try {
    handle = await fs.open(filePath, "r");
    return await handle.readFile("utf-8");
  } catch {
    return null;
  } finally {
    await handle?.close();
  }
}

async function readDraftFile(filePath: string): Promise<Draft | null> {
  let raw: string;
  const file = await readTextFile(filePath);
  if (file === null) {
    return null;
  }
  raw = file;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[factcheck-manifest] JSON parse error in ${filePath}:`, e);
    }
    return null;
  }

  const result = DraftSchema.safeParse(json);
  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[factcheck-manifest] Schema validation failed for ${filePath}:`,
        result.error.format()
      );
    }
    return null;
  }
  return result.data;
}

// ──────────────────────────────────────────────────────────────────────────────
// getDraft — look up a single draft by slug
// ──────────────────────────────────────────────────────────────────────────────

export const getDraft = cache(async (slug: string): Promise<Draft | null> => {
  // 1. Try exact match: <slug>.json
  const exactPath = draftPath(`${slug}.json`);
  if (exactPath) {
    const exact = await readDraftFile(exactPath);
    if (exact) return exact;
  }

  // 2. Enumerate all draft files and check for a filename-derived slug match
  let entries: string[];
  try {
    entries = await fs.readdir(DRAFTS_DIR);
  } catch {
    return null;
  }

  const jsonFiles = entries.filter(
    (f) =>
      f.endsWith(".json") &&
      !f.endsWith(".gate.json") &&
      !f.endsWith(".json.tmp") &&
      !f.startsWith(".")
  );

  for (const filename of jsonFiles) {
    const derived = deriveSlugFromFilename(filename);
    if (derived === slug) {
      const filePath = draftPath(filename);
      return filePath ? readDraftFile(filePath) : null;
    }
  }

  // 3. Try matching the `slug` field inside each draft
  for (const filename of jsonFiles) {
    const filePath = draftPath(filename);
    if (!filePath) continue;
    const draft = await readDraftFile(filePath);
    if (draft && "slug" in draft && draft.slug === slug) {
      return draft;
    }
  }

  return null;
});

// ──────────────────────────────────────────────────────────────────────────────
// listDrafts — return summary list of all parseable drafts
// ──────────────────────────────────────────────────────────────────────────────

export const listDrafts = cache(async (): Promise<DraftSummary[]> => {
  let entries: string[];
  try {
    entries = await fs.readdir(DRAFTS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = entries.filter(
    (f) =>
      f.endsWith(".json") &&
      !f.endsWith(".gate.json") &&
      !f.endsWith(".json.tmp") &&
      !f.startsWith(".")
  );

  const summaries: DraftSummary[] = [];

  for (const filename of jsonFiles) {
    const filePath = draftPath(filename);
    if (!filePath) continue;
    const draft = await readDraftFile(filePath);
    if (!draft) continue;

    // Slug: prefer explicit field, then filename-derived
    const slug =
      ("slug" in draft && draft.slug) || deriveSlugFromFilename(filename);

    // Published-at: prefer explicit fields, fall back to file mtime
    const publishedAt: string | undefined =
      draft._meta?.publishedAt ??
      (typeof (draft as Record<string, unknown>).publishedAt === "string"
        ? String((draft as Record<string, unknown>).publishedAt)
        : undefined) ??
      draft._meta?.draftedAt ??
      undefined;

    summaries.push({
      slug,
      filename,
      framingTitle: getDraftTitle(draft),
      category: draft.branding.category,
      publishedAt,
      format: isContrastDraft(draft) ? "Contrast" : "Promise",
      personnaliteSlug:
        "personnaliteSlug" in draft ? draft.personnaliteSlug : undefined,
    });
  }

  // Sort by publishedAt descending (newest first), undated drafts last
  summaries.sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return summaries;
});
