/** Shared tag constants for the votes section and cross-references. */

export const TAG_LABELS: Record<string, string> = {
  budget:      "Budget & Finances",
  fiscalite:   "Fiscalité",
  sante:       "Santé",
  logement:    "Logement",
  retraites:   "Retraites",
  education:   "Éducation",
  securite:    "Sécurité & Justice",
  immigration: "Immigration",
  ecologie:    "Écologie",
  travail:     "Emploi & Travail",
  defense:     "Défense",
  agriculture: "Agriculture",
  culture:     "Culture",
};

/** Short labels for compact UIs (filter pills, comparison columns). */
export const TAG_LABELS_SHORT: Record<string, string> = {
  budget:      "Budget",
  fiscalite:   "Fiscalité",
  sante:       "Santé",
  logement:    "Logement",
  retraites:   "Retraites",
  education:   "Éducation",
  securite:    "Sécurité",
  immigration: "Immigration",
  ecologie:    "Écologie",
  travail:     "Emploi",
  defense:     "Défense",
  agriculture: "Agriculture",
  culture:     "Culture",
};

export const TAG_ORDER = [
  "budget", "fiscalite", "travail", "sante", "logement",
  "retraites", "ecologie", "education", "securite",
  "immigration", "agriculture", "defense", "culture",
] as const;

export const TAG_COLORS: Record<string, string> = {
  budget:      "border-amber/20  bg-amber/5  text-amber",
  fiscalite:   "border-amber/20  bg-amber/5  text-amber",
  sante:       "border-rose/20   bg-rose/5   text-rose",
  logement:    "border-teal/20   bg-teal/5   text-teal",
  retraites:   "border-amber/20  bg-amber/5  text-amber",
  education:   "border-blue-400/20 bg-blue-400/5 text-blue-400",
  securite:    "border-rose/20   bg-rose/5   text-rose",
  immigration: "border-bureau-600/30 bg-bureau-800/20 text-bureau-300",
  ecologie:    "border-teal/20   bg-teal/5   text-teal",
  travail:     "border-blue-400/20 bg-blue-400/5 text-blue-400",
  defense:     "border-bureau-600/30 bg-bureau-800/20 text-bureau-300",
  agriculture: "border-teal/20   bg-teal/5   text-teal",
  culture:     "border-rose/20   bg-rose/5   text-rose",
};

export const VALID_TAGS = Object.keys(TAG_LABELS);
