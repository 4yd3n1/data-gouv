import type { SignalSeverity } from "@/lib/signal-types";

const SEVERITY_STYLES: Record<SignalSeverity, { border: string; bg: string; badge: string }> = {
  CRITIQUE: {
    border: "border-rose/20",
    bg: "bg-rose/5",
    badge: "severity-critique",
  },
  NOTABLE: {
    border: "border-amber/20",
    bg: "bg-amber/5",
    badge: "severity-notable",
  },
  INFORMATIF: {
    border: "border-teal/20",
    bg: "bg-teal/5",
    badge: "severity-informatif",
  },
};

export function SignalCard({
  severity,
  label,
  children,
}: {
  severity: SignalSeverity;
  label?: string;
  children: React.ReactNode;
}) {
  const s = SEVERITY_STYLES[severity];
  return (
    <div className={`stat-card rounded-xl border ${s.border} ${s.bg} p-5`}>
      {label && (
        <span className={`${s.badge} mb-3 inline-block`}>{label}</span>
      )}
      {children}
    </div>
  );
}
