import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import {
  POWER_LOBBYISTS,
  CONSULTING_LOBBYISTS,
  MUTUALITE_SIRENS,
  ALL_CURATED_SIRENS,
  TYPE_CONFIG,
} from "@/data/lobbyists-curated";

const LOBBY_DOMAIN_KEYWORDS: Array<{
  keywords: string[];
  tag: string;
  label: string;
}> = [
  {
    keywords: ["santé", "sante", "pharma", "médic"],
    tag: "sante",
    label: "Santé",
  },
  {
    keywords: [
      "énergi",
      "energi",
      "environnement",
      "climat",
      "écolog",
      "ecolog",
    ],
    tag: "ecologie",
    label: "Écologie & Énergie",
  },
  {
    keywords: ["fiscal", "taxe", "impôt", "impot", "tva", "csg"],
    tag: "fiscalite",
    label: "Fiscalité",
  },
  {
    keywords: ["budget", "finance", "dette", "dépenses", "depenses"],
    tag: "budget",
    label: "Budget & Finances",
  },
  {
    keywords: ["travail", "emploi", "social", "salaire", "formation"],
    tag: "travail",
    label: "Emploi & Travail",
  },
  {
    keywords: ["logement", "habitat", "immobil", "hlm", "construct"],
    tag: "logement",
    label: "Logement",
  },
  {
    keywords: ["agriculture", "agri", "alimentair", "rural", "pac"],
    tag: "agriculture",
    label: "Agriculture",
  },
  {
    keywords: ["sécurité", "securite", "justice", "pénal"],
    tag: "securite",
    label: "Sécurité & Justice",
  },
  { keywords: ["retraite", "pension"], tag: "retraites", label: "Retraites" },
  {
    keywords: ["éducation", "education", "enseignement", "école", "univer"],
    tag: "education",
    label: "Éducation",
  },
];

function matchDomainToTag(
  domaine: string,
): { tag: string; label: string } | null {
  const lower = domaine.toLowerCase();
  for (const m of LOBBY_DOMAIN_KEYWORDS) {
    if (m.keywords.some((kw) => lower.includes(kw))) {
      return { tag: m.tag, label: m.label };
    }
  }
  return null;
}

export async function PresidentLobbyingSection() {
  const [lobbyDomains, curatedActionGroups, scrutinTagCounts] =
    await Promise.all([
      prisma.actionLobbyiste.groupBy({
        by: ["domaine"],
        _count: { id: true },
        where: { domaine: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),
      prisma.actionLobbyiste.groupBy({
        by: ["lobbyisteId"],
        _count: { id: true },
        where: { lobbyisteId: { in: ALL_CURATED_SIRENS } },
      }),
      prisma.scrutinTag.groupBy({
        by: ["tag"],
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
      }),
    ]);

  const sirenActionMap = new Map(
    curatedActionGroups.map((g) => [g.lobbyisteId, g._count.id]),
  );

  function getCuratedActions(sirens: string[]): number {
    return sirens.reduce((sum, s) => sum + (sirenActionMap.get(s) ?? 0), 0);
  }

  const totalLobbyActions = lobbyDomains.reduce(
    (s, d) => s + d._count.id,
    0,
  );
  const totalMutualiteActions = getCuratedActions(MUTUALITE_SIRENS);
  const totalCuratedActions = [...POWER_LOBBYISTS, ...CONSULTING_LOBBYISTS].reduce(
    (s, l) => s + getCuratedActions(l.sirens),
    0,
  );

  const tagCountMap = new Map(
    scrutinTagCounts.map((t) => [t.tag, t._count.tag]),
  );

  return (
    <div className="space-y-10 fade-up">

      {/* Overview */}
      <section>
        <div className="mb-1 flex items-end justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Acteurs clés du lobbying (registre HATVP)
          </h2>
          <span className="text-[10px] text-bureau-600 uppercase tracking-widest">
            toutes périodes confondues
          </span>
        </div>
        <p className="mb-4 text-xs text-bureau-600">
          Le registre HATVP compte 3 883 organisations. Ce tableau filtre les 10 acteurs
          les plus influents — la Mutualité Française (13 entités régionales autonomes) est
          consolidée ici en une seule entrée. Les cabinets de conseil agissent pour le compte
          de clients non divulgués par la loi.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">
              Actions déclarées (total)
            </p>
            <p className="mt-2 text-3xl font-bold text-amber">
              {fmt(totalLobbyActions)}
            </p>
          </div>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">
              Mutualité Française (consolidée)
            </p>
            <p className="mt-2 text-3xl font-bold text-amber">
              {fmt(totalMutualiteActions)}
            </p>
            <p className="text-[10px] text-bureau-600 mt-1">actions · 13 entités</p>
          </div>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">
              Acteurs sélectionnés
            </p>
            <p className="mt-2 text-3xl font-bold text-amber">
              {fmt(totalCuratedActions)}
            </p>
            <p className="text-[10px] text-bureau-600 mt-1">actions · 10 organisations</p>
          </div>
        </div>
      </section>

      {/* Power lobbyists */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Groupes d&apos;intérêt directs · 7 acteurs clés
        </h2>
        <div className="space-y-3">
          {POWER_LOBBYISTS.map((org) => {
            const actions = getCuratedActions(org.sirens);
            const tc = TYPE_CONFIG[org.type];
            return (
              <div
                key={org.id}
                className={`rounded-xl border ${tc.border} ${tc.bg} p-5`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] uppercase tracking-widest font-medium ${tc.color}`}
                      >
                        {tc.label}
                      </span>
                      <span className="text-[10px] text-bureau-600">
                        {org.secteur}
                      </span>
                    </div>
                    <p className="text-base font-semibold text-bureau-100">
                      {org.nom}
                    </p>
                  </div>
                  {actions > 0 && (
                    <div className="shrink-0 text-right">
                      <p className={`text-xl font-bold ${tc.color}`}>
                        {fmt(actions)}
                      </p>
                      <p className="text-[10px] text-bureau-600">actions HATVP</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-2 text-xs">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-bureau-500 w-16">Direction</span>
                    <span className="text-bureau-300">{org.leader}</span>
                  </div>
                  {"membres" in org && org.membres && (
                    <div className="flex gap-2">
                      <span className="shrink-0 text-bureau-500 w-16">Membres</span>
                      <span className="text-bureau-400">{org.membres}</span>
                    </div>
                  )}
                  {"victoireLegislative" in org && org.victoireLegislative && (
                    <div className="flex gap-2">
                      <span className="shrink-0 text-bureau-500 w-16">Victoire</span>
                      <span className="text-bureau-300">{org.victoireLegislative}</span>
                    </div>
                  )}
                  {"connexionMacron" in org && org.connexionMacron && (
                    <div className="flex gap-2">
                      <span className="shrink-0 text-bureau-500 w-16">Connexion</span>
                      <span className="text-bureau-400 italic">
                        {org.connexionMacron}
                      </span>
                    </div>
                  )}
                </div>

                {"alerte" in org && org.alerte && (
                  <div className="mt-3 rounded-lg border border-rose/20 bg-rose/5 px-3 py-2 text-xs text-rose/80">
                    Alerte : {org.alerte}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Consulting firms */}
      <section>
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Cabinets de conseil pour compte de tiers · 3 firmes
        </h2>
        <p className="mb-4 text-xs text-bureau-600">
          Ces firmes sont enregistrées au nom de leurs propres structures mais agissent pour des
          clients payants non divulgués. Leur volume d&apos;actions reflète leur portefeuille de
          mandats, non leur propre intérêt sectoriel.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CONSULTING_LOBBYISTS.map((org) => {
            const actions = getCuratedActions(org.sirens);
            const tc = TYPE_CONFIG[org.type];
            return (
              <div
                key={org.id}
                className={`rounded-xl border ${tc.border} ${tc.bg} p-4 flex flex-col gap-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-bureau-100">
                    {org.nom}
                  </p>
                  {actions > 0 && (
                    <span className={`text-sm font-bold shrink-0 ${tc.color}`}>
                      {fmt(actions)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-bureau-500 uppercase tracking-widest -mt-1">
                  {org.secteur}
                </p>
                {"leader" in org && org.leader && (
                  <div>
                    <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">
                      Direction
                    </p>
                    <p className="text-xs text-bureau-300">{org.leader}</p>
                  </div>
                )}
                {"connexionMacron" in org && org.connexionMacron && (
                  <div>
                    <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">
                      Réseau & parcours
                    </p>
                    <p className="text-xs text-bureau-400">
                      {org.connexionMacron}
                    </p>
                  </div>
                )}
                {"note" in org && org.note && (
                  <div>
                    <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">
                      À noter
                    </p>
                    <p className="text-xs text-bureau-400">{org.note}</p>
                  </div>
                )}
                {"alerte" in org && org.alerte && (
                  <div className="rounded-lg border border-amber/20 bg-amber/5 px-3 py-2">
                    <p className="text-[10px] text-amber/80 uppercase tracking-widest mb-0.5">
                      Conflit potentiel
                    </p>
                    <p className="text-xs text-bureau-300">{org.alerte}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Domain cross-reference */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Domaines · croisés avec les votes au Parlement
        </h2>
        <div className="space-y-2">
          {lobbyDomains
            .filter((d) => d.domaine)
            .slice(0, 10)
            .map((d) => {
              const match = matchDomainToTag(d.domaine!);
              const voteCount = match
                ? (tagCountMap.get(match.tag) ?? 0)
                : 0;
              return (
                <div
                  key={d.domaine}
                  className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-xs text-bureau-300 truncate flex-1">
                      {d.domaine}
                    </p>
                    <span className="text-xs font-semibold text-amber shrink-0">
                      {fmt(d._count.id)} actions
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-bureau-700/30 mb-1.5">
                    <div
                      className="h-full bg-amber/30 rounded-full"
                      style={{
                        width: `${(d._count.id / (lobbyDomains[0]?._count.id ?? 1)) * 100}%`,
                      }}
                    />
                  </div>
                  {match && voteCount > 0 && (
                    <span className="text-[10px] text-bureau-600">
                      {fmt(voteCount)} votes parlementaires sur ce thème ·{" "}
                      <Link
                        href={`/votes/par-sujet/${match.tag}`}
                        className="text-teal hover:underline"
                      >
                        Voir les scrutins
                      </Link>
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </section>

      <p className="text-xs text-bureau-600">
        Source : Répertoire des représentants d&apos;intérêts — HATVP (
        <a
          href="https://www.hatvp.fr/le-repertoire/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-bureau-400"
        >
          hatvp.fr
        </a>
        ). Données toutes périodes confondues. Les connexions avec le gouvernement
        Macron sont issues de sources publiques (presse, HATVP, JO).
      </p>
    </div>
  );
}
