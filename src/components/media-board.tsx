"use client";

import { useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/format";

const TYPE_COLORS: Record<string, string> = {
  TELEVISION: "#60a5fa",
  RADIO: "#fbbf24",
  PRESSE_QUOTIDIENNE: "#2dd4bf",
  PRESSE_MAGAZINE: "#0d9488",
  NUMERIQUE: "#fb7185",
  AGENCE: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  TELEVISION: "Television",
  RADIO: "Radio",
  PRESSE_QUOTIDIENNE: "Presse quotidienne",
  PRESSE_MAGAZINE: "Presse magazine",
  NUMERIQUE: "Numerique",
  AGENCE: "Agence",
};

const FILTER_TYPES = [
  { key: null, label: "Tous" },
  { key: "TELEVISION", label: "Television" },
  { key: "RADIO", label: "Radio" },
  { key: "PRESSE_QUOTIDIENNE", label: "Presse" },
  { key: "PRESSE_MAGAZINE", label: "Magazines" },
  { key: "NUMERIQUE", label: "Numerique" },
] as const;

interface Proprietaire {
  nom: string;
  prenom: string;
  slug: string;
  bioCourte: string | null;
  formation: string | null;
  fortuneEstimee: number | null;
  sourceFortuneEstimee: string | null;
  activitePrincipale: string | null;
  partCapital: number | null;
  typeControle: string;
  gouvernementSlug: string | null;
  contextePolitique: string | null;
  sourceContextePolitique: string | null;
}

const ORIENTATION_COLORS: Record<string, string> = {
  DROITE: "#f43f5e",
  CENTRE_DROIT: "#f97316",
  CENTRE: "#eab308",
  CENTRE_GAUCHE: "#3b82f6",
  GAUCHE: "#8b5cf6",
  GENERALISTE: "#94a3b8",
  SERVICE_PUBLIC: "#2dd4bf",
  DIVERTISSEMENT: "#64748b",
  THEMATIQUE: "#06b6d4",
};

const ORIENTATION_LABELS: Record<string, string> = {
  DROITE: "Droite",
  CENTRE_DROIT: "Centre-droit",
  CENTRE: "Centre",
  CENTRE_GAUCHE: "Centre-gauche",
  GAUCHE: "Gauche",
  GENERALISTE: "Generaliste",
  SERVICE_PUBLIC: "Service public",
  DIVERTISSEMENT: "Divertissement",
  THEMATIQUE: "Thematique",
};

interface FilialeItem {
  nom: string;
  type: string;
  description: string | null;
  audienceEstimee: string | null;
  dateCreation: number | null;
  orientation: string | null;
  signalementCount: number;
}

interface GroupItem {
  slug: string;
  nom: string;
  nomCourt: string;
  description: string | null;
  rang: number;
  proprietaires: Proprietaire[];
  filiales: FilialeItem[];
  signalementCount: number;
}

interface MediaBoardProps {
  groups: GroupItem[];
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function TypeBar({ filiales }: { filiales: FilialeItem[] }) {
  const counts: Record<string, number> = {};
  for (const f of filiales) {
    counts[f.type] = (counts[f.type] ?? 0) + 1;
  }
  const total = filiales.length;
  if (total === 0) return null;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bureau-700/40">
      {Object.entries(counts).map(([type, count]) => (
        <div
          key={type}
          style={{ width: `${(count / total) * 100}%`, backgroundColor: TYPE_COLORS[type] ?? "#64748b" }}
          className="opacity-60"
        />
      ))}
    </div>
  );
}

function getDominantColor(filiales: FilialeItem[]): string {
  const counts: Record<string, number> = {};
  for (const f of filiales) {
    counts[f.type] = (counts[f.type] ?? 0) + 1;
  }
  let max = 0;
  let dominant = "TELEVISION";
  for (const [type, count] of Object.entries(counts)) {
    if (count > max) { max = count; dominant = type; }
  }
  return TYPE_COLORS[dominant] ?? "#64748b";
}

function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function getTypeCounts(filiales: FilialeItem[]): Array<[string, number]> {
  const counts: Record<string, number> = {};
  for (const f of filiales) {
    counts[f.type] = (counts[f.type] ?? 0) + 1;
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a);
}

export function MediaBoard({ groups }: MediaBoardProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  const hasType = (g: GroupItem, type: string): boolean =>
    g.filiales.some((f) => f.type === type);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTER_TYPES.map((ft) => {
          const isActive = activeFilter === ft.key;
          return (
            <button
              key={ft.key ?? "all"}
              onClick={() => setActiveFilter(isActive ? null : (ft.key ?? null))}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "filter-active"
                  : "bg-bureau-800/40 text-bureau-400 hover:bg-bureau-700/40 hover:text-bureau-200"
              }`}
            >
              {ft.label}
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const isExpanded = expandedSlug === g.slug;
          const matchesFilter = !activeFilter || hasType(g, activeFilter);
          const owner = g.proprietaires[0];
          const dominantColor = getDominantColor(g.filiales);
          const initials = owner ? getInitials(owner.prenom, owner.nom) : "??";
          const typeCounts = getTypeCounts(g.filiales);

          return (
            <div
              key={g.slug}
              className={`${isExpanded ? "col-span-full" : ""} transition-opacity duration-300 ${
                activeFilter && !matchesFilter ? "opacity-40" : "opacity-100"
              }`}
            >
              {/* Collapsed card */}
              <button
                onClick={() => setExpandedSlug(isExpanded ? null : g.slug)}
                className={`dossier-card w-full rounded-xl text-left ${
                  isExpanded ? "dossier-card-active" : ""
                }`}
              >
                <div className="px-5 py-4">
                  {/* Row 1: Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `${dominantColor}15`,
                          border: `1px solid ${dominantColor}30`,
                        }}
                      >
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: dominantColor }}
                        >
                          {initials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        {owner && (
                          <p className="text-sm font-semibold text-bureau-100">
                            {owner.prenom} {owner.nom}
                          </p>
                        )}
                        <p className="text-[11px] text-bureau-500">{g.nomCourt}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {g.signalementCount > 0 && (
                        <span className="flex items-center gap-1 rounded-sm bg-rose/10 px-1.5 py-0.5 text-[9px] font-medium text-rose border border-rose/20">
                          {g.signalementCount} ARCOM
                        </span>
                      )}
                      {owner?.gouvernementSlug && (
                        <span className="flex items-center gap-1 rounded-sm bg-amber/10 px-1.5 py-0.5 text-[9px] font-medium text-amber border border-amber/20">
                          GOV
                        </span>
                      )}
                      <span className="rounded-sm bg-bureau-700/40 px-2 py-0.5 text-[10px] data-value text-bureau-400">
                        {g.filiales.length}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-bureau-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Fortune + inline metrics */}
                  <div className="mt-3 flex items-center gap-4">
                    {owner?.fortuneEstimee != null && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold data-value text-amber">
                          {owner.fortuneEstimee}
                        </span>
                        <span className="text-[10px] text-bureau-600">Md EUR</span>
                      </div>
                    )}
                    {owner?.partCapital != null && (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold data-value text-bureau-300">
                          {owner.partCapital}%
                        </span>
                        <span className="text-[10px] text-bureau-600">controle</span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Type distribution micro-bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <TypeBar filiales={g.filiales} />
                    <div className="flex gap-1.5 shrink-0">
                      {typeCounts.slice(0, 3).map(([type, count]) => (
                        <span
                          key={type}
                          className="text-[9px] data-value"
                          style={{ color: TYPE_COLORS[type] }}
                        >
                          {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded panel */}
              <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  {isExpanded && (
                    <div className="mt-2 glass-panel rounded-xl p-6">
                      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                        {/* Left: Owner dossier */}
                        <div className="space-y-4">
                          <div className="border-b border-bureau-700/30 pb-3">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-bureau-600 mb-2">
                              Fiche proprietaire
                            </p>
                            {owner && (
                              <h3 className="text-lg font-semibold text-bureau-100">
                                {owner.prenom} {owner.nom}
                              </h3>
                            )}
                            {owner?.bioCourte && (
                              <p className="mt-1.5 text-xs text-bureau-400 leading-relaxed">
                                {owner.bioCourte}
                              </p>
                            )}
                          </div>

                          {/* Metadata grid */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                            {owner?.formation && (
                              <>
                                <span className="text-bureau-600">Formation</span>
                                <span className="text-bureau-300">{owner.formation}</span>
                              </>
                            )}
                            {owner?.activitePrincipale && (
                              <>
                                <span className="text-bureau-600">Activite</span>
                                <span className="text-bureau-300">{owner.activitePrincipale}</span>
                              </>
                            )}
                            {owner?.partCapital != null && (
                              <>
                                <span className="text-bureau-600">Controle</span>
                                <span className="text-bureau-300">
                                  {owner.partCapital}% — {owner.typeControle}
                                </span>
                              </>
                            )}
                            {owner?.fortuneEstimee != null && (
                              <>
                                <span className="text-bureau-600">Fortune</span>
                                <span className="text-amber data-value">
                                  {fmt(owner.fortuneEstimee)} Md EUR
                                </span>
                              </>
                            )}
                          </div>

                          {/* Gov link */}
                          {owner?.gouvernementSlug && (
                            <Link
                              href={`/profils/${owner.gouvernementSlug}`}
                              className="flex items-center gap-2 rounded-lg border
                                         border-amber/20 bg-amber/5 px-3 py-2
                                         text-xs text-amber hover:bg-amber/10
                                         transition-colors"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                              Profil gouvernemental
                              <span className="ml-auto text-bureau-600">&rarr;</span>
                            </Link>
                          )}

                          {/* Political context */}
                          {owner?.contextePolitique && (
                            <div className="rounded-lg border border-rose/15 bg-rose/5 px-3 py-2.5">
                              <p className="text-[9px] uppercase tracking-[0.15em] text-rose/70 mb-1">
                                Contexte politique
                              </p>
                              <p className="text-[11px] text-bureau-300 leading-relaxed">
                                {owner.contextePolitique}
                              </p>
                              {owner.sourceContextePolitique && (
                                <p className="mt-1 text-[9px] text-bureau-600 italic">
                                  Source : {owner.sourceContextePolitique}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Group description */}
                          {g.description && (
                            <p className="text-xs text-bureau-500 leading-relaxed border-t border-bureau-700/20 pt-3">
                              {g.description}
                            </p>
                          )}
                        </div>

                        {/* Right: Subsidiaries grid */}
                        <div className="space-y-3">
                          <p className="text-[9px] uppercase tracking-[0.2em] text-bureau-600">
                            Actifs media ({g.filiales.length})
                          </p>
                          {Object.entries(TYPE_LABELS)
                            .filter(([type]) => g.filiales.some((f) => f.type === type))
                            .map(([type, label]) => {
                              const items = g.filiales.filter((f) => f.type === type);
                              const color = TYPE_COLORS[type] ?? "#64748b";
                              return (
                                <div key={type}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span
                                      className="h-1.5 w-1.5 rounded-full"
                                      style={{ background: color }}
                                    />
                                    <span className="text-[10px] uppercase tracking-[0.12em] text-bureau-500">
                                      {label}
                                    </span>
                                    <span className="text-[10px] data-value text-bureau-600">
                                      {items.length}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {items.map((f, i) => (
                                      <span
                                        key={f.nom}
                                        className="fade-up inline-flex items-center gap-1.5 rounded-md
                                                   border px-2 py-0.5 text-[11px]"
                                        style={{
                                          borderColor: `${color}20`,
                                          background: `${color}08`,
                                          color,
                                          animationDelay: `${i * 0.03}s`,
                                        }}
                                      >
                                        {f.orientation && (
                                          <span
                                            className="h-1.5 w-1.5 rounded-full shrink-0"
                                            title={ORIENTATION_LABELS[f.orientation] ?? f.orientation}
                                            style={{ background: ORIENTATION_COLORS[f.orientation] ?? "#64748b" }}
                                          />
                                        )}
                                        {f.nom}
                                        {f.signalementCount > 0 && (
                                          <span className="rounded-sm bg-rose/20 px-1 text-[8px] font-bold text-rose">
                                            {f.signalementCount}
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
