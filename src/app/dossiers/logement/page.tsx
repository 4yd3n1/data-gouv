import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { IndicatorCard } from "@/components/indicator-card";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { RankingTable } from "@/components/ranking-table";

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
    vacancyRows,
    secondaryRows,
    depts,
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
    // Housing stats from Recensement 2022 via Mélodi
    prisma.statLocale.findMany({
      where: { indicateur: "HOUSING_VACANCY_RATE", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 15,
    }),
    prisma.statLocale.findMany({
      where: { indicateur: "HOUSING_SECONDARY_RATE", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 15,
    }),
    prisma.departement.findMany({
      select: { code: true, libelle: true },
    }),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  const deptMap = new Map(depts.map((d) => [d.code, d.libelle]));
  const vacancyRanking = vacancyRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));
  const secondaryRanking = secondaryRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));

  const avgVacancy = vacancyRows.length > 0
    ? Math.round((vacancyRows.reduce((a, r) => a + r.valeur, 0) / vacancyRows.length) * 10) / 10
    : null;
  const avgSecondary = secondaryRows.length > 0
    ? Math.round((secondaryRows.reduce((a, r) => a + r.valeur, 0) / secondaryRows.length) * 10) / 10
    : null;
  const hasHousingStats = vacancyRanking.length > 0 || secondaryRanking.length > 0;

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

        {/* Section 3 — Parc immobilier par territoire */}
        {hasHousingStats && (
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Parc immobilier par territoire
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Vacance et résidences secondaires par département — Recensement 2022 (INSEE)
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <IndicatorCard
                label="Taux de vacance moyen"
                value={avgVacancy != null ? `${avgVacancy.toLocaleString("fr-FR")}` : "N/D"}
                unit="%"
                color="amber"
                period="2022"
              />
              <IndicatorCard
                label="Taux de rés. secondaires moyen"
                value={avgSecondary != null ? `${avgSecondary.toLocaleString("fr-FR")}` : "N/D"}
                unit="%"
                color="teal"
                period="2022"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium text-bureau-300">
                  Logements vacants les plus élevés
                </p>
                <RankingTable
                  rows={vacancyRanking}
                  unit="%"
                  label="Taux de vacance"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-bureau-300">
                  Résidences secondaires les plus élevées
                </p>
                <RankingTable
                  rows={secondaryRanking}
                  unit="%"
                  label="Taux rés. secondaires"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 4 — Lobbying immobilier */}
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
