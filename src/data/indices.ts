/**
 * Indices du jour — 4 indicators tracked since 2017, base 100 = 2017.
 * Sparkline arrays are 12 quarterly points (2017-Q1 → 2020-Q1 → 2023-Q1 → 2026-Q1).
 * Anchor values derive from src/data/bilan-macron.ts and cited sources.
 */

export interface IndiceSpec {
  key: string;
  label: string;
  valueBase100: number;
  delta: string;
  neg: boolean;
  spark: number[];
  source: string;
}

export const INDICES_SPARK: IndiceSpec[] = [
  {
    key: "pouvoir_achat",
    label: "Pouvoir d'achat",
    valueBase100: 97.4,
    delta: "-2.6",
    neg: true,
    spark: [100, 99, 98.4, 98, 97.5, 97, 96.8, 96.5, 97, 97.2, 97.3, 97.4],
    source: "INSEE",
  },
  {
    key: "pauvrete",
    label: "Pauvreté",
    valueBase100: 109.9,
    delta: "+9.9",
    neg: true,
    spark: [100, 100.5, 101.2, 102, 102.7, 103.5, 104.5, 105.7, 107, 108.2, 109.2, 109.9],
    source: "INSEE 2024",
  },
  {
    key: "confiance_inst",
    label: "Confiance inst.",
    valueBase100: 62.1,
    delta: "-37.9",
    neg: true,
    spark: [100, 92, 86, 80, 75, 72, 70, 68, 66, 64, 63, 62.1],
    source: "CEVIPOF",
  },
  {
    key: "patrim_mill",
    label: "Patr. milliardaires",
    valueBase100: 215,
    delta: "+115",
    neg: false,
    spark: [100, 112, 128, 138, 155, 172, 185, 195, 203, 210, 213, 215],
    source: "Forbes / Oxfam",
  },
];
