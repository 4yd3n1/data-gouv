import { prisma } from "@/lib/db";
import type { TypeEvenement, StatutEvenement } from "@prisma/client";

// CRITICAL: Only display events where verifie = true
// Unverified events must never appear on public pages.

const TYPE_LABEL: Record<TypeEvenement, string> = {
  ENQUETE_PRELIMINAIRE: "Enquête préliminaire",
  MISE_EN_EXAMEN: "Mise en examen",
  RENVOI_CORRECTIONNELLE: "Renvoi en correctionnelle",
  CONDAMNATION: "Condamnation",
  RELAXE: "Relaxe",
  CLASSEMENT_SANS_SUITE: "Classement sans suite",
  NON_LIEU: "Non-lieu",
  APPEL: "Appel",
  GARDE_A_VUE: "Garde à vue",
  COUR_JUSTICE_REPUBLIQUE: "Cour de justice de la République",
};

const STATUT_LABEL: Record<StatutEvenement, string> = {
  EN_COURS: "En cours",
  CLOS: "Clos",
  APPEL_EN_COURS: "Appel en cours",
};

const TYPE_SEVERITY: Partial<Record<TypeEvenement, "high" | "medium" | "low">> = {
  CONDAMNATION: "high",
  RENVOI_CORRECTIONNELLE: "high",
  MISE_EN_EXAMEN: "medium",
  COUR_JUSTICE_REPUBLIQUE: "medium",
  GARDE_A_VUE: "medium",
  APPEL: "medium",
  ENQUETE_PRELIMINAIRE: "low",
  RELAXE: "low",
  NON_LIEU: "low",
  CLASSEMENT_SANS_SUITE: "low",
};

const SEVERITY_DOT: Record<"high" | "medium" | "low", string> = {
  high: "bg-rose-500",
  medium: "bg-amber-400",
  low: "bg-bureau-500",
};

const STATUT_BADGE: Record<StatutEvenement, string> = {
  EN_COURS: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  CLOS: "text-bureau-400 bg-bureau-800/30 border-bureau-700/30",
  APPEL_EN_COURS: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function JudiciaireSection({
  personnaliteId,
}: {
  personnaliteId: string;
}) {
  // CRITICAL: only fetch verified events
  const events = await prisma.evenementJudiciaire.findMany({
    where: { personnaliteId, verifie: true },
    orderBy: { date: "desc" },
  });

  if (events.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeader title="Affaires judiciaires" count={events.length} />

      {/* Legal context notice */}
      <p className="mb-4 text-xs text-bureau-600">
        Les procédures suivantes sont issues de sources de presse Tier 1–2 et vérifiées manuellement.
        Mise en examen ne vaut pas condamnation. Toute procédure classée ou ayant abouti à une relaxe ou un non-lieu est mentionnée avec son issue.
      </p>

      <div className="space-y-4">
        {events.map((ev) => {
          const severity = TYPE_SEVERITY[ev.type] ?? "low";
          const dot = SEVERITY_DOT[severity];
          const statusBadge = STATUT_BADGE[ev.statut];

          return (
            <div
              key={ev.id}
              className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-4"
            >
              <div className="flex items-start gap-3">
                {/* Severity dot */}
                <div className="mt-1 shrink-0">
                  <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-bureau-200">
                      {TYPE_LABEL[ev.type]}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-px text-[10px] font-medium ${statusBadge}`}
                    >
                      {STATUT_LABEL[ev.statut]}
                    </span>
                    {ev.date && (
                      <span className="text-xs tabular-nums text-bureau-500">
                        {formatDate(ev.date)}
                      </span>
                    )}
                  </div>

                  {/* Nature */}
                  {ev.nature && (
                    <p className="mt-1 text-xs text-bureau-400">{ev.nature}</p>
                  )}

                  {/* Juridiction */}
                  {ev.juridiction && (
                    <p className="mt-0.5 text-xs text-bureau-600">
                      {ev.juridiction}
                    </p>
                  )}

                  {/* Resume */}
                  <p className="mt-2 text-sm leading-relaxed text-bureau-300">
                    {ev.resume}
                  </p>

                  {/* Source */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-bureau-600">
                    <span>Source :</span>
                    {ev.sourceUrl ? (
                      <a
                        href={ev.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bureau-500 underline decoration-bureau-700 hover:text-bureau-300"
                      >
                        {ev.sourcePrincipale}
                        {ev.sourceDate && (
                          <span className="ml-1">
                            ({formatDate(ev.sourceDate)})
                          </span>
                        )}
                      </a>
                    ) : (
                      <span>{ev.sourcePrincipale}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        {title}
      </h2>
      <span className="rounded border border-rose-800/30 bg-rose-900/10 px-1.5 py-px text-[10px] text-rose-400">
        {count}
      </span>
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}
