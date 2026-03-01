import Link from "next/link";
import { fmt } from "@/lib/format";

interface GroupeVoteRow {
  pour: number;
  contre: number;
  abstentions: number;
}

interface ScrutinRow {
  id: string;
  titre: string;
  dateScrutin: Date;
  sortCode: string;
  groupeVotes: GroupeVoteRow[];
}

interface TopicVoteListProps {
  scrutins: ScrutinRow[];
}

function SortBadge({ sortCode }: { sortCode: string }) {
  const s = sortCode.toLowerCase();
  const config =
    s === "adopté"
      ? "border-teal/30 bg-teal/10 text-teal"
      : s === "rejeté"
        ? "border-rose/30 bg-rose/10 text-rose"
        : "border-bureau-600/30 bg-bureau-700/30 text-bureau-400";
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${config}`}>
      {sortCode}
    </span>
  );
}

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
      <div className="bg-bureau-500/60" style={{ width: `${aPct}%` }} />
    </div>
  );
}

export function TopicVoteList({ scrutins }: TopicVoteListProps) {
  if (scrutins.length === 0) {
    return (
      <p className="text-sm text-bureau-500">Aucun scrutin trouvé pour ce sujet.</p>
    );
  }

  return (
    <div className="divide-y divide-bureau-700/30 rounded-xl border border-bureau-700/30 overflow-hidden">
      {scrutins.map((s) => {
        const totalPour = s.groupeVotes.reduce((acc, g) => acc + g.pour, 0);
        const totalContre = s.groupeVotes.reduce((acc, g) => acc + g.contre, 0);
        const totalAbst = s.groupeVotes.reduce((acc, g) => acc + g.abstentions, 0);
        const date = new Date(s.dateScrutin).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <Link
            key={s.id}
            href={`/gouvernance/scrutins/${s.id}`}
            className="flex flex-col gap-2 bg-bureau-800/20 px-5 py-4 transition-colors hover:bg-bureau-800/40"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-bureau-200 leading-snug line-clamp-2">{s.titre}</p>
              <SortBadge sortCode={s.sortCode} />
            </div>
            <div className="flex items-center gap-4">
              <GroupBar pour={totalPour} contre={totalContre} abstentions={totalAbst} />
              <div className="shrink-0 flex items-center gap-2 text-[10px] text-bureau-500">
                <span className="text-teal">{fmt(totalPour)} pour</span>
                <span className="text-rose">{fmt(totalContre)} contre</span>
                <span>{date}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
