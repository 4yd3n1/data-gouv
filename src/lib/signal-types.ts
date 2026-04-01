export type SignalSeverity = "CRITIQUE" | "NOTABLE" | "INFORMATIF";

/* ------------------------------------------------------------------ */
/*  Signal interfaces                                                  */
/* ------------------------------------------------------------------ */

export interface ConflictSignalCard {
  severity: SignalSeverity;
  nom: string;
  prenom: string;
  typeMandat: string;
  deputeId: string | null;
  sector: string;
  totalMontant: number | null;
  participationCount: number;
  voteCount: number;
  votePour: number;
  voteContre: number;
  voteAbstention: number;
  tag: string;
}

export interface RevolvingDoorSignal {
  severity: SignalSeverity;
  slug: string;
  nom: string;
  prenom: string;
  titreCourt: string;
  portefeuille: string | null;
  ministereCode: string | null;
  careerOrganisation: string;
  careerTitre: string;
  careerDateDebut: Date | null;
  careerDateFin: Date | null;
  matchedKeywords: string[];
}

export interface LobbyConcentrationSignal {
  severity: SignalSeverity;
  ministereCode: string;
  ministerName: string;
  ministerSlug: string;
  lobbyActionCount: number;
  topOrgs: Array<{ nom: string; count: number }>;
  topDomaines: Array<{ domaine: string; count: number }>;
}

export interface MediaNexusSignal {
  severity: SignalSeverity;
  ownerNom: string;
  ownerPrenom: string | null;
  contextePolitique: string;
  mediaGroups: Array<{ nomCourt: string }>;
  personnaliteSlug: string | null;
}

export interface DeclarationGapSignal {
  severity: SignalSeverity;
  nom: string;
  prenom: string;
  slug: string;
  titreCourt: string;
  ministereCode: string;
  lobbyActionCount: number;
  interetCount: number;
  ratio: number;
}

export interface PartyDisciplineSignal {
  severity: SignalSeverity;
  deputeId: string;
  nom: string;
  prenom: string;
  groupe: string;
  groupeAbrev: string;
  dissidenceCount: number;
  totalFinalVotes: number;
  dissidenceRate: number;
  examples: Array<{
    scrutinId: string;
    titre: string;
    deputePosition: string;
    groupePosition: string;
    dateScrutin: Date;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Revolving-door keyword matching                                    */
/* ------------------------------------------------------------------ */

/** Maps ministereCode patterns to private-sector keywords that signal overlap. */
export const PORTFOLIO_KEYWORDS: [RegExp, string[]][] = [
  [/ECONOMIE|FINANCES|BUDGET/i, ["banque", "financ", "invest", "capital", "gestion d'actif", "audit", "conseil financ", "natixis", "groupama", "CDPQ", "caisse de dépôt"]],
  [/SANTE/i, ["pharma", "santé", "médic", "laborat", "biotech", "hôpital", "clinique"]],
  [/ECOLOGIE|TRANSITION_ECOLOGIQUE|ENERGIE/i, ["énergie", "pétrole", "gaz", "nucléaire", "renouvelable", "total energies", "engie", "EDF", "électricité"]],
  [/DEFENSE|ARMEES/i, ["défense", "armement", "thales", "dassault", "naval group", "mbda", "nexter"]],
  [/AGRICULTURE/i, ["agri", "alimentaire", "agroalimentaire", "céréal", "semence"]],
  [/NUMERIQUE|INDUSTRIE/i, ["télécom", "numérique", "technolog", "informatique", "digital", "logiciel"]],
  [/CULTURE/i, ["audiovisuel", "presse", "édition", "média", "spectacle", "cinéma", "le point", "versailles"]],
  [/TRAVAIL|EMPLOI/i, ["emploi", "travail", "intérim", "recrutement", "formation profes", "SNCF", "ferroviaire"]],
  [/LOGEMENT/i, ["immobili", "foncier", "construction", "BTP", "promotion immob"]],
  [/TRANSPORT/i, ["transport", "autoroute", "ferroviaire", "SNCF", "aérien", "logistique"]],
  [/EDUCATION/i, ["éducation", "enseignement", "formation", "école", "université"]],
  [/INTERIEUR/i, ["sécurité", "surveillance", "défense civile"]],
  [/PME|COMMERCE|ARTISAN/i, ["distribution", "grande surface", "franchise", "système u", "leclerc", "carrefour", "auchan", "commerce"]],
  [/ENSEIGNEMENT_SUPERIEUR|RECHERCHE/i, ["recherche", "CNRS", "CNES", "université", "IBM", "Total", "BCG"]],
];

/**
 * Returns keywords that match between a minister's portfolio and a career
 * organisation name. Empty array = no revolving-door signal.
 */
export function matchRevolvingDoor(
  ministereCode: string,
  portefeuille: string | null,
  careerOrg: string,
): string[] {
  const orgNorm = careerOrg
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const matched: string[] = [];

  for (const [codePattern, keywords] of PORTFOLIO_KEYWORDS) {
    const codeMatch = codePattern.test(ministereCode);
    const portefeuilleMatch = portefeuille ? codePattern.test(portefeuille) : false;

    if (!codeMatch && !portefeuilleMatch) continue;

    for (const kw of keywords) {
      const kwNorm = kw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (orgNorm.includes(kwNorm)) {
        matched.push(kw);
      }
    }
  }

  return matched;
}

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                    */
/* ------------------------------------------------------------------ */

export function conflictSeverity(
  totalMontant: number | null,
  voteCount: number,
): SignalSeverity {
  if ((totalMontant ?? 0) > 500_000 && voteCount >= 5) return "CRITIQUE";
  if ((totalMontant ?? 0) > 100_000 || voteCount >= 3) return "NOTABLE";
  return "INFORMATIF";
}

export function lobbySeverity(count: number): SignalSeverity {
  if (count > 5_000) return "CRITIQUE";
  if (count > 1_500) return "NOTABLE";
  return "INFORMATIF";
}

export function gapSeverity(ratio: number): SignalSeverity {
  if (ratio > 50) return "CRITIQUE";
  if (ratio > 15) return "NOTABLE";
  return "INFORMATIF";
}

export function disciplineSeverity(rate: number): SignalSeverity {
  if (rate > 0.5) return "CRITIQUE";
  if (rate > 0.25) return "NOTABLE";
  return "INFORMATIF";
}

export const SEVERITY_ORDER: Record<SignalSeverity, number> = {
  CRITIQUE: 0,
  NOTABLE: 1,
  INFORMATIF: 2,
};
