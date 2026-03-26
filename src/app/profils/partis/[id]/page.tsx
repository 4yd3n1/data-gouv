import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { getNuancesForParty, isCoalition } from "@/lib/nuance-party-map";
import { getNuanceStyle } from "@/lib/nuance-colors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await prisma.partiPolitique.findUnique({
    where: { id },
    select: { nom: true },
  });
  if (!p) return { title: "Parti introuvable — L'Observatoire Citoyen" };
  return {
    title: `${p.nom} — Finances du parti · L'Observatoire Citoyen`,
    description: `Comptes financiers et financement public de ${p.nom} (source CNCCFP).`,
  };
}

export default async function PartiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parti = await prisma.partiPolitique.findUnique({ where: { id } });
  if (!parti) notFound();

  // Get all years for this party (by codeCNCC)
  const allYears = await prisma.partiPolitique.findMany({
    where: { codeCNCC: parti.codeCNCC },
    orderBy: { exercice: "asc" },
  });

  // Election performance cross-reference
  const nuancesForParty = getNuancesForParty(parti.codeCNCC);
  let electionStats: {
    seats: number;
    totalVotes: number;
    voteShare: number;
    costPerSeat: number | null;
    nuances: string[];
    isCoalitionData: boolean;
  } | null = null;

  if (nuancesForParty.length > 0) {
    const [seatsWon, votesT1, totalExprimesT1] = await Promise.all([
      prisma.candidatLegislatif.count({
        where: { nuance: { in: nuancesForParty }, elu: true, election: { annee: 2024 } },
      }),
      prisma.candidatLegislatif.aggregate({
        where: { nuance: { in: nuancesForParty }, election: { annee: 2024, tour: 1 } },
        _sum: { voix: true },
      }),
      prisma.electionLegislative.aggregate({
        where: { annee: 2024, tour: 1 },
        _sum: { exprimes: true },
      }),
    ]);

    const totalAide = (parti.aidePublique1 ?? 0) + (parti.aidePublique2 ?? 0);
    const votes = votesT1._sum.voix ?? 0;
    const exprimes = totalExprimesT1._sum.exprimes ?? 0;

    if (votes > 0) {
      electionStats = {
        seats: seatsWon,
        totalVotes: votes,
        voteShare: exprimes > 0 ? (votes / exprimes) * 100 : 0,
        costPerSeat: seatsWon > 0 ? totalAide / seatsWon : null,
        nuances: nuancesForParty,
        isCoalitionData: nuancesForParty.some(n => isCoalition(n)),
      };
    }
  }

  const isPositive = parti.resultat >= 0;

  const recettes = [
    { label: "Cotisations adhérents", value: parti.cotisationsAdherents },
    { label: "Cotisations élus", value: parti.cotisationsElus },
    { label: "Aide publique (1ère fraction)", value: parti.aidePublique1 },
    { label: "Aide publique (2e fraction)", value: parti.aidePublique2 },
    { label: "Dons de personnes physiques", value: parti.donsPersonnes },
    { label: "Contributions de partis", value: parti.contributionsPartis },
    { label: "Contributions de candidats", value: parti.contributionsCandidats },
  ];

  const depenses = [
    { label: "Salaires", value: parti.salaires },
    { label: "Charges sociales", value: parti.chargesSociales },
    { label: "Communication", value: parti.communication },
  ];

  return (
    <>
      <PageHeader
        title={parti.nom}
        subtitle={`Exercice ${parti.exercice} — Comptes certifiés CNCCFP`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Profils", href: "/profils" },
          { label: "Partis", href: "/profils/partis" },
          { label: parti.nom },
        ]}
      />

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Top-level financial summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Recettes</p>
            <p className="mt-1 text-xl font-bold text-teal">{fmtEuro(parti.totalProduits)}</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Dépenses</p>
            <p className="mt-1 text-xl font-bold text-amber">{fmtEuro(parti.totalCharges)}</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Résultat</p>
            <p className={`mt-1 text-xl font-bold ${isPositive ? "text-teal" : "text-rose"}`}>
              {isPositive ? "+" : ""}{fmtEuro(parti.resultat)}
            </p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Disponibilités</p>
            <p className="mt-1 text-xl font-bold text-blue">{fmtEuro(parti.disponibilites)}</p>
          </div>
        </div>

        {/* Revenue / Expense breakdown side by side */}
        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          {/* Recettes */}
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5">
            <h2 className="text-sm font-medium text-bureau-200 mb-4">Détail des recettes</h2>
            <div className="space-y-3">
              {recettes.map((r) => {
                const pct = parti.totalProduits > 0 ? (r.value / parti.totalProduits) * 100 : 0;
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-bureau-400">{r.label}</span>
                      <span className="text-bureau-200 font-medium">{fmtEuro(r.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bureau-800 overflow-hidden">
                      <div className="h-full rounded-full bg-teal/60 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-bureau-700/20 flex justify-between text-xs">
              <span className="text-bureau-500">Total</span>
              <span className="font-bold text-teal">{fmtEuro(parti.totalProduits)}</span>
            </div>
          </div>

          {/* Dépenses */}
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5">
            <h2 className="text-sm font-medium text-bureau-200 mb-4">Détail des dépenses</h2>
            <div className="space-y-3">
              {depenses.map((d) => {
                const pct = parti.totalCharges > 0 ? (d.value / parti.totalCharges) * 100 : 0;
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-bureau-400">{d.label}</span>
                      <span className="text-bureau-200 font-medium">{fmtEuro(d.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bureau-800 overflow-hidden">
                      <div className="h-full rounded-full bg-amber/60 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-bureau-700/20 flex justify-between text-xs">
              <span className="text-bureau-500">Total</span>
              <span className="font-bold text-amber">{fmtEuro(parti.totalCharges)}</span>
            </div>
            {parti.emprunts > 0 && (
              <div className="mt-3 flex justify-between text-xs text-bureau-500">
                <span>Emprunts bancaires</span>
                <span className="text-rose">{fmtEuro(parti.emprunts)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-year comparison if available */}
        {allYears.length > 1 && (
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5">
            <h2 className="text-sm font-medium text-bureau-200 mb-4">&Eacute;volution pluriannuelle</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bureau-700/20">
                    <th className="pb-2 text-left text-bureau-500 font-normal">Exercice</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Recettes</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">D&eacute;penses</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">R&eacute;sultat</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Aide publique</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Dons</th>
                  </tr>
                </thead>
                <tbody>
                  {allYears.map((y) => {
                    const yPositive = y.resultat >= 0;
                    const isCurrent = y.exercice === parti.exercice;
                    return (
                      <tr key={y.exercice} className={`border-b border-bureau-700/10 ${isCurrent ? "bg-bureau-800/40" : ""}`}>
                        <td className={`py-2 ${isCurrent ? "text-teal font-medium" : "text-bureau-300"}`}>
                          {y.exercice}
                        </td>
                        <td className="py-2 text-right text-bureau-300">{fmtEuro(y.totalProduits)}</td>
                        <td className="py-2 text-right text-bureau-300">{fmtEuro(y.totalCharges)}</td>
                        <td className={`py-2 text-right font-medium ${yPositive ? "text-teal" : "text-rose"}`}>
                          {yPositive ? "+" : ""}{fmtEuro(y.resultat)}
                        </td>
                        <td className="py-2 text-right text-bureau-400">{fmtEuro(y.aidePublique1)}</td>
                        <td className="py-2 text-right text-bureau-400">{fmtEuro(y.donsPersonnes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Election performance (Législatives 2024) */}
        {electionStats && (
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5 mt-8">
            <h2 className="text-sm font-medium text-bureau-200 mb-4">Performance &eacute;lectorale &mdash; L&eacute;gislatives 2024</h2>
            {electionStats.isCoalitionData && (
              <p className="mb-3 text-[10px] uppercase tracking-widest text-amber">
                Donn&eacute;es de coalition ({electionStats.nuances.map(n => getNuanceStyle(n).label).join(" + ")})
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-bureau-500">Si&egrave;ges</p>
                <p className="mt-1 text-2xl font-bold text-teal">{fmt(electionStats.seats)}</p>
              </div>
              <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-bureau-500">Part des voix (T1)</p>
                <p className="mt-1 text-2xl font-bold text-bureau-200">{electionStats.voteShare.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/30 p-3">
                <p className="text-[10px] uppercase tracking-widest text-bureau-500">Voix (T1)</p>
                <p className="mt-1 text-2xl font-bold text-bureau-200">{fmt(electionStats.totalVotes)}</p>
              </div>
              {electionStats.costPerSeat !== null && (
                <div className="rounded-lg border border-amber/20 bg-amber/5 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">Co&ucirc;t public / si&egrave;ge</p>
                  <p className="mt-1 text-2xl font-bold text-amber">{fmtEuro(electionStats.costPerSeat)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
