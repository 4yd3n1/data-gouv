import Link from "next/link";
import type { UnifiedSignal } from "@/lib/signals";
import { SignalCardC } from "./signal-card-c";

export function SignalsRail({
  signals,
  total,
  critique,
  compact = false,
  maxItems = 5,
  sticky = false,
}: {
  signals: readonly UnifiedSignal[];
  total: number;
  critique: number;
  compact?: boolean;
  maxItems?: number;
  sticky?: boolean;
}) {
  const items = signals.slice(0, maxItems);
  return (
    <aside
      style={{
        border: "1px solid var(--line)",
        background: "var(--color-ink-1)",
        display: "flex",
        flexDirection: "column",
        position: sticky ? "sticky" : "static",
        top: sticky ? "56px" : undefined,
        alignSelf: "start",
        maxHeight: sticky ? "calc(100vh - 72px)" : undefined,
      }}
    >
      <header
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span className="pulse" aria-hidden />
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-sm)",
            color: "var(--color-signal)",
            letterSpacing: "0.14em",
          }}
        >
          Signaux en Direct
        </span>
      </header>
      <div style={{ flex: 1, overflow: "auto" }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              color: "var(--color-fg-mute)",
              fontSize: 13,
            }}
          >
            Aucun signal actif.
          </div>
        ) : (
          items.map((s, i) => (
            <SignalCardC key={s.personKey} signal={s} compact={compact} index={i} />
          ))
        )}
      </div>
      <footer
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "var(--fs-mono-xs)",
          color: "var(--color-fg-mute)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span>
          {total} signaux ·{" "}
          <span style={{ color: "var(--color-signal)" }}>{critique} critiques</span>
        </span>
        <Link
          href="/signaux"
          style={{ color: "var(--color-fg)", textDecoration: "none" }}
        >
          Voir tous →
        </Link>
      </footer>
    </aside>
  );
}
