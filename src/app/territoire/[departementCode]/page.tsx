import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtPct, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ departementCode: string }>;
}): Promise<Metadata> {
  const { departementCode } = await params;
  const dept = await prisma.departement.findUnique({
    where: { code: departementCode },
    select: { libelle: true, region: { select: { libelle: true } } },
  });
  if (!dept) return { title: "Département introuvable — L'Observatoire Citoyen" };
  return {
    title: `${dept.libelle} (${departementCode}) — Tableau de bord · L'Observatoire Citoyen`,
    description: `Données économiques, élus, budget et patrimoine du département ${dept.libelle} en ${dept.region.libelle}. Transparence des données publiques.`,
  };
}

export default async function DepartementPage({
  params,
}: {
  params: Promise<{ departementCode: string }>;
}) {
  const { departementCode } = await params;

  const dept = await prisma.departement.findUnique({
    where: { code: departementCode },
    include: { region: true },
  });
  if (!dept) notFound();

  const [
    deputes,
    senateurs,
    eluCount,
    communeCount,
    museeCount,
    monumentCount,
    statLocale,
    budgetDept,
    budgetYears,
    recentScrutins,
    mgDensite,
    criminalite,
  ] = await Promise.all([
    prisma.depute.findMany({
      where: { departementRefCode: departementCode },
      orderBy: { nom: "asc" },
    }),
    prisma.senateur.findMany({
      where: { departementCode },
      orderBy: { nom: "asc" },
    }),
    prisma.elu.count({
      where: { codeDepartement: departementCode },
    }),
    prisma.commune.count({
      where: { departementCode, typecom: "COM" },
    }),
    prisma.musee.count({
      where: { departementCode },
    }),
    prisma.monument.count({
      where: { departementCode },
    }),
    prisma.statLocale.findMany({
      where: { geoCode: departementCode, geoType: "DEP" },
      select: { indicateur: true, valeur: true, unite: true, annee: true, source: true },
    }),
    prisma.budgetLocal.findFirst({
      where: { geoType: "DEP", geoCode: departementCode },
      orderBy: { annee: "desc" },
    }),
    prisma.budgetLocal.findMany({
      where: { geoType: "DEP", geoCode: departementCode },
      orderBy: { annee: "asc" },
      take: 5,
    }),
    prisma.scrutin.findMany({
      where: {
        votes: {
          some: {
            depute: { departementRefCode: departementCode },
          },
        },
      },
      orderBy: { dateScrutin: "desc" },
      take: 8,
      select: { id: true, titre: true, dateScrutin: true, sortCode: true },
    }),
    // Medical density — MG, latest available year
    prisma.densiteMedicale.findFirst({
      where: { departementCode, specialite: "MG" },
      orderBy: { annee: "desc" },
    }),
    // Crime stats — all indicateurs, latest year
    prisma.statCriminalite.findMany({
      where: { departementCode },
      orderBy: [{ annee: "desc" }, { indicateur: "asc" }],
      take: 20,
    }),
  ]);

  // Build a lookup map for stat indicators
  const statMap = Object.fromEntries(statLocale.map((s) => [s.indicateur, s]));

  // Build budget trend data for inline SVG chart
  const budgetTrend = budgetYears
    .map((b) => ({ annee: b.annee, val: b.depenseParHab ?? null }))
    .filter((b): b is { annee: number; val: number } => b.val !== null);

  // Compute SVG polyline points for budget trend chart
  let svgPolyline = "";
  if (budgetTrend.length > 1) {
    const svgW = 300;
    const svgH = 50;
    const padding = 4;
    const vals = budgetTrend.map((b) => b.val);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const range = maxVal - minVal || 1;
    const colW = (svgW - padding * 2) / (budgetTrend.length - 1);
    const points = budgetTrend
      .map((b, i) => {
        const x = padding + i * colW;
        const y = padding + (svgH - padding * 2) * (1 - (b.val - minVal) / range);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    svgPolyline = points;
  }

  return (
    <>
      <PageHeader
        title={dept.libelle}
        subtitle={`Département ${dept.code} · Région ${dept.region.libelle}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Territoire", href: "/territoire" },
          { label: dept.libelle },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ── KPI Grid ── */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-blue-400">
            <p className="text-2xl font-bold">{fmt(communeCount)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Communes</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-teal">
            <p className="text-2xl font-bold">{fmt(eluCount)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Élus locaux</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-teal">
            <p className="text-2xl font-bold">{fmt(deputes.length)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Députés</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-teal">
            <p className="text-2xl font-bold">{fmt(senateurs.length)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Sénateurs</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-amber">
            <p className="text-2xl font-bold">
              {statMap["POP_TOTAL"] ? fmt(Math.round(statMap["POP_TOTAL"].valeur)) : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Population</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-amber">
            <p className="text-2xl font-bold">
              {statMap["MEDIAN_INCOME"] ? fmtEuro(statMap["MEDIAN_INCOME"].valeur) : "—"}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Revenu médian</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-rose">
            <p className="text-2xl font-bold">{fmt(museeCount)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Musées</p>
          </div>
          <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 text-rose">
            <p className="text-2xl font-bold">{fmt(monumentCount)}</p>
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Monuments</p>
          </div>
        </div>

        {/* ── Économie locale ── */}
        {statLocale.length > 0 && (
          <section className="border-t border-bureau-700/30 py-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Économie locale
              </h2>
              <p className="text-[10px] text-bureau-600">Source : INSEE (FILOSOFI/RP)</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {statMap["MEDIAN_INCOME"] && (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                    Revenu médian
                  </p>
                  <p className="text-xl font-bold text-amber">
                    {fmtEuro(statMap["MEDIAN_INCOME"].valeur)}
                  </p>
                  <p className="mt-1 text-xs text-bureau-600">
                    {statMap["MEDIAN_INCOME"].annee} · {statMap["MEDIAN_INCOME"].source}
                  </p>
                </div>
              )}
              {statMap["POVERTY_RATE"] && (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                    Taux de pauvreté
                  </p>
                  <p className="text-xl font-bold text-rose">
                    {fmtPct(statMap["POVERTY_RATE"].valeur)}
                  </p>
                  <p className="mt-1 text-xs text-bureau-600">
                    {statMap["POVERTY_RATE"].annee} · {statMap["POVERTY_RATE"].source}
                  </p>
                </div>
              )}
              {statMap["UNEMPLOYMENT_RATE_LOCAL"] && (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                    Taux de chômage local
                  </p>
                  <p className="text-xl font-bold text-amber">
                    {fmtPct(statMap["UNEMPLOYMENT_RATE_LOCAL"].valeur)}
                  </p>
                  <p className="mt-1 text-xs text-bureau-600">
                    {statMap["UNEMPLOYMENT_RATE_LOCAL"].annee} · {statMap["UNEMPLOYMENT_RATE_LOCAL"].source}
                  </p>
                </div>
              )}
              {!statMap["MEDIAN_INCOME"] && !statMap["POVERTY_RATE"] && !statMap["UNEMPLOYMENT_RATE_LOCAL"] && (
                <p className="col-span-3 text-sm text-bureau-500 italic">
                  Données statistiques non disponibles pour ce département.
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── Budget local ── */}
        {budgetDept && (
          <section className="border-t border-bureau-700/30 py-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Budget local
                <span className="ml-2 font-normal normal-case text-bureau-600">
                  exercice {budgetDept.annee}
                </span>
              </h2>
              <p className="text-[10px] text-bureau-600">Source : DGFIP finances locales</p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                  Dépenses par habitant
                </p>
                <p className="text-xl font-bold text-teal">
                  {fmtEuro(budgetDept.depenseParHab ?? null)}
                </p>
              </div>
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                  Dette par habitant
                </p>
                <p className="text-xl font-bold text-rose">
                  {fmtEuro(budgetDept.detteParHab ?? null)}
                </p>
              </div>
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                  Total recettes
                </p>
                <p className="text-xl font-bold text-amber">
                  {fmtEuro(budgetDept.totalRecettes ?? null)}
                </p>
              </div>
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                  Charges personnel
                </p>
                <p className="text-xl font-bold text-bureau-200">
                  {fmtEuro(budgetDept.chargesPersonnel ?? null)}
                </p>
              </div>
            </div>

            {/* Budget trend chart */}
            {budgetTrend.length > 1 && svgPolyline && (
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/10 p-5">
                <p className="mb-3 text-[10px] uppercase tracking-widest text-bureau-500">
                  Dépenses / habitant — évolution
                </p>
                <div className="flex items-end gap-4">
                  <svg
                    width="300"
                    height="50"
                    viewBox="0 0 300 50"
                    className="shrink-0 overflow-visible"
                    aria-hidden="true"
                  >
                    <polyline
                      points={svgPolyline}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-teal"
                    />
                    {budgetTrend.map((b, i) => {
                      const svgW = 300;
                      const svgH = 50;
                      const padding = 4;
                      const vals = budgetTrend.map((p) => p.val);
                      const minVal = Math.min(...vals);
                      const maxVal = Math.max(...vals);
                      const range = maxVal - minVal || 1;
                      const colW = (svgW - padding * 2) / (budgetTrend.length - 1);
                      const x = padding + i * colW;
                      const y =
                        padding +
                        (svgH - padding * 2) * (1 - (b.val - minVal) / range);
                      return (
                        <circle
                          key={b.annee}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="currentColor"
                          className="text-teal"
                        />
                      );
                    })}
                  </svg>
                  <div className="flex gap-4 text-[10px] text-bureau-500">
                    {budgetTrend.map((b) => (
                      <div key={b.annee} className="text-center">
                        <p className="text-bureau-300">{fmtEuro(b.val)}</p>
                        <p>{b.annee}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Santé ── */}
        {(mgDensite || criminalite.length > 0) && (
          <section className="border-t border-bureau-700/30 py-8">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Santé &amp; Sécurité
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mgDensite && (
                <div className="rounded-xl border border-teal/20 bg-teal/5 p-5">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                    Médecins généralistes
                  </p>
                  <p className="text-xl font-bold text-teal">
                    {mgDensite.pour10k !== null
                      ? `${mgDensite.pour10k.toFixed(1)} / 10 000 hab`
                      : `${fmt(mgDensite.nombreMedecins)} médecins`}
                  </p>
                  <p className="mt-1 text-xs text-bureau-600">
                    {mgDensite.annee} · DREES
                  </p>
                </div>
              )}
              {criminalite.slice(0, 4).map((c) => {
                const labels: Record<string, string> = {
                  coups_blessures: "Violences physiques",
                  vols_sans_violence: "Vols sans violence",
                  cambriolages: "Cambriolages",
                  violences_sexuelles: "Violences sexuelles",
                  escroqueries: "Escroqueries",
                  destructions: "Destructions",
                  homicides: "Homicides",
                };
                return (
                  <div key={c.indicateur} className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-bureau-500">
                      {labels[c.indicateur] ?? c.indicateur}
                    </p>
                    <p className="text-xl font-bold text-bureau-200">
                      {c.tauxPour1000 !== null
                        ? `${c.tauxPour1000.toFixed(2)} ‰`
                        : c.total !== null ? fmt(c.total) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-bureau-600">{c.annee} · SSMSI</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Élus (Deputies + Senators) ── */}
        <section className="border-t border-bureau-700/30 py-8">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Représentants
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Deputies */}
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">
                Députés ({deputes.length})
              </h3>
              {deputes.length === 0 ? (
                <p className="text-sm text-bureau-500">Aucun député rattaché.</p>
              ) : (
                <div className="space-y-2">
                  {deputes.map((d) => (
                    <Link
                      key={d.id}
                      href={`/representants/deputes/${d.id}`}
                      className="group flex items-center gap-3 rounded-lg bg-bureau-700/20 px-3 py-2 transition-colors hover:bg-bureau-700/30"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bureau-700/40 text-[10px] font-medium text-bureau-300">
                        {d.prenom[0]}
                        {d.nom[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-bureau-200 transition-colors group-hover:text-teal">
                          {d.prenom} {d.nom}
                        </p>
                        <p className="text-xs text-bureau-500">{d.groupeAbrev}</p>
                      </div>
                      {!d.actif && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-bureau-700/40 text-bureau-500">
                          Ancien
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Senators */}
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">
                Sénateurs ({senateurs.length})
              </h3>
              {senateurs.length === 0 ? (
                <p className="text-sm text-bureau-500">Aucun sénateur rattaché.</p>
              ) : (
                <div className="space-y-2">
                  {senateurs.map((s) => (
                    <Link
                      key={s.id}
                      href={`/representants/senateurs/${s.id}`}
                      className="group flex items-center gap-3 rounded-lg bg-bureau-700/20 px-3 py-2 transition-colors hover:bg-bureau-700/30"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bureau-700/40 text-[10px] font-medium text-bureau-300">
                        {s.prenom[0]}
                        {s.nom[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-bureau-200 transition-colors group-hover:text-teal">
                          {s.prenom} {s.nom}
                        </p>
                        <p className="text-xs text-bureau-500">{s.groupe ?? "—"}</p>
                      </div>
                      {!s.actif && (
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-bureau-700/40 text-bureau-500">
                          Ancien
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Votes récents ── */}
        {recentScrutins.length > 0 && (
          <section className="border-t border-bureau-700/30 py-8">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Votes récents
              </h2>
              <Link
                href="/gouvernance/scrutins"
                className="text-xs text-teal/70 transition-colors hover:text-teal"
              >
                Tous les scrutins &rarr;
              </Link>
            </div>
            <div className="space-y-2">
              {recentScrutins.map((scrutin) => {
                const sortColor =
                  scrutin.sortCode === "adopté"
                    ? "text-teal border-teal/30 bg-teal/10"
                    : scrutin.sortCode === "rejeté"
                    ? "text-rose border-rose/30 bg-rose/10"
                    : "text-bureau-400 border-bureau-700/30 bg-bureau-800/20";
                return (
                  <Link
                    key={scrutin.id}
                    href={`/gouvernance/scrutins/${scrutin.id}`}
                    className="group flex items-start gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${sortColor}`}
                    >
                      {scrutin.sortCode}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-bureau-200 line-clamp-2 transition-colors group-hover:text-bureau-100">
                        {scrutin.titre}
                      </p>
                      <p className="mt-1 text-xs text-bureau-500">
                        {fmtDate(scrutin.dateScrutin)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Patrimoine (compact row) ── */}
        <section className="border-t border-bureau-700/30 py-8">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Patrimoine culturel
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={`/patrimoine/musees?dept=${departementCode}`}
              className="group flex items-center justify-between rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div>
                <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-amber">
                  Musées
                </p>
                <p className="text-xs text-bureau-500">Labels Musée de France</p>
              </div>
              <p className="text-2xl font-bold text-amber">{fmt(museeCount)}</p>
            </Link>
            <Link
              href={`/patrimoine/monuments?dept=${departementCode}`}
              className="group flex items-center justify-between rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div>
                <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-rose">
                  Monuments historiques
                </p>
                <p className="text-xs text-bureau-500">Classés et inscrits MH</p>
              </div>
              <p className="text-2xl font-bold text-rose">{fmt(monumentCount)}</p>
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
