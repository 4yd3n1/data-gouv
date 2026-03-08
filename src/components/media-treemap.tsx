interface TreemapCell {
  slug: string;
  nomCourt: string;
  count: number;
  color: string;
  pct: number;
}

interface MediaTreemapProps {
  groups: TreemapCell[];
}

export function MediaTreemap({ groups }: MediaTreemapProps) {
  const sorted = [...groups].sort((a, b) => b.count - a.count);

  const topRow = sorted.slice(0, 4);
  const bottomRow = sorted.slice(4);
  const topTotal = topRow.reduce((s, g) => s + g.count, 0);
  const bottomTotal = bottomRow.reduce((s, g) => s + g.count, 0);

  return (
    <div className="rounded-xl border border-bureau-700/20 overflow-hidden">
      {/* Top row — large cells */}
      <div className="flex" style={{ height: "200px" }}>
        {topRow.map((g) => (
          <div
            key={g.slug}
            className="relative flex flex-col justify-end p-3
                       border-r border-bureau-700/10 last:border-r-0
                       group transition-all duration-300
                       hover:brightness-110"
            style={{
              width: `${(g.count / topTotal) * 100}%`,
              background: `${g.color}12`,
            }}
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: g.color, opacity: 0.4 }}
            />
            {/* Large count */}
            <span
              className="text-3xl font-bold data-value opacity-20
                         group-hover:opacity-40 transition-opacity"
              style={{ color: g.color }}
            >
              {g.count}
            </span>
            <span className="text-sm font-medium text-bureau-200 mt-1">
              {g.nomCourt}
            </span>
            <span className="text-[10px] text-bureau-500 data-value">
              {g.pct}% du total
            </span>
          </div>
        ))}
      </div>

      {/* Bottom row — smaller cells */}
      {bottomRow.length > 0 && (
        <div
          className="flex border-t border-bureau-700/10"
          style={{ height: "100px" }}
        >
          {bottomRow.map((g) => (
            <div
              key={g.slug}
              className="relative flex flex-col justify-end p-2
                         border-r border-bureau-700/10 last:border-r-0
                         transition-all duration-300 hover:brightness-110"
              style={{
                width: `${(g.count / (bottomTotal || 1)) * 100}%`,
                background: `${g.color}08`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: g.color, opacity: 0.25 }}
              />
              <span
                className="text-lg font-bold data-value opacity-15"
                style={{ color: g.color }}
              >
                {g.count}
              </span>
              <span className="text-[11px] text-bureau-300 truncate">
                {g.nomCourt}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
