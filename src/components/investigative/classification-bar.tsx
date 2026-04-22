export function ClassificationBar({ revisionIso }: { revisionIso: string }) {
  const rev = new Date(revisionIso);
  const formatted = `${rev.getUTCFullYear()}-${String(rev.getUTCMonth() + 1).padStart(2, "0")}-${String(rev.getUTCDate()).padStart(2, "0")} / ${String(rev.getUTCHours()).padStart(2, "0")}:${String(rev.getUTCMinutes()).padStart(2, "0")}Z`;
  return (
    <div
      className="obs-mono"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 16,
        padding: "6px 40px",
        background: "var(--color-ink-1)",
        borderBottom: "1px solid var(--line)",
        fontSize: "var(--fs-mono-xs)",
        color: "var(--color-fg-mute)",
        letterSpacing: "0.14em",
      }}
    >
      <span>Open source · Vérifiable · Horodaté</span>
      <span style={{ textAlign: "center", color: "var(--color-signal)" }}>
        ◆ Bureau des données publiques ◆
      </span>
      <span>Rév. {formatted}</span>
    </div>
  );
}
