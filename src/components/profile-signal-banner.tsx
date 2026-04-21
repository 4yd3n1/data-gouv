import Link from "next/link";
import { getSignals, SIGNAL_TYPE_LABELS, type SignalType } from "@/lib/signals";
import type { SignalSeverity } from "@/lib/signal-types";

const SEVERITY_STYLES: Record<
  SignalSeverity,
  {
    label: string;
    container: string;
    tag: string;
    pulse: string;
  }
> = {
  CRITIQUE: {
    label: "À surveiller",
    container: "border-rose/40 bg-rose/5",
    tag: "bg-rose/20 text-rose border-rose/40",
    pulse: "bg-rose",
  },
  NOTABLE: {
    label: "Signaux notables",
    container: "border-amber/30 bg-amber/5",
    tag: "bg-amber/20 text-amber border-amber/40",
    pulse: "bg-amber",
  },
  INFORMATIF: {
    label: "Signaux informatifs",
    container: "border-teal/20 bg-teal/5",
    tag: "bg-teal/20 text-teal border-teal/40",
    pulse: "bg-teal",
  },
};

const TYPE_CHIP_STYLE: Record<SignalType, string> = {
  conflit: "border-rose/30 text-rose",
  porte: "border-amber/30 text-amber",
  lobby: "border-amber/30 text-amber",
  media: "border-rose/30 text-rose",
  ecart: "border-amber/30 text-amber",
  dissidence: "border-teal/30 text-teal",
};

/**
 * Banner shown above a profile's tabs. Reads from the unified signal cache
 * (React.cache) — no extra DB work if getSignals() was already called in the
 * same request.
 *
 * `keys` is the list of personKeys to try (e.g. `["ministre:bruno-le-maire",
 * "depute:PA721488"]`) — the first match wins.
 */
export async function ProfileSignalBanner({ keys }: { keys: string[] }) {
  const all = await getSignals();
  const match = all.find((s) => keys.includes(s.personKey));
  if (!match) return null;

  const style = SEVERITY_STYLES[match.severity];
  const topNarrative = match.narratives[0];
  const extraCount = match.narratives.length - 1;

  return (
    <div
      className={`mx-auto mt-5 max-w-6xl rounded-xl border ${style.container} px-5 py-3.5`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${style.pulse} shadow-[0_0_6px_currentColor]`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-200">
                {style.label}
              </span>
              <div className="flex flex-wrap gap-1">
                {match.types.map((t) => (
                  <span
                    key={t}
                    className={`rounded-full border px-1.5 py-px text-[10px] uppercase tracking-wider bg-bureau-900/30 ${TYPE_CHIP_STYLE[t]}`}
                  >
                    {SIGNAL_TYPE_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>
            {topNarrative && (
              <p className="mt-1.5 text-sm leading-snug text-bureau-200">
                {topNarrative.headline}
                {topNarrative.detail && (
                  <span className="text-bureau-500">
                    {" · "}
                    {topNarrative.detail}
                  </span>
                )}
              </p>
            )}
            {extraCount > 0 && (
              <p className="mt-1 text-xs text-bureau-500">
                + {extraCount} autre{extraCount > 1 ? "s" : ""} signal
                {extraCount > 1 ? "s" : ""} recensé{extraCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/signaux"
          className="shrink-0 text-xs text-bureau-400 transition-colors hover:text-bureau-200"
        >
          Méthodologie →
        </Link>
      </div>
    </div>
  );
}
