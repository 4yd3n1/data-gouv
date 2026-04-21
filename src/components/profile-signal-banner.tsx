import Link from "next/link";
import { getSignals, SIGNAL_TYPE_LABELS, type SignalType } from "@/lib/signals";
import type { SignalSeverity } from "@/lib/signal-types";

const SEVERITY_RULE: Record<SignalSeverity, string> = {
  CRITIQUE: "bg-rose",
  NOTABLE: "bg-amber",
  INFORMATIF: "bg-teal",
};

const SEVERITY_LABEL: Record<SignalSeverity, string> = {
  CRITIQUE: "À surveiller",
  NOTABLE: "Signaux notables",
  INFORMATIF: "Signaux informatifs",
};

const TYPE_TEXT: Record<SignalType, string> = {
  conflit: "text-rose-300",
  porte: "text-amber-300",
  lobby: "text-amber-300",
  media: "text-rose-300",
  ecart: "text-amber-300",
  dissidence: "text-teal-300",
};

/**
 * Thin signal strip rendered below the tab bar of a profile page. Shows ALL
 * narratives stacked — no "+N others" copout. Left-edge coloured rule encodes
 * severity; no heavy border/background. Link to /signaux for methodology.
 */
export async function ProfileSignalBanner({ keys }: { keys: string[] }) {
  const all = await getSignals();
  const match = all.find((s) => keys.includes(s.personKey));
  if (!match) return null;

  return (
    <div className="mx-auto max-w-6xl px-6">
      <div className="relative rounded-r-sm border-l-2 border-bureau-800/60 bg-bureau-900/40 py-4 pl-5 pr-4">
        <span
          className={`absolute -left-[2px] top-0 bottom-0 w-[2px] ${SEVERITY_RULE[match.severity]}`}
        />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bureau-300">
                {SEVERITY_LABEL[match.severity]}
              </span>
              <span className="text-[11px] text-bureau-600">
                {match.types.map((t) => SIGNAL_TYPE_LABELS[t]).join(" · ")}
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {match.narratives.map((n, i) => {
                const type = match.types[Math.min(i, match.types.length - 1)];
                return (
                  <li key={i} className="text-sm leading-snug text-bureau-200">
                    <span className={`mr-2 text-[10px] uppercase tracking-wider ${TYPE_TEXT[type]}`}>
                      {SIGNAL_TYPE_LABELS[type]}
                    </span>
                    {n.headline}
                    {n.detail && <span className="text-bureau-500"> · {n.detail}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
          <Link
            href="/signaux"
            className="shrink-0 self-start text-xs text-bureau-500 transition-colors hover:text-bureau-300"
          >
            Méthodologie →
          </Link>
        </div>
      </div>
    </div>
  );
}
