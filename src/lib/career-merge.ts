import type { EntreeCarriere, SourceCarriere } from "@prisma/client";
import { normalizeName } from "./normalize-name";

export interface MergedCareerEntry
  extends Omit<EntreeCarriere, "source" | "sourceUrl" | "sourceDate"> {
  sources: Array<{
    source: SourceCarriere;
    sourceUrl: string | null;
    sourceDate: Date | null;
  }>;
}

function stripGovSuffix(org: string): string {
  // "Gouvernement Sébastien Lecornu (II)" → "Gouvernement Sebastien Lecornu"
  // "Assemblée nationale (XVIe legislature)" → "Assemblee nationale"
  return normalizeName(org).replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function keyOf(e: EntreeCarriere): string {
  return [
    normalizeName(e.titre),
    stripGovSuffix(e.organisation ?? ""),
    e.categorie,
  ].join("|");
}

function rangesOverlap(
  aStart: Date | null,
  aEnd: Date | null,
  bStart: Date | null,
  bEnd: Date | null,
): boolean {
  // If either range is entirely unbounded, treat as overlapping.
  if (!aStart && !bStart) return true;
  const aS = aStart?.getTime() ?? Number.NEGATIVE_INFINITY;
  const aE = aEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  const bS = bStart?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bE = bEnd?.getTime() ?? Number.POSITIVE_INFINITY;
  return aS <= bE && bS <= aE;
}

function earliest(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() <= b.getTime() ? a : b;
}

function latest(a: Date | null, b: Date | null): Date | null {
  if (!a) return null; // ongoing trumps closed
  if (!b) return null;
  return a.getTime() >= b.getTime() ? a : b;
}

function pickBestTitre(a: string, b: string): string {
  // Prefer the version that retains diacritics — it's the original-language
  // form. NFD-stripped length < original length signals accented characters.
  const aHasAccents = a !== a.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const bHasAccents = b !== b.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (aHasAccents && !bHasAccents) return a;
  if (bHasAccents && !aHasAccents) return b;
  return a.length >= b.length ? a : b;
}

/**
 * Collapse duplicate career entries that describe the same role recorded by
 * different sources (HATVP + Assemblée nationale + Presse). Example: Marina
 * Ferrari's "Secrétaire d'État chargée du Numérique" appeared three times —
 * once per source. Downstream consumers see one entry per role with a list of
 * corroborating sources.
 */
export function mergeCareerEntries(
  entries: EntreeCarriere[],
): MergedCareerEntry[] {
  // Each key may hold multiple distinct mandates if the date ranges don't
  // overlap (e.g. same person served the same government role under two
  // different governments). So we keep a list per key and merge by range.
  const byKey = new Map<string, MergedCareerEntry[]>();

  for (const e of entries) {
    const key = keyOf(e);
    const sourceRef = {
      source: e.source,
      sourceUrl: e.sourceUrl,
      sourceDate: e.sourceDate,
    };
    const bucket = byKey.get(key) ?? [];

    const match = bucket.find((m) =>
      rangesOverlap(m.dateDebut, m.dateFin, e.dateDebut, e.dateFin),
    );

    if (match) {
      if (
        !match.sources.some(
          (s) => s.source === sourceRef.source && s.sourceUrl === sourceRef.sourceUrl,
        )
      ) {
        match.sources.push(sourceRef);
      }
      if (!match.description && e.description) match.description = e.description;
      match.titre = pickBestTitre(match.titre, e.titre);
      if (e.organisation && match.organisation) {
        match.organisation = pickBestTitre(match.organisation, e.organisation);
      } else if (!match.organisation && e.organisation) {
        match.organisation = e.organisation;
      }
      match.dateDebut = earliest(match.dateDebut, e.dateDebut);
      // Ongoing (null dateFin) wins over any closed date.
      if (match.dateFin !== null && e.dateFin !== null) {
        match.dateFin = latest(match.dateFin, e.dateFin);
      } else {
        match.dateFin = null;
      }
      continue;
    }

    const {
      source: _source,
      sourceUrl: _sourceUrl,
      sourceDate: _sourceDate,
      ...rest
    } = e;
    bucket.push({ ...rest, sources: [sourceRef] });
    byKey.set(key, bucket);
  }

  return [...byKey.values()]
    .flat()
    .sort((a, b) => {
      const at = a.dateDebut?.getTime() ?? 0;
      const bt = b.dateDebut?.getTime() ?? 0;
      return bt - at;
    });
}

const SOURCE_PRIORITY: Record<SourceCarriere, number> = {
  HATVP: 3,
  ASSEMBLEE: 3,
  PRESSE: 2,
  MANUELLE: 1,
};

const SOURCE_LABEL: Record<SourceCarriere, string> = {
  HATVP: "HATVP",
  ASSEMBLEE: "Assemblée nationale",
  PRESSE: "Presse",
  MANUELLE: "Vérification manuelle",
};

/**
 * Format a merged entry's source list for display. Sorts by authority —
 * HATVP/Assemblée before press, manual last — then joins with middots.
 */
export function formatSources(merged: MergedCareerEntry): string {
  const labels = merged.sources
    .slice()
    .sort((a, b) => SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source])
    .map((s) => SOURCE_LABEL[s.source]);
  return [...new Set(labels)].join(" · ");
}
