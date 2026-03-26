import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate, fmtEuro, fmt } from "@/lib/format";

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

const COMMISSION_DOMAINS: Array<{ pattern: RegExp; keywords: string[] }> = [
  { pattern: /affaires sociales|sant\u00e9/i, keywords: ["sant\u00e9", "sante", "pharma"] },
  { pattern: /finances|budget/i, keywords: ["finance", "fiscal", "budget"] },
  { pattern: /d\u00e9veloppement durable|environnement/i, keywords: ["environnement", "\u00e9nergie", "climat"] },
  { pattern: /affaires \u00e9conomiques/i, keywords: ["\u00e9conomi", "industr", "num\u00e9rique"] },
  { pattern: /culture|\u00e9ducation/i, keywords: ["culture", "\u00e9ducation", "m\u00e9dia"] },
  { pattern: /lois/i, keywords: ["justice", "s\u00e9curit\u00e9", "droit"] },
];

export default async function SenateurDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const { tab = "mandats" } = await searchParams;

  // Redirect to government profile if this senator is currently a government member
  const govProfile = await prisma.personnalitePublique.findFirst({
    where: { senateurId: id },
    select: { slug: true },
  });
  if (govProfile) redirect(`/gouvernement/${govProfile.slug}`);

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
          { label: "Profils", href: "/profils" },
          { label: "S\u00e9nateurs", href: "/profils/senateurs" },
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
              {
                key: "transparence",
                label: "Transparence",
                count: conflictDeclarations.length || undefined,
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

        {/* ── Transparence ── */}
        {tab === "transparence" && (
          <div className="space-y-8 fade-up">
            {conflictDeclarations.length > 0 && (
              <section>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Int&eacute;r&ecirc;ts financiers d&eacute;clar&eacute;s
                </h2>
                <p className="mb-4 text-xs text-bureau-500">
                  Source : HATVP &mdash; d&eacute;clarations d&apos;int&eacute;r&ecirc;ts
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">Participations d&eacute;clar&eacute;es</p>
                    <p className="mt-1 text-xl font-bold text-amber">{fmtEuro(totalParticipationsAmount)}</p>
                  </div>
                  <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">D&eacute;clarations</p>
                    <p className="mt-1 text-xl font-bold text-bureau-200">{fmt(declarations.length)}</p>
                  </div>
                </div>
              </section>
            )}

            {commissionOverlaps.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Recoupement commissions / lobbying
                </h2>
                <div className="space-y-2">
                  {commissionOverlaps.map((o) => (
                    <div
                      key={o.commission}
                      className="flex items-center justify-between rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-bureau-200 line-clamp-1">{o.commission}</p>
                        <p className="mt-1 text-xs text-bureau-500">
                          Domaines cibl&eacute;s : {o.keywords.join(", ")}
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
                Aucun recoupement identifi&eacute; entre d&eacute;clarations et activit&eacute;s de lobbying.
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
