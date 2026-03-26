import { Fragment } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { fmt, fmtEuro } from "@/lib/format";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { getNuanceStyle } from "@/lib/nuance-colors";
import { getPartyCodes, isCoalition } from "@/lib/nuance-party-map";

export const revalidate = 86400;

const FOCUS_NUANCES = ["RN", "ENS", "UG", "FI", "LR", "SOC", "ECO", "REC"];

const EVOLUTION_PARTIES = [
  { codeCNCC: 40, label: "RN" },
  { codeCNCC: 910, label: "Renaissance" },
  { codeCNCC: 976, label: "LFI" },
  { codeCNCC: 401, label: "LR" },
];

const EVOLUTION_YEARS = [2021, 2022, 2023, 2024];

export default async function FinancementPolitiquePage() {
  const dossier = getDossier("financement-politique");
  if (!dossier) notFound();

  const [seatAgg, voteAgg, totalExprimesAgg, historicalParties, allPartiesRaw] = await Promise.all([
    prisma.candidatLegislatif.groupBy({
      by: ["nuance"],
      where: { elu: true, election: { annee: 2024 } },
      _count: { id: true },
    }),
    prisma.candidatLegislatif.groupBy({
      by: ["nuance"],
      where: { election: { annee: 2024, tour: 1 } },
      _sum: { voix: true },
    }),
    prisma.electionLegislative.aggregate({
      where: { annee: 2024, tour: 1 },
      _sum: { exprimes: true },
    }),
    prisma.partiPolitique.findMany({
      where: {
        codeCNCC: { in: EVOLUTION_PARTIES.map(p => p.codeCNCC) },
        exercice: { gte: 2021 },
      },
      orderBy: [{ codeCNCC: "asc" }, { exercice: "asc" }],
    }),
    prisma.partiPolitique.findMany({ orderBy: { exercice: "desc" } }),
  ]);

  // Latest party by codeCNCC
  const latestByCode = new Map<number, (typeof allPartiesRaw)[0]>();
  for (const p of allPartiesRaw) {
    if (!latestByCode.has(p.codeCNCC)) latestByCode.set(p.codeCNCC, p);
  }

  const seatMap = new Map(seatAgg.map(s => [s.nuance, s._count.id]));
  const voteMap = new Map(voteAgg.map(v => [v.nuance, v._sum.voix ?? 0]));
  const totalExprimes = totalExprimesAgg._sum.exprimes ?? 1;

  type NuanceRow = {
    code: string;
    label: string;
    seats: number;
    aide: number;
    recettes: number;
    dons: number;
    cotisations: number;
    costPerSeat: number | null;
    voteShare: number;
    coalition: boolean;
  };

  const nuanceRows: NuanceRow[] = FOCUS_NUANCES
    .map(code => {
      const codes = getPartyCodes(code);
      if (codes.length === 0) return null;
      const parties = codes.map(c => latestByCode.get(c)).filter(Boolean) as (typeof allPartiesRaw);
      if (parties.length === 0) return null;

      const aide = parties.reduce((s, p) => s + (p.aidePublique1 ?? 0) + (p.aidePublique2 ?? 0), 0);
      const seats = seatMap.get(code) ?? 0;
      const votes = voteMap.get(code) ?? 0;

      return {
        code,
        label: getNuanceStyle(code).label,
        seats,
        aide,
        recettes: parties.reduce((s, p) => s + p.totalProduits, 0),
        dons: parties.reduce((s, p) => s + (p.donsPersonnes ?? 0), 0),
        cotisations: parties.reduce((s, p) => s + (p.cotisationsAdherents ?? 0) + (p.cotisationsElus ?? 0), 0),
        costPerSeat: seats > 0 ? aide / seats : null,
        voteShare: (votes / totalExprimes) * 100,
        coalition: isCoalition(code),
      };
    })
    .filter((r): r is NuanceRow => r !== null);

  // Cost per seat, sorted descending
  const costRows = nuanceRows
    .filter(r => r.costPerSeat !== null)
    .sort((a, b) => (b.costPerSeat ?? 0) - (a.costPerSeat ?? 0));
  const maxCost = costRows[0]?.costPerSeat ?? 1;

  // Evolution data grouped by party
  const evoByParty = new Map<number, Map<number, (typeof allPartiesRaw)[0]>>();
  for (const p of historicalParties) {
    if (!evoByParty.has(p.codeCNCC)) evoByParty.set(p.codeCNCC, new Map());
    evoByParty.get(p.codeCNCC)!.set(p.exercice, p);
  }

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="financement-politique" />

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        {/* Section 1: Cost per seat */}
        {costRows.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
              Co&ucirc;t public par si&egrave;ge
            </h2>
            <p className="text-xs text-bureau-500 mb-4">
              Aide publique totale / si&egrave;ges remport&eacute;s &mdash; L&eacute;gislatives 2024
            </p>
            <div className="space-y-2">
              {costRows.map(r => {
                const style = getNuanceStyle(r.code);
                const pct = (r.costPerSeat! / maxCost) * 100;
                return (
                  <div key={r.code} className="flex items-center gap-3">
                    <div className="w-36 shrink-0 flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${style.bar}`} />
                      <span className="text-xs text-bureau-300">{r.label}</span>
                    </div>
                    <div className="flex-1 h-5 rounded bg-bureau-800 overflow-hidden">
                      <div className={`h-full ${style.bar} rounded transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-32 shrink-0 text-right">
                      <span className="text-xs text-bureau-200 font-medium">{fmtEuro(r.costPerSeat!)}</span>
                      <span className="text-[10px] text-bureau-500 ml-1">({r.seats} si&egrave;ges)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2: Funding structure */}
        {nuanceRows.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
              Structure de financement par camp
            </h2>
            <p className="text-xs text-bureau-500 mb-4">
              Aide publique, dons et cotisations en proportion des recettes totales
            </p>
            <div className="space-y-3">
              {nuanceRows.filter(r => r.recettes > 0).map(r => {
                const style = getNuanceStyle(r.code);
                const pctAide = (r.aide / r.recettes) * 100;
                const pctDons = (r.dons / r.recettes) * 100;
                const pctCot = (r.cotisations / r.recettes) * 100;
                return (
                  <div key={r.code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${style.bar}`} />
                        <span className="text-bureau-300">{r.label}</span>
                        {r.coalition && <span className="text-[9px] text-amber">coalition</span>}
                      </div>
                      <span className="text-bureau-500">{fmtEuro(r.recettes)}</span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-bureau-800">
                      <div className="h-full bg-amber/70" style={{ width: `${pctAide}%` }} title={`Aide publique: ${pctAide.toFixed(1)}%`} />
                      <div className="h-full bg-teal/70" style={{ width: `${pctDons}%` }} title={`Dons: ${pctDons.toFixed(1)}%`} />
                      <div className="h-full bg-blue/70" style={{ width: `${pctCot}%` }} title={`Cotisations: ${pctCot.toFixed(1)}%`} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-bureau-500">
              <div className="flex items-center gap-1"><div className="h-2 w-3 rounded bg-amber/70" /> Aide publique</div>
              <div className="flex items-center gap-1"><div className="h-2 w-3 rounded bg-teal/70" /> Dons</div>
              <div className="flex items-center gap-1"><div className="h-2 w-3 rounded bg-blue/70" /> Cotisations</div>
            </div>
          </section>
        )}

        {/* Section 3: Electoral yield */}
        {nuanceRows.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
              Rendement &eacute;lectoral
            </h2>
            <p className="text-xs text-bureau-500 mb-4">
              Part des voix (T1) et aide publique par nuance politique
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bureau-700/20">
                    <th className="pb-2 text-left text-bureau-500 font-normal">Nuance</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Voix T1</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Part (%)</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Aide publique</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Si&egrave;ges</th>
                  </tr>
                </thead>
                <tbody>
                  {[...nuanceRows].sort((a, b) => b.voteShare - a.voteShare).map(r => {
                    const style = getNuanceStyle(r.code);
                    return (
                      <tr key={r.code} className="border-b border-bureau-700/10">
                        <td className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${style.bar}`} />
                            <span className="text-bureau-300">{r.label}</span>
                          </div>
                        </td>
                        <td className="py-2 text-right text-bureau-300">{fmt(voteMap.get(r.code) ?? 0)}</td>
                        <td className="py-2 text-right text-bureau-200 font-medium">{r.voteShare.toFixed(1)}%</td>
                        <td className="py-2 text-right text-amber">{fmtEuro(r.aide)}</td>
                        <td className={`py-2 text-right ${r.seats > 0 ? "text-teal font-medium" : "text-bureau-500"}`}>{r.seats}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 4: Evolution 2021-2024 */}
        {historicalParties.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
              &Eacute;volution 2021&ndash;2024
            </h2>
            <p className="text-xs text-bureau-500 mb-4">
              Aide publique et recettes totales pour les principaux partis
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bureau-700/20">
                    <th className="pb-2 text-left text-bureau-500 font-normal">Parti</th>
                    {EVOLUTION_YEARS.map(y => (
                      <Fragment key={y}>
                        <th className="pb-2 text-right text-bureau-500 font-normal pr-2">{y} Aide</th>
                        <th className="pb-2 text-right text-bureau-500 font-normal">{y} Rec.</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVOLUTION_PARTIES.map(ep => {
                    const yearMap = evoByParty.get(ep.codeCNCC);
                    return (
                      <tr key={ep.codeCNCC} className="border-b border-bureau-700/10">
                        <td className="py-2 text-bureau-300 font-medium">{ep.label}</td>
                        {EVOLUTION_YEARS.map(y => {
                          const p = yearMap?.get(y);
                          return (
                            <Fragment key={y}>
                              <td className="py-2 text-right text-amber pr-2">
                                {p ? fmtEuro((p.aidePublique1 ?? 0) + (p.aidePublique2 ?? 0)) : "\u2014"}
                              </td>
                              <td className="py-2 text-right text-bureau-400">
                                {p ? fmtEuro(p.totalProduits) : "\u2014"}
                              </td>
                            </Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
