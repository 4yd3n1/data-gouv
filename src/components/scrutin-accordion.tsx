"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  VOTE_FINAL: "Vote final",
  AMENDEMENT: "Amendement",
  ARTICLE: "Article",
  MOTION: "Motion",
  PROCEDURAL: "Procédural",
};

const ROLE_COLORS: Record<string, string> = {
  VOTE_FINAL: "bg-teal/10 text-teal",
  AMENDEMENT: "bg-blue/10 text-blue-400",
  ARTICLE: "bg-bureau-700/50 text-bureau-300",
  MOTION: "bg-amber/10 text-amber",
  PROCEDURAL: "bg-bureau-800/50 text-bureau-500",
};

interface ScrutinRow {
  id: string;
  titre: string;
  dateScrutin: Date;
  sortCode: string;
  pour: number;
  contre: number;
  abstentions: number;
  role: string;
}

interface Props {
  scrutins: ScrutinRow[];
  voteFinalId?: string;
}

const INITIAL_SHOWN = 5;

export function ScrutinAccordion({ scrutins, voteFinalId }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Always show VOTE_FINAL + first few; rest behind "show more"
  const finalVote = scrutins.find((s) => s.id === voteFinalId || s.role === "VOTE_FINAL");
  const others = scrutins.filter((s) => s.id !== finalVote?.id);
  const shown = expanded ? others : others.slice(0, INITIAL_SHOWN);
  const hidden = others.length - INITIAL_SHOWN;

  return (
    <div className="space-y-1">
      {/* Final vote always on top */}
      {finalVote && <ScrutinRow key={finalVote.id} scrutin={finalVote} />}

      {/* Other scrutins */}
      {shown.map((s) => (
        <ScrutinRow key={s.id} scrutin={s} />
      ))}

      {/* Show more toggle */}
      {!expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-bureau-700/40 py-2.5 text-xs text-bureau-400 hover:border-bureau-600/60 hover:text-bureau-300 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          {hidden} scrutin{hidden > 1 ? "s" : ""} supplémentaire{hidden > 1 ? "s" : ""}
        </button>
      )}
      {expanded && hidden > 0 && (
        <button
          onClick={() => setExpanded(false)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-bureau-700/40 py-2.5 text-xs text-bureau-400 hover:border-bureau-600/60 hover:text-bureau-300 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          Réduire
        </button>
      )}
    </div>
  );
}

function ScrutinRow({ scrutin }: { scrutin: ScrutinRow }) {
  const total = scrutin.pour + scrutin.contre + scrutin.abstentions;
  const pPct = total > 0 ? (scrutin.pour / total) * 100 : 0;
  const cPct = total > 0 ? (scrutin.contre / total) * 100 : 0;
  const aPct = total > 0 ? (scrutin.abstentions / total) * 100 : 0;

  return (
    <Link
      href={`/representants/scrutins/${scrutin.id}`}
      className="group flex items-center gap-3 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 hover:border-bureau-700/40 hover:bg-bureau-800/40 transition-colors"
    >
      {/* Role badge */}
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[scrutin.role] ?? ROLE_COLORS.PROCEDURAL}`}
      >
        {ROLE_LABELS[scrutin.role] ?? scrutin.role}
      </span>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-sm text-bureau-300 group-hover:text-bureau-100">
        {scrutin.titre}
      </span>

      {/* Mini bar (hidden on mobile) */}
      <div className="hidden w-16 shrink-0 sm:block">
        <div className="flex h-1 w-full overflow-hidden rounded-full bg-bureau-700/40">
          <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
          <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
          <div className="bg-amber/40" style={{ width: `${aPct}%` }} />
        </div>
      </div>

      {/* Result + date */}
      <ScrutinResultBadge sortCode={scrutin.sortCode} />
      <span className="hidden shrink-0 text-xs text-bureau-500 sm:block">{fmtDate(scrutin.dateScrutin)}</span>
    </Link>
  );
}
