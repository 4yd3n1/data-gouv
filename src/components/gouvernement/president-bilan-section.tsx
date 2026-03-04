import { prisma } from "@/lib/db";
import { IndicatorCard } from "@/components/indicator-card";
import { TimelineChart } from "@/components/timeline-chart";
import { BIO } from "@/data/president-macron";
import {
  getBaselineObservation,
  computeDelta,
  ELECTION_DATES,
} from "@/lib/president-utils";

export async function PresidentBilanSection() {
  const indicators = await prisma.indicateur.findMany({
    where: {
      code: {
        in: [
          "PIB_ANNUEL",
          "CHOMAGE_TAUX_TRIM",
          "IPC_MENSUEL",
          "DETTE_PIB",
          "SMIC_HORAIRE",
          "LOGEMENTS_COMMENCES",
        ],
      },
    },
    include: { observations: { orderBy: { periodeDebut: "asc" } } },
  });

  const indMap = new Map(indicators.map((i) => [i.code, i]));
  const baselineDate = ELECTION_DATES[2017];

  // Unemployment
  const indChomage = indMap.get("CHOMAGE_TAUX_TRIM");
  const chomageObs = indChomage?.observations ?? [];
  const chomageBaseline = getBaselineObservation(chomageObs, baselineDate);
  const chomageLatest = chomageObs[chomageObs.length - 1] ?? null;
  const chomageDelta =
    chomageBaseline && chomageLatest
      ? computeDelta(chomageBaseline.valeur, chomageLatest.valeur)
      : null;

  // GDP
  const indPib = indMap.get("PIB_ANNUEL");
  const pibObs = indPib?.observations ?? [];
  const pibBaseline = getBaselineObservation(pibObs, baselineDate);
  const pibLatest = pibObs[pibObs.length - 1] ?? null;
  const pibDelta =
    pibBaseline && pibLatest
      ? computeDelta(pibBaseline.valeur, pibLatest.valeur, 0)
      : null;

  // Debt
  const indDette = indMap.get("DETTE_PIB");
  const detteObs = indDette?.observations ?? [];
  const detteBaseline = getBaselineObservation(detteObs, baselineDate);
  const detteLatest = detteObs[detteObs.length - 1] ?? null;
  const detteDelta =
    detteBaseline && detteLatest
      ? computeDelta(detteBaseline.valeur, detteLatest.valeur)
      : null;

  // SMIC
  const indSmic = indMap.get("SMIC_HORAIRE");
  const smicObs = indSmic?.observations ?? [];
  const smicBaseline = getBaselineObservation(smicObs, baselineDate);
  const smicLatest = smicObs[smicObs.length - 1] ?? null;
  const smicDelta =
    smicBaseline && smicLatest
      ? computeDelta(smicBaseline.valeur, smicLatest.valeur)
      : null;

  // Chômage timeline (since 2017)
  const chomageTimeline = chomageObs
    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
    .map((o) => ({ label: o.periode, value: o.valeur }));

  return (
    <div className="space-y-10 fade-up">

      {/* KPI grid */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Indicateurs clés depuis l&apos;élection
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <IndicatorCard
            label="Taux de chômage"
            value={
              chomageLatest?.valeur.toLocaleString("fr-FR", {
                maximumFractionDigits: 1,
              }) ?? "—"
            }
            unit="%"
            color="teal"
            trend={
              chomageDelta
                ? chomageDelta.direction === "down"
                  ? "down"
                  : chomageDelta.direction === "up"
                    ? "up"
                    : "flat"
                : undefined
            }
            trendValue={
              chomageDelta
                ? `${chomageDelta.formatted} pts depuis 2017`
                : undefined
            }
            sparkline={chomageObs
              .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
              .map((o) => o.valeur)
              .slice(-8)}
            period={chomageLatest?.periode}
          />
          <IndicatorCard
            label="PIB annuel"
            value={
              pibLatest
                ? (pibLatest.valeur / 1_000_000).toLocaleString("fr-FR", {
                    maximumFractionDigits: 2,
                  })
                : "—"
            }
            unit="bn €"
            color="blue"
            trend={
              pibDelta
                ? pibDelta.direction === "up"
                  ? "up"
                  : "down"
                : undefined
            }
            trendValue={
              pibDelta
                ? `${pibDelta.formatted} M€ depuis 2017`
                : undefined
            }
            sparkline={pibObs
              .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
              .map((o) => o.valeur)
              .slice(-8)}
            period={pibLatest?.periode}
          />
          <IndicatorCard
            label="Dette publique"
            value={
              detteLatest?.valeur.toLocaleString("fr-FR", {
                maximumFractionDigits: 1,
              }) ?? "—"
            }
            unit="% PIB"
            color="rose"
            trend={
              detteDelta
                ? detteDelta.direction === "up"
                  ? "up"
                  : "down"
                : undefined
            }
            trendValue={
              detteDelta
                ? `${detteDelta.formatted} pts depuis 2017`
                : undefined
            }
            sparkline={detteObs
              .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
              .map((o) => o.valeur)}
            period={detteLatest?.periode}
          />
          <IndicatorCard
            label="SMIC horaire brut"
            value={
              smicLatest?.valeur.toLocaleString("fr-FR", {
                maximumFractionDigits: 2,
              }) ?? "—"
            }
            unit="€"
            color="amber"
            trend={smicDelta ? "up" : undefined}
            trendValue={
              smicDelta
                ? `${smicDelta.formatted} € depuis 2017`
                : undefined
            }
            sparkline={smicObs
              .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
              .map((o) => o.valeur)}
            period={smicLatest?.periode}
          />
        </div>
      </section>

      {/* Chômage timeline */}
      {chomageTimeline.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Évolution du taux de chômage depuis l&apos;élection
            </h2>
            <span className="text-[10px] text-bureau-600 uppercase tracking-widest">
              % · source INSEE BDM
            </span>
          </div>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
            <div className="mb-2 flex gap-4 text-[10px] text-bureau-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-teal/60" />
                Élu mai 2017
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue/60" />
                Réélu avril 2022
              </span>
            </div>
            <TimelineChart
              data={chomageTimeline}
              color="teal"
              height={140}
              unit="%"
              showEvery={4}
            />
          </div>
        </section>
      )}

      {/* Electoral results */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Résultats électoraux
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BIO.elections.map((e) => (
            <div
              key={e.annee}
              className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5"
            >
              <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-2">
                Présidentielle {e.annee} · 2nd tour vs {e.adversaire}
              </p>
              <div className="flex items-end gap-4">
                <span className="text-3xl font-bold text-teal">
                  {e.tour2Pct.toLocaleString("fr-FR")} %
                </span>
                <span className="text-sm text-bureau-400 mb-1">
                  1er tour : {e.tour1Pct.toLocaleString("fr-FR")} %
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bureau-700/30">
                <div
                  className="h-full bg-teal/60 rounded-full"
                  style={{ width: `${e.tour2Pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biographie */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Biographie
        </h2>
        <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-bureau-500">Né le </span>
              <span className="text-bureau-200">
                21 décembre 1977 · {BIO.lieuNaissance}
              </span>
            </div>
            <div>
              <span className="text-bureau-500">Formation : </span>
              <span className="text-bureau-200">{BIO.formation}</span>
            </div>
            <div className="col-span-2">
              <span className="text-bureau-500">Parti : </span>
              <span className="text-bureau-200">{BIO.parti}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
