import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = await prisma.senateur.findUnique({
    where: { id },
    select: { prenom: true, nom: true, groupe: true, departement: true, civilite: true },
  });
  if (!s) return { title: "Sénateur introuvable — L'Observatoire Citoyen" };
  const name = `${s.prenom} ${s.nom}`;
  return {
    title: `${name} — Sénateur · L'Observatoire Citoyen`,
    description: `Mandats, commissions et déclarations d'intérêts de ${s.civilite ?? ""} ${name}, sénateur ${s.groupe ?? ""} de ${s.departement ?? ""}.`.trim(),
  };
}
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { DeclarationSection } from "@/components/declaration-section";

export default async function SenateurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab = "mandats" } = await searchParams;

  const s = await prisma.senateur.findUnique({
    where: { id },
    include: {
      mandats: { orderBy: { dateDebut: "desc" } },
      commissions: { orderBy: { dateDebut: "desc" } },
    },
  });
  if (!s) notFound();

  const declarations = await prisma.declarationInteret.findMany({
    where: { nom: s.nom, prenom: s.prenom, typeMandat: "S\u00e9nateur" },
    include: { participations: true, revenus: true },
    orderBy: { dateDepot: "desc" },
  });

  return (
    <>
      <ProfileHero
        avatar={{
          src: s.photoUrl,
          initials: `${s.prenom[0]}${s.nom[0]}`,
        }}
        name={`${s.civilite ?? ""} ${s.prenom} ${s.nom}`.trim()}
        subtitle={`${s.groupe ?? "\u2014"} \u00b7 ${s.departement ?? "\u2014"}`}
        status={{
          active: s.actif,
          label: s.actif ? "En mandat" : "Ancien s\u00e9nateur",
        }}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/representants" },
          { label: "S\u00e9nateurs", href: "/representants/senateurs" },
          { label: `${s.prenom} ${s.nom}` },
        ]}
      >
        <Suspense>
          <ProfileTabs
            tabs={[
              {
                key: "mandats",
                label: "Mandats & Commissions",
                count: s.mandats.length + s.commissions.length,
              },
              {
                key: "declarations",
                label: "D\u00e9clarations",
                count: declarations.length,
              },
              { key: "infos", label: "Informations" },
            ]}
            defaultTab="mandats"
          />
        </Suspense>
      </ProfileHero>

      {/* Tab content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ── Mandats & Commissions ── */}
        {tab === "mandats" && (
          <div className="space-y-8 fade-up">
            {/* Mandats */}
            {s.mandats.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Mandats ({s.mandats.length})
                </h2>
                <div className="space-y-2">
                  {s.mandats.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm leading-relaxed text-bureau-200">
                            {m.libelle}
                          </p>
                          <p className="mt-1 text-xs text-bureau-500">
                            {m.type}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-bureau-400">
                            {fmtDate(m.dateDebut)}
                          </p>
                          <p className="text-xs text-bureau-500">
                            &rarr;{" "}
                            {m.dateFin ? (
                              fmtDate(m.dateFin)
                            ) : (
                              <span className="font-medium text-teal">
                                en cours
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Commissions */}
            {s.commissions.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Commissions ({s.commissions.length})
                </h2>
                <div className="space-y-2">
                  {s.commissions.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm leading-relaxed text-bureau-200">
                            {c.nom}
                          </p>
                          <p className="mt-1 text-xs text-bureau-500">
                            {c.fonction ?? "Membre"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-bureau-400">
                            {fmtDate(c.dateDebut)}
                          </p>
                          <p className="text-xs text-bureau-500">
                            &rarr;{" "}
                            {c.dateFin ? (
                              fmtDate(c.dateFin)
                            ) : (
                              <span className="font-medium text-teal">
                                en cours
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {s.mandats.length === 0 && s.commissions.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucun mandat ou commission enregistr&eacute;.
              </p>
            )}
          </div>
        )}

        {/* ── Déclarations ── */}
        {tab === "declarations" && (
          <div className="fade-up">
            {declarations.length > 0 ? (
              <DeclarationSection declarations={declarations} />
            ) : (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucune d&eacute;claration d&apos;int&eacute;r&ecirc;ts.
              </p>
            )}
          </div>
        )}

        {/* ── Informations ── */}
        {tab === "infos" && (
          <div className="fade-up">
            <section className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-6">
              <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Informations personnelles
              </h2>
              <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {(
                  [
                    ["Groupe", s.groupe],
                    ["D\u00e9partement", s.departement],
                    ["Profession", s.profession],
                    ["Naissance", fmtDate(s.dateNaissance)],
                    ["Prise de fonction", fmtDate(s.datePriseFonction)],
                  ] as [string, string | null][]
                )
                  .filter(([, v]) => v && v !== "\u2014")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-wider text-bureau-500">
                        {k}
                      </dt>
                      <dd className="mt-0.5 text-sm text-bureau-200">{v}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
