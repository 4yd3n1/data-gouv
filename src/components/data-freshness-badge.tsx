import { fmtDate } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 90;

export interface DataFreshnessBadgeProps {
  /** The timestamp being labelled. Pass `derniereMaj`, `IngestionLog.createdAt`, etc. */
  date: Date | string | null | undefined;
  /** Optional override prefix. Defaults to "Mise à jour". */
  prefix?: string;
  className?: string;
}

/**
 * Renders a "Mise à jour : 5 mai 2026" label. Goes amber when older than
 * 90 days. Reserved-word note: this component is deliberately NOT named
 * `LastVerifiedBadge` — "vérifié" is reserved for officially-verified facts.
 * See memory/feedback_verified_language.md.
 */
export function DataFreshnessBadge({
  date,
  prefix = "Mise à jour",
  className = "",
}: DataFreshnessBadgeProps) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  // eslint-disable-next-line react-hooks/purity -- Freshness labels intentionally use wall-clock time.
  const ageDays = (Date.now() - d.getTime()) / DAY_MS;
  const isStale = ageDays > STALE_DAYS;

  const colorClass = isStale
    ? "text-[var(--color-warn,theme(colors.amber.400))]"
    : "text-fg-faint";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] ${colorClass} ${className}`}
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
        <path d="M6 3.5v3l2 1" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
      </svg>
      <span>
        {prefix} : <span className="font-medium normal-case tracking-normal">{fmtDate(d)}</span>
      </span>
    </span>
  );
}
