import { fmt } from "@/lib/format";

export function StatCard({
  value,
  label,
  accent = "teal",
  delay = 0,
}: {
  value: number;
  label: string;
  accent?: "teal" | "amber" | "rose" | "blue";
  delay?: number;
}) {
  const colors = {
    teal: "text-teal border-teal/20 glow-teal",
    amber: "text-amber border-amber/20 glow-amber",
    rose: "text-rose border-rose/20",
    blue: "text-blue border-blue/20",
  };

  return (
    <div
      className={`fade-up delay-${delay} rounded-xl border bg-bureau-800/50 p-5 ${colors[accent]}`}
    >
      <p className="text-3xl font-bold tracking-tight">{fmt(value)}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-bureau-400">{label}</p>
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  );
}
