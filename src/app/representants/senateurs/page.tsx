import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Avatar } from "@/components/avatar";
import { Suspense } from "react";

const PER_PAGE = 30;

async function SenateursList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = q ? {
    OR: [
      { nom: { contains: q, mode: "insensitive" as const } },
      { prenom: { contains: q, mode: "insensitive" as const } },
      { departement: { contains: q, mode: "insensitive" as const } },
    ],
  } : {};

  const [senateurs, total] = await Promise.all([
    prisma.senateur.findMany({
      where,
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.senateur.count({ where }),
  ]);

  return (
    <>
      <p className="mb-4 text-xs text-bureau-500">{total} résultats</p>
      <div className="grid gap-2">
        {senateurs.map((s) => (
          <Link
            key={s.id}
            href={`/representants/senateurs/${s.id}`}
            className="card-accent group flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
          >
            <Avatar src={s.photoUrl} initials={`${s.prenom[0]}${s.nom[0]}`} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
                  {s.civilite} {s.prenom} {s.nom}
                </p>
                {!s.actif && <span className="rounded bg-bureau-700/50 px-1.5 py-0.5 text-[10px] text-bureau-500">ancien</span>}
              </div>
              <p className="truncate text-xs text-bureau-500">
                {s.groupe ?? "—"} · {s.departement ?? "—"}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(total / PER_PAGE)} baseUrl="/representants/senateurs" searchParams={searchParams} />
    </>
  );
}

export default async function SenateursPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Sénateurs"
        subtitle="Sénat — mandats et commissions"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Représentants", href: "/representants" }, { label: "Sénateurs" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense><SearchInput placeholder="Rechercher un sénateur, département..." /></Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <SenateursList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
