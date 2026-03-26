import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

const PER_PAGE = 40;

async function MairesList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const dept = searchParams.dept ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = {
    typeMandat: "maire" as const,
    ...(q && {
      OR: [
        { nom: { contains: q, mode: "insensitive" as const } },
        { prenom: { contains: q, mode: "insensitive" as const } },
        { libelleCommune: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(dept && { codeDepartement: dept }),
  };

  const [maires, total, deptCounts, genderCounts] = await Promise.all([
    prisma.elu.findMany({
      where,
      orderBy: [{ libelleDepartement: "asc" }, { libelleCommune: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.elu.count({ where }),
    prisma.elu.groupBy({
      by: ["codeDepartement", "libelleDepartement"],
      where: { typeMandat: "maire" },
      _count: true,
      orderBy: { codeDepartement: "asc" },
    }),
    prisma.elu.groupBy({
      by: ["sexe"],
      where,
      _count: true,
    }),
  ]);

  const femmes = genderCounts.find((g) => g.sexe === "F")?._count ?? 0;
  const pctFemmes = total > 0 ? ((femmes / total) * 100).toFixed(1) : "0";

  return (
    <>
      {/* Gender balance strip */}
      <div className="mb-6 rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-widest text-bureau-500">Parité</span>
          <span className="text-xs text-bureau-400">{pctFemmes} % de femmes</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-bureau-800">
          <div className="bg-rose transition-all" style={{ width: `${pctFemmes}%` }} />
          <div className="bg-blue flex-1" />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-bureau-600">
          <span>{fmt(femmes)} femmes</span>
          <span>{fmt(total - femmes)} hommes</span>
        </div>
      </div>

      {/* Department filter */}
      {!q && (
        <div className="mb-6">
          <details className="group">
            <summary className="cursor-pointer text-xs text-bureau-400 hover:text-bureau-200 transition-colors">
              {dept
                ? `Département : ${deptCounts.find((d) => d.codeDepartement === dept)?.libelleDepartement ?? dept}`
                : "Filtrer par département"}
              <span className="ml-1 text-bureau-600 group-open:hidden">▸</span>
              <span className="ml-1 text-bureau-600 hidden group-open:inline">▾</span>
            </summary>
            <div className="mt-2 flex flex-wrap gap-1">
              <Link
                href="/representants/elus/maires"
                className={`rounded px-2 py-0.5 text-[11px] ${!dept ? "bg-teal/10 text-teal" : "text-bureau-500 hover:bg-bureau-800"}`}
              >
                Tous
              </Link>
              {deptCounts.map((d) => (
                <Link
                  key={d.codeDepartement}
                  href={`/representants/elus/maires?dept=${d.codeDepartement}`}
                  className={`rounded px-2 py-0.5 text-[11px] ${dept === d.codeDepartement ? "bg-teal/10 text-teal" : "text-bureau-500 hover:bg-bureau-800"}`}
                >
                  {d.codeDepartement}
                </Link>
              ))}
            </div>
          </details>
        </div>
      )}

      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} maires</p>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {maires.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-2.5"
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${m.sexe === "F" ? "bg-rose/10 text-rose" : "bg-blue/10 text-blue"}`}>
              {m.prenom?.[0]}{m.nom?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bureau-100">
                {m.prenom} {m.nom}
              </p>
              <p className="truncate text-xs text-bureau-500">
                {m.libelleCommune}
                {m.libelleDepartement && ` · ${m.libelleDepartement} (${m.codeDepartement})`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/representants/elus/maires"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function MairesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const totalMaires = await prisma.elu.count({ where: { typeMandat: "maire" } });

  return (
    <>
      <PageHeader
        title="Maires"
        subtitle={`${fmt(totalMaires)} maires de France`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Élus", href: "/representants/elus" },
          { label: "Maires" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un maire ou une commune..." />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <MairesList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
