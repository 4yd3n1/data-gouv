import Link from "next/link";
import { ReactNode } from "react";
import { Eyebrow } from "./eyebrow";

export function InteractiveStrip({
  href,
  kicker,
  headline,
  dek,
  cta,
  icon,
}: {
  href: string;
  kicker: string;
  headline: ReactNode;
  dek: string;
  cta: string;
  icon?: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        background: "var(--color-ink-1)",
        padding: "22px 24px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 28,
        alignItems: "center",
      }}
      className="interactive-strip"
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          {icon ?? (
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
              <rect x="2" y="10" width="2.5" height="4" fill="var(--color-signal)" />
              <rect x="6" y="6" width="2.5" height="8" fill="var(--color-signal-soft)" />
              <rect x="10" y="3" width="2.5" height="11" fill="var(--color-fg-mute)" />
            </svg>
          )}
          <Eyebrow>{kicker}</Eyebrow>
        </div>
        <div
          className="obs-serif"
          style={{
            fontSize: 28,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            color: "var(--color-fg)",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: "var(--color-fg-mute)",
            fontSize: 14,
            marginTop: 8,
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          {dek}
        </div>
      </div>
      <Link
        href={href}
        className="obs-mono"
        style={{
          padding: "14px 20px",
          border: "1px solid var(--color-fg)",
          color: "var(--color-fg)",
          fontSize: "var(--fs-mono-sm)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
