import { Eyebrow } from "@/components/investigative/eyebrow";

export function SouveraineteTimeline({
  data,
}: {
  data: ReadonlyArray<{ year: number; count: number }>;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count));
  const width = 100;
  const barW = 100 / data.length;

  return (
    <section style={{ marginBottom: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <Eyebrow>FIG. 6</Eyebrow>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "var(--color-fg)",
            margin: 0,
          }}
        >
          Cadence annuelle
        </h2>
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-fg-mute)",
          margin: "8px 0 22px 0",
          maxWidth: "72ch",
        }}
      >
        Distribution annuelle des phases enregistrées (annonce, closing, veto,
        recapitalisation). Comporte les phases multi-année — les dossiers Atos
        ou Aubert & Duval apparaissent sur plusieurs lignes.
      </p>
      <div
        style={{
          border: "1px solid var(--color-ink-2)",
          padding: "24px 20px 12px",
          background: "var(--color-ink-1)",
        }}
      >
        <svg
          viewBox={`0 0 ${width} 36`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: 180, display: "block" }}
          aria-hidden
        >
          {data.map((d, i) => {
            const h = (d.count / max) * 32;
            return (
              <rect
                key={d.year}
                x={i * barW + 0.5}
                y={32 - h}
                width={barW - 1}
                height={h}
                fill="var(--color-signal)"
                opacity={0.85}
              />
            );
          })}
          <line
            x1={0}
            y1={32}
            x2={width}
            y2={32}
            stroke="var(--color-fg-faint)"
            strokeWidth={0.2}
          />
        </svg>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${data.length}, 1fr)`,
            gap: 0,
            marginTop: 8,
          }}
        >
          {data.map((d) => (
            <div
              key={d.year}
              className="obs-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--color-fg-mute)",
                textAlign: "center",
              }}
            >
              <div style={{ color: "var(--color-fg)", fontSize: 12 }}>
                {d.count}
              </div>
              <div>{d.year}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
