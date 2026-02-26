export function ScoreBar({
  value,
  label,
  color = "teal",
}: {
  value: number | null;
  label: string;
  color?: "teal" | "amber" | "blue" | "rose";
}) {
  if (value == null) return null;
  const pct = Math.min(Math.max(value, 0), 100);
  const colors = {
    teal: "bg-teal",
    amber: "bg-amber",
    blue: "bg-blue",
    rose: "bg-rose",
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-bureau-400">{label}</span>
        <span className="font-medium text-bureau-200">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bureau-700/50">
        <div
          className={`bar-fill h-full rounded-full ${colors[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
