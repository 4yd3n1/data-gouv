import { fmtEuro, fmtCompact } from "@/lib/format";
import type { RemunerationsYear } from "@/lib/remunerations";

const TYPE_ORDER = ["mandat_electif", "professionnel", "consultant", "dirigeant"] as const;
type RevenuType = (typeof TYPE_ORDER)[number];

const TYPE_LABEL: Record<string, string> = {
  mandat_electif: "Mandats électifs",
  professionnel: "Activités professionnelles",
  consultant: "Conseil",
  dirigeant: "Fonctions de direction",
};

const TYPE_COLOR: Record<string, string> = {
  mandat_electif: "oklch(0.68 0.11 220)",
  professionnel: "#60a5fa",
  consultant: "#c084fc",
  dirigeant: "oklch(0.80 0.13 80)",
};

export { TYPE_ORDER, TYPE_LABEL, TYPE_COLOR };
export type { RevenuType };

export function YearlyChart({ years }: { years: RemunerationsYear[] }) {
  const first = years[0].annee;
  const last = years[years.length - 1].annee;
  const filled: RemunerationsYear[] = [];
  const byAnnee = new Map(years.map((y) => [y.annee, y]));
  for (let a = first; a <= last; a++) {
    filled.push(byAnnee.get(a) ?? { annee: a, total: 0, byType: {} });
  }

  const typesPresent: RevenuType[] = TYPE_ORDER.filter((t) =>
    filled.some((y) => (y.byType[t] ?? 0) > 0),
  );
  const unknownTypes = Array.from(
    new Set(
      filled.flatMap((y) => Object.keys(y.byType)).filter(
        (t) => !(TYPE_ORDER as readonly string[]).includes(t),
      ),
    ),
  );
  const drawTypes = [...typesPresent, ...unknownTypes];

  const maxTotal = Math.max(1, ...filled.map((y) => y.total));

  const width = 640;
  const height = 260;
  const padL = 44;
  const padR = 10;
  const padT = 16;
  const padB = 32;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const barSlot = chartW / filled.length;
  const barWidth = Math.max(8, Math.min(42, barSlot * 0.68));

  const tickValues = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxTotal);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {drawTypes.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-sm"
              style={{ background: TYPE_COLOR[t] ?? "var(--color-fg-mute)" }}
            />
            <span
              className="obs-mono"
              style={{ fontSize: "10px", color: "var(--color-fg-mute)" }}
            >
              {TYPE_LABEL[t] ?? t}
            </span>
          </span>
        ))}
      </div>

      <div className="obs-card" style={{ padding: 12 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Revenus déclarés par exercice, stackés par nature"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {tickValues.map((v, i) => {
            const y = padT + chartH - (v / maxTotal) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeWidth={i === 0 ? 1 : 0.5}
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fill="var(--color-fg-dim)"
                >
                  {v === 0 ? "0" : fmtCompact(v)}
                </text>
              </g>
            );
          })}

          {filled.map((year, i) => {
            const xCenter = padL + barSlot * i + barSlot / 2;
            const x = xCenter - barWidth / 2;
            let cursorY = padT + chartH;
            return (
              <g key={year.annee}>
                {drawTypes.map((t) => {
                  const v = year.byType[t] ?? 0;
                  if (v <= 0) return null;
                  const h = (v / maxTotal) * chartH;
                  cursorY -= h;
                  return (
                    <rect
                      key={t}
                      x={x}
                      y={cursorY}
                      width={barWidth}
                      height={h}
                      fill={TYPE_COLOR[t] ?? "var(--color-fg-mute)"}
                    >
                      <title>{`${TYPE_LABEL[t] ?? t} · ${year.annee} : ${fmtEuro(v)}`}</title>
                    </rect>
                  );
                })}
                {year.total > 0 && (
                  <text
                    x={xCenter}
                    y={padT + chartH - (year.total / maxTotal) * chartH - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    fill="var(--color-fg-mute)"
                  >
                    {fmtCompact(year.total)}
                  </text>
                )}
                <text
                  x={xCenter}
                  y={height - padB + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fill="var(--color-fg-dim)"
                >
                  {year.annee}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
