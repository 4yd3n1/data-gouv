import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtPct, fmtDate } from "@/lib/format";
import { SearchInput } from "@/components/search-input";
import { resolvePostalCode } from "@/lib/postal-resolver";

export const metadata: Metadata = {
  title: "Mon Territoire — L'Observatoire Citoyen",
  description:
    "Entrez votre code postal et accédez à votre tableau de bord civique : représentants, budget local, économie, santé et votes.",
};

const CRIME_LABELS: Record<string, string> = {
  coups_blessures: "Violences physiques",
  vols_sans_violence: "Vols sans violence",
  cambriolages: "Cambriolages",
  violences_sexuelles: "Violences sexuelles",
  escroqueries: "Escroqueries",
  destructions: "Destructions",
  homicides: "Homicides",
};

// ── Data ─────────────────────────────────────────────────────────────────────

async function getMonTerritoireData(communeCode: string, deptCode: string) {
  const [
    commune,
    deputes,
    senateurs,
    maire,
    eluCount,
    statLocale,
    budgetCommune,
    budgetDept,
    densiteMed,
    criminalite,
    recentScrutins,
    musees,
    monumentCount,
  ] = await Promise.all([
    prisma.commune.findUnique({
      where: { code: communeCode },
      include: { departement: { include: { region: true } } },
    }),
    prisma.depute.findMany({
      where: { departementRefCode: deptCode, actif: true },
      orderBy: { nom: "asc" },
      take: 6,
    }),
    prisma.senateur.findMany({
      where: { departementCode: deptCode, actif: true },
      orderBy: { nom: "asc" },
      take: 4,
    }),
    prisma.elu.findFirst({
      where: {
        codeCommune: communeCode,
        fonction: { startsWith: "Maire" },
      },
    }),
    prisma.elu.count({ where: { codeCommune: communeCode } }),
    prisma.statLocale.findMany({
      where: { geoCode: deptCode, geoType: "DEP" },
      select: { indicateur: true, valeur: true, unite: true, annee: true, source: true },
    }),
    prisma.budgetLocal.findFirst({
      where: { geoCode: communeCode, geoType: "COM" },
      orderBy: { annee: "desc" },
    }),
    prisma.budgetLocal.findFirst({
      where: { geoCode: deptCode, geoType: "DEP" },
      orderBy: { annee: "desc" },
    }),
    prisma.densiteMedicale.findFirst({
      where: { departementCode: deptCode, specialite: "MG" },
      orderBy: { annee: "desc" },
    }),
    prisma.statCriminalite.findMany({
      where: { departementCode: deptCode },
      orderBy: [{ annee: "desc" }, { indicateur: "asc" }],
      take: 20,
    }),
    prisma.scrutin.findMany({
      where: { votes: { some: { depute: { departementRefCode: deptCode } } } },
      orderBy: { dateScrutin: "desc" },
      take: 6,
      select: { id: true, titre: true, dateScrutin: true, sortCode: true },
    }),
    prisma.musee.findMany({
      where: { departementCode: deptCode },
      orderBy: { nom: "asc" },
      take: 3,
    }),
    prisma.monument.count({ where: { departementCode: deptCode } }),
  ]);

  return {
    commune,
    deputes,
    senateurs,
    maire,
    eluCount,
    statLocale,
    budgetCommune,
    budgetDept,
    densiteMed,
    criminalite,
    recentScrutins,
    musees,
    monumentCount,
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function Dashboard({ communeCode, deptCode, cp }: { communeCode: string; deptCode: string; cp?: string }) {
  const data = await getMonTerritoireData(communeCode, deptCode);
  const { commune, deputes, senateurs, maire, eluCount, statLocale, budgetCommune, budgetDept, densiteMed, criminalite, recentScrutins, musees, monumentCount } = data;

  if (!commune) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-bureau-500 italic">Commune introuvable (code {communeCode}).</p>
        <Link href="/mon-territoire" className="mt-4 inline-block text-xs text-teal hover:underline">
          Nouvelle recherche
        </Link>
      </div>
    );
  }

  const dept = commune.departement;
  const region = dept?.region;

  const statMap = Object.fromEntries(statLocale.map((s) => [s.indicateur, s]));
  const budget = budgetCommune ?? budgetDept;
  const budgetLabel = budgetCommune ? "commune" : "département";

  // Crime stats — deduplicate to latest year per indicator
  const crimeLatest = new Map<string, (typeof criminalite)[0]>();
  for (const c of criminalite) {
    if (!crimeLatest.has(c.indicateur)) crimeLatest.set(c.indicateur, c);
  }
  const crimeStats = Array.from(crimeLatest.values()).slice(0, 4);

  return (
    <>
      {/* ── Hero ── */}
      <div className="relative border-b border-bureau-700/30 bg-bureau-900/70 grid-bg overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Breadcrumbs */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-bureau-500">
            <Link href="/" className="transition-colors hover:text-teal">Accueil</Link>
            <span className="text-bureau-700">/</span>
            <Link href="/mon-territoire" className="transition-colors hover:text-teal">Mon Territoire</Link>
            <span className="text-bureau-700">/</span>
            <span className="text-bureau-300">{commune.libelle}</span>
          </nav>

          <div className="flex items-start justify-between gap-10">
            <div className="flex-1 min-w-0">
              {region && dept && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal/60">
                  {region.libelle} &middot; {dept.libelle}
                </p>
              )}
              <h1 className="font-[family-name:var(--font-display)] text-5xl font-medium text-bureau-100 leading-none">
                {commune.libelle}
              </h1>
              {cp && (
                <p className="mt-2 text-sm text-bureau-500">Code postal {cp}</p>
              )}

              {/* Key stats row */}
              <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-bureau-700/30 pt-6">
                {statMap["POP_TOTAL"] && (
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-amber">
                      {fmt(Math.round(statMap["POP_TOTAL"].valeur))}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">
                      Habitants (dépt)
                    </p>
                  </div>
                )}
                {eluCount > 0 && (
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-teal">{fmt(eluCount)}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">Élus locaux</p>
                  </div>
                )}
                <div>
                  <p className="text-3xl font-bold tabular-nums text-teal">
                    {fmt(deputes.length + senateurs.length)}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">
                    Représentants nationaux
                  </p>
                </div>
                {statMap["MEDIAN_INCOME"] && (
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-amber">
                      {fmtEuro(statMap["MEDIAN_INCOME"].valeur)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-bureau-500">
                      Revenu médian (dépt)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative dept code */}
            {dept && (
              <div className="hidden lg:block shrink-0 select-none pointer-events-none">
                <p className="font-[family-name:var(--font-display)] leading-none text-[10rem] font-bold text-bureau-700/25">
                  {dept.code}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="mx-auto max-w-7xl px-6 py-14 space-y-16">

        {/* ── Mes Représentants ── */}
        <section>
          <SectionHeader color="blue" label="Mes Représentants" />

          {/* Maire */}
          {maire && (
            <div className="mb-5 flex items-center gap-4 rounded-xl border border-blue/20 bg-blue/5 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue/30 bg-blue/10 text-sm font-semibold text-blue">
                {maire.prenom[0]}{maire.nom[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-bureau-200">
                  {maire.prenom} {maire.nom}
                </p>
                <p className="text-xs text-bureau-500">
                  {maire.fonction} · {commune.libelle}
                  {eluCount > 0 && ` · ${fmt(eluCount)} élus locaux`}
                </p>
              </div>
              <Link
                href={`/territoire/commune/${communeCode}`}
                className="shrink-0 text-xs text-bureau-500 transition-colors hover:text-teal"
              >
                Tous les élus &rarr;
              </Link>
            </div>
          )}

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
                      {d.scoreParticipation !== null && (
                        <span className="shrink-0 text-xs text-bureau-500">
                          {d.scoreParticipation}%
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
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Économie locale ── */}
        {(statMap["MEDIAN_INCOME"] || statMap["POVERTY_RATE"] || statMap["UNEMPLOYMENT_RATE_LOCAL"]) && (
          <section>
            <SectionHeader
              color="amber"
              label="Économie locale"
              sublabel={`département ${deptCode}`}
              note="Source : INSEE (FILOSOFI / RP)"
            />
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
        {budget && (
          <section>
            <SectionHeader
              color="teal"
              label="Budget local"
              sublabel={`${budgetLabel} · exercice ${budget.annee}`}
              note="Source : DGFIP finances locales"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Dépenses / habitant"
                value={fmtEuro(budget.depenseParHab ?? null)}
                color="text-teal"
              />
              <StatCard
                label="Dette / habitant"
                value={fmtEuro(budget.detteParHab ?? null)}
                color="text-rose"
              />
              <StatCard
                label="Total recettes"
                value={fmtEuro(budget.totalRecettes ?? null)}
                color="text-amber"
                compact
              />
              <StatCard
                label="Charges personnel"
                value={fmtEuro(budget.chargesPersonnel ?? null)}
                color="text-bureau-200"
                compact
              />
            </div>
          </section>
        )}

        {/* ── Santé & Sécurité ── */}
        {(densiteMed || crimeStats.length > 0) && (
          <section>
            <SectionHeader
              color="rose"
              label="Santé & Sécurité"
              sublabel={`département ${deptCode}`}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {densiteMed && (
                <div className="card-accent rounded-xl border border-teal/20 bg-teal/5 p-6">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    Médecins généralistes
                  </p>
                  <p className="mt-3 text-2xl font-bold text-teal">
                    {densiteMed.pour10k !== null
                      ? `${densiteMed.pour10k.toFixed(1)} / 10 000 hab`
                      : `${fmt(densiteMed.nombreMedecins)} médecins`}
                  </p>
                  <p className="mt-2 text-xs text-bureau-600">{densiteMed.annee} · DREES</p>
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

        {/* ── Comment votent mes députés ── */}
        {recentScrutins.length > 0 && (
          <section>
            <div className="mb-6 flex items-center justify-between gap-4">
              <SectionHeader color="teal-dim" label="Comment votent mes députés" inline />
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

        {/* ── Patrimoine local ── */}
        {(musees.length > 0 || monumentCount > 0) && (
          <section>
            <SectionHeader
              color="rose-dim"
              label="Patrimoine local"
              sublabel={`département ${deptCode}`}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {musees.length > 0 && (
                <Link
                  href={`/patrimoine/musees?dept=${deptCode}`}
                  className="group card-accent flex items-center justify-between rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-6 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-bureau-200 transition-colors group-hover:text-amber">
                      Musées
                    </p>
                    <p className="mt-1 text-xs text-bureau-500">
                      {musees.slice(0, 2).map((m) => m.nom).join(", ")}
                      {musees.length > 2 ? "..." : ""}
                    </p>
                  </div>
                </Link>
              )}
              {monumentCount > 0 && (
                <Link
                  href={`/patrimoine/monuments?dept=${deptCode}`}
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
              )}
            </div>
          </section>
        )}

        {/* ── Explorer plus ── */}
        <section className="pb-4">
          <SectionHeader color="teal-dim" label="Explorer plus" />
          <div className="grid gap-3 sm:grid-cols-3">
            {dept && (
              <Link
                href={`/territoire/${deptCode}`}
                className="group flex items-center gap-3 rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4 transition-all hover:border-teal/30 hover:bg-bureau-800/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                    Département {dept.libelle}
                  </p>
                  <p className="text-xs text-bureau-500">Tableau de bord complet</p>
                </div>
                <span className="shrink-0 text-bureau-600 group-hover:text-teal">→</span>
              </Link>
            )}
            <Link
              href={`/territoire/commune/${communeCode}`}
              className="group flex items-center gap-3 rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4 transition-all hover:border-teal/30 hover:bg-bureau-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                  Commune {commune.libelle}
                </p>
                <p className="text-xs text-bureau-500">Élus, budget, patrimoine</p>
              </div>
              <span className="shrink-0 text-bureau-600 group-hover:text-teal">→</span>
            </Link>
            <Link
              href="/votes/mon-depute"
              className="group flex items-center gap-3 rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4 transition-all hover:border-teal/30 hover:bg-bureau-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                  Mon député
                </p>
                <p className="text-xs text-bureau-500">Votes par thème législatif</p>
              </div>
              <span className="shrink-0 text-bureau-600 group-hover:text-teal">→</span>
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MonTerritoirePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { cp, code } = await searchParams;

  // ── State 3: commune code provided directly ──
  if (code) {
    // Determine dept from commune code (first 2 chars, or 3 for overseas)
    const commune = await prisma.commune.findUnique({
      where: { code },
      select: { departementCode: true, libelle: true },
    });
    const deptCode = commune?.departementCode ?? code.slice(0, 2);

    return (
      <Suspense fallback={<LoadingState />}>
        <Dashboard communeCode={code} deptCode={deptCode} cp={cp} />
      </Suspense>
    );
  }

  // ── State 2: postal code provided — resolve ──
  if (cp) {
    const territories = await resolvePostalCode(cp);

    if (territories.length === 0) {
      return (
        <>
          <PageShell />
          <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
            <Suspense>
              <SearchInput placeholder="Code postal (ex : 75011, 33000)..." paramName="cp" />
            </Suspense>
            <div className="py-8 text-center fade-up">
              <p className="text-sm text-bureau-400">
                Aucune commune trouvée pour le code postal &laquo;&nbsp;{cp}&nbsp;&raquo;.
              </p>
              <Link href="/mon-territoire" className="mt-3 inline-block text-xs text-teal hover:underline">
                Réessayer
              </Link>
            </div>
          </div>
        </>
      );
    }

    if (territories.length === 1) {
      const t = territories[0];
      return (
        <Suspense fallback={<LoadingState />}>
          <Dashboard communeCode={t.commune.code} deptCode={t.departementCode} cp={cp} />
        </Suspense>
      );
    }

    // Multiple communes — disambiguation picker
    return (
      <>
        <PageShell />
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
          <Suspense>
            <SearchInput placeholder="Code postal (ex : 75011, 33000)..." paramName="cp" />
          </Suspense>
          <div className="fade-up">
            <p className="mb-4 text-xs text-bureau-500">
              {territories.length} communes correspondent au code postal {cp} — choisissez la vôtre :
            </p>
            <div className="space-y-2">
              {territories.map((t) => (
                <Link
                  key={t.commune.code}
                  href={`/mon-territoire?cp=${cp}&code=${t.commune.code}`}
                  className="group flex items-center gap-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-bureau-200 transition-colors group-hover:text-teal">
                      {t.commune.libelle}
                    </p>
                    <p className="text-xs text-bureau-500">
                      {t.departementLibelle} ({t.departementCode}) &middot; {t.regionLibelle}
                    </p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className="shrink-0 text-bureau-600 group-hover:text-teal transition-colors"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── State 1: empty prompt ──
  return (
    <>
      <PageShell />
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <Suspense>
          <SearchInput placeholder="Code postal (ex : 75011, 33000, 69001)..." paramName="cp" />
        </Suspense>

        <div className="py-8 text-center fade-up">
          <p className="text-sm text-bureau-400">
            Entrez votre code postal pour accéder à votre tableau de bord civique.
          </p>
          <p className="mt-1 text-xs text-bureau-600">
            Représentants, budget, économie, santé, votes — tout ce qui concerne votre territoire.
          </p>

          {/* Example codes */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { cp: "75011", label: "Paris 11e" },
              { cp: "69001", label: "Lyon 1er" },
              { cp: "13001", label: "Marseille 1er" },
              { cp: "33000", label: "Bordeaux" },
              { cp: "59000", label: "Lille" },
              { cp: "67000", label: "Strasbourg" },
            ].map(({ cp: exCp, label }) => (
              <Link
                key={exCp}
                href={`/mon-territoire?cp=${exCp}`}
                className="rounded-lg border border-bureau-700/40 bg-bureau-800/30 px-3 py-1.5 text-xs text-bureau-400 transition-colors hover:border-teal/30 hover:text-teal"
              >
                {label} ({exCp})
              </Link>
            ))}
          </div>
        </div>

        {/* Link to manual dept browsing */}
        <div className="border-t border-bureau-700/20 pt-6 text-center">
          <p className="text-xs text-bureau-600">
            Préférez parcourir par département ?{" "}
            <Link href="/territoire" className="text-teal/60 transition-colors hover:text-teal">
              Explorer la carte des territoires
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function PageShell() {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-bureau-500">
          <Link href="/" className="transition-colors hover:text-teal">Accueil</Link>
          <span className="text-bureau-700">/</span>
          <span className="text-bureau-300">Mon Territoire</span>
        </nav>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100">
          Mon Territoire
        </h1>
        <p className="mt-2 text-sm text-bureau-500">
          Votre tableau de bord civique personnalisé
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-bureau-600 border-t-teal" />
    </div>
  );
}

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
