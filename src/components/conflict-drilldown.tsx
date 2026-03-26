"use client";

import { useState } from "react";
import Link from "next/link";
import { fmtEuro } from "@/lib/format";
import { VoteBadge } from "@/components/vote-badge";

export interface DrilldownVote {
  position: string;
  scrutinId: string;
  titre: string;
  date: string;
  sortCode: string;
}

interface ConflictDrilldownProps {
  deputyName: string;
  sector: string;
  participationTotal: number;
  relatedVoteCount: number;
  votePour?: number;
  voteContre?: number;
  votes: DrilldownVote[];
}

export function ConflictDrilldown({
  deputyName,
  sector,
  participationTotal,
  relatedVoteCount,
  votePour,
  voteContre,
  votes,
}: ConflictDrilldownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber/20 bg-amber/5 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber/30 bg-amber/10">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-bureau-100">{deputyName}</p>
          <p className="mt-1 text-xs text-bureau-400">
            A d&eacute;clar&eacute;{" "}
            <span className="text-amber font-medium">{fmtEuro(participationTotal)}</span>{" "}
            de participations financi&egrave;res dans <strong className="text-bureau-200">{sector}</strong>.
            {relatedVoteCount > 0 && (
              <>
                {" "}A vot&eacute; sur{" "}
                <span className="text-bureau-100 font-medium">{relatedVoteCount}</span>{" "}
                texte{relatedVoteCount > 1 ? "s" : ""} li&eacute;{relatedVoteCount > 1 ? "s" : ""} &agrave; ce domaine
                {votePour !== undefined && voteContre !== undefined && (
                  <span className="text-bureau-500">
                    {" "}({votePour} pour &middot; {voteContre} contre)
                  </span>
                )}
                .
              </>
            )}
          </p>
          {votes.length > 0 && (
            <button
              onClick={() => setOpen(!open)}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber/70 hover:text-amber transition-colors"
            >
              {open ? "Masquer les votes" : `Voir les ${votes.length} votes`}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {open && votes.length > 0 && (
        <div className="mt-3 ml-8 space-y-1.5">
          {votes.map((v) => (
            <Link
              key={v.scrutinId}
              href={`/votes/scrutins/${v.scrutinId}`}
              className="group flex items-center gap-2.5 rounded-lg border border-bureau-700/10 bg-bureau-900/30 px-3 py-2 transition-colors hover:border-bureau-600/30 hover:bg-bureau-800/30"
            >
              <VoteBadge position={v.position} />
              <span className="flex-1 min-w-0 text-xs text-bureau-300 line-clamp-1 group-hover:text-bureau-200">
                {v.titre}
              </span>
              <span className={`shrink-0 text-[10px] ${v.sortCode === "adopt\u00e9" ? "text-teal/70" : "text-rose/70"}`}>
                {v.sortCode}
              </span>
              <span className="shrink-0 text-[10px] text-bureau-500">{v.date}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
