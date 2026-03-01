/**
 * Utilities for the presidential profile page:
 * baseline observation lookup and delta computation.
 */

interface ObservationLike {
  periodeDebut: Date;
  valeur: number;
  periode: string;
}

/**
 * Find the observation whose periodeDebut is closest to targetDate.
 * Observations can be in any order.
 */
export function getBaselineObservation<T extends ObservationLike>(
  observations: T[],
  targetDate: Date,
): T | null {
  if (!observations.length) return null;

  let closest: T | null = null;
  let minDiff = Infinity;

  for (const obs of observations) {
    const diff = Math.abs(obs.periodeDebut.getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = obs;
    }
  }

  return closest;
}

/**
 * Compute delta between a baseline value and a current value.
 * Returns delta, direction, and a French-formatted string.
 */
export function computeDelta(
  baseline: number,
  current: number,
  decimals = 1,
): { delta: number; direction: "up" | "down" | "flat"; formatted: string } {
  const delta = current - baseline;
  const direction =
    delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";
  const sign = delta > 0 ? "+" : "";
  const formatted = `${sign}${delta.toLocaleString("fr-FR", { maximumFractionDigits: decimals })}`;
  return { delta, direction, formatted };
}

/** Election dates for computing baselines */
export const ELECTION_DATES = {
  2017: new Date("2017-05-07"),
  2022: new Date("2022-04-24"),
} as const;
