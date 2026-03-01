import Link from "next/link";

interface RankingRow {
  code: string;
  libelle: string;
  valeur: number | null;
  rank?: number;
}

interface RankingTableProps {
  rows: RankingRow[];
  unit: string;
  label: string;
  territoireHref?: (code: string) => string;
  limit?: number;
}

export function RankingTable({
  rows,
  unit,
  label,
  territoireHref,
  limit = 10,
}: RankingTableProps) {
  const display = rows.slice(0, limit).filter((r) => r.valeur !== null);

  if (display.length === 0) {
    return (
      <p className="text-sm text-bureau-500">Données non disponibles.</p>
    );
  }

  const maxVal = Math.max(...display.map((r) => r.valeur ?? 0));

  return (
    <div className="rounded-xl border border-bureau-700/30 overflow-hidden">
      <div className="border-b border-bureau-700/30 bg-bureau-800/30 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-bureau-500">{label}</span>
        <span className="text-xs text-bureau-600">{unit}</span>
      </div>
      <div className="divide-y divide-bureau-700/20">
        {display.map((row, i) => {
          const rank = row.rank ?? i + 1;
          const pct = maxVal > 0 ? ((row.valeur ?? 0) / maxVal) * 100 : 0;
          const content = (
            <div className="flex items-center gap-3 bg-bureau-800/10 px-4 py-3 transition-colors hover:bg-bureau-800/30">
              <span className="w-6 shrink-0 text-center text-[10px] text-bureau-600">
                #{rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-bureau-200 truncate">{row.libelle}</span>
                  <span className="shrink-0 ml-2 text-sm font-medium text-bureau-100">
                    {row.valeur?.toLocaleString("fr-FR")}
                    <span className="ml-0.5 text-xs text-bureau-500">{unit}</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-bureau-700/40 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal/40"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );

          if (territoireHref) {
            return (
              <Link key={row.code} href={territoireHref(row.code)}>
                {content}
              </Link>
            );
          }
          return <div key={row.code}>{content}</div>;
        })}
      </div>
    </div>
  );
}
