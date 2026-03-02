import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtPct, fmtDate } from "@/lib/format";

const SVG_W = 560;
const SVG_H = 90;
const SVG_PAD_X = 20;
const SVG_PAD_Y = 16;

const CRIME_LABELS: Record<string, string> = {
  coups_blessures: "Violences physiques",
  vols_sans_violence: "Vols sans violence",
  cambriolages: "Cambriolages",
  violences_sexuelles: "Violences sexuelles",
  escroqueries: "Escroqueries",
  destructions: "Destructions",
  homicides: "Homicides",
};

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
    prisma.elu.count({ where: { codeDepartement: departementCode } }),
    prisma.commune.count({ where: { departementCode, typecom: "COM" } }),
    prisma.musee.count({ where: { departementCode } }),
    prisma.monument.count({ where: { departementCode } }),
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
      where: { votes: { some: { depute: { departementRefCode: departementCode } } } },
      orderBy: { dateScrutin: "desc" },
      take: 8,
      select: { id: true, titre: true, dateScrutin: true, sortCode: true },
    }),
    prisma.densiteMedicale.findFirst({
      where: { departementCode, specialite: "MG" },
      orderBy: { annee: "desc" },
    }),
    prisma.statCriminalite.findMany({
      where: { departementCode },
      orderBy: [{ annee: "desc" }, { indicateur: "asc" }],
      take: 20,
    }),
  ]);

  const statMap = Object.fromEntries(statLocale.map((s) => [s.indicateur, s]));

  // Budget trend — pre-compute SVG positions
  const budgetTrend = budgetYears
    .map((b) => ({ annee: b.annee, val: b.depenseParHab ?? null }))
    .filter((b): b is { annee: number; val: number } => b.val !== null);

  interface BudgetPoint { annee: number; val: number; x: number; y: number }
  let svgPoints: BudgetPoint[] = [];
  let svgPolyline = "";
  let svgAreaPath = "";
  if (budgetTrend.length > 1) {
    const vals = budgetTrend.map((b) => b.val);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const range = maxVal - minVal || 1;
    const innerW = SVG_W - SVG_PAD_X * 2;
    const innerH = SVG_H - SVG_PAD_Y * 2;
    const colW = innerW / (budgetTrend.length - 1);
    svgPoints = budgetTrend.map((b, i) => ({
      annee: b.annee,
      val: b.val,
      x: SVG_PAD_X + i * colW,
      y: SVG_PAD_Y + innerH * (1 - (b.val - minVal) / range),
    }));
    svgPolyline = svgPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    svgAreaPath = [
      `M ${svgPoints[0].x.toFixed(1)},${(SVG_H - SVG_PAD_Y).toFixed(1)}`,
      ...svgPoints.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `L ${svgPoints[svgPoints.length - 1].x.toFixed(1)},${(SVG_H - SVG_PAD_Y).toFixed(1)}`,
      "Z",
    ].join(" ");
  }

  // Crime stats — deduplicate to latest year per indicator
  const crimeLatest = new Map<string, (typeof criminalite)[0]>();
  for (const c of criminalite) {
    if (!crimeLatest.has(c.indicateur)) crimeLatest.set(c.indicateur, c);
  }
  const crimeStats = Array.from(crimeLatest.values()).slice(0, 4);

  const hasEconomie =
    !!(statMap["MEDIAN_INCOME"] || statMap["POVERTY_RATE"] || statMap["UNEMPLOYMENT_RATE_LOCAL"]);
  const hasSante = !!(mgDensite || crimeStats.length > 0);

  return (
    <>
      {/* ── Hero ── */}
      <div className="relative border-b border-bureau-700/30 bg-bureau-900/70 grid-bg overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-bureau-500">
            <Link href="/" className="transition-colors hover:text-teal">Accueil</Link>
            <span className="text-bureau-700">/</span>
            <Link href="/territoire" className="transition-colors hover:text-teal">Territoire</Link>
            <span className="text-bureau-700">/</span>
            <span className="text-bureau-300">{dept.libelle}</span>
          </nav>

          <div className="flex items-start justify-between gap-10">
            <div className="flex-1 min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal/60">
                {dept.region.libelle}
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-5xl font-medium text-bureau-100 leading-none">
                {dept.libelle}
              </h1>

              {/* Key stats row */}
              <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-bureau-700/30 pt-6">
                {statMap["POP_TOTAL"] && (
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-amber">
                      {fmt(Math.round(statMap["POP_TOTAL"].valeur))}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Habitants</p>
                  </div>
                )}
                <div>
                  <p className="text-3xl font-bold tabular-nums text-teal">{fmt(communeCount)}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Communes</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums text-teal">{fmt(eluCount)}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Élus locaux</p>
                </div>
                <div>
                  <p className="text-3xl font-bold tabular-nums text-teal">
                    {fmt(deputes.length + senateurs.length)}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Représentants nationaux</p>
                </div>
                {statMap["MEDIAN_INCOME"] && (
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-amber">
                      {fmtEuro(statMap["MEDIAN_INCOME"].valeur)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Revenu médian</p>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative dept code */}
            <div className="hidden lg:block shrink-0 select-none pointer-events-none">
              <p className="font-[family-name:var(--font-display)] leading-none text-[10rem] font-bold text-bureau-700/25">
                {dept.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="mx-auto max-w-7xl px-6 py-14 space-y-16">

        {/* ── Économie locale ── */}
        {hasEconomie && (
          <section>
            <SectionHeader color="amber" label="Économie locale" note="Source : INSEE (FILOSOFI / RP)" />
            <div className="grid gap-4 sm:grid-cols-3">
              {statMap["MEDIAN_INCOME"] && (
                <StatCard
                  label="Revenu médian"
                  value={fmtEuro(statMap["MEDIAN_INCOME"].valeur)}
                  meta={`${statMap["MEDIAN_INCOME"].annee} · ${statMap["MEDIAN_INCOME"].source}`}
                  color="text-amber"
                />
              )}
              {statMap["POVERTY_RATE"] && (
                <StatCard
                  label="Taux de pauvreté"
                  value={fmtPct(statMap["POVERTY_RATE"].valeur)}
                  meta={`${statMap["POVERTY_RATE"].annee} · ${statMap["POVERTY_RATE"].source}`}
                  color="text-rose"
                />
              )}
              {statMap["UNEMPLOYMENT_RATE_LOCAL"] && (
                <StatCard
                  label="Taux de chômage"
                  value={fmtPct(statMap["UNEMPLOYMENT_RATE_LOCAL"].valeur)}
                  meta={`${statMap["UNEMPLOYMENT_RATE_LOCAL"].annee} · ${statMap["UNEMPLOYMENT_RATE_LOCAL"].source}`}
                  color="text-amber"
                />
              )}
            </div>
          </section>
        )}

        {/* ── Budget local ── */}
        {budgetDept && (
          <section>
            <SectionHeader
              color="teal"
              label="Budget local"
              sublabel={`exercice ${budgetDept.annee}`}
              note="Source : DGFIP finances locales"
            />

            {/* 4 KPI cards */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Dépenses / habitant"
                value={fmtEuro(budgetDept.depenseParHab ?? null)}
                color="text-teal"
              />
              <StatCard
                label="Dette / habitant"
                value={fmtEuro(budgetDept.detteParHab ?? null)}
                color="text-rose"
              />
              <StatCard
                label="Total recettes"
                value={fmtEuro(budgetDept.totalRecettes ?? null)}
                color="text-amber"
                compact
              />
              <StatCard
                label="Charges personnel"
                value={fmtEuro(budgetDept.chargesPersonnel ?? null)}
                color="text-bureau-200"
                compact
              />
            </div>

            {/* Budget trend chart */}
            {svgPoints.length > 1 && (
              <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-5">
                <p className="mb-5 text-[10px] uppercase tracking-widest text-bureau-500">
                  Dépenses par habitant — évolution pluriannuelle
                </p>
                <div className="overflow-x-auto">
                  <svg
                    width={SVG_W}
                    height={SVG_H + 28}
                    viewBox={`0 0 ${SVG_W} ${SVG_H + 28}`}
                    className="w-full max-w-[560px] overflow-visible"
                    aria-hidden="true"
                  >
                    {/* Area fill */}
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(45,212,191,0.18)" />
                        <stop offset="100%" stopColor="rgba(45,212,191,0.01)" />
                      </linearGradient>
                    </defs>
                    <path d={svgAreaPath} fill="url(#areaGrad)" />
                    {/* Baseline */}
                    <line
                      x1={SVG_PAD_X}
                      y1={SVG_H - SVG_PAD_Y}
                      x2={SVG_W - SVG_PAD_X}
                      y2={SVG_H - SVG_PAD_Y}
                      stroke="rgba(59,79,110,0.4)"
                      strokeWidth="1"
                    />
                    {/* Line */}
                    <polyline
                      points={svgPolyline}
                      fill="none"
                      stroke="rgba(45,212,191,0.8)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Dots + labels */}
                    {svgPoints.map((p) => (
                      <g key={p.annee}>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#0c1018" />
                        <circle cx={p.x} cy={p.y} r="3" fill="rgba(45,212,191,0.9)" />
                        {/* Value above point */}
                        <text
                          x={p.x}
                          y={p.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fill="rgba(203,213,225,0.75)"
                          fontFamily="inherit"
                        >
                          {fmtEuro(p.val)}
                        </text>
                        {/* Year below baseline */}
                        <text
                          x={p.x}
                          y={SVG_H + 16}
                          textAnchor="middle"
                          fontSize="10"
                          fill="rgba(59,79,110,1)"
                          fontFamily="inherit"
                        >
                          {p.annee}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Santé & Sécurité ── */}
        {hasSante && (
          <section>
            <SectionHeader color="rose" label="Santé & Sécurité" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mgDensite && (
                <div className="card-accent rounded-xl border border-teal/20 bg-teal/5 p-6">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    Médecins généralistes
                  </p>
                  <p className="mt-3 text-2xl font-bold text-teal">
                    {mgDensite.pour10k !== null
                      ? `${mgDensite.pour10k.toFixed(1)} / 10 000 hab`
                      : `${fmt(mgDensite.nombreMedecins)} médecins`}
                  </p>
                  <p className="mt-2 text-xs text-bureau-600">{mgDensite.annee} · DREES</p>
                </div>
              )}
              {crimeStats.map((c) => (
                <div
                  key={c.indicateur}
                  className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    {CRIME_LABELS[c.indicateur] ?? c.indicateur}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-bureau-200">
                    {c.tauxPour1000 !== null
                      ? `${c.tauxPour1000.toFixed(2)} ‰`
                      : c.total !== null
                      ? fmt(c.total)
                      : "—"}
                  </p>
                  <p className="mt-2 text-xs text-bureau-600">{c.annee} · SSMSI</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Représentants nationaux ── */}
        <section>
          <SectionHeader color="blue" label="Représentants nationaux" />
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Deputies */}
            <div className="card-accent overflow-hidden rounded-xl border border-bureau-700/30 bg-bureau-800/20">
              <div className="border-b border-bureau-700/30 bg-bureau-800/30 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-bureau-400">
                  Assemblée nationale
                  <span className="ml-1.5 font-normal normal-case text-bureau-500">
                    — {deputes.length} député{deputes.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              {deputes.length === 0 ? (
                <p className="px-5 py-4 text-sm italic text-bureau-500">Aucun député rattaché.</p>
              ) : (
                <div className="divide-y divide-bureau-700/20">
                  {deputes.map((d) => (
                    <Link
                      key={d.id}
                      href={`/representants/deputes/${d.id}`}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bureau-700/20"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue/20 bg-blue/10 text-[10px] font-semibold text-blue">
                        {d.prenom[0]}{d.nom[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                          {d.prenom} {d.nom}
                        </p>
                        <p className="text-xs text-bureau-500">{d.groupeAbrev ?? "—"}</p>
                      </div>
                      {!d.actif && (
                        <span className="shrink-0 rounded bg-bureau-700/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-bureau-500">
                          Ancien
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Senators */}
            <div className="card-accent overflow-hidden rounded-xl border border-bureau-700/30 bg-bureau-800/20">
              <div className="border-b border-bureau-700/30 bg-bureau-800/30 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-bureau-400">
                  Sénat
                  <span className="ml-1.5 font-normal normal-case text-bureau-500">
                    — {senateurs.length} sénateur{senateurs.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              {senateurs.length === 0 ? (
                <p className="px-5 py-4 text-sm italic text-bureau-500">Aucun sénateur rattaché.</p>
              ) : (
                <div className="divide-y divide-bureau-700/20">
                  {senateurs.map((s) => (
                    <Link
                      key={s.id}
                      href={`/representants/senateurs/${s.id}`}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bureau-700/20"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal/20 bg-teal/10 text-[10px] font-semibold text-teal">
                        {s.prenom[0]}{s.nom[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                          {s.prenom} {s.nom}
                        </p>
                        <p className="text-xs text-bureau-500">{s.groupe ?? "—"}</p>
                      </div>
                      {!s.actif && (
                        <span className="shrink-0 rounded bg-bureau-700/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-bureau-500">
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
          <section>
            <div className="mb-6 flex items-center justify-between gap-4">
              <SectionHeader color="teal-dim" label="Votes récents" inline />
              <Link
                href="/gouvernance/scrutins"
                className="text-xs text-teal/60 transition-colors hover:text-teal"
              >
                Tous les scrutins &rarr;
              </Link>
            </div>
            <div className="space-y-2">
              {recentScrutins.map((scrutin) => {
                const isAdopte = scrutin.sortCode === "adopté";
                const isRejete = scrutin.sortCode === "rejeté";
                return (
                  <Link
                    key={scrutin.id}
                    href={`/gouvernance/scrutins/${scrutin.id}`}
                    className="group flex items-start gap-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                        isAdopte
                          ? "border-teal/30 bg-teal/10 text-teal"
                          : isRejete
                          ? "border-rose/30 bg-rose/10 text-rose"
                          : "border-bureau-700/30 bg-bureau-800/20 text-bureau-400"
                      }`}
                    >
                      {scrutin.sortCode}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug text-bureau-200 transition-colors group-hover:text-bureau-100">
                        {scrutin.titre}
                      </p>
                      <p className="mt-1.5 text-xs text-bureau-500">{fmtDate(scrutin.dateScrutin)}</p>
                    </div>
                    <span className="mt-0.5 shrink-0 text-bureau-600 transition-colors group-hover:text-bureau-400">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Patrimoine culturel ── */}
        <section className="pb-4">
          <SectionHeader color="rose-dim" label="Patrimoine culturel" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={`/patrimoine/musees?dept=${departementCode}`}
              className="group card-accent flex items-center justify-between rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-6 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div>
                <p className="text-sm font-semibold text-bureau-200 transition-colors group-hover:text-amber">
                  Musées
                </p>
                <p className="mt-0.5 text-xs text-bureau-500">Labels Musée de France</p>
              </div>
              <p className="text-5xl font-bold tabular-nums text-amber">{fmt(museeCount)}</p>
            </Link>
            <Link
              href={`/patrimoine/monuments?dept=${departementCode}`}
              className="group card-accent flex items-center justify-between rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-6 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div>
                <p className="text-sm font-semibold text-bureau-200 transition-colors group-hover:text-rose">
                  Monuments historiques
                </p>
                <p className="mt-0.5 text-xs text-bureau-500">Classés et inscrits MH</p>
              </div>
              <p className="text-5xl font-bold tabular-nums text-rose">{fmt(monumentCount)}</p>
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({
  color,
  label,
  sublabel,
  note,
  inline,
}: {
  color: "teal" | "teal-dim" | "amber" | "rose" | "rose-dim" | "blue";
  label: string;
  sublabel?: string;
  note?: string;
  inline?: boolean;
}) {
  const bar: Record<string, string> = {
    teal: "bg-teal",
    "teal-dim": "bg-teal/50",
    amber: "bg-amber",
    rose: "bg-rose",
    "rose-dim": "bg-rose/60",
    blue: "bg-blue",
  };
  return (
    <div className={`flex items-center gap-4 ${inline ? "" : "mb-6"}`}>
      <div className={`h-5 w-0.5 shrink-0 rounded-full ${bar[color]}`} />
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-bureau-300">
        {label}
        {sublabel && (
          <span className="ml-2 font-normal normal-case text-bureau-500">{sublabel}</span>
        )}
      </h2>
      {note && <p className="ml-auto text-[10px] text-bureau-600">{note}</p>}
    </div>
  );
}

function StatCard({
  label,
  value,
  meta,
  color,
  compact,
}: {
  label: string;
  value: string;
  meta?: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
      <p className="text-[10px] uppercase tracking-widest text-bureau-500">{label}</p>
      <p className={`mt-3 font-bold tabular-nums ${color} ${compact ? "text-xl" : "text-3xl"}`}>
        {value}
      </p>
      {meta && <p className="mt-2 text-xs text-bureau-600">{meta}</p>}
    </div>
  );
}
