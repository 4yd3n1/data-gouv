import Link from "next/link";

export interface DeptMapItem {
  code: string;
  libelle: string;
  value: number;
}

interface DeptMapProps {
  data: DeptMapItem[];
  color?: "teal" | "amber" | "rose" | "blue";
  unit?: string;
  limit?: number;
  linkBase?: string; // e.g. "/territoire/" — links to /territoire/[code]
}

const BAR_COLORS = {
  teal:  { bar: "bg-teal/40",   text: "text-teal",   border: "border-teal/20" },
  amber: { bar: "bg-amber/40",  text: "text-amber",  border: "border-amber/20" },
  rose:  { bar: "bg-rose/40",   text: "text-rose",   border: "border-rose/20" },
  blue:  { bar: "bg-blue-400/40", text: "text-blue-400", border: "border-blue-400/20" },
};

function fmtValue(v: number, unit: string) {
  if (unit === "€" || unit === "€/hab") {
    return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${unit}`;
  }
  if (unit === "%") {
    return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%`;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}${unit ? ` ${unit}` : ""}`;
}

export function DeptMap({
  data,
  color = "teal",
  unit = "",
  limit = 20,
  linkBase,
}: DeptMapProps) {
  if (!data.length) {
    return (
      <p className="text-sm text-bureau-500 italic">Aucune donnée disponible.</p>
    );
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, limit);
  const max = shown[0]?.value ?? 1;
  const c = BAR_COLORS[color];

  return (
    <div className="space-y-1.5">
      {shown.map((item, i) => {
        const pct = Math.max(2, (item.value / max) * 100);
        const row = (
          <div
            key={item.code}
            className="group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-bureau-800/40"
          >
            {/* Rank */}
            <span className="w-6 shrink-0 text-right text-[10px] font-mono text-bureau-600">
              {i + 1}
            </span>

            {/* Dept code badge */}
            <span className="w-8 shrink-0 rounded bg-bureau-700/40 px-1 py-0.5 text-center text-[10px] font-mono text-bureau-400">
              {item.code}
            </span>

            {/* Label + bar */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-bureau-300 group-hover:text-bureau-100 transition-colors">
                  {item.libelle}
                </span>
                <span className={`shrink-0 text-xs font-medium tabular-nums ${c.text}`}>
                  {fmtValue(item.value, unit)}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-bureau-700/40">
                <div
                  className={`h-full rounded-full ${c.bar} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );

        if (linkBase) {
          return (
            <Link
              key={item.code}
              href={`${linkBase}${item.code}`}
              className="block"
            >
              {row}
            </Link>
          );
        }
        return row;
      })}

      {data.length > limit && (
        <p className="px-3 pt-1 text-xs text-bureau-600">
          + {data.length - limit} autres départements
        </p>
      )}
    </div>
  );
}
