"use client";

import { useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/format";

const TYPE_COLORS: Record<string, string> = {
  TELEVISION: "var(--color-verified)",
  RADIO: "var(--color-warn)",
  PRESSE_QUOTIDIENNE: "var(--color-verified)",
  PRESSE_MAGAZINE: "var(--color-fg-mute)",
  NUMERIQUE: "var(--color-signal)",
  AGENCE: "var(--color-fg-dim)",
};

const TYPE_LABELS: Record<string, string> = {
  TELEVISION: "Télévision",
  RADIO: "Radio",
  PRESSE_QUOTIDIENNE: "Presse quotidienne",
  PRESSE_MAGAZINE: "Presse magazine",
  NUMERIQUE: "Numérique",
  AGENCE: "Agence",
};

const FILTER_TYPES = [
  { key: null, label: "Tous" },
  { key: "TELEVISION", label: "Télévision" },
  { key: "RADIO", label: "Radio" },
  { key: "PRESSE_QUOTIDIENNE", label: "Presse" },
  { key: "PRESSE_MAGAZINE", label: "Magazines" },
  { key: "NUMERIQUE", label: "Numérique" },
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
  DROITE: "var(--color-signal)",
  CENTRE_DROIT: "var(--color-warn)",
  CENTRE: "var(--color-fg-mute)",
  CENTRE_GAUCHE: "var(--color-verified)",
  GAUCHE: "#8b5cf6",
  GENERALISTE: "var(--color-fg-dim)",
  SERVICE_PUBLIC: "var(--color-verified)",
  DIVERTISSEMENT: "var(--color-fg-faint)",
  THEMATIQUE: "var(--color-fg-mute)",
};

const ORIENTATION_LABELS: Record<string, string> = {
  DROITE: "Droite",
  CENTRE_DROIT: "Centre-droit",
  CENTRE: "Centre",
  CENTRE_GAUCHE: "Centre-gauche",
  GAUCHE: "Gauche",
  GENERALISTE: "Généraliste",
  SERVICE_PUBLIC: "Service public",
  DIVERTISSEMENT: "Divertissement",
  THEMATIQUE: "Thématique",
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

function ChevronDown({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    <div
      style={{
        display: "flex",
        height: 3,
        width: "100%",
        overflow: "hidden",
        background: "var(--line)",
      }}
    >
      {Object.entries(counts).map(([type, count]) => (
        <div
          key={type}
          style={{
            width: `${(count / total) * 100}%`,
            background: TYPE_COLORS[type] ?? "var(--color-fg-dim)",
            opacity: 0.75,
          }}
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
  return TYPE_COLORS[dominant] ?? "var(--color-fg-dim)";
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
      {/* Filter bar — mono-rectangular pills matching Variant A register */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.14em",
            color: "var(--color-fg-dim)",
            marginRight: 6,
          }}
        >
          Filtrer
        </span>
        {FILTER_TYPES.map((ft) => {
          const isActive = activeFilter === ft.key;
          return (
            <button
              key={ft.key ?? "all"}
              onClick={() => setActiveFilter(isActive ? null : (ft.key ?? null))}
              className="obs-mono"
              style={{
                fontSize: "var(--fs-mono-xs)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "6px 10px",
                background: isActive ? "var(--signal-bg)" : "transparent",
                color: isActive ? "var(--color-signal)" : "var(--color-fg-mute)",
                border: `1px solid ${isActive ? "oklch(0.55 0.12 27 / 0.35)" : "var(--line)"}`,
                borderRadius: 2,
                cursor: "pointer",
                transition: "color 120ms, background 120ms, border-color 120ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-fg)";
                  e.currentTarget.style.borderColor = "var(--line-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--color-fg-mute)";
                  e.currentTarget.style.borderColor = "var(--line)";
                }
              }}
            >
              {ft.label}
            </button>
          );
        })}
      </div>

      {/* Card grid — 2 cols on md, 3 on lg. 10 items => 3+3+3+1; the orphan cell renders with same height (equal-height cards), no awkward gap. */}
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr",
        }}
        className="media-board-grid"
      >
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
              style={{
                gridColumn: isExpanded ? "1 / -1" : undefined,
                opacity: activeFilter && !matchesFilter ? 0.28 : 1,
                transition: "opacity 220ms ease",
              }}
            >
              {/* Collapsed card */}
              <button
                onClick={() => setExpandedSlug(isExpanded ? null : g.slug)}
                className="media-card"
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  textAlign: "left",
                  background: isExpanded ? "var(--color-ink-2)" : "var(--color-ink-1)",
                  border: `1px solid ${isExpanded ? "var(--line-2)" : "var(--line)"}`,
                  padding: "14px 16px",
                  cursor: "pointer",
                  minHeight: 112,
                  transition: "border-color 140ms, background 140ms",
                  borderRadius: 0,
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 10,
                    minHeight: 36,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "transparent",
                        border: `1px solid ${dominantColor}`,
                        color: dominantColor,
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {owner && (
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--color-fg)",
                            lineHeight: 1.25,
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {owner.prenom} {owner.nom}
                        </p>
                      )}
                      <p
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.12em",
                          color: "var(--color-fg-dim)",
                          marginTop: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {g.nomCourt}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    {g.signalementCount > 0 && (
                      <span className="sig-tag">{g.signalementCount} ARCOM</span>
                    )}
                    {owner?.gouvernementSlug && <span className="sig-tag sig-tag--amber">GOV</span>}
                    <span
                      className="obs-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        color: "var(--color-fg-mute)",
                        padding: "2px 6px",
                        border: "1px solid var(--line)",
                        borderRadius: 2,
                      }}
                    >
                      {g.filiales.length}
                    </span>
                    <ChevronDown
                      style={{
                        width: 14,
                        height: 14,
                        color: "var(--color-fg-dim)",
                        transition: "transform 200ms",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                      }}
                    />
                  </div>
                </div>

                {/* Metrics row — fixed height slot; if both missing (e.g. public service), shows a neutral "Service public" line so alignment holds */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, minHeight: 22 }}>
                  {owner?.fortuneEstimee != null ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: "var(--color-warn)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {owner.fortuneEstimee}
                      </span>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-fg-dim)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Md EUR
                      </span>
                    </div>
                  ) : (
                    <span
                      className="obs-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: "var(--color-fg-dim)",
                        textTransform: "uppercase",
                      }}
                    >
                      Service public
                    </span>
                  )}
                  {owner?.partCapital != null && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--color-fg-mute)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {owner.partCapital}%
                      </span>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          color: "var(--color-fg-dim)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        contrôle
                      </span>
                    </div>
                  )}
                </div>

                {/* Type distribution bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                  <div style={{ flex: 1 }}>
                    <TypeBar filiales={g.filiales} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {typeCounts.slice(0, 3).map(([type, count]) => (
                      <span
                        key={type}
                        className="obs-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.05em",
                          color: TYPE_COLORS[type] ?? "var(--color-fg-dim)",
                        }}
                      >
                        {count}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              {/* Expanded panel */}
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isExpanded ? "1fr" : "0fr",
                  transition: "grid-template-rows 260ms ease",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  {isExpanded && (
                    <div
                      className="media-card-expanded"
                      style={{
                        marginTop: 1,
                        background: "var(--color-ink-1)",
                        border: "1px solid var(--line)",
                        borderTop: "none",
                        padding: "22px 28px",
                        display: "grid",
                        gap: 32,
                        gridTemplateColumns: "minmax(240px, 300px) 1fr",
                      }}
                    >
                      {/* Left: owner dossier */}
                      <div>
                        <div style={{ paddingBottom: 14, borderBottom: "1px solid var(--line)" }}>
                          <p
                            className="obs-mono"
                            style={{
                              fontSize: "var(--fs-mono-xs)",
                              letterSpacing: "0.16em",
                              color: "var(--color-fg-dim)",
                              textTransform: "uppercase",
                              marginBottom: 8,
                            }}
                          >
                            Fiche propriétaire
                          </p>
                          {owner && (
                            <h3
                              className="hd"
                              style={{
                                fontSize: 22,
                                fontWeight: 500,
                                color: "var(--color-fg)",
                                margin: 0,
                                lineHeight: 1.15,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              {owner.prenom} {owner.nom}
                            </h3>
                          )}
                          {owner?.bioCourte && (
                            <p
                              className="obs-serif"
                              style={{
                                marginTop: 10,
                                fontSize: 13.5,
                                color: "var(--color-fg-mute)",
                                lineHeight: 1.5,
                              }}
                            >
                              {owner.bioCourte}
                            </p>
                          )}
                        </div>

                        {/* Metadata list */}
                        <dl
                          style={{
                            marginTop: 14,
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            columnGap: 14,
                            rowGap: 6,
                            fontSize: 11.5,
                            alignItems: "baseline",
                          }}
                        >
                          {owner?.formation && (
                            <>
                              <dt
                                className="obs-mono"
                                style={{
                                  color: "var(--color-fg-dim)",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  fontSize: "var(--fs-mono-xs)",
                                }}
                              >
                                Formation
                              </dt>
                              <dd style={{ color: "var(--color-fg-mute)", margin: 0 }}>
                                {owner.formation}
                              </dd>
                            </>
                          )}
                          {owner?.activitePrincipale && (
                            <>
                              <dt
                                className="obs-mono"
                                style={{
                                  color: "var(--color-fg-dim)",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  fontSize: "var(--fs-mono-xs)",
                                }}
                              >
                                Activité
                              </dt>
                              <dd style={{ color: "var(--color-fg-mute)", margin: 0 }}>
                                {owner.activitePrincipale}
                              </dd>
                            </>
                          )}
                          {owner?.partCapital != null && (
                            <>
                              <dt
                                className="obs-mono"
                                style={{
                                  color: "var(--color-fg-dim)",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  fontSize: "var(--fs-mono-xs)",
                                }}
                              >
                                Contrôle
                              </dt>
                              <dd style={{ color: "var(--color-fg-mute)", margin: 0 }}>
                                {owner.partCapital}% · {owner.typeControle}
                              </dd>
                            </>
                          )}
                          {owner?.fortuneEstimee != null && (
                            <>
                              <dt
                                className="obs-mono"
                                style={{
                                  color: "var(--color-fg-dim)",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  fontSize: "var(--fs-mono-xs)",
                                }}
                              >
                                Fortune
                              </dt>
                              <dd
                                style={{
                                  color: "var(--color-warn)",
                                  margin: 0,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {fmt(owner.fortuneEstimee)} Md EUR
                              </dd>
                            </>
                          )}
                        </dl>

                        {/* Gov link */}
                        {owner?.gouvernementSlug && (
                          <Link
                            href={`/profils/${owner.gouvernementSlug}`}
                            className="obs-mono"
                            style={{
                              marginTop: 14,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 10px",
                              border: "1px solid oklch(0.55 0.10 80 / 0.35)",
                              background: "var(--warn-bg)",
                              color: "var(--color-warn)",
                              fontSize: 11,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              textDecoration: "none",
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                background: "var(--color-warn)",
                                borderRadius: "50%",
                              }}
                            />
                            Profil gouvernemental
                            <span style={{ marginLeft: "auto", color: "var(--color-fg-dim)" }}>→</span>
                          </Link>
                        )}

                        {/* Political context */}
                        {owner?.contextePolitique && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: "10px 12px",
                              border: "1px solid oklch(0.55 0.12 27 / 0.28)",
                              background: "var(--signal-bg)",
                            }}
                          >
                            <p
                              className="obs-mono"
                              style={{
                                fontSize: 9.5,
                                letterSpacing: "0.14em",
                                color: "var(--color-signal)",
                                textTransform: "uppercase",
                                marginBottom: 4,
                              }}
                            >
                              Contexte politique
                            </p>
                            <p
                              style={{
                                fontSize: 11.5,
                                color: "var(--color-fg-mute)",
                                lineHeight: 1.55,
                                margin: 0,
                              }}
                            >
                              {owner.contextePolitique}
                            </p>
                            {owner.sourceContextePolitique && (
                              <p
                                className="obs-mono"
                                style={{
                                  marginTop: 6,
                                  fontSize: 9,
                                  letterSpacing: "0.08em",
                                  color: "var(--color-fg-dim)",
                                  textTransform: "uppercase",
                                }}
                              >
                                Src · {owner.sourceContextePolitique}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Group description */}
                        {g.description && (
                          <p
                            style={{
                              marginTop: 14,
                              paddingTop: 12,
                              borderTop: "1px solid var(--line)",
                              fontSize: 12.5,
                              color: "var(--color-fg-dim)",
                              lineHeight: 1.55,
                            }}
                          >
                            {g.description}
                          </p>
                        )}
                      </div>

                      {/* Right: subsidiaries grid */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            marginBottom: 14,
                          }}
                        >
                          <p
                            className="obs-mono"
                            style={{
                              fontSize: "var(--fs-mono-xs)",
                              letterSpacing: "0.16em",
                              color: "var(--color-fg-dim)",
                              textTransform: "uppercase",
                            }}
                          >
                            Actifs média · {g.filiales.length}
                          </p>
                          <span
                            className="obs-mono"
                            style={{
                              fontSize: 9.5,
                              letterSpacing: "0.12em",
                              color: "var(--color-fg-faint)",
                              textTransform: "uppercase",
                            }}
                          >
                            Ligne pleine = lien gouv. / pointillé = orientation
                          </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {Object.entries(TYPE_LABELS)
                            .filter(([type]) => g.filiales.some((f) => f.type === type))
                            .map(([type, label]) => {
                              const items = g.filiales.filter((f) => f.type === type);
                              const color = TYPE_COLORS[type] ?? "var(--color-fg-dim)";
                              return (
                                <div key={type}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      marginBottom: 6,
                                      paddingBottom: 4,
                                      borderBottom: "1px solid var(--line)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 6,
                                        height: 6,
                                        background: color,
                                        borderRadius: "50%",
                                      }}
                                    />
                                    <span
                                      className="obs-mono"
                                      style={{
                                        fontSize: "var(--fs-mono-xs)",
                                        letterSpacing: "0.14em",
                                        color: "var(--color-fg-mute)",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {label}
                                    </span>
                                    <span
                                      className="obs-mono"
                                      style={{
                                        fontSize: 9.5,
                                        color: "var(--color-fg-dim)",
                                        letterSpacing: "0.1em",
                                      }}
                                    >
                                      {items.length}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {items.map((f, i) => (
                                      <span
                                        key={f.nom}
                                        className="fade-up"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 6,
                                          padding: "4px 8px",
                                          border: `1px solid ${color}`,
                                          background: "transparent",
                                          color: color,
                                          fontSize: 11.5,
                                          letterSpacing: "0.01em",
                                          animationDelay: `${i * 0.02}s`,
                                        }}
                                      >
                                        {f.orientation && (
                                          <span
                                            title={ORIENTATION_LABELS[f.orientation] ?? f.orientation}
                                            style={{
                                              width: 5,
                                              height: 5,
                                              background: ORIENTATION_COLORS[f.orientation] ?? "var(--color-fg-dim)",
                                              borderRadius: "50%",
                                              flexShrink: 0,
                                            }}
                                          />
                                        )}
                                        {f.nom}
                                        {f.signalementCount > 0 && (
                                          <span
                                            className="obs-mono"
                                            style={{
                                              marginLeft: 2,
                                              padding: "0 4px",
                                              fontSize: 9,
                                              fontWeight: 600,
                                              color: "var(--color-signal)",
                                              background: "var(--signal-bg)",
                                              border: "1px solid oklch(0.55 0.12 27 / 0.35)",
                                            }}
                                          >
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
