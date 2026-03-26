"use client";

import { useState } from "react";
import Link from "next/link";
import { VoteBadge } from "@/components/vote-badge";
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface Deputy {
  id: string;
  prenom: string;
  nom: string;
  groupeAbrev: string;
  position: string;
}

interface Group {
  organeRef: string;
  libelle: string;
  libelleAbrege: string | null;
  couleur: string | null;
  positionMajoritaire: string;
  pour: number;
  contre: number;
  abstentions: number;
  nonVotants: number;
  nombreMembresGroupe: number;
}

interface Props {
  groups: Group[];
  deputies: Deputy[];
}

export function GroupExpander({ groups, deputies }: Props) {
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  const deputiesByGroup = deputies.reduce<Record<string, Deputy[]>>((acc, d) => {
    const key = d.groupeAbrev;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="divide-y divide-bureau-700/20 rounded-xl border border-bureau-700/30 overflow-hidden">
      {groups.map((g) => {
        const isExpanded = expandedRef === g.organeRef;
        const groupDeputies = deputiesByGroup[g.libelleAbrege ?? ""] ?? [];
        const total = g.pour + g.contre + g.abstentions + g.nonVotants;
        const pPct = total > 0 ? (g.pour / total) * 100 : 0;
        const cPct = total > 0 ? (g.contre / total) * 100 : 0;
        const aPct = total > 0 ? (g.abstentions / total) * 100 : 0;

        const positionColor =
          g.positionMajoritaire === "pour"
            ? "text-teal"
            : g.positionMajoritaire === "contre"
            ? "text-rose"
            : "text-amber";

        return (
          <div key={g.organeRef} className="bg-bureau-800/20">
            <button
              onClick={() => setExpandedRef(isExpanded ? null : g.organeRef)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bureau-800/40 transition-colors"
            >
              {/* Color dot */}
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/10"
                style={{ backgroundColor: g.couleur ?? "#64748b" }}
              />

              {/* Group name */}
              <span className="flex-1 text-sm font-medium text-bureau-200">
                {g.libelle}
              </span>

              {/* Position badge */}
              <span className={`text-xs font-semibold uppercase tracking-wide ${positionColor}`}>
                {g.positionMajoritaire}
              </span>

              {/* Mini bar */}
              <div className="hidden w-24 sm:block">
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bureau-700/40">
                  <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
                  <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
                  <div className="bg-amber/40" style={{ width: `${aPct}%` }} />
                </div>
              </div>

              {/* Counts */}
              <span className="w-20 shrink-0 text-right text-xs text-bureau-500">
                {g.pour}p · {g.contre}c · {g.abstentions}a
              </span>

              {/* Chevron */}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-bureau-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Deputy list */}
            {isExpanded && (
              <div className="border-t border-bureau-700/20 px-4 pb-4 pt-3">
                <p className="mb-3 text-xs text-bureau-500">
                  {g.nombreMembresGroupe} membres · {g.pour} pour · {g.contre} contre · {g.abstentions} abstentions
                </p>
                {groupDeputies.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {["pour", "contre", "abstention", "nonVotant"].map((pos) => {
                      const filtered = groupDeputies.filter((d) => d.position === pos);
                      if (filtered.length === 0) return null;
                      return (
                        <div key={pos} className="space-y-1">
                          <p className="text-xs text-bureau-500">
                            <VoteBadge position={pos} /> {filtered.length}
                          </p>
                          <div className="space-y-0.5">
                            {filtered.slice(0, 30).map((d) => (
                              <Link
                                key={d.id}
                                href={`/profils/deputes/${d.id}`}
                                className="block truncate text-xs text-bureau-300 hover:text-teal"
                              >
                                {d.prenom} {d.nom}
                              </Link>
                            ))}
                            {filtered.length > 30 && (
                              <p className="text-xs text-bureau-600">+{filtered.length - 30} autres</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-bureau-500">Détail individuel non disponible pour ce groupe.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
