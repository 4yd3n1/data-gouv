export type BarRowItem = {
  label: string;
  value: number;
  display?: string;
  color?: string;
  href?: string;
};

export function BarRows({
  items,
  barHeight = 12,
  max,
  labelWidth = 160,
}: {
  items: readonly BarRowItem[];
  barHeight?: number;
  max?: number;
  labelWidth?: number;
}) {
  if (!items.length) return null;
  const m = max ?? Math.max(...items.map((i) => i.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <div
          key={`${it.label}-${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: `${labelWidth}px 1fr auto`,
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-mute)",
              letterSpacing: "0.1em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {it.label}
          </div>
          <div
            style={{
              position: "relative",
              height: barHeight,
              background: "var(--color-ink-2)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(it.value / m) * 100}%`,
                background: it.color ?? "var(--color-signal)",
              }}
            />
          </div>
          <div
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg)",
              width: 56,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {it.display ?? it.value.toLocaleString("fr-FR")}
          </div>
        </div>
      ))}
    </div>
  );
}
