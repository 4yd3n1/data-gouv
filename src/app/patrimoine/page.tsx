import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export default async function PatrimoinePage() {
  const [museeCount, monumentCount, topMusees] = await Promise.all([
    prisma.musee.count(),
    prisma.monument.count(),
    prisma.frequentationMusee.groupBy({
      by: ["museeId"],
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
  ]);

  const topMuseeIds = topMusees.map((t) => t.museeId);
  const musees = await prisma.musee.findMany({ where: { id: { in: topMuseeIds } } });
  const museeMap = Object.fromEntries(musees.map((m) => [m.id, m]));

  const domaines = await prisma.monument.groupBy({
    by: ["domaine"],
    _count: true,
    where: { domaine: { not: null } },
    orderBy: { _count: { domaine: "desc" } },
    take: 8,
  });

  return (
    <>
      <PageHeader
        title="Patrimoine"
        subtitle={`${fmt(museeCount)} musées · ${fmt(monumentCount)} monuments historiques`}
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Patrimoine" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          <Link href="/patrimoine/musees" className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50">
            <p className="text-3xl font-bold text-amber">{fmt(museeCount)}</p>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 group-hover:text-amber transition-colors">Musées de France</h3>
            <p className="mt-1 text-sm text-bureau-500">Fréquentation, appellation, données Patrimostat</p>
          </Link>
          <Link href="/patrimoine/monuments" className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50">
            <p className="text-3xl font-bold text-rose">{fmt(monumentCount)}</p>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 group-hover:text-rose transition-colors">Monuments historiques</h3>
            <p className="mt-1 text-sm text-bureau-500">Classés et inscrits, coordonnées GPS, historique</p>
          </Link>
        </div>

        {/* Top museums by attendance */}
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-bureau-100">Musées les plus fréquentés</h2>
        <div className="space-y-2 mb-10">
          {topMusees.map((t, i) => {
            const m = museeMap[t.museeId];
            if (!m) return null;
            const total = t._sum.total ?? 0;
            const maxTotal = topMusees[0]._sum.total ?? 1;
            return (
              <Link key={t.museeId} href={`/patrimoine/musees/${t.museeId}`} className="group flex items-center gap-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 hover:bg-bureau-800/40 transition-all">
                <span className="w-6 text-right text-sm font-bold text-bureau-600">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-bureau-100 group-hover:text-amber transition-colors">{m.nom}</p>
                  <p className="text-xs text-bureau-500">{m.ville ?? "—"}</p>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-bureau-700/30">
                    <div className="bar-fill h-full rounded-full bg-amber/50" style={{ width: `${(total / maxTotal) * 100}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-amber">{fmt(total)}</span>
              </Link>
            );
          })}
        </div>

        {/* Monument domains */}
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-bureau-100">Monuments par domaine</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {domaines.map((d) => (
            <div key={d.domaine} className="flex items-center justify-between rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
              <span className="text-sm text-bureau-200">{d.domaine}</span>
              <span className="text-sm font-medium text-rose">{fmt(d._count)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
