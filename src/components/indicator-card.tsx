interface IndicatorCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  period?: string;
  sparkline?: number[];
  color?: "teal" | "amber" | "blue" | "rose";
}

const colorMap = {
  teal: "text-teal",
  amber: "text-amber",
  blue: "text-blue",
  rose: "text-rose",
};

const trendConfig = {
  up: { icon: "↑", color: "text-teal" },
  down: { icon: "↓", color: "text-rose" },
  flat: { icon: "→", color: "text-bureau-400" },
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} className="overflow-visible opacity-60">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
    </svg>
  );
}

export function IndicatorCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  period,
  sparkline,
  color = "teal",
}: IndicatorCardProps) {
  const valueColor = colorMap[color];
  const tc = trend ? trendConfig[trend] : null;

  return (
    <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
      <p className="text-xs uppercase tracking-widest text-bureau-500">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
            {value}
          </span>
          {unit && (
            <span className="ml-1 text-sm text-bureau-500">{unit}</span>
          )}
          {tc && trendValue && (
            <span className={`ml-2 text-sm font-medium ${tc.color}`}>
              {tc.icon} {trendValue}
            </span>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className={valueColor}>
            <Sparkline values={sparkline} />
          </div>
        )}
      </div>
      {period && (
        <p className="mt-1.5 text-[10px] uppercase tracking-widest text-bureau-600">
          {period}
        </p>
      )}
    </div>
  );
}
