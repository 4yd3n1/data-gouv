import Link from "next/link";
import type { UnifiedSignal } from "@/lib/signals";

type Tone = "red" | "verified" | "amber" | "neutral";

function severityToTone(sev: UnifiedSignal["severity"]): Tone {
  if (sev === "CRITIQUE") return "red";
  if (sev === "NOTABLE") return "amber";
  return "neutral";
}

function primaryTypeLabel(types: UnifiedSignal["types"]): string {
  if (!types.length) return "Signal";
  const map: Record<string, string> = {
    conflit: "Conflits",
    porte: "Portes tournantes",
    lobby: "Lobbying",
    media: "Médias",
    ecart: "Écarts HATVP",
    dissidence: "Dissidences",
  };
  return map[types[0]] ?? types[0].toUpperCase();
}

export function SignalCardC({
  signal,
  compact = false,
  index = 0,
}: {
  signal: UnifiedSignal;
  compact?: boolean;
  index?: number;
}) {
  const tone = severityToTone(signal.severity);
  const toneClass =
    tone === "verified"
      ? "sig-tag--verified"
      : tone === "amber"
        ? "sig-tag--amber"
        : tone === "neutral"
          ? "sig-tag--neutral"
          : "";
  const narrative = signal.narratives[0];

  return (
    <article
      style={{
        padding: compact ? "12px 14px" : "14px 16px",
        borderTop: index === 0 ? "none" : "1px solid var(--line)",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          gap: 8,
        }}
      >
        <span className={`sig-tag ${toneClass}`}>{primaryTypeLabel(signal.types)}</span>
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-dim)",
            letterSpacing: "0.1em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "60%",
          }}
          title={signal.subtitle}
        >
          {signal.subtitle}
        </span>
      </div>
      <Link href={signal.href} style={{ textDecoration: "none", color: "inherit" }}>
        <div
          className="obs-serif"
          style={{
            fontSize: compact ? 15 : 16,
            letterSpacing: "-0.005em",
            color: "var(--color-fg)",
            lineHeight: 1.2,
          }}
        >
          {signal.prenom} {signal.nom.toUpperCase()}
        </div>
      </Link>
      {!compact && narrative && (
        <div
          style={{
            color: "var(--color-fg-mute)",
            fontSize: 12.5,
            marginTop: 5,
            lineHeight: 1.4,
            textWrap: "pretty" as const,
          }}
        >
          {narrative.headline}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          gap: 8,
        }}
      >
        <Link
          href={signal.href}
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg)",
            textDecoration: "none",
            letterSpacing: "0.10em",
          }}
        >
          Analyser →
        </Link>
        {signal.types.length > 1 && (
          <span
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-dim)",
            }}
          >
            +{signal.types.length - 1} type{signal.types.length - 1 > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </article>
  );
}
