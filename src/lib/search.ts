import { prisma } from "@/lib/db";
import { getSignals, type SignalType } from "@/lib/signals";

export const VALID_ENTITY_TYPES = [
  "depute",
  "senateur",
  "lobbyiste",
  "scrutin",
  "commune",
  "parti",
] as const;

export type EntityType = (typeof VALID_ENTITY_TYPES)[number];

export interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

/** Search result enriched with computed-signal counts. */
export interface EnrichedSearchResult extends SearchResult {
  /** Total count of signals attached to this entity. 0 means no signals. */
  signalTotal: number;
  /** Count by signal type — only types with > 0 are kept. */
  signalsByType: Partial<Record<SignalType, number>>;
  /** Worst severity across all signals on this entity, when applicable. */
  topSeverity: "CRITIQUE" | "NOTABLE" | "INFORMATIF" | null;
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  depute: "Députés",
  senateur: "Sénateurs",
  lobbyiste: "Lobbyistes",
  scrutin: "Scrutins",
  commune: "Communes",
  parti: "Partis",
};

const PRESIDENT_STATIC: SearchResult = {
  entityType: "president",
  entityId: "emmanuel-macron",
  title: "Emmanuel Macron",
  subtitle: "Président de la République",
  url: "/profils/emmanuel-macron",
  rank: 1,
};

const PRESIDENT_TERMS = ["macron", "manu", "president", "elysee", "elyse"];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesPresident(query: string): boolean {
  const q = normalize(query);
  return PRESIDENT_TERMS.some((t) => q.includes(t) || t.includes(q));
}

export async function globalSearch(
  query: string,
  limit = 20,
  entityType?: string
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const validType = VALID_ENTITY_TYPES.includes(entityType as EntityType)
    ? (entityType as EntityType)
    : null;
  const typeFilter = validType ? `AND entity_type = '${validType}'` : "";

  const results = await prisma.$queryRawUnsafe<SearchResult[]>(
    `
    SELECT
      entity_type AS "entityType",
      entity_id   AS "entityId",
      title,
      subtitle,
      url,
      ts_rank(search_vector, plainto_tsquery('french', $1)) AS rank
    FROM search_index
    WHERE search_vector @@ plainto_tsquery('french', $1)
    ${typeFilter}
    ORDER BY rank DESC
    LIMIT $2
  `,
    query,
    limit
  );

  // Inject static president result when query matches and no type filter active
  if (!validType && matchesPresident(query)) {
    return [PRESIDENT_STATIC, ...results].slice(0, limit);
  }

  return results;
}

/**
 * Map a search result entity to the `getSignals()` personKey, where applicable.
 * Senators and lobbyistes aren't covered by the unified signal collectors —
 * they're enriched separately (see `enrichLobbyistes` below) or return null.
 *
 * Designed so future cached/materialized signal-count storage can replace the
 * `getSignals()` call without changing the public helper shape.
 */
function searchResultToPersonKey(r: SearchResult): string | null {
  switch (r.entityType) {
    case "depute":
      return `depute:${r.entityId}`;
    case "president":
      // PRESIDENT_STATIC.entityId is the slug "emmanuel-macron".
      return `ministre:${r.entityId}`;
    default:
      return null;
  }
}

/**
 * Per-lobbyiste AGORA action counts. Lobbyistes don't appear in `getSignals()`
 * (signals are people-keyed), so we enrich them via a dedicated query against
 * `Lobbyiste.nom → ActionLobby.representantNom`.
 */
async function getLobbyisteAgoraCounts(
  ids: string[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const lobbies = await prisma.lobbyiste.findMany({
    where: { id: { in: ids } },
    select: { id: true, nom: true },
  });
  const noms = lobbies.map((l) => l.nom);
  if (noms.length === 0) return new Map();
  const counts = await prisma.actionLobby.groupBy({
    by: ["representantNom"],
    where: { representantNom: { in: noms } },
    _count: { id: true },
  });
  const byNom = new Map(counts.map((c) => [c.representantNom, c._count.id]));
  return new Map(lobbies.map((l) => [l.id, byNom.get(l.nom) ?? 0]));
}

/**
 * Enriches the top-N search results with signal counts. Lower-ranked results
 * stay un-enriched (cost discipline — see plan Phase 5). The shape of the
 * helper is stable so it can later be backed by a cached column or
 * materialized view per entity.
 */
export async function enrichSearchResults(
  results: SearchResult[],
  topN = 5,
): Promise<EnrichedSearchResult[]> {
  if (results.length === 0) return [];

  const enrichTargets = results.slice(0, topN);
  const personKeys = new Set(
    enrichTargets
      .map(searchResultToPersonKey)
      .filter((k): k is string => k !== null),
  );
  const lobbyisteIds = enrichTargets
    .filter((r) => r.entityType === "lobbyiste")
    .map((r) => r.entityId);

  const [allSignals, lobbyisteCounts] = await Promise.all([
    personKeys.size > 0 ? getSignals() : Promise.resolve([]),
    getLobbyisteAgoraCounts(lobbyisteIds),
  ]);

  const signalsByPersonKey = new Map<
    string,
    { types: SignalType[]; severity: EnrichedSearchResult["topSeverity"]; total: number }
  >();
  for (const sig of allSignals) {
    if (!personKeys.has(sig.personKey)) continue;
    signalsByPersonKey.set(sig.personKey, {
      types: sig.types,
      severity: sig.severity,
      total: sig.narratives.length,
    });
  }

  return results.map((r, idx) => {
    if (idx >= topN) {
      return {
        ...r,
        signalTotal: 0,
        signalsByType: {},
        topSeverity: null,
      };
    }

    // Lobbyiste enrichment: AGORA action count surfaced as a single "lobby" chip.
    if (r.entityType === "lobbyiste") {
      const count = lobbyisteCounts.get(r.entityId) ?? 0;
      if (count === 0) {
        return { ...r, signalTotal: 0, signalsByType: {}, topSeverity: null };
      }
      const severity =
        count > 5_000 ? "CRITIQUE" : count > 1_500 ? "NOTABLE" : "INFORMATIF";
      return {
        ...r,
        signalTotal: 1,
        signalsByType: { lobby: count },
        topSeverity: severity,
      };
    }

    const personKey = searchResultToPersonKey(r);
    const sig = personKey ? signalsByPersonKey.get(personKey) : null;
    if (!sig) {
      return {
        ...r,
        signalTotal: 0,
        signalsByType: {},
        topSeverity: null,
      };
    }
    const byType: Partial<Record<SignalType, number>> = {};
    for (const t of sig.types) {
      byType[t] = (byType[t] ?? 0) + 1;
    }
    return {
      ...r,
      signalTotal: sig.total,
      signalsByType: byType,
      topSeverity: sig.severity,
    };
  });
}
