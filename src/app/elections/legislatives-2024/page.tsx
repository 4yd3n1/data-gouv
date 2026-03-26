import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtPct, fmtEuro } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { getNuanceStyle } from "@/lib/nuance-colors";
import { getPartyCodes, isCoalition } from "@/lib/nuance-party-map";
import { Suspense } from "react";

async function FinanceTable({ nuanceRanking }: { nuanceRanking: [string, { label: string; voix: number; elus: number }][] }) {
  const allPartyCodes = [...new Set(nuanceRanking.flatMap(([code]) => getPartyCodes(code)))];
  if (allPartyCodes.length === 0) return null;

  const allParties = await prisma.partiPolitique.findMany({
    where: { codeCNCC: { in: allPartyCodes } },
    orderBy: { exercice: "desc" },
  });

  const partyByCode = new Map<number, typeof allParties[0]>();
  for (const p of allParties) {
    if (!partyByCode.has(p.codeCNCC)) partyByCode.set(p.codeCNCC, p);
  }

  const rows = nuanceRanking
    .map(([code, data]) => {
      const codes = getPartyCodes(code);
      if (codes.length === 0) return null;
      const parties = codes.map(c => partyByCode.get(c)).filter(Boolean) as typeof allParties;
      if (parties.length === 0) return null;
      const aide = parties.reduce((s, p) => s + (p.aidePublique1 ?? 0) + (p.aidePublique2 ?? 0), 0);
      return {
        code,
        label: data.label,
        seats: data.elus,
        aide,
        recettes: parties.reduce((s, p) => s + p.totalProduits, 0),
        dons: parties.reduce((s, p) => s + (p.donsPersonnes ?? 0), 0),
        costPerSeat: data.elus > 0 ? aide / data.elus : null,
        coalition: isCoalition(code),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-4">
      <h3 className="text-xs uppercase tracking-widest text-bureau-500 mb-3">Financement des partis par nuance</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-bureau-700/20">
              <th className="pb-2 text-left text-bureau-500 font-normal">Nuance</th>
              <th className="pb-2 text-right text-bureau-500 font-normal">Aide publique</th>
              <th className="pb-2 text-right text-bureau-500 font-normal">Recettes</th>
              <th className="pb-2 text-right text-bureau-500 font-normal">Dons</th>
              <th className="pb-2 text-right text-bureau-500 font-normal">Si&egrave;ges</th>
              <th className="pb-2 text-right text-bureau-500 font-normal">Aide / si&egrave;ge</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const style = getNuanceStyle(r.code);
              return (
                <tr key={r.code} className="border-b border-bureau-700/10">
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${style.bar}`} />
                      <span className="text-bureau-300">{r.label}</span>
                      {r.coalition && <span className="text-[9px] text-amber">coalition</span>}
                    </div>
                  </td>
                  <td className="py-2 text-right text-amber">{fmtEuro(r.aide)}</td>
                  <td className="py-2 text-right text-bureau-300">{fmtEuro(r.recettes)}</td>
                  <td className="py-2 text-right text-bureau-300">{fmtEuro(r.dons)}</td>
                  <td className="py-2 text-right text-teal font-medium">{r.seats}</td>
                  <td className="py-2 text-right text-bureau-400">{r.costPerSeat !== null ? fmtEuro(r.costPerSeat) : "\u2014"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function ResultsContent({ searchParams }: { searchParams: Record<string, string> }) {
  const dept = searchParams.dept ?? "";
  const tour = parseInt(searchParams.tour ?? "2", 10);

  // Get all departments that have election data
  const deptList = await prisma.electionLegislative.groupBy({
    by: ["codeDepartement", "libelleDepartement"],
    where: { annee: 2024, tour },
    orderBy: { codeDepartement: "asc" },
  });

  // Get elections for current filters
  const where = {
    annee: 2024,
    tour,
    ...(dept && { codeDepartement: dept }),
  };

  const elections = await prisma.electionLegislative.findMany({
    where,
    include: {
      candidats: {
        orderBy: { voix: "desc" },
      },
    },
    orderBy: [{ codeDepartement: "asc" }, { codeCirconscription: "asc" }],
  });

  // Aggregate nuance results across all matching elections
  const nuanceAgg: Record<string, { label: string; voix: number; elus: number }> = {};
  for (const el of elections) {
    for (const c of el.candidats) {
      if (!nuanceAgg[c.nuance]) {
        nuanceAgg[c.nuance] = { label: getNuanceStyle(c.nuance).label, voix: 0, elus: 0 };
      }
      nuanceAgg[c.nuance].voix += c.voix;
      if (c.elu) nuanceAgg[c.nuance].elus += 1;
    }
  }

  const nuanceRanking = Object.entries(nuanceAgg)
    .sort((a, b) => b[1].voix - a[1].voix);

  const totalVoix = nuanceRanking.reduce((sum, [, n]) => sum + n.voix, 0);
  const totalElus = nuanceRanking.reduce((sum, [, n]) => sum + n.elus, 0);

  return (
    <>
      {/* Tour switcher + department filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-bureau-500">Tour :</span>
          {[1, 2].map((t) => (
            <Link
              key={t}
              href={`/elections/legislatives-2024?tour=${t}${dept ? `&dept=${dept}` : ""}`}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                tour === t ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"
              }`}
            >
              {t === 1 ? "1er tour" : "2nd tour"}
            </Link>
          ))}
        </div>
      </div>

      {/* Department selector */}
      <div className="mb-6">
        <details className="group">
          <summary className="cursor-pointer text-xs text-bureau-400 hover:text-bureau-200 transition-colors">
            {dept
              ? `Département : ${deptList.find((d) => d.codeDepartement === dept)?.libelleDepartement ?? dept}`
              : "Filtrer par département"}
            <span className="ml-1 text-bureau-600 group-open:hidden">▸</span>
            <span className="ml-1 text-bureau-600 hidden group-open:inline">▾</span>
          </summary>
          <div className="mt-2 flex flex-wrap gap-1">
            <Link
              href={`/elections/legislatives-2024?tour=${tour}`}
              className={`rounded px-2 py-0.5 text-[11px] ${!dept ? "bg-teal/10 text-teal" : "text-bureau-500 hover:bg-bureau-800"}`}
            >
              Tous
            </Link>
            {deptList.map((d) => (
              <Link
                key={d.codeDepartement}
                href={`/elections/legislatives-2024?tour=${tour}&dept=${d.codeDepartement}`}
                className={`rounded px-2 py-0.5 text-[11px] ${dept === d.codeDepartement ? "bg-teal/10 text-teal" : "text-bureau-500 hover:bg-bureau-800"}`}
              >
                {d.codeDepartement}
              </Link>
            ))}
          </div>
        </details>
      </div>

      {/* Nuance summary bar */}
      {nuanceRanking.length > 0 && (
        <div className="mb-6 rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-bureau-500">
              Résultats par nuance {dept ? `— ${deptList.find((d) => d.codeDepartement === dept)?.libelleDepartement ?? dept}` : "— National"}
            </span>
            <span className="text-xs text-bureau-400">{fmt(totalElus)} élu{totalElus > 1 ? "s" : ""} · {fmt(totalVoix)} voix</span>
          </div>

          {/* Stacked bar */}
          <div className="flex h-4 overflow-hidden rounded-full bg-bureau-800 mb-3">
            {nuanceRanking.slice(0, 10).map(([code, n]) => {
              const pct = totalVoix > 0 ? (n.voix / totalVoix) * 100 : 0;
              if (pct < 0.5) return null;
              const style = getNuanceStyle(code);
              return (
                <div key={code} className={`${style.bar} transition-all`} style={{ width: `${pct}%` }} title={`${style.label}: ${pct.toFixed(1)}%`} />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {nuanceRanking.slice(0, 8).map(([code, n]) => {
              const pct = totalVoix > 0 ? (n.voix / totalVoix) * 100 : 0;
              const style = getNuanceStyle(code);
              return (
                <div key={code} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`h-2 w-2 rounded-full ${style.bar}`} />
                  <span className="text-bureau-400">{style.label}</span>
                  <span className="text-bureau-500">{pct.toFixed(1)}%</span>
                  {n.elus > 0 && <span className={`${style.text} font-medium`}>{n.elus} élu{n.elus > 1 ? "s" : ""}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finance cross-reference table */}
      {!dept && nuanceRanking.length > 0 && <FinanceTable nuanceRanking={nuanceRanking} />}

      {/* Constituency results */}
      <p className="mb-4 text-xs text-bureau-500">{fmt(elections.length)} circonscriptions</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {elections.map((el) => {
          const participation = el.inscrits > 0 ? (el.votants / el.inscrits) * 100 : 0;
          const winner = el.candidats[0];
          const winnerStyle = winner ? getNuanceStyle(winner.nuance) : null;

          return (
            <div
              key={el.id}
              className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-bureau-100">
                    {el.libelleDepartement} — {el.libelleCirconscription}
                  </p>
                  <p className="text-[10px] text-bureau-500">
                    {fmt(el.inscrits)} inscrits · {participation.toFixed(1)}% participation
                  </p>
                </div>
                {winner && winner.elu && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${winnerStyle?.bg} ${winnerStyle?.text}`}>
                    Élu
                  </span>
                )}
              </div>

              {/* Top candidates */}
              <div className="space-y-1.5">
                {el.candidats.slice(0, 4).map((c, i) => {
                  const nuanceStyle = getNuanceStyle(c.nuance);
                  const pctExpr = c.pctExprimes ?? (el.exprimes > 0 ? (c.voix / el.exprimes) * 100 : 0);
                  return (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${nuanceStyle.bar}`} />
                      <span className={`text-xs ${i === 0 ? "text-bureau-100 font-medium" : "text-bureau-400"}`}>
                        {c.prenom} {c.nom}
                      </span>
                      <span className={`text-[10px] ${nuanceStyle.text}`}>{c.nuance}</span>
                      <span className="ml-auto text-xs text-bureau-300">{pctExpr.toFixed(1)}%</span>
                      <span className="text-[10px] text-bureau-600">{fmt(c.voix)} voix</span>
                    </div>
                  );
                })}
                {el.candidats.length > 4 && (
                  <p className="text-[10px] text-bureau-600 pl-4">
                    + {el.candidats.length - 4} autres candidats
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default async function Legislatives2024Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const totalCircos = await prisma.electionLegislative.count({ where: { annee: 2024 } });

  return (
    <>
      <PageHeader
        title="Législatives 2024"
        subtitle={`Élections législatives anticipées — ${fmt(totalCircos)} résultats de circonscription`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Élections", href: "/elections" },
          { label: "Législatives 2024" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement des résultats...</div>}>
          <ResultsContent searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}
