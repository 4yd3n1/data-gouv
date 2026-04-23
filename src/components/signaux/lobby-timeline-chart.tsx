import { ministryLabel } from "@/lib/ministry-labels";
import type { LobbyTimeline } from "@/lib/lobby-overview";

const SERIES_COLORS = [
  "oklch(0.70 0.17 27 / 0.85)", // signal
  "oklch(0.62 0.15 27 / 0.75)",
  "oklch(0.55 0.12 27 / 0.65)",
  "oklch(0.48 0.10 27 / 0.55)",
  "oklch(0.42 0.08 27 / 0.45)",
  "oklch(0.38 0.07 27 / 0.38)",
];
const OTHER_COLOR = "var(--color-fg-faint)";

export function LobbyTimelineChart({ data }: { data: LobbyTimeline }) {
  const years = data.years;
  if (!years.length) return null;

  const W = 720;
  const H = 220;
  const padL = 40;
  const padR = 20;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(...years.map((y) => y.total), 1);
  const ticks = [0, Math.round(max / 2), max];

  const xStep = years.length > 1 ? innerW / (years.length - 1) : 0;

  // Stacked series: top ministries (in rank order) then "__other__" at top
  const seriesKeys = [...data.topMinistryCodes, "__other__"];
  const seriesPaths: { key: string; d: string; color: string }[] = [];

  // Build bottom-up cumulative to stack
  const cumulative = years.map(() => 0);

  for (let si = 0; si < seriesKeys.length; si++) {
    const key = seriesKeys[si];
    const color =
      key === "__other__"
        ? OTHER_COLOR
        : SERIES_COLORS[si % SERIES_COLORS.length];

    const lowerPts: [number, number][] = [];
    const upperPts: [number, number][] = [];

    years.forEach((y, i) => {
      const v = y.byMinistry[key] ?? 0;
      const low = cumulative[i];
      const high = cumulative[i] + v;
      const x = padL + i * xStep;
      const yLow = padT + innerH - (low / max) * innerH;
      const yHigh = padT + innerH - (high / max) * innerH;
      lowerPts.push([x, yLow]);
      upperPts.push([x, yHigh]);
      cumulative[i] = high;
    });

    // Build polygon path
    const path =
      `M ${upperPts[0][0]} ${upperPts[0][1]}` +
      upperPts
        .slice(1)
        .map(([x, y]) => ` L ${x} ${y}`)
        .join("") +
      lowerPts
        .reverse()
        .map(([x, y]) => ` L ${x} ${y}`)
        .join("") +
      " Z";

    seriesPaths.push({ key, d: path, color });
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label="Évolution des déclarations de lobbying par année, stackées par ministère"
        style={{ minWidth: 540 }}
      >
        {/* Y-axis ticks */}
        {ticks.map((t) => {
          const y = padT + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line
                x1={padL}
                x2={W - padR}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeDasharray={t === 0 ? undefined : "2 3"}
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                className="obs-mono"
                fill="var(--color-fg-dim)"
                style={{ fontSize: 9, letterSpacing: "0.1em" }}
              >
                {t.toLocaleString("fr-FR")}
              </text>
            </g>
          );
        })}

        {/* Stacked areas */}
        {seriesPaths.map((s) => (
          <path key={s.key} d={s.d} fill={s.color} />
        ))}

        {/* X-axis year labels */}
        {years.map((y, i) => {
          const x = padL + i * xStep;
          return (
            <text
              key={y.year}
              x={x}
              y={H - 8}
              textAnchor="middle"
              className="obs-mono"
              fill="var(--color-fg-dim)"
              style={{ fontSize: 10, letterSpacing: "0.14em" }}
            >
              {y.year}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          fontSize: 11,
          color: "var(--color-fg-mute)",
        }}
      >
        {data.topMinistryCodes.map((code, i) => (
          <span
            key={code}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                background: SERIES_COLORS[i % SERIES_COLORS.length],
                display: "inline-block",
              }}
            />
            {ministryLabel(code, "short")}
          </span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              background: OTHER_COLOR,
              display: "inline-block",
            }}
          />
          Autres ministères
        </span>
      </div>
    </div>
  );
}
