import { prisma } from "@/lib/db";
import { matchRevolvingDoor } from "@/lib/signal-types";
import { mergeCareerEntries, formatSources, type MergedCareerEntry } from "@/lib/career-merge";
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

// Order of sections on the page.
const CATEGORIE_ORDER: CategorieCarriere[] = [
  "MANDAT_GOUVERNEMENTAL",
  "MANDAT_ELECTIF",
  "FONCTION_PUBLIQUE",
  "CARRIERE_PRIVEE",
  "ORGANISME",
  "FORMATION",
  "AUTRE",
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

  // Current/active entries (no dateFin) float to the top regardless of category.
  const current = entries.filter((e) => !e.dateFin);
  const past = entries.filter((e) => e.dateFin);

  // Group past entries by category.
  const byCategory = new Map<CategorieCarriere, MergedCareerEntry[]>();
  for (const e of past) {
    const bucket = byCategory.get(e.categorie) ?? [];
    bucket.push(e);
    byCategory.set(e.categorie, bucket);
  }

  // Timeline data.
  const withDates = entries.filter((e) => e.dateDebut);
  const now = new Date();
  const minYear = withDates.length
    ? Math.min(...withDates.map((e) => (e.dateDebut as Date).getFullYear()))
    : null;
  const maxYear = withDates.length
    ? Math.max(
        ...withDates.map((e) =>
          e.dateFin ? (e.dateFin as Date).getFullYear() : now.getFullYear(),
        ),
      )
    : null;
  const span = minYear != null && maxYear != null ? maxYear - minYear : 0;

  return (
    <section className="space-y-10">
      <SectionHeader title="Parcours" />

      {/* Slim timeline rail */}
      {span > 0 && minYear != null && maxYear != null && (
        <Timeline
          entries={withDates}
          minYear={minYear}
          maxYear={maxYear}
          span={span}
        />
      )}

      {current.length > 0 && (
        <CategoryGroup
          label="En cours"
          entries={current}
          ministereCode={ministereCode}
          portefeuille={portefeuille}
          accent
        />
      )}

      {CATEGORIE_ORDER.filter((cat) => (byCategory.get(cat)?.length ?? 0) > 0).map(
        (cat) => (
          <CategoryGroup
            key={cat}
            label={CATEGORIE_LABEL[cat]}
            entries={byCategory.get(cat)!}
            ministereCode={ministereCode}
            portefeuille={portefeuille}
          />
        ),
      )}
    </section>
  );
}

function Timeline({
  entries,
  minYear,
  maxYear,
  span,
}: {
  entries: MergedCareerEntry[];
  minYear: number;
  maxYear: number;
  span: number;
}) {
  const now = new Date();
  const tickCount = Math.min(6, Math.floor(span / 5) + 1);
  const tickYears = Array.from({ length: tickCount }, (_, i) =>
    Math.round(minYear + (i * span) / Math.max(1, tickCount - 1)),
  );

  const segments = entries.map((e) => {
    const startY = (e.dateDebut as Date).getFullYear();
    const endY = e.dateFin ? (e.dateFin as Date).getFullYear() : now.getFullYear();
    return {
      id: e.id,
      leftPct: ((startY - minYear) / span) * 100,
      widthPct: Math.max(0.6, ((endY - startY) / span) * 100),
      categorie: e.categorie,
      label: `${e.titre} · ${startY}${e.dateFin ? `–${endY}` : "–en cours"}`,
    };
  });

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-[10px] uppercase tracking-[0.18em] text-bureau-500">
        <span>Chronologie</span>
        <span className="tabular-nums">
          {minYear} – {maxYear}
        </span>
      </div>
      <div className="relative h-6 rounded-sm bg-bureau-800/40">
        {segments.map((seg) => (
          <div
            key={seg.id}
            title={seg.label}
            className={`absolute top-0 bottom-0 ${segmentTone(seg.categorie)} hover:brightness-125`}
            style={{ left: `${seg.leftPct}%`, width: `${seg.widthPct}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-bureau-600">
        {tickYears.map((y) => (
          <span key={y}>{y}</span>
        ))}
      </div>
    </div>
  );
}

// A single desaturated blue for the timeline — replaces the chromatic scatter.
// Government roles get a slightly brighter tone to stand out; everything else
// uses the base tone.
function segmentTone(cat: CategorieCarriere): string {
  if (cat === "MANDAT_GOUVERNEMENTAL") return "bg-teal-500/60";
  return "bg-bureau-500/40";
}

function CategoryGroup({
  label,
  entries,
  ministereCode,
  portefeuille,
  accent = false,
}: {
  label: string;
  entries: MergedCareerEntry[];
  ministereCode?: string | null;
  portefeuille?: string | null;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
            accent ? "text-teal" : "text-bureau-400"
          }`}
        >
          {label}
        </h3>
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
}: {
  entry: MergedCareerEntry;
  ministereCode?: string | null;
  portefeuille?: string | null;
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

  return (
    <li className="py-3.5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-[15px] text-bureau-100">{entry.titre}</p>
            {revolvingKeywords.length > 0 && (
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-amber-400">
                Porte tournante
              </span>
            )}
          </div>
          {entry.organisation && (
            <p className="mt-0.5 text-sm text-bureau-400">{entry.organisation}</p>
          )}
          <p className="mt-1 text-xs text-bureau-600">
            <span className="tabular-nums">
              {start && end ? `${start} – ${end}` : end}
            </span>
            {duration && <span className="ml-2 text-bureau-700">· {duration}</span>}
            <span className="ml-2 text-bureau-700">· {formatSources(entry)}</span>
          </p>
        </div>
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
