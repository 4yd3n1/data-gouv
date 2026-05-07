import type { SignalType } from "@/lib/signals";

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

export interface LobbyOwnerLinkSignal {
  severity: SignalSeverity;
  lobbyisteId: string;
  lobbyisteNom: string;
  personKey: string;
  nom: string;
  prenom: string;
  /** How the person is linked: dirigeant actuel, ancien dirigeant, mentionné dans HATVP, ancien employé. */
  linkKind:
    | "dirigeant_direct"
    | "ancien_dirigeant"
    | "carriere_prive"
    | "interet_declare";
  /** Free-text — fonction for dirigeant links, rubrique for InteretDeclare, titre for EntreeCarriere. */
  linkLabel: string;
  lobbyActionCount: number;
  topMinistere: string | null;
  sourceUrl: string | null;
  sourceDate: Date | null;
  verifie: boolean;
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

/**
 * A person linked to a lobby by leadership / prior career / HATVP declaration.
 * Severity reflects the intensity of that lobby's exposure (AGORA declarations)
 * plus the directness of the tie.
 */
export function lobbyOwnerLinkSeverity(
  linkKind: LobbyOwnerLinkSignal["linkKind"],
  lobbyActionCount: number,
): SignalSeverity {
  const direct = linkKind === "dirigeant_direct" || linkKind === "ancien_dirigeant";
  if (direct && lobbyActionCount >= 1_000) return "CRITIQUE";
  if (direct && lobbyActionCount >= 100) return "NOTABLE";
  if (lobbyActionCount >= 500) return "NOTABLE";
  return "INFORMATIF";
}

export const SEVERITY_ORDER: Record<SignalSeverity, number> = {
  CRITIQUE: 0,
  NOTABLE: 1,
  INFORMATIF: 2,
};

/* ------------------------------------------------------------------ */
/*  Signal registry — formula, caveat, thresholds, methodology link    */
/* ------------------------------------------------------------------ */

/**
 * Structured metadata for every signal type. Consumed by `<SignalFormula />`,
 * the corrections feed, and the methodology page anchors.
 *
 * Every entry MUST carry the caveat — a signal is a cross-reference, not proof.
 * Memory: feedback_signal_caveats.md.
 */
export interface SignalRegistryEntry {
  label: string;
  formula: string;
  caveat: string;
  methodologyAnchor: string;
  thresholds?: {
    critique?: string;
    notable?: string;
    informatif?: string;
  };
}

const UNIVERSAL_CAVEAT =
  "Un signal est un croisement de données, pas une preuve.";

export const SIGNAL_REGISTRY: Record<SignalType, SignalRegistryEntry> = {
  conflit: {
    label: "Conflit d'intérêts potentiel",
    formula:
      "Une participation financière déclarée à l'HATVP croisée avec un vote sur un texte tagué dans le même secteur.",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#conflit",
    thresholds: {
      critique: "Plus de 500 000 € déclarés et au moins 5 votes sur le sujet.",
      notable: "Plus de 100 000 € ou au moins 3 votes.",
      informatif: "En dessous de ces seuils.",
    },
  },
  porte: {
    label: "Porte tournante",
    formula:
      "Une carrière privée passée recoupant le portefeuille ministériel actuel par mots-clés sectoriels (banque, pharma, énergie, etc.).",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#porte",
    thresholds: {
      critique: "Au moins 3 mots-clés sectoriels recoupés.",
      notable: "Au moins 1 mot-clé recoupé.",
    },
  },
  lobby: {
    label: "Pression de lobby sur le ministère",
    formula:
      "Le ministère figure parmi les cibles les plus fréquentes des représentants d'intérêts enregistrés à l'HATVP (registre AGORA).",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#lobby",
    thresholds: {
      critique: "Plus de 5 000 déclarations AGORA ciblant le ministère.",
      notable: "Plus de 1 500.",
      informatif: "En dessous.",
    },
  },
  "lobby-owner": {
    label: "Lien personnel avec un lobby",
    formula:
      "La personne est dirigeante actuelle ou ancienne d'un lobby enregistré, ou mentionne ce lobby dans sa déclaration HATVP.",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#lobby-owner",
    thresholds: {
      critique:
        "Lien direct (dirigeant·e) avec un lobby ayant déposé plus de 1 000 déclarations AGORA.",
      notable:
        "Lien direct moins intense, ou lien indirect avec un lobby très actif.",
      informatif: "Lien indirect, lobby peu actif.",
    },
  },
  media: {
    label: "Nexus médias",
    formula:
      "La personne est propriétaire d'un média dont les liens politiques sont documentés par des sources publiques.",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#media",
    thresholds: {
      critique:
        "Propriétaire enregistré comme personnalité publique sur le site.",
      notable: "Propriétaire identifié uniquement par sources presse.",
    },
  },
  ecart: {
    label: "Écart entre lobbying ciblé et déclarations HATVP",
    formula:
      "Activité de lobby intense ciblant ce ministère sans déclaration d'intérêts correspondante au registre HATVP.",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#ecart",
    thresholds: {
      critique: "Plus de 50 actions de lobby par déclaration HATVP.",
      notable: "Plus de 15.",
      informatif: "En dessous.",
    },
  },
  dissidence: {
    label: "Dissidence vis-à-vis du groupe",
    formula:
      "Vote contre la position majoritaire du groupe politique sur les scrutins finaux.",
    caveat: UNIVERSAL_CAVEAT,
    methodologyAnchor: "/methodologie#dissidence",
    thresholds: {
      critique: "Plus de 50 % des votes finaux contre la position du groupe.",
      notable: "Plus de 25 %.",
      informatif: "En dessous.",
    },
  },
};
