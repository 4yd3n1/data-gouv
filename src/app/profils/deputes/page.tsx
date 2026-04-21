import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Avatar } from "@/components/avatar";
import { Suspense } from "react";
import {
  getSignals,
  SIGNAL_TYPE_LABELS,
  type SignalType,
  type UnifiedSignal,
} from "@/lib/signals";
import type { SignalSeverity } from "@/lib/signal-types";

const PER_PAGE = 30;

const TYPE_CHIP_STYLE: Record<SignalType, string> = {
  conflit: "border-rose/30 text-rose bg-rose/5",
  porte: "border-amber/30 text-amber bg-amber/5",
  lobby: "border-amber/30 text-amber bg-amber/5",
  media: "border-rose/30 text-rose bg-rose/5",
  ecart: "border-amber/30 text-amber bg-amber/5",
  dissidence: "border-teal/30 text-teal bg-teal/5",
};

const SEVERITY_DOT: Record<SignalSeverity, string> = {
  CRITIQUE: "bg-rose",
  NOTABLE: "bg-amber",
  INFORMATIF: "bg-teal",
};

const SEVERITY_WEIGHT: Record<SignalSeverity, number> = {
  CRITIQUE: 3,
  NOTABLE: 2,
  INFORMATIF: 1,
};

async function DeputesList({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const q = searchParams.q ?? "";
  const groupe = searchParams.groupe ?? "";
  const dept = searchParams.dept ?? "";
  const sort = searchParams.sort === "alpha" ? "alpha" : "flagged";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = {
    ...(q && {
      OR: [
        { nom: { contains: q, mode: "insensitive" as const } },
        { prenom: { contains: q, mode: "insensitive" as const } },
        { departementNom: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(groupe && { groupeAbrev: groupe }),
    ...(dept && { departementCode: dept }),
  };

  // For "flagged" sort we need ALL matching deputies to sort by signal rank.
  // This is still bounded (~2,100 deputies) and cheap.
  const fetchAll = sort === "flagged";
  const [deputes, total, groupes, allSignals] = await Promise.all([
    prisma.depute.findMany({
      where,
      orderBy: fetchAll
        ? [{ nom: "asc" }]
        : [{ actif: "desc" }, { nom: "asc" }],
      ...(fetchAll ? {} : { skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    }),
    prisma.depute.count({ where }),
    prisma.depute.groupBy({
      by: ["groupeAbrev"],
      _count: true,
      orderBy: { _count: { groupeAbrev: "desc" } },
    }),
    getSignals(),
  ]);

  // Build deputy-signal map
  const signalByDepute = new Map<string, UnifiedSignal>();
  for (const s of allSignals) {
    if (s.personKey.startsWith("depute:")) {
      signalByDepute.set(s.personKey.slice("depute:".length), s);
    }
  }

  // Sort by flagged severity then alphabetical
  let sorted = deputes;
  if (fetchAll) {
    sorted = [...deputes].sort((a, b) => {
      const sa = signalByDepute.get(a.id);
      const sb = signalByDepute.get(b.id);
      const wa = sa ? SEVERITY_WEIGHT[sa.severity] : 0;
      const wb = sb ? SEVERITY_WEIGHT[sb.severity] : 0;
      if (wa !== wb) return wb - wa;
      if (a.actif !== b.actif) return a.actif ? -1 : 1;
      return a.nom.localeCompare(b.nom);
    });
    // Paginate client-side
    sorted = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  }

  const flaggedCount = allSignals.filter((s) =>
    s.personKey.startsWith("depute:"),
  ).length;

  return (
    <>
      {/* Sort toggle */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.15em] text-bureau-600">
          Tri
        </span>
        <Link
          href={{
            pathname: "/profils/deputes",
            query: { ...searchParams, sort: "flagged", page: "1" },
          }}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            sort === "flagged"
              ? "border-rose/40 bg-rose/10 text-rose"
              : "border-bureau-700/40 text-bureau-400 hover:text-bureau-200"
          }`}
        >
          Signalés ({flaggedCount})
        </Link>
        <Link
          href={{
            pathname: "/profils/deputes",
            query: { ...searchParams, sort: "alpha", page: "1" },
          }}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            sort === "alpha"
              ? "border-teal/40 bg-teal/10 text-teal"
              : "border-bureau-700/40 text-bureau-400 hover:text-bureau-200"
          }`}
        >
          Alphabétique
        </Link>
      </div>

      {/* Group filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-[10px] uppercase tracking-[0.15em] text-bureau-600">
          Groupe
        </span>
        <Link
          href="/profils/deputes"
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            !groupe
              ? "bg-teal/10 text-teal"
              : "text-bureau-400 hover:bg-bureau-800"
          }`}
        >
          Tous
        </Link>
        {groupes.map((g) => (
          <Link
            key={g.groupeAbrev}
            href={`/profils/deputes?groupe=${g.groupeAbrev}${q ? `&q=${q}` : ""}`}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              groupe === g.groupeAbrev
                ? "bg-teal/10 text-teal"
                : "text-bureau-400 hover:bg-bureau-800"
            }`}
          >
            {g.groupeAbrev} ({g._count})
          </Link>
        ))}
      </div>

      <p className="mb-4 text-xs text-bureau-500">
        {total} résultats
        {sort === "flagged" &&
          flaggedCount > 0 &&
          " · les députés signalés apparaissent en tête"}
      </p>

      <div className="grid gap-2">
        {sorted.map((d) => {
          const sig = signalByDepute.get(d.id);
          return (
            <Link
              key={d.id}
              href={`/profils/deputes/${d.id}`}
              className="card-accent group flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <Avatar
                src={d.photoUrl}
                initials={`${d.prenom[0]}${d.nom[0]}`}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {sig && (
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[sig.severity]} shadow-[0_0_4px_currentColor]`}
                      aria-label={sig.severity}
                    />
                  )}
                  <p className="truncate text-sm font-medium text-bureau-100 transition-colors group-hover:text-teal">
                    {d.civilite} {d.prenom} {d.nom}
                  </p>
                  {!d.actif && (
                    <span className="rounded bg-bureau-700/50 px-1.5 py-0.5 text-[10px] text-bureau-500">
                      ancien
                    </span>
                  )}
                  {sig &&
                    sig.types.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className={`rounded-full border px-1.5 py-px text-[9px] uppercase tracking-wider ${TYPE_CHIP_STYLE[t]}`}
                      >
                        {SIGNAL_TYPE_LABELS[t]}
                      </span>
                    ))}
                </div>
                <p className="truncate text-xs text-bureau-500">
                  {d.groupeAbrev} · {d.departementNom} ({d.departementCode})
                  {sig?.narratives[0]?.headline && (
                    <span className="text-bureau-400">
                      {" — "}
                      {sig.narratives[0].headline}
                    </span>
                  )}
                </p>
              </div>
              <div className="hidden items-center gap-3 text-xs text-bureau-500 sm:flex">
                {d.scoreParticipation != null && (
                  <div className="text-right">
                    <p className="tabular-nums text-bureau-300">
                      {d.scoreParticipation.toFixed(1)}
                    </p>
                    <p className="text-[10px]">Particip.</p>
                  </div>
                )}
                {d.scoreLoyaute != null && (
                  <div className="text-right">
                    <p className="tabular-nums text-bureau-300">
                      {d.scoreLoyaute.toFixed(1)}
                    </p>
                    <p className="text-[10px]">Loyauté</p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/profils/deputes"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function DeputesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Députés"
        subtitle="Assemblée nationale — données Datan"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Profils", href: "/profils" },
          { label: "Députés" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un député, département..." />
        </Suspense>
        <div className="mt-6">
          <Suspense
            fallback={
              <div className="animate-pulse text-bureau-600">
                Chargement...
              </div>
            }
          >
            <DeputesList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
