/** Political nuance color mapping for French elections */

const NUANCE_MAP: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  // Extrême gauche
  EXG: { label: "Extrême gauche", bg: "bg-red-900/20", text: "text-red-400", bar: "bg-red-700" },
  // Gauche
  FI:  { label: "La France Insoumise", bg: "bg-red-800/20", text: "text-red-400", bar: "bg-red-600" },
  UG:  { label: "Union de la gauche", bg: "bg-rose/10", text: "text-rose", bar: "bg-rose" },
  SOC: { label: "Parti socialiste", bg: "bg-rose/10", text: "text-rose", bar: "bg-rose" },
  DVG: { label: "Divers gauche", bg: "bg-rose/10", text: "text-rose", bar: "bg-pink-500" },
  ECO: { label: "\u00c9cologiste", bg: "bg-emerald-800/20", text: "text-emerald-400", bar: "bg-emerald-500" },
  COM: { label: "Communiste", bg: "bg-red-900/20", text: "text-red-400", bar: "bg-red-800" },
  RDG: { label: "Radical de gauche", bg: "bg-rose/10", text: "text-rose", bar: "bg-pink-600" },
  VEC: { label: "\u00c9cologiste", bg: "bg-emerald-800/20", text: "text-emerald-400", bar: "bg-emerald-500" },
  // Centre
  ENS: { label: "Ensemble", bg: "bg-amber/10", text: "text-amber", bar: "bg-amber" },
  MDM: { label: "MoDem", bg: "bg-orange-800/20", text: "text-orange-400", bar: "bg-orange-500" },
  HOR: { label: "Horizons", bg: "bg-sky-800/20", text: "text-sky-400", bar: "bg-sky-500" },
  DVC: { label: "Divers centre", bg: "bg-amber/10", text: "text-amber", bar: "bg-amber" },
  // Droite
  LR:  { label: "Les Républicains", bg: "bg-blue/10", text: "text-blue", bar: "bg-blue" },
  DVD: { label: "Divers droite", bg: "bg-blue/10", text: "text-blue", bar: "bg-blue-400" },
  UDI: { label: "UDI", bg: "bg-cyan-800/20", text: "text-cyan-400", bar: "bg-cyan-500" },
  // Extrême droite
  RN:  { label: "Rassemblement National", bg: "bg-indigo-900/20", text: "text-indigo-300", bar: "bg-indigo-500" },
  REC: { label: "Reconquête", bg: "bg-slate-800/20", text: "text-slate-300", bar: "bg-slate-500" },
  EXD: { label: "Extrême droite", bg: "bg-slate-800/20", text: "text-slate-400", bar: "bg-slate-600" },
  UXD: { label: "Union extrême droite", bg: "bg-indigo-900/20", text: "text-indigo-300", bar: "bg-indigo-500" },
  // Divers
  DIV: { label: "Divers", bg: "bg-bureau-700/20", text: "text-bureau-400", bar: "bg-bureau-500" },
  DSV: { label: "Divers souverainiste", bg: "bg-bureau-700/20", text: "text-bureau-400", bar: "bg-bureau-500" },
  REG: { label: "Régionaliste", bg: "bg-bureau-700/20", text: "text-bureau-400", bar: "bg-bureau-500" },
};

const DEFAULT_NUANCE = { label: "Autre", bg: "bg-bureau-700/20", text: "text-bureau-400", bar: "bg-bureau-500" };

export function getNuanceStyle(code: string) {
  return NUANCE_MAP[code] ?? DEFAULT_NUANCE;
}

export function getNuanceLabel(code: string): string {
  return NUANCE_MAP[code]?.label ?? code;
}
