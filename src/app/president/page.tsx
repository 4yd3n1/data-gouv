import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { fmtDate, fmtEuro, fmt } from "@/lib/format";
import { ProfileHero } from "@/components/profile-hero";
import { ProfileTabs } from "@/components/profile-tabs";
import { IndicatorCard } from "@/components/indicator-card";
import { TimelineChart } from "@/components/timeline-chart";
import { DeclarationSection } from "@/components/declaration-section";
import { ConflictAlert } from "@/components/conflict-alert";
import {
  BIO,
  PROMESSES,
  getPromesseSummary,
  STATUS_CONFIG,
  type Promesse,
} from "@/data/president-macron";
import {
  POWER_LOBBYISTS,
  CONSULTING_LOBBYISTS,
  MUTUALITE_SIRENS,
  ALL_CURATED_SIRENS,
  TYPE_CONFIG,
} from "@/data/lobbyists-curated";
import {
  getBaselineObservation,
  computeDelta,
  ELECTION_DATES,
} from "@/lib/president-utils";

export const metadata: Metadata = {
  title: "Emmanuel Macron — Président de la République · L'Observatoire Citoyen",
  description:
    "Profil de transparence d'Emmanuel Macron : promesses électorales 2017 et 2022 comparées aux données INSEE, bilan économique, lobbying pendant son mandat, et déclarations HATVP.",
};

// ─── Domain → ScrutinTag mapping ─────────────────────────────────────────────

const LOBBY_DOMAIN_KEYWORDS: Array<{ keywords: string[]; tag: string; label: string }> = [
  { keywords: ["santé", "sante", "pharma", "médic"], tag: "sante", label: "Santé" },
  { keywords: ["énergi", "energi", "environnement", "climat", "écolog", "ecolog"], tag: "ecologie", label: "Écologie & Énergie" },
  { keywords: ["fiscal", "taxe", "impôt", "impot", "tva", "csg"], tag: "fiscalite", label: "Fiscalité" },
  { keywords: ["budget", "finance", "dette", "dépenses", "depenses"], tag: "budget", label: "Budget & Finances" },
  { keywords: ["travail", "emploi", "social", "salaire", "formation"], tag: "travail", label: "Emploi & Travail" },
  { keywords: ["logement", "habitat", "immobil", "hlm", "construct"], tag: "logement", label: "Logement" },
  { keywords: ["agriculture", "agri", "alimentair", "rural", "pac"], tag: "agriculture", label: "Agriculture" },
  { keywords: ["sécurité", "securite", "justice", "pénal"], tag: "securite", label: "Sécurité & Justice" },
  { keywords: ["retraite", "pension"], tag: "retraites", label: "Retraites" },
  { keywords: ["éducation", "education", "enseignement", "école", "univer"], tag: "education", label: "Éducation" },
];

function matchDomainToTag(domaine: string): { tag: string; label: string } | null {
  const lower = domaine.toLowerCase();
  for (const m of LOBBY_DOMAIN_KEYWORDS) {
    if (m.keywords.some((kw) => lower.includes(kw))) {
      return { tag: m.tag, label: m.label };
    }
  }
  return null;
}

// ─── Tag labels ───────────────────────────────────────────────────────────────

const TAG_LABELS: Record<string, string> = {
  budget: "Budget & Finances",
  fiscalite: "Fiscalité",
  sante: "Santé",
  logement: "Logement",
  retraites: "Retraites",
  education: "Éducation",
  securite: "Sécurité & Justice",
  immigration: "Immigration",
  ecologie: "Écologie",
  travail: "Emploi & Travail",
  defense: "Défense",
  agriculture: "Agriculture",
  culture: "Culture",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PresidentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; election?: string }>;
}) {
  const { tab = "promesses", election = "2022" } = await searchParams;
  const electionYear = election === "2017" ? 2017 : 2022;

  // ── Parallel data fetch ──
  const [declarations, indicators, lobbyDomains, curatedActionGroups, scrutinTagCounts] =
    await Promise.all([
      // HATVP declarations (Macron has entries under several mandates)
      prisma.declarationInteret.findMany({
        where: {
          OR: [
            { nom: { contains: "Macron", mode: "insensitive" } },
            { nom: { contains: "MACRON", mode: "insensitive" } },
          ],
        },
        include: { participations: true, revenus: true },
        orderBy: { dateDepot: "desc" },
      }),

      // Economic indicators with full observation history (ascending for timelines)
      prisma.indicateur.findMany({
        where: {
          code: {
            in: [
              "PIB_ANNUEL",
              "CHOMAGE_TAUX_TRIM",
              "IPC_MENSUEL",
              "DETTE_PIB",
              "SMIC_HORAIRE",
              "LOGEMENTS_COMMENCES",
            ],
          },
        },
        include: {
          observations: { orderBy: { periodeDebut: "asc" } },
        },
      }),

      // Top lobbying domains
      prisma.actionLobbyiste.groupBy({
        by: ["domaine"],
        _count: { id: true },
        where: { domaine: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 15,
      }),

      // Action counts for curated lobbyists only
      prisma.actionLobbyiste.groupBy({
        by: ["lobbyisteId"],
        _count: { id: true },
        where: { lobbyisteId: { in: ALL_CURATED_SIRENS } },
      }),

      // ScrutinTag counts (votes per topic)
      prisma.scrutinTag.groupBy({
        by: ["tag"],
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
      }),
    ]);

  // ── Derived data ──

  const indMap = new Map(indicators.map((i) => [i.code, i]));

  // Baseline date for elected tab
  const baselineDate = ELECTION_DATES[electionYear];

  // Unemployment indicators
  const indChomage = indMap.get("CHOMAGE_TAUX_TRIM");
  const chomageObs = indChomage?.observations ?? [];
  const chomageBaseline = getBaselineObservation(chomageObs, baselineDate);
  const chomageLatest = chomageObs[chomageObs.length - 1] ?? null;
  const chomageDelta =
    chomageBaseline && chomageLatest
      ? computeDelta(chomageBaseline.valeur, chomageLatest.valeur)
      : null;

  // GDP
  const indPib = indMap.get("PIB_ANNUEL");
  const pibObs = indPib?.observations ?? [];
  const pibBaseline = getBaselineObservation(pibObs, baselineDate);
  const pibLatest = pibObs[pibObs.length - 1] ?? null;
  const pibDelta =
    pibBaseline && pibLatest
      ? computeDelta(pibBaseline.valeur, pibLatest.valeur, 0)
      : null;

  // Debt/GDP
  const indDette = indMap.get("DETTE_PIB");
  const detteObs = indDette?.observations ?? [];
  const detteBaseline = getBaselineObservation(detteObs, baselineDate);
  const detteLatest = detteObs[detteObs.length - 1] ?? null;
  const detteDelta =
    detteBaseline && detteLatest
      ? computeDelta(detteBaseline.valeur, detteLatest.valeur)
      : null;

  // SMIC
  const indSmic = indMap.get("SMIC_HORAIRE");
  const smicObs = indSmic?.observations ?? [];
  const smicBaseline = getBaselineObservation(smicObs, baselineDate);
  const smicLatest = smicObs[smicObs.length - 1] ?? null;
  const smicDelta =
    smicBaseline && smicLatest
      ? computeDelta(smicBaseline.valeur, smicLatest.valeur)
      : null;

  // Unemployment timeline (last 32 quarters = ~8 years, from 2017)
  const chomageTimeline = chomageObs
    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
    .map((o) => ({ label: o.periode, value: o.valeur }));

  // Lobbying stats
  const totalLobbyActions = lobbyDomains.reduce(
    (s, d) => s + d._count.id,
    0,
  );

  // Build siren → action count map for curated orgs
  const sirenActionMap = new Map(
    curatedActionGroups.map((g) => [g.lobbyisteId, g._count.id]),
  );

  // Compute action count per curated lobbyist (consolidating Mutualité branches)
  function getCuratedActions(sirens: string[]): number {
    return sirens.reduce((sum, s) => sum + (sirenActionMap.get(s) ?? 0), 0);
  }

  // Total curated actions (for display)
  const totalMutualiteActions = getCuratedActions(MUTUALITE_SIRENS);
  const totalCuratedActions = [...POWER_LOBBYISTS, ...CONSULTING_LOBBYISTS]
    .reduce((s, l) => s + getCuratedActions(l.sirens), 0);

  // Tag count map
  const tagCountMap = new Map(
    scrutinTagCounts.map((t) => [t.tag, t._count.tag]),
  );

  // ── Promise evidence helper ──
  function getPromiseEvidence(p: Promesse) {
    if (!p.indicateurCode) return null;
    const ind = indMap.get(p.indicateurCode);
    if (!ind || !ind.observations.length) return null;
    const baseline2017 = getBaselineObservation(
      ind.observations,
      ELECTION_DATES[2017],
    );
    const baseline2022 = getBaselineObservation(
      ind.observations,
      ELECTION_DATES[2022],
    );
    const baseline =
      p.election === 2017 ? baseline2017 : baseline2022;
    const current = ind.observations[ind.observations.length - 1] ?? null;
    if (!baseline || !current) return null;
    const delta = computeDelta(baseline.valeur, current.valeur);
    return {
      baseline: baseline.valeur,
      baselinePeriode: baseline.periode,
      current: current.valeur,
      currentPeriode: current.periode,
      delta,
      target: p.indicateurTarget,
      unite: ind.unite,
    };
  }

  // Promise summary
  const summary = getPromesseSummary(electionYear);
  const filteredPromesses = PROMESSES.filter((p) => p.election === electionYear);

  // Conflict declarations
  const conflictDeclarations = declarations.filter(
    (d) => (d.totalParticipations ?? 0) > 0,
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ProfileHero
        avatar={{ src: null, initials: "EM" }}
        name="Emmanuel Macron"
        subtitle="Président de la République Française · En Marche / Renaissance"
        status={{ active: true, label: "En fonction depuis le 14 mai 2017" }}
        badge="Rén."
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Président de la République" },
        ]}
        scores={[
          { value: 66.1, label: "Suffrage 2017", color: "teal" },
          { value: 58.6, label: "Suffrage 2022", color: "blue" },
          {
            value: summary.tenu + summary.partiel,
            label: "Promesses tenues/partielles",
            color: "amber",
          },
          {
            value: declarations.length,
            label: "Déclarations HATVP",
            color: "rose",
          },
        ]}
        contact={{
          website: "https://www.elysee.fr",
          twitter: "EmmanuelMacron",
        }}
      >
        <Suspense>
          <ProfileTabs
            tabs={[
              {
                key: "promesses",
                label: "Promesses",
                count: PROMESSES.length,
              },
              { key: "bilan", label: "Bilan Économique" },
              { key: "lobbying", label: "Lobbying & Agenda" },
              {
                key: "declarations",
                label: "Déclarations HATVP",
                count: declarations.length || undefined,
              },
            ]}
            defaultTab="promesses"
          />
        </Suspense>
      </ProfileHero>

      {/* ── Tab content ── */}
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* ══════════════ TAB: Promesses ══════════════ */}
        {tab === "promesses" && (
          <div className="space-y-8 fade-up">

            {/* Election selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-bureau-500">
                Programme
              </span>
              <div className="flex gap-1">
                {([2017, 2022] as const).map((yr) => (
                  <Link
                    key={yr}
                    href={`/president?tab=promesses&election=${yr}`}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      electionYear === yr
                        ? "bg-teal/10 text-teal"
                        : "text-bureau-500 hover:text-bureau-300"
                    }`}
                  >
                    {yr}
                  </Link>
                ))}
              </div>
            </div>

            {/* Summary row */}
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-bureau-500">
                  {summary.total} promesses · programme {electionYear}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                {[
                  { label: "Tenues", value: summary.tenu, color: "text-teal" },
                  { label: "Partielles", value: summary.partiel, color: "text-amber" },
                  { label: "Abandonnées", value: summary.abandonne, color: "text-rose" },
                  { label: "En cours", value: summary.enCours, color: "text-blue" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center">
                    <span className={`text-2xl font-bold ${s.color}`}>
                      {s.value}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-bureau-500">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Distribution bar */}
              <div className="mt-4 flex h-2 overflow-hidden rounded-full">
                {summary.tenu > 0 && (
                  <div
                    className="bg-teal"
                    style={{ width: `${(summary.tenu / summary.total) * 100}%` }}
                  />
                )}
                {summary.partiel > 0 && (
                  <div
                    className="bg-amber"
                    style={{ width: `${(summary.partiel / summary.total) * 100}%` }}
                  />
                )}
                {summary.enCours > 0 && (
                  <div
                    className="bg-blue"
                    style={{ width: `${(summary.enCours / summary.total) * 100}%` }}
                  />
                )}
                {summary.abandonne > 0 && (
                  <div
                    className="bg-rose"
                    style={{ width: `${(summary.abandonne / summary.total) * 100}%` }}
                  />
                )}
              </div>
            </div>

            {/* Promise cards */}
            <div className="space-y-4">
              {filteredPromesses.map((p) => {
                const cfg = STATUS_CONFIG[p.status];
                const evidence = getPromiseEvidence(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full border border-bureau-700/30 bg-bureau-800/40 px-2.5 py-0.5 text-xs text-bureau-400">
                          {p.categoryLabel}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Promise text */}
                    <p className="text-sm text-bureau-200 leading-relaxed mb-3">
                      {p.text}
                    </p>

                    {/* Status note */}
                    <p className="text-xs text-bureau-400 leading-relaxed mb-3">
                      {p.statusNote}
                    </p>

                    {/* Evidence block */}
                    {evidence && (
                      <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/40 px-4 py-3 mt-3">
                        <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-2">
                          {p.indicateurLabel} · source INSEE
                        </p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <span className="text-xs text-bureau-500">
                              {p.election === 2017
                                ? "Élection 2017"
                                : "Réélection 2022"}{" "}
                              ({evidence.baselinePeriode})
                            </span>
                            <p className="text-base font-bold text-bureau-200">
                              {evidence.baseline.toLocaleString("fr-FR", {
                                maximumFractionDigits: 1,
                              })}
                              {evidence.unite === "pourcent" ? " %" : ""}
                            </p>
                          </div>
                          <span className="text-bureau-600">→</span>
                          <div>
                            <span className="text-xs text-bureau-500">
                              Aujourd'hui ({evidence.currentPeriode})
                            </span>
                            <p className="text-base font-bold text-bureau-200">
                              {evidence.current.toLocaleString("fr-FR", {
                                maximumFractionDigits: 1,
                              })}
                              {evidence.unite === "pourcent" ? " %" : ""}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-bold ${
                              evidence.delta.direction === "down"
                                ? "text-teal"
                                : evidence.delta.direction === "up"
                                  ? "text-rose"
                                  : "text-bureau-400"
                            }`}
                          >
                            {evidence.delta.formatted}
                            {evidence.unite === "pourcent" ? " pts" : ""}
                          </div>
                          {evidence.target != null && (
                            <div className="text-xs text-bureau-500">
                              Objectif :{" "}
                              <span className="text-bureau-300">
                                {evidence.target.toLocaleString("fr-FR")}
                                {evidence.unite === "pourcent" ? " %" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vote evidence link */}
                    {p.scrutinTag && (
                      <div className="mt-3 flex items-center gap-2">
                        <svg
                          className="h-3 w-3 text-bureau-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span className="text-xs text-bureau-500">
                          {fmt(tagCountMap.get(p.scrutinTag) ?? 0)} votes au
                          Parlement sur ce thème ·{" "}
                          <Link
                            href={`/votes/par-sujet/${p.scrutinTag}`}
                            className="text-teal hover:underline"
                          >
                            Voir les scrutins →
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: Bilan Économique ══════════════ */}
        {tab === "bilan" && (
          <div className="space-y-10 fade-up">

            {/* KPI grid */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Indicateurs clés depuis l'élection
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <IndicatorCard
                  label="Taux de chômage"
                  value={
                    chomageLatest?.valeur.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    }) ?? "—"
                  }
                  unit="%"
                  color="teal"
                  trend={
                    chomageDelta
                      ? chomageDelta.direction === "down"
                        ? "down"
                        : chomageDelta.direction === "up"
                          ? "up"
                          : "flat"
                      : undefined
                  }
                  trendValue={
                    chomageDelta
                      ? `${chomageDelta.formatted} pts depuis 2017`
                      : undefined
                  }
                  sparkline={chomageObs
                    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
                    .map((o) => o.valeur)
                    .slice(-8)}
                  period={chomageLatest?.periode}
                />
                <IndicatorCard
                  label="PIB annuel"
                  value={
                    pibLatest
                      ? (pibLatest.valeur / 1_000_000).toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })
                      : "—"
                  }
                  unit="bn €"
                  color="blue"
                  trend={
                    pibDelta
                      ? pibDelta.direction === "up"
                        ? "up"
                        : "down"
                      : undefined
                  }
                  trendValue={
                    pibDelta
                      ? `${pibDelta.formatted} M€ depuis 2017`
                      : undefined
                  }
                  sparkline={pibObs
                    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
                    .map((o) => o.valeur)
                    .slice(-8)}
                  period={pibLatest?.periode}
                />
                <IndicatorCard
                  label="Dette publique"
                  value={
                    detteLatest?.valeur.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    }) ?? "—"
                  }
                  unit="% PIB"
                  color="rose"
                  trend={
                    detteDelta
                      ? detteDelta.direction === "up"
                        ? "up"
                        : "down"
                      : undefined
                  }
                  trendValue={
                    detteDelta
                      ? `${detteDelta.formatted} pts depuis 2017`
                      : undefined
                  }
                  sparkline={detteObs
                    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
                    .map((o) => o.valeur)}
                  period={detteLatest?.periode}
                />
                <IndicatorCard
                  label="SMIC horaire brut"
                  value={
                    smicLatest?.valeur.toLocaleString("fr-FR", {
                      maximumFractionDigits: 2,
                    }) ?? "—"
                  }
                  unit="€"
                  color="amber"
                  trend={smicDelta ? "up" : undefined}
                  trendValue={
                    smicDelta
                      ? `${smicDelta.formatted} € depuis 2017`
                      : undefined
                  }
                  sparkline={smicObs
                    .filter((o) => o.periodeDebut >= new Date("2017-01-01"))
                    .map((o) => o.valeur)}
                  period={smicLatest?.periode}
                />
              </div>
            </section>

            {/* Chômage timeline */}
            {chomageTimeline.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                    Évolution du taux de chômage depuis l'élection
                  </h2>
                  <span className="text-[10px] text-bureau-600 uppercase tracking-widest">
                    % · source INSEE BDM
                  </span>
                </div>
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
                  {/* Mandate markers */}
                  <div className="mb-2 flex gap-4 text-[10px] text-bureau-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-teal/60" />
                      Élu mai 2017
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue/60" />
                      Réélu avril 2022
                    </span>
                  </div>
                  <TimelineChart
                    data={chomageTimeline}
                    color="teal"
                    height={140}
                    unit="%"
                    showEvery={4}
                  />
                </div>
              </section>
            )}

            {/* Biographical note */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Biographie
              </h2>
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5 space-y-3">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-bureau-500">Né le </span>
                    <span className="text-bureau-200">
                      21 décembre 1977 · {BIO.lieuNaissance}
                    </span>
                  </div>
                  <div>
                    <span className="text-bureau-500">Formation : </span>
                    <span className="text-bureau-200">{BIO.formation}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-bureau-500">Parti : </span>
                    <span className="text-bureau-200">{BIO.parti}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {BIO.career.map((c) => (
                    <div key={c.period} className="flex gap-4 text-sm">
                      <span className="shrink-0 text-bureau-500 w-24">
                        {c.period}
                      </span>
                      <span className="text-bureau-300">{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Electoral results */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Résultats électoraux
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BIO.elections.map((e) => (
                  <div
                    key={e.annee}
                    className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500 mb-2">
                      Présidentielle {e.annee} · 2nd tour vs {e.adversaire}
                    </p>
                    <div className="flex items-end gap-4">
                      <span className="text-3xl font-bold text-teal">
                        {e.tour2Pct.toLocaleString("fr-FR")} %
                      </span>
                      <span className="text-sm text-bureau-400 mb-1">
                        1er tour : {e.tour1Pct.toLocaleString("fr-FR")} %
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-bureau-700/30">
                      <div
                        className="h-full bg-teal/60 rounded-full"
                        style={{ width: `${e.tour2Pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ══════════════ TAB: Lobbying & Agenda ══════════════ */}
        {tab === "lobbying" && (
          <div className="space-y-10 fade-up">

            {/* Overview */}
            <section>
              <div className="mb-1 flex items-end justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                  Acteurs clés du lobbying (registre HATVP)
                </h2>
                <span className="text-[10px] text-bureau-600 uppercase tracking-widest">
                  toutes périodes confondues
                </span>
              </div>
              <p className="mb-4 text-xs text-bureau-600">
                Le registre HATVP compte 3 883 organisations. Ce tableau filtre les 10 acteurs
                les plus influents — la Mutualité Française (13 entités régionales autonomes) est
                consolidée ici en une seule entrée. Les cabinets de conseil agissent pour le compte
                de clients non divulgués par la loi.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    Actions déclarées (total)
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber">
                    {fmt(totalLobbyActions)}
                  </p>
                </div>
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    Mutualité Française (consolidée)
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber">
                    {fmt(totalMutualiteActions)}
                  </p>
                  <p className="text-[10px] text-bureau-600 mt-1">actions · 13 entités</p>
                </div>
                <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                    Acteurs sélectionnés
                  </p>
                  <p className="mt-2 text-3xl font-bold text-amber">
                    {fmt(totalCuratedActions)}
                  </p>
                  <p className="text-[10px] text-bureau-600 mt-1">actions · 10 organisations</p>
                </div>
              </div>
            </section>

            {/* Power lobbyists — direct interest groups */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Groupes d'intérêt directs · 7 acteurs clés
              </h2>
              <div className="space-y-3">
                {POWER_LOBBYISTS.map((org) => {
                  const actions = getCuratedActions(org.sirens);
                  const tc = TYPE_CONFIG[org.type];
                  return (
                    <div
                      key={org.id}
                      className={`rounded-xl border ${tc.border} ${tc.bg} p-5`}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] uppercase tracking-widest font-medium ${tc.color}`}>
                              {tc.label}
                            </span>
                            <span className="text-[10px] text-bureau-600">
                              {org.secteur}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-bureau-100">
                            {org.nom}
                          </p>
                        </div>
                        {actions > 0 && (
                          <div className="shrink-0 text-right">
                            <p className={`text-xl font-bold ${tc.color}`}>
                              {fmt(actions)}
                            </p>
                            <p className="text-[10px] text-bureau-600">actions HATVP</p>
                          </div>
                        )}
                      </div>

                      {/* Details grid */}
                      <div className="grid gap-2 text-xs">
                        <div className="flex gap-2">
                          <span className="shrink-0 text-bureau-500 w-16">Direction</span>
                          <span className="text-bureau-300">{org.leader}</span>
                        </div>
                        {org.membres && (
                          <div className="flex gap-2">
                            <span className="shrink-0 text-bureau-500 w-16">Membres</span>
                            <span className="text-bureau-400">{org.membres}</span>
                          </div>
                        )}
                        {org.victoireLegislative && (
                          <div className="flex gap-2">
                            <span className="shrink-0 text-bureau-500 w-16">Victoire</span>
                            <span className="text-bureau-300">{org.victoireLegislative}</span>
                          </div>
                        )}
                        {org.connexionMacron && (
                          <div className="flex gap-2">
                            <span className="shrink-0 text-bureau-500 w-16">Connexion</span>
                            <span className="text-bureau-400 italic">{org.connexionMacron}</span>
                          </div>
                        )}
                      </div>

                      {/* Conflict alert */}
                      {org.alerte && (
                        <div className="mt-3 rounded-lg border border-rose/20 bg-rose/5 px-3 py-2 text-xs text-rose/80">
                          Alerte : {org.alerte}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Consulting firms */}
            <section>
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Cabinets de conseil pour compte de tiers · 3 firmes
              </h2>
              <p className="mb-4 text-xs text-bureau-600">
                Ces firmes sont enregistrées au nom de leurs propres structures mais agissent pour des
                clients payants non divulgués. Leur volume d'actions reflète leur portefeuille de mandats,
                non leur propre intérêt sectoriel.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {CONSULTING_LOBBYISTS.map((org) => {
                  const actions = getCuratedActions(org.sirens);
                  const tc = TYPE_CONFIG[org.type];
                  return (
                    <div
                      key={org.id}
                      className={`rounded-xl border ${tc.border} ${tc.bg} p-4 flex flex-col gap-3`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-bureau-100">{org.nom}</p>
                        {actions > 0 && (
                          <span className={`text-sm font-bold shrink-0 ${tc.color}`}>
                            {fmt(actions)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-bureau-500 uppercase tracking-widest -mt-1">
                        {org.secteur}
                      </p>
                      {org.leader && (
                        <div>
                          <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">Direction</p>
                          <p className="text-xs text-bureau-300">{org.leader}</p>
                        </div>
                      )}
                      {org.connexionMacron && (
                        <div>
                          <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">Réseau & parcours</p>
                          <p className="text-xs text-bureau-400">{org.connexionMacron}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-bureau-600 uppercase tracking-widest mb-0.5">À noter</p>
                        <p className="text-xs text-bureau-400">{org.note}</p>
                      </div>
                      {org.alerte && (
                        <div className="rounded-lg border border-amber/20 bg-amber/5 px-3 py-2">
                          <p className="text-[10px] text-amber/80 uppercase tracking-widest mb-0.5">Conflit potentiel</p>
                          <p className="text-xs text-bureau-300">{org.alerte}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Domain cross-reference */}
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                Domaines · croisés avec les votes au Parlement
              </h2>
              <div className="space-y-2">
                {lobbyDomains
                  .filter((d) => d.domaine)
                  .slice(0, 10)
                  .map((d) => {
                    const match = matchDomainToTag(d.domaine!);
                    const voteCount = match
                      ? (tagCountMap.get(match.tag) ?? 0)
                      : 0;
                    return (
                      <div
                        key={d.domaine}
                        className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <p className="text-xs text-bureau-300 truncate flex-1">
                            {d.domaine}
                          </p>
                          <span className="text-xs font-semibold text-amber shrink-0">
                            {fmt(d._count.id)} actions
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-bureau-700/30 mb-1.5">
                          <div
                            className="h-full bg-amber/30 rounded-full"
                            style={{
                              width: `${(d._count.id / (lobbyDomains[0]?._count.id ?? 1)) * 100}%`,
                            }}
                          />
                        </div>
                        {match && voteCount > 0 && (
                          <span className="text-[10px] text-bureau-600">
                            {fmt(voteCount)} votes parlementaires sur ce thème ·{" "}
                            <Link
                              href={`/votes/par-sujet/${match.tag}`}
                              className="text-teal hover:underline"
                            >
                              Voir les scrutins
                            </Link>
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>

            <p className="text-xs text-bureau-600">
              Source : Répertoire des représentants d&apos;intérêts — HATVP (
              <a
                href="https://www.hatvp.fr/le-repertoire/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-bureau-400"
              >
                hatvp.fr
              </a>
              ). Données toutes périodes confondues. Les connexions avec le gouvernement
              Macron sont issues de sources publiques (presse, HATVP, JO).
            </p>
          </div>
        )}

        {/* ══════════════ TAB: Déclarations HATVP ══════════════ */}
        {tab === "declarations" && (
          <div className="space-y-8 fade-up">

            {declarations.length === 0 ? (
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-8 text-center">
                <p className="text-bureau-400">
                  Aucune déclaration trouvée sous le nom « Macron » dans la base
                  HATVP.
                </p>
                <p className="mt-2 text-xs text-bureau-600">
                  Les déclarations de la Présidence sont normalement publiées
                  sur{" "}
                  <a
                    href="https://www.hatvp.fr/consulter-les-declarations/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:underline"
                  >
                    hatvp.fr
                  </a>
                  .
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                      Déclarations
                    </p>
                    <p className="mt-1 text-2xl font-bold text-teal">
                      {declarations.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                      Total participations
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber">
                      {fmtEuro(
                        declarations.reduce(
                          (s, d) => s + (d.totalParticipations ?? 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-bureau-500">
                      Total revenus déclarés
                    </p>
                    <p className="mt-1 text-2xl font-bold text-blue">
                      {fmtEuro(
                        declarations.reduce(
                          (s, d) => s + (d.totalRevenus ?? 0),
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                {/* Conflict alerts */}
                {conflictDeclarations.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                      Participations financières déclarées
                    </h2>
                    <div className="space-y-3">
                      {conflictDeclarations.map((decl) => {
                        const sector =
                          decl.participations
                            .slice(0, 2)
                            .map((p) => p.nomSociete)
                            .join(", ") ||
                          decl.organe ||
                          decl.typeMandat;
                        return (
                          <ConflictAlert
                            key={decl.id}
                            deputyName="Emmanuel Macron"
                            sector={sector}
                            participationTotal={decl.totalParticipations ?? 0}
                            relatedVoteCount={0}
                            declarationId={decl.id}
                            typeMandat={decl.typeMandat}
                          />
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Full declarations */}
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                    Toutes les déclarations
                  </h2>
                  <DeclarationSection declarations={declarations} />
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
