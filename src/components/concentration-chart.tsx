const TYPE_LABELS: Record<string, string> = {
  TELEVISION: "Télévision",
  RADIO: "Radio",
  PRESSE_QUOTIDIENNE: "Presse quot.",
  PRESSE_MAGAZINE: "Magazines",
  NUMERIQUE: "Numérique",
};

const TYPES_ORDER = ["TELEVISION", "RADIO", "PRESSE_QUOTIDIENNE", "PRESSE_MAGAZINE", "NUMERIQUE"];

const GROUP_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

interface GroupData {
  slug: string;
  nomCourt: string;
  rang: number;
  filiales: Array<{ type: string }>;
}

interface ConcentrationChartProps {
  groups: GroupData[];
}

export function ConcentrationChart({ groups }: ConcentrationChartProps) {
  const sortedGroups = [...groups].sort((a, b) => a.rang - b.rang);
  const colorMap = new Map(sortedGroups.map((g, i) => [g.slug, GROUP_COLORS[i % GROUP_COLORS.length]]));
  const initialMap = new Map(sortedGroups.map((g) => [g.slug, g.nomCourt.charAt(0).toUpperCase()]));

  // Build count matrix: type -> group -> count
  const matrix: Record<string, Record<string, number>> = {};
  for (const type of TYPES_ORDER) {
    matrix[type] = {};
    for (const g of groups) {
      const count = g.filiales.filter((f) => f.type === type).length;
      if (count > 0) matrix[type][g.slug] = count;
    }
  }

  // Max total for consistent bar scaling
  const maxTotal = Math.max(
    ...TYPES_ORDER.map((t) => Object.values(matrix[t]).reduce((a, b) => a + b, 0)),
  );

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="space-y-3">
        {TYPES_ORDER.map((type, rowIdx) => {
          const segments = matrix[type];
          const total = Object.values(segments).reduce((a, b) => a + b, 0);
          if (total === 0) return null;

          // Threat indicator: if one group holds >50% of a type
          const groupPcts = sortedGroups
            .map((g) => (segments[g.slug] ?? 0) / total)
            .sort((a, b) => b - a);
          const topPct = groupPcts[0] ?? 0;
          const top2Pct = (groupPcts[0] ?? 0) + (groupPcts[1] ?? 0);
          const threatColor = topPct > 0.5
            ? "var(--color-rose)"
            : top2Pct > 0.7
              ? "var(--color-amber)"
              : "transparent";

          return (
            <div
              key={type}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: "90px 1fr 36px" }}
            >
              <span className="flex items-center gap-1.5 justify-end text-sm font-medium text-bureau-300">
                {threatColor !== "transparent" && (
                  <span
                    className="inline-block h-full w-[2px] rounded-full"
                    style={{ background: threatColor, minHeight: "16px" }}
                  />
                )}
                {TYPE_LABELS[type]}
              </span>
              <div
                className="flex h-8 overflow-hidden rounded-md"
                style={{
                  background: "rgba(17,24,39,0.4)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {sortedGroups.map((g) => {
                  const count = segments[g.slug];
                  if (!count) return null;
                  const pct = (count / maxTotal) * 100;
                  return (
                    <div
                      key={g.slug}
                      className="threat-bar flex items-center justify-center"
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: colorMap.get(g.slug),
                        opacity: 0.8,
                        transformOrigin: "left",
                        animationDelay: `${rowIdx * 0.15}s`,
                        animation: "threat-fill 1s cubic-bezier(0.4,0,0.2,1) both",
                        borderRadius: 0,
                      }}
                      title={`${g.nomCourt}: ${count} (${Math.round((count / total) * 100)}%)`}
                    >
                      {pct > 8 && (
                        <span className="truncate px-1 text-[10px] font-semibold text-white/90">
                          {initialMap.get(g.slug)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-xs font-semibold data-value text-bureau-500">{total}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-bureau-700/30 pt-3">
        {sortedGroups
          .filter((g) => g.filiales.length > 0)
          .map((g) => (
            <div key={g.slug} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: colorMap.get(g.slug), opacity: 0.8 }}
              />
              <span className="text-[11px] text-bureau-300">{g.nomCourt}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
