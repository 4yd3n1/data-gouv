import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { Suspense } from "react";

const PER_PAGE = 40;

const MANDAT_LABELS: Record<string, string> = {
  maire: "Maires",
  conseiller_municipal: "Conseillers municipaux",
  conseiller_communautaire: "Conseillers communautaires",
  conseiller_departemental: "Conseillers départementaux",
  conseiller_regional: "Conseillers régionaux",
  conseiller_arrondissement: "Conseillers d'arrondissement",
  membre_assemblee: "Membres d'assemblée",
  depute_europeen: "Députés européens",
  conseiller_francais_etranger: "Conseillers des Français de l'étranger",
  assemblee_francais_etranger: "Assemblée des Français de l'étranger",
};

async function ElusList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const type = searchParams.type ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const where = {
    ...(q && {
      OR: [
        { nom: { contains: q, mode: "insensitive" as const } },
        { prenom: { contains: q, mode: "insensitive" as const } },
        { libelleCommune: { contains: q, mode: "insensitive" as const } },
        { libelleDepartement: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(type && { typeMandat: type }),
  };

  const [elus, total, mandatCounts, genderCounts] = await Promise.all([
    prisma.elu.findMany({
      where,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.elu.count({ where }),
    prisma.elu.groupBy({
      by: ["typeMandat"],
      _count: true,
      orderBy: { _count: { typeMandat: "desc" } },
    }),
    prisma.elu.groupBy({
      by: ["sexe"],
      where,
      _count: true,
    }),
  ]);

  const femmes = genderCounts.find((g) => g.sexe === "F")?._count ?? 0;
  const hommes = genderCounts.find((g) => g.sexe === "M")?._count ?? 0;
  const pctFemmes = total > 0 ? ((femmes / total) * 100).toFixed(1) : "0";

  return (
    <>
      {/* Gender balance indicator */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-bureau-800">
            <div className="bg-rose" style={{ width: `${pctFemmes}%` }} />
            <div className="bg-blue flex-1" />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-widest text-bureau-500">
            <span>{fmt(femmes)} femmes ({pctFemmes} %)</span>
            <span>{fmt(hommes)} hommes</span>
          </div>
        </div>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        <span className="text-xs text-bureau-500 mr-1">Mandat :</span>
        <Link
          href="/representants/elus"
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${!type ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"}`}
        >
          Tous
        </Link>
        {mandatCounts.map((m) => (
          <Link
            key={m.typeMandat}
            href={`/representants/elus?type=${m.typeMandat}${q ? `&q=${q}` : ""}`}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${type === m.typeMandat ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"}`}
          >
            {MANDAT_LABELS[m.typeMandat] ?? m.typeMandat} ({fmt(m._count)})
          </Link>
        ))}
      </div>

      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} résultats</p>

      <div className="grid gap-1.5">
        {elus.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-2.5"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${e.sexe === "F" ? "bg-rose/10 text-rose" : "bg-blue/10 text-blue"}`}>
              {e.prenom?.[0]}{e.nom?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bureau-100">
                {e.prenom} {e.nom}
              </p>
              <p className="truncate text-xs text-bureau-500">
                {MANDAT_LABELS[e.typeMandat] ? MANDAT_LABELS[e.typeMandat].replace(/s$/, "") : e.typeMandat}
                {e.libelleCommune && ` · ${e.libelleCommune}`}
                {e.libelleCanton && ` · ${e.libelleCanton}`}
                {e.libelleDepartement && ` (${e.libelleDepartement})`}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              {e.fonction && (
                <p className="text-xs text-teal">{e.fonction}</p>
              )}
              {e.libelleCSP && (
                <p className="text-[10px] text-bureau-600 max-w-48 truncate">{e.libelleCSP}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / PER_PAGE)}
        baseUrl="/representants/elus"
        searchParams={searchParams}
      />
    </>
  );
}

export default async function ElusPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const totalElus = await prisma.elu.count();

  return (
    <>
      <PageHeader
        title="Élus locaux"
        subtitle={`Répertoire national des élus — ${fmt(totalElus)} mandats`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Élus" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un élu, une commune, un département..." />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <ElusList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
