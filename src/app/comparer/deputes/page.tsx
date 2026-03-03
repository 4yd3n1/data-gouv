import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtDate } from "@/lib/format";
import { VoteBadge } from "@/components/vote-badge";
import { DeltaBadge } from "@/components/delta-badge";

export const metadata: Metadata = {
  title: "Comparer deux députés — L'Observatoire Citoyen",
  description: "Comparez côte à côte la participation, les votes par thème et les déclarations de deux députés.",
};

const TAG_LABELS: Record<string, string> = {
  budget: "Budget",
  fiscalite: "Fiscalité",
  sante: "Santé",
  logement: "Logement",
  retraites: "Retraites",
  education: "Éducation",
  securite: "Sécurité",
  immigration: "Immigration",
  ecologie: "Écologie",
  travail: "Emploi",
  defense: "Défense",
  agriculture: "Agriculture",
  culture: "Culture",
};

// ── Data ─────────────────────────────────────────────────────────────────────

async function getDeputeData(id: string) {
  const [depute, scrutinTagCounts, declarationCount, conflictCount, deportCount, voteCount] =
    await Promise.all([
      prisma.depute.findUnique({
        where: { id },
        include: { departement: true },
      }),
      prisma.scrutinTag.groupBy({
        by: ["tag"],
        where: { scrutin: { votes: { some: { deputeId: id } } } },
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
        take: 13,
      }),
      prisma.declarationInteret.count({
        where: { nom: { mode: "insensitive", equals: "" }, typeMandat: "Député" },
      }),
      prisma.conflictSignal.count({ where: { deputeId: id } }),
      prisma.deport.count({ where: { deputeId: id } }),
      prisma.voteRecord.count({ where: { deputeId: id } }),
    ]);

  // Re-fetch declarations by name (need depute first)
  const declCount = depute
    ? await prisma.declarationInteret.count({
        where: { nom: depute.nom, prenom: depute.prenom, typeMandat: "Député" },
      })
    : 0;

  return { depute, scrutinTagCounts, declarationCount: declCount, conflictCount, deportCount, voteCount };
}

type DeputeData = Awaited<ReturnType<typeof getDeputeData>>;

async function getSharedVotes(idA: string, idB: string) {
  return prisma.scrutin.findMany({
    where: {
      AND: [
        { votes: { some: { deputeId: idA } } },
        { votes: { some: { deputeId: idB } } },
      ],
    },
    orderBy: { dateScrutin: "desc" },
    take: 10,
    select: {
      id: true,
      titre: true,
      dateScrutin: true,
      sortCode: true,
      votes: {
        where: { deputeId: { in: [idA, idB] } },
        select: { deputeId: true, position: true },
      },
    },
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparerDeputesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { a, b, qa, qb } = await searchParams;

  // State: full comparison
  if (a && b) {
    const [dataA, dataB, sharedVotes] = await Promise.all([
      getDeputeData(a),
      getDeputeData(b),
      getSharedVotes(a, b),
    ]);
    if (!dataA.depute || !dataB.depute) {
      return (
        <ErrorState
          message={!dataA.depute ? `Député ID « ${a} » introuvable.` : `Député ID « ${b} » introuvable.`}
        />
      );
    }
    return (
      <FullComparison idA={a} dataA={dataA} idB={b} dataB={dataB} sharedVotes={sharedVotes} />
    );
  }

  // State: A selected + searching for B
  if (a && qb) {
    const [dataA, resultsB] = await Promise.all([
      getDeputeData(a),
      prisma.depute.findMany({
        where: {
          OR: [
            { nom: { contains: qb, mode: "insensitive" } },
            { prenom: { contains: qb, mode: "insensitive" } },
          ],
        },
        orderBy: [{ actif: "desc" }, { nom: "asc" }],
        take: 8,
        select: { id: true, prenom: true, nom: true, groupe: true, departementNom: true, groupeAbrev: true, actif: true },
      }),
    ]);
    if (!dataA.depute) return <ErrorState message={`Député ID « ${a} » introuvable.`} />;
    return <SearchResultsB idA={a} dataA={dataA} qb={qb} resultsB={resultsB} />;
  }

  // State: A selected, no B search yet
  if (a) {
    const dataA = await getDeputeData(a);
    if (!dataA.depute) return <ErrorState message={`Député ID « ${a} » introuvable.`} />;
    return <PickB idA={a} dataA={dataA} />;
  }

  // State: searching for A
  if (qa) {
    const results = await prisma.depute.findMany({
      where: {
        OR: [
          { nom: { contains: qa, mode: "insensitive" } },
          { prenom: { contains: qa, mode: "insensitive" } },
        ],
      },
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
      take: 10,
      select: { id: true, prenom: true, nom: true, groupe: true, departementNom: true, groupeAbrev: true, actif: true },
    });
    return <SearchResultsA qa={qa} results={results} />;
  }

  // State 1: empty
  return <EmptyPicker />;
}

// ── State 1 ───────────────────────────────────────────────────────────────────

function EmptyPicker() {
  return (
    <>
      <PageShell step={1} />
      <div className="mx-auto max-w-xl px-6 py-12 space-y-8 fade-up">
        <form method="GET" className="space-y-3">
          <input
            name="qa"
            placeholder="Rechercher un député par nom (ex : Dupont, Lebrun...)"
            autoFocus
            className="w-full rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-600 focus:border-teal/50 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-teal/10 border border-teal/30 px-6 py-3 text-sm font-semibold text-teal transition-colors hover:bg-teal/20"
          >
            Rechercher
          </button>
        </form>
        <p className="text-center text-xs text-bureau-600">
          Vous pouvez aussi démarrer depuis la{" "}
          <Link href="/representants/deputes" className="text-teal/70 hover:text-teal transition-colors">
            liste des députés
          </Link>{" "}
          et cliquer &laquo;&nbsp;Comparer&nbsp;&raquo; sur un profil.
        </p>
      </div>
    </>
  );
}

// ── Search results A ──────────────────────────────────────────────────────────

function SearchResultsA({
  qa,
  results,
}: {
  qa: string;
  results: { id: string; prenom: string; nom: string; groupe: string | null; departementNom: string | null; groupeAbrev: string | null; actif: boolean }[];
}) {
  return (
    <>
      <PageShell step={1} />
      <div className="mx-auto max-w-xl px-6 py-10 space-y-6 fade-up">
        <form method="GET" className="flex gap-2">
          <input
            name="qa"
            defaultValue={qa}
            className="flex-1 rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 focus:border-teal/50 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-xl border border-bureau-700/30 bg-bureau-800/40 px-4 py-3 text-sm text-bureau-300 hover:text-teal transition-colors"
          >
            &larr; Recher.
          </button>
        </form>
        {results.length === 0 ? (
          <p className="text-sm text-bureau-500 italic text-center py-8">Aucun député trouvé pour &laquo;&nbsp;{qa}&nbsp;&raquo;.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-bureau-500">{results.length} résultat{results.length > 1 ? "s" : ""} — choisissez le député A :</p>
            {results.map((d) => (
              <Link
                key={d.id}
                href={`/comparer/deputes?a=${d.id}`}
                className="group flex items-center gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-3.5 transition-all hover:border-teal/30 hover:bg-bureau-800/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal/20 bg-teal/10 text-[10px] font-semibold text-teal">
                  {d.prenom[0]}{d.nom[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-bureau-200 group-hover:text-teal transition-colors">
                    {d.prenom} {d.nom}
                  </p>
                  <p className="text-xs text-bureau-500">
                    {d.groupeAbrev ?? "—"} &middot; {d.departementNom ?? "—"}
                  </p>
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
    </>
  );
}

// ── State 2: A selected, pick B ───────────────────────────────────────────────

function PickB({ idA, dataA }: { idA: string; dataA: DeputeData }) {
  const { depute: dA } = dataA;
  return (
    <>
      <PageShell step={2} nameA={`${dA!.prenom} ${dA!.nom}`} />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: deputy A card */}
          <div className="card-accent rounded-xl border border-teal/20 bg-teal/5 p-6">
            <p className="text-[10px] uppercase tracking-widest text-teal/60 mb-2">Député A</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-sm font-semibold text-teal">
                {dA!.prenom[0]}{dA!.nom[0]}
              </div>
              <div>
                <p className="font-medium text-bureau-100">{dA!.prenom} {dA!.nom}</p>
                <p className="text-xs text-bureau-500">{dA!.groupe ?? "—"} &middot; {dA!.departementNom ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dA!.scoreParticipation != null && (
                <MiniStat label="Participation" value={`${dA!.scoreParticipation} %`} />
              )}
              <MiniStat label="Votes enregistrés" value={fmt(dataA.voteCount)} />
              <MiniStat label="Conflits signalés" value={fmt(dataA.conflictCount)} />
              <MiniStat label="Déports" value={fmt(dataA.deportCount)} />
            </div>
          </div>

          {/* Right: search for B */}
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-3">
              Député B — à comparer
            </p>
            <form method="GET" className="space-y-3">
              <input type="hidden" name="a" value={idA} />
              <input
                name="qb"
                placeholder="Nom du député B (ex : Martin, Dupont...)"
                autoFocus
                className="w-full rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 placeholder-bureau-600 focus:border-teal/50 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-teal/10 border border-teal/30 px-6 py-3 text-sm font-semibold text-teal transition-colors hover:bg-teal/20"
              >
                Comparer avec {dA!.prenom} {dA!.nom}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Search results B ──────────────────────────────────────────────────────────

function SearchResultsB({
  idA,
  dataA,
  qb,
  resultsB,
}: {
  idA: string;
  dataA: DeputeData;
  qb: string;
  resultsB: { id: string; prenom: string; nom: string; groupe: string | null; departementNom: string | null; groupeAbrev: string | null; actif: boolean }[];
}) {
  const { depute: dA } = dataA;
  return (
    <>
      <PageShell step={2} nameA={`${dA!.prenom} ${dA!.nom}`} />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: deputy A summary */}
          <div className="card-accent rounded-xl border border-teal/20 bg-teal/5 p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-sm font-semibold text-teal">
              {dA!.prenom[0]}{dA!.nom[0]}
            </div>
            <div>
              <p className="font-medium text-bureau-100">{dA!.prenom} {dA!.nom}</p>
              <p className="text-xs text-bureau-500">{dA!.groupe ?? "—"} &middot; {dA!.departementNom ?? "—"}</p>
            </div>
          </div>

          {/* Right: search results for B */}
          <div className="space-y-3">
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="a" value={idA} />
              <input
                name="qb"
                defaultValue={qb}
                className="flex-1 rounded-xl border border-bureau-600/40 bg-bureau-800/60 px-4 py-3 text-sm text-bureau-100 focus:border-teal/50 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="rounded-xl border border-bureau-700/30 bg-bureau-800/40 px-4 py-3 text-sm text-bureau-300 hover:text-teal transition-colors"
              >
                &larr;
              </button>
            </form>
            {resultsB.length === 0 ? (
              <p className="text-sm text-bureau-500 italic py-4">Aucun député trouvé pour &laquo;&nbsp;{qb}&nbsp;&raquo;.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-bureau-500">
                  {resultsB.length} résultat{resultsB.length > 1 ? "s" : ""} — choisissez le député B :
                </p>
                {resultsB.filter((d) => d.id !== idA).map((d) => (
                  <Link
                    key={d.id}
                    href={`/comparer/deputes?a=${idA}&b=${d.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-teal/30 hover:bg-bureau-800/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber/20 bg-amber/10 text-[10px] font-semibold text-amber">
                      {d.prenom[0]}{d.nom[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-bureau-200 group-hover:text-teal transition-colors">
                        {d.prenom} {d.nom}
                      </p>
                      <p className="text-xs text-bureau-500">
                        {d.groupeAbrev ?? "—"} &middot; {d.departementNom ?? "—"}
                      </p>
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
        </div>
      </div>
    </>
  );
}

// ── State 3: Full comparison ──────────────────────────────────────────────────

function FullComparison({
  idA,
  dataA,
  idB,
  dataB,
  sharedVotes,
}: {
  idA: string;
  dataA: DeputeData;
  idB: string;
  dataB: DeputeData;
  sharedVotes: Awaited<ReturnType<typeof getSharedVotes>>;
}) {
  const { depute: dA, scrutinTagCounts: tagsA } = dataA;
  const { depute: dB, scrutinTagCounts: tagsB } = dataB;

  // Build a unified tag list from both deputies
  const allTags = Array.from(
    new Set([...tagsA.map((t) => t.tag), ...tagsB.map((t) => t.tag)])
  );
  const tagMapA = Object.fromEntries(tagsA.map((t) => [t.tag, t._count.tag]));
  const tagMapB = Object.fromEntries(tagsB.map((t) => [t.tag, t._count.tag]));
  const maxTagCount = Math.max(...allTags.map((t) => Math.max(tagMapA[t] ?? 0, tagMapB[t] ?? 0)), 1);

  return (
    <>
      {/* ── Comparison header ── */}
      <div className="border-b border-bureau-700/30 bg-bureau-900/70 grid-bg">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-bureau-500">
            <Link href="/" className="hover:text-teal transition-colors">Accueil</Link>
            <span className="text-bureau-700">/</span>
            <Link href="/representants/deputes" className="hover:text-teal transition-colors">Députés</Link>
            <span className="text-bureau-700">/</span>
            <span className="text-bureau-300">Comparaison</span>
          </nav>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <Link href={`/representants/deputes/${idA}`} className="group">
              <p className="text-[10px] uppercase tracking-widest text-teal/60 mb-1">Député A</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10 text-sm font-semibold text-teal">
                  {dA!.prenom[0]}{dA!.nom[0]}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-bureau-100 group-hover:text-teal transition-colors leading-tight">
                    {dA!.prenom} {dA!.nom}
                  </p>
                  <p className="text-xs text-bureau-500">{dA!.groupe ?? "—"} &middot; {dA!.departementNom ?? "—"}</p>
                </div>
              </div>
            </Link>
            <div className="text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-bureau-600">vs</p>
              <Link
                href="/comparer/deputes"
                className="mt-2 block text-[10px] text-bureau-600 hover:text-teal transition-colors"
              >
                Nouvelle comparaison
              </Link>
            </div>
            <Link href={`/representants/deputes/${idB}`} className="group text-right">
              <p className="text-[10px] uppercase tracking-widest text-amber/60 mb-1">Député B</p>
              <div className="flex items-center justify-end gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-medium text-bureau-100 group-hover:text-amber transition-colors leading-tight">
                    {dB!.prenom} {dB!.nom}
                  </p>
                  <p className="text-xs text-bureau-500">{dB!.groupe ?? "—"} &middot; {dB!.departementNom ?? "—"}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-amber/10 text-sm font-semibold text-amber">
                  {dB!.prenom[0]}{dB!.nom[0]}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Comparison body ── */}
      <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">

        {/* ── Scores ── */}
        <CompareSection label="Scores parlementaires">
          {dA!.scoreParticipation != null || dB!.scoreParticipation != null ? (
            <MetricRow
              label="Participation"
              valA={dA!.scoreParticipation != null ? `${dA!.scoreParticipation} %` : "—"}
              valB={dB!.scoreParticipation != null ? `${dB!.scoreParticipation} %` : "—"}
              rawA={dA!.scoreParticipation ?? undefined}
              rawB={dB!.scoreParticipation ?? undefined}
              higherIsBetter
            />
          ) : null}
          <MetricRow
            label="Votes enregistrés"
            valA={fmt(dataA.voteCount)}
            valB={fmt(dataB.voteCount)}
            rawA={dataA.voteCount}
            rawB={dataB.voteCount}
            higherIsBetter
          />
          {(dA!.scoreSpecialite != null || dB!.scoreSpecialite != null) && (
            <MetricRow
              label="Score spécialité"
              valA={dA!.scoreSpecialite != null ? `${dA!.scoreSpecialite}` : "—"}
              valB={dB!.scoreSpecialite != null ? `${dB!.scoreSpecialite}` : "—"}
              rawA={dA!.scoreSpecialite ?? undefined}
              rawB={dB!.scoreSpecialite ?? undefined}
              higherIsBetter
            />
          )}
        </CompareSection>

        {/* ── Votes par thème ── */}
        {allTags.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-4">
              <div className="h-5 w-0.5 shrink-0 rounded-full bg-teal/50" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-bureau-300">
                Votes par thème législatif
              </h2>
            </div>
            <div className="overflow-hidden rounded-xl border border-bureau-700/30">
              {allTags.slice(0, 10).map((tag, i) => {
                const countA = tagMapA[tag] ?? 0;
                const countB = tagMapB[tag] ?? 0;
                const aMore = countA > countB;
                const bMore = countB > countA;
                return (
                  <div
                    key={tag}
                    className={`flex items-center gap-0 border-t border-bureau-700/20 ${i === 0 ? "border-t-0" : ""}`}
                  >
                    {/* Bar A (right-aligned) */}
                    <div className="flex-1 flex items-center justify-end gap-3 px-4 py-3">
                      <span className={`text-sm font-semibold tabular-nums ${aMore ? "text-teal" : "text-bureau-400"}`}>
                        {fmt(countA)}
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-bureau-700/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${aMore ? "bg-teal/70" : "bg-bureau-600/50"}`}
                          style={{ width: `${Math.min(100, (countA / maxTagCount) * 100)}%`, float: "right" }}
                        />
                      </div>
                    </div>
                    {/* Label */}
                    <div className="w-28 shrink-0 flex items-center justify-center bg-bureau-800/20 border-x border-bureau-700/20 px-2 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-bureau-500 text-center leading-snug">
                        {TAG_LABELS[tag] ?? tag}
                      </p>
                    </div>
                    {/* Bar B */}
                    <div className="flex-1 flex items-center gap-3 px-4 py-3">
                      <div className="w-24 h-1.5 rounded-full bg-bureau-700/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bMore ? "bg-amber/70" : "bg-bureau-600/50"}`}
                          style={{ width: `${Math.min(100, (countB / maxTagCount) * 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold tabular-nums ${bMore ? "text-amber" : "text-bureau-400"}`}>
                        {fmt(countB)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Transparence ── */}
        <CompareSection label="Transparence & Intégrité">
          <MetricRow
            label="Déclarations d'intérêts"
            valA={fmt(dataA.declarationCount)}
            valB={fmt(dataB.declarationCount)}
          />
          <MetricRow
            label="Signaux de conflit détectés"
            valA={fmt(dataA.conflictCount)}
            valB={fmt(dataB.conflictCount)}
            rawA={dataA.conflictCount}
            rawB={dataB.conflictCount}
            higherIsBetter={false}
          />
          <MetricRow
            label="Déports (récusations)"
            valA={fmt(dataA.deportCount)}
            valB={fmt(dataB.deportCount)}
          />
        </CompareSection>

        {/* ── Votes communs ── */}
        {sharedVotes.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-4">
              <div className="h-5 w-0.5 shrink-0 rounded-full bg-teal/50" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-bureau-300">
                Derniers votes en commun
              </h2>
              <p className="ml-auto text-[10px] text-bureau-600">
                Scrutins auxquels les deux ont participé
              </p>
            </div>
            <div className="space-y-2">
              {sharedVotes.map((scrutin) => {
                const vA = scrutin.votes.find((v) => v.deputeId === idA);
                const vB = scrutin.votes.find((v) => v.deputeId === idB);
                const agree = vA && vB && vA.position === vB.position;
                return (
                  <Link
                    key={scrutin.id}
                    href={`/gouvernance/scrutins/${scrutin.id}`}
                    className="group flex items-start gap-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                  >
                    <div className="shrink-0 mt-0.5">
                      <span
                        className={`rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                          scrutin.sortCode === "adopté"
                            ? "border-teal/30 bg-teal/10 text-teal"
                            : "border-rose/30 bg-rose/10 text-rose"
                        }`}
                      >
                        {scrutin.sortCode}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug text-bureau-200 group-hover:text-bureau-100">
                        {scrutin.titre}
                      </p>
                      <p className="mt-1.5 text-xs text-bureau-500">{fmtDate(scrutin.dateScrutin)}</p>
                    </div>
                    <div className="shrink-0 flex gap-2 items-center mt-0.5">
                      {vA && <VoteBadge position={vA.position} />}
                      <span className={`text-[10px] font-semibold ${agree ? "text-teal" : "text-rose"}`}>
                        {agree ? "accord" : "désaccord"}
                      </span>
                      {vB && <VoteBadge position={vB.position} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Explorer ── */}
        <div className="border-t border-bureau-700/20 pt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ExploreLink
            href={`/representants/deputes/${idA}`}
            label={`Profil ${dA!.prenom} ${dA!.nom}`}
            sub="Déclarations, votes, transparence"
          />
          <ExploreLink
            href={`/representants/deputes/${idB}`}
            label={`Profil ${dB!.prenom} ${dB!.nom}`}
            sub="Déclarations, votes, transparence"
          />
          <ExploreLink href="/comparer/deputes" label="Nouvelle comparaison" sub="Choisir deux autres députés" />
          <ExploreLink href="/representants/deputes" label="Tous les députés" sub="Parcourir la liste" />
        </div>

      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PageShell({ step, nameA }: { step: 1 | 2; nameA?: string }) {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-bureau-500">
          <Link href="/" className="hover:text-teal transition-colors">Accueil</Link>
          <span className="text-bureau-700">/</span>
          <Link href="/representants/deputes" className="hover:text-teal transition-colors">Députés</Link>
          <span className="text-bureau-700">/</span>
          <span className="text-bureau-300">Comparer deux députés</span>
        </nav>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-medium text-bureau-100">
          Comparer deux députés
        </h1>
        <p className="mt-2 text-sm text-bureau-500">
          {step === 1
            ? "Étape 1 — Choisir le député A"
            : `Étape 2 — Choisir qui comparer à ${nameA}`}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <p className="text-sm text-bureau-400 italic">{message}</p>
      <Link href="/comparer/deputes" className="mt-4 inline-block text-xs text-teal hover:underline">
        Nouvelle comparaison
      </Link>
    </div>
  );
}

function CompareSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-4">
        <div className="h-5 w-0.5 shrink-0 rounded-full bg-teal/50" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-bureau-300">{label}</h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-bureau-700/30">{children}</div>
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
        <p className={`text-xl font-bold tabular-nums ${aBetter ? "text-teal" : "text-bureau-200"}`}>{valA}</p>
        {aBetter && rawA != null && rawB != null && <DeltaBadge value={rawA} reference={rawB} />}
      </div>
      <div className="w-28 shrink-0 flex items-center justify-center bg-bureau-800/20 border-x border-bureau-700/20 px-2 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-bureau-500 text-center leading-snug">
          {label}
        </p>
      </div>
      <div className={`flex-1 px-5 py-4 text-right ${bBetter ? "bg-amber/5" : "bg-bureau-800/10"}`}>
        <p className={`text-xl font-bold tabular-nums ${bBetter ? "text-amber" : "text-bureau-200"}`}>{valB}</p>
        {bBetter && rawB != null && rawA != null && <DeltaBadge value={rawB} reference={rawA} />}
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
