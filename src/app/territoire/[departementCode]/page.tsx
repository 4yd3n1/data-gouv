import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export default async function DepartementPage({ params }: { params: Promise<{ departementCode: string }> }) {
  const { departementCode } = await params;
  const dept = await prisma.departement.findUnique({
    where: { code: departementCode },
    include: { region: true },
  });
  if (!dept) notFound();

  const [deputes, senateurs, musees, monuments, communeCount] = await Promise.all([
    prisma.depute.findMany({ where: { departementRefCode: departementCode }, orderBy: { nom: "asc" } }),
    prisma.senateur.findMany({ where: { departementCode }, orderBy: { nom: "asc" } }),
    prisma.musee.findMany({ where: { departementCode }, orderBy: { nom: "asc" }, take: 20 }),
    prisma.monument.findMany({ where: { departementCode }, orderBy: { denomination: "asc" }, take: 20 }),
    prisma.commune.count({ where: { departementCode, typecom: "COM" } }),
  ]);

  const totalMonuments = await prisma.monument.count({ where: { departementCode } });

  return (
    <>
      <PageHeader
        title={dept.libelle}
        subtitle={`Département ${dept.code} · Région ${dept.region.libelle}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Territoire", href: "/territoire" },
          { label: dept.libelle },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { v: communeCount, l: "Communes", c: "text-blue" },
            { v: deputes.length, l: "Députés", c: "text-teal" },
            { v: senateurs.length, l: "Sénateurs", c: "text-teal" },
            { v: musees.length, l: "Musées", c: "text-amber" },
            { v: totalMonuments, l: "Monuments", c: "text-rose" },
          ].map((s) => (
            <div key={s.l} className={`rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4 ${s.c}`}>
              <p className="text-2xl font-bold">{fmt(s.v)}</p>
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Deputies */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Députés ({deputes.length})</h3>
            {deputes.length === 0 ? <p className="text-sm text-bureau-500">Aucun député rattaché.</p> : (
              <div className="space-y-2">
                {deputes.map((d) => (
                  <Link key={d.id} href={`/gouvernance/deputes/${d.id}`} className="group flex items-center gap-3 rounded-lg bg-bureau-700/20 px-3 py-2 hover:bg-bureau-700/30 transition-colors">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bureau-700/40 text-[10px] font-medium text-bureau-300">{d.prenom[0]}{d.nom[0]}</div>
                    <div>
                      <p className="text-sm text-bureau-200 group-hover:text-teal transition-colors">{d.prenom} {d.nom}</p>
                      <p className="text-xs text-bureau-500">{d.groupeAbrev}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Senators */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Sénateurs ({senateurs.length})</h3>
            {senateurs.length === 0 ? <p className="text-sm text-bureau-500">Aucun sénateur rattaché.</p> : (
              <div className="space-y-2">
                {senateurs.map((s) => (
                  <Link key={s.id} href={`/gouvernance/senateurs/${s.id}`} className="group flex items-center gap-3 rounded-lg bg-bureau-700/20 px-3 py-2 hover:bg-bureau-700/30 transition-colors">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bureau-700/40 text-[10px] font-medium text-bureau-300">{s.prenom[0]}{s.nom[0]}</div>
                    <div>
                      <p className="text-sm text-bureau-200 group-hover:text-teal transition-colors">{s.prenom} {s.nom}</p>
                      <p className="text-xs text-bureau-500">{s.groupe ?? "—"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Museums */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Musées ({musees.length})</h3>
            {musees.length === 0 ? <p className="text-sm text-bureau-500">Aucun musée enregistré.</p> : (
              <div className="space-y-2">
                {musees.map((m) => (
                  <Link key={m.id} href={`/patrimoine/musees/${m.id}`} className="group block rounded-lg bg-bureau-700/20 px-3 py-2 hover:bg-bureau-700/30 transition-colors">
                    <p className="text-sm text-bureau-200 group-hover:text-amber transition-colors">{m.nom}</p>
                    <p className="text-xs text-bureau-500">{m.ville ?? "—"}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Monuments */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium uppercase tracking-wider text-bureau-400">Monuments ({fmt(totalMonuments)})</h3>
              {totalMonuments > 20 && (
                <Link href={`/patrimoine/monuments?dept=${departementCode}`} className="text-xs text-teal hover:underline">Voir tous</Link>
              )}
            </div>
            {monuments.length === 0 ? <p className="text-sm text-bureau-500">Aucun monument enregistré.</p> : (
              <div className="space-y-2">
                {monuments.map((m) => (
                  <Link key={m.id} href={`/patrimoine/monuments/${m.id}`} className="group block rounded-lg bg-bureau-700/20 px-3 py-2 hover:bg-bureau-700/30 transition-colors">
                    <p className="text-sm text-bureau-200 group-hover:text-rose transition-colors">{m.denomination || "Monument"}</p>
                    <p className="text-xs text-bureau-500">{[m.communeNom, m.sieclePrincipal].filter(Boolean).join(" · ")}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
