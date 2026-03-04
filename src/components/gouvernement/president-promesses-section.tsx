import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import {
  PROMESSES,
  getPromesseSummary,
  STATUS_CONFIG,
  type Promesse,
} from "@/data/president-macron";
import {
  getBaselineObservation,
  computeDelta,
  ELECTION_DATES,
} from "@/lib/president-utils";

export async function PresidentPromessesSection({
  electionYear,
}: {
  electionYear: 2017 | 2022;
}) {
  const [indicators, scrutinTagCounts] = await Promise.all([
    prisma.indicateur.findMany({
      where: {
        code: {
          in: [
            "CHOMAGE_TAUX_TRIM",
            "DETTE_PIB",
            "SMIC_HORAIRE",
            "LOGEMENTS_COMMENCES",
          ],
        },
      },
      include: { observations: { orderBy: { periodeDebut: "asc" } } },
    }),
    prisma.scrutinTag.groupBy({
      by: ["tag"],
      _count: { tag: true },
      orderBy: { _count: { tag: "desc" } },
    }),
  ]);

  const indMap = new Map(indicators.map((i) => [i.code, i]));
  const tagCountMap = new Map(
    scrutinTagCounts.map((t) => [t.tag, t._count.tag]),
  );

  function getPromiseEvidence(p: Promesse) {
    if (!p.indicateurCode) return null;
    const ind = indMap.get(p.indicateurCode);
    if (!ind || !ind.observations.length) return null;
    const baseline2017 = getBaselineObservation(
      ind.observations,
      ELECTION_DATES[2017],
    );
    const baseline2022 = getBaselineObservation(
      ind.observations,
      ELECTION_DATES[2022],
    );
    const baseline = p.election === 2017 ? baseline2017 : baseline2022;
    const current = ind.observations[ind.observations.length - 1] ?? null;
    if (!baseline || !current) return null;
    const delta = computeDelta(baseline.valeur, current.valeur);
    return {
      baseline: baseline.valeur,
      baselinePeriode: baseline.periode,
      current: current.valeur,
      currentPeriode: current.periode,
      delta,
      target: p.indicateurTarget,
      unite: ind.unite,
    };
  }

  const summary = getPromesseSummary(electionYear);
  const filteredPromesses = PROMESSES.filter((p) => p.election === electionYear);

  return (
    <div className="space-y-8 fade-up">

      {/* Election selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-bureau-500">
          Programme
        </span>
        <div className="flex gap-1">
          {([2017, 2022] as const).map((yr) => (
            <Link
              key={yr}
              href={`/gouvernement/emmanuel-macron?tab=promesses&election=${yr}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                electionYear === yr
                  ? "bg-teal/10 text-teal"
                  : "text-bureau-500 hover:text-bureau-300"
              }`}
            >
              {yr}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-bureau-500">
            {summary.total} promesses · programme {electionYear}
          </p>
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: "Tenues", value: summary.tenu, color: "text-teal" },
            { label: "Partielles", value: summary.partiel, color: "text-amber" },
            { label: "Abandonnées", value: summary.abandonne, color: "text-rose" },
            { label: "En cours", value: summary.enCours, color: "text-blue" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span className={`text-2xl font-bold ${s.color}`}>
                {s.value}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-bureau-500">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        {/* Distribution bar */}
        <div className="mt-4 flex h-2 overflow-hidden rounded-full">
          {summary.tenu > 0 && (
            <div
              className="bg-teal"
              style={{ width: `${(summary.tenu / summary.total) * 100}%` }}
            />
          )}
          {summary.partiel > 0 && (
            <div
              className="bg-amber"
              style={{ width: `${(summary.partiel / summary.total) * 100}%` }}
            />
          )}
          {summary.enCours > 0 && (
            <div
              className="bg-blue"
              style={{ width: `${(summary.enCours / summary.total) * 100}%` }}
            />
          )}
          {summary.abandonne > 0 && (
            <div
              className="bg-rose"
              style={{ width: `${(summary.abandonne / summary.total) * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Promise cards */}
      <div className="space-y-4">
        {filteredPromesses.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          const evidence = getPromiseEvidence(p);
          return (
            <div
              key={p.id}
              className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full border border-bureau-700/30 bg-bureau-800/40 px-2.5 py-0.5 text-xs text-bureau-400">
                    {p.categoryLabel}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              </div>

              {/* Promise text */}
              <p className="text-sm text-bureau-200 leading-relaxed mb-3">
                {p.text}
              </p>

              {/* Status note */}
              <p className="text-xs text-bureau-400 leading-relaxed mb-3">
                {p.statusNote}
              </p>

              {/* Evidence block */}
              {evidence && (
                <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/40 px-4 py-3 mt-3">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-2">
                    {p.indicateurLabel} · source INSEE
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-xs text-bureau-500">
                        {p.election === 2017
                          ? "Élection 2017"
                          : "Réélection 2022"}{" "}
                        ({evidence.baselinePeriode})
                      </span>
                      <p className="text-base font-bold text-bureau-200">
                        {evidence.baseline.toLocaleString("fr-FR", {
                          maximumFractionDigits: 1,
                        })}
                        {evidence.unite === "pourcent" ? " %" : ""}
                      </p>
                    </div>
                    <span className="text-bureau-600">→</span>
                    <div>
                      <span className="text-xs text-bureau-500">
                        Aujourd&apos;hui ({evidence.currentPeriode})
                      </span>
                      <p className="text-base font-bold text-bureau-200">
                        {evidence.current.toLocaleString("fr-FR", {
                          maximumFractionDigits: 1,
                        })}
                        {evidence.unite === "pourcent" ? " %" : ""}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        evidence.delta.direction === "down"
                          ? "text-teal"
                          : evidence.delta.direction === "up"
                            ? "text-rose"
                            : "text-bureau-400"
                      }`}
                    >
                      {evidence.delta.formatted}
                      {evidence.unite === "pourcent" ? " pts" : ""}
                    </div>
                    {evidence.target != null && (
                      <div className="text-xs text-bureau-500">
                        Objectif :{" "}
                        <span className="text-bureau-300">
                          {evidence.target.toLocaleString("fr-FR")}
                          {evidence.unite === "pourcent" ? " %" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vote evidence link */}
              {p.scrutinTag && (
                <div className="mt-3 flex items-center gap-2">
                  <svg
                    className="h-3 w-3 text-bureau-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="text-xs text-bureau-500">
                    {fmt(tagCountMap.get(p.scrutinTag) ?? 0)} votes au
                    Parlement sur ce thème ·{" "}
                    <Link
                      href={`/votes/par-sujet/${p.scrutinTag}`}
                      className="text-teal hover:underline"
                    >
                      Voir les scrutins →
                    </Link>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
