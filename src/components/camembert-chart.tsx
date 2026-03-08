const GROUP_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

interface SliceData {
  slug: string;
  nomCourt: string;
  rang: number;
  count: number;
}

interface CamembertChartProps {
  groups: SliceData[];
  title?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startAngle: number, endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

export function CamembertChart({ groups, title }: CamembertChartProps) {
  const sorted = [...groups].sort((a, b) => a.rang - b.rang);
  const total = sorted.reduce((s, g) => s + g.count, 0);
  if (total === 0) return null;

  const cx = 100;
  const cy = 100;
  const outerR = 80;
  const innerR = 45;

  let currentAngle = 0;
  const slices = sorted.map((g, i) => {
    const angle = (g.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...g,
      color: GROUP_COLORS[i % GROUP_COLORS.length],
      path: donutArc(cx, cy, outerR, innerR, startAngle, endAngle),
      pct: Math.round((g.count / total) * 100),
    };
  });

  return (
    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 p-6">
      {title && (
        <p className="mb-4 text-xs uppercase tracking-[0.15em] text-bureau-500">{title}</p>
      )}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Donut */}
        <div className="relative h-[200px] w-[200px] shrink-0">
          <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Repartition des medias par groupe">
            {slices.map((s) => (
              <path
                key={s.slug}
                d={s.path}
                fill={s.color}
                opacity={0.8}
                stroke="var(--color-bureau-950, #080c14)"
                strokeWidth={2}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-bureau-100">{total}</span>
            <span className="text-[10px] uppercase tracking-widest text-bureau-500">medias</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {slices.map((s) => (
            <div key={s.slug} className="flex items-center gap-2 py-1">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color, opacity: 0.8 }}
              />
              <span className="whitespace-nowrap text-xs text-bureau-200">{s.nomCourt}</span>
              <span className="ml-auto text-[11px] text-bureau-500">
                {s.count} ({s.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
