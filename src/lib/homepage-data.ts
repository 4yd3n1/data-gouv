import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSignals, summarizeSignals, type UnifiedSignal } from "@/lib/signals";
import { getFranceMapData } from "@/lib/france-map-data";
import { INDICES_SPARK, type IndiceSpec } from "@/data/indices";
import type { DeptData } from "@/data/indicators";
import type { HealthCell } from "@/components/investigative/data-health-strip";
import type { BarRowItem } from "@/components/investigative/bar-rows";
import type { TimelineYear } from "@/components/investigative/timeline-dots";

// Ministry code → display label (AGORA uses UPPERCASE_UNDERSCORE codes)
const MINISTRY_LABELS: Record<string, string> = {
  PRESIDENCE: "Présidence Rép.",
  MATIGNON: "Premier Ministre",
  ECONOMIE_FINANCES: "Min. Économie",
  TRANSITION_ECOLOGIQUE: "Min. Transition",
  INTERIEUR: "Min. Intérieur",
  SANTE_FAMILLE: "Min. Santé",
  TRAVAIL_SOLIDARITES: "Min. Travail",
  EDUCATION: "Min. Éducation",
  AGRICULTURE: "Min. Agriculture",
  JUSTICE: "Min. Justice",
  AFFAIRES_ETRANGERES: "Min. Aff. étrang.",
  CULTURE: "Min. Culture",
  ARMEES: "Min. Armées",
  VILLE_LOGEMENT: "Min. Ville Logement",
  OUTRE_MER: "Min. Outre-mer",
  COHESION_TERRITOIRES: "Min. Territoires",
  SPORTS: "Min. Sports",
  INDUSTRIE: "Min. Industrie",
  FONCTION_PUBLIQUE: "Min. Fonction publ.",
  COMPTES_PUBLICS: "Min. Comptes publ.",
};

function ministryLabel(code: string): string {
  return (
    MINISTRY_LABELS[code] ??
    code
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ")
  );
}

async function getTopLobbyTargets(limit: number): Promise<BarRowItem[]> {
  const rows = await prisma.actionLobby.groupBy({
    by: ["ministereCode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  const max = rows[0]?._count.id ?? 1;
  return rows.map((r, i) => {
    const value = r._count.id;
    const ratio = value / max;
    const color =
      i === 0
        ? "var(--color-signal)"
        : i === 1
          ? "oklch(0.62 0.15 27 / 0.85)"
          : i === 2
            ? "oklch(0.55 0.12 27 / 0.75)"
            : i === 3
              ? "oklch(0.48 0.10 27 / 0.65)"
              : i === 4
                ? "oklch(0.42 0.08 27 / 0.55)"
                : "oklch(0.38 0.07 27 / 0.5)";
    return {
      label: ministryLabel(r.ministereCode),
      value,
      display: value.toLocaleString("fr-FR"),
      color,
      href: undefined,
    } satisfies BarRowItem;
  });
}

async function getHATVPTimeline(): Promise<TimelineYear[]> {
  const [totals, anomalies] = await Promise.all([
    prisma.$queryRaw<{ year: number; total: bigint }[]>`
      SELECT EXTRACT(YEAR FROM "dateDepot")::int AS year, COUNT(*)::bigint AS total
      FROM "DeclarationInteret"
      WHERE "dateDepot" IS NOT NULL
        AND EXTRACT(YEAR FROM "dateDepot") >= 2017
        AND EXTRACT(YEAR FROM "dateDepot") <= 2026
      GROUP BY year
      ORDER BY year ASC
    `,
    prisma.$queryRaw<{ year: number; total: bigint }[]>`
      SELECT EXTRACT(YEAR FROM "dateDeclaration")::int AS year, COUNT(*)::bigint AS total
      FROM "InteretDeclare"
      WHERE "alerteConflit" = true
        AND "dateDeclaration" IS NOT NULL
        AND EXTRACT(YEAR FROM "dateDeclaration") >= 2017
        AND EXTRACT(YEAR FROM "dateDeclaration") <= 2026
      GROUP BY year
      ORDER BY year ASC
    `,
  ]);

  const anomalyMap = new Map(anomalies.map((a) => [a.year, Number(a.total)]));
  const totalMap = new Map(totals.map((t) => [t.year, Number(t.total)]));

  const years: TimelineYear[] = [];
  for (let y = 2017; y <= 2026; y++) {
    years.push({
      year: y,
      total: totalMap.get(y) ?? 0,
      anomalies: anomalyMap.get(y) ?? 0,
    });
  }
  return years;
}

async function getIndicesSparklines(): Promise<IndiceSpec[]> {
  return INDICES_SPARK;
}

/* ─── Data health strip ────────────────────────────────────────────────
   6 real ingestion sources. We don't have ARCOM/CNCCFP automated sources
   wired up yet (no scheduled ingestion), so they appear as "scheduled"
   cells — honest state rather than fake "ok" labels.
   ───────────────────────────────────────────────────────────────────── */

const HEALTH_SOURCES: { key: string; label: string }[] = [
  { key: "declarations", label: "HATVP" },
  { key: "agora-lobby", label: "AGORA" },
  { key: "scrutins", label: "Assemblée" },
  { key: "insee-local", label: "INSEE" },
  { key: "budgets", label: "OFGL" },
  { key: "decrets-deport", label: "Déports" },
];

async function getDataHealth(): Promise<HealthCell[]> {
  const rows = await prisma.ingestionLog.findMany({
    where: { source: { in: HEALTH_SOURCES.map((s) => s.key) } },
    orderBy: [{ source: "asc" }, { createdAt: "desc" }],
    distinct: ["source"],
    select: { source: true, status: true, createdAt: true, rowsIngested: true },
  });
  const byKey = new Map(rows.map((r) => [r.source, r]));

  return HEALTH_SOURCES.map((s) => {
    const r = byKey.get(s.key);
    if (!r) {
      return {
        source: s.key,
        label: s.label,
        status: "scheduled" as const,
        summary: "—",
      } satisfies HealthCell;
    }
    const status =
      r.status === "success" || r.status === "partial"
        ? "ok"
        : r.status === "error"
          ? "error"
          : "scheduled";
    return {
      source: s.key,
      label: s.label,
      status: status as HealthCell["status"],
      timestamp: r.createdAt.toISOString(),
      summary: `+${r.rowsIngested.toLocaleString("fr-FR")}`,
    } satisfies HealthCell;
  });
}

async function getLatestIngestionTimestamp(): Promise<string> {
  const row = await prisma.ingestionLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return (row?.createdAt ?? new Date()).toISOString();
}

export interface HomepageData {
  signals: UnifiedSignal[];
  summary: { total: number; critique: number };
  lobbyTop: BarRowItem[];
  hatvpTimeline: TimelineYear[];
  indices: IndiceSpec[];
  dataHealth: HealthCell[];
  mapData: Record<string, DeptData>;
  revisionIso: string;
}

export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const [
    signals,
    lobbyTop,
    hatvpTimeline,
    indices,
    dataHealth,
    mapData,
    revisionIso,
  ] = await Promise.all([
    getSignals(),
    getTopLobbyTargets(6),
    getHATVPTimeline(),
    getIndicesSparklines(),
    getDataHealth(),
    getFranceMapData(),
    getLatestIngestionTimestamp(),
  ]);
  const summary = summarizeSignals(signals);
  return {
    signals,
    summary: {
      total: summary.total,
      critique: summary.bySeverity.CRITIQUE,
    },
    lobbyTop,
    hatvpTimeline,
    indices,
    dataHealth,
    mapData,
    revisionIso,
  };
});
