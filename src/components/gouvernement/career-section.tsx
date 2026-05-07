import { prisma } from "@/lib/db";
import { matchRevolvingDoor } from "@/lib/signal-types";
import { mergeCareerEntries, formatSources, type MergedCareerEntry } from "@/lib/career-merge";
import { normalizeName } from "@/lib/normalize-name";
import type { CategorieCarriere } from "@prisma/client";

const CATEGORIE_LABEL: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "Gouvernement",
  MANDAT_ELECTIF: "Mandats électifs",
  CARRIERE_PRIVEE: "Secteur privé",
  FONCTION_PUBLIQUE: "Fonction publique",
  FORMATION: "Formation",
  ORGANISME: "Organismes",
  AUTRE: "Autre",
};

const CATEGORIE_ORDER: CategorieCarriere[] = [
  "MANDAT_GOUVERNEMENTAL",
  "MANDAT_ELECTIF",
  "FONCTION_PUBLIQUE",
  "CARRIERE_PRIVEE",
  "ORGANISME",
  "FORMATION",
  "AUTRE",
];

const LANE_FILL: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "bg-teal-500/70 hover:bg-teal-400/90",
  MANDAT_ELECTIF: "bg-blue-500/55 hover:bg-blue-400/80",
  FONCTION_PUBLIQUE: "bg-indigo-500/50 hover:bg-indigo-400/75",
  CARRIERE_PRIVEE: "bg-amber-500/55 hover:bg-amber-400/80",
  ORGANISME: "bg-rose-500/50 hover:bg-rose-400/75",
  FORMATION: "bg-bureau-500/40 hover:bg-bureau-400/60",
  AUTRE: "bg-bureau-600/50 hover:bg-bureau-500/70",
};

// Matching text tone for the per-row category eyebrow.
const CATEGORY_TONE: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "text-teal",
  MANDAT_ELECTIF: "text-blue-400",
  FONCTION_PUBLIQUE: "text-indigo-400",
  CARRIERE_PRIVEE: "text-amber-400",
  ORGANISME: "text-rose-400",
  FORMATION: "text-bureau-500",
  AUTRE: "text-bureau-500",
};

const PUBLIC_LIFE_CATEGORIES: CategorieCarriere[] = [
  "MANDAT_GOUVERNEMENTAL",
  "MANDAT_ELECTIF",
  "FONCTION_PUBLIQUE",
  "ORGANISME",
];

function formatDateShort(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const endDate = end ?? new Date();
  const months = Math.max(
    0,
    (endDate.getFullYear() - start.getFullYear()) * 12 +
      (endDate.getMonth() - start.getMonth()),
  );
  if (months < 1) return "< 1 mois";
  if (months < 12) return `${months} mois`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} ${remMonths} mois`;
}

function formatYears(ms: number): string {
  const years = Math.floor(ms / (365.25 * 24 * 3600 * 1000));
  if (years < 1) return "< 1 an";
  return `${years} an${years > 1 ? "s" : ""}`;
}

// Dedup key for a government — the PM surname, roman suffix preserved.
// Handles variants like "Gouvernement Sébastien Lecornu" vs "Gouvernement Lecornu"
// (both key to "lecornu") while keeping Philippe I vs Philippe II distinct.
function canonicalGovKey(org: string): string {
  const stripped = normalizeName(org).replace(/^gouvernement\s+/, "").trim();
  const match = stripped.match(/^(.*?)\s*(\(([^)]*)\))?\s*$/);
  const core = match?.[1] ?? stripped;
  const suffix = match?.[3] ?? "";
  const words = core.split(/\s+/).filter(Boolean);
  const surname = words[words.length - 1] ?? core;
  return suffix ? `${surname} (${suffix})` : surname;
}

// Compound gov cells in raw data ("Borne / Attal") describe one ministerial
// role that spanned two governments — split so each is counted once.
function splitCompoundGov(org: string): string[] {
  return org
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Summary {
  publicYearsMs: number | null;
  publicStart: Date | null;
  govs: string[];
  privateYearsMs: number | null;
  latestGovStart: Date | null;
  latestGovTitre: string | null;
}

function computeSummary(entries: MergedCareerEntry[]): Summary {
  const now = new Date();

  const publicEntries = entries.filter(
    (e) => PUBLIC_LIFE_CATEGORIES.includes(e.categorie) && e.dateDebut,
  );
  let publicYearsMs: number | null = null;
  let publicStart: Date | null = null;
  if (publicEntries.length) {
    const startMs = Math.min(
      ...publicEntries.map((e) => (e.dateDebut as Date).getTime()),
    );
    const endMs = Math.max(
      ...publicEntries.map((e) => (e.dateFin ?? now).getTime()),
    );
    publicStart = new Date(startMs);
    publicYearsMs = Math.max(0, endMs - startMs);
  }

  const govMap = new Map<string, { display: string; start: number }>();
  for (const e of entries) {
    if (e.categorie !== "MANDAT_GOUVERNEMENTAL" || !e.organisation || !e.dateDebut) continue;
    for (const part of splitCompoundGov(e.organisation)) {
      const key = canonicalGovKey(part);
      const display = part.replace(/^Gouvernement\s+/i, "");
      const existing = govMap.get(key);
      const isNewer = !existing || e.dateDebut.getTime() > existing.start;
      const isRicher =
        existing &&
        e.dateDebut.getTime() === existing.start &&
        display.length > existing.display.length;
      if (isNewer || isRicher) {
        govMap.set(key, { display, start: e.dateDebut.getTime() });
      }
    }
  }
  const govs = [...govMap.values()]
    .sort((a, b) => b.start - a.start)
    .map((g) => g.display);

  const privateEntries = entries.filter(
    (e) => e.categorie === "CARRIERE_PRIVEE" && e.dateDebut,
  );
  let privateYearsMs: number | null = null;
  if (privateEntries.length) {
    privateYearsMs = privateEntries.reduce((sum, e) => {
      const end = e.dateFin ?? now;
      return sum + (end.getTime() - (e.dateDebut as Date).getTime());
    }, 0);
  }

  const latestGov = entries
    .filter((e) => e.categorie === "MANDAT_GOUVERNEMENTAL" && e.dateDebut)
    .sort((a, b) => (b.dateDebut as Date).getTime() - (a.dateDebut as Date).getTime())[0];

  return {
    publicYearsMs,
    publicStart,
    govs,
    privateYearsMs,
    latestGovStart: latestGov?.dateDebut ?? null,
    latestGovTitre: latestGov?.titre ?? null,
  };
}

// Count distinct governments a given "Ministre de X" title has been held under.
// Presidential titles are excluded — a president spans multiple PM rotations by
// design, so "reconduit ×N" misreads as renewal.
export function detectReconduit(entries: MergedCareerEntry[]): Map<string, number> {
  const groups = new Map<string, string[]>();
  for (const e of entries) {
    if (e.categorie !== "MANDAT_GOUVERNEMENTAL") continue;
    const norm = normalizeName(e.titre);
    if (norm.startsWith("president de la republique")) continue;
    const ids = groups.get(norm) ?? [];
    ids.push(e.id);
    groups.set(norm, ids);
  }
  const out = new Map<string, number>();
  for (const ids of groups.values()) {
    if (ids.length >= 2) {
      for (const id of ids) out.set(id, ids.length);
    }
  }
  return out;
}

// Flag entries whose date range overlaps another entry of a different category
// for at least 90 days. Formation is excluded (it trivially overlaps with
// everything). Returns id → list of overlapping titles.
function detectConcurrent(
  entries: MergedCareerEntry[],
): Map<string, string[]> {
  const now = new Date();
  const MIN_OVERLAP_MS = 90 * 24 * 3600 * 1000;
  const result = new Map<string, string[]>();
  for (let i = 0; i < entries.length; i++) {
    const a = entries[i];
    if (!a.dateDebut || a.categorie === "FORMATION") continue;
    const aStart = a.dateDebut.getTime();
    const aEnd = (a.dateFin ?? now).getTime();
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const b = entries[j];
      if (!b.dateDebut || b.categorie === "FORMATION") continue;
      if (b.categorie === a.categorie) continue;
      const bStart = b.dateDebut.getTime();
      const bEnd = (b.dateFin ?? now).getTime();
      const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
      if (overlap >= MIN_OVERLAP_MS) {
        const list = result.get(a.id) ?? [];
        if (!list.includes(b.titre)) list.push(b.titre);
        result.set(a.id, list);
      }
    }
  }
  return result;
}

export async function CareerSection({
  personnaliteId,
  ministereCode,
  portefeuille,
}: {
  personnaliteId: string;
  ministereCode?: string | null;
  portefeuille?: string | null;
}) {
  const rawEntries = await prisma.entreeCarriere.findMany({
    where: { personnaliteId },
    orderBy: [{ dateDebut: "desc" }, { ordre: "asc" }],
  });

  const entries = mergeCareerEntries(rawEntries);

  if (entries.length === 0) {
    return (
      <section>
        <SectionHeader title="Parcours" />
        <p className="text-sm text-bureau-500">Données de parcours en cours de collecte.</p>
      </section>
    );
  }

  // Flat reverse-chronological list, grouped by start year for visual anchors.
  const sortedByDate = [...entries].sort((a, b) => {
    const ad = a.dateDebut?.getTime() ?? -Infinity;
    const bd = b.dateDebut?.getTime() ?? -Infinity;
    return bd - ad;
  });
  const undated = sortedByDate.filter((e) => !e.dateDebut);
  const dated = sortedByDate.filter((e) => e.dateDebut);
  const byYear = new Map<number, MergedCareerEntry[]>();
  for (const e of dated) {
    const y = (e.dateDebut as Date).getFullYear();
    const bucket = byYear.get(y) ?? [];
    bucket.push(e);
    byYear.set(y, bucket);
  }
  const orderedYears = [...byYear.keys()].sort((a, b) => b - a);

  const summary = computeSummary(entries);
  const reconduit = detectReconduit(entries);
  const concurrent = detectConcurrent(entries);

  return (
    <section className="space-y-10">
      <SectionHeader title="Parcours" />

      <SummaryStrip summary={summary} />

      <div className="space-y-10">
        {orderedYears.map((year) => (
          <YearGroup
            key={year}
            year={year}
            entries={byYear.get(year)!}
            ministereCode={ministereCode}
            portefeuille={portefeuille}
            reconduit={reconduit}
            concurrent={concurrent}
          />
        ))}
        {undated.length > 0 && (
          <YearGroup
            year={null}
            entries={undated}
            ministereCode={ministereCode}
            portefeuille={portefeuille}
            reconduit={reconduit}
            concurrent={concurrent}
          />
        )}
      </div>
    </section>
  );
}

function SummaryStrip({ summary }: { summary: Summary }) {
  const stats: Array<{ label: string; value: string; sub?: string }> = [];

  if (summary.publicYearsMs != null && summary.publicStart) {
    stats.push({
      label: "Vie publique",
      value: formatYears(summary.publicYearsMs),
      sub: `depuis ${summary.publicStart.getFullYear()}`,
    });
  }

  if (summary.govs.length > 0) {
    const preview = summary.govs.slice(0, 3).join(", ");
    const suffix = summary.govs.length > 3 ? "…" : "";
    stats.push({
      label:
        summary.govs.length === 1 ? "Gouvernement servi" : "Gouvernements servis",
      value: String(summary.govs.length),
      sub: preview + suffix,
    });
  }

  if (summary.privateYearsMs != null && summary.privateYearsMs > 0) {
    stats.push({
      label: "Secteur privé",
      value: formatYears(summary.privateYearsMs),
      sub: "cumul",
    });
  }

  if (summary.latestGovStart) {
    stats.push({
      label: "Dernière nomination",
      value: formatDateShort(summary.latestGovStart),
    });
  }

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-bureau-800/40 py-4 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
            {s.label}
          </div>
          <div className="mt-1 text-lg tabular-nums text-bureau-100">{s.value}</div>
          {s.sub && (
            <div className="mt-0.5 truncate text-[11px] text-bureau-600">{s.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LaneTimeline({
  entries,
  minYear,
  maxYear,
  span,
  reconduit,
}: {
  entries: MergedCareerEntry[];
  minYear: number;
  maxYear: number;
  span: number;
  reconduit: Map<string, number>;
}) {
  const now = new Date();

  // Year ticks at every 5 years, plus the span bounds when they're not too
  // close to a natural tick (≤ 2 years away overlaps visually).
  const tickYears: number[] = [];
  for (let y = Math.ceil(minYear / 5) * 5; y <= maxYear; y += 5) {
    tickYears.push(y);
  }
  if (!tickYears.includes(minYear) && (tickYears.length === 0 || tickYears[0] - minYear > 2)) {
    tickYears.unshift(minYear);
  }
  if (
    !tickYears.includes(maxYear) &&
    (tickYears.length === 0 || maxYear - tickYears[tickYears.length - 1] > 2)
  ) {
    tickYears.push(maxYear);
  }

  const activeLanes = CATEGORIE_ORDER.filter((cat) =>
    entries.some((e) => e.categorie === cat),
  );

  const segmentsByLane = new Map<
    CategorieCarriere,
    Array<{ entry: MergedCareerEntry; leftPct: number; widthPct: number }>
  >();
  for (const cat of activeLanes) segmentsByLane.set(cat, []);

  for (const e of entries) {
    const s = e.dateDebut as Date;
    const eDate = e.dateFin ?? now;
    const startY = s.getFullYear() + s.getMonth() / 12;
    const endY = eDate.getFullYear() + eDate.getMonth() / 12;
    const leftPct = ((startY - minYear) / span) * 100;
    const widthPct = Math.max(0.6, ((endY - startY) / span) * 100);
    segmentsByLane.get(e.categorie)?.push({ entry: e, leftPct, widthPct });
  }

  const LANE_H = 18;
  const LANE_GAP = 4;
  const LABEL_W = 132;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-bureau-500">
        <span>Chronologie</span>
        <span className="tabular-nums">
          {minYear} – {maxYear}
        </span>
      </div>
      <div className="flex">
        <div className="shrink-0" style={{ width: `${LABEL_W}px` }}>
          {activeLanes.map((cat) => (
            <div
              key={cat}
              className="flex items-center text-[11px] text-bureau-400"
              style={{ height: `${LANE_H}px`, marginBottom: `${LANE_GAP}px` }}
            >
              {CATEGORIE_LABEL[cat]}
            </div>
          ))}
          <div style={{ height: "14px", marginTop: "4px" }} />
        </div>

        <div className="relative flex-1">
          <div
            className="pointer-events-none absolute left-0 right-0 top-0"
            style={{
              height: `${activeLanes.length * (LANE_H + LANE_GAP)}px`,
            }}
          >
            {tickYears.map((y) => (
              <div
                key={y}
                className="absolute top-0 bottom-0 border-l border-bureau-800/50"
                style={{ left: `${((y - minYear) / span) * 100}%` }}
              />
            ))}
          </div>

          {activeLanes.map((cat) => (
            <div
              key={cat}
              className="relative"
              style={{ height: `${LANE_H}px`, marginBottom: `${LANE_GAP}px` }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-bureau-800/40" />
              {segmentsByLane.get(cat)?.map((seg) => {
                const r = reconduit.get(seg.entry.id);
                const startY = (seg.entry.dateDebut as Date).getFullYear();
                const endY = seg.entry.dateFin
                  ? seg.entry.dateFin.getFullYear()
                  : "en cours";
                const label =
                  `${seg.entry.titre} · ${startY}–${endY}` +
                  (r ? ` · reconduit ×${r}` : "");
                return (
                  <a
                    key={seg.entry.id}
                    href={`#entry-${seg.entry.id}`}
                    title={label}
                    aria-label={label}
                    className={`absolute top-0 bottom-0 rounded-[2px] ring-1 ring-black/10 transition-colors ${LANE_FILL[cat]}`}
                    style={{
                      left: `${seg.leftPct}%`,
                      width: `${seg.widthPct}%`,
                    }}
                  />
                );
              })}
            </div>
          ))}

          <div
            className="relative mt-1 text-[10px] tabular-nums text-bureau-600"
            style={{ height: "14px" }}
          >
            {tickYears.map((y) => (
              <span
                key={y}
                className="absolute"
                style={{
                  left: `${((y - minYear) / span) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {y}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function YearGroup({
  year,
  entries,
  ministereCode,
  portefeuille,
  reconduit,
  concurrent,
}: {
  year: number | null;
  entries: MergedCareerEntry[];
  ministereCode?: string | null;
  portefeuille?: string | null;
  reconduit: Map<string, number>;
  concurrent: Map<string, string[]>;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-4">
        <h3 className="font-display text-2xl tabular-nums text-bureau-200">
          {year ?? "Sans date"}
        </h3>
        <div className="h-px flex-1 bg-bureau-800/60" />
        <span className="text-[11px] tabular-nums text-bureau-600">
          {entries.length}
        </span>
      </div>
      <ul className="divide-y divide-bureau-800/40 border-t border-bureau-800/40">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            ministereCode={ministereCode}
            portefeuille={portefeuille}
            reconduitCount={reconduit.get(entry.id)}
            concurrentWith={concurrent.get(entry.id) ?? []}
          />
        ))}
      </ul>
    </div>
  );
}

function EntryRow({
  entry,
  ministereCode,
  portefeuille,
  reconduitCount,
  concurrentWith,
}: {
  entry: MergedCareerEntry;
  ministereCode?: string | null;
  portefeuille?: string | null;
  reconduitCount?: number;
  concurrentWith: string[];
}) {
  const revolvingKeywords =
    entry.categorie === "CARRIERE_PRIVEE" &&
    ministereCode &&
    entry.organisation
      ? matchRevolvingDoor(ministereCode, portefeuille ?? null, entry.organisation)
      : [];

  const start = formatDateShort(entry.dateDebut);
  const end = entry.dateFin ? formatDateShort(entry.dateFin) : "en cours";
  const duration = formatDuration(entry.dateDebut, entry.dateFin);

  const isOngoing = !entry.dateFin;

  return (
    <li
      id={`entry-${entry.id}`}
      className="scroll-mt-24 py-4 transition-colors target:border-l-2 target:border-teal target:bg-teal-500/[0.06] target:pl-3"
    >
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
              CATEGORY_TONE[entry.categorie]
            }`}
          >
            {CATEGORIE_LABEL[entry.categorie]}
          </span>
          {isOngoing && (
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-teal">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" />
              En cours
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-[15px] text-bureau-100">{entry.titre}</p>
          {reconduitCount && reconduitCount >= 2 && (
            <span className="rounded border border-teal/40 bg-teal-500/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-teal">
              Reconduit ×{reconduitCount}
            </span>
          )}
          {revolvingKeywords.length > 0 && (
            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-amber-400">
              Porte tournante
            </span>
          )}
          {concurrentWith.length > 0 && (
            <span
              title={`Simultané avec : ${concurrentWith.join(" · ")}`}
              className="rounded border border-bureau-600/50 bg-bureau-700/30 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-bureau-300"
            >
              Simultané
            </span>
          )}
        </div>
        {entry.organisation && (
          <p className="mt-0.5 text-sm text-bureau-400">{entry.organisation}</p>
        )}
        {entry.description && (
          <p className="mt-1.5 max-w-[68ch] text-[13px] italic leading-relaxed text-bureau-500">
            {entry.description}
          </p>
        )}
        <p className="mt-1.5 text-xs text-bureau-600">
          <span className="tabular-nums">
            {start && end ? `${start} – ${end}` : end}
          </span>
          {duration && <span className="ml-2 text-bureau-700">· {duration}</span>}
          <span className="ml-2 text-bureau-700">· {formatSources(entry)}</span>
        </p>
      </div>
    </li>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-bureau-500">
        {title}
      </h2>
      <div className="h-px flex-1 bg-bureau-800/60" />
    </div>
  );
}
