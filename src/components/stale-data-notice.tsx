import { fmtDate } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_DAYS = 90;

export interface StaleDataNoticeProps {
  date: Date | string | null | undefined;
  /** Source-specific phrasing — e.g. "Cette fiche n'a pas été mise à jour". */
  message?: string;
  className?: string;
}

/**
 * Amber banner shown when a profile's `derniereMaj` is older than 90 days.
 * Renders nothing when data is fresh. The threshold matches `DataFreshnessBadge`.
 */
export function StaleDataNotice({
  date,
  message = "Cette fiche n'a pas été mise à jour récemment. Certaines informations peuvent être obsolètes.",
  className = "",
}: StaleDataNoticeProps) {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  // eslint-disable-next-line react-hooks/purity -- Staleness is intentionally based on wall-clock time.
  const ageDays = (Date.now() - d.getTime()) / DAY_MS;
  if (ageDays <= STALE_DAYS) return null;

  return (
    <aside
      role="note"
      className={`flex items-start gap-3 rounded-md border border-amber-600/40 bg-amber-950/15 px-4 py-3 text-sm text-amber-200 ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
        className="mt-0.5 shrink-0"
      >
        <path
          d="M8 1.5 1.5 14h13L8 1.5Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M8 6v4M8 11.5v.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        <p className="mt-1 text-[12px] text-amber-300/80">
          Dernière mise à jour : {fmtDate(d)}.
        </p>
      </div>
    </aside>
  );
}
