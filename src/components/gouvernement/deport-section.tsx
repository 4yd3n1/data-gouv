import { prisma } from "@/lib/db";
import type { BasisDeport } from "@prisma/client";

const BASIS_LABEL: Record<BasisDeport, string> = {
  ANCIEN_EMPLOYEUR: "Ancien employeur",
  PARTICIPATION_FINANCIERE: "Participation financière",
  FAMILLE_CONJOINT: "Liens familiaux",
  MANDAT_ANTERIEUR: "Mandat antérieur",
  ACTIVITE_BENEVOLE: "Activité bénévole",
  PROCEDURE_JUDICIAIRE: "Procédure judiciaire",
  AUTRE: "Autre",
};

const BASIS_BADGE: Record<BasisDeport, string> = {
  ANCIEN_EMPLOYEUR: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  PARTICIPATION_FINANCIERE: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  FAMILLE_CONJOINT: "border-amber-800/40 bg-amber-900/10 text-amber-300",
  MANDAT_ANTERIEUR: "border-amber-800/40 bg-amber-900/10 text-amber-300",
  ACTIVITE_BENEVOLE: "border-amber-800/40 bg-amber-900/10 text-amber-300",
  PROCEDURE_JUDICIAIRE: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  AUTRE: "border-bureau-700/40 bg-bureau-800/30 text-bureau-300",
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function DeportSection({
  personnaliteId,
}: {
  personnaliteId: string;
}) {
  const deports = await prisma.decretDeport.findMany({
    where: { personnaliteId },
    orderBy: { dateDecret: "desc" },
  });

  if (deports.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-400">
          Décrets de déport
        </h2>
        <span className="rounded border border-rose-800/40 bg-rose-900/10 px-1.5 py-px text-[10px] text-rose-400">
          {deports.length}
        </span>
        <div className="h-px flex-1 bg-bureau-700/30" />
      </div>

      <p className="mb-4 text-xs text-bureau-500">
        Actes pour lesquels le ministre ne peut décider en raison d&apos;une
        situation de conflit d&apos;intérêts. Source : registre de prévention
        des conflits d&apos;intérêts, services du Premier ministre.
      </p>

      <div className="space-y-4">
        {deports.map((d) => (
          <article
            key={d.id}
            className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-4"
          >
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className={`rounded border px-2 py-0.5 text-[10px] font-medium ${BASIS_BADGE[d.basis]}`}
              >
                {BASIS_LABEL[d.basis]}
              </span>
              {d.jorfRef && (
                <span className="text-xs font-medium text-bureau-200 tabular-nums">
                  Décret n° {d.jorfRef}
                </span>
              )}
              {d.dateDecret && (
                <span className="text-xs tabular-nums text-bureau-500">
                  {formatDate(d.dateDecret)}
                </span>
              )}
            </header>

            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-bureau-600">
                Périmètre récusé
              </p>
              <p className="mt-1 text-sm leading-relaxed text-bureau-200">
                {d.perimetre}
              </p>
            </div>

            {d.basisDetail && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-bureau-600">
                  Motif
                </p>
                <p className="mt-1 text-sm leading-relaxed text-bureau-300">
                  {d.basisDetail}
                </p>
              </div>
            )}

            {d.sourceUrl && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-bureau-600">
                <span>Source :</span>
                <a
                  href={d.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bureau-500 underline decoration-bureau-700 hover:text-bureau-300"
                >
                  {d.sourceOutlet ?? "info.gouv.fr"}
                </a>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
