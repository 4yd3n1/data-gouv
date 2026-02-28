import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { VoteBadge } from "@/components/vote-badge";
import { DeclarationSection } from "@/components/declaration-section";

export default async function DeputeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab = "activite" } = await searchParams;

  const d = await prisma.depute.findUnique({
    where: { id },
    include: { departement: true },
  });
  if (!d) notFound();

  const [votes, deports, declarations] = await Promise.all([
    prisma.voteRecord.findMany({
      where: { deputeId: id },
      include: { scrutin: true },
      orderBy: { scrutin: { dateScrutin: "desc" } },
      take: 10,
    }),
    prisma.deport.findMany({
      where: { deputeId: id },
      orderBy: { dateCreation: "desc" },
    }),
    prisma.declarationInteret.findMany({
      where: { nom: d.nom, prenom: d.prenom, typeMandat: "Député" },
      include: { participations: true, revenus: true },
      orderBy: { dateDepot: "desc" },
    }),
  ]);

  return (
    <>
      <ProfileHero
        avatar={{
          src: d.photoUrl,
          initials: `${d.prenom[0]}${d.nom[0]}`,
        }}
        name={`${d.civilite} ${d.prenom} ${d.nom}`}
        subtitle={`${d.groupe} \u00b7 ${d.departementNom} (${d.departementCode})`}
        status={{
          active: d.actif,
          label: d.actif ? "En mandat" : "Ancien d\u00e9put\u00e9",
        }}
        badge={d.groupeAbrev}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/gouvernance" },
          { label: "D\u00e9put\u00e9s", href: "/gouvernance/deputes" },
          { label: `${d.prenom} ${d.nom}` },
        ]}
        scores={[
          { value: d.scoreParticipation, label: "Participation", color: "teal" },
          { value: d.scoreSpecialite, label: "Sp\u00e9cialit\u00e9", color: "blue" },
          { value: d.scoreLoyaute, label: "Loyaut\u00e9", color: "amber" },
          { value: d.scoreMajorite, label: "Majorit\u00e9", color: "rose" },
        ]}
        contact={{
          email: d.email,
          twitter: d.twitter,
          website: d.website,
        }}
      >
        <Suspense>
          <ProfileTabs
            tabs={[
              { key: "activite", label: "Activit\u00e9", count: votes.length + deports.length },
              { key: "declarations", label: "D\u00e9clarations", count: declarations.length },
              { key: "infos", label: "Informations" },
            ]}
            defaultTab="activite"
          />
        </Suspense>
      </ProfileHero>

      {/* Tab content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* ── Activité ── */}
        {tab === "activite" && (
          <div className="space-y-8 fade-up">
            {/* Recent votes */}
            {votes.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                    Votes r&eacute;cents
                  </h2>
                  <Link
                    href="/gouvernance/scrutins"
                    className="text-xs text-teal/70 transition-colors hover:text-teal"
                  >
                    Tous les scrutins &rarr;
                  </Link>
                </div>
                <div className="space-y-2">
                  {votes.map((v, i) => (
                    <Link
                      key={v.id}
                      href={`/gouvernance/scrutins/${v.scrutinId}`}
                      className="group flex items-start gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <VoteBadge position={v.position} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed text-bureau-200 line-clamp-2 group-hover:text-bureau-100">
                          {v.scrutin.titre}
                        </p>
                        <p className="mt-1 text-xs text-bureau-500">
                          {fmtDate(v.scrutin.dateScrutin)} &middot; Scrutin
                          n&deg;{v.scrutin.numero}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Déports */}
            {deports.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  D&eacute;ports ({deports.length})
                </h2>
                <div className="space-y-2">
                  {deports.map((dp) => (
                    <div
                      key={dp.id}
                      className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <p className="text-sm leading-relaxed text-bureau-200">
                        {dp.cibleTexte}
                      </p>
                      <p className="mt-1.5 text-xs text-bureau-500">
                        {dp.instanceLibelle} &middot; {dp.porteeLibelle}{" "}
                        &middot; {fmtDate(dp.datePublication)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {votes.length === 0 && deports.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucune activit&eacute; parlementaire enregistr&eacute;e.
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
                    ["Groupe", `${d.groupe} (${d.groupeAbrev})`],
                    ["D\u00e9partement", `${d.departementNom} (${d.departementCode})`],
                    ["Circonscription", `${d.circonscription}e`],
                    ["L\u00e9gislature", `${d.legislature}e`],
                    [
                      "Naissance",
                      d.dateNaissance
                        ? `${fmtDate(d.dateNaissance)}${d.villeNaissance ? `, ${d.villeNaissance}` : ""}`
                        : null,
                    ],
                    ["Profession", d.profession],
                    ["Mandats", d.nombreMandats ? `${d.nombreMandats}` : null],
                    ["Exp\u00e9rience", d.experienceDepute],
                    ["Prise de fonction", fmtDate(d.datePriseFonction)],
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
