// Canonical labels for the 20 AGORA ministereCode values.
// AGORA uses UPPERCASE_UNDERSCORE codes which don't 1:1 match MandatGouvernemental
// codes in every case (e.g., AGORA has OUTREMER not OUTRE_MER). Keep this file
// as the source of truth for AGORA-facing display names.

export const MINISTRY_LABELS_LONG: Record<string, string> = {
  ECONOMIE_FINANCES: "Économie & Finances",
  TRAVAIL_SOLIDARITES: "Travail & Solidarités",
  MATIGNON: "Premier ministre",
  TRANSITION_ECOLOGIQUE: "Transition écologique",
  PRESIDENCE: "Présidence de la République",
  CULTURE: "Culture",
  SANTE_FAMILLE: "Santé & Famille",
  AGRICULTURE: "Agriculture",
  VILLE_LOGEMENT: "Ville & Logement",
  AFFAIRES_ETRANGERES: "Affaires étrangères",
  AMENAGEMENT_TERRITOIRE: "Aménagement du territoire",
  ENSEIGNEMENT_SUPERIEUR: "Enseignement supérieur",
  EDUCATION_NATIONALE: "Éducation nationale",
  INTERIEUR: "Intérieur",
  JUSTICE: "Justice",
  SPORTS_JEUNESSE: "Sports & Jeunesse",
  OUTREMER: "Outre-mer",
  INDUSTRIE_NUMERIQUE: "Industrie & Numérique",
  TRANSPORTS: "Transports",
  ARMEES: "Armées",
};

export const MINISTRY_LABELS_SHORT: Record<string, string> = {
  ECONOMIE_FINANCES: "Min. Économie",
  TRAVAIL_SOLIDARITES: "Min. Travail",
  MATIGNON: "Premier Ministre",
  TRANSITION_ECOLOGIQUE: "Min. Transition",
  PRESIDENCE: "Présidence Rép.",
  CULTURE: "Min. Culture",
  SANTE_FAMILLE: "Min. Santé",
  AGRICULTURE: "Min. Agriculture",
  VILLE_LOGEMENT: "Min. Ville Logement",
  AFFAIRES_ETRANGERES: "Min. Aff. étrang.",
  AMENAGEMENT_TERRITOIRE: "Min. Territoires",
  ENSEIGNEMENT_SUPERIEUR: "Min. Sup.",
  EDUCATION_NATIONALE: "Min. Éducation",
  INTERIEUR: "Min. Intérieur",
  JUSTICE: "Min. Justice",
  SPORTS_JEUNESSE: "Min. Sports",
  OUTREMER: "Min. Outre-mer",
  INDUSTRIE_NUMERIQUE: "Min. Industrie",
  TRANSPORTS: "Min. Transports",
  ARMEES: "Min. Armées",
};

function titleCase(code: string): string {
  return code
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function ministryLabel(code: string, variant: "long" | "short" = "long"): string {
  const map = variant === "short" ? MINISTRY_LABELS_SHORT : MINISTRY_LABELS_LONG;
  return map[code] ?? titleCase(code);
}
