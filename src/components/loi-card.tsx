import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";

function GroupBar({ pour, contre, abstentions }: { pour: number; contre: number; abstentions: number }) {
  const total = pour + contre + abstentions;
  if (total === 0) return null;
  const pPct = (pour / total) * 100;
  const cPct = (contre / total) * 100;
  const aPct = (abstentions / total) * 100;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bureau-700/40">
      <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
      <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
      <div className="bg-amber/40" style={{ width: `${aPct}%` }} />
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  PLF: "Budget",
  PLFSS: "Séc. sociale",
  PROJET_LOI: "Projet de loi",
  PROPOSITION_LOI: "Proposition de loi",
  MOTION_CENSURE: "Motion de censure",
};

interface Props {
  slug: string;
  titreCourt: string;
  resumeSimple: string;
  type: string;
  statut: string;
  dateVote: Date | null;
  scrutinsCount: number;
  voteFinal?: { pour: number; contre: number; abstentions: number } | null;
}

export function LoiCard({ slug, titreCourt, resumeSimple, type, statut, dateVote, scrutinsCount, voteFinal }: Props) {
  return (
    <Link
      href={`/votes/lois/${slug}`}
      className="group flex flex-col gap-4 rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5 transition-colors hover:border-teal/30 hover:bg-bureau-800/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-bureau-700/50 px-2 py-0.5 text-xs text-bureau-400">
            {TYPE_LABELS[type] ?? type}
          </span>
          <ScrutinResultBadge sortCode={statut} />
        </div>
        {dateVote && (
          <span className="shrink-0 text-xs text-bureau-500">{fmtDate(dateVote)}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-serif text-lg text-bureau-100 group-hover:text-teal transition-colors">
        {titreCourt}
      </h3>

      {/* Summary */}
      <p className="line-clamp-3 text-sm text-bureau-400">{resumeSimple}</p>

      {/* Vote bar */}
      {voteFinal && (
        <div className="space-y-1.5">
          <GroupBar pour={voteFinal.pour} contre={voteFinal.contre} abstentions={voteFinal.abstentions} />
          <div className="flex gap-3 text-xs text-bureau-500">
            <span className="text-teal/80">Pour {voteFinal.pour}</span>
            <span className="text-rose/80">Contre {voteFinal.contre}</span>
            <span className="text-amber/70">Abst. {voteFinal.abstentions}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-xs text-bureau-600">
          {scrutinsCount} scrutin{scrutinsCount > 1 ? "s" : ""} liés
        </span>
        <span className="text-xs text-teal opacity-0 transition-opacity group-hover:opacity-100">
          Voir le détail →
        </span>
      </div>
    </Link>
  );
}
