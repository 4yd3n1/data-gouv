import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { fmt, fmtDate, fmtEuro } from "@/lib/format";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { MediaBoard } from "@/components/media-board";
import { ConcentrationChart } from "@/components/concentration-chart";
import { PowerMap } from "@/components/power-map";
import { MediaTreemap } from "@/components/media-treemap";
import { ArcomSection } from "@/components/arcom-section";

export const revalidate = 86400;

const GROUP_COLORS = [
  "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b",
];

function getDominantType(filiales: Array<{ type: string }>): string {
  const counts: Record<string, number> = {};
  for (const f of filiales) {
    counts[f.type] = (counts[f.type] ?? 0) + 1;
  }
  let max = 0;
  let dominant = "TELEVISION";
  for (const [type, count] of Object.entries(counts)) {
    if (count > max) { max = count; dominant = type; }
  }
  return dominant;
}

const TYPE_STAT_CONFIG = [
  { type: "TELEVISION", label: "Télévision", color: "#60a5fa" },
  { type: "RADIO", label: "Radio", color: "#fbbf24" },
  { type: "PRESSE_QUOTIDIENNE", label: "Presse", color: "#2dd4bf" },
  { type: "PRESSE_MAGAZINE", label: "Magazines", color: "#0d9488" },
  { type: "NUMERIQUE", label: "Numérique", color: "#fb7185" },
];

export default async function MediasPage() {
  const dossier = getDossier("medias");
  if (!dossier) notFound();

  const lobbyDomainFilter = {
    OR: dossier.lobbyDomains.map((d) => ({
      domaine: { contains: d, mode: "insensitive" as const },
    })),
  };

  const [
    groupesRaw,
    filialeCount,
    scrutins,
    mediaActionCount,
    mediaLobbyCount,
    topOrgsRaw,
  ] = await Promise.all([
    prisma.groupeMedia.findMany({
      orderBy: { rang: "asc" },
      include: {
        filiales: { orderBy: { rang: "asc" } },
        participations: {
          include: {
            proprietaire: {
              include: { personnalite: { select: { slug: true } } },
            },
          },
        },
      },
    }),
    prisma.filiale.count(),
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: dossier.tags } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    prisma.actionLobbyiste.count({
      where: lobbyDomainFilter,
    }),
    prisma.lobbyiste.count({
      where: {
        actions: { some: lobbyDomainFilter },
      },
    }),
    prisma.lobbyiste.findMany({
      where: {
        actions: { some: lobbyDomainFilter },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
  ]);

  // Political connections
  const politicalOwners = await prisma.mediaProprietaire.findMany({
    where: { contextePolitique: { not: null } },
    select: {
      nom: true,
      prenom: true,
      slug: true,
      contextePolitique: true,
      sourceContextePolitique: true,
      participations: {
        select: { groupe: { select: { nomCourt: true } } },
      },
    },
    orderBy: { nom: "asc" },
  });

  // AGORA lobbying targeting Culture ministry
  const cultureLobbying = await prisma.actionLobby.groupBy({
    by: ["representantNom"],
    where: { ministereCode: "CULTURE" },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const cultureLobbyTotal = await prisma.actionLobby.count({
    where: { ministereCode: "CULTURE" },
  });
  const cultureDomains = await prisma.actionLobby.groupBy({
    by: ["domaine"],
    where: { ministereCode: "CULTURE", domaine: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // Separate query for signalements (avoids Promise.all type widening)
  const signalements = await prisma.signalementArcom.findMany({
    orderBy: { date: "desc" },
    include: {
      filiale: {
        select: { nom: true, groupe: { select: { nomCourt: true } } },
      },
    },
  });

  // Pre-compute signalement counts per filiale and per group
  const filialeSignalementCounts = new Map<string, number>();
  for (const s of signalements) {
    filialeSignalementCounts.set(s.filialeId, (filialeSignalementCounts.get(s.filialeId) ?? 0) + 1);
  }
  const groupSignalementCounts = new Map<string, number>();
  for (const g of groupesRaw) {
    let total = 0;
    for (const f of g.filiales) total += filialeSignalementCounts.get(f.id) ?? 0;
    groupSignalementCounts.set(g.slug, total);
  }

  // Transform for MediaBoard props
  const boardData = groupesRaw.map((g) => ({
    slug: g.slug,
    nom: g.nom,
    nomCourt: g.nomCourt,
    description: g.description,
    rang: g.rang,
    proprietaires: g.participations.map((p) => ({
      nom: p.proprietaire.nom,
      prenom: p.proprietaire.prenom,
      slug: p.proprietaire.slug,
      bioCourte: p.proprietaire.bioCourte,
      formation: p.proprietaire.formation,
      fortuneEstimee: p.proprietaire.fortuneEstimee,
      sourceFortuneEstimee: p.proprietaire.sourceFortuneEstimee,
      activitePrincipale: p.proprietaire.activitePrincipale,
      partCapital: p.partCapital,
      typeControle: p.typeControle,
      gouvernementSlug: p.proprietaire.personnalite?.slug ?? null,
      contextePolitique: p.proprietaire.contextePolitique,
      sourceContextePolitique: p.proprietaire.sourceContextePolitique,
    })),
    filiales: g.filiales.map((f) => ({
      nom: f.nom,
      type: f.type,
      description: f.description,
      audienceEstimee: f.audienceEstimee,
      dateCreation: f.dateCreation,
      orientation: f.orientation,
      signalementCount: filialeSignalementCounts.get(f.id) ?? 0,
    })),
    signalementCount: groupSignalementCounts.get(g.slug) ?? 0,
  }));

  // Transform for ConcentrationChart
  const chartData = groupesRaw.map((g) => ({
    slug: g.slug,
    nomCourt: g.nomCourt,
    rang: g.rang,
    filiales: g.filiales.map((f) => ({ type: f.type })),
  }));

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  // Scrutins shape for TopicVoteList
  const scrutinsForList = scrutins.map((s) => ({
    id: s.id,
    titre: s.titre,
    dateScrutin: s.dateScrutin,
    sortCode: s.sortCode,
    groupeVotes: s.groupeVotes.map((g) => ({
      nomOrgane: g.organeRef,
      pour: g.pour,
      contre: g.contre,
      abstentions: g.abstentions,
    })),
  }));

  // Transform for PowerMap
  const powerMapData = groupesRaw.map((g) => {
    const owner = g.participations[0]?.proprietaire;
    return {
      slug: g.slug,
      nomCourt: g.nomCourt,
      filialeCount: g.filiales.length,
      dominantType: getDominantType(g.filiales),
      fortuneEstimee: owner?.fortuneEstimee ?? null,
      hasGovLink: g.participations.some((p) => p.proprietaire.personnalite?.slug),
      ownerInitials: owner
        ? `${owner.prenom.charAt(0)}${owner.nom.charAt(0)}`.toUpperCase()
        : "??",
      ownerName: owner ? `${owner.prenom} ${owner.nom}` : g.nomCourt,
      signalementCount: groupSignalementCounts.get(g.slug) ?? 0,
    };
  });

  // Transform for treemap
  const totalFiliales = groupesRaw.reduce((s, g) => s + g.filiales.length, 0);
  const treemapData = groupesRaw.map((g, i) => ({
    slug: g.slug,
    nomCourt: g.nomCourt,
    count: g.filiales.length,
    color: GROUP_COLORS[i % GROUP_COLORS.length],
    pct: totalFiliales > 0 ? Math.round((g.filiales.length / totalFiliales) * 100) : 0,
  }));

  // Type counts for stat mini-cards
  const typeCounts: Record<string, number> = {};
  for (const g of groupesRaw) {
    for (const f of g.filiales) {
      typeCounts[f.type] = (typeCounts[f.type] ?? 0) + 1;
    }
  }

  // Data enrichment counts
  const govLinkedCount = groupesRaw.filter((g) =>
    g.participations.some((p) => p.proprietaire.personnalite?.slug),
  ).length;

  // ARCOM aggregate stats
  const totalAmendes = signalements.reduce(
    (s, sig) => s + (sig.montant ?? 0), 0,
  );
  const arcomChannels = new Set(signalements.map((s) => s.filialeId));
  const arcomSectionData = signalements.map((s) => ({
    id: s.id,
    date: s.date,
    type: s.type,
    motif: s.motif,
    montant: s.montant,
    referenceArcom: s.referenceArcom,
    resume: s.resume,
    filiale: {
      nom: s.filiale.nom,
      groupe: { nomCourt: s.filiale.groupe.nomCourt },
    },
  }));

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="medias" />

      {/* Section 0 — SIGINT Header */}
      <section className="sigint-section border-b border-bureau-700/20 bg-bureau-950">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="live-dot" />
              <span className="classification-badge">Surveillance active</span>
              <span className="hidden text-[10px] text-bureau-600 tracking-wider uppercase sm:inline">
                Dernière mise à jour : {fmtDate(new Date())}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] data-value text-bureau-500">
              <span>{groupesRaw.length} cibles</span>
              <span className="text-bureau-700">|</span>
              <span>{fmt(filialeCount)} actifs</span>
              <span className="hidden text-bureau-700 sm:inline">|</span>
              <span className="hidden text-amber sm:inline">{govLinkedCount} liens politiques</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Section 1 — Context cards */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="stat-card rounded-xl border border-rose/20 bg-rose/5 p-5">
              <p className="stat-number-rose text-3xl font-bold">9</p>
              <p className="mt-1 text-sm text-bureau-300">milliardaires contrôlent plus de 80 % des médias privés</p>
            </div>
            <div className="stat-card rounded-xl border border-amber/20 bg-amber/5 p-5">
              <p className="stat-number-amber text-3xl font-bold">25<sup className="text-lg">e</sup></p>
              <p className="mt-1 text-sm text-bureau-300">au classement RSF de la liberté de la presse (2025)</p>
            </div>
            <div className="stat-card rounded-xl border border-teal/20 bg-teal/5 p-5">
              <p className="stat-number-teal text-3xl font-bold">{fmt(filialeCount)}</p>
              <p className="mt-1 text-sm text-bureau-300">titres de presse, chaînes TV, radios et médias numériques recensés</p>
            </div>
          </div>

          <div className="desc-block mt-6 rounded-xl border border-rose/20 bg-bureau-800/40 p-6 pl-8">
            <p className="text-sm text-bureau-300 leading-relaxed">
              La concentration des médias en France est un enjeu démocratique majeur.
              Une poignée de groupes industriels — dont les activités principales sont souvent
              étrangères à l&apos;information — contrôlent la majorité des titres de presse,
              chaînes de télévision et stations de radio. Cette page recense les structures
              de propriété, les filiales et les liens entre propriétaires de médias et responsables
              politiques, à partir de données publiques.
            </p>
          </div>
        </section>

        {/* Section 2 — Power Map */}
        <section className="sigint-section section-divider">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Cartographie du pouvoir médiatique
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Chaque nœud représente un groupe — taille proportionnelle au nombre de médias contrôlés
              </p>
            </div>
            <span className="classification-badge hidden sm:inline">Analyse structurelle</span>
          </div>

          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 p-2 sm:p-4">
            <PowerMap groups={powerMapData} />
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-bureau-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[1px] w-4 bg-bureau-400" />
              Ligne pleine = lien gouvernemental
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-[1px] w-4 border-t border-dashed border-bureau-400" />
              Tirets = pas de lien gouvernemental
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber" />
              Connexion politique
            </span>
          </div>
        </section>

        {/* Section 3 — Dossier Grid (Intelligence Board) */}
        <section className="sigint-section section-divider">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Dossiers propriétaires
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                {groupesRaw.length} groupes, leurs propriétaires et {fmt(filialeCount)} médias — cliquez pour explorer
              </p>
            </div>
            <span className="classification-badge hidden sm:inline">Confidentiel</span>
          </div>

          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-bureau-800/20" />}>
            <MediaBoard groups={boardData} />
          </Suspense>
        </section>

        {/* Section 3.5 — Signalements ARCOM */}
        {signalements.length > 0 && (
          <section className="sigint-section section-divider">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                  Signalements ARCOM
                </h2>
                <p className="mt-1 text-sm text-bureau-500">
                  Mises en demeure, sanctions et amendes prononcées par le régulateur audiovisuel
                </p>
              </div>
              <span className="classification-badge hidden sm:inline">Incidents régulatoires</span>
            </div>

            <ArcomSection
              signalements={arcomSectionData}
              totalAmendes={totalAmendes}
              channelCount={arcomChannels.size}
            />
          </section>
        )}

        {/* Section — Connexions politiques */}
        {politicalOwners.length > 0 && (
          <section className="sigint-section section-divider">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                  Connexions politiques
                </h2>
                <p className="mt-1 text-sm text-bureau-500">
                  Liens document&eacute;s entre propri&eacute;taires de m&eacute;dias et responsables politiques
                </p>
              </div>
              <span className="classification-badge hidden sm:inline">Liens crois&eacute;s</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {politicalOwners.map((o) => {
                const groupNames = [...new Set(o.participations.map(p => p.groupe.nomCourt))].join(", ");
                return (
                  <div key={o.slug} className="rounded-xl border border-amber/20 bg-amber/5 p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-bureau-100">{o.prenom} {o.nom}</p>
                        <p className="text-[10px] uppercase tracking-widest text-bureau-500">{groupNames}</p>
                      </div>
                    </div>
                    <p className="text-xs text-bureau-400 leading-relaxed line-clamp-3">
                      {o.contextePolitique}
                    </p>
                    {o.sourceContextePolitique && (
                      <p className="mt-2 text-[10px] text-bureau-600">
                        Source : {o.sourceContextePolitique}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section — Lobbying Culture */}
        {cultureLobbyTotal > 0 && (
          <section className="sigint-section section-divider">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                  Lobbying ciblant le minist&egrave;re de la Culture
                </h2>
                <p className="mt-1 text-sm text-bureau-500">
                  {fmt(cultureLobbyTotal)} actions de lobbying d&eacute;clar&eacute;es au registre HATVP / AGORA
                </p>
              </div>
              <span className="classification-badge hidden sm:inline">AGORA</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Top organisations */}
              <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-3">
                  Principaux repr&eacute;sentants
                </h3>
                <div className="space-y-2">
                  {cultureLobbying.map((l) => (
                    <div key={l.representantNom} className="flex items-center justify-between">
                      <span className="text-xs text-bureau-300 line-clamp-1">{l.representantNom}</span>
                      <span className="text-xs text-amber font-medium">{fmt(l._count.id)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domain breakdown */}
              <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-3">
                  Domaines d&apos;action
                </h3>
                <div className="space-y-2">
                  {cultureDomains.map((d) => (
                    <div key={d.domaine} className="flex items-center justify-between">
                      <span className="text-xs text-bureau-300 line-clamp-1">{d.domaine}</span>
                      <span className="text-xs text-bureau-400">{fmt(d._count.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 4 — Matrice de concentration */}
        <section className="sigint-section section-divider">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Matrice de concentration
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Surface proportionnelle au nombre de titres contrôlés
              </p>
            </div>
            <span className="classification-badge hidden sm:inline">Analyse structurelle</span>
          </div>

          <MediaTreemap groups={treemapData} />

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
            <ConcentrationChart groups={chartData} />
            <div className="space-y-2">
              {TYPE_STAT_CONFIG.map(({ type, label, color }) => (
                <div
                  key={type}
                  className="glass-panel rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-xs text-bureau-300">{label}</span>
                  </div>
                  <span
                    className="text-sm font-bold data-value"
                    style={{ color }}
                  >
                    {typeCounts[type] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 — Votes au Parlement */}
        <section className="section-divider">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins publics liés à la culture, l&apos;audiovisuel et la presse
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 6 — Lobbying audiovisuel et presse */}
        <section className="section-divider">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying audiovisuel et presse
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Actions de lobbying dans les domaines audiovisuel, presse, télécommunications et édition — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={mediaActionCount}
            lobbyCount={mediaLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Domaines audiovisuel / presse / media"
          />
        </section>
      </div>
    </>
  );
}
