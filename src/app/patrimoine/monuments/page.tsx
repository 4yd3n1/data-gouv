import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

const PER_PAGE = 30;

async function MonumentsList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const type = searchParams.type ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { denomination: { contains: q, mode: "insensitive" as const } },
      { communeNom: { contains: q, mode: "insensitive" as const } },
      { region: { contains: q, mode: "insensitive" as const } },
    ];
  }
  if (type) {
    where.protectionType = { contains: type, mode: "insensitive" as const };
  }

  const [monuments, total, types] = await Promise.all([
    prisma.monument.findMany({
      where,
      orderBy: { denomination: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.monument.count({ where }),
    prisma.monument.groupBy({
      by: ["protectionType"],
      _count: true,
      where: { protectionType: { not: null } },
      orderBy: { _count: { protectionType: "desc" } },
      take: 6,
    }),
  ]);

  return (
    <>
      {/* Protection type filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/patrimoine/monuments"
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${!type ? "border-rose/40 bg-rose/10 text-rose" : "border-bureau-700/30 text-bureau-400 hover:border-bureau-600/40"}`}
        >
          Tous
        </Link>
        {types.map((t) => {
          const active = type === t.protectionType;
          return (
            <Link
              key={t.protectionType}
              href={`/patrimoine/monuments?type=${encodeURIComponent(t.protectionType ?? "")}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${active ? "border-rose/40 bg-rose/10 text-rose" : "border-bureau-700/30 text-bureau-400 hover:border-bureau-600/40"}`}
            >
              {t.protectionType} ({fmt(t._count)})
            </Link>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} résultats</p>

      <div className="grid gap-2">
        {monuments.map((m) => (
          <Link
            key={m.id}
            href={`/patrimoine/monuments/${m.id}`}
            className="card-accent group flex items-center justify-between rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bureau-100 group-hover:text-rose transition-colors">
                {m.denomination || m.id}
              </p>
              <p className="truncate text-xs text-bureau-500">
                {m.communeNom ?? "—"} {m.departementNom ? `· ${m.departementNom}` : ""} {m.region ? `· ${m.region}` : ""}
              </p>
            </div>
            <div className="shrink-0 ml-4 text-right">
              {m.protectionType && (
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  m.protectionType.includes("classé")
                    ? "bg-rose/10 text-rose"
                    : "bg-amber/10 text-amber"
                }`}>
                  {m.protectionType}
                </span>
              )}
              {m.sieclePrincipal && (
                <p className="mt-0.5 text-xs text-bureau-500">{m.sieclePrincipal}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/patrimoine/monuments"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function MonumentsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Monuments historiques"
        subtitle="Édifices classés et inscrits au titre des monuments historiques"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Patrimoine", href: "/patrimoine" }, { label: "Monuments" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense><SearchInput placeholder="Rechercher un monument, commune, région..." /></Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <MonumentsList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
