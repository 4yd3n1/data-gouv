import { prisma } from "@/lib/db";

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
  entityId: "macron",
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
