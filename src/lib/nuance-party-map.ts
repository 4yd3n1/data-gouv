/** Maps election nuance codes to CNCCFP party codeCNCC values */

const NUANCE_PARTY_MAP: Record<string, number[]> = {
  // Gauche
  EXG: [96],               // Lutte Ouvriere
  FI:  [976],              // La France Insoumise
  COM: [60],               // Parti Communiste Francais
  UG:  [976, 76, 104, 60], // Coalition: LFI + PS + EELV + PCF
  SOC: [76],               // Parti Socialiste
  DVG: [],                 // Divers gauche
  RDG: [52],               // Parti Radical de Gauche
  ECO: [104],              // Europe Ecologie Les Verts
  VEC: [104],              // Ecologiste (alias EELV)
  // Centre
  ENS: [910, 529, 1344],   // Coalition: Renaissance + MoDem + Horizons
  MDM: [529],              // Mouvement Democrate
  HOR: [1344],             // Horizons
  DVC: [],                 // Divers centre
  // Droite
  LR:  [401],              // Les Republicains
  DVD: [],                 // Divers droite
  UDI: [],                 // UDI
  // Extreme droite
  RN:  [40],               // Rassemblement National
  REC: [1307],             // Reconquete !
  EXD: [],                 // Extreme droite
  UXD: [],                 // Union extreme droite
  // Divers
  DIV: [],
  DSV: [],
  REG: [],
};

const COALITION_NUANCES = new Set(["UG", "ENS"]);

export function getPartyCodes(nuance: string): number[] {
  return NUANCE_PARTY_MAP[nuance] ?? [];
}

export function isCoalition(nuance: string): boolean {
  return COALITION_NUANCES.has(nuance);
}

export function getNuancesForParty(codeCNCC: number): string[] {
  return Object.entries(NUANCE_PARTY_MAP)
    .filter(([, codes]) => codes.includes(codeCNCC))
    .map(([nuance]) => nuance);
}
