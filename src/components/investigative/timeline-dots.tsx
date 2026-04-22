export type TimelineYear = { year: number; total: number; anomalies: number };

export function TimelineDots({
  data,
  width = 360,
  height = 100,
}: {
  data: readonly TimelineYear[];
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;

  const years = data.map((d) => d.year);
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const dotsPerYear = 12;

  const plot: { x: number; y: number; anomaly: boolean }[] = [];

  data.forEach((d, yi) => {
    const n = Math.min(dotsPerYear, Math.max(1, Math.round((d.total / maxTotal) * dotsPerYear)));
    const anomalyCount = Math.min(d.anomalies, n);
    for (let k = 0; k < n; k++) {
      const xBase = ((yi + 0.5) / years.length) * (width - 20) + 10;
      const jitterX = ((k % 3) - 1) * 3;
      const row = k % 4;
      const yPos = 16 + row * 14;
      plot.push({
        x: xBase + jitterX,
        y: yPos,
        anomaly: k < anomalyCount,
      });
    }
  });

  return (
    <svg width={width} height={height} style={{ display: "block" }} role="img" aria-label="Timeline des déclarations HATVP">
      {years.map((y, i) => {
        const x = ((i + 0.5) / years.length) * (width - 20) + 10;
        return (
          <g key={y}>
            <line
              x1={x}
              y1={8}
              x2={x}
              y2={height - 18}
              stroke="var(--line)"
              strokeWidth="0.5"
            />
            <text
              x={x}
              y={height - 4}
              fill="var(--color-fg-dim)"
              fontFamily="var(--font-mono, monospace)"
              fontSize="9.5"
              letterSpacing="1"
              textAnchor="middle"
            >
              {y}
            </text>
          </g>
        );
      })}
      {plot.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.anomaly ? 3.5 : 2}
          fill={d.anomaly ? "var(--color-signal)" : "var(--color-fg-mute)"}
          opacity={d.anomaly ? 1 : 0.7}
        />
      ))}
    </svg>
  );
}
