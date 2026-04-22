export function Dateline({ revisionIso }: { revisionIso: string }) {
  const rev = new Date(revisionIso);
  const now = new Date();
  const dateStr = now
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
  const timeStr = `${String(rev.getUTCHours()).padStart(2, "0")}:${String(rev.getUTCMinutes()).padStart(2, "0")} UTC`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 40px",
        borderBottom: "1px solid var(--line)",
        background: "var(--color-ink-0)",
        flexWrap: "wrap",
      }}
    >
      <span className="pulse" aria-hidden />
      <span
        className="obs-mono"
        style={{
          fontSize: "var(--fs-mono-xs)",
          color: "var(--color-signal)",
          letterSpacing: "0.14em",
        }}
      >
        Signaux en direct
      </span>
      <span
        className="obs-mono"
        style={{ fontSize: "var(--fs-mono-xs)", color: "var(--color-fg-dim)" }}
        aria-hidden
      >
        //
      </span>
      <span
        className="obs-mono"
        style={{
          fontSize: "var(--fs-mono-xs)",
          color: "var(--color-fg-mute)",
          letterSpacing: "0.14em",
        }}
      >
        {dateStr}
      </span>
      <span style={{ flex: 1 }} />
      <span
        className="obs-mono"
        style={{
          fontSize: "var(--fs-mono-xs)",
          color: "var(--color-fg-dim)",
          letterSpacing: "0.14em",
        }}
      >
        Dernière ingestion · {timeStr}
      </span>
    </div>
  );
}
