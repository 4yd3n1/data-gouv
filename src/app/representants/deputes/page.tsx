import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Avatar } from "@/components/avatar";
import { Suspense } from "react";

const PER_PAGE = 30;

async function DeputesList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const groupe = searchParams.groupe ?? "";
  const dept = searchParams.dept ?? "";
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

  const [deputes, total, groupes] = await Promise.all([
    prisma.depute.findMany({
      where,
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.depute.count({ where }),
    prisma.depute.groupBy({ by: ["groupeAbrev"], _count: true, orderBy: { _count: { groupeAbrev: "desc" } } }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-bureau-500 mr-2">Groupe :</span>
        <Link
          href="/representants/deputes"
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${!groupe ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"}`}
        >
          Tous
        </Link>
        {groupes.map((g) => (
          <Link
            key={g.groupeAbrev}
            href={`/representants/deputes?groupe=${g.groupeAbrev}${q ? `&q=${q}` : ""}`}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${groupe === g.groupeAbrev ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"}`}
          >
            {g.groupeAbrev} ({g._count})
          </Link>
        ))}
      </div>

      <p className="mb-4 text-xs text-bureau-500">{total} résultats</p>

      <div className="grid gap-2">
        {deputes.map((d) => (
          <Link
            key={d.id}
            href={`/representants/deputes/${d.id}`}
            className="card-accent group flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
          >
            <Avatar src={d.photoUrl} initials={`${d.prenom[0]}${d.nom[0]}`} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
                  {d.civilite} {d.prenom} {d.nom}
                </p>
                {!d.actif && <span className="rounded bg-bureau-700/50 px-1.5 py-0.5 text-[10px] text-bureau-500">ancien</span>}
              </div>
              <p className="truncate text-xs text-bureau-500">
                {d.groupeAbrev} · {d.departementNom} ({d.departementCode})
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-bureau-500">
              {d.scoreParticipation != null && (
                <div className="text-right">
                  <p className="text-bureau-300">{d.scoreParticipation.toFixed(1)}</p>
                  <p className="text-[10px]">Participation</p>
                </div>
              )}
              {d.scoreLoyaute != null && (
                <div className="text-right">
                  <p className="text-bureau-300">{d.scoreLoyaute.toFixed(1)}</p>
                  <p className="text-[10px]">Loyauté</p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/representants/deputes"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function DeputesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Députés"
        subtitle="Assemblée nationale — données Datan"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Députés" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un député, département..." />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <DeputesList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
