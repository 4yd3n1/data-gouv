export function BriefingRow({
  total,
  critique,
  openedRecent,
}: {
  total: number;
  critique: number;
  openedRecent?: number;
}) {
  const now = new Date();
  const dateStr = now
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "center",
        gap: 24,
        padding: "12px 40px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="pulse" aria-hidden />
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-sm)",
            color: "var(--color-signal)",
            letterSpacing: "0.14em",
          }}
        >
          Briefing du matin
        </span>
        <span
          className="obs-mono"
          style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
        >
          //
        </span>
        <span
          className="obs-mono"
          style={{ color: "var(--color-fg-mute)", fontSize: "var(--fs-mono-xs)" }}
        >
          {dateStr}
        </span>
      </div>
      <div
        className="obs-mono"
        style={{
          fontSize: "var(--fs-mono-xs)",
          color: "var(--color-fg-mute)",
          letterSpacing: "0.1em",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span>
          <span style={{ color: "var(--color-signal)" }}>●</span>{" "}
          <span style={{ color: "var(--color-fg)" }}>
            {critique} {critique > 1 ? "signaux critiques" : "signal critique"}
          </span>
        </span>
        <span style={{ color: "var(--color-fg-faint)" }}>·</span>
        <span>
          <span style={{ color: "var(--color-fg)" }}>{total} ouverts</span>
        </span>
        {openedRecent !== undefined && (
          <>
            <span style={{ color: "var(--color-fg-faint)" }}>·</span>
            <span>
              <span style={{ color: "var(--color-fg)" }}>
                +{openedRecent} cette semaine
              </span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
