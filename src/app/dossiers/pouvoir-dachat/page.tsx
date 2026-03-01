import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { IndicatorCard } from "@/components/indicator-card";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { RankingTable } from "@/components/ranking-table";

export default async function PouvoirDachatPage() {
  const dossier = getDossier("pouvoir-dachat");
  if (!dossier) notFound();

  const [
    indPib,
    indChomage,
    indIpc,
    indSmic,
    scrutins,
    fiscalActionCount,
    fiscalLobbyCount,
    topOrgsRaw,
    medianIncomeRows,
    depts,
  ] = await Promise.all([
    prisma.indicateur.findFirst({
      where: { code: "PIB_ANNUEL" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 12 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "CHOMAGE_TAUX_TRIM" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "IPC_MENSUEL" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 1 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "SMIC_HORAIRE" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 1 } },
    }),
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["budget", "fiscalite"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    prisma.actionLobbyiste.count({
      where: { domaine: { contains: "fiscal", mode: "insensitive" } },
    }),
    prisma.lobbyiste.count({
      where: {
        actions: {
          some: { domaine: { contains: "fiscal", mode: "insensitive" } },
        },
      },
    }),
    prisma.lobbyiste.findMany({
      where: {
        actions: {
          some: { domaine: { contains: "fiscal", mode: "insensitive" } },
        },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
    prisma.statLocale.findMany({
      where: { indicateur: "MEDIAN_INCOME", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 10,
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
  const rankingRows = medianIncomeRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));

  // Normalise scrutins shape for TopicVoteList
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

  // Sparkline values (oldest → newest)
  const pibSparkline = indPib?.observations
    .slice()
    .reverse()
    .map((o) => o.valeur) ?? [];
  const chomageSparkline = indChomage?.observations
    .slice()
    .reverse()
    .map((o) => o.valeur) ?? [];

  const pibLatest = indPib?.observations[0];
  const chomageLatest = indChomage?.observations[0];
  const ipcLatest = indIpc?.observations[0];
  const smicLatest = indSmic?.observations[0];

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="pouvoir-dachat" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Les chiffres clés */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Les chiffres clés
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Indicateurs macroéconomiques issus des séries temporelles INSEE
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IndicatorCard
              label="Inflation (IPC)"
              value={
                ipcLatest != null
                  ? `${ipcLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`
                  : "N/D"
              }
              unit="%"
              color="amber"
              period={ipcLatest ? `Période ${indIpc?.observations[0] ? "récente" : "—"}` : undefined}
            />
            <IndicatorCard
              label="Taux de chômage"
              value={
                chomageLatest != null
                  ? `${chomageLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`
                  : "N/D"
              }
              unit="%"
              color="teal"
              sparkline={chomageSparkline}
              period={chomageLatest ? indChomage?.dernierePeriode ?? undefined : undefined}
            />
            <IndicatorCard
              label="PIB annuel"
              value={
                pibLatest != null
                  ? `${(pibLatest.valeur / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
                  : "N/D"
              }
              unit="Md €"
              color="teal"
              sparkline={pibSparkline}
              period={pibLatest ? indPib?.dernierePeriode ?? undefined : undefined}
            />
            <IndicatorCard
              label="SMIC horaire brut"
              value={
                smicLatest != null
                  ? `${smicLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}`
                  : "N/D"
              }
              unit="€"
              color="amber"
              period={smicLatest ? indSmic?.dernierePeriode ?? undefined : undefined}
            />
          </div>
        </section>

        {/* Section 2 — Revenus par département */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Revenus par département
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Revenu médian disponible par unité de consommation — top 10 départements (INSEE Filosofi)
            </p>
          </div>

          {rankingRows.length > 0 ? (
            <RankingTable
              rows={rankingRows}
              unit="€"
              label="Revenu médian disponible"
              territoireHref={(code) => `/territoire/${code}`}
            />
          ) : (
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
              <p className="text-sm text-bureau-500">
                Données non disponibles — l&apos;ingestion des statistiques locales n&apos;a pas encore été effectuée.
              </p>
            </div>
          )}
        </section>

        {/* Section 3 — Votes au Parlement */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins publics tagués budget et fiscalité — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 4 — Lobbying fiscal */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying fiscal
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Actions de lobbying dans les domaines fiscal, budgétaire et financier — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={fiscalActionCount}
            lobbyCount={fiscalLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Domaine fiscal / budget / finances"
          />
        </section>
      </div>
    </>
  );
}
