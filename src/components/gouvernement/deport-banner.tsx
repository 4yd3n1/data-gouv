import { prisma } from "@/lib/db";

export async function DeportBanner({
  personnaliteId,
  hatvpTabHref,
}: {
  personnaliteId: string;
  hatvpTabHref: string;
}) {
  const deports = await prisma.decretDeport.findMany({
    where: { personnaliteId },
    orderBy: { dateDecret: "desc" },
    select: { jorfRef: true, perimetre: true },
  });

  if (deports.length === 0) return null;

  const primary = deports[0];
  const extra = deports.length - 1;

  return (
    <div className="mx-auto max-w-6xl px-6">
      <a
        href={hatvpTabHref}
        className="group relative block rounded-r-sm border-l-2 border-rose-800/60 bg-rose-950/15 py-3.5 pl-5 pr-4 transition-colors hover:bg-rose-950/25"
      >
        <span className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-rose" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400">
                Déport officiel
              </span>
              <span className="text-[11px] text-bureau-600">
                Registre de prévention des conflits d&apos;intérêts
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-bureau-200">
              {deports.length === 1
                ? "Un décret"
                : `${deports.length} décrets`}{" "}
              interdi{deports.length === 1 ? "t" : "sent"} à ce ministre de
              statuer sur&nbsp;:{" "}
              <span className="text-bureau-100">{primary.perimetre}</span>
              {extra > 0 && (
                <span className="text-bureau-500">
                  {" "}
                  et {extra} autre{extra > 1 ? "s" : ""} périmètre
                  {extra > 1 ? "s" : ""}
                </span>
              )}
              {primary.jorfRef && (
                <span className="ml-2 text-[11px] tabular-nums text-bureau-500">
                  Décret n° {primary.jorfRef}
                </span>
              )}
            </p>
          </div>
          <span className="shrink-0 self-start text-xs text-bureau-500 transition-colors group-hover:text-bureau-300">
            Voir le détail →
          </span>
        </div>
      </a>
    </div>
  );
}
