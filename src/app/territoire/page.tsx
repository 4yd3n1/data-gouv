import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { FranceMap } from "@/components/france-map";
import { getFranceMapData } from "@/lib/france-map-data";

export const revalidate = 86400; // Territory data changes only on ingestion

export default async function TerritoirePage() {
  const [regions, mapData] = await Promise.all([
    prisma.region.findMany({
      orderBy: { libelle: "asc" },
      include: {
        departements: {
          orderBy: { code: "asc" },
          include: {
            _count: { select: { communes: true, deputes: true, senateurs: true, musees: true, monuments: true } },
          },
        },
      },
    }),
    getFranceMapData(),
  ]);

  return (
    <>
      <PageHeader
        title="Territoire"
        subtitle="Explorer la France par les données"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Territoire" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero — interactive choropleth map */}
        <section className="mb-14">
          <FranceMap
            data={mapData}
            linkBase="/territoire/"
            showDetail={false}
            size="lg"
          />
        </section>

        {/* Quick-access cards */}
        <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/territoire/economie"
            className="card-accent group rounded-xl border border-amber/20 bg-amber/5 px-5 py-4 transition-all hover:border-amber/40"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber/70">Economie nationale</p>
            <p className="mt-1 text-sm text-bureau-300 group-hover:text-bureau-100 transition-colors">PIB, emploi, entreprises — tendances macro INSEE</p>
          </Link>
          <Link
            href="/territoire/comparer"
            className="card-accent group rounded-xl border border-teal/20 bg-teal/5 px-5 py-4 transition-all hover:border-teal/40"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal/70">Comparer deux territoires</p>
            <p className="mt-1 text-sm text-bureau-300 group-hover:text-bureau-100 transition-colors">Economie, budget, sante, representants — cote a cote</p>
          </Link>
          <Link
            href="/mon-territoire"
            className="card-accent group rounded-xl border border-blue-400/20 bg-blue-400/5 px-5 py-4 transition-all hover:border-blue-400/40"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400/70">Mon territoire</p>
            <p className="mt-1 text-sm text-bureau-300 group-hover:text-bureau-100 transition-colors">Code postal → commune, departement, representants</p>
          </Link>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-bureau-800" />
          <p className="text-xs uppercase tracking-widest text-bureau-600">Regions &amp; departements</p>
          <div className="h-px flex-1 bg-bureau-800" />
        </div>

        <div className="space-y-8">
          {regions.map((r) => (
            <div key={r.code}>
              <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl text-bureau-100">{r.libelle}</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {r.departements.map((d) => (
                  <Link
                    key={d.code}
                    href={`/territoire/${d.code}`}
                    className="card-accent group rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
                          {d.libelle}
                        </p>
                        <p className="text-xs text-bureau-500">{d.code}</p>
                      </div>
                      <div className="flex gap-3 text-[10px] text-bureau-500">
                        <div className="text-center">
                          <p className="text-xs text-bureau-300">{d._count.deputes}</p>
                          <p>dép.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-bureau-300">{d._count.senateurs}</p>
                          <p>sén.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-bureau-300">{fmt(d._count.monuments)}</p>
                          <p>mon.</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
