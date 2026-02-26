import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

const PER_PAGE = 30;

async function MuseesList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = q ? {
    OR: [
      { nom: { contains: q, mode: "insensitive" as const } },
      { ville: { contains: q, mode: "insensitive" as const } },
    ],
  } : {};

  const [musees, total] = await Promise.all([
    prisma.musee.findMany({
      where,
      orderBy: { nom: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { frequentations: { orderBy: { annee: "desc" }, take: 1 } },
    }),
    prisma.musee.count({ where }),
  ]);

  return (
    <>
      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} résultats</p>
      <div className="grid gap-2">
        {musees.map((m) => {
          const last = m.frequentations[0];
          return (
            <Link
              key={m.id}
              href={`/patrimoine/musees/${m.id}`}
              className="card-accent group flex items-center justify-between rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-bureau-100 group-hover:text-amber transition-colors">{m.nom}</p>
                <p className="truncate text-xs text-bureau-500">{m.ville ?? "—"} {m.region ? `· ${m.region}` : ""}</p>
              </div>
              {last?.total != null && (
                <div className="shrink-0 text-right text-xs">
                  <p className="font-medium text-amber">{fmt(last.total)}</p>
                  <p className="text-bureau-500">{last.annee}</p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(total / PER_PAGE)} baseUrl="/patrimoine/musees" searchParams={searchParams} />
    </>
  );
}

export default async function MuseesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Musées de France"
        subtitle="Fréquentation et données Patrimostat"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Patrimoine", href: "/patrimoine" }, { label: "Musées" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense><SearchInput placeholder="Rechercher un musée, ville..." /></Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <MuseesList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
