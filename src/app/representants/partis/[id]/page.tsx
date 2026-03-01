import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const codeCNCC = parseInt(id, 10);
  const p = await prisma.partiPolitique.findFirst({
    where: { codeCNCC },
    select: { nom: true },
    orderBy: { exercice: "desc" },
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
          { label: "Gouvernance", href: "/representants" },
          { label: "Partis", href: "/representants/partis" },
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
            <h2 className="text-sm font-medium text-bureau-200 mb-4">Évolution pluriannuelle</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bureau-700/20">
                    <th className="pb-2 text-left text-bureau-500 font-normal">Exercice</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Recettes</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Dépenses</th>
                    <th className="pb-2 text-right text-bureau-500 font-normal">Résultat</th>
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
      </div>
    </>
  );
}
