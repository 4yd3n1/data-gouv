import { prisma } from "@/lib/db";

export async function LobbySection({
  ministereCode,
}: {
  ministereCode: string | null;
}) {
  if (!ministereCode) {
    return (
      <section>
        <SectionHeader title="Lobbying déclaré" />
        <Placeholder text="Code ministère non référencé." />
      </section>
    );
  }

  const actions = await prisma.actionLobby.findMany({
    where: { ministereCode },
    select: {
      representantNom: true,
      representantCategorie: true,
      domaine: true,
      exercice: true,
      typeAction: true,
      depensesTranche: true,
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  if (actions.length === 0) {
    return (
      <section>
        <SectionHeader title="Lobbying déclaré ciblant ce ministère" />
        <Placeholder text="Aucune action déclarée ciblant ce ministère." />
      </section>
    );
  }

  // Group by representantNom for top orgs
  const orgCounts = new Map<string, number>();
  for (const a of actions) {
    orgCounts.set(a.representantNom, (orgCounts.get(a.representantNom) ?? 0) + 1);
  }
  const topOrgs = [...orgCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Group by domain (domains can be comma-separated)
  const domainCounts = new Map<string, number>();
  for (const a of actions) {
    if (!a.domaine) continue;
    for (const d of a.domaine.split(",").map((s) => s.trim()).filter(Boolean)) {
      domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    }
  }
  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Year range
  const years = [...new Set(actions.map((a) => a.exercice).filter(Boolean))].sort();
  const yearRange =
    years.length > 1
      ? `${years[0]}–${years[years.length - 1]}`
      : (years[0] ?? null);

  return (
    <section>
      <SectionHeader title="Lobbying déclaré ciblant ce ministère" />

      <div className="space-y-5">
        {/* Summary */}
        <p className="text-sm text-bureau-400">
          <span className="font-semibold text-bureau-200">{actions.length.toLocaleString("fr-FR")}</span>{" "}
          action{actions.length > 1 ? "s" : ""} de lobbying déclarée{actions.length > 1 ? "s" : ""}
          {yearRange ? ` · ${yearRange}` : ""}
        </p>

        {/* Top organizations */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-bureau-500">
            Principales organisations
          </p>
          <div className="space-y-1.5">
            {topOrgs.map(([nom, count]) => (
              <div
                key={nom}
                className="flex items-center justify-between rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-3 py-2"
              >
                <span className="text-xs text-bureau-300">{nom}</span>
                <span className="ml-4 shrink-0 text-xs tabular-nums text-bureau-500">
                  {count} action{count > 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Domain breakdown */}
        {topDomains.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-bureau-500">
              Domaines d'intervention
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topDomains.map(([domaine, count]) => (
                <span
                  key={domaine}
                  className="rounded-md border border-bureau-700/30 bg-bureau-800/30 px-2 py-0.5 text-xs text-bureau-400"
                >
                  {domaine}
                  <span className="ml-1 text-bureau-600">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source note */}
        <p className="text-xs text-bureau-600">
          Source :{" "}
          <a
            href="https://www.agora-lobbying.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bureau-500 underline-offset-2 hover:text-bureau-300 hover:underline"
          >
            Registre AGORA / HATVP
          </a>
          {" · "}
          Données déclarées par les représentants d'intérêts
        </p>
      </div>
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
