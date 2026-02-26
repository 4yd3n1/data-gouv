/**
 * Department name-to-code resolver.
 * Builds a normalized lookup map from the Departement table.
 */

import { prisma } from "../../src/lib/db";

/**
 * Normalize a French string for fuzzy matching:
 * - lowercase
 * - strip accents
 * - strip hyphens, apostrophes, spaces
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[-'\s]/g, ""); // strip hyphens, apostrophes, spaces
}

/**
 * Build a map from department name (normalized) → department code.
 * Queries the Departement table, so must run after territory ingestion.
 */
export async function buildDepartementLookup(): Promise<Map<string, string>> {
  const depts = await prisma.departement.findMany({
    select: { code: true, ncc: true, libelle: true },
  });

  const map = new Map<string, string>();
  for (const d of depts) {
    // Index both NCC (uppercase) and libelle (with articles)
    map.set(normalize(d.ncc), d.code);
    map.set(normalize(d.libelle), d.code);
    // Also index the code itself
    map.set(d.code.toLowerCase(), d.code);
  }

  return map;
}

/**
 * Resolve a department name to a code.
 * Returns null if no match found.
 */
export function resolveDepartementCode(
  lookup: Map<string, string>,
  name: string
): string | null {
  if (!name) return null;
  return lookup.get(normalize(name)) ?? null;
}

/**
 * Derive department code from a commune INSEE code.
 * "75056" → "75", "2A004" → "2A", "97105" → "971"
 */
export function departementCodeFromCommune(communeCode: string): string | null {
  if (!communeCode || communeCode.length < 2) return null;

  // Corsica: 2A, 2B
  if (communeCode.startsWith("2A") || communeCode.startsWith("2B")) {
    return communeCode.substring(0, 2);
  }

  // Overseas: 971-976 (3-digit department codes)
  if (communeCode.startsWith("97")) {
    return communeCode.substring(0, 3);
  }

  // Mainland: first 2 digits
  return communeCode.substring(0, 2);
}
