import { Spark } from "./spark";
import type { IndiceSpec } from "@/data/indices";

export function IndicesPanel({ data }: { data: readonly IndiceSpec[] }) {
  return (
    <div
      className="obs-card"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.14em",
            color: "var(--color-fg-mute)",
          }}
        >
          Indices du jour
        </span>
        <span
          className="obs-mono"
          style={{ fontSize: "var(--fs-mono-xs)", color: "var(--color-fg-dim)" }}
        >
          Base 100 = 2017
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {data.map((x) => {
          const deltaColor = x.neg ? "var(--color-signal)" : "oklch(0.75 0.1 150)";
          return (
            <div key={x.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span
                className="obs-mono"
                style={{
                  fontSize: 9.5,
                  color: "var(--color-fg-mute)",
                  letterSpacing: "0.1em",
                }}
              >
                {x.label}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  className="obs-serif"
                  style={{
                    fontSize: 24,
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--color-fg)",
                    lineHeight: 1,
                  }}
                >
                  {x.valueBase100.toFixed(1)}
                </span>
                <span
                  className="obs-mono"
                  style={{ fontSize: 10, color: deltaColor }}
                >
                  {x.delta}
                </span>
              </div>
              <Spark data={x.spark} width={140} height={22} color={deltaColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
