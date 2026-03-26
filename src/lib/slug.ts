/**
 * Generate a URL-friendly slug from a French name.
 * NFD-strips accents, lowercases, replaces spaces/punctuation with hyphens.
 */
export function generateSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
