/**
 * Mapping helpers: party display name → partiCode, partiCode → FamillePolitique.
 *
 * partiCode conventions: UPPERCASE, 2-6 chars, stable across rebranding events.
 * A rebranding event always generates a new partiCode (LREM → RE is a distinct code).
 */

import type { FamillePolitique } from "@prisma/client";

// Display name → normalized partiCode
export const PARTI_NAME_TO_CODE: Record<string, string> = {
  // Macroniste orbit
  "La République En Marche": "LREM",
  "La République en marche": "LREM",
  "En Marche": "LREM",
  "LREM": "LREM",
  Renaissance: "RE",
  "Parti Renaissance": "RE",
  RE: "RE",
  Horizons: "HOR",
  HOR: "HOR",
  MoDem: "MODEM",
  "Mouvement démocrate": "MODEM",
  "Mouvement Démocrate": "MODEM",
  MODEM: "MODEM",
  "Agir, la droite constructive": "AGIR",
  "Agir": "AGIR",
  AGIR: "AGIR",

  // Droite / Centre-droit
  "Les Républicains": "LR",
  LR: "LR",
  UMP: "UMP",
  "Union pour un mouvement populaire": "UMP",
  RPR: "RPR",
  "Rassemblement pour la République": "RPR",
  "Nouveau Centre": "NC",
  NC: "NC",
  UDI: "UDI",
  "Union des démocrates et indépendants": "UDI",
  "Mouvement pour la France": "MPF",
  MPF: "MPF",
  "Debout la France": "DLR",
  "Debout la République": "DLR",
  DLR: "DLR",
  "La Droite forte": "LDF",
  "Vallois Parti Français": "VPF",
  VPF: "VPF",
  DVD: "DVD",

  // Socialiste / Gauche institutionnelle
  "Parti socialiste": "PS",
  PS: "PS",
  "Parti radical de gauche": "PRG",
  PRG: "PRG",
  "Génération.s": "GEN",
  "Génération s": "GEN",
  GEN: "GEN",
  "Place publique": "PP",
  PP: "PP",

  // Gauche radicale / extrême gauche
  "La France insoumise": "LFI",
  LFI: "LFI",
  "Parti communiste français": "PCF",
  PCF: "PCF",
  "Nouveau Parti anticapitaliste": "NPA",
  NPA: "NPA",
  "Lutte ouvrière": "LO",
  LO: "LO",

  // Écologistes
  "Europe Écologie Les Verts": "EELV",
  "Europe Ecologie Les Verts": "EELV",
  EELV: "EELV",
  "Les Écologistes": "LES_ECO",
  "Les Ecologistes": "LES_ECO",
  "Les Verts": "VERTS",
  VERTS: "VERTS",

  // Extrême droite
  "Rassemblement national": "RN",
  "Rassemblement National": "RN",
  RN: "RN",
  "Front national": "FN",
  FN: "FN",
  "Reconquête": "REC",
  REC: "REC",

  // Centristes historiques
  UDF: "UDF",
  "Union pour la démocratie française": "UDF",

  // Divers
  "Sans étiquette": "SE",
  "sans étiquette": "SE",
  "Indépendant": "SE",
  indépendant: "SE",
  SE: "SE",
  DVG: "DVG",
};

// partiCode → FamillePolitique
export const CODE_TO_FAMILLE: Record<string, FamillePolitique> = {
  // Centre (Macroniste orbit)
  LREM: "CENTRE",
  RE: "CENTRE",
  MODEM: "CENTRE",
  AGIR: "CENTRE",
  UDF: "CENTRE",

  // Centre-droit
  HOR: "CENTRE_DROIT",
  NC: "CENTRE_DROIT",
  UDI: "CENTRE_DROIT",

  // Droite
  LR: "DROITE",
  UMP: "DROITE",
  RPR: "DROITE",
  MPF: "DROITE",
  DLR: "DROITE",
  VPF: "DROITE",
  LDF: "DROITE",
  DVD: "DROITE",

  // Centre-gauche
  PS: "CENTRE_GAUCHE",
  PRG: "CENTRE_GAUCHE",

  // Gauche
  LFI: "GAUCHE",
  PCF: "GAUCHE",
  GEN: "GAUCHE",
  PP: "CENTRE_GAUCHE",

  // Extrême gauche
  NPA: "EXTREME_GAUCHE",
  LO: "EXTREME_GAUCHE",

  // Écologiste
  EELV: "ECOLOGISTE",
  LES_ECO: "ECOLOGISTE",
  VERTS: "ECOLOGISTE",

  // Extrême droite
  RN: "EXTREME_DROITE",
  FN: "EXTREME_DROITE",
  REC: "EXTREME_DROITE",

  // Divers
  SE: "DIVERS",
  DVG: "DIVERS",
};

export function getFamille(partiCode: string): FamillePolitique {
  const f = CODE_TO_FAMILLE[partiCode];
  if (!f) throw new Error(`Unknown partiCode: ${partiCode}`);
  return f;
}
