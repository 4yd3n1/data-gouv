import { fmtDate, fmtEuro } from "@/lib/format";

const TYPE_COLORS: Record<string, string> = {
  MISE_EN_DEMEURE: "#f59e0b",
  SANCTION: "#f43f5e",
  RETRAIT_AUTORISATION: "#f43f5e",
  AVERTISSEMENT: "#64748b",
  AMENDE: "#f43f5e",
};

const TYPE_LABELS: Record<string, string> = {
  MISE_EN_DEMEURE: "Mise en demeure",
  SANCTION: "Sanction",
  RETRAIT_AUTORISATION: "Retrait d'autorisation",
  AVERTISSEMENT: "Avertissement",
  AMENDE: "Amende",
};

interface Signalement {
  id: string;
  date: Date;
  type: string;
  motif: string;
  montant: number | null;
  referenceArcom: string | null;
  resume: string;
  filiale: {
    nom: string;
    groupe: { nomCourt: string };
  };
}

interface ArcomSectionProps {
  signalements: Signalement[];
  totalAmendes: number;
  channelCount: number;
}

export function ArcomSection({ signalements, totalAmendes, channelCount }: ArcomSectionProps) {
  // Group by year for timeline — use UTC to avoid SSR/client timezone mismatch
  // (a date near year boundary could bucket differently on server vs browser)
  const byYear: Record<number, Signalement[]> = {};
  for (const s of signalements) {
    const y = new Date(s.date).getUTCFullYear();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(s);
  }
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-panel rounded-lg px-4 py-3">
          <p className="text-2xl font-bold data-value text-rose">{signalements.length}</p>
          <p className="text-[11px] text-bureau-500">signalements recenses</p>
        </div>
        <div className="glass-panel rounded-lg px-4 py-3">
          <p className="text-2xl font-bold data-value text-amber">{fmtEuro(totalAmendes)}</p>
          <p className="text-[11px] text-bureau-500">total des amendes prononcees</p>
        </div>
        <div className="glass-panel rounded-lg px-4 py-3">
          <p className="text-2xl font-bold data-value text-bureau-200">{channelCount}</p>
          <p className="text-[11px] text-bureau-500">chaines concernees</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-panel rounded-xl p-6">
        <p className="text-[9px] uppercase tracking-[0.2em] text-bureau-600 mb-4">
          Chronologie des decisions
        </p>

        <div className="space-y-6">
          {years.map((year) => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold data-value text-bureau-300">{year}</span>
                <span className="h-[1px] flex-1 bg-bureau-700/30" />
                <span className="text-[10px] data-value text-bureau-600">
                  {byYear[year].length} decision{byYear[year].length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-2 pl-4 border-l border-bureau-700/20">
                {byYear[year].map((s) => {
                  const color = TYPE_COLORS[s.type] ?? "#64748b";
                  return (
                    <div key={s.id} className="relative pl-4">
                      {/* Timeline dot */}
                      <span
                        className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full"
                        style={{ background: color }}
                      />

                      <div className="flex flex-wrap items-baseline gap-2">
                        {/* Type badge */}
                        <span
                          className="inline-block rounded-sm px-1.5 py-0.5 text-[9px] font-medium"
                          style={{
                            background: `${color}15`,
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {TYPE_LABELS[s.type] ?? s.type}
                        </span>

                        {/* Channel + group */}
                        <span className="text-xs font-medium text-bureau-200">
                          {s.filiale.nom}
                        </span>
                        <span className="text-[10px] text-bureau-600">
                          ({s.filiale.groupe.nomCourt})
                        </span>

                        {/* Date */}
                        <span className="text-[10px] data-value text-bureau-600 ml-auto">
                          {fmtDate(s.date)}
                        </span>
                      </div>

                      {/* Motif */}
                      <p className="mt-0.5 text-xs text-bureau-400">{s.motif}</p>

                      {/* Amount if applicable */}
                      {s.montant != null && s.montant > 0 && (
                        <p className="mt-0.5 text-xs font-semibold data-value text-rose">
                          {fmtEuro(s.montant)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
