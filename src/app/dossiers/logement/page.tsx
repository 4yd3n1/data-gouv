import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { IndicatorCard } from "@/components/indicator-card";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";

export default async function LogementPage() {
  const dossier = getDossier("logement");
  if (!dossier) notFound();

  const [
    indLogAuto,
    indLogCom,
    scrutins,
    immobilActionCount,
    immobilLobbyCount,
    topOrgsRaw,
  ] = await Promise.all([
    prisma.indicateur.findFirst({
      where: { code: "LOGEMENTS_AUTORISES" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 12 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "LOGEMENTS_COMMENCES" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 12 } },
    }),
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["logement"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // Lobbying in immobilier / construction domains
    prisma.actionLobbyiste.count({
      where: {
        OR: [
          { domaine: { contains: "immobil", mode: "insensitive" } },
          { domaine: { contains: "construct", mode: "insensitive" } },
          { domaine: { contains: "logement", mode: "insensitive" } },
          { domaine: { contains: "habitat", mode: "insensitive" } },
        ],
      },
    }),
    prisma.lobbyiste.count({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "immobil", mode: "insensitive" } },
              { domaine: { contains: "construct", mode: "insensitive" } },
              { domaine: { contains: "logement", mode: "insensitive" } },
              { domaine: { contains: "habitat", mode: "insensitive" } },
            ],
          },
        },
      },
    }),
    prisma.lobbyiste.findMany({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "immobil", mode: "insensitive" } },
              { domaine: { contains: "construct", mode: "insensitive" } },
              { domaine: { contains: "logement", mode: "insensitive" } },
              { domaine: { contains: "habitat", mode: "insensitive" } },
            ],
          },
        },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  const scrutinsForList = scrutins.map((s) => ({
    id: s.id,
    titre: s.titre,
    dateScrutin: s.dateScrutin,
    sortCode: s.sortCode,
    groupeVotes: s.groupeVotes.map((g) => ({
      nomOrgane: g.organeRef,
      pour: g.pour,
      contre: g.contre,
      abstentions: g.abstentions,
    })),
  }));

  const logAutoLatest = indLogAuto?.observations[0];
  const logComLatest = indLogCom?.observations[0];

  const logAutoSparkline = indLogAuto?.observations.slice().reverse().map((o) => o.valeur) ?? [];
  const logComSparkline = indLogCom?.observations.slice().reverse().map((o) => o.valeur) ?? [];

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="logement" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Indicateurs clés */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Indicateurs clés
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Construction neuve — permis de construire et logements commencés (Sit@del2 / SDES)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <IndicatorCard
              label="Logements autorisés"
              value={
                logAutoLatest != null
                  ? `${logAutoLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
                  : "N/D"
              }
              unit={indLogAuto?.unite ?? ""}
              color="teal"
              sparkline={logAutoSparkline}
              period={indLogAuto?.dernierePeriode ?? undefined}
            />
            <IndicatorCard
              label="Logements commencés"
              value={
                logComLatest != null
                  ? `${logComLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
                  : "N/D"
              }
              unit={indLogCom?.unite ?? ""}
              color="teal"
              sparkline={logComSparkline}
              period={indLogCom?.dernierePeriode ?? undefined}
            />
          </div>

          <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 px-5 py-4">
            <p className="text-sm text-bureau-300">
              <span className="font-bold text-teal">4 millions</span> de personnes mal-logées en France selon la
              Fondation Abbé Pierre (2024) — la crise du logement touche toutes les catégories sociales.
            </p>
          </div>
        </section>

        {/* Section 2 — Votes logement */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins parlementaires tagués logement — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 3 — Lobbying immobilier */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying immobilier &amp; construction
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Organisations représentant les intérêts de l&apos;immobilier, du BTP et du logement — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={immobilActionCount}
            lobbyCount={immobilLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Immobilier / construction / logement / habitat"
          />
        </section>

        {/* Ongoing data note */}
        <section>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-5">
            <h3 className="text-sm font-medium text-bureau-300 mb-2">Données en cours d&apos;intégration</h3>
            <p className="text-sm text-bureau-500">
              Des indicateurs supplémentaires seront disponibles prochainement : loyers médians par zone (Clameur),
              taux de logements sociaux par commune (RPLS), vacance locative par département (Lovac),
              et budgets locaux dédiés au logement (DGFIP).
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
