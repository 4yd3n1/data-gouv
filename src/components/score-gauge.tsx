const colorMap: Record<string, string> = {
  teal: "text-teal",
  amber: "text-amber",
  blue: "text-blue",
  rose: "text-rose",
};

/**
 * Turn a 0-1 score into a French editorial descriptor by decile bucket.
 * Useful for giving raw scores context ("0,2 → dernier décile").
 */
function percentileLabel(value: number | null): string | null {
  if (value == null) return null;
  if (value >= 0.9) return "1er décile";
  if (value >= 0.75) return "Quartile haut";
  if (value >= 0.5) return "Médiane haute";
  if (value >= 0.25) return "Médiane basse";
  if (value > 0) return "Dernier quartile";
  return null;
}

export function ScoreGauge({
  value,
  label,
  color = "teal",
  showContext = false,
}: {
  value: number | null;
  label: string;
  color?: "teal" | "amber" | "blue" | "rose";
  showContext?: boolean;
}) {
  if (value == null) return null;

  const context = showContext ? percentileLabel(value) : null;

  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3">
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${colorMap[color]}`}>
        {value.toFixed(1)}
      </p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-bureau-500">
        {label}
      </p>
      {context && (
        <p className="text-[9px] uppercase tracking-wider text-bureau-600">
          {context}
        </p>
      )}
    </div>
  );
}
