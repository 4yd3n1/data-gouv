interface DataPoint {
  label: string;
  value: number;
}

interface TimelineChartProps {
  data: DataPoint[];
  color?: "teal" | "amber" | "rose" | "blue";
  height?: number;
  unit?: string;
  showEvery?: number;
}

const LINE_COLORS = {
  teal:  { line: "#2dd4bf", dot: "#2dd4bf", area: "rgba(45,212,191,0.08)",  axis: "#1e3a38" },
  amber: { line: "#fbbf24", dot: "#fbbf24", area: "rgba(251,191,36,0.08)",  axis: "#3a2e1e" },
  rose:  { line: "#fb7185", dot: "#fb7185", area: "rgba(251,113,133,0.08)", axis: "#3a1e28" },
  blue:  { line: "#60a5fa", dot: "#60a5fa", area: "rgba(96,165,250,0.08)",  axis: "#1e2e3a" },
};

export function TimelineChart({
  data,
  color = "teal",
  height = 120,
  unit = "",
  showEvery = 4,
}: TimelineChartProps) {
  if (!data.length) return null;

  const W = 600;
  const H = height;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const range = rawMax - rawMin || 1;

  const toX = (i: number) =>
    padL + (data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2);
  const toY = (v: number) => padT + (1 - (v - rawMin) / range) * chartH;

  const xs = data.map((_, i) => toX(i));
  const ys = data.map((d) => toY(d.value));

  const linePoints = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const areaPath =
    `M${xs[0].toFixed(1)},${(padT + chartH).toFixed(1)} ` +
    xs.map((x, i) => `L${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ") +
    ` L${xs[xs.length - 1].toFixed(1)},${(padT + chartH).toFixed(1)} Z`;

  const c = LINE_COLORS[color];
  const fmtVal = (v: number) =>
    Math.abs(v) >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : Math.abs(v) >= 1_000
        ? `${(v / 1_000).toFixed(0)}k`
        : v.toFixed(v % 1 !== 0 ? 1 : 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: `${H}px` }}
      aria-hidden="true"
    >
      {/* Horizontal grid lines */}
      {[0, 0.5, 1].map((t) => {
        const y = (padT + t * chartH).toFixed(1);
        return (
          <line
            key={t}
            x1={padL}
            y1={y}
            x2={padL + chartW}
            y2={y}
            stroke="#1e293b"
            strokeWidth="1"
          />
        );
      })}

      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="#334155" strokeWidth="1" />
      <line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#334155"
        strokeWidth="1"
      />

      {/* Area fill */}
      <path d={areaPath} fill={c.area} />

      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={c.line} strokeWidth="2" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((_, i) => (
        <circle key={i} cx={xs[i].toFixed(1)} cy={ys[i].toFixed(1)} r="2.5" fill={c.dot} />
      ))}

      {/* Y-axis labels */}
      <text
        x={padL - 5}
        y={padT + 4}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="8"
        fill="#64748b"
      >
        {fmtVal(rawMax)}{unit}
      </text>
      <text
        x={padL - 5}
        y={padT + chartH}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize="8"
        fill="#64748b"
      >
        {fmtVal(rawMin)}{unit}
      </text>

      {/* X-axis labels */}
      {data.map((d, i) => {
        const isFirst = i === 0;
        const isLast = i === data.length - 1;
        if (!isFirst && !isLast && i % showEvery !== 0) return null;
        return (
          <text
            key={i}
            x={xs[i].toFixed(1)}
            y={H - 4}
            textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
            fontSize="8"
            fill="#64748b"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
