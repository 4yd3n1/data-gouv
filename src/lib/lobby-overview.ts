import { cache } from "react";
import { prisma } from "@/lib/db";
import { ministryLabel } from "@/lib/ministry-labels";

export interface LobbyStats {
  totalDeclarations: number;
  distinctRepresentants: number;
  distinctMinistries: number;
  firstYear: string;
  lastYear: string;
}

export interface LobbyMinistryRow {
  code: string;
  label: string;
  declarations: number;
  representants: number;
  topRepresentantNom: string;
  topRepresentantShare: number;
  ministerSlug: string | null;
  ministerLabel: string | null;
}

export interface LobbyRepresentantRow {
  rank: number;
  nom: string;
  categorie: string;
  declarations: number;
  ministriesTouched: number;
  topDomains: string[];
  lobbyisteId: string | null;
}

export interface LobbyDomainRow {
  label: string;
  declarations: number;
  topReps: string[];
  topMinistries: string[];
}

export interface LobbyTimelineYear {
  year: string;
  total: number;
  byMinistry: Record<string, number>;
}

export interface LobbyTimeline {
  years: LobbyTimelineYear[];
  topMinistryCodes: string[];
}

// Canonical synonym map for domaine normalization. Free-text field in AGORA with
// 7 700+ distinct comma-separated values. We split on commas, trim, and map
// equivalent phrases to a single bucket. Expand as we learn.
const DOMAIN_SYNONYMS: Record<string, string> = {
  "santé": "Santé",
  "système de santé": "Santé",
  "système de santé et médico-social": "Santé",
  "politique de santé": "Santé",
  "santé publique": "Santé",
  "politique de la santé": "Santé",
  "médico-social": "Santé",

  "agriculture": "Agriculture",
  "agroalimentaire": "Agriculture",
  "alimentation": "Agriculture",
  "pêche": "Agriculture",
  "forêt": "Agriculture",

  "transports": "Transports",
  "logistique": "Transports",
  "mobilité": "Transports",
  "transports et mobilités": "Transports",

  "environnement": "Environnement",
  "écologie": "Environnement",
  "climat": "Environnement",
  "biodiversité": "Environnement",

  "énergie": "Énergie",
  "énergies renouvelables": "Énergie",

  "économie": "Économie",
  "politique économique": "Économie",
  "finance": "Finances",
  "finances": "Finances",
  "finances publiques": "Finances",
  "fiscalité": "Finances",
  "budget": "Finances",

  "numérique": "Numérique",
  "économie numérique": "Numérique",
  "télécoms": "Numérique",
  "télécommunications": "Numérique",

  "éducation": "Éducation",
  "enseignement supérieur": "Enseignement supérieur",
  "recherche": "Recherche",

  "logement": "Logement",
  "urbanisme": "Logement",
  "politique de la ville": "Logement",

  "travail": "Travail",
  "emploi": "Travail",
  "formation": "Travail",
  "formation professionnelle": "Travail",

  "industrie": "Industrie",
  "commerce": "Commerce",
  "commerce extérieur": "Commerce",

  "justice": "Justice",
  "sécurité": "Sécurité",
  "sécurité intérieure": "Sécurité",
  "défense": "Défense",

  "culture": "Culture",
  "audiovisuel": "Audiovisuel",
  "médias": "Audiovisuel",

  "protection sociale": "Protection sociale",
  "sécurité sociale": "Protection sociale",
  "retraite": "Protection sociale",
  "retraites": "Protection sociale",

  "affaires étrangères": "Affaires étrangères",
  "europe": "Europe",
  "international": "Affaires étrangères",

  "sport": "Sports",
  "sports": "Sports",
  "jeunesse": "Sports",
};

function normalizeDomain(raw: string): string {
  const key = raw.trim().toLowerCase();
  return DOMAIN_SYNONYMS[key] ?? raw.trim();
}

function splitDomains(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map(normalizeDomain);
}

function normalizeLobbyisteName(nom: string): string {
  return nom
    .toUpperCase()
    .replace(/\s+(SAS|SA|SARL|SNC|EURL|GIE|SCOP|ASSOCIATION|FEDERATION|FÉDÉRATION)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchStats(): Promise<LobbyStats> {
  const rows = await prisma.$queryRaw<
    {
      total: bigint;
      reps: bigint;
      mins: bigint;
      first_year: string | null;
      last_year: string | null;
    }[]
  >`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(DISTINCT "representantNom")::bigint AS reps,
      COUNT(DISTINCT "ministereCode")::bigint AS mins,
      MIN(exercice) AS first_year,
      MAX(exercice) AS last_year
    FROM "ActionLobby"
  `;
  const r = rows[0]!;
  return {
    totalDeclarations: Number(r.total),
    distinctRepresentants: Number(r.reps),
    distinctMinistries: Number(r.mins),
    firstYear: r.first_year ?? "—",
    lastYear: r.last_year ?? "—",
  };
}

async function fetchByMinistry(): Promise<LobbyMinistryRow[]> {
  const [perMinistry, topPerMinistry, currentMinisters] = await Promise.all([
    prisma.$queryRaw<
      { ministereCode: string; decls: bigint; reps: bigint }[]
    >`
      SELECT "ministereCode",
        COUNT(*)::bigint AS decls,
        COUNT(DISTINCT "representantNom")::bigint AS reps
      FROM "ActionLobby"
      GROUP BY 1
      ORDER BY decls DESC
    `,
    prisma.$queryRaw<
      { ministereCode: string; representantNom: string; cnt: bigint }[]
    >`
      SELECT "ministereCode", "representantNom", cnt FROM (
        SELECT "ministereCode", "representantNom", COUNT(*)::bigint AS cnt,
          ROW_NUMBER() OVER (PARTITION BY "ministereCode" ORDER BY COUNT(*) DESC) AS rn
        FROM "ActionLobby"
        WHERE "representantNom" IS NOT NULL
        GROUP BY 1, 2
      ) t
      WHERE rn = 1
    `,
    prisma.mandatGouvernemental.findMany({
      where: { dateFin: null, ministereCode: { not: null } },
      select: {
        ministereCode: true,
        personnalite: { select: { slug: true, nom: true, prenom: true } },
      },
      orderBy: { rang: "asc" },
    }),
  ]);

  const topByMin = new Map(topPerMinistry.map((r) => [r.ministereCode, r]));
  const ministerByCode = new Map<
    string,
    { slug: string; label: string }
  >();
  for (const m of currentMinisters) {
    if (!m.ministereCode || ministerByCode.has(m.ministereCode)) continue;
    ministerByCode.set(m.ministereCode, {
      slug: m.personnalite.slug,
      label: `${m.personnalite.prenom} ${m.personnalite.nom}`,
    });
  }

  return perMinistry.map((r) => {
    const total = Number(r.decls);
    const top = topByMin.get(r.ministereCode);
    const topCount = top ? Number(top.cnt) : 0;
    const minister = ministerByCode.get(r.ministereCode) ?? null;
    return {
      code: r.ministereCode,
      label: ministryLabel(r.ministereCode),
      declarations: total,
      representants: Number(r.reps),
      topRepresentantNom: top?.representantNom ?? "—",
      topRepresentantShare: total > 0 ? topCount / total : 0,
      ministerSlug: minister?.slug ?? null,
      ministerLabel: minister?.label ?? null,
    };
  });
}

async function fetchByRepresentant(
  limit: number,
): Promise<LobbyRepresentantRow[]> {
  const [topReps, perRepDomains, lobbyistes] = await Promise.all([
    prisma.$queryRaw<
      {
        representantNom: string;
        categorie: string | null;
        declarations: bigint;
        ministries: bigint;
      }[]
    >`
      SELECT "representantNom",
        MAX("representantCategorie") AS categorie,
        COUNT(*)::bigint AS declarations,
        COUNT(DISTINCT "ministereCode")::bigint AS ministries
      FROM "ActionLobby"
      WHERE "representantNom" IS NOT NULL
      GROUP BY 1
      ORDER BY declarations DESC
      LIMIT ${limit}
    `,
    prisma.$queryRaw<
      { representantNom: string; domaine: string | null; cnt: bigint }[]
    >`
      SELECT "representantNom", domaine, COUNT(*)::bigint AS cnt
      FROM "ActionLobby"
      WHERE "representantNom" IN (
        SELECT "representantNom" FROM "ActionLobby"
        WHERE "representantNom" IS NOT NULL
        GROUP BY 1
        ORDER BY COUNT(*) DESC
        LIMIT ${limit}
      )
      AND domaine IS NOT NULL
      GROUP BY 1, 2
    `,
    prisma.lobbyiste.findMany({
      select: { id: true, nom: true },
    }),
  ]);

  const lobbyisteByName = new Map<string, string>();
  for (const l of lobbyistes) {
    lobbyisteByName.set(normalizeLobbyisteName(l.nom), l.id);
  }

  const domainsByRep = new Map<string, Map<string, number>>();
  for (const row of perRepDomains) {
    const count = Number(row.cnt);
    const buckets = splitDomains(row.domaine);
    if (!buckets.length) continue;
    let acc = domainsByRep.get(row.representantNom);
    if (!acc) {
      acc = new Map();
      domainsByRep.set(row.representantNom, acc);
    }
    for (const b of buckets) {
      acc.set(b, (acc.get(b) ?? 0) + count);
    }
  }

  return topReps.map((r, i) => {
    const domainMap = domainsByRep.get(r.representantNom);
    const topDomains = domainMap
      ? [...domainMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d]) => d)
      : [];
    const lobbyisteId =
      lobbyisteByName.get(normalizeLobbyisteName(r.representantNom)) ?? null;
    return {
      rank: i + 1,
      nom: r.representantNom,
      categorie: r.categorie ?? "—",
      declarations: Number(r.declarations),
      ministriesTouched: Number(r.ministries),
      topDomains,
      lobbyisteId,
    };
  });
}

async function fetchByDomaine(limit: number): Promise<LobbyDomainRow[]> {
  const rows = await prisma.$queryRaw<
    {
      domaine: string | null;
      representantNom: string;
      ministereCode: string;
      cnt: bigint;
    }[]
  >`
    SELECT domaine, "representantNom", "ministereCode", COUNT(*)::bigint AS cnt
    FROM "ActionLobby"
    WHERE domaine IS NOT NULL
    GROUP BY 1, 2, 3
  `;

  type Bucket = {
    declarations: number;
    reps: Map<string, number>;
    mins: Map<string, number>;
  };
  const buckets = new Map<string, Bucket>();
  for (const row of rows) {
    const c = Number(row.cnt);
    for (const label of splitDomains(row.domaine)) {
      let b = buckets.get(label);
      if (!b) {
        b = { declarations: 0, reps: new Map(), mins: new Map() };
        buckets.set(label, b);
      }
      b.declarations += c;
      b.reps.set(row.representantNom, (b.reps.get(row.representantNom) ?? 0) + c);
      b.mins.set(row.ministereCode, (b.mins.get(row.ministereCode) ?? 0) + c);
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => b[1].declarations - a[1].declarations)
    .slice(0, limit)
    .map(([label, b]) => ({
      label,
      declarations: b.declarations,
      topReps: [...b.reps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n),
      topMinistries: [...b.mins.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([code]) => ministryLabel(code)),
    }));
}

async function fetchTimeline(topN: number): Promise<LobbyTimeline> {
  const [perYearPerMinistry, topMinistries] = await Promise.all([
    prisma.$queryRaw<
      { exercice: string; ministereCode: string; cnt: bigint }[]
    >`
      SELECT exercice, "ministereCode", COUNT(*)::bigint AS cnt
      FROM "ActionLobby"
      WHERE exercice IS NOT NULL
      GROUP BY 1, 2
      ORDER BY exercice ASC
    `,
    prisma.$queryRaw<{ ministereCode: string; cnt: bigint }[]>`
      SELECT "ministereCode", COUNT(*)::bigint AS cnt
      FROM "ActionLobby"
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT ${topN}
    `,
  ]);

  const topSet = new Set(topMinistries.map((m) => m.ministereCode));
  const yearMap = new Map<string, LobbyTimelineYear>();

  for (const row of perYearPerMinistry) {
    const year = row.exercice;
    let entry = yearMap.get(year);
    if (!entry) {
      entry = { year, total: 0, byMinistry: {} };
      yearMap.set(year, entry);
    }
    const c = Number(row.cnt);
    entry.total += c;
    if (topSet.has(row.ministereCode)) {
      entry.byMinistry[row.ministereCode] =
        (entry.byMinistry[row.ministereCode] ?? 0) + c;
    } else {
      entry.byMinistry["__other__"] =
        (entry.byMinistry["__other__"] ?? 0) + c;
    }
  }

  const years = [...yearMap.values()].sort((a, b) =>
    a.year.localeCompare(b.year),
  );
  return {
    years,
    topMinistryCodes: topMinistries.map((m) => m.ministereCode),
  };
}

export interface LobbyOverviewData {
  stats: LobbyStats;
  byMinistry: LobbyMinistryRow[];
  byRepresentant: LobbyRepresentantRow[];
  byDomaine: LobbyDomainRow[];
  timeline: LobbyTimeline;
}

export const getLobbyOverview = cache(async (): Promise<LobbyOverviewData> => {
  const [stats, byMinistry, byRepresentant, byDomaine, timeline] =
    await Promise.all([
      fetchStats(),
      fetchByMinistry(),
      fetchByRepresentant(20),
      fetchByDomaine(20),
      fetchTimeline(6),
    ]);
  return { stats, byMinistry, byRepresentant, byDomaine, timeline };
});

export interface PresidencyLobbyStats {
  declarations: number;
  representants: number;
  firstYear: string;
  lastYear: string;
  topReps: { nom: string; declarations: number }[];
}

export const getPresidencyLobby = cache(
  async (): Promise<PresidencyLobbyStats> => {
    const [stats, topReps] = await Promise.all([
      prisma.$queryRaw<
        {
          decls: bigint;
          reps: bigint;
          first_year: string | null;
          last_year: string | null;
        }[]
      >`
        SELECT
          COUNT(*)::bigint AS decls,
          COUNT(DISTINCT "representantNom")::bigint AS reps,
          MIN(exercice) AS first_year,
          MAX(exercice) AS last_year
        FROM "ActionLobby"
        WHERE "ministereCode" = 'PRESIDENCE'
      `,
      prisma.$queryRaw<{ representantNom: string; cnt: bigint }[]>`
        SELECT "representantNom", COUNT(*)::bigint AS cnt
        FROM "ActionLobby"
        WHERE "ministereCode" = 'PRESIDENCE' AND "representantNom" IS NOT NULL
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 4
      `,
    ]);
    const s = stats[0]!;
    return {
      declarations: Number(s.decls),
      representants: Number(s.reps),
      firstYear: s.first_year ?? "—",
      lastYear: s.last_year ?? "—",
      topReps: topReps.map((r) => ({
        nom: r.representantNom,
        declarations: Number(r.cnt),
      })),
    };
  },
);
