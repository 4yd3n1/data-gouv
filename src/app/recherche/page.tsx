import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  globalSearch,
  enrichSearchResults,
  VALID_ENTITY_TYPES,
  ENTITY_LABELS,
  type EntityType,
} from "@/lib/search";
import { SIGNAL_TYPE_LABELS, type SignalType } from "@/lib/signals";
import { SearchBox } from "@/components/search-box";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}): Promise<Metadata> {
  const { q = "" } = await searchParams;
  return {
    title: q
      ? `Recherche "${q}" · L'Observatoire Citoyen`
      : `Recherche · L'Observatoire Citoyen`,
  };
}

const ENTITY_ICONS: Record<string, string> = {
  depute: "D",
  senateur: "S",
  lobbyiste: "L",
  scrutin: "V",
  commune: "C",
  parti: "P",
  president: "PR",
};

const ENTITY_COLORS: Record<string, string> = {
  depute: "bg-teal/10 text-teal",
  senateur: "bg-blue-500/10 text-blue-400",
  lobbyiste: "bg-amber-500/10 text-amber-400",
  scrutin: "bg-rose-500/10 text-rose-400",
  commune: "bg-emerald-500/10 text-emerald-400",
  president: "bg-amber-500/10 text-amber-400",
  parti: "bg-purple-500/10 text-purple-400",
};

async function SearchResults({
  q,
  type,
}: {
  q: string;
  type: string | undefined;
}) {
  if (!q || q.trim().length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bureau-800">
          <svg
            className="h-6 w-6 text-bureau-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </div>
        <p className="text-bureau-300">Entrez au moins 2 caractères pour rechercher</p>
        <p className="mt-1 text-sm text-bureau-500">
          Députés, sénateurs, lobbyistes, votes, communes, partis
        </p>
      </div>
    );
  }

  const rawResults = await globalSearch(q.trim(), 30, type);
  const results = await enrichSearchResults(rawResults, 5);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bureau-800">
          <svg
            className="h-6 w-6 text-bureau-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
            />
          </svg>
        </div>
        <p className="text-bureau-300">
          Aucun résultat pour &ldquo;<span className="text-bureau-100">{q}</span>&rdquo;
        </p>
        <p className="mt-1 text-sm text-bureau-500">
          Essayez un nom, une ville, un sujet de vote
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="mb-4 text-sm text-bureau-500">
        {results.length} résultat{results.length > 1 ? "s" : ""} pour{" "}
        <span className="text-bureau-300">&ldquo;{q}&rdquo;</span>
      </p>
      {results.map((result, i) => {
        const entityType = result.entityType as EntityType;
        const iconColor = ENTITY_COLORS[entityType] ?? "bg-bureau-700 text-bureau-400";
        const signalEntries = Object.entries(result.signalsByType) as [
          SignalType,
          number,
        ][];
        const severityClass =
          result.topSeverity === "CRITIQUE"
            ? "severity-critique"
            : result.topSeverity === "NOTABLE"
              ? "severity-notable"
              : "severity-informatif";
        return (
          <Link
            key={`${result.entityType}-${result.entityId}-${i}`}
            href={result.url}
            className="group flex flex-col gap-3 rounded-xl border border-bureau-700/40 bg-bureau-900/40 p-4 transition-colors hover:border-teal/30 hover:bg-bureau-800/60"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${iconColor}`}
              >
                {ENTITY_ICONS[entityType] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bureau-100">
                  {result.title}
                </p>
                <p className="truncate text-xs text-bureau-500">{result.subtitle}</p>
              </div>
              <span className="shrink-0 text-xs uppercase tracking-[0.08em] text-bureau-500 transition-colors group-hover:text-teal">
                Investiguer →
              </span>
            </div>

            {signalEntries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-bureau-800/40 pt-3">
                {result.topSeverity ? (
                  <span
                    className={`rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${severityClass}`}
                  >
                    {result.topSeverity}
                  </span>
                ) : null}
                {signalEntries.map(([type, n]) => (
                  <span
                    key={type}
                    className="rounded-sm border border-bureau-700/40 bg-bureau-800/40 px-2 py-0.5 text-[10px] text-bureau-300"
                  >
                    {SIGNAL_TYPE_LABELS[type]}
                    {n > 1 ? <span className="ml-1 text-bureau-500">{n}</span> : null}
                  </span>
                ))}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { q = "", type } = await searchParams;
  const validType = VALID_ENTITY_TYPES.includes(type as EntityType) ? type : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl text-bureau-100">
        Recherche
      </h1>

      {/* Search input */}
      <SearchBox key={q} defaultValue={q} />

      {/* Entity type filter pills */}
      {q.trim().length >= 2 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/recherche?q=${encodeURIComponent(q)}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !validType
                ? "bg-teal text-bureau-950"
                : "bg-bureau-800 text-bureau-400 hover:bg-bureau-700 hover:text-bureau-200"
            }`}
          >
            Tous
          </Link>
          {VALID_ENTITY_TYPES.map((t) => (
            <Link
              key={t}
              href={`/recherche?q=${encodeURIComponent(q)}&type=${t}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                validType === t
                  ? "bg-teal text-bureau-950"
                  : "bg-bureau-800 text-bureau-400 hover:bg-bureau-700 hover:text-bureau-200"
              }`}
            >
              {ENTITY_LABELS[t]}
            </Link>
          ))}
        </div>
      )}

      {/* Results */}
      <Suspense
        fallback={
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-bureau-800/40"
              />
            ))}
          </div>
        }
      >
        <SearchResults q={q} type={validType} />
      </Suspense>
    </div>
  );
}
