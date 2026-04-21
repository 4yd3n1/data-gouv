/**
 * Canonical name normalization used for joining datasets with inconsistent
 * casing, diacritics, or whitespace (HATVP XML vs PersonnalitePublique vs
 * Depute vs Senateur).
 *
 * Rules:
 *  - Unicode NFD, strip combining marks (é → e, ñ → n, ç → c)
 *  - Lowercase
 *  - Collapse internal whitespace to a single space
 *  - Trim
 *
 * Keep output stable — it's stored in indexed columns.
 */
export function normalizeName(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a single-string join key from a (prenom, nom) pair.
 * Used for in-memory lookup maps during ingestion.
 */
export function normalizedKey(prenom: string, nom: string): string {
  return `${normalizeName(prenom)}|${normalizeName(nom)}`;
}
