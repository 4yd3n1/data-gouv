"use client";

import { useState } from "react";
import { fmtEuro } from "@/lib/format";

/* ── Types ── */

interface Participation {
  id: string;
  nomSociete: string;
  evaluation: number | null;
  remuneration: string | null;
  capitalDetenu: string | null;
  nombreParts: string | null;
}

interface Revenu {
  id: string;
  type: string;
  description: string | null;
  employeur: string | null;
  annee: number | null;
  montant: number | null;
}

interface Declaration {
  id: string;
  typeDeclaration: string;
  dateDepot: Date | string | null;
  organe: string | null;
  qualiteDeclarant: string | null;
  totalParticipations: number | null;
  totalRevenus: number | null;
  participations: Participation[];
  revenus: Revenu[];
}

/* ── Revenue type config ── */

const TYPE_ORDER = ["mandat_electif", "professionnel", "consultant", "dirigeant"];

const TYPE_META: Record<
  string,
  {
    label: string;
    textColor: string;
    dotColor: string;
    borderColor: string;
    barBase: string;
    barHover: string;
  }
> = {
  professionnel: {
    label: "Activit\u00e9s professionnelles",
    textColor: "text-blue-400",
    dotColor: "bg-blue-400",
    borderColor: "border-l-blue-400/60",
    barBase: "bg-blue-400/40",
    barHover: "hover:bg-blue-400/70",
  },
  mandat_electif: {
    label: "Mandats \u00e9lectifs",
    textColor: "text-teal",
    dotColor: "bg-teal",
    borderColor: "border-l-teal/60",
    barBase: "bg-teal/40",
    barHover: "hover:bg-teal/70",
  },
  consultant: {
    label: "Activit\u00e9s de conseil",
    textColor: "text-purple-400",
    dotColor: "bg-purple-400",
    borderColor: "border-l-purple-400/60",
    barBase: "bg-purple-400/40",
    barHover: "hover:bg-purple-400/70",
  },
  dirigeant: {
    label: "Fonctions de direction",
    textColor: "text-amber",
    dotColor: "bg-amber",
    borderColor: "border-l-amber/60",
    barBase: "bg-amber/40",
    barHover: "hover:bg-amber/70",
  },
};

/* ── Declaration type labels ── */

const DECL_LABELS: Record<string, string> = {
  DI: "D\u00e9claration d\u2019int\u00e9r\u00eats",
  DIA: "D\u00e9claration d\u2019int\u00e9r\u00eats et d\u2019activit\u00e9s",
  DIM: "D\u00e9claration d\u2019int\u00e9r\u00eats modificative",
  DIAM: "D\u00e9claration d\u2019int\u00e9r\u00eats et d\u2019activit\u00e9s modificative",
};

const DECL_BADGE_STYLE: Record<string, string> = {
  DI: "bg-teal/10 text-teal",
  DIA: "bg-amber/10 text-amber",
  DIM: "bg-blue/10 text-blue",
  DIAM: "bg-purple-400/10 text-purple-400",
};

/* ── Data helpers ── */

interface ActivityGroup {
  description: string | null;
  employeur: string | null;
  years: { annee: number; montant: number }[];
}

function aggregateActivities(revenus: Revenu[]): ActivityGroup[] {
  const map = new Map<string, ActivityGroup>();
  for (const r of revenus) {
    const key = `${r.description ?? ""}|${r.employeur ?? ""}`;
    let group = map.get(key);
    if (!group) {
      group = { description: r.description, employeur: r.employeur, years: [] };
      map.set(key, group);
    }
    if (r.annee != null && r.montant != null) {
      group.years.push({ annee: r.annee, montant: r.montant });
    }
  }
  for (const g of map.values()) {
    g.years.sort((a, b) => a.annee - b.annee);
  }
  return Array.from(map.values());
}

function hasPaidYears(g: ActivityGroup): boolean {
  return g.years.some((y) => y.montant > 0);
}

function latestYear(
  g: ActivityGroup
): { annee: number; montant: number } | null {
  if (g.years.length === 0) return null;
  return g.years[g.years.length - 1];
}

function yearRange(g: ActivityGroup): string {
  if (g.years.length === 0) return "";
  const first = g.years[0].annee;
  const last = g.years[g.years.length - 1].annee;
  return first === last ? String(first) : `${first}\u2013${last}`;
}

function fmtDateShort(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ── Mini vertical bar chart ── */

function MiniChart({
  years,
  barBase,
  barHover,
}: {
  years: { annee: number; montant: number }[];
  barBase: string;
  barHover: string;
}) {
  const max = Math.max(...years.map((y) => y.montant));
  if (max === 0) return null;

  return (
    <div className="mt-3 mb-1">
      <div className="flex items-end gap-[3px] h-10">
        {years.map((y) => (
          <div
            key={y.annee}
            className={`min-w-[8px] flex-1 max-w-5 rounded-t transition-colors cursor-default ${barBase} ${barHover}`}
            style={{
              height: `${Math.max(6, (y.montant / max) * 100)}%`,
            }}
            title={`${y.annee} : ${fmtEuro(y.montant)}`}
          />
        ))}
      </div>
      <div className="flex gap-[3px] mt-1">
        {years.map((y) => (
          <span
            key={y.annee}
            className="min-w-[8px] flex-1 max-w-5 text-center text-[9px] leading-none text-bureau-600 select-none"
          >
            {String(y.annee).slice(-2)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Paid activity card with colored left border + mini chart ── */

function ActivityCard({
  activity,
  type,
}: {
  activity: ActivityGroup;
  type: string;
}) {
  const meta = TYPE_META[type] ?? TYPE_META.professionnel;
  const latest = latestYear(activity);
  const range = yearRange(activity);

  // For dirigeant: show org name as main, role as sub
  // For others: show description as main, employer as sub
  const mainLabel =
    type === "dirigeant"
      ? (activity.employeur ?? activity.description ?? "\u2014")
      : (activity.description ?? activity.employeur ?? type);
  const subLabel =
    type === "dirigeant" ? activity.description : activity.employeur;

  return (
    <div
      className={`rounded-lg border-l-2 ${meta.borderColor} bg-bureau-800/40 px-4 py-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-bureau-200">{mainLabel}</p>
          <p className="mt-0.5 text-xs text-bureau-500">
            {subLabel && <>{subLabel} &middot; </>}
            {range}
          </p>
        </div>
        {latest && latest.montant > 0 && (
          <div className="shrink-0 text-right">
            <p
              className={`text-sm font-semibold tabular-nums ${meta.textColor}`}
            >
              {fmtEuro(latest.montant)}
            </p>
            <p className="text-[10px] text-bureau-500">{latest.annee}</p>
          </div>
        )}
      </div>

      {activity.years.length > 1 &&
        activity.years.some((y) => y.montant > 0) && (
          <MiniChart
            years={activity.years}
            barBase={meta.barBase}
            barHover={meta.barHover}
          />
        )}
    </div>
  );
}

/* ── Compact list for unpaid (b\u00e9n\u00e9vole) positions ── */

function UnpaidPositions({
  activities,
}: {
  activities: ActivityGroup[];
}) {
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 5;
  const displayed = showAll ? activities : activities.slice(0, LIMIT);
  const hasMore = activities.length > LIMIT;

  return (
    <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-bureau-500" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-bureau-400">
          Positions b&eacute;n&eacute;voles
        </h4>
        <span className="rounded-full bg-bureau-700/40 px-2 py-0.5 text-[10px] font-medium text-bureau-400">
          {activities.length}
        </span>
      </div>

      <div className="space-y-1">
        {displayed.map((act, i) => {
          const name = act.employeur ?? act.description ?? "\u2014";
          const role = act.employeur ? act.description : null;
          const period = yearRange(act);
          return (
            <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
              <span className="h-1 w-1 shrink-0 rounded-full bg-bureau-600" />
              <span className="truncate text-bureau-300">{name}</span>
              {role && (
                <span className="shrink-0 text-bureau-500">
                  &middot; {role}
                </span>
              )}
              <span className="ml-auto shrink-0 tabular-nums text-bureau-600">
                {period}
              </span>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2.5 text-xs text-teal/70 transition-colors hover:text-teal"
        >
          {showAll
            ? "Voir moins"
            : `+ ${activities.length - LIMIT} autres positions`}
        </button>
      )}
    </div>
  );
}

/* ── Revenue summary stat boxes ── */

function RevenueSummary({ revenus }: { revenus: Revenu[] }) {
  // Compute latest-year total per type
  const typeTotals: { type: string; total: number }[] = [];

  const byType = new Map<string, Revenu[]>();
  for (const r of revenus) {
    const list = byType.get(r.type) ?? [];
    list.push(r);
    byType.set(r.type, list);
  }

  for (const type of TYPE_ORDER) {
    const items = byType.get(type);
    if (!items) continue;
    const activities = aggregateActivities(items);
    let total = 0;
    for (const act of activities) {
      const latest = latestYear(act);
      if (latest) total += latest.montant;
    }
    if (total > 0) typeTotals.push({ type, total });
  }

  if (typeTotals.length === 0) return null;
  const grandTotal = typeTotals.reduce((s, t) => s + t.total, 0);

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {/* Grand total */}
      <div className="min-w-[130px] rounded-lg border border-bureau-700/30 bg-bureau-800/40 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-bureau-500">
          Total d&eacute;clar&eacute;
        </p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-bureau-100">
          {fmtEuro(grandTotal)}
        </p>
        <p className="text-[10px] text-bureau-600">derni&egrave;re ann&eacute;e</p>
      </div>

      {/* Per-type breakdown */}
      {typeTotals.map(({ type, total }) => {
        const meta = TYPE_META[type];
        return (
          <div
            key={type}
            className="min-w-[110px] rounded-lg border border-bureau-700/20 bg-bureau-800/30 px-3 py-3"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${meta?.dotColor ?? "bg-teal"}`}
              />
              <p className="text-[10px] uppercase tracking-wider text-bureau-500">
                {meta?.label ?? type}
              </p>
            </div>
            <p
              className={`mt-0.5 text-sm font-semibold tabular-nums ${meta?.textColor ?? "text-teal"}`}
            >
              {fmtEuro(total)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Declaration Card (accordion) ── */

function DeclarationCard({ decl }: { decl: Declaration }) {
  const [expanded, setExpanded] = useState(false);

  // Group revenus by type
  const byType = new Map<string, Revenu[]>();
  for (const r of decl.revenus) {
    const list = byType.get(r.type) ?? [];
    list.push(r);
    byType.set(r.type, list);
  }

  // Process each type: split into paid vs unpaid activities
  const sections: {
    type: string;
    paid: ActivityGroup[];
    unpaid: ActivityGroup[];
  }[] = [];
  let paidCount = 0;
  let unpaidCount = 0;

  for (const type of TYPE_ORDER) {
    const items = byType.get(type);
    if (!items) continue;
    const activities = aggregateActivities(items);
    const paid = activities.filter((a) => hasPaidYears(a));
    const unpaid = activities.filter((a) => !hasPaidYears(a));
    paidCount += paid.length;
    unpaidCount += unpaid.length;
    sections.push({ type, paid, unpaid });
  }
  // Handle any types not in TYPE_ORDER
  for (const [type, items] of byType) {
    if (TYPE_ORDER.includes(type)) continue;
    const activities = aggregateActivities(items);
    const paid = activities.filter((a) => hasPaidYears(a));
    const unpaid = activities.filter((a) => !hasPaidYears(a));
    paidCount += paid.length;
    unpaidCount += unpaid.length;
    sections.push({ type, paid, unpaid });
  }

  const allUnpaid = sections.flatMap((s) => s.unpaid);
  const hasContent =
    decl.participations.length > 0 || decl.revenus.length > 0;

  // Quick summary line
  const summaryParts: string[] = [];
  if (paidCount > 0)
    summaryParts.push(
      `${paidCount} r\u00e9mun\u00e9ration${paidCount > 1 ? "s" : ""}`
    );
  if (unpaidCount > 0)
    summaryParts.push(
      `${unpaidCount} b\u00e9n\u00e9vole${unpaidCount > 1 ? "s" : ""}`
    );
  if (decl.participations.length > 0)
    summaryParts.push(
      `${decl.participations.length} participation${decl.participations.length > 1 ? "s" : ""}`
    );

  const typeCode = decl.typeDeclaration;
  const badgeStyle =
    DECL_BADGE_STYLE[typeCode] ?? "bg-bureau-700/40 text-bureau-300";
  const declLabel =
    DECL_LABELS[typeCode] ?? `D\u00e9claration (${typeCode})`;

  return (
    <div className="overflow-hidden rounded-xl border border-bureau-700/20 bg-bureau-800/20">
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-bureau-700/20"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}
            >
              {typeCode}
            </span>
            <p className="text-sm font-medium text-bureau-200">{declLabel}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-bureau-500">
            {decl.dateDepot && <span>{fmtDateShort(decl.dateDepot)}</span>}
            {decl.qualiteDeclarant && (
              <span>&middot; {decl.qualiteDeclarant}</span>
            )}
            {decl.organe && <span>&middot; {decl.organe}</span>}
          </div>
          {summaryParts.length > 0 && (
            <p className="mt-1.5 text-[11px] text-bureau-500/70">
              {summaryParts.join(" \u00b7 ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {decl.totalRevenus != null && decl.totalRevenus > 0 && (
            <p className="text-sm font-bold tabular-nums text-teal">
              {fmtEuro(decl.totalRevenus)}
            </p>
          )}
          {hasContent && (
            <svg
              className={`h-4 w-4 text-bureau-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </button>

      {/* ── Expanded content ── */}
      {expanded && hasContent && (
        <div className="border-t border-bureau-700/20 px-5 py-5 space-y-5">
          {/* Revenue summary stat boxes */}
          <RevenueSummary revenus={decl.revenus} />

          {/* Paid activities by type — ordered */}
          {sections
            .filter((s) => s.paid.length > 0)
            .map(({ type, paid }) => {
              const meta = TYPE_META[type];
              return (
                <div key={type}>
                  <h4 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bureau-400">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${meta?.dotColor ?? "bg-teal"}`}
                    />
                    {meta?.label ?? type}
                    <span className="font-normal text-bureau-500">
                      ({paid.length})
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {paid.map((act, i) => (
                      <ActivityCard key={i} activity={act} type={type} />
                    ))}
                  </div>
                </div>
              );
            })}

          {/* All unpaid positions — compact list */}
          {allUnpaid.length > 0 && <UnpaidPositions activities={allUnpaid} />}

          {/* Financial participations */}
          {decl.participations.length > 0 && (
            <div>
              <h4 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-bureau-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber" />
                Participations financi&egrave;res
                <span className="font-normal text-bureau-500">
                  ({decl.participations.length})
                </span>
              </h4>
              <div className="space-y-1">
                {decl.participations.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-bureau-800/50 px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-bureau-200">{p.nomSociete}</span>
                      {(p.nombreParts || p.capitalDetenu) && (
                        <span className="ml-2 text-xs text-bureau-500">
                          {p.nombreParts && `${p.nombreParts} parts`}
                          {p.nombreParts && p.capitalDetenu && " \u00b7 "}
                          {p.capitalDetenu && `${p.capitalDetenu} capital`}
                        </span>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      {p.evaluation != null && p.evaluation > 0 && (
                        <span className="font-semibold text-amber">
                          {fmtEuro(p.evaluation)}
                        </span>
                      )}
                      {p.remuneration &&
                        p.remuneration !== "0" && (
                          <p className="text-xs text-bureau-500">
                            R&eacute;mun. {p.remuneration}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main export ── */

export function DeclarationSection({
  declarations,
}: {
  declarations: Declaration[];
}) {
  if (declarations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        D&eacute;clarations d&apos;int&eacute;r&ecirc;ts ({declarations.length})
      </h3>
      {declarations.map((decl) => (
        <DeclarationCard key={decl.id} decl={decl} />
      ))}
    </div>
  );
}
