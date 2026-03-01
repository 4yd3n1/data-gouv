import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export default async function ElectionsPage() {
  const [elections, candidats] = await Promise.all([
    prisma.electionLegislative.count(),
    prisma.candidatLegislatif.count(),
  ]);

  const tour1 = await prisma.electionLegislative.aggregate({
    where: { annee: 2024, tour: 1 },
    _sum: { inscrits: true, votants: true, abstentions: true, exprimes: true },
    _count: true,
  });

  const tour2 = await prisma.electionLegislative.aggregate({
    where: { annee: 2024, tour: 2 },
    _sum: { inscrits: true, votants: true, abstentions: true, exprimes: true },
    _count: true,
  });

  const elusT2 = await prisma.candidatLegislatif.count({
    where: { elu: true, election: { annee: 2024, tour: 2 } },
  });
  const elusT1 = await prisma.candidatLegislatif.count({
    where: { elu: true, election: { annee: 2024, tour: 1 } },
  });

  const participationT1 = tour1._sum.inscrits && tour1._sum.inscrits > 0
    ? ((tour1._sum.votants ?? 0) / tour1._sum.inscrits * 100).toFixed(1)
    : "—";
  const participationT2 = tour2._sum.inscrits && tour2._sum.inscrits > 0
    ? ((tour2._sum.votants ?? 0) / tour2._sum.inscrits * 100).toFixed(1)
    : "—";

  return (
    <>
      <PageHeader
        title="Élections"
        subtitle={`${fmt(elections)} scrutins · ${fmt(candidats)} candidatures`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Élections" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Election cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/elections/legislatives-2024"
            className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-bureau-500">30 juin — 7 juillet 2024</span>
            </div>
            <h3 className="text-lg font-medium text-bureau-100 group-hover:text-teal transition-colors">
              Législatives 2024
            </h3>
            <p className="mt-1 text-sm text-bureau-500">
              Élections législatives anticipées — résultats par circonscription
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-bureau-500">1er tour</p>
                <p className="text-lg font-bold text-bureau-200">{participationT1}%</p>
                <p className="text-[10px] text-bureau-600">participation</p>
              </div>
              <div>
                <p className="text-xs text-bureau-500">2nd tour</p>
                <p className="text-lg font-bold text-bureau-200">{participationT2}%</p>
                <p className="text-[10px] text-bureau-600">participation</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-bureau-400">
              <span>{fmt(tour1._count)} circos (T1)</span>
              <span>{fmt(tour2._count)} circos (T2)</span>
              <span>{fmt(elusT1 + elusT2)} élus</span>
            </div>
          </Link>

          {/* Placeholder for future elections */}
          <div className="rounded-xl border border-dashed border-bureau-700/30 bg-bureau-900/20 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-bureau-600">Européennes 2024</p>
              <p className="text-xs text-bureau-700 mt-1">À venir</p>
            </div>
          </div>
          <div className="rounded-xl border border-dashed border-bureau-700/30 bg-bureau-900/20 p-6 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-bureau-600">Municipales 2026</p>
              <p className="text-xs text-bureau-700 mt-1">À venir</p>
            </div>
          </div>
        </div>

        {/* National summary if data exists */}
        {tour1._sum.inscrits && (
          <div className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-bureau-100 mb-4">
              Législatives 2024 — Résumé national
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Inscrits (T1)", value: fmt(tour1._sum.inscrits) },
                { label: "Votants (T1)", value: fmt(tour1._sum.votants) },
                { label: "Abstentions (T1)", value: fmt(tour1._sum.abstentions) },
                { label: "Exprimés (T1)", value: fmt(tour1._sum.exprimes) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-bureau-200">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
