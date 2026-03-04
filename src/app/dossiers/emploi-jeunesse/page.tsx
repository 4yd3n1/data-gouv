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

export default async function EmploiJeunessePage() {
  const dossier = getDossier("emploi-jeunesse");
  if (!dossier) notFound();

  const [
    indChomage,
    indEmploiSalarie,
    indEmploiInterimaire,
    scrutins,
    unemploymentRows,
    pop0019Rows,
    depts,
    mapData,
    educNoDiplomaRows,
    educBacPlusRows,
  ] = await Promise.all([
    prisma.indicateur.findFirst({
      where: { code: "CHOMAGE_TAUX_TRIM" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 12 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "EMPLOI_SALARIE" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    prisma.indicateur.findFirst({
      where: { code: "EMPLOI_INTERIMAIRE" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 8 } },
    }),
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["travail", "education"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // StatLocale UNEMPLOYMENT_RATE_LOCAL by dept
    prisma.statLocale.findMany({
      where: { indicateur: "UNEMPLOYMENT_RATE_LOCAL", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 10,
    }),
    // StatLocale population 0-19 ans by dept
    prisma.statLocale.findMany({
      where: { indicateur: "POP_0019", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 10,
    }),
    prisma.departement.findMany({
      select: { code: true, libelle: true },
    }),
    getFranceMapData(),
    // Education indicators by dept (from Mélodi DS_RP_DIPLOMES_FORM_PRINC)
    prisma.statLocale.findMany({
      where: { indicateur: "EDUC_NO_DIPLOMA", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 10,
    }),
    prisma.statLocale.findMany({
      where: { indicateur: "EDUC_BAC_PLUS", geoType: "DEP" },
      orderBy: { valeur: "desc" },
      take: 10,
    }),
  ]);

  const deptMap = new Map(depts.map((d) => [d.code, d.libelle]));

  const unemploymentRankingRows = unemploymentRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));

  const pop0019RankingRows = pop0019Rows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));

  const educNoDiplomaRankingRows = educNoDiplomaRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
    rank: i + 1,
  }));

  const educBacPlusRankingRows = educBacPlusRows.map((s, i) => ({
    code: s.geoCode,
    libelle: deptMap.get(s.geoCode) ?? s.geoCode,
    valeur: s.valeur,
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

  const chomageLatest = indChomage?.observations[0];
  const emploiSalLatest = indEmploiSalarie?.observations[0];
  const interimLatest = indEmploiInterimaire?.observations[0];

  const chomageSparkline = indChomage?.observations.slice().reverse().map((o) => o.valeur) ?? [];
  const emploiSalSparkline = indEmploiSalarie?.observations.slice().reverse().map((o) => o.valeur) ?? [];

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="emploi-jeunesse" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Indicateurs clés */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Indicateurs clés
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Emploi, chômage et intérim — séries temporelles INSEE BDM
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
              period={indChomage?.dernierePeriode ?? undefined}
            />
            <IndicatorCard
              label="Emploi salarié total"
              value={
                emploiSalLatest != null
                  ? `${(emploiSalLatest.valeur / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
                  : "N/D"
              }
              unit="milliers"
              color="blue"
              sparkline={emploiSalSparkline}
              period={indEmploiSalarie?.dernierePeriode ?? undefined}
            />
            <IndicatorCard
              label="Emploi intérimaire"
              value={
                interimLatest != null
                  ? `${interimLatest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}`
                  : "N/D"
              }
              unit={indEmploiInterimaire?.unite ?? ""}
              color="blue"
              period={indEmploiInterimaire?.dernierePeriode ?? undefined}
            />
          </div>

          {/* Youth unemployment note */}
          <div className="mt-4 rounded-xl border border-blue/20 bg-blue/5 px-5 py-4">
            <p className="text-sm text-bureau-300">
              <span className="font-bold text-blue">17 %</span> de chômage chez les 15–24 ans en France métropolitaine
              selon l&apos;enquête emploi INSEE 2024 — soit 2,5× le taux national.
            </p>
          </div>
        </section>

        {/* Section 2 — Chômage par département */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Chômage par département
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Taux de chômage local par département — source INSEE
            </p>
          </div>

          {Object.keys(mapData).length > 0 && (
            <div className="mb-8 rounded-xl border border-bureau-700/20 bg-bureau-800/10 p-4">
              <FranceMap
                data={mapData}
                defaultIndicator="cho"
                size="lg"
              />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {unemploymentRankingRows.length > 0 ? (
                <RankingTable
                  rows={unemploymentRankingRows}
                  unit="%"
                  label="Taux de chômage local"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              ) : (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                  <p className="text-sm text-bureau-500">
                    Données non disponibles — l&apos;ingestion des statistiques locales n&apos;a pas encore été effectuée.
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-bureau-500">
                Population 0–19 ans par département
              </p>
              {pop0019RankingRows.length > 0 ? (
                <RankingTable
                  rows={pop0019RankingRows}
                  unit="pers."
                  label="Population jeune (0–19 ans)"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              ) : (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                  <p className="text-sm text-bureau-500">
                    Données non disponibles — l&apos;ingestion des statistiques locales n&apos;a pas encore été effectuée.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3 — Niveau d'éducation par département */}
        {(educNoDiplomaRankingRows.length > 0 || educBacPlusRankingRows.length > 0) && (
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Niveau d&apos;éducation par département
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Population 15 ans et plus — source INSEE Recensement 2022
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {educNoDiplomaRankingRows.length > 0 ? (
                <RankingTable
                  rows={educNoDiplomaRankingRows}
                  unit="%"
                  label="Sans diplôme (pop. 15+)"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              ) : (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                  <p className="text-sm text-bureau-500">
                    Données non disponibles — lancer <code className="text-teal">pnpm ingest:insee-local</code> pour les ingérer.
                  </p>
                </div>
              )}

              {educBacPlusRankingRows.length > 0 ? (
                <RankingTable
                  rows={educBacPlusRankingRows}
                  unit="%"
                  label="Baccalauréat ou supérieur (pop. 15+)"
                  territoireHref={(code) => `/territoire/${code}`}
                />
              ) : (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                  <p className="text-sm text-bureau-500">
                    Données non disponibles — lancer <code className="text-teal">pnpm ingest:insee-local</code> pour les ingérer.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 4 — Votes emploi & éducation */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes emploi &amp; éducation
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins parlementaires tagués travail et éducation — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>
      </div>
    </>
  );
}
