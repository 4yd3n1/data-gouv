import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { LobbyingDensity } from "@/components/lobbying-density";
import { ConflictAlert } from "@/components/conflict-alert";
import { TopicVoteList } from "@/components/topic-vote-list";
import { fmt, fmtEuro } from "@/lib/format";

export default async function ConfianceDemocratiqueePage() {
  const dossier = getDossier("confiance-democratique");
  if (!dossier) notFound();

  const [
    topDeclarations,
    topConflictSignals,
    declarationCount,
    totalLobbyActions,
    totalLobbyOrgs,
    topCategoriesRaw,
    topOrgsRaw,
    partis,
    scrutins49,
    deportCount,
  ] = await Promise.all([
    // Top 10 declarations by totalParticipations
    prisma.declarationInteret.findMany({
      where: {
        totalParticipations: { gt: 0 },
        typeMandat: { in: ["Député", "Sénateur", "Ministre"] },
      },
      orderBy: { totalParticipations: "desc" },
      take: 10,
      select: {
        id: true,
        nom: true,
        prenom: true,
        typeMandat: true,
        totalParticipations: true,
        organe: true,
      },
    }),
    // Top 10 conflict signals — sorted by vote count to highlight the most active cases
    prisma.conflictSignal.findMany({
      where: { voteCount: { gt: 0 } },
      orderBy: { voteCount: "desc" },
      take: 10,
    }),
    // Count of declarations with participations > 0
    prisma.declarationInteret.count({
      where: {
        totalParticipations: { gt: 0 },
        typeMandat: { in: ["Député", "Sénateur"] },
      },
    }),
    // Total lobbying actions
    prisma.actionLobbyiste.count(),
    // Total lobbying organisations
    prisma.lobbyiste.count(),
    // Top 5 categories
    prisma.lobbyiste.groupBy({
      by: ["categorieActivite"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    // Top 5 orgs by action count (all domains)
    prisma.lobbyiste.findMany({
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
    // Party finances 2024
    prisma.partiPolitique.findMany({
      where: { exercice: 2024 },
      orderBy: { totalProduits: "desc" },
      take: 10,
      select: {
        nom: true,
        aidePublique1: true,
        aidePublique2: true,
        donsPersonnes: true,
        totalProduits: true,
        totalCharges: true,
        resultat: true,
      },
    }),
    // Scrutins referencing article 49 (approx match)
    prisma.scrutin.findMany({
      where: { titre: { contains: "49", mode: "insensitive" } },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 5,
    }),
    // Deport count
    prisma.deport.count(),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  // Build category orgs list (reuse TopOrg shape for LobbyingDensity)
  const categoryOrgs = topCategoriesRaw
    .filter((c) => c.categorieActivite != null)
    .map((c) => ({
      nom: c.categorieActivite as string,
      actions: c._count.id,
    }));

  const scrutinsForList = scrutins49.map((s) => ({
    id: s.id,
    titre: s.titre,
    dateScrutin: s.dateScrutin,
    sortCode: s.sortCode,
    groupeVotes: s.groupeVotes.map((g) => ({
      pour: g.pour,
      contre: g.contre,
      abstentions: g.abstentions,
    })),
  }));

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="confiance-democratique" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Déclarations d'intérêts */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Déclarations d&apos;intérêts
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Participations financières déclarées auprès de la HATVP par les élus nationaux
            </p>
          </div>

          {/* Summary stat */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">
                Élus avec participations déclarées
              </p>
              <p className="mt-2 text-2xl font-bold text-rose">{fmt(declarationCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Députés et Sénateurs
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">
                Total participations (top 10)
              </p>
              <p className="mt-2 text-2xl font-bold text-amber">
                {fmtEuro(
                  topDeclarations.reduce(
                    (acc, d) => acc + (d.totalParticipations ?? 0),
                    0
                  )
                )}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Valeur cumulée déclarée
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">
                Déports parlementaires
              </p>
              <p className="mt-2 text-2xl font-bold text-bureau-200">{fmt(deportCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Récusations enregistrées
              </p>
            </div>
          </div>

          {/* Top 5 conflict alerts */}
          {topDeclarations.length > 0 ? (
            <div className="space-y-3">
              {topDeclarations.slice(0, 5).map((d) => (
                <ConflictAlert
                  key={d.id}
                  declarationId={d.id}
                  deputyName={`${d.prenom} ${d.nom}`}
                  sector={d.organe ?? d.typeMandat}
                  participationTotal={d.totalParticipations ?? 0}
                  relatedVoteCount={0}
                  typeMandat={d.typeMandat}
                />
              ))}

              {/* Remaining as simple list */}
              {topDeclarations.length > 5 && (
                <div className="rounded-xl border border-bureau-700/30 overflow-hidden">
                  <div className="border-b border-bureau-700/30 bg-bureau-800/30 px-4 py-2.5">
                    <span className="text-xs uppercase tracking-widest text-bureau-500">
                      Autres déclarations significatives
                    </span>
                  </div>
                  <div className="divide-y divide-bureau-700/20">
                    {topDeclarations.slice(5).map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between bg-bureau-800/10 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm text-bureau-200">
                            {d.prenom} {d.nom}
                          </p>
                          <p className="text-xs text-bureau-500">{d.typeMandat}</p>
                        </div>
                        <span className="text-sm font-medium text-amber">
                          {fmtEuro(d.totalParticipations)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-bureau-500">Aucune déclaration disponible.</p>
          )}
        </section>

        {/* Section 2 — Croisement participations × votes */}
        {topConflictSignals.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Participations financières × votes
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Élus ayant voté sur des textes législatifs dans des domaines où ils ont des intérêts financiers déclarés — croisement HATVP × AN
              </p>
            </div>
            <div className="space-y-3">
              {topConflictSignals.map((signal) => (
                <ConflictAlert
                  key={signal.id}
                  deputyName={`${signal.prenom} ${signal.nom}`}
                  sector={signal.secteurDeclaration}
                  participationTotal={signal.totalMontant ?? 0}
                  relatedVoteCount={signal.voteCount}
                  votePour={signal.votePour}
                  voteContre={signal.voteContre}
                  typeMandat={signal.typeMandat}
                  href={
                    signal.deputeId
                      ? `/representants/deputes/${signal.deputeId}?tab=transparence`
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3 — Activité lobbying */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Activité lobbying
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Registre HATVP des représentants d&apos;intérêts — toutes catégories
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-bureau-500">
                Principales organisations
              </p>
              <LobbyingDensity
                actionCount={totalLobbyActions}
                lobbyCount={totalLobbyOrgs}
                topOrgs={topOrgs}
                domainLabel="Toutes catégories confondues"
              />
            </div>
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-bureau-500">
                Répartition par catégorie d&apos;activité
              </p>
              <LobbyingDensity
                actionCount={totalLobbyOrgs}
                lobbyCount={categoryOrgs.length}
                topOrgs={categoryOrgs}
                domainLabel="Catégories d'organisations"
              />
            </div>
          </div>
        </section>

        {/* Section 4 — Financement des partis */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Financement des partis politiques
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Comptes annuels certifiés déposés auprès de la CNCCFP — exercice 2024
            </p>
          </div>

          {partis.length > 0 ? (
            <div className="rounded-xl border border-bureau-700/30 overflow-hidden">
              <div className="border-b border-bureau-700/30 bg-bureau-800/30 px-4 py-2.5 grid grid-cols-4 gap-2">
                <span className="text-xs uppercase tracking-widest text-bureau-500">Parti</span>
                <span className="text-xs uppercase tracking-widest text-bureau-500 text-right">Aide publique</span>
                <span className="text-xs uppercase tracking-widest text-bureau-500 text-right">Total produits</span>
                <span className="text-xs uppercase tracking-widest text-bureau-500 text-right">Résultat</span>
              </div>
              <div className="divide-y divide-bureau-700/20">
                {partis.map((p, i) => {
                  const aidePublique = p.aidePublique1 + p.aidePublique2;
                  const resultatColor =
                    p.resultat > 0
                      ? "text-teal"
                      : p.resultat < 0
                        ? "text-rose"
                        : "text-bureau-400";
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-2 items-center bg-bureau-800/10 px-4 py-3 hover:bg-bureau-800/30 transition-colors"
                    >
                      <span className="text-sm text-bureau-200 truncate">{p.nom}</span>
                      <span className="text-sm text-bureau-300 text-right">
                        {fmtEuro(aidePublique)}
                      </span>
                      <span className="text-sm text-bureau-300 text-right">
                        {fmtEuro(p.totalProduits)}
                      </span>
                      <span className={`text-sm font-medium text-right ${resultatColor}`}>
                        {p.resultat >= 0 ? "+" : ""}
                        {fmtEuro(p.resultat)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
              <p className="text-sm text-bureau-500">
                Données non disponibles — l&apos;ingestion des comptes de partis n&apos;a pas encore été effectuée.
              </p>
            </div>
          )}
        </section>

        {/* Section 5 — Article 49.3 et motions de censure */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Recours aux procédures d&apos;exception
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins liés à l&apos;article 49 de la Constitution — motions de censure et votes de confiance
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-bureau-700/30 bg-bureau-800/30 px-5 py-4">
            <p className="text-sm text-bureau-400">
              <span className="font-medium text-bureau-200">{fmt(deportCount)}</span> déports enregistrés —
              un parlementaire se déporte lorsqu&apos;il estime avoir un conflit d&apos;intérêt sur un texte en discussion.
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>
      </div>
    </>
  );
}
