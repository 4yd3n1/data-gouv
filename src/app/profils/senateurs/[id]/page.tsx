import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate, fmtEuro, fmt } from "@/lib/format";
import { JsonLd } from "@/components/json-ld";

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
import { ProfileSignalBanner } from "@/components/profile-signal-banner";
import { DeclarationSection } from "@/components/declaration-section";
import { RemunerationsPanel } from "@/components/gouvernement/remunerations-panel";
import { getBaremeParlementaire } from "@/lib/baremes-officiels";
import { RelationsGrid } from "@/components/relations-grid";
import { SignalFormula } from "@/components/signal-formula";

const COMMISSION_DOMAINS: Array<{ pattern: RegExp; keywords: string[] }> = [
  { pattern: /affaires sociales|santé/i, keywords: ["santé", "sante", "pharma"] },
  { pattern: /finances|budget/i, keywords: ["finance", "fiscal", "budget"] },
  { pattern: /développement durable|environnement/i, keywords: ["environnement", "énergie", "climat"] },
  { pattern: /affaires économiques/i, keywords: ["économi", "industr", "numérique"] },
  { pattern: /culture|éducation/i, keywords: ["culture", "éducation", "média"] },
  { pattern: /lois/i, keywords: ["justice", "sécurité", "droit"] },
];

const SENATEUR_TAB_REDIRECTS: Record<string, string> = {
  mandats: "chronologie",
  transparence: "signaux",
  declarations: "documents",
  infos: "resume",
};

const VALID_SENATEUR_TABS = new Set([
  "resume",
  "signaux",
  "chronologie",
  "relations",
  "documents",
]);

export default async function SenateurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;

  // Redirect to government profile if this senator is currently a government member
  const govProfile = await prisma.personnalitePublique.findFirst({
    where: { senateurId: id },
    select: { slug: true },
  });
  if (govProfile) redirect(`/profils/${govProfile.slug}`);

  if (rawTab && SENATEUR_TAB_REDIRECTS[rawTab]) {
    permanentRedirect(
      `/profils/senateurs/${id}?tab=${SENATEUR_TAB_REDIRECTS[rawTab]}`,
    );
  }
  const tab =
    rawTab && VALID_SENATEUR_TABS.has(rawTab) ? rawTab : "resume";

  const s = await prisma.senateur.findUnique({
    where: { id },
    include: {
      mandats: { orderBy: { dateDebut: "desc" } },
      commissions: { orderBy: { dateDebut: "desc" } },
    },
  });
  if (!s) notFound();

  const declarations = await prisma.declarationInteret.findMany({
    where: {
      nomNormalise: s.nomNormalise,
      prenomNormalise: s.prenomNormalise,
      typeMandat: "Sénateur",
    },
    include: { participations: true, revenus: true },
    orderBy: { dateDepot: "desc" },
  });

  const conflictDeclarations = declarations.filter(
    (decl) => (decl.totalParticipations ?? 0) > 0
  );
  const totalParticipationsAmount = conflictDeclarations.reduce(
    (sum, decl) => sum + (decl.totalParticipations ?? 0),
    0
  );

  // Commission-lobbying overlap
  const matchedCommissions = s.commissions
    .map(c => {
      const match = COMMISSION_DOMAINS.find(cd => cd.pattern.test(c.nom));
      return match ? { commission: c.nom, keywords: match.keywords } : null;
    })
    .filter((mc): mc is { commission: string; keywords: string[] } => mc !== null);

  const overlapCounts = matchedCommissions.length > 0
    ? await Promise.all(
        matchedCommissions.map(mc =>
          prisma.actionLobbyiste.count({
            where: {
              OR: mc.keywords.map(kw => ({ domaine: { contains: kw, mode: "insensitive" as const } })),
            },
          })
        )
      )
    : [];

  const commissionOverlaps = matchedCommissions
    .map((mc, i) => ({ ...mc, lobbyCount: overlapCounts[i] }))
    .filter(o => o.lobbyCount > 0);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const senateurPersonSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `${s.prenom} ${s.nom}`,
    url: `${siteUrl}/profils/senateurs/${id}`,
    jobTitle: `Sénateur ${s.groupe ?? ""}`.trim(),
    ...(s.photoUrl ? { image: s.photoUrl } : {}),
  };

  const signauxCount =
    conflictDeclarations.length + commissionOverlaps.length;

  return (
    <>
      <JsonLd id={`ld-person-senateur-${id}`} data={senateurPersonSchema} />
      <ProfileHero
        avatar={{
          src: s.photoUrl,
          initials: `${s.prenom[0]}${s.nom[0]}`,
        }}
        name={`${s.civilite ?? ""} ${s.prenom} ${s.nom}`.trim()}
        subtitle={`${s.groupe ?? "—"} · ${s.departement ?? "—"}`}
        status={{
          active: s.actif,
          label: s.actif ? "En mandat" : "Ancien sénateur",
        }}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Profils", href: "/profils" },
          { label: "Sénateurs", href: "/profils/senateurs" },
          { label: `${s.prenom} ${s.nom}` },
        ]}
        lastUpdated={declarations[0]?.dateDepot ?? s.updatedAt}
      >
        <Suspense>
          <ProfileTabs
            tabs={[
              { key: "resume", label: "Résumé" },
              {
                key: "signaux",
                label: "Signaux",
                count: signauxCount || undefined,
              },
              {
                key: "chronologie",
                label: "Mandats",
                count: s.mandats.length || undefined,
              },
              {
                key: "relations",
                label: "Relations",
                count: s.commissions.length || undefined,
              },
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
        <ProfileSignalBanner keys={[`senateur:${s.id}`, `ministre:${s.id}`]} />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Résumé ── */}
        {tab === "resume" && (
          <section className="space-y-6 fade-up">
            <header>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Résumé
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bureau-300">
                {s.civilite ?? ""} {s.prenom} {s.nom}, sénateur·rice {s.groupe ?? ""} de {s.departement ?? ""}.
              </p>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  { label: "Mandats", value: s.mandats.length, href: `/profils/senateurs/${s.id}?tab=chronologie` },
                  { label: "Commissions", value: s.commissions.length, href: `/profils/senateurs/${s.id}?tab=relations` },
                  { label: "Déclarations HATVP", value: declarations.length, href: `/profils/senateurs/${s.id}?tab=documents` },
                  { label: "Conflits potentiels", value: conflictDeclarations.length + commissionOverlaps.length, href: `/profils/senateurs/${s.id}?tab=signaux` },
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
                    ["Groupe", s.groupe],
                    ["Département", s.departement],
                    ["Profession", s.profession],
                    ["Naissance", fmtDate(s.dateNaissance)],
                    ["Prise de fonction", fmtDate(s.datePriseFonction)],
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
            {conflictDeclarations.length > 0 && (
              <section>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Intérêts financiers déclarés
                </h2>
                <p className="mb-2 text-xs text-bureau-500">
                  Source : HATVP — déclarations d&apos;intérêts.
                </p>
                <SignalFormula type="conflit" variant="inline" className="mb-4" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">Participations déclarées</p>
                    <p className="mt-1 text-xl font-bold text-amber">{fmtEuro(totalParticipationsAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">Déclarations</p>
                    <p className="mt-1 text-xl font-bold text-bureau-200">{fmt(declarations.length)}</p>
                  </div>
                </div>
              </section>
            )}

            {commissionOverlaps.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Recoupement commissions / lobbying
                </h2>
                <SignalFormula type="lobby" variant="inline" className="mb-4" />
                <div className="space-y-2">
                  {commissionOverlaps.map((o) => (
                    <div
                      key={o.commission}
                      className="flex items-center justify-between rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-bureau-200 line-clamp-1">{o.commission}</p>
                        <p className="mt-1 text-xs text-bureau-500">
                          Domaines ciblés : {o.keywords.join(", ")}
                        </p>
                      </div>
                      <div className="shrink-0 ml-4 text-right">
                        <p className="text-lg font-bold text-amber">{fmt(o.lobbyCount)}</p>
                        <p className="text-[10px] uppercase tracking-widest text-bureau-500">actions de lobbying</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {conflictDeclarations.length === 0 && commissionOverlaps.length === 0 && (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucun signal identifié pour ce sénateur.
              </p>
            )}
          </div>
        )}

        {/* ── Chronologie : Mandats ── */}
        {tab === "chronologie" && (
          <div className="space-y-8 fade-up">
            {s.mandats.length > 0 ? (
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
                          <p className="text-sm leading-relaxed text-bureau-200">{m.libelle}</p>
                          <p className="mt-1 text-xs text-bureau-500">{m.type}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-bureau-400">{fmtDate(m.dateDebut)}</p>
                          <p className="text-xs text-bureau-500">
                            →{" "}
                            {m.dateFin ? (
                              fmtDate(m.dateFin)
                            ) : (
                              <span className="font-medium text-teal">en cours</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <p className="py-8 text-center text-sm text-bureau-500 italic">
                Aucun mandat enregistré.
              </p>
            )}
          </div>
        )}

        {/* ── Relations ── */}
        {tab === "relations" && (
          <div className="space-y-8 fade-up">
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
                          <p className="text-sm leading-relaxed text-bureau-200">{c.nom}</p>
                          <p className="mt-1 text-xs text-bureau-500">{c.fonction ?? "Membre"}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-bureau-400">{fmtDate(c.dateDebut)}</p>
                          <p className="text-xs text-bureau-500">
                            →{" "}
                            {c.dateFin ? (
                              fmtDate(c.dateFin)
                            ) : (
                              <span className="font-medium text-teal">en cours</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <RelationsGrid
              groups={[
                {
                  label: "Groupe parlementaire",
                  items: s.groupe
                    ? [{ type: "groupe", title: s.groupe }]
                    : [],
                },
                {
                  label: "Territoire",
                  items: s.departement
                    ? [
                        {
                          type: "ministere",
                          title: s.departement,
                        },
                      ]
                    : [],
                },
              ]}
            />
          </div>
        )}

        {/* ── Documents & sources ── */}
        {tab === "documents" && (
          <div className="space-y-8 fade-up">
            <RemunerationsPanel
              nomNormalise={s.nomNormalise}
              prenomNormalise={s.prenomNormalise}
              personnaliteId={null}
              bareme={getBaremeParlementaire("senateur")}
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
