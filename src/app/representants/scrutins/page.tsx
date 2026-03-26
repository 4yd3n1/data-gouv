import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";
import { Suspense } from "react";

const PER_PAGE = 30;

async function ScrutinsList({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams.q ?? "";
  const sort = searchParams.sort ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));

  const type = searchParams.type ?? "";

  const where = {
    ...(q && {
      titre: { contains: q, mode: "insensitive" as const },
    }),
    ...(sort === "adopte" && { sortCode: { contains: "adopt", mode: "insensitive" as const } }),
    ...(sort === "rejete" && { sortCode: { contains: "rejet", mode: "insensitive" as const } }),
    ...(type === "sps" && { codeTypeVote: "SPS" }),
    ...(type === "moc" && { codeTypeVote: "MOC" }),
  };

  const [scrutins, total] = await Promise.all([
    prisma.scrutin.findMany({
      where,
      orderBy: { dateScrutin: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.scrutin.count({ where }),
  ]);

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-bureau-500">Résultat :</span>
          {[
            { label: "Tous", value: "" },
            { label: "Adoptés", value: "adopte" },
            { label: "Rejetés", value: "rejete" },
          ].map((f) => {
            const params = new URLSearchParams();
            if (f.value) params.set("sort", f.value);
            if (q) params.set("q", q);
            if (type) params.set("type", type);
            const qs = params.toString();
            return (
              <Link
                key={f.value}
                href={`/gouvernance/scrutins${qs ? `?${qs}` : ""}`}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${sort === f.value ? "bg-teal/10 text-teal" : "text-bureau-400 hover:bg-bureau-800"}`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-bureau-500">Type :</span>
          {[
            { label: "Tous types", value: "" },
            { label: "Votes solennels", value: "sps" },
            { label: "Motions de censure", value: "moc" },
          ].map((f) => {
            const params = new URLSearchParams();
            if (sort) params.set("sort", sort);
            if (q) params.set("q", q);
            if (f.value) params.set("type", f.value);
            const qs = params.toString();
            return (
              <Link
                key={f.value}
                href={`/gouvernance/scrutins${qs ? `?${qs}` : ""}`}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${type === f.value ? "bg-bureau-700 text-bureau-100" : "text-bureau-400 hover:bg-bureau-800"}`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mb-4 text-xs text-bureau-500">{fmt(total)} résultats</p>

      <div className="grid gap-2">
        {scrutins.map((s) => (
          <Link
            key={s.id}
            href={`/gouvernance/scrutins/${s.id}`}
            className="card-accent group rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-bureau-400">n°{s.numero}</span>
                  <span className="text-xs text-bureau-500">{fmtDate(s.dateScrutin)}</span>
                  <ScrutinResultBadge sortCode={s.sortCode} />
                  {s.codeTypeVote === "SPS" && (
                    <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[10px] text-teal">Vote solennel</span>
                  )}
                  {s.codeTypeVote === "MOC" && (
                    <span className="rounded bg-amber/10 px-1.5 py-0.5 text-[10px] text-amber">Motion de censure</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-bureau-200 line-clamp-2 group-hover:text-bureau-100 transition-colors">
                  {s.titre}
                </p>
              </div>
              <div className="hidden shrink-0 sm:flex items-center gap-3 text-xs">
                <div className="text-right">
                  <p className="font-medium text-teal">{s.pour}</p>
                  <p className="text-[10px] text-bureau-500">Pour</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-rose">{s.contre}</p>
                  <p className="text-[10px] text-bureau-500">Contre</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-amber">{s.abstentions}</p>
                  <p className="text-[10px] text-bureau-500">Abst.</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination currentPage={page} totalPages={Math.ceil(total / PER_PAGE)} baseUrl="/gouvernance/scrutins" searchParams={searchParams} />
    </>
  );
}

export default async function ScrutinsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  return (
    <>
      <PageHeader
        title="Scrutins"
        subtitle="Votes parlementaires — Assemblée nationale"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Scrutins" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Suspense>
          <SearchInput placeholder="Rechercher un scrutin..." />
        </Suspense>
        <div className="mt-6">
          <Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
            <ScrutinsList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
