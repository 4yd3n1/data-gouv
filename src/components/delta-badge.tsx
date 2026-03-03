/**
 * Shows the percentage difference between two values.
 * Only call this on the "winning" side — it always renders in teal.
 * value = the winning side, reference = the other side.
 */
export function DeltaBadge({
  value,
  reference,
}: {
  value: number | null | undefined;
  reference: number | null | undefined;
}) {
  if (value == null || reference == null || reference === 0) return null;
  const pct = ((value - reference) / Math.abs(reference)) * 100;
  if (Math.abs(pct) < 0.5) return null;
  return (
    <span className="text-[10px] font-semibold tabular-nums text-teal">
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}&thinsp;%
    </span>
  );
}
