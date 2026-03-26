import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await prisma.depute.findUnique({
    where: { id },
    select: { prenom: true, nom: true, groupe: true, departementNom: true, civilite: true },
  });
  if (!d) return { title: "Député introuvable — L'Observatoire Citoyen" };
  const name = `${d.prenom} ${d.nom}`;
  return {
    title: `${name} — Député · L'Observatoire Citoyen`,
    description: `Votes, déclarations d'intérêts et transparence de ${d.civilite} ${name}, député ${d.groupe} de ${d.departementNom}.`,
  };
}
import { fmtDate, fmtEuro, fmt } from "@/lib/format";
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { VoteBadge } from "@/components/vote-badge";
import { DeclarationSection } from "@/components/declaration-section";
import { ConflictAlert } from "@/components/conflict-alert";
import { ConflictDrilldown } from "@/components/conflict-drilldown";

import { TAG_LABELS } from "@/lib/vote-tags";

export default async function DeputeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab = "activite" } = await searchParams;

  // Redirect to government profile if this deputy is currently a government member
  const govProfile = await prisma.personnalitePublique.findFirst({
    where: { deputeId: id },
    select: { slug: true },
  });
  if (govProfile) redirect(`/profils/${govProfile.slug}`);

  const d = await prisma.depute.findUnique({
    where: { id },
    include: { departement: true },
  });
  if (!d) notFound();

  const [votes, deports, declarations, scrutinTagCounts, taggedVoteCount, conflictSignals] = await Promise.all([
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
      where: {
        nom: { equals: d.nom, mode: "insensitive" as const },
        prenom: { equals: d.prenom, mode: "insensitive" as const },
        typeMandat: "Député",
      },
      include: { participations: true, revenus: true },
      orderBy: { dateDepot: "desc" },
    }),
    prisma.scrutinTag.groupBy({
      by: ["tag"],
      where: { scrutin: { votes: { some: { deputeId: id } } } },
      _count: { tag: true },
      orderBy: { _count: { tag: "desc" } },
    }),
    prisma.voteRecord.count({
      where: { deputeId: id, scrutin: { tags: { some: {} } } },
    }),
    prisma.conflictSignal.findMany({
      where: { deputeId: id },
      orderBy: { voteCount: "desc" },
    }),
  ]);

  // Fetch votes linked to conflict signal tags for drill-down
  const signalTags = [...new Set(conflictSignals.map(s => s.tag))];
  const conflictVoteRecords = signalTags.length > 0 ? await prisma.voteRecord.findMany({
    where: { deputeId: id, scrutin: { tags: { some: { tag: { in: signalTags } } } } },
    select: {
      position: true,
      scrutin: { select: { id: true, titre: true, dateScrutin: true, sortCode: true, tags: { select: { tag: true } } } },
    },
    orderBy: { scrutin: { dateScrutin: "desc" } },
  }) : [];

  const votesByTag: Record<string, Array<{ position: string; scrutinId: string; titre: string; date: string; sortCode: string }>> = {};
  for (const vr of conflictVoteRecords) {
    const item = {
      position: vr.position,
      scrutinId: vr.scrutin.id,
      titre: vr.scrutin.titre,
      date: fmtDate(vr.scrutin.dateScrutin),
      sortCode: vr.scrutin.sortCode,
    };
    for (const t of vr.scrutin.tags) {
      if (signalTags.includes(t.tag)) {
        (votesByTag[t.tag] ??= []).push(item);
      }
    }
  }

  const conflictDeclarations = declarations.filter(
    (decl) => (decl.totalParticipations ?? 0) > 0
  );
  const totalParticipationsAmount = conflictDeclarations.reduce(
    (s, decl) => s + (decl.totalParticipations ?? 0),
    0
  );
  const maxTagCount = scrutinTagCounts[0]?._count.tag ?? 1;

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
          { label: "Profils", href: "/profils" },
          { label: "D\u00e9put\u00e9s", href: "/profils/deputes" },
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
              { key: "transparence", label: "Transparence", count: conflictDeclarations.length || undefined },
              { key: "infos", label: "Informations" },
            ]}
            defaultTab="activite"
          />
        </Suspense>
      </ProfileHero>

      {/* Utility bar */}
      <div className="border-b border-bureau-700/20 bg-bureau-900/30">
        <div className="mx-auto max-w-4xl px-6 py-2 flex justify-end">
          <Link
            href={`/profils/comparer?a=${d.id}`}
            className="text-xs text-bureau-500 transition-colors hover:text-teal"
          >
            Comparer avec un autre d&eacute;put&eacute; &rarr;
          </Link>
        </div>
      </div>

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
                    href="/votes"
                    className="text-xs text-teal/70 transition-colors hover:text-teal"
                  >
                    Tous les scrutins &rarr;
                  </Link>
                </div>
                <div className="space-y-2">
                  {votes.map((v, i) => (
                    <Link
                      key={v.id}
                      href={`/votes/scrutins/${v.scrutinId}`}
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

        {/* ── Transparence ── */}
        {tab === "transparence" && (
          <div className="space-y-8 fade-up">
            {/* Financial interests */}
            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Int&eacute;r&ecirc;ts financiers d&eacute;clar&eacute;s
              </h2>
              <p className="mb-4 text-xs text-bureau-500">
                Source : HATVP &mdash; d&eacute;clarations d&apos;int&eacute;r&ecirc;ts
              </p>
              {conflictDeclarations.length > 0 ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">Participations d&eacute;clar&eacute;es</p>
                      <p className="mt-1 text-xl font-bold text-amber">{fmtEuro(totalParticipationsAmount)}</p>
                    </div>
                    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">Votes sur textes thématiques</p>
                      <p className="mt-1 text-xl font-bold text-bureau-200">{fmt(taggedVoteCount)}</p>
                    </div>
                    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">D&eacute;ports (r&eacute;cusations)</p>
                      <p className="mt-1 text-xl font-bold text-bureau-200">{fmt(deports.length)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {conflictSignals.length > 0
                      ? conflictSignals.map((signal) => (
                          <ConflictDrilldown
                            key={signal.id}
                            deputyName={`${d.prenom} ${d.nom}`}
                            sector={signal.secteurDeclaration}
                            participationTotal={signal.totalMontant ?? 0}
                            relatedVoteCount={signal.voteCount}
                            votePour={signal.votePour}
                            voteContre={signal.voteContre}
                            votes={votesByTag[signal.tag] ?? []}
                          />
                        ))
                      : conflictDeclarations.map((decl) => {
                          const sector =
                            decl.participations.length > 0
                              ? decl.participations
                                  .map((p) => p.nomSociete)
                                  .slice(0, 2)
                                  .join(", ")
                              : (decl.organe ?? decl.typeMandat);
                          return (
                            <ConflictAlert
                              key={decl.id}
                              declarationId={decl.id}
                              deputyName={`${d.prenom} ${d.nom}`}
                              sector={sector}
                              participationTotal={decl.totalParticipations ?? 0}
                              relatedVoteCount={taggedVoteCount}
                              typeMandat={decl.typeMandat}
                            />
                          );
                        })}
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-6 py-8 text-center">
                  <p className="text-sm text-bureau-500 italic">
                    Aucune participation financi&egrave;re d&eacute;clar&eacute;e.
                  </p>
                </div>
              )}
            </section>

            {/* Vote theme breakdown */}
            {scrutinTagCounts.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Votes par th&egrave;me l&eacute;gislatif
                </h2>
                <div className="space-y-2 rounded-xl border border-bureau-700/20 overflow-hidden">
                  {scrutinTagCounts.map((t) => (
                    <div
                      key={t.tag}
                      className="flex items-center gap-4 bg-bureau-800/10 px-4 py-2.5 hover:bg-bureau-800/20 transition-colors"
                    >
                      <span className="w-40 shrink-0 text-sm text-bureau-300">
                        {TAG_LABELS[t.tag] ?? t.tag}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-bureau-700/40 overflow-hidden">
                        <div
                          className="h-full bg-teal/50 rounded-full"
                          style={{ width: `${Math.min(100, (t._count.tag / maxTagCount) * 100)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-bureau-400">{fmt(t._count.tag)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Déports */}
            {deports.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  D&eacute;ports &mdash; r&eacute;cusations pour conflit d&apos;int&eacute;r&ecirc;t
                </h2>
                <div className="space-y-2">
                  {deports.map((dp) => (
                    <div
                      key={dp.id}
                      className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <p className="text-sm leading-relaxed text-bureau-200">{dp.cibleTexte}</p>
                      <p className="mt-1.5 text-xs text-bureau-500">
                        {dp.instanceLibelle} &middot; {dp.porteeLibelle} &middot; {fmtDate(dp.datePublication)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {conflictDeclarations.length === 0 && deports.length === 0 && scrutinTagCounts.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucune donn&eacute;e de transparence disponible pour cet &eacute;lu.
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
