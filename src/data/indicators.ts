export type IndicatorKey = "rev" | "pov" | "cho" | "pop" | "med" | "det";

export interface DeptData {
  n: string;    // name: "Ain"
  r: string;    // region code: "ARA"
  pop: number;  // population (hab.)
  rev: number;  // revenu médian (€)
  pov: number;  // taux de pauvreté (%)
  cho: number;  // chômage (%)
  med: number;  // densité médicale GP (/10k hab.)
  det: number;  // dette locale (€/hab.)
}

export interface IndicatorConfig {
  key: IndicatorKey;
  label: string;
  unit: string;
  palette: string[];      // 7-stop gradient, dark → accent
  accent: string;         // highlight hex
  higherIsBetter: boolean;
  format: "euro" | "pct" | "compact" | "number";
}

export const INDICATORS: IndicatorConfig[] = [
  {
    key: "rev",
    label: "Revenu médian",
    unit: "€",
    palette: ["#042f2e", "#0f5e59", "#0d7377", "#0e9aa0", "#2dd4bf", "#5eead4", "#99f6e4"],
    accent: "#14b8a6",
    higherIsBetter: true,
    format: "euro",
  },
  {
    key: "pov",
    label: "Taux de pauvreté",
    unit: "%",
    palette: ["#4c0519", "#881337", "#be123c", "#e11d48", "#f43f5e", "#fb7185", "#fecdd3"],
    accent: "#f43f5e",
    higherIsBetter: false,
    format: "pct",
  },
  {
    key: "cho",
    label: "Chômage",
    unit: "%",
    palette: ["#451a03", "#78350f", "#a16207", "#ca8a04", "#eab308", "#facc15", "#fef08a"],
    accent: "#f59e0b",
    higherIsBetter: false,
    format: "pct",
  },
  {
    key: "pop",
    label: "Population",
    unit: "hab.",
    palette: ["#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#6366f1", "#818cf8", "#c7d2fe"],
    accent: "#6366f1",
    higherIsBetter: true,
    format: "compact",
  },
  {
    key: "med",
    label: "Densité médicale",
    unit: "/10k",
    palette: ["#022c22", "#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#6ee7b7"],
    accent: "#10b981",
    higherIsBetter: true,
    format: "number",
  },
  {
    key: "det",
    label: "Dette locale",
    unit: "€/hab.",
    palette: ["#2e1065", "#4c1d95", "#5b21b6", "#6d28d9", "#7c3aed", "#8b5cf6", "#c4b5fd"],
    accent: "#8b5cf6",
    higherIsBetter: false,
    format: "euro",
  },
];

export const INDICATOR_MAP: Record<IndicatorKey, IndicatorConfig> = Object.fromEntries(
  INDICATORS.map((i) => [i.key, i])
) as Record<IndicatorKey, IndicatorConfig>;
