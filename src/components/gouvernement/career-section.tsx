import { prisma } from "@/lib/db";
import { matchRevolvingDoor } from "@/lib/signal-types";
import type { CategorieCarriere, SourceCarriere } from "@prisma/client";

const CATEGORIE_LABEL: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "Gouvernement",
  MANDAT_ELECTIF: "Mandat électif",
  CARRIERE_PRIVEE: "Secteur privé",
  FONCTION_PUBLIQUE: "Fonction publique",
  FORMATION: "Formation",
  ORGANISME: "Organisme",
  AUTRE: "Autre",
};

const CATEGORIE_DOT: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "bg-teal-500",
  MANDAT_ELECTIF: "bg-blue-500",
  CARRIERE_PRIVEE: "bg-bureau-500",
  FONCTION_PUBLIQUE: "bg-amber-500",
  FORMATION: "bg-purple-500",
  ORGANISME: "bg-bureau-500",
  AUTRE: "bg-bureau-600",
};

const CATEGORIE_BAND: Record<CategorieCarriere, string> = {
  MANDAT_GOUVERNEMENTAL: "bg-teal-500/70",
  MANDAT_ELECTIF: "bg-blue-500/70",
  CARRIERE_PRIVEE: "bg-rose-500/50",
  FONCTION_PUBLIQUE: "bg-amber-500/60",
  FORMATION: "bg-purple-500/60",
  ORGANISME: "bg-bureau-500/50",
  AUTRE: "bg-bureau-600/50",
};

const SOURCE_LABEL: Partial<Record<SourceCarriere, string>> = {
  HATVP: "HATVP",
  ASSEMBLEE: "Assemblée nationale",
  PRESSE: "Presse",
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
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
  const entries = await prisma.entreeCarriere.findMany({
    where: { personnaliteId },
    orderBy: [{ dateDebut: "desc" }, { ordre: "asc" }],
  });

  const hasPresseSource = entries.some((e) => e.source === "PRESSE");

  // Build the horizontal frieze data:
  // pick a start year (earliest known dateDebut) and end year (latest known or today)
  const entriesWithDates = entries.filter((e) => e.dateDebut);
  const now = new Date();
  const minYear = entriesWithDates.length
    ? Math.min(
        ...entriesWithDates.map((e) => (e.dateDebut as Date).getFullYear()),
      )
    : null;
  const maxYear = entriesWithDates.length
    ? Math.max(
        ...entriesWithDates.map((e) =>
          e.dateFin
            ? (e.dateFin as Date).getFullYear()
            : now.getFullYear(),
        ),
      )
    : null;
  const span = minYear != null && maxYear != null ? maxYear - minYear : 0;

  const friezeSegments =
    minYear != null && maxYear != null && span > 0
      ? entriesWithDates.map((e) => {
          const startY = (e.dateDebut as Date).getFullYear();
          const endY = e.dateFin
            ? (e.dateFin as Date).getFullYear()
            : now.getFullYear();
          const leftPct = ((startY - minYear) / span) * 100;
          const widthPct = Math.max(0.8, ((endY - startY) / span) * 100);
          return {
            id: e.id,
            leftPct,
            widthPct,
            categorie: e.categorie,
            titre: e.titre,
            years: `${startY}–${e.dateFin ? endY : "…"}`,
          };
        })
      : [];

  // Simple tick years every 5y
  const tickYears =
    minYear != null && maxYear != null
      ? Array.from(
          { length: Math.floor(span / 5) + 1 },
          (_, i) => minYear + i * 5,
        ).filter((y) => y <= maxYear)
      : [];

  return (
    <section>
      <SectionHeader title="Parcours" />

      {/* Horizontal frieze */}
      {friezeSegments.length > 0 && span > 0 && (
        <div className="mb-8 rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-4">
          <div className="mb-2 flex items-baseline justify-between text-[10px] uppercase tracking-[0.15em] text-bureau-600">
            <span>Frise chronologique</span>
            <span className="tabular-nums text-bureau-500">
              {minYear} → {maxYear}
            </span>
          </div>

          {/* Bar */}
          <div className="relative h-7 rounded-md bg-bureau-900/50">
            {friezeSegments.map((seg) => (
              <div
                key={seg.id}
                title={`${seg.titre} · ${seg.years}`}
                className={`absolute top-0 bottom-0 ${CATEGORIE_BAND[seg.categorie]} rounded-[3px] hover:ring-2 hover:ring-bureau-100/40 transition-shadow`}
                style={{
                  left: `${seg.leftPct}%`,
                  width: `${seg.widthPct}%`,
                }}
              />
            ))}
          </div>

          {/* Year ticks */}
          {tickYears.length > 0 && (
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-bureau-600">
              {tickYears.map((y) => (
                <span key={y}>{y}</span>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-bureau-500">
            {(
              [
                "MANDAT_GOUVERNEMENTAL",
                "MANDAT_ELECTIF",
                "CARRIERE_PRIVEE",
                "FONCTION_PUBLIQUE",
                "FORMATION",
                "ORGANISME",
              ] as CategorieCarriere[]
            )
              .filter((c) => entries.some((e) => e.categorie === c))
              .map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-sm ${CATEGORIE_BAND[c]}`} />
                  {CATEGORIE_LABEL[c]}
                </span>
              ))}
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <Placeholder text="Données de parcours en cours de collecte." />
      ) : (
        <div className="space-y-5">
          {/* Timeline */}
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-bureau-700/40" />

            {entries.map((entry, i) => {
              const isLast = i === entries.length - 1;
              const sourceLabel = entry.source !== "MANUELLE" ? SOURCE_LABEL[entry.source] : null;

              const dateStr = (() => {
                const start = formatDate(entry.dateDebut);
                if (!entry.dateFin) {
                  return start ? `${start} – en cours` : "en cours";
                }
                const end = formatDate(entry.dateFin);
                return start ? `${start} – ${end}` : end;
              })();

              // Revolving door detection for private-sector entries
              const revolvingKeywords =
                entry.categorie === "CARRIERE_PRIVEE" &&
                ministereCode &&
                entry.organisation
                  ? matchRevolvingDoor(ministereCode, portefeuille ?? null, entry.organisation)
                  : [];

              return (
                <div
                  key={entry.id}
                  className={`relative flex gap-4 ${isLast ? "" : "pb-5"}`}
                >
                  {/* Dot */}
                  <div className="relative z-10 mt-1 shrink-0">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ring-2 ring-bureau-900 ${
                        revolvingKeywords.length > 0
                          ? "bg-amber-500 ring-amber-500/20"
                          : CATEGORIE_DOT[entry.categorie]
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
                      <p className="text-sm text-bureau-200">{entry.titre}</p>
                      <span className="rounded border border-bureau-700/30 bg-bureau-800/30 px-1 py-px text-[10px] text-bureau-500">
                        {CATEGORIE_LABEL[entry.categorie]}
                      </span>
                      {revolvingKeywords.length > 0 && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-px text-[10px] font-medium text-amber-400">
                          Porte tournante
                        </span>
                      )}
                    </div>

                    {entry.organisation && (
                      <p className="mt-0.5 text-xs text-bureau-400">
                        {entry.organisation}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {dateStr && (
                        <span className="text-xs tabular-nums text-bureau-500">
                          {dateStr}
                        </span>
                      )}
                      {sourceLabel && (
                        <span className="text-xs text-bureau-600">
                          · {sourceLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Partial data notice */}
          {!hasPresseSource && (
            <p className="text-xs text-bureau-600">
              Parcours partiel — sources structurées uniquement
              {entries.some((e) => e.source === "HATVP") ? " (HATVP" : ""}
              {entries.some((e) => e.source === "ASSEMBLEE") ? ", Assemblée nationale" : ""}
              {entries.some((e) => e.source === "HATVP") || entries.some((e) => e.source === "ASSEMBLEE") ? ")" : ""}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        {title}
      </h2>
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-4 py-3 text-xs text-bureau-500">
      {text}
    </div>
  );
}
