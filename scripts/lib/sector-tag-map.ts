/**
 * Maps company names / sector keywords to ScrutinTag tag values.
 * Used by compute-conflicts.ts to cross-reference financial declarations with vote topics.
 */

// Pattern → tags mapping. Patterns are case-insensitive regex tested against company names.
const SECTOR_PATTERNS: [RegExp, string[]][] = [
  [/banque|bancaire|crédit|financ|capital|invest|patrimoine|gestion d'actif/i, ["budget", "fiscalite"]],
  [/énergie|énergétique|pétrole|gaz|nucléaire|électri|renouvel|solaire|éolien|hydrogène/i, ["ecologie", "budget"]],
  [/santé|pharma|médic|hôpital|clinique|laboratoire|biolog|vaccin|biotec/i, ["sante"]],
  [/immobili|foncier|logement|construction|BTP|promotion immob|habitat/i, ["logement", "budget"]],
  [/agri|alimenta|agroalimentaire|céréale|viticul|agricole|semence/i, ["agriculture"]],
  [/assurance|mutuel|prévoyance|retraite complémentaire/i, ["sante", "budget"]],
  [/défense|armement|militaire|aérospatial|naval/i, ["defense"]],
  [/télécom|numérique|technolog|informatique|internet|data|digital|logiciel|cloud/i, ["budget"]],
  [/transport|autoroute|aérien|ferroviaire|SNCF|logistique|fret|mobilité/i, ["ecologie", "budget"]],
  [/eau|environnement|déchets|recyclage|traitement|dépollution/i, ["ecologie"]],
  [/retraite|pension|vieillesse/i, ["retraites", "budget"]],
  [/éducation|formation|enseignement|université|école/i, ["education"]],
  [/sécurité|police|surveillance|pénitentiaire/i, ["securite"]],
  [/culture|audiovisuel|presse|édition|spectacle|cinéma/i, ["culture"]],
  [/emploi|travail|ressources humaines|recrutement|interim/i, ["travail"]],
];

/**
 * Returns ScrutinTag tag values that match the given company/sector name.
 * Returns an empty array if no pattern matches.
 */
export function matchSectorToTags(name: string): string[] {
  const matched: string[] = [];
  for (const [pattern, tags] of SECTOR_PATTERNS) {
    if (pattern.test(name)) {
      matched.push(...tags);
    }
  }
  return [...new Set(matched)];
}
