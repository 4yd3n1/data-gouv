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
  PROCEDURAL: "Proc\u00e9dural",
};

const ROLE_COLORS: Record<string, string> = {
  VOTE_FINAL: "bg-teal/10 text-teal",
  AMENDEMENT: "bg-blue/10 text-blue-400",
  ARTICLE: "bg-bureau-700/50 text-bureau-300",
  MOTION: "bg-amber/10 text-amber",
  PROCEDURAL: "bg-bureau-800/50 text-bureau-500",
};

// Display order for role groups (after VOTE_FINAL which is always pinned on top)
const ROLE_ORDER = ["ARTICLE", "AMENDEMENT", "MOTION", "PROCEDURAL"] as const;

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

export function ScrutinAccordion({ scrutins, voteFinalId }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const finalVote = scrutins.find((s) => s.id === voteFinalId || s.role === "VOTE_FINAL");
  const others = scrutins.filter((s) => s.id !== finalVote?.id);

  // Group by role
  const grouped: Record<string, ScrutinRow[]> = {};
  for (const s of others) {
    const role = s.role || "PROCEDURAL";
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(s);
  }

  // Compute counts for filter pills
  const roleCounts: Record<string, number> = {};
  for (const [role, items] of Object.entries(grouped)) {
    roleCounts[role] = items.length;
  }

  // Filter: if a filter is active, only show that role group
  const visibleRoles = activeFilter
    ? ROLE_ORDER.filter((r) => r === activeFilter)
    : ROLE_ORDER;

  return (
    <div className="space-y-3">
      {/* Filter pills */}
      {others.length > 3 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter(null)}
            className={`rounded-full px-3 py-1 text-xs transition-colors ${
              activeFilter === null
                ? "bg-bureau-600/40 text-bureau-100"
                : "bg-bureau-800/40 text-bureau-500 hover:text-bureau-300"
            }`}
          >
            Tous ({others.length})
          </button>
          {ROLE_ORDER.map((role) => {
            const count = roleCounts[role];
            if (!count) return null;
            return (
              <button
                key={role}
                onClick={() => setActiveFilter(activeFilter === role ? null : role)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  activeFilter === role
                    ? "bg-bureau-600/40 text-bureau-100"
                    : "bg-bureau-800/40 text-bureau-500 hover:text-bureau-300"
                }`}
              >
                {ROLE_LABELS[role] ?? role}s ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Final vote — always pinned on top */}
      {finalVote && <ScrutinRowItem scrutin={finalVote} highlight />}

      {/* Role groups */}
      {visibleRoles.map((role) => {
        const items = grouped[role];
        if (!items?.length) return null;
        return (
          <RoleGroup key={role} role={role} items={items} defaultExpanded={activeFilter === role || items.length <= 5} />
        );
      })}
    </div>
  );
}

function RoleGroup({
  role,
  items,
  defaultExpanded,
}: {
  role: string;
  items: ScrutinRow[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const adoptedCount = items.filter((s) => s.sortCode.toLowerCase().includes("adopt")).length;
  const rejectedCount = items.length - adoptedCount;

  return (
    <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/30">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bureau-800/30"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-bureau-500 transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? ROLE_COLORS.PROCEDURAL}`}>
          {ROLE_LABELS[role] ?? role}s
        </span>
        <span className="text-sm text-bureau-400">{items.length}</span>
        <span className="ml-auto flex gap-3 text-[10px] text-bureau-600">
          <span className="text-teal/70">{adoptedCount} {"adopt\u00e9s"}</span>
          <span className="text-rose/70">{rejectedCount} {"rejet\u00e9s"}</span>
        </span>
      </button>

      {/* Items */}
      {expanded && (
        <div className="space-y-1 px-2 pb-2">
          {items.map((s) => (
            <ScrutinRowItem key={s.id} scrutin={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScrutinRowItem({ scrutin, highlight }: { scrutin: ScrutinRow; highlight?: boolean }) {
  const total = scrutin.pour + scrutin.contre + scrutin.abstentions;
  const pPct = total > 0 ? (scrutin.pour / total) * 100 : 0;
  const cPct = total > 0 ? (scrutin.contre / total) * 100 : 0;
  const aPct = total > 0 ? (scrutin.abstentions / total) * 100 : 0;

  return (
    <Link
      href={`/representants/scrutins/${scrutin.id}`}
      className={`group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
        highlight
          ? "border-teal/30 bg-teal/5 hover:border-teal/50 hover:bg-teal/10"
          : "border-bureau-700/20 bg-bureau-800/20 hover:border-bureau-700/40 hover:bg-bureau-800/40"
      }`}
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
