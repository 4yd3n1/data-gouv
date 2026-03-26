import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtDate, fmtPct } from "@/lib/format";
import { SignalCard } from "@/components/signaux/signal-card";
import {
  matchRevolvingDoor,
  conflictSeverity,
  lobbySeverity,
  gapSeverity,
  disciplineSeverity,
  SEVERITY_ORDER,
  type SignalSeverity,
  type RevolvingDoorSignal,
  type LobbyConcentrationSignal,
  type MediaNexusSignal,
  type DeclarationGapSignal,
  type PartyDisciplineSignal,
} from "@/lib/signal-types";

export const revalidate = 3600;

export const metadata = {
  title: "Signaux — L'Observatoire Citoyen",
  description:
    "Signaux de transparence : conflits d'intérêts, portes tournantes, concentration du lobbying et anomalies détectés par croisement automatique des données publiques.",
};

/* ================================================================== */
/*  Data fetching                                                      */
/* ================================================================== */

async function getConflicts(showAll: boolean) {
  const rows = await prisma.conflictSignal.findMany({
    where: { voteCount: { gt: 0 } },
    orderBy: [{ participationCount: "desc" }, { voteCount: "desc" }],
    ...(showAll ? {} : { take: 15 }),
  });
  return rows.map((r) => ({
    severity: conflictSeverity(r.totalMontant, r.voteCount),
    nom: r.nom,
    prenom: r.prenom,
    typeMandat: r.typeMandat,
    deputeId: r.deputeId,
    sector: r.secteurDeclaration,
    totalMontant: r.totalMontant,
    participationCount: r.participationCount,
    voteCount: r.voteCount,
    votePour: r.votePour,
    voteContre: r.voteContre,
    voteAbstention: r.voteAbstention,
    tag: r.tag,
  }));
}

async function getRevolvingDoors(): Promise<RevolvingDoorSignal[]> {
  const ministers = await prisma.personnalitePublique.findMany({
    where: {
      mandats: { some: { dateFin: null } },
      carriere: { some: { categorie: "CARRIERE_PRIVEE" } },
    },
    select: {
      slug: true,
      nom: true,
      prenom: true,
      mandats: {
        where: { dateFin: null },
        select: { titreCourt: true, portefeuille: true, ministereCode: true },
        take: 1,
      },
      carriere: {
        where: { categorie: "CARRIERE_PRIVEE" },
        select: { organisation: true, titre: true, dateDebut: true, dateFin: true },
      },
    },
  });

  const signals: RevolvingDoorSignal[] = [];

  for (const m of ministers) {
    const mandat = m.mandats[0];
    if (!mandat?.ministereCode) continue;

    for (const c of m.carriere) {
      if (!c.organisation) continue;
      const keywords = matchRevolvingDoor(mandat.ministereCode, mandat.portefeuille, c.organisation);
      if (keywords.length === 0) continue;

      signals.push({
        severity: keywords.length >= 3 ? "CRITIQUE" : "NOTABLE",
        slug: m.slug,
        nom: m.nom,
        prenom: m.prenom,
        titreCourt: mandat.titreCourt,
        portefeuille: mandat.portefeuille,
        ministereCode: mandat.ministereCode,
        careerOrganisation: c.organisation,
        careerTitre: c.titre,
        careerDateDebut: c.dateDebut,
        careerDateFin: c.dateFin,
        matchedKeywords: keywords,
      });
    }
  }

  return signals.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

async function getLobbyConcentration(showAll: boolean): Promise<LobbyConcentrationSignal[]> {
  const topMinistries = await prisma.actionLobby.groupBy({
    by: ["ministereCode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: showAll ? 20 : 6,
  });

  const signals = await Promise.all(
    topMinistries.map(async (tm) => {
      const code = tm.ministereCode;
      const [topOrgs, topDomaines, minister] = await Promise.all([
        prisma.actionLobby.groupBy({
          by: ["representantNom"],
          where: { ministereCode: code },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.actionLobby.groupBy({
          by: ["domaine"],
          where: { ministereCode: code, domaine: { not: "" } },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 5,
        }),
        prisma.mandatGouvernemental.findFirst({
          where: { ministereCode: code, dateFin: null },
          include: { personnalite: { select: { nom: true, prenom: true, slug: true } } },
        }),
      ]);

      return {
        severity: lobbySeverity(tm._count.id),
        ministereCode: code,
        ministerName: minister
          ? `${minister.personnalite.prenom} ${minister.personnalite.nom}`
          : code,
        ministerSlug: minister?.personnalite.slug ?? "",
        lobbyActionCount: tm._count.id,
        topOrgs: topOrgs.map((o) => ({ nom: o.representantNom, count: o._count.id })),
        topDomaines: topDomaines.map((d) => ({ domaine: d.domaine ?? "", count: d._count.id })),
      } satisfies LobbyConcentrationSignal;
    }),
  );

  return signals;
}

async function getMediaNexus(): Promise<MediaNexusSignal[]> {
  const owners = await prisma.mediaProprietaire.findMany({
    where: { contextePolitique: { not: null } },
    select: {
      nom: true,
      prenom: true,
      contextePolitique: true,
      personnaliteId: true,
      personnalite: { select: { slug: true } },
      participations: {
        select: { groupe: { select: { nomCourt: true } } },
      },
    },
  });

  return owners
    .filter((o): o is typeof o & { contextePolitique: string } => o.contextePolitique !== null)
    .map((o) => ({
      severity: (o.personnaliteId ? "CRITIQUE" : "NOTABLE") as SignalSeverity,
      ownerNom: o.nom,
      ownerPrenom: o.prenom,
      contextePolitique: o.contextePolitique,
      mediaGroups: o.participations.map((p) => ({ nomCourt: p.groupe.nomCourt })),
      personnaliteSlug: o.personnalite?.slug ?? null,
    }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

async function getDeclarationGaps(showAll: boolean): Promise<DeclarationGapSignal[]> {
  const currentMandats = await prisma.mandatGouvernemental.findMany({
    where: { dateFin: null, ministereCode: { not: null } },
    select: {
      ministereCode: true,
      titreCourt: true,
      personnalite: {
        select: {
          nom: true,
          prenom: true,
          slug: true,
          _count: { select: { interets: true } },
        },
      },
    },
  });

  const signals = await Promise.all(
    currentMandats
      .filter((m): m is typeof m & { ministereCode: string } => m.ministereCode !== null)
      .map(async (m) => {
        const lobbyCount = await prisma.actionLobby.count({
          where: { ministereCode: m.ministereCode },
        });
        const interetCount = m.personnalite._count.interets;
        const ratio = lobbyCount / Math.max(interetCount, 1);

        return {
          severity: gapSeverity(ratio),
          nom: m.personnalite.nom,
          prenom: m.personnalite.prenom,
          slug: m.personnalite.slug,
          titreCourt: m.titreCourt,
          ministereCode: m.ministereCode,
          lobbyActionCount: lobbyCount,
          interetCount,
          ratio,
        } satisfies DeclarationGapSignal;
      }),
  );

  return signals
    .filter((s) => s.lobbyActionCount > 0)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, showAll ? 30 : 10);
}

async function getPartyDiscipline(showAll: boolean): Promise<PartyDisciplineSignal[]> {
  // Step 1: final vote scrutin IDs (bounded — ~19 laws currently)
  const finalScrutins = await prisma.scrutinLoi.findMany({
    where: { role: "VOTE_FINAL" },
    select: { scrutinId: true },
  });
  const finalIds = finalScrutins.map((s) => s.scrutinId);
  if (finalIds.length === 0) return [];

  // Step 2: group positions for those scrutins
  const groupeVotes = await prisma.groupeVote.findMany({
    where: { scrutinId: { in: finalIds } },
    select: { scrutinId: true, organeRef: true, positionMajoritaire: true },
  });
  const gpMap = new Map<string, string>();
  for (const gv of groupeVotes) {
    gpMap.set(`${gv.scrutinId}:${gv.organeRef}`, gv.positionMajoritaire);
  }

  // Step 3: individual votes
  const votes = await prisma.voteRecord.findMany({
    where: {
      scrutinId: { in: finalIds },
      groupeOrganeRef: { not: null },
      position: { not: "nonVotant" },
    },
    select: {
      scrutinId: true,
      deputeId: true,
      position: true,
      groupeOrganeRef: true,
      scrutin: { select: { titre: true, dateScrutin: true } },
      depute: { select: { nom: true, prenom: true, groupe: true, groupeAbrev: true } },
    },
  });

  // Step 4: aggregate dissidences per deputy
  const deputyMap = new Map<
    string,
    {
      nom: string;
      prenom: string;
      groupe: string;
      groupeAbrev: string;
      total: number;
      dissidences: number;
      examples: PartyDisciplineSignal["examples"];
    }
  >();

  for (const v of votes) {
    if (!v.groupeOrganeRef || !v.depute) continue;
    const groupePos = gpMap.get(`${v.scrutinId}:${v.groupeOrganeRef}`);
    if (!groupePos) continue;

    let entry = deputyMap.get(v.deputeId);
    if (!entry) {
      entry = {
        nom: v.depute.nom,
        prenom: v.depute.prenom,
        groupe: v.depute.groupe,
        groupeAbrev: v.depute.groupeAbrev,
        total: 0,
        dissidences: 0,
        examples: [],
      };
      deputyMap.set(v.deputeId, entry);
    }

    entry.total++;
    if (v.position !== groupePos) {
      entry.dissidences++;
      if (entry.examples.length < 3) {
        entry.examples.push({
          scrutinId: v.scrutinId,
          titre: v.scrutin.titre,
          deputePosition: v.position,
          groupePosition: groupePos,
          dateScrutin: v.scrutin.dateScrutin,
        });
      }
    }
  }

  return Array.from(deputyMap.entries())
    .filter(([, d]) => d.dissidences > 0 && d.total >= 3)
    .map(([deputeId, d]) => ({
      severity: disciplineSeverity(d.dissidences / d.total),
      deputeId,
      nom: d.nom,
      prenom: d.prenom,
      groupe: d.groupe,
      groupeAbrev: d.groupeAbrev,
      dissidenceCount: d.dissidences,
      totalFinalVotes: d.total,
      dissidenceRate: d.dissidences / d.total,
      examples: d.examples,
    }))
    .sort((a, b) => b.dissidenceRate - a.dissidenceRate)
    .slice(0, showAll ? 50 : 15);
}

/* ================================================================== */
/*  Section header                                                     */
/* ================================================================== */

function SectionHeader({
  title,
  subtitle,
  badge,
  badgeClass,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-bureau-500">{subtitle}</p>
      </div>
      <span className={`${badgeClass} mt-1 hidden shrink-0 sm:inline`}>{badge}</span>
    </div>
  );
}

/* ================================================================== */
/*  Inline helpers                                                     */
/* ================================================================== */

const POS_COLORS: Record<string, string> = {
  pour: "text-teal",
  contre: "text-rose",
  abstention: "text-amber",
};

function PositionBadge({ position }: { position: string }) {
  return (
    <span
      className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${POS_COLORS[position] ?? "text-bureau-400"} border border-current/20 bg-current/5`}
    >
      {position}
    </span>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

const SIGNAL_TYPES = [
  { key: "conflits", label: "Conflits" },
  { key: "portes-tournantes", label: "Portes tournantes" },
  { key: "lobbying", label: "Lobbying" },
  { key: "medias", label: "Médias" },
  { key: "declarations", label: "Déclarations" },
  { key: "dissidences", label: "Dissidences" },
] as const;

const SEVERITY_FILTERS = [
  { key: "CRITIQUE", label: "Critique", color: "text-rose border-rose/30 bg-rose/5" },
  { key: "NOTABLE", label: "Notable", color: "text-amber border-amber/30 bg-amber/5" },
  { key: "INFORMATIF", label: "Informatif", color: "text-teal border-teal/30 bg-teal/5" },
] as const;

function FilterPill({
  href,
  label,
  active,
  className,
}: {
  href: string;
  label: string;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs transition-all ${
        active
          ? className ?? "filter-active"
          : "border-bureau-700/40 bg-bureau-800/40 text-bureau-400 hover:border-bureau-600/50 hover:text-bureau-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function SignauxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filterType = sp.type ?? null;
  const filterSeverity = (sp.severity ?? null) as SignalSeverity | null;

  // When a type filter is active, fetch more items for that type
  const expandConflicts = filterType === "conflits";
  const expandLobbying = filterType === "lobbying";
  const expandGaps = filterType === "declarations";
  const expandDiscipline = filterType === "dissidences";

  const [conflicts, revolvingDoors, lobbying, mediaNexus, gaps, discipline] =
    await Promise.all([
      getConflicts(expandConflicts),
      getRevolvingDoors(),
      getLobbyConcentration(expandLobbying),
      getMediaNexus(),
      getDeclarationGaps(expandGaps),
      getPartyDiscipline(expandDiscipline),
    ]);

  // Per-type counts for filter pills
  const typeCounts: Record<string, number> = {
    conflits: conflicts.length,
    "portes-tournantes": revolvingDoors.length,
    lobbying: lobbying.length,
    medias: mediaNexus.length,
    declarations: gaps.length,
    dissidences: discipline.length,
  };

  // Severity counts (unfiltered)
  const allSeverities = [
    ...conflicts.map((c) => c.severity),
    ...revolvingDoors.map((r) => r.severity),
    ...lobbying.map((l) => l.severity),
    ...mediaNexus.map((m) => m.severity),
    ...gaps.map((g) => g.severity),
    ...discipline.map((d) => d.severity),
  ];
  const critiqueCount = allSeverities.filter((s) => s === "CRITIQUE").length;
  const notableCount = allSeverities.filter((s) => s === "NOTABLE").length;
  const informatifCount = allSeverities.filter((s) => s === "INFORMATIF").length;
  const totalSignals = allSeverities.length;

  // Apply severity filter to each section
  function filterBySeverity<T extends { severity: SignalSeverity }>(items: T[]): T[] {
    if (!filterSeverity) return items;
    return items.filter((i) => i.severity === filterSeverity);
  }

  const fConflicts = filterBySeverity(conflicts);
  const fRevolvingDoors = filterBySeverity(revolvingDoors);
  const fLobbying = filterBySeverity(lobbying);
  const fMediaNexus = filterBySeverity(mediaNexus);
  const fGaps = filterBySeverity(gaps);
  const fDiscipline = filterBySeverity(discipline);

  // Section visibility based on type filter
  const show = {
    conflits: !filterType || filterType === "conflits",
    portes: !filterType || filterType === "portes-tournantes",
    lobbying: !filterType || filterType === "lobbying",
    medias: !filterType || filterType === "medias",
    declarations: !filterType || filterType === "declarations",
    dissidences: !filterType || filterType === "dissidences",
  };

  // Build filter URL helper
  function filterUrl(param: string, value: string | null): string {
    const params = new URLSearchParams();
    if (param === "type") {
      if (value) params.set("type", value);
      if (filterSeverity) params.set("severity", filterSeverity);
    } else {
      if (filterType) params.set("type", filterType);
      if (value) params.set("severity", value);
    }
    const qs = params.toString();
    return qs ? `/signaux?${qs}` : "/signaux";
  }

  return (
    <>
      {/* ── Hero ── */}
      <section className="sigint-rose grid-bg relative overflow-hidden border-b border-bureau-700/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="fade-up mb-3">
            <span className="inline-block rounded-full border border-rose/20 bg-rose/5 px-3 py-0.5 text-xs uppercase tracking-widest text-rose">
              SIGINT // Signaux de transparence
            </span>
          </div>
          <h1 className="fade-up delay-1 font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
            Signaux d&apos;<span className="italic text-rose">alerte</span>
          </h1>
          <p className="fade-up delay-2 mt-3 max-w-2xl text-bureau-400">
            Croisement automatique des déclarations d&apos;intérêts, votes parlementaires,
            lobbying déclaré, carrières et patrimoine médiatique. Chaque signal est
            un lien mesurable entre deux jeux de données publiques.
          </p>
        </div>
      </section>

      {/* ── Live metrics bar ── */}
      <section className="border-b border-bureau-700/20 bg-bureau-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-bureau-500">
              {fmt(totalSignals)} signaux actifs
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-bureau-500">
            <span className="text-rose">{critiqueCount} critique{critiqueCount > 1 ? "s" : ""}</span>
            <span className="text-bureau-700">|</span>
            <span className="text-amber">{notableCount} notable{notableCount > 1 ? "s" : ""}</span>
            <span className="text-bureau-700">|</span>
            <span className="text-teal">{informatifCount} informatif{informatifCount > 1 ? "s" : ""}</span>
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <section className="border-b border-bureau-700/20 bg-bureau-900/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
          <span className="text-[10px] uppercase tracking-[0.15em] text-bureau-600 mr-2">Filtrer</span>
          <FilterPill
            href={filterUrl("type", null)}
            label="Tous"
            active={!filterType}
          />
          {SIGNAL_TYPES.map((t) => (
            <FilterPill
              key={t.key}
              href={filterUrl("type", filterType === t.key ? null : t.key)}
              label={`${t.label} (${typeCounts[t.key] ?? 0})`}
              active={filterType === t.key}
            />
          ))}
          <span className="mx-2 h-4 w-px bg-bureau-700/30" />
          {SEVERITY_FILTERS.map((s) => (
            <FilterPill
              key={s.key}
              href={filterUrl("severity", filterSeverity === s.key ? null : s.key)}
              label={s.label}
              active={filterSeverity === s.key}
              className={`border ${s.color}`}
            />
          ))}
        </div>
      </section>

      {/* ── Sections ── */}
      <div className="mx-auto max-w-7xl space-y-16 px-6 py-12">
        {/* ── 1. Conflits d'interets ── */}
        {show.conflits && fConflicts.length > 0 && (
          <section>
            <SectionHeader
              title="Conflits d'interets"
              subtitle="Elus declarant des participations financieres dans des secteurs sur lesquels ils votent"
              badge="Declarations x Votes"
              badgeClass="severity-critique"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fConflicts.map((c) => (
                <SignalCard key={`${c.nom}-${c.sector}-${c.tag}`} severity={c.severity}>
                  <Link
                    href={
                      c.deputeId
                        ? `/representants/deputes/${c.deputeId}?tab=transparence`
                        : `/representants`
                    }
                    className="group block"
                  >
                    <p className="text-sm font-medium text-bureau-100 group-hover:text-teal">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-bureau-500">
                      {c.typeMandat} · {c.tag}
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="stat-number-rose text-xl font-bold">
                        {c.participationCount}
                      </span>
                      <span className="text-xs text-bureau-500">
                        participation{c.participationCount > 1 ? "s" : ""} dans{" "}
                        <span className="text-bureau-300">{c.sector}</span>
                      </span>
                    </div>
                    {c.totalMontant != null && c.totalMontant > 0 && (
                      <p className="mt-1 text-xs text-bureau-500">
                        Montant declare : <span className="text-bureau-300">{fmtEuro(c.totalMontant)}</span>
                      </p>
                    )}
                    <p className="mt-2 text-xs text-bureau-500">
                      {c.voteCount} vote{c.voteCount > 1 ? "s" : ""} sur ce sujet
                      <span className="ml-1 text-bureau-600">
                        ({c.votePour} pour · {c.voteContre} contre)
                      </span>
                    </p>
                  </Link>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── 2. Portes tournantes ── */}
        {show.portes && fRevolvingDoors.length > 0 && (
          <section>
            <SectionHeader
              title="Portes tournantes"
              subtitle="Membres du gouvernement dont la carriere privee recoupe le portefeuille ministeriel actuel"
              badge="Carriere x Portefeuille"
              badgeClass="severity-notable"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fRevolvingDoors.map((r) => (
                <SignalCard key={`${r.slug}-${r.careerOrganisation}`} severity={r.severity}>
                  <Link href={`/gouvernement/${r.slug}?tab=parcours`} className="group block">
                    <p className="text-sm font-medium text-bureau-100 group-hover:text-teal">
                      {r.prenom} {r.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-bureau-500">{r.titreCourt}</p>
                    <div className="mt-3 rounded-lg border border-bureau-700/20 bg-bureau-900/40 p-3">
                      <p className="text-xs text-bureau-500">Carriere privee</p>
                      <p className="mt-0.5 text-sm text-bureau-300">
                        {r.careerTitre}{r.careerOrganisation ? ` — ${r.careerOrganisation}` : ""}
                      </p>
                      {(r.careerDateDebut || r.careerDateFin) && (
                        <p className="mt-0.5 text-[10px] text-bureau-600">
                          {r.careerDateDebut ? fmtDate(r.careerDateDebut) : "?"} →{" "}
                          {r.careerDateFin ? fmtDate(r.careerDateFin) : "en cours"}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-sm border border-amber/20 bg-amber/5 px-1.5 py-0.5 text-[10px] text-amber"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </Link>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. Concentration du lobbying ── */}
        {show.lobbying && fLobbying.length > 0 && (
          <section>
            <SectionHeader
              title="Concentration du lobbying"
              subtitle="Ministeres les plus cibles par les representants d'interets declares"
              badge="AGORA x Gouvernement"
              badgeClass="severity-notable"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fLobbying.map((l) => (
                <SignalCard key={l.ministereCode} severity={l.severity}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-bureau-500">
                      {l.ministereCode.replace(/_/g, " ")}
                    </p>
                    <p className="stat-number-amber mt-1 text-2xl font-bold">
                      {fmt(l.lobbyActionCount)}
                    </p>
                    <p className="text-xs text-bureau-500">actions de lobbying declarees</p>
                    {l.ministerSlug && (
                      <Link
                        href={`/gouvernement/${l.ministerSlug}?tab=mandats`}
                        className="mt-2 inline-block text-xs text-teal hover:underline"
                      >
                        {l.ministerName} →
                      </Link>
                    )}
                    {l.topOrgs.length > 0 && (
                      <div className="mt-3 border-t border-bureau-700/20 pt-3">
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-bureau-600">
                          Principaux representants
                        </p>
                        {l.topOrgs.map((o) => (
                          <div key={o.nom} className="flex items-baseline justify-between py-0.5">
                            <span className="truncate text-xs text-bureau-300">{o.nom}</span>
                            <span className="ml-2 shrink-0 text-xs text-bureau-500">
                              {fmt(o.count)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Nexus medias-politique ── */}
        {show.medias && fMediaNexus.length > 0 && (
          <section>
            <SectionHeader
              title="Nexus medias-politique"
              subtitle="Proprietaires de groupes mediatiques ayant des connexions politiques documentees"
              badge="Medias x Gouvernance"
              badgeClass="severity-critique"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fMediaNexus.map((m) => (
                <SignalCard
                  key={m.ownerNom}
                  severity={m.severity}
                  label={m.personnaliteSlug ? "Lien gouvernemental" : undefined}
                >
                  <Link href="/dossiers/medias" className="group block">
                    <p className="text-sm font-medium text-bureau-100 group-hover:text-teal">
                      {m.ownerPrenom ? `${m.ownerPrenom} ` : ""}{m.ownerNom}
                    </p>
                    <p className="mt-2 text-xs italic leading-relaxed text-bureau-400">
                      &laquo; {m.contextePolitique} &raquo;
                    </p>
                    {m.mediaGroups.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {m.mediaGroups.map((g) => (
                          <span
                            key={g.nomCourt}
                            className="rounded-sm border border-bureau-700/30 bg-bureau-800/40 px-1.5 py-0.5 text-[10px] text-bureau-300"
                          >
                            {g.nomCourt}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Ecarts de declaration ── */}
        {show.declarations && fGaps.length > 0 && (
          <section>
            <SectionHeader
              title="Ecarts de declaration"
              subtitle="Ministres exposés au lobbying mais faiblement documentés par les déclarations HATVP"
              badge="Lobbying x HATVP"
              badgeClass="severity-notable"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fGaps.map((g) => (
                <SignalCard key={g.slug} severity={g.severity}>
                  <Link href={`/gouvernement/${g.slug}?tab=declarations`} className="group block">
                    <p className="text-sm font-medium text-bureau-100 group-hover:text-teal">
                      {g.prenom} {g.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-bureau-500">{g.titreCourt}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="stat-number-amber text-xl font-bold">
                          {fmt(g.lobbyActionCount)}
                        </p>
                        <p className="text-[10px] text-bureau-500">actions lobby</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-bureau-300">
                          {fmt(g.interetCount)}
                        </p>
                        <p className="text-[10px] text-bureau-500">interets declares</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-bureau-600">
                      Ratio : {fmt(Math.round(g.ratio))}:1
                    </p>
                  </Link>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── 6. Dissidences partisanes ── */}
        {show.dissidences && fDiscipline.length > 0 && (
          <section>
            <SectionHeader
              title="Dissidences partisanes"
              subtitle="Deputes votant le plus souvent contre la position majoritaire de leur groupe sur les votes finaux de lois"
              badge="Votes x Groupes"
              badgeClass="severity-informatif"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fDiscipline.map((d) => (
                <SignalCard key={d.deputeId} severity={d.severity}>
                  <Link
                    href={`/representants/deputes/${d.deputeId}?tab=activite`}
                    className="group block"
                  >
                    <p className="text-sm font-medium text-bureau-100 group-hover:text-teal">
                      {d.prenom} {d.nom}
                    </p>
                    <p className="mt-0.5 text-xs text-bureau-500">
                      {d.groupe} ({d.groupeAbrev})
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="stat-number-teal text-xl font-bold">
                        {fmtPct(d.dissidenceRate * 100)}
                      </span>
                      <span className="text-xs text-bureau-500">
                        de dissidence ({d.dissidenceCount}/{d.totalFinalVotes})
                      </span>
                    </div>
                    {d.examples.length > 0 && (
                      <div className="mt-3 space-y-1.5 border-t border-bureau-700/20 pt-3">
                        {d.examples.map((ex) => (
                          <div key={ex.scrutinId} className="flex items-start gap-2">
                            <PositionBadge position={ex.deputePosition} />
                            <span className="text-[11px] leading-tight text-bureau-400">
                              {ex.titre.length > 70 ? `${ex.titre.slice(0, 70)}...` : ex.titre}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                </SignalCard>
              ))}
            </div>
          </section>
        )}

        {/* ── Deep-dive enquêtes ── */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dossiers/medias"
            className="dossier-card group rounded-xl p-6 transition-all"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-rose">Enquête</span>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 group-hover:text-teal transition-colors">
              Concentration des médias
            </h3>
            <p className="mt-1 text-sm text-bureau-500">
              9 milliardaires, 72 titres — propriété, influence et connexions politiques des grands groupes médiatiques
            </p>
          </Link>
          <Link
            href="/dossiers/financement-politique"
            className="dossier-card group rounded-xl p-6 transition-all"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber">Enquête</span>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 group-hover:text-teal transition-colors">
              Financement politique
            </h3>
            <p className="mt-1 text-sm text-bureau-500">
              66 M€ d&apos;aide publique, dons privés et coût électoral — les comptes des partis passés au crible
            </p>
          </Link>
        </section>

        {/* ── Methodology note ── */}
        <section className="border-t border-bureau-700/20 pt-8">
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-bureau-600">
            Les signaux sont generes automatiquement par croisement de donnees publiques
            (HATVP, Assemblee nationale, Senat, registre AGORA, ARCOM). Un signal ne constitue
            pas une accusation : il identifie une correlation mesurable entre deux jeux de donnees.
            Donnees mises a jour quotidiennement. Derniere analyse : {fmtDate(new Date())}.
          </p>
        </section>
      </div>
    </>
  );
}
