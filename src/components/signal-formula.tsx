import { SIGNAL_REGISTRY } from "@/lib/signal-types";
import type { SignalType } from "@/lib/signals";

export interface SignalFormulaProps {
  type: SignalType;
  /** Inline (compact) for embedding under a banner; block (default) for full callout. */
  variant?: "inline" | "block";
  className?: string;
}

/**
 * Expandable "Comment ce signal est calculé ?" callout. Reads the formula,
 * thresholds, caveat, and methodology anchor from `SIGNAL_REGISTRY`. Always
 * renders the caveat — never opt-out. See memory/feedback_signal_caveats.md.
 */
export function SignalFormula({
  type,
  variant = "block",
  className = "",
}: SignalFormulaProps) {
  const entry = SIGNAL_REGISTRY[type];
  const thresholdEntries = entry.thresholds
    ? (Object.entries(entry.thresholds) as [
        "critique" | "notable" | "informatif",
        string,
      ][]).filter(([, v]) => Boolean(v))
    : [];

  const containerClass =
    variant === "inline"
      ? `mt-2 text-[12px] ${className}`
      : `mt-3 rounded border border-fg-faint/20 bg-ink-1/30 p-3 text-[12px] ${className}`;

  return (
    <details className={containerClass}>
      <summary className="cursor-pointer list-none text-fg-mute hover:text-fg">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-[0.08em] text-[11px]">
          <svg
            width="9"
            height="9"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
            <path
              d="M6 4v0M6 5.5v3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="square"
            />
          </svg>
          Comment ce signal est calculé&nbsp;?
        </span>
      </summary>

      <div className="mt-2 space-y-2 text-fg-mute">
        <p className="leading-relaxed">{entry.formula}</p>

        {thresholdEntries.length > 0 ? (
          <dl className="space-y-1 border-l border-fg-faint/30 pl-3">
            {thresholdEntries.map(([sev, text]) => (
              <div key={sev} className="flex gap-2">
                <dt
                  className={`shrink-0 text-[10px] font-medium uppercase tracking-[0.1em] ${
                    sev === "critique"
                      ? "severity-critique"
                      : sev === "notable"
                        ? "severity-notable"
                        : "severity-informatif"
                  }`}
                >
                  {sev}
                </dt>
                <dd className="text-fg-mute">{text}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <p className="border-t border-fg-faint/20 pt-2 italic text-fg-faint">
          {entry.caveat}
        </p>

        <a
          href={entry.methodologyAnchor}
          className="inline-flex items-center gap-1 text-fg-mute hover:text-fg"
        >
          Voir la méthodologie complète
          <svg
            width="9"
            height="9"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 6h6m-2-2 2 2-2 2"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="square"
            />
          </svg>
        </a>
      </div>
    </details>
  );
}
