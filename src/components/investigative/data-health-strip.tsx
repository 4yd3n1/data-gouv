export type HealthCell = {
  source: string;
  label: string;
  status: "ok" | "stale" | "error" | "scheduled";
  timestamp?: string;
  summary: string;
};

const STATUS_COLOR: Record<HealthCell["status"], string> = {
  ok: "oklch(0.72 0.12 150)",
  stale: "var(--color-warn)",
  error: "var(--color-signal)",
  scheduled: "var(--color-fg-dim)",
};

function formatTimeShort(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (sameDay) {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function DataHealthStrip({ cells }: { cells: readonly HealthCell[] }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        background: "var(--color-ink-1)",
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "var(--fs-mono-xs)",
        color: "var(--color-fg-mute)",
        letterSpacing: "0.1em",
      }}
    >
      {cells.map((c, i) => (
        <div
          key={c.source}
          style={{
            padding: "14px 16px",
            borderLeft: i === 0 ? "none" : "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: STATUS_COLOR[c.status],
                flexShrink: 0,
              }}
              aria-label={c.status}
            />
            <span style={{ color: "var(--color-fg)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {c.label}
            </span>
          </div>
          <div style={{ textTransform: "uppercase" }}>
            {c.status === "scheduled" ? "Prévue" : c.status.toUpperCase()} ·{" "}
            {formatTimeShort(c.timestamp)}
          </div>
          <div style={{ color: "var(--color-fg)", fontVariantNumeric: "tabular-nums" }}>{c.summary}</div>
        </div>
      ))}
    </div>
  );
}
