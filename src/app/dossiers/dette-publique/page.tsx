import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { IndicatorCard } from "@/components/indicator-card";
import { TopicVoteList } from "@/components/topic-vote-list";
import { RankingTable } from "@/components/ranking-table";
import { FranceMap } from "@/components/france-map";
import { getFranceMapData } from "@/lib/france-map-data";

export const revalidate = 86400;

export default async function DettePubliquePage() {
  const dossier = getDossier("dette-publique");
  if (!dossier) notFound();

  const [
    indDettePib,
    indInterets,
    indDepenses,
    indPib,
    scrutins,
    budgetDetteRows,
    depts,
    mapData,
  ] = await Promise.all([
    prisma.indicateur.findFirst({
      where: { code: "DETTE_PIB" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "INTERETS_DETTE" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "DEPENSES_PUBLIQUES_PIB" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    // Fallback: get PIB for context
    prisma.indicateur.findFirst({
      where: { code: "PIB_ANNUEL" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 1 } },
    }),
    // Budget scrutins
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["budget", "fiscalite"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // BudgetLocal debt per inhabitant by dept
    prisma.budgetLocal.findMany({
      where: { geoType: "DEP", detteParHab: { not: null } },
      orderBy: { detteParHab: "desc" },
      take: 10,
      select: { geoCode: true, geoLibelle: true, detteParHab: true },
    }),
    prisma.departement.findMany({
      select: { code: true, libelle: true },
    }),
    getFranceMapData(),
  ]);

  const deptMap = new Map(depts.map((d) => [d.code, d.libelle]));

  const detteRankingRows = budgetDetteRows.map((b, i) => ({
    code: b.geoCode,
    libelle: deptMap.get(b.geoCode) ?? b.geoLibelle,
    valeur: b.detteParHab,
    rank: i + 1,
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

  const dettePibLatest = indDettePib?.observations[0];
  const interetsLatest = indInterets?.observations[0];
  const depensesLatest = indDepenses?.observations[0];
  const pibLatest = indPib?.observations[0];

  // Sparklines (oldest → newest)
  const dettePibSparkline = indDettePib?.observations.slice().reverse().map((o) => o.valeur) ?? [];
  const depensesSparkline = indDepenses?.observations.slice().reverse().map((o) => o.valeur) ?? [];

  // If DETTE_PIB not in DB, show the known stat from dossier config as fallback
  const dettePibValue =
    dettePibLatest != null
      ? `${dettePibLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
      : "111 %";

  const interetsValue =
    interetsLatest != null
      ? `${(interetsLatest.valeur / 1_000_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Md €`
      : "N/D";

  const depensesValue =
    depensesLatest != null
      ? `${depensesLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
      : "N/D";

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="dette-publique" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Indicateurs clés */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Indicateurs clés
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Situation des finances publiques françaises — sources INSEE et Eurostat
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <IndicatorCard
              label="Dette / PIB"
              value={dettePibValue}
              color="amber"
              sparkline={dettePibSparkline}
              period={indDettePib?.dernierePeriode ?? "2024"}
            />
            <IndicatorCard
              label="Charges d'intérêts"
              value={interetsValue}
              color="rose"
              period={indInterets?.dernierePeriode ?? undefined}
            />
            <IndicatorCard
              label="Dépenses publiques / PIB"
              value={depensesValue}
              color="amber"
              sparkline={depensesSparkline}
              period={indDepenses?.dernierePeriode ?? undefined}
            />
          </div>

          {pibLatest && (
            <div className="mt-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4">
              <p className="text-sm text-bureau-400">
                Pour référence : PIB annuel français{" "}
                <span className="font-medium text-bureau-200">
                  {(pibLatest.valeur / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} Md €
                </span>{" "}
                ({indPib?.dernierePeriode})
              </p>
            </div>
          )}
        </section>

        {/* Section 2 — Dette locale par département */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Dette locale par département
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Encours de dette par habitant des collectivités départementales — DGFIP comptes locaux
            </p>
          </div>

          {Object.keys(mapData).length > 0 && (
            <div className="mb-8 rounded-xl border border-bureau-700/20 bg-bureau-800/10 p-4">
              <FranceMap
                data={mapData}
                defaultIndicator="det"
                size="lg"
              />
            </div>
          )}

          {detteRankingRows.length > 0 ? (
            <RankingTable
              rows={detteRankingRows}
              unit="€/hab"
              label="Encours de dette par habitant"
              territoireHref={(code) => `/territoire/${code}`}
            />
          ) : (
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
              <p className="text-sm text-bureau-500">
                Données non disponibles — l&apos;ingestion des budgets locaux (DGFIP) n&apos;a pas encore été effectuée.
              </p>
            </div>
          )}
        </section>

        {/* Section 3 — Votes budgétaires */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes budgétaires
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins publics portant sur le budget et la fiscalité — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>
      </div>
    </>
  );
}
