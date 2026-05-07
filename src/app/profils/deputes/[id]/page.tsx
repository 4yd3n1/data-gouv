import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect, permanentRedirect } from "next/navigation";
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
import { RemunerationsPanel } from "@/components/gouvernement/remunerations-panel";
import { getBaremeParlementaire } from "@/lib/baremes-officiels";
import { ConflictAlert } from "@/components/conflict-alert";
import { ConflictDrilldown } from "@/components/conflict-drilldown";
import { ProfileSignalBanner } from "@/components/profile-signal-banner";
import { ShareButton } from "@/components/share-button";
import { RelationsGrid } from "@/components/relations-grid";
import { SignalFormula } from "@/components/signal-formula";

import { TAG_LABELS } from "@/lib/vote-tags";
import { JsonLd } from "@/components/json-ld";

const DEPUTE_TAB_REDIRECTS: Record<string, string> = {
  transparence: "signaux",
  declarations: "documents",
  infos: "resume",
};

const VALID_DEPUTE_TABS = new Set([
  "resume",
  "signaux",
  "activite",
  "relations",
  "documents",
]);

export default async function DeputeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;

  // Redirect to government profile if this deputy is currently a government member
  const govProfile = await prisma.personnalitePublique.findFirst({
    where: { deputeId: id },
    select: { slug: true },
  });
  if (govProfile) redirect(`/profils/${govProfile.slug}`);

  // Backwards-compat fallback: next.config.ts handles HTTP 308 redirects, but
  // keep this in-page guard for any old key that slips through.
  if (rawTab && DEPUTE_TAB_REDIRECTS[rawTab]) {
    permanentRedirect(
      `/profils/deputes/${id}?tab=${DEPUTE_TAB_REDIRECTS[rawTab]}`,
    );
  }
  const tab =
    rawTab && VALID_DEPUTE_TABS.has(rawTab) ? rawTab : "resume";

  const d = await prisma.depute.findUnique({
    where: { id },
    include: { departement: true },
  });
  if (!d) notFound();

  const [votes, totalVoteCount, deports, declarations, scrutinTagCounts, taggedVoteCount, conflictSignals] = await Promise.all([
    prisma.voteRecord.findMany({
      where: { deputeId: id },
      include: { scrutin: true },
      orderBy: { scrutin: { dateScrutin: "desc" } },
      take: 5,
    }),
    prisma.voteRecord.count({ where: { deputeId: id } }),
    prisma.deport.findMany({
      where: { deputeId: id },
      orderBy: { dateCreation: "desc" },
    }),
    prisma.declarationInteret.findMany({
      where: {
        nomNormalise: d.nomNormalise,
        prenomNormalise: d.prenomNormalise,
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const deputePersonSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${d.prenom} ${d.nom}`,
    url: `${siteUrl}/profils/deputes/${id}`,
    jobTitle: `Député ${d.groupe ?? ""}`.trim(),
    ...(d.photoUrl ? { image: d.photoUrl } : {}),
  };

  return (
    <>
      <JsonLd id={`ld-person-depute-${id}`} data={deputePersonSchema} />
      <ProfileHero
        avatar={{
          src: d.photoUrl,
          initials: `${d.prenom[0]}${d.nom[0]}`,
        }}
        name={`${d.civilite} ${d.prenom} ${d.nom}`}
        subtitle={`${d.groupe} · ${d.departementNom} (${d.departementCode})`}
        status={{
          active: d.actif,
          label: d.actif ? "En mandat" : "Ancien député",
        }}
        badge={d.groupeAbrev}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Profils", href: "/profils" },
          { label: "Députés", href: "/profils/deputes" },
          { label: `${d.prenom} ${d.nom}` },
        ]}
        lastUpdated={declarations[0]?.dateDepot ?? d.updatedAt}
        scores={[
          { value: d.scoreParticipation, label: "Participation", color: "teal" },
          { value: d.scoreSpecialite, label: "Spécialité", color: "blue" },
          { value: d.scoreLoyaute, label: "Loyauté", color: "amber" },
          { value: d.scoreMajorite, label: "Majorité", color: "rose" },
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
              { key: "resume", label: "Résumé" },
              {
                key: "signaux",
                label: "Signaux",
                count:
                  (conflictSignals.length || conflictDeclarations.length) +
                    deports.length || undefined,
              },
              {
                key: "activite",
                label: "Activité",
                count: totalVoteCount || undefined,
              },
              { key: "relations", label: "Relations" },
              {
                key: "documents",
                label: "Documents",
                count: declarations.length || undefined,
              },
            ]}
            defaultTab="resume"
          />
        </Suspense>
      </ProfileHero>

      <div className="px-6">
        <ProfileSignalBanner keys={[`depute:${d.id}`]} />
      </div>

      {/* Utility bar */}
      <div className="border-b border-bureau-700/20 bg-bureau-900/30">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-6 py-2">
          <ShareButton />
          <Link
            href={`/profils/comparer?a=${d.id}`}
            className="text-xs text-bureau-500 transition-colors hover:text-teal"
          >
            Comparer avec un autre député →
          </Link>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Résumé ── */}
        {tab === "resume" && (
          <section className="space-y-6 fade-up">
            <header>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Résumé
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bureau-300">
                {d.civilite} {d.prenom} {d.nom}, député {d.groupe} de {d.departementNom}
                {d.circonscription ? ` (${d.circonscription}e circonscription)` : ""} —
                législature {d.legislature}.
              </p>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { label: "Votes", value: totalVoteCount, href: `/profils/deputes/${d.id}?tab=activite` },
                  { label: "Déports", value: deports.length, href: `/profils/deputes/${d.id}?tab=signaux` },
                  { label: "Déclarations HATVP", value: declarations.length, href: `/profils/deputes/${d.id}?tab=documents` },
                  { label: "Conflits potentiels", value: conflictSignals.length || conflictDeclarations.length, href: `/profils/deputes/${d.id}?tab=signaux` },
                ] as const
              ).map((stat) => {
                const inner = (
                  <>
                    <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-bureau-100">
                      {fmt(stat.value)}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-bureau-500">
                      {stat.label}
                    </span>
                  </>
                );
                return (
                  <li key={stat.label}>
                    {stat.value > 0 ? (
                      <Link
                        href={stat.href}
                        className="flex flex-col gap-1 rounded border border-bureau-700/30 bg-bureau-800/15 p-3 transition-colors hover:border-bureau-600/40 hover:bg-bureau-800/30"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <span className="flex flex-col gap-1 rounded border border-bureau-700/20 bg-bureau-800/10 p-3 opacity-60">
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <section className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-6">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Informations personnelles
              </h3>
              <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {(
                  [
                    ["Groupe", `${d.groupe} (${d.groupeAbrev})`],
                    ["Département", `${d.departementNom} (${d.departementCode})`],
                    ["Circonscription", `${d.circonscription}e`],
                    ["Législature", `${d.legislature}e`],
                    [
                      "Naissance",
                      d.dateNaissance
                        ? `${fmtDate(d.dateNaissance)}${d.villeNaissance ? `, ${d.villeNaissance}` : ""}`
                        : null,
                    ],
                    ["Profession", d.profession],
                    ["Mandats", d.nombreMandats ? `${d.nombreMandats}` : null],
                    ["Expérience", d.experienceDepute],
                    ["Prise de fonction", fmtDate(d.datePriseFonction)],
                  ] as [string, string | null][]
                )
                  .filter(([, v]) => v && v !== "—")
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-wider text-bureau-500">{k}</dt>
                      <dd className="mt-0.5 text-sm text-bureau-200">{v}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          </section>
        )}

        {/* ── Signaux ── */}
        {tab === "signaux" && (
          <div className="space-y-8 fade-up">
            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Intérêts financiers déclarés
              </h2>
              <p className="mb-2 text-xs text-bureau-500">
                Source : HATVP — déclarations d&apos;intérêts.
              </p>
              <SignalFormula type="conflit" variant="inline" className="mb-4" />
              {conflictDeclarations.length > 0 ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                        Participations déclarées
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber">
                        {fmtEuro(totalParticipationsAmount)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                        Votes sur textes thématiques
                      </p>
                      <p className="mt-1 text-xl font-bold text-bureau-200">{fmt(taggedVoteCount)}</p>
                    </div>
                    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                        Déports (récusations)
                      </p>
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
                    Aucune participation financière déclarée.
                  </p>
                </div>
              )}
            </section>

            {deports.length > 0 && (
              <section id="deports">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Déports — récusations pour conflit d&apos;intérêt
                </h2>
                <div className="space-y-2">
                  {deports.map((dp) => (
                    <div
                      key={dp.id}
                      className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <p className="text-sm leading-relaxed text-bureau-200">{dp.cibleTexte}</p>
                      <p className="mt-1.5 text-xs text-bureau-500">
                        {dp.instanceLibelle} · {dp.porteeLibelle} · {fmtDate(dp.datePublication)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {conflictDeclarations.length === 0 && deports.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucun signal identifié pour cet élu.
              </p>
            )}
          </div>
        )}

        {/* ── Activité parlementaire ── */}
        {tab === "activite" && (
          <div className="space-y-8 fade-up">
            {scrutinTagCounts.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                    Votes par thème
                  </h2>
                  <span className="text-xs text-bureau-500">
                    {fmt(taggedVoteCount)} votes thématiques
                  </span>
                </div>
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

            {votes.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                    Votes récents
                  </h2>
                  <Link
                    href={`/votes/mon-depute?id=${d.id}`}
                    className="text-xs text-teal/70 transition-colors hover:text-teal"
                  >
                    Tous les scrutins →
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
                          {fmtDate(v.scrutin.dateScrutin)} · Scrutin n°{v.scrutin.numero}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {votes.length === 0 && scrutinTagCounts.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucune activité parlementaire enregistrée.
              </p>
            )}
          </div>
        )}

        {/* ── Relations ── */}
        {tab === "relations" && (
          <div className="space-y-6 fade-up">
            <RelationsGrid
              groups={[
                {
                  label: "Groupe parlementaire",
                  items: [
                    {
                      type: "groupe",
                      title: d.groupe,
                      meta: d.groupeAbrev ?? undefined,
                    },
                  ],
                },
                {
                  label: "Circonscription",
                  items: [
                    {
                      type: "ministere",
                      title: `${d.departementNom} (${d.departementCode})`,
                      href: `/territoire/${d.departementCode}`,
                      meta: `${d.circonscription}e circonscription`,
                    },
                  ],
                },
              ]}
            />
          </div>
        )}

        {/* ── Documents & sources ── */}
        {tab === "documents" && (
          <div className="space-y-8 fade-up">
            <RemunerationsPanel
              nomNormalise={d.nomNormalise}
              prenomNormalise={d.prenomNormalise}
              personnaliteId={null}
              bareme={getBaremeParlementaire("depute")}
            />
            {declarations.length > 0 ? (
              <DeclarationSection declarations={declarations} />
            ) : (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucune déclaration d&apos;intérêts.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
