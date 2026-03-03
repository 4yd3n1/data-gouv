import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtPct } from "@/lib/format";
import { DeltaBadge } from "@/components/delta-badge";

export const metadata: Metadata = {
  title: "Comparer deux départements — L'Observatoire Citoyen",
  description:
    "Comparez côte à côte les données économiques, budgétaires, sanitaires et représentatives de deux départements français.",
};

// ── Data ─────────────────────────────────────────────────────────────────────

async function getDeptData(code: string) {
  const [
    dept,
    statLocale,
    budget,
    deputeCount,
    senateurCount,
    eluCount,
    communeCount,
    mgDensite,
    museeCount,
    monumentCount,
  ] = await Promise.all([
    prisma.departement.findUnique({
      where: { code },
      include: { region: true },
    }),
    prisma.statLocale.findMany({
      where: { geoCode: code, geoType: "DEP" },
      select: { indicateur: true, valeur: true, annee: true, source: true, unite: true },
    }),
    prisma.budgetLocal.findFirst({
      where: { geoCode: code, geoType: "DEP" },
      orderBy: { annee: "desc" },
    }),
    prisma.depute.count({ where: { departementRefCode: code } }),
    prisma.senateur.count({ where: { departementCode: code } }),
    prisma.elu.count({ where: { codeDepartement: code } }),
    prisma.commune.count({ where: { departementCode: code, typecom: "COM" } }),
    prisma.densiteMedicale.findFirst({
      where: { departementCode: code, specialite: "MG" },
      orderBy: { annee: "desc" },
    }),
    prisma.musee.count({ where: { departementCode: code } }),
    prisma.monument.count({ where: { departementCode: code } }),
  ]);

  const statMap = Object.fromEntries(statLocale.map((s) => [s.indicateur, s]));
  return {
    dept,
    statMap,
    budget,
    deputeCount,
    senateurCount,
    eluCount,
    communeCount,
    mgDensite,
    museeCount,
    monumentCount,
  };
}

type DeptData = Awaited<ReturnType<typeof getDeptData>>;

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparerTerritoiresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { a, b } = await searchParams;

  // State 3: both codes → full comparison
  if (a && b) {
    const [dataA, dataB] = await Promise.all([getDeptData(a), getDeptData(b)]);
    if (!dataA.dept || !dataB.dept) {
      return (
        <ErrorState
          message={
            !dataA.dept
              ? `Département « ${a} » introuvable.`
              : `Département « ${b} » introuvable.`
          }
        />
      );
    }
    return <FullComparison codeA={a} dataA={dataA} codeB={b} dataB={dataB} />;
  }

  // State 2: only a → show A + input for B
  if (a) {
    const dataA = await getDeptData(a);
    if (!dataA.dept) return <ErrorState message={`Département « ${a} » introuvable.`} />;
    return <PartialComparison codeA={a} dataA={dataA} />;
  }

  // State 1: empty picker
  return <EmptyPicker />;
}

// ── State 1 ───────────────────────────────────────────────────────────────────

function EmptyPicker() {
  const EXAMPLES = [
    { a: "75", b: "93", labelA: "Paris", labelB: "Seine-Saint-Denis" },
    { a: "69", b: "13", labelA: "Rhône", labelB: "Bouches-du-Rhône" },
    { a: "35", b: "44", labelA: "Ille-et-Vilaine", labelB: "Loire-Atlantique" },
    { a: "06", b: "83", labelA: "Alpes-Maritimes", labelB: "Var" },
  ];
  return (
    <>
      <PageShell />
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-8 fade-up">
        <form method="GET" className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <input
              name="a"
              placeholder="Département A (ex : 75)"
              className="w-full rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-600 focus:border-teal/50 focus:outline-none"
              autoComplete="off"
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-bureau-600">vs</span>
            <input
              name="b"
              placeholder="Département B (ex : 93)"
              className="w-full rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-600 focus:border-teal/50 focus:outline-none"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-teal/10 border border-teal/30 px-6 py-3 text-sm font-semibold text-teal transition-colors hover:bg-teal/20"
          >
            Comparer
          </button>
        </form>

        <div className="border-t border-bureau-700/20 pt-6">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-bureau-600">
            Comparaisons fréquentes
          </p>
          <div className="space-y-2">
            {EXAMPLES.map(({ a, b, labelA, labelB }) => (
              <Link
                key={`${a}-${b}`}
                href={`/comparer/territoires?a=${a}&b=${b}`}
                className="group flex items-center justify-between rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-colors hover:border-teal/20 hover:bg-bureau-800/40"
              >
                <span className="text-sm text-bureau-300 group-hover:text-teal">
                  {labelA}
                </span>
                <span className="text-xs text-bureau-600">vs</span>
                <span className="text-sm text-bureau-300 group-hover:text-teal">
                  {labelB}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── State 2 ───────────────────────────────────────────────────────────────────

function PartialComparison({ codeA, dataA }: { codeA: string; dataA: DeptData }) {
  const { dept } = dataA;
  return (
    <>
      <PageShell />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: dept A summary card */}
          <div className="card-accent rounded-xl border border-teal/20 bg-teal/5 p-6">
            <p className="text-[10px] uppercase tracking-widest text-teal/60 mb-1">Département A</p>
            <p className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100">
              {dept!.libelle}
            </p>
            <p className="mt-1 text-sm text-bureau-500">
              {dept!.region.libelle} &middot; {codeA}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {dataA.statMap["POP_TOTAL"] && (
                <MiniStat label="Population" value={fmt(Math.round(dataA.statMap["POP_TOTAL"].valeur))} />
              )}
              {dataA.statMap["MEDIAN_INCOME"] && (
                <MiniStat label="Revenu médian" value={fmtEuro(dataA.statMap["MEDIAN_INCOME"].valeur)} />
              )}
              <MiniStat label="Communes" value={fmt(dataA.communeCount)} />
              <MiniStat label="Élus locaux" value={fmt(dataA.eluCount)} />
            </div>
          </div>

          {/* Right: input for dept B */}
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-3">
              Département B — à comparer
            </p>
            <form method="GET" className="space-y-3">
              <input type="hidden" name="a" value={codeA} />
              <input
                name="b"
                placeholder="Code département (ex : 93, 69, 06...)"
                autoFocus
                className="w-full rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-600 focus:border-teal/50 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-teal/10 border border-teal/30 px-6 py-3 text-sm font-semibold text-teal transition-colors hover:bg-teal/20"
              >
                Comparer avec {dept!.libelle}
              </button>
            </form>
            <div className="mt-5 border-t border-bureau-700/20 pt-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-bureau-600">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {["93", "69", "13", "59", "06", "35", "67", "76"].filter((c) => c !== codeA).slice(0, 6).map((c) => (
                  <Link
                    key={c}
                    href={`/comparer/territoires?a=${codeA}&b=${c}`}
                    className="rounded-lg border border-bureau-700/40 bg-bureau-800/30 px-2.5 py-1 text-xs text-bureau-400 transition-colors hover:border-teal/30 hover:text-teal"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── State 3 ───────────────────────────────────────────────────────────────────

function FullComparison({
  codeA,
  dataA,
  codeB,
  dataB,
}: {
  codeA: string;
  dataA: DeptData;
  codeB: string;
  dataB: DeptData;
}) {
  const { dept: dA, statMap: sA, budget: bA, mgDensite: mgA } = dataA;
  const { dept: dB, statMap: sB, budget: bB, mgDensite: mgB } = dataB;

  return (
    <>
      {/* ── Comparison header ── */}
      <div className="border-b border-bureau-700/30 bg-bureau-900/70 grid-bg">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-bureau-500">
            <Link href="/" className="hover:text-teal transition-colors">Accueil</Link>
            <span className="text-bureau-700">/</span>
            <Link href="/territoire" className="hover:text-teal transition-colors">Territoire</Link>
            <span className="text-bureau-700">/</span>
            <span className="text-bureau-300">Comparaison</span>
          </nav>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-teal/60 mb-1">Département A</p>
              <p className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100 leading-none">
                {dA!.libelle}
              </p>
              <p className="mt-1 text-sm text-bureau-500">
                {dA!.region.libelle} &middot; {codeA}
              </p>
            </div>
            <div className="text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-bureau-600">vs</p>
              <Link
                href="/comparer/territoires"
                className="mt-2 block text-[10px] text-bureau-600 hover:text-teal transition-colors"
              >
                Nouvelle comparaison
              </Link>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-amber/60 mb-1">Département B</p>
              <p className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100 leading-none">
                {dB!.libelle}
              </p>
              <p className="mt-1 text-sm text-bureau-500">
                {dB!.region.libelle} &middot; {codeB}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comparison grid ── */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">

        {/* Column labels — sticky reference */}
        <div className="flex items-center gap-0 rounded-xl border border-bureau-700/30 overflow-hidden">
          <div className="flex-1 bg-teal/5 border-r border-bureau-700/30 px-5 py-3">
            <p className="text-xs font-semibold text-teal/70 uppercase tracking-wider">{dA!.libelle}</p>
          </div>
          <div className="w-28 shrink-0 bg-bureau-800/30 px-2 py-3 text-center">
            <p className="text-[9px] uppercase tracking-widest text-bureau-600">Indicateur</p>
          </div>
          <div className="flex-1 bg-amber/5 border-l border-bureau-700/30 px-5 py-3 text-right">
            <p className="text-xs font-semibold text-amber/70 uppercase tracking-wider">{dB!.libelle}</p>
          </div>
        </div>

        {/* ── Identité ── */}
        <CompareSection label="Identité">
          <MetricRow
            label="Région"
            valA={dA!.region.libelle}
            valB={dB!.region.libelle}
          />
          <MetricRow
            label="Communes"
            valA={fmt(dataA.communeCount)}
            valB={fmt(dataB.communeCount)}
            rawA={dataA.communeCount}
            rawB={dataB.communeCount}
            higherIsBetter
          />
        </CompareSection>

        {/* ── Population ── */}
        {(sA["POP_TOTAL"] || sB["POP_TOTAL"]) && (
          <CompareSection label="Population">
            <MetricRow
              label="Habitants"
              valA={sA["POP_TOTAL"] ? fmt(Math.round(sA["POP_TOTAL"].valeur)) : "—"}
              valB={sB["POP_TOTAL"] ? fmt(Math.round(sB["POP_TOTAL"].valeur)) : "—"}
              rawA={sA["POP_TOTAL"]?.valeur}
              rawB={sB["POP_TOTAL"]?.valeur}
              higherIsBetter
            />
            {(sA["POP_0019"] || sB["POP_0019"]) && (
              <MetricRow
                label="0–19 ans"
                valA={sA["POP_0019"] ? fmt(Math.round(sA["POP_0019"].valeur)) : "—"}
                valB={sB["POP_0019"] ? fmt(Math.round(sB["POP_0019"].valeur)) : "—"}
                rawA={sA["POP_0019"]?.valeur}
                rawB={sB["POP_0019"]?.valeur}
                higherIsBetter
              />
            )}
            {(sA["POP_65PLUS"] || sB["POP_65PLUS"]) && (
              <MetricRow
                label="65 ans et +"
                valA={sA["POP_65PLUS"] ? fmt(Math.round(sA["POP_65PLUS"].valeur)) : "—"}
                valB={sB["POP_65PLUS"] ? fmt(Math.round(sB["POP_65PLUS"].valeur)) : "—"}
                rawA={sA["POP_65PLUS"]?.valeur}
                rawB={sB["POP_65PLUS"]?.valeur}
              />
            )}
          </CompareSection>
        )}

        {/* ── Économie ── */}
        {(sA["MEDIAN_INCOME"] || sB["MEDIAN_INCOME"] || sA["POVERTY_RATE"] || sB["POVERTY_RATE"]) && (
          <CompareSection label="Économie" note="Source : INSEE FILOSOFI / RP">
            {(sA["MEDIAN_INCOME"] || sB["MEDIAN_INCOME"]) && (
              <MetricRow
                label="Revenu médian"
                valA={sA["MEDIAN_INCOME"] ? fmtEuro(sA["MEDIAN_INCOME"].valeur) : "—"}
                valB={sB["MEDIAN_INCOME"] ? fmtEuro(sB["MEDIAN_INCOME"].valeur) : "—"}
                rawA={sA["MEDIAN_INCOME"]?.valeur}
                rawB={sB["MEDIAN_INCOME"]?.valeur}
                higherIsBetter
              />
            )}
            {(sA["POVERTY_RATE"] || sB["POVERTY_RATE"]) && (
              <MetricRow
                label="Taux de pauvreté"
                valA={sA["POVERTY_RATE"] ? fmtPct(sA["POVERTY_RATE"].valeur) : "—"}
                valB={sB["POVERTY_RATE"] ? fmtPct(sB["POVERTY_RATE"].valeur) : "—"}
                rawA={sA["POVERTY_RATE"]?.valeur}
                rawB={sB["POVERTY_RATE"]?.valeur}
                higherIsBetter={false}
              />
            )}
            {(sA["UNEMPLOYMENT_RATE_LOCAL"] || sB["UNEMPLOYMENT_RATE_LOCAL"]) && (
              <MetricRow
                label="Taux de chômage"
                valA={sA["UNEMPLOYMENT_RATE_LOCAL"] ? fmtPct(sA["UNEMPLOYMENT_RATE_LOCAL"].valeur) : "—"}
                valB={sB["UNEMPLOYMENT_RATE_LOCAL"] ? fmtPct(sB["UNEMPLOYMENT_RATE_LOCAL"].valeur) : "—"}
                rawA={sA["UNEMPLOYMENT_RATE_LOCAL"]?.valeur}
                rawB={sB["UNEMPLOYMENT_RATE_LOCAL"]?.valeur}
                higherIsBetter={false}
              />
            )}
          </CompareSection>
        )}

        {/* ── Budget ── */}
        {(bA || bB) && (
          <CompareSection label="Budget local" note="Source : DGFIP finances locales">
            <MetricRow
              label={`Dépenses /\u00a0hab${bA ? ` (${bA.annee})` : ""}`}
              valA={fmtEuro(bA?.depenseParHab ?? null)}
              valB={fmtEuro(bB?.depenseParHab ?? null)}
            />
            <MetricRow
              label="Dette / hab"
              valA={fmtEuro(bA?.detteParHab ?? null)}
              valB={fmtEuro(bB?.detteParHab ?? null)}
              rawA={bA?.detteParHab ?? undefined}
              rawB={bB?.detteParHab ?? undefined}
              higherIsBetter={false}
            />
            <MetricRow
              label="Total recettes"
              valA={fmtEuro(bA?.totalRecettes ?? null)}
              valB={fmtEuro(bB?.totalRecettes ?? null)}
              rawA={bA?.totalRecettes ?? undefined}
              rawB={bB?.totalRecettes ?? undefined}
              higherIsBetter
            />
          </CompareSection>
        )}

        {/* ── Santé ── */}
        {(mgA || mgB) && (
          <CompareSection label="Santé" note="Source : DREES">
            <MetricRow
              label="Médecins généralistes / 10 000 hab"
              valA={
                mgA
                  ? mgA.pour10k != null
                    ? `${mgA.pour10k.toFixed(1)} / 10k`
                    : `${fmt(mgA.nombreMedecins)} médecins`
                  : "—"
              }
              valB={
                mgB
                  ? mgB.pour10k != null
                    ? `${mgB.pour10k.toFixed(1)} / 10k`
                    : `${fmt(mgB.nombreMedecins)} médecins`
                  : "—"
              }
              rawA={mgA?.pour10k ?? undefined}
              rawB={mgB?.pour10k ?? undefined}
              higherIsBetter
            />
          </CompareSection>
        )}

        {/* ── Représentation ── */}
        <CompareSection label="Représentation nationale et locale">
          <MetricRow
            label="Députés"
            valA={fmt(dataA.deputeCount)}
            valB={fmt(dataB.deputeCount)}
            rawA={dataA.deputeCount}
            rawB={dataB.deputeCount}
            higherIsBetter
          />
          <MetricRow
            label="Sénateurs"
            valA={fmt(dataA.senateurCount)}
            valB={fmt(dataB.senateurCount)}
            rawA={dataA.senateurCount}
            rawB={dataB.senateurCount}
            higherIsBetter
          />
          <MetricRow
            label="Élus locaux"
            valA={fmt(dataA.eluCount)}
            valB={fmt(dataB.eluCount)}
            rawA={dataA.eluCount}
            rawB={dataB.eluCount}
            higherIsBetter
          />
        </CompareSection>

        {/* ── Patrimoine ── */}
        <CompareSection label="Patrimoine culturel">
          <MetricRow
            label="Musées"
            valA={fmt(dataA.museeCount)}
            valB={fmt(dataB.museeCount)}
            rawA={dataA.museeCount}
            rawB={dataB.museeCount}
            higherIsBetter
          />
          <MetricRow
            label="Monuments historiques"
            valA={fmt(dataA.monumentCount)}
            valB={fmt(dataB.monumentCount)}
            rawA={dataA.monumentCount}
            rawB={dataB.monumentCount}
            higherIsBetter
          />
        </CompareSection>

        {/* ── Explorer ── */}
        <div className="border-t border-bureau-700/20 pt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExploreLink href={`/territoire/${codeA}`} label={`Tableau de bord ${dA!.libelle}`} sub="Détails complets" />
          <ExploreLink href={`/territoire/${codeB}`} label={`Tableau de bord ${dB!.libelle}`} sub="Détails complets" />
          <ExploreLink href="/comparer/territoires" label="Nouvelle comparaison" sub="Choisir deux autres depts" />
          <ExploreLink href="/territoire" label="Tous les départements" sub="Parcourir le territoire" />
        </div>

      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PageShell() {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-bureau-500">
          <Link href="/" className="hover:text-teal transition-colors">Accueil</Link>
          <span className="text-bureau-700">/</span>
          <Link href="/territoire" className="hover:text-teal transition-colors">Territoire</Link>
          <span className="text-bureau-700">/</span>
          <span className="text-bureau-300">Comparer deux départements</span>
        </nav>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100">
          Comparer deux départements
        </h1>
        <p className="mt-2 text-sm text-bureau-500">
          Économie, budget, santé, représentation — côte à côte.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <>
      <PageShell />
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-bureau-400 italic">{message}</p>
        <Link href="/comparer/territoires" className="mt-4 inline-block text-xs text-teal hover:underline">
          Nouvelle comparaison
        </Link>
      </div>
    </>
  );
}

function CompareSection({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-4">
        <div className="h-5 w-0.5 shrink-0 rounded-full bg-teal/50" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-bureau-300">{label}</h2>
        {note && <p className="ml-auto text-[10px] text-bureau-600">{note}</p>}
      </div>
      <div className="overflow-hidden rounded-xl border border-bureau-700/30">
        {children}
      </div>
    </section>
  );
}

function MetricRow({
  label,
  valA,
  valB,
  rawA,
  rawB,
  higherIsBetter = true,
}: {
  label: string;
  valA: string;
  valB: string;
  rawA?: number | null;
  rawB?: number | null;
  higherIsBetter?: boolean;
}) {
  const hasRaw = rawA != null && rawB != null && rawA !== rawB;
  const aBetter = hasRaw && (higherIsBetter ? rawA! > rawB! : rawA! < rawB!);
  const bBetter = hasRaw && !aBetter;

  return (
    <div className="flex border-t border-bureau-700/20 first:border-t-0">
      <div className={`flex-1 px-5 py-4 ${aBetter ? "bg-teal/5" : "bg-bureau-800/10"}`}>
        <p className={`text-xl font-bold tabular-nums ${aBetter ? "text-teal" : "text-bureau-200"}`}>
          {valA}
        </p>
        {aBetter && rawA != null && rawB != null && (
          <DeltaBadge value={rawA} reference={rawB} />
        )}
      </div>
      <div className="w-28 shrink-0 flex items-center justify-center bg-bureau-800/20 border-x border-bureau-700/20 px-2 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bureau-500 text-center leading-snug">
          {label}
        </p>
      </div>
      <div className={`flex-1 px-5 py-4 text-right ${bBetter ? "bg-teal/5" : "bg-bureau-800/10"}`}>
        <p className={`text-xl font-bold tabular-nums ${bBetter ? "text-teal" : "text-bureau-200"}`}>
          {valB}
        </p>
        {bBetter && rawB != null && rawA != null && (
          <DeltaBadge value={rawB} reference={rawA} />
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/30 px-3 py-2">
      <p className="text-[9px] uppercase tracking-widest text-bureau-600">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-bureau-200">{value}</p>
    </div>
  );
}

function ExploreLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-4 py-4 transition-all hover:border-teal/20 hover:bg-bureau-800/40"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-bureau-200 group-hover:text-teal transition-colors">{label}</p>
        <p className="text-xs text-bureau-600">{sub}</p>
      </div>
      <span className="shrink-0 text-bureau-600 group-hover:text-teal">→</span>
    </Link>
  );
}
