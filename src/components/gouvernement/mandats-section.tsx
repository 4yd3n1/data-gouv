import type { MandatGouvernemental } from "@prisma/client";

const TYPE_LABEL: Record<string, string> = {
  PRESIDENT: "Président de la République",
  PREMIER_MINISTRE: "Premier ministre",
  MINISTRE: "Ministre",
  MINISTRE_DELEGUE: "Ministre délégué",
  SECRETAIRE_ETAT: "Secrétaire d'État",
};

export function MandatsSection({
  mandats,
}: {
  mandats: MandatGouvernemental[];
}) {
  if (mandats.length === 0) {
    return (
      <section>
        <SectionHeader title="Mandats gouvernementaux" />
        <p className="text-sm text-bureau-500">Aucun mandat gouvernemental référencé.</p>
      </section>
    );
  }

  // Sort: current mandates first (dateFin = null), then by dateDebut desc
  const sorted = [...mandats].sort((a, b) => {
    if (!a.dateFin && b.dateFin) return -1;
    if (a.dateFin && !b.dateFin) return 1;
    return b.dateDebut.getTime() - a.dateDebut.getTime();
  });

  return (
    <section>
      <SectionHeader title="Mandats gouvernementaux" count={mandats.length} />
      <ol className="relative space-y-4 border-l border-bureau-700/30 pl-6">
        {sorted.map((m) => {
          const isActive = m.dateFin === null;
          return (
            <li key={m.id} className="relative">
              {/* Timeline dot */}
              <span
                className={`absolute -left-[1.625rem] mt-1.5 h-3 w-3 rounded-full border-2 ${
                  isActive
                    ? "border-teal bg-teal/40"
                    : "border-bureau-700 bg-bureau-800"
                }`}
              />
              <div>
                <div className="flex flex-wrap items-start gap-2">
                  <h3 className="text-sm font-semibold text-bureau-100">
                    {m.titre}
                  </h3>
                  {isActive && (
                    <span className="rounded-md bg-teal/10 px-1.5 py-0.5 text-xs font-medium text-teal">
                      En cours
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-bureau-400">
                  {TYPE_LABEL[m.type] ?? m.type}
                  {m.gouvernement ? ` · ${m.gouvernement}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-bureau-500">
                  {m.dateDebut.toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                  {m.dateFin
                    ? ` — ${m.dateFin.toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}`
                    : " — en exercice"}
                </p>
                {m.portefeuille && (
                  <p className="mt-1.5 text-xs text-bureau-400 leading-relaxed max-w-prose">
                    {m.portefeuille}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-xs text-bureau-500">({count})</span>
      )}
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}
