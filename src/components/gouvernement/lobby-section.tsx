import Link from "next/link";
import { prisma } from "@/lib/db";

async function fetchLobbyRoles(personnaliteId: string | null | undefined) {
  if (!personnaliteId) return [];
  return prisma.lobbyisteDirigeant.findMany({
    where: { personnaliteId },
    include: {
      lobbyiste: { select: { id: true, nom: true, categorieActivite: true } },
    },
    orderBy: [{ dateFin: "asc" }, { dateDebut: "desc" }],
  });
}

function yearRange(d: Date | null, end: Date | null): string {
  if (!d && !end) return "";
  const y1 = d ? d.getUTCFullYear() : "";
  const y2 = end ? end.getUTCFullYear() : d ? "présent" : "";
  return `${y1}${y1 && y2 ? " → " : ""}${y2}`;
}

export async function LobbySection({
  ministereCode,
  personnaliteId,
}: {
  ministereCode: string | null;
  personnaliteId?: string | null;
}) {
  const lobbyRoles = await fetchLobbyRoles(personnaliteId);
  const hasLobbyRoles = lobbyRoles.length > 0;

  if (!ministereCode) {
    return (
      <section className="space-y-8">
        <div>
          <SectionHeader title="Lobbying déclaré ciblant ce portefeuille" />
          <Placeholder text="Aucune action de lobby enregistrée par la HATVP pour ce portefeuille." />
        </div>
        {hasLobbyRoles && <LobbyRolesBlock roles={lobbyRoles} />}
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

  // Fetch career organisations for this person to detect overlaps
  const careerOrgs: string[] = personnaliteId
    ? (
        await prisma.entreeCarriere.findMany({
          where: {
            personnaliteId,
            categorie: "CARRIERE_PRIVEE",
            organisation: { not: null },
          },
          select: { organisation: true },
        })
      )
        .map((e) => e.organisation!)
        .filter(Boolean)
    : [];

  if (actions.length === 0) {
    return (
      <section className="space-y-8">
        <div>
          <SectionHeader title="Lobbying déclaré ciblant ce ministère" />
          <Placeholder text="Aucune action déclarée ciblant ce ministère." />
        </div>
        {hasLobbyRoles && <LobbyRolesBlock roles={lobbyRoles} />}
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

  // Check which top orgs match a career organisation
  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const careerNorms = careerOrgs.map(normalize);
  const matchesCareer = (lobbyOrg: string) => {
    const norm = normalize(lobbyOrg);
    return careerNorms.some((cn) => norm.includes(cn) || cn.includes(norm));
  };

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
    <section className="space-y-8">
      {hasLobbyRoles && <LobbyRolesBlock roles={lobbyRoles} />}
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
            {topOrgs.map(([nom, count]) => {
              const isFormerEmployer = matchesCareer(nom);
              return (
                <div
                  key={nom}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    isFormerEmployer
                      ? "border-amber-600/30 bg-amber-950/20"
                      : "border-bureau-700/20 bg-bureau-800/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-bureau-300">{nom}</span>
                    {isFormerEmployer && (
                      <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1 py-px text-[10px] font-medium text-amber-400">
                        Ancien employeur
                      </span>
                    )}
                  </div>
                  <span className="ml-4 shrink-0 text-xs tabular-nums text-bureau-500">
                    {count} action{count > 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
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

type LobbyRole = Awaited<ReturnType<typeof fetchLobbyRoles>>[number];

function LobbyRolesBlock({ roles }: { roles: LobbyRole[] }) {
  const currentCount = roles.filter((r) => r.dateFin == null).length;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-rose-400">
          Dirigeant{roles.length > 1 ? "s" : ""} de lobby
        </h2>
        <div className="h-px flex-1 bg-rose-700/30" />
      </div>
      <div className="rounded-xl border border-rose-600/30 bg-rose-950/10 px-4 py-3">
        <p className="mb-3 text-xs text-rose-200/80">
          Cette personne figure{" "}
          {currentCount > 0
            ? `actuellement parmi les dirigeants déclarés de ${currentCount} organisation${currentCount > 1 ? "s" : ""} inscrite${currentCount > 1 ? "s" : ""} au registre HATVP`
            : `parmi les anciens dirigeants déclarés d'au moins une organisation inscrite au registre HATVP`}
          .
        </p>
        <ul className="space-y-2">
          {roles.map((r) => {
            const isCurrent = r.dateFin == null;
            const range = yearRange(r.dateDebut, r.dateFin);
            return (
              <li
                key={r.id}
                className="flex items-start justify-between gap-4 border-t border-rose-700/20 pt-2 first:border-t-0 first:pt-0"
              >
                <div>
                  <Link
                    href={`/profils/lobbyistes/${r.lobbyiste.id}`}
                    className="text-sm font-medium text-bureau-100 underline-offset-2 hover:underline"
                  >
                    {r.lobbyiste.nom}
                  </Link>
                  <div className="mt-1 text-xs text-bureau-400">
                    {r.fonction ?? "Dirigeant"}
                    {r.lobbyiste.categorieActivite
                      ? ` · ${r.lobbyiste.categorieActivite}`
                      : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${
                      isCurrent
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {isCurrent ? "En fonction" : "Ancien"}
                  </span>
                  {range && (
                    <div className="mt-1 text-[10px] tabular-nums text-bureau-500">
                      {range}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
