import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ communeCode: string }>;
}): Promise<Metadata> {
  const { communeCode } = await params;
  const commune = await prisma.commune.findUnique({
    where: { code: communeCode },
    select: { libelle: true, departementCode: true },
  });
  if (!commune) return { title: "Commune introuvable — L'Observatoire Citoyen" };
  return {
    title: `${commune.libelle} — Fiche commune · L'Observatoire Citoyen`,
    description: `Élus, budget, musées et monuments de ${commune.libelle} (${commune.departementCode}). Données publiques françaises.`,
  };
}

export default async function CommunePage({
  params,
}: {
  params: Promise<{ communeCode: string }>;
}) {
  const { communeCode } = await params;

  const commune = await prisma.commune.findUnique({
    where: { code: communeCode },
    include: { departement: { include: { region: true } } },
  });
  if (!commune) notFound();

  const [elus, budget, musees, monumentCount] = await Promise.all([
    prisma.elu.findMany({
      where: {
        codeCommune: communeCode,
        typeMandat: { in: ["maire", "conseiller_municipal", "conseiller_arrondissement"] },
      },
      orderBy: [{ typeMandat: "asc" }, { nom: "asc" }],
      take: 50,
    }),
    prisma.budgetLocal.findFirst({
      where: { geoType: "COM", geoCode: communeCode },
      orderBy: { annee: "desc" },
    }),
    prisma.musee.findMany({
      where: { communeCode },
      orderBy: { nom: "asc" },
      take: 10,
    }),
    prisma.monument.count({ where: { communeCode } }),
  ]);

  const typecomLabel: Record<string, string> = {
    COM: "Commune",
    ARM: "Arrondissement municipal",
    COMD: "Commune déléguée",
    COMA: "Commune associée",
  };

  const maires = elus.filter((e) => e.typeMandat === "maire");
  const conseillers = elus.filter((e) => e.typeMandat !== "maire");

  return (
    <>
      <PageHeader
        title={commune.libelle}
        subtitle={`${typecomLabel[commune.typecom] ?? commune.typecom} · Département ${commune.departementCode} · ${commune.departement.region.libelle}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Territoire", href: "/territoire" },
          {
            label: commune.departement.libelle,
            href: `/territoire/${commune.departementCode}`,
          },
          { label: commune.libelle },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: fmt(elus.length), l: "Élus municipaux", c: "text-teal" },
            {
              v: budget?.population ? fmt(budget.population) : "—",
              l: "Population",
              c: "text-blue",
            },
            { v: fmt(musees.length), l: "Musées", c: "text-amber" },
            { v: fmt(monumentCount), l: "Monuments", c: "text-rose" },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-4 ${s.c}`}
            >
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Élus */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Équipe municipale
            </h2>

            {maires.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[10px] uppercase tracking-widest text-teal">
                  Maire{maires.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1.5">
                  {maires.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-lg bg-bureau-700/20 px-3 py-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal/10 text-[10px] font-medium text-teal">
                        {e.prenom[0]}
                        {e.nom[0]}
                      </div>
                      <div>
                        <p className="text-sm text-bureau-200">
                          {e.prenom} {e.nom}
                        </p>
                        {e.fonction && (
                          <p className="text-xs text-bureau-500">{e.fonction}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {conseillers.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-bureau-500">
                  Conseillers municipaux ({conseillers.length})
                </p>
                <div className="space-y-1">
                  {conseillers.slice(0, 15).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-lg bg-bureau-700/10 px-3 py-1.5"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bureau-700/40 text-[10px] text-bureau-400">
                        {e.prenom[0]}
                        {e.nom[0]}
                      </div>
                      <p className="text-sm text-bureau-300">
                        {e.prenom} {e.nom}
                      </p>
                      {e.fonction && (
                        <p className="ml-auto text-xs text-bureau-500 shrink-0">
                          {e.fonction}
                        </p>
                      )}
                    </div>
                  ))}
                  {conseillers.length > 15 && (
                    <p className="pt-1 text-xs text-bureau-500 italic">
                      +{conseillers.length - 15} autres conseillers
                    </p>
                  )}
                </div>
              </div>
            )}

            {elus.length === 0 && (
              <p className="text-sm text-bureau-500 italic">
                Aucun élu municipal enregistré.
              </p>
            )}
          </div>

          {/* Budget local */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Budget communal
            </h2>
            {budget ? (
              <>
                <p className="mb-4 text-[10px] text-bureau-600">
                  Exercice {budget.annee} · Source : DGFIP finances locales
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      l: "Dépenses / habitant",
                      v: fmtEuro(budget.depenseParHab),
                      c: "text-bureau-100",
                    },
                    {
                      l: "Dette / habitant",
                      v: fmtEuro(budget.detteParHab),
                      c: "text-rose",
                    },
                    {
                      l: "Total recettes",
                      v: fmtEuro(budget.totalRecettes),
                      c: "text-teal",
                    },
                    {
                      l: "Total dépenses",
                      v: fmtEuro(budget.totalDepenses),
                      c: "text-bureau-100",
                    },
                    {
                      l: "Charges personnel",
                      v: fmtEuro(budget.chargesPersonnel),
                      c: "text-amber",
                    },
                    {
                      l: "Encours de dette",
                      v: fmtEuro(budget.encoursDette),
                      c: "text-rose",
                    },
                  ]
                    .filter(({ v }) => v !== "—")
                    .map(({ l, v, c }) => (
                      <div
                        key={l}
                        className="rounded-lg bg-bureau-800/40 px-3 py-2.5"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                          {l}
                        </p>
                        <p className={`mt-0.5 text-base font-semibold ${c}`}>
                          {v}
                        </p>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-bureau-500 italic">
                Données budgétaires non disponibles — ingestion DGFIP requise.
              </p>
            )}
          </div>
        </div>

        {/* Patrimoine */}
        {(musees.length > 0 || monumentCount > 0) && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Patrimoine
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {musees.length > 0 && (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="mb-3 text-xs uppercase tracking-widest text-amber">
                    Musées ({musees.length})
                  </p>
                  <div className="space-y-1.5">
                    {musees.map((m) => (
                      <Link
                        key={m.id}
                        href={`/patrimoine/musees/${m.id}`}
                        className="group block rounded-lg bg-bureau-700/20 px-3 py-2 transition-colors hover:bg-bureau-700/30"
                      >
                        <p className="text-sm text-bureau-200 transition-colors group-hover:text-amber">
                          {m.nom}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {monumentCount > 0 && (
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="mb-3 text-xs uppercase tracking-widest text-rose">
                    Monuments historiques ({fmt(monumentCount)})
                  </p>
                  <Link
                    href={`/patrimoine/monuments?dept=${commune.departementCode}`}
                    className="inline-flex items-center gap-1 text-xs text-rose/70 transition-colors hover:text-rose"
                  >
                    Voir les monuments →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Navigation contextuelle */}
        <div className="flex flex-wrap gap-3 border-t border-bureau-700/30 pt-6">
          <Link
            href={`/territoire/${commune.departementCode}`}
            className="rounded-lg border border-bureau-700/30 bg-bureau-800/20 px-4 py-2 text-xs text-bureau-400 transition-colors hover:border-bureau-600/40 hover:text-bureau-200"
          >
            ← Département {commune.departementCode}
          </Link>
          <Link
            href="/territoire"
            className="rounded-lg border border-bureau-700/30 bg-bureau-800/20 px-4 py-2 text-xs text-bureau-400 transition-colors hover:border-bureau-600/40 hover:text-bureau-200"
          >
            Toutes les régions
          </Link>
        </div>
      </div>
    </>
  );
}
