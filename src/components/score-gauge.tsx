const colorMap: Record<string, string> = {
  teal: "text-teal",
  amber: "text-amber",
  blue: "text-blue",
  rose: "text-rose",
};

export function ScoreGauge({
  value,
  label,
  color = "teal",
}: {
  value: number | null;
  label: string;
  color?: "teal" | "amber" | "blue" | "rose";
}) {
  if (value == null) return null;

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3">
      <p className={`text-2xl font-bold tracking-tight ${colorMap[color]}`}>
        {value.toFixed(1)}
      </p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-bureau-500">
        {label}
      </p>
    </div>
  );
}
