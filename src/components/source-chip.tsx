import { fmtShortDate } from "@/lib/format";

export type SourceType = "officiel" | "presse" | "calcul";

export interface SourceChipProps {
  outlet: string;
  url?: string | null;
  date?: Date | string | null;
  type?: SourceType;
  basis?: string | null;
}

const TYPE_LABEL: Record<SourceType, string> = {
  officiel: "Source officielle",
  presse: "Presse",
  calcul: "Calcul",
};

const TYPE_DOT_CLASS: Record<SourceType, string> = {
  officiel: "bg-[var(--color-verified,theme(colors.slate.400))]",
  presse: "bg-fg-mute/70",
  calcul: "bg-[var(--color-warn,theme(colors.amber.400))]",
};

/**
 * Claim-level source attribution. Replaces ad-hoc inline `<a>` source links.
 *
 * For computed indicators, pass `basis: "d'après HATVP + AN"` — it renders as
 * a small italic line below the chip and is preserved verbatim. Never flatten
 * computed-indicator provenance to bare "Calcul" — see
 * memory/feedback_source_provenance.md.
 */
export function SourceChip({
  outlet,
  url,
  date,
  type = "officiel",
  basis,
}: SourceChipProps) {
  const dateLabel = date ? fmtShortDate(date) : null;
  const inner = (
    <span className="inline-flex items-center gap-1.5 text-[11px] leading-none">
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT_CLASS[type]}`}
      />
      <span className="font-medium uppercase tracking-[0.06em] text-fg-mute">
        {outlet}
      </span>
      {dateLabel ? (
        <>
          <span className="text-fg-faint" aria-hidden>
            ·
          </span>
          <span className="text-fg-mute">{dateLabel}</span>
        </>
      ) : null}
    </span>
  );

  return (
    <span className="inline-flex flex-col gap-0.5">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${TYPE_LABEL[type]} : ${outlet}${dateLabel ? `, ${dateLabel}` : ""}`}
          className="inline-flex w-fit items-center gap-1.5 rounded border border-fg-faint/30 bg-ink-1/40 px-2 py-1 hover:border-fg-mute/50 hover:bg-ink-1/60"
        >
          {inner}
          <svg
            width="9"
            height="9"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
            className="text-fg-faint"
          >
            <path
              d="M3 3h6v6M3 9l6-6"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="square"
            />
          </svg>
        </a>
      ) : (
        <span
          aria-label={`${TYPE_LABEL[type]} : ${outlet}${dateLabel ? `, ${dateLabel}` : ""}`}
          className="inline-flex w-fit items-center rounded border border-fg-faint/20 bg-ink-1/30 px-2 py-1"
        >
          {inner}
        </span>
      )}
      {basis ? (
        <span className="pl-1 text-[11px] italic text-fg-faint">{basis}</span>
      ) : null}
    </span>
  );
}
