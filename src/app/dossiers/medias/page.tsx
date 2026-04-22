import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { fmt, fmtDate, fmtEuro } from "@/lib/format";
import { DossierNav } from "@/components/dossier-nav";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { MediaBoard } from "@/components/media-board";
import { ConcentrationChart } from "@/components/concentration-chart";
import { PowerMap } from "@/components/power-map";
import { MediaTreemap } from "@/components/media-treemap";
import { ArcomSection } from "@/components/arcom-section";
import { SrcChip } from "@/components/investigative/src-chip";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { BarRows } from "@/components/investigative/bar-rows";

// Shared section header — matches Variant A register (eyebrow + .hd title + serif subtitle)
function SectionHeader({
  kicker,
  figNumber,
  title,
  subtitle,
  meta,
}: {
  kicker: string;
  figNumber?: string;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div
      className="mb-6"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Eyebrow tone="red" size="sm">◆ {kicker}</Eyebrow>
          {figNumber && (
            <>
              <span
                className="obs-mono"
                style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
                aria-hidden
              >
                //
              </span>
              <Eyebrow>{figNumber}</Eyebrow>
            </>
          )}
        </div>
        <h2
          className="hd"
          style={{
            fontSize: "clamp(24px, 2.4vw, 32px)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            margin: 0,
            color: "var(--color-fg)",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="obs-serif"
            style={{
              marginTop: 10,
              color: "var(--color-fg-mute)",
              fontSize: 14.5,
              lineHeight: 1.55,
              margin: "10px 0 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {meta}
    </div>
  );
}

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
  const govLinkedCount = politicalOwners.length;

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

  const totalSignalements = signalements.length;
  const topArcomAmende = Math.max(...signalements.map((s) => s.montant ?? 0), 0);

  return (
    <>
      {/* Dossier hero — investigative register, Variant A */}
      <section
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--color-ink-0)",
        }}
      >
        <div
          className="mx-auto max-w-7xl px-6"
          style={{ paddingTop: 40, paddingBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Eyebrow tone="red" size="sm">◆ Dossier · Médias</Eyebrow>
            <span
              className="obs-mono"
              style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
              aria-hidden
            >
              //
            </span>
            <Eyebrow>Mise à jour {fmtDate(new Date())}</Eyebrow>
          </div>

          <h1
            className="hd"
            style={{
              fontSize: "clamp(36px, 4.1vw, 56px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: 960,
              fontWeight: 400,
            }}
          >
            Concentration des médias : <em>neuf milliardaires,</em> 80 % du paysage.
          </h1>

          <p
            className="obs-serif"
            style={{
              marginTop: 18,
              maxWidth: 720,
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--color-fg)",
            }}
          >
            Cartographie des dix groupes dominants, leurs propriétaires, leurs filiales et les
            liens avec l&apos;État. Données ARCOM croisées avec HATVP (déclarations d&apos;intérêts)
            et AGORA (lobbying déclaré).
          </p>

          <div style={{ marginTop: 22, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SrcChip items={["ARCOM", "HATVP", "AGORA", "Cour des comptes"]} />
          </div>

          {/* Hero stat strip */}
          <div
            className="medias-hero-stats"
            style={{
              marginTop: 32,
              display: "grid",
              gap: 1,
              background: "var(--line)",
              border: "1px solid var(--line)",
            }}
          >
            {[
              {
                v: String(groupesRaw.length),
                label: "Groupes cartographiés",
                sub: "Privés + service public",
              },
              {
                v: fmt(filialeCount),
                label: "Titres recensés",
                sub: "TV · Radio · Presse · Numérique",
              },
              {
                v: `${govLinkedCount}`,
                label: "Liens politiques déclarés",
                sub: "Propriétaires concernés",
              },
              {
                v: totalSignalements > 0 ? String(totalSignalements) : "—",
                label: "Signalements ARCOM",
                sub:
                  topArcomAmende > 0
                    ? `Plus forte amende : ${fmtEuro(topArcomAmende)}`
                    : "Mises en demeure et sanctions",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-ink-1)",
                  padding: "18px 20px",
                }}
              >
                <div
                  className="obs-serif"
                  style={{
                    fontSize: 30,
                    lineHeight: 1,
                    color: "var(--color-fg)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {s.v}
                </div>
                <div
                  className="obs-mono"
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "var(--color-fg-mute)",
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: "var(--color-fg-dim)",
                    lineHeight: 1.4,
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DossierNav currentSlug="medias" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">

        {/* Section 2 — Power Map */}
        <section id="cartographie" style={{ scrollMarginTop: 80 }}>
          {(() => {
            const ranked = [...powerMapData].sort((a, b) => b.filialeCount - a.filialeCount);
            const top3 = ranked.slice(0, 3).reduce((s, g) => s + g.filialeCount, 0);
            const top3Pct = filialeCount > 0 ? Math.round((top3 / filialeCount) * 100) : 0;
            const hhi = ranked.reduce((s, g) => {
              const share = filialeCount > 0 ? (g.filialeCount / filialeCount) * 100 : 0;
              return s + share * share;
            }, 0);
            const govLinked = ranked.filter((g) => g.hasGovLink).length;
            const flagged = ranked.filter((g) => g.signalementCount > 3).length;
            const TYPE_LEGEND: Array<{ code: string; label: string; color: string }> = [
              { code: "TELEVISION", label: "Télévision", color: "#60a5fa" },
              { code: "RADIO", label: "Radio", color: "#fbbf24" },
              { code: "PRESSE_QUOTIDIENNE", label: "Presse quotidienne", color: "#2dd4bf" },
              { code: "PRESSE_MAGAZINE", label: "Presse magazine", color: "#0d9488" },
              { code: "NUMERIQUE", label: "Numérique", color: "#fb7185" },
              { code: "AGENCE", label: "Agence", color: "#94a3b8" },
            ];

            return (
              <>
                {/* Header */}
                <div
                  className="mb-6"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 24,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ maxWidth: 640 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: "var(--fs-mono-xs)",
                          color: "var(--color-signal)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        Analyse structurelle
                      </span>
                      <span
                        className="obs-mono"
                        style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
                        aria-hidden
                      >
                        //
                      </span>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: "var(--fs-mono-xs)",
                          color: "var(--color-fg-mute)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        Fig. 1 · {groupesRaw.length} groupes
                      </span>
                    </div>
                    <h2
                      className="hd"
                      style={{
                        fontSize: "clamp(26px, 2.6vw, 36px)",
                        lineHeight: 1.1,
                        letterSpacing: "-0.015em",
                        margin: 0,
                        color: "var(--color-fg)",
                      }}
                    >
                      Cartographie du pouvoir médiatique
                    </h2>
                    <p
                      className="obs-serif"
                      style={{
                        marginTop: 10,
                        color: "var(--color-fg-mute)",
                        fontSize: 15,
                        lineHeight: 1.55,
                      }}
                    >
                      Chaque nœud représente un groupe. Taille proportionnelle au nombre de médias
                      contrôlés. Tirets = aucun lien gouvernemental déclaré ; ligne pleine = lien
                      identifié via HATVP ou AGORA.
                    </p>
                  </div>

                  {/* Concentration metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 12,
                      minWidth: 280,
                    }}
                  >
                    {[
                      {
                        k: "Top 3 contrôlent",
                        v: `${top3Pct} %`,
                        sub: `${top3}/${filialeCount} médias`,
                      },
                      {
                        k: "Indice HHI",
                        v: Math.round(hhi).toLocaleString("fr-FR"),
                        sub: hhi > 1500 ? "Très concentré" : hhi > 1000 ? "Concentré" : "Modéré",
                      },
                      {
                        k: "Liens politiques",
                        v: `${govLinked}/${groupesRaw.length}`,
                        sub: "groupes concernés",
                      },
                      {
                        k: "Signalements ARCOM",
                        v: String(flagged),
                        sub: "groupes à +3 alertes",
                      },
                    ].map((m) => (
                      <div
                        key={m.k}
                        style={{
                          border: "1px solid var(--line)",
                          background: "var(--color-ink-1)",
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          className="obs-mono"
                          style={{
                            fontSize: 9.5,
                            color: "var(--color-fg-dim)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          {m.k}
                        </div>
                        <div
                          className="obs-serif"
                          style={{
                            fontSize: 22,
                            color: "var(--color-fg)",
                            fontVariantNumeric: "tabular-nums",
                            marginTop: 3,
                            lineHeight: 1.1,
                          }}
                        >
                          {m.v}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-fg-mute)",
                            marginTop: 3,
                          }}
                        >
                          {m.sub}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Viz + side panel */}
                <div
                  className="powermap-layout"
                  style={{
                    display: "grid",
                    gap: 20,
                    gridTemplateColumns: "1fr",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--color-ink-1)",
                      padding: 12,
                    }}
                  >
                    <PowerMap groups={powerMapData} />
                  </div>

                  <aside
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--color-ink-1)",
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: "var(--fs-mono-xs)",
                          color: "var(--color-fg-mute)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        Classement
                      </span>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: "var(--fs-mono-xs)",
                          color: "var(--color-fg-dim)",
                        }}
                      >
                        par médias contrôlés
                      </span>
                    </div>
                    <hr className="hair" />
                    <ol
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                      }}
                    >
                      {ranked.map((g, i) => {
                        const typeColor =
                          TYPE_LEGEND.find((t) => t.code === g.dominantType)?.color ?? "#94a3b8";
                        const pct =
                          filialeCount > 0
                            ? Math.round((g.filialeCount / filialeCount) * 100)
                            : 0;
                        return (
                          <li
                            key={g.slug}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "18px 1fr auto",
                              gap: 10,
                              alignItems: "center",
                              fontSize: 13,
                            }}
                          >
                            <span
                              className="obs-mono"
                              style={{
                                fontSize: 10,
                                color: "var(--color-fg-dim)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                minWidth: 0,
                              }}
                            >
                              <span
                                aria-hidden
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: typeColor,
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  color: "var(--color-fg)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.nomCourt}
                              </span>
                              {g.hasGovLink && (
                                <span
                                  aria-label="Lien politique"
                                  title="Lien politique déclaré"
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: "var(--color-warn)",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              {g.signalementCount > 3 && (
                                <span
                                  aria-label="Signalements ARCOM"
                                  title={`${g.signalementCount} signalements ARCOM`}
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: "50%",
                                    background: "var(--color-signal)",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </span>
                            <span
                              className="obs-mono"
                              style={{
                                fontSize: 11,
                                color: "var(--color-fg-mute)",
                                fontVariantNumeric: "tabular-nums",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {g.filialeCount} · {pct}%
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </aside>
                </div>

                {/* Legend */}
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    paddingTop: 14,
                    borderTop: "1px solid var(--line)",
                    fontSize: 11,
                    color: "var(--color-fg-mute)",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="obs-mono"
                    style={{
                      fontSize: 9.5,
                      color: "var(--color-fg-dim)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    Secteur dominant
                  </span>
                  {TYPE_LEGEND.map((t) => (
                    <span key={t.code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        aria-hidden
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: t.color,
                        }}
                      />
                      {t.label}
                    </span>
                  ))}
                  <span style={{ flex: 1 }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 1,
                        background: "var(--color-fg-mute)",
                      }}
                    />
                    Lien gouv. déclaré
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 14,
                        height: 0,
                        borderTop: "1px dashed var(--color-fg-mute)",
                      }}
                    />
                    Aucun lien
                  </span>
                </div>
              </>
            );
          })()}
        </section>

        {/* Section 3 — Dossier Grid (Intelligence Board) */}
        <section>
          <SectionHeader
            kicker="Dossiers propriétaires"
            figNumber={`Fig. 2 · ${groupesRaw.length} groupes`}
            title="Propriétaires, fortunes, filiales"
            subtitle={
              <>
                {groupesRaw.length} groupes, leurs propriétaires et {fmt(filialeCount)} médias
                recensés. Cliquez pour déplier la composition, les participations et le contrôle
                exercé.
              </>
            }
          />
          <Suspense
            fallback={
              <div
                style={{
                  height: 400,
                  border: "1px solid var(--line)",
                  background: "var(--color-ink-1)",
                }}
              />
            }
          >
            <MediaBoard groups={boardData} />
          </Suspense>
        </section>

        {/* Section 3.5 — Signalements ARCOM */}
        {signalements.length > 0 && (
          <section>
            <SectionHeader
              kicker="Signalements ARCOM"
              figNumber={`Fig. 3 · ${signalements.length} décisions`}
              title="Régulation audiovisuelle"
              subtitle="Mises en demeure, sanctions et amendes prononcées par l'Autorité de régulation de la communication audiovisuelle et numérique."
              meta={<SrcChip items={["ARCOM · décisions publiées"]} />}
            />
            <ArcomSection
              signalements={arcomSectionData}
              totalAmendes={totalAmendes}
              channelCount={arcomChannels.size}
            />
          </section>
        )}

        {/* Section — Connexions politiques */}
        {politicalOwners.length > 0 && (
          <section>
            <SectionHeader
              kicker="Connexions politiques"
              figNumber={`Fig. 4 · ${politicalOwners.length} propriétaires`}
              title="Liens avec le pouvoir politique"
              subtitle="Propriétaires de médias dont les contacts avec l'exécutif, les partis ou les cabinets ministériels ont été documentés par la presse institutionnelle ou les déclarations HATVP."
            />
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
            >
              {politicalOwners.map((o) => {
                const groupNames = [...new Set(o.participations.map((p) => p.groupe.nomCourt))].join(", ");
                return (
                  <article
                    key={o.slug}
                    style={{
                      border: "1px solid var(--line)",
                      background: "var(--color-ink-1)",
                      padding: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        className="obs-serif"
                        style={{
                          fontSize: 17,
                          color: "var(--color-fg)",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.2,
                        }}
                      >
                        {o.prenom} {o.nom}
                      </span>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-warn)",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                        }}
                      >
                        {groupNames}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-fg-mute)",
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {o.contextePolitique}
                    </p>
                    {o.sourceContextePolitique && (
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-fg-dim)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Source · {o.sourceContextePolitique}
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Section — Lobbying Culture */}
        {cultureLobbyTotal > 0 && (
          <section>
            <SectionHeader
              kicker="Lobbying · Ministère de la Culture"
              figNumber={`Fig. 5 · ${fmt(cultureLobbyTotal)} actions`}
              title="Pressions déclarées sur la Culture"
              subtitle={
                <>
                  {fmt(cultureLobbyTotal)} actions de lobbying déclarées au registre AGORA visant le
                  ministère de la Culture et les administrations liées à l&apos;audiovisuel. Classement
                  par représentant d&apos;intérêts et par domaine d&apos;action.
                </>
              }
              meta={<SrcChip items={["AGORA · registre HATVP"]} />}
            />
            <div
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "1fr",
              }}
              className="lobby-culture-grid"
            >
              <div
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--color-ink-1)",
                  padding: 18,
                }}
              >
                <div
                  className="obs-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "var(--color-fg-mute)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Top 5 représentants d&apos;intérêts
                </div>
                <BarRows
                  items={cultureLobbying.map((l) => ({
                    label: l.representantNom,
                    value: l._count.id,
                    display: fmt(l._count.id),
                  }))}
                  labelWidth={220}
                />
              </div>

              <div
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--color-ink-1)",
                  padding: 18,
                }}
              >
                <div
                  className="obs-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "var(--color-fg-mute)",
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Domaines d&apos;action
                </div>
                <BarRows
                  items={cultureDomains.map((d) => ({
                    label: d.domaine ?? "—",
                    value: d._count.id,
                    display: fmt(d._count.id),
                    color: "var(--color-warn)",
                  }))}
                  labelWidth={220}
                />
              </div>
            </div>
          </section>
        )}

        {/* Section 4 — Matrice de concentration */}
        <section>
          <SectionHeader
            kicker="Matrice de concentration"
            figNumber="Fig. 6"
            title="Surface du paysage médiatique"
            subtitle="Chaque surface est proportionnelle au nombre de titres contrôlés. Les types dominants (TV, radio, presse) composent la diversité apparente."
          />
          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              padding: 14,
            }}
          >
            <MediaTreemap groups={treemapData} />
          </div>
          <div
            className="mt-6 grid gap-4"
            style={{ gridTemplateColumns: "minmax(0, 1fr) 280px" }}
          >
            <ConcentrationChart groups={chartData} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TYPE_STAT_CONFIG.map(({ type, label, color }) => (
                <div
                  key={type}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--color-ink-1)",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      aria-hidden
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                      }}
                    />
                    <span style={{ fontSize: 12.5, color: "var(--color-fg)" }}>{label}</span>
                  </div>
                  <span
                    className="obs-mono"
                    style={{
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                      color,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {typeCounts[type] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 — Votes au Parlement */}
        <section>
          <SectionHeader
            kicker="Votes au Parlement"
            figNumber={`Fig. 7 · ${scrutinsForList.length} scrutins`}
            title="Quand le Parlement légifère sur l'audiovisuel"
            subtitle="Scrutins publics tagués par sujet — culture, audiovisuel, presse. Position de chaque groupe politique et résultat final."
          />
          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 6 — Lobbying audiovisuel et presse */}
        <section>
          <SectionHeader
            kicker="Lobbying audiovisuel et presse"
            figNumber="Fig. 8"
            title="Représentants d'intérêts du secteur"
            subtitle="Actions HATVP dans les domaines audiovisuel, presse, télécommunications et édition. Nombre d'actions déclarées, nombre de représentants actifs, principaux lobbyistes."
          />

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
