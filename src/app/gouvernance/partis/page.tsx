import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtCompact } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

const PER_PAGE = 40;

async function PartisList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const exercice = searchParams.exercice ?? "2024";
  const tri = searchParams.tri ?? "produits";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = {
    exercice: parseInt(exercice, 10),
    ...(q && {
      nom: { contains: q, mode: "insensitive" as const },
    }),
  };

  const orderBy =
    tri === "charges" ? { totalCharges: "desc" as const } :
    tri === "resultat" ? { resultat: "desc" as const } :
    tri === "aide" ? { aidePublique1: "desc" as const } :
    tri === "dons" ? { donsPersonnes: "desc" as const } :
    { totalProduits: "desc" as const };

  const [partis, total, exercices] = await Promise.all([
    prisma.partiPolitique.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.partiPolitique.count({ where }),
    prisma.partiPolitique.groupBy({
      by: ["exercice"],
      _count: true,
      orderBy: { exercice: "desc" },
    }),
  ]);

  // Aggregate totals for the selected year
  const agg = await prisma.partiPolitique.aggregate({
    where: { exercice: parseInt(exercice, 10) },
    _sum: {
      totalProduits: true,
      totalCharges: true,
      aidePublique1: true,
      donsPersonnes: true,
    },
  });

  const tris = [
    { key: "produits", label: "Recettes" },
    { key: "charges", label: "Dépenses" },
    { key: "resultat", label: "Résultat" },
    { key: "aide", label: "Aide publique" },
    { key: "dons", label: "Dons" },
  ];

  return (
    <>
      {/* Year-level stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-3">
          <p className="text-xs uppercase tracking-widest text-bureau-500">Recettes totales</p>
          <p className="mt-1 text-lg font-bold text-teal">{fmtEuro(agg._sum.totalProduits)}</p>
        </div>
        <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-3">
          <p className="text-xs uppercase tracking-widest text-bureau-500">Dépenses totales</p>
          <p className="mt-1 text-lg font-bold text-amber">{fmtEuro(agg._sum.totalCharges)}</p>
        </div>
        <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-3">
          <p className="text-xs uppercase tracking-widest text-bureau-500">Aide publique</p>
          <p className="mt-1 text-lg font-bold text-blue">{fmtEuro(agg._sum.aidePublique1)}</p>
        </div>
        <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-3">
          <p className="text-xs uppercase tracking-widest text-bureau-500">Dons personnes</p>
          <p className="mt-1 text-lg font-bold text-rose">{fmtEuro(agg._sum.donsPersonnes)}</p>
        </div>
      </div>

      {/* Exercice + sort filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-bureau-500">Exercice :</span>
          {exercices.map((e) => (
            <Link
              key={e.exercice}
              href={`/gouvernance/partis?exercice=${e.exercice}${q ? `&q=${q}` : ""}${tri !== "produits" ? `&tri=${tri}` : ""}`}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                parseInt(exercice, 10) === e.exercice
                  ? "bg-teal/10 text-teal"
                  : "text-bureau-400 hover:bg-bureau-800"
              }`}
            >
              {e.exercice}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-bureau-500">Trier par :</span>
          {tris.map((t) => (
            <Link
              key={t.key}
              href={`/gouvernance/partis?exercice=${exercice}${q ? `&q=${q}` : ""}${t.key !== "produits" ? `&tri=${t.key}` : ""}`}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                tri === t.key
                  ? "bg-teal/10 text-teal"
                  : "text-bureau-400 hover:bg-bureau-800"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} partis</p>

      <div className="grid gap-2">
        {partis.map((p) => {
          const isPositive = p.resultat >= 0;
          return (
            <Link
              key={p.id}
              href={`/gouvernance/partis/${p.id}`}
              className="group flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
                  {p.nom}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-bureau-500">
                  <span>Recettes {fmtCompact(p.totalProduits)}</span>
                  <span className="text-bureau-700">·</span>
                  <span>Dépenses {fmtCompact(p.totalCharges)}</span>
                  {p.aidePublique1 > 0 && (
                    <>
                      <span className="text-bureau-700">·</span>
                      <span className="text-blue">Aide {fmtCompact(p.aidePublique1)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isPositive ? "text-teal" : "text-rose"}`}>
                  {isPositive ? "+" : ""}{fmtEuro(p.resultat)}
                </p>
                <p className="text-[10px] text-bureau-600">résultat</p>
              </div>
            </Link>
          );
        })}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/gouvernance/partis"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function PartisPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const totalPartis = await prisma.partiPolitique.count({ where: { exercice: 2024 } });

  return (
    <>
      <PageHeader
        title="Partis politiques"
        subtitle={`Comptes financiers CNCCFP — ${fmt(totalPartis)} partis (2024)`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/gouvernance" },
          { label: "Partis politiques" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un parti politique..." />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <PartisList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
