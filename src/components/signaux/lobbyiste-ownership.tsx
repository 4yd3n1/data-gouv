import Link from "next/link";
import { fmt, fmtDate } from "@/lib/format";
import type { LobbyOwnership, LobbyOwnerDirigeant } from "@/lib/lobby-overview";

const CAT_LABEL: Record<LobbyOwnerDirigeant["carriere"][number]["categorie"], string> = {
  FORMATION: "Formation",
  FONCTION_PUBLIQUE: "Fonction publique",
  CABINET_MINISTERIEL: "Cabinet ministériel",
  MANDAT_ELECTIF: "Mandat électif",
  MANDAT_GOUVERNEMENTAL: "Mandat gouvernemental",
  ENTREPRISE_PRIVEE: "Entreprise privée",
  LOBBY: "Lobby",
  ASSOCIATION: "Association",
  MEDIA: "Média",
  AUTRE: "Autre",
};

const CAT_COLOR: Record<LobbyOwnerDirigeant["carriere"][number]["categorie"], string> = {
  FORMATION: "var(--color-fg-dim)",
  FONCTION_PUBLIQUE: "var(--color-verified)",
  CABINET_MINISTERIEL: "var(--color-signal)",
  MANDAT_ELECTIF: "var(--color-signal)",
  MANDAT_GOUVERNEMENTAL: "var(--color-signal)",
  ENTREPRISE_PRIVEE: "var(--color-warn)",
  LOBBY: "var(--color-warn)",
  ASSOCIATION: "var(--color-fg-mute)",
  MEDIA: "var(--color-verified)",
  AUTRE: "var(--color-fg-dim)",
};

function yearRange(d: Date | null, end: Date | null): string {
  if (!d && !end) return "";
  const y1 = d ? d.getUTCFullYear() : "";
  const y2 = end ? end.getUTCFullYear() : d ? "présent" : "";
  if (!y1 && !y2) return "";
  return `${y1}${y1 && y2 ? " → " : ""}${y2}`;
}

function sourceBadge(source: LobbyOwnerDirigeant["source"]): {
  label: string;
  color: string;
} {
  switch (source) {
    case "RECHERCHE_ENTREPRISES":
      return { label: "RNE/API.GOUV", color: "var(--color-verified)" };
    case "RNE_INPI":
      return { label: "INPI RNE", color: "var(--color-verified)" };
    case "RESEARCH":
      return { label: "RECHERCHE ÉDITORIALE", color: "var(--color-fg-mute)" };
    case "HATVP":
      return { label: "HATVP REGISTRE", color: "var(--color-fg-mute)" };
  }
}

/* ------------------------------------------------------------------ */
/*  FIG. 3 — Dirigeants + carrière expandable                          */
/* ------------------------------------------------------------------ */

export function DirigeantsSection({ data }: { data: LobbyOwnership }) {
  if (data.dirigeants.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed var(--line)",
          background: "var(--color-ink-1)",
          padding: "22px 24px",
          color: "var(--color-fg-dim)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>
          Aucun dirigeant recensé pour cette organisation dans notre base. L'ingestion
          RNE (recherche-entreprises.api.gouv.fr) vise à compléter ce bloc pour toutes
          les organisations avec un SIREN ; couverture éditoriale en parallèle.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 18,
      }}
    >
      {data.dirigeants.map((d) => {
        const src = sourceBadge(d.source);
        const displayName = [d.prenom, d.nom].filter(Boolean).join(" ");
        const dob = d.dateNaissanceAnnee ? `né(e) ${d.dateNaissanceAnnee}` : null;
        return (
          <div
            key={d.id}
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div>
              <div
                className="obs-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--color-fg-dim)",
                  marginBottom: 6,
                }}
              >
                {d.fonction ?? "Dirigeant"}
              </div>
              <div
                className="obs-serif"
                style={{
                  fontSize: 20,
                  lineHeight: 1.15,
                  color: "var(--color-fg)",
                }}
              >
                {displayName || "—"}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--color-fg-dim)",
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {yearRange(d.dateDebut, d.dateFin) && (
                  <span>{yearRange(d.dateDebut, d.dateFin)}</span>
                )}
                {dob && <span>· {dob}</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {d.personnaliteSlug && (
                <Link
                  href={`/profils/${d.personnaliteSlug}`}
                  className="sig-tag"
                  style={{ textDecoration: "none" }}
                >
                  ◆ Personnalité publique
                  {d.personnaliteCurrentMandat ? ` · ${d.personnaliteCurrentMandat}` : ""}
                </Link>
              )}
              <span
                className="obs-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: src.color,
                  border: "1px solid var(--line)",
                  padding: "3px 7px",
                }}
              >
                {src.label}
              </span>
              {!d.verifie && (
                <span
                  className="obs-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-warn)",
                    border: "1px solid var(--color-warn)",
                    padding: "3px 7px",
                  }}
                  title="Donnée éditoriale non encore validée"
                >
                  À VÉRIFIER
                </span>
              )}
            </div>

            {d.carriere.length > 0 && (
              <details
                style={{
                  borderTop: "1px solid var(--line)",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <summary
                  className="obs-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-fg-mute)",
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Parcours ({d.carriere.length})</span>
                  <span style={{ color: "var(--color-fg-faint)" }}>↓</span>
                </summary>
                <ol
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "12px 0 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {d.carriere.map((c) => (
                    <li key={c.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10 }}>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          color: "var(--color-fg-dim)",
                          textTransform: "uppercase",
                          paddingTop: 3,
                        }}
                      >
                        {yearRange(c.dateDebut, c.dateFin) || "—"}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--color-fg)", lineHeight: 1.45 }}>
                          {c.titre}
                        </div>
                        {c.organisation && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--color-fg-mute)",
                              marginTop: 2,
                            }}
                          >
                            {c.organisation}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            marginTop: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className="obs-mono"
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              color: CAT_COLOR[c.categorie],
                            }}
                          >
                            {CAT_LABEL[c.categorie]}
                          </span>
                          {c.sourceUrl && (
                            <a
                              href={c.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="obs-mono"
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "var(--color-fg-faint)",
                                textDecoration: "underline",
                                textUnderlineOffset: 3,
                              }}
                            >
                              src
                            </a>
                          )}
                          {!c.verifie && (
                            <span
                              className="obs-mono"
                              style={{
                                fontSize: 9,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "var(--color-warn)",
                              }}
                            >
                              · non vérifié
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FIG. 5 — Liens avec le gouvernement (govTies)                       */
/* ------------------------------------------------------------------ */

export function GovTiesSection({ data }: { data: LobbyOwnership }) {
  if (data.govTies.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed var(--line)",
          background: "var(--color-ink-1)",
          padding: "22px 24px",
          color: "var(--color-fg-dim)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>
          Aucun lien direct identifié par recoupement automatique avec les déclarations
          HATVP et carrières privées connues des personnalités publiques de notre base.
          Une absence peut signaler soit un couplage non-nominal (filiale, ancienne
          dénomination), soit qu'aucune personne publique actuellement répertoriée n'a
          travaillé pour cette organisation.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        background: "var(--color-ink-1)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          minWidth: 640,
        }}
      >
        <thead>
          <tr
            className="obs-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--color-fg-dim)",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <th style={{ textAlign: "left", padding: "10px 14px" }}>Personnalité</th>
            <th style={{ textAlign: "left", padding: "10px 14px" }}>Mandat actuel</th>
            <th style={{ textAlign: "left", padding: "10px 14px" }}>Lien déclaré</th>
            <th style={{ textAlign: "left", padding: "10px 14px", width: 120 }}>Période</th>
          </tr>
        </thead>
        <tbody>
          {data.govTies.map((t, i) => (
            <tr
              key={`${t.personnaliteSlug}-${i}`}
              style={{ borderBottom: "1px solid var(--line)" }}
            >
              <td style={{ padding: "10px 14px" }}>
                <Link
                  href={`/profils/${t.personnaliteSlug}`}
                  className="obs-serif"
                  style={{
                    color: "var(--color-fg)",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    textDecorationColor: "var(--color-fg-faint)",
                  }}
                >
                  {t.prenom} {t.nom}
                </Link>
              </td>
              <td style={{ padding: "10px 14px", color: "var(--color-fg-mute)" }}>
                {t.mandatTitre ?? "—"}
              </td>
              <td style={{ padding: "10px 14px", color: "var(--color-fg)" }}>
                <div>{t.titre}</div>
                <div
                  className="obs-mono"
                  style={{
                    marginTop: 3,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color:
                      t.kind === "carriere_prive"
                        ? "var(--color-warn)"
                        : "var(--color-verified)",
                  }}
                >
                  {t.kind === "carriere_prive"
                    ? "Carrière privée déclarée"
                    : `HATVP · ${t.rubrique?.replace(/_/g, " ").toLowerCase() ?? "intérêt"}`}
                  {" · "}
                  {t.organisation}
                </div>
              </td>
              <td
                style={{
                  padding: "10px 14px",
                  color: "var(--color-fg-dim)",
                  fontSize: 11,
                }}
              >
                {yearRange(t.dateDebut, t.dateFin) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Positions éditoriales — "Ce que X défend"                           */
/* ------------------------------------------------------------------ */

export function PositionsSection({ data }: { data: LobbyOwnership }) {
  const visible = data.positions.filter((p) => p.verifie);
  const pendingCount = data.positions.length - visible.length;

  if (visible.length === 0 && pendingCount === 0) {
    return (
      <div
        style={{
          border: "1px dashed var(--line)",
          background: "var(--color-ink-1)",
          padding: "22px 24px",
          color: "var(--color-fg-dim)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>Couverture éditoriale en cours.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {visible.map((p) => (
        <article
          key={p.id}
          style={{
            border: "1px solid var(--line)",
            background: "var(--color-ink-1)",
            padding: "18px 22px",
          }}
        >
          <div
            className="obs-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-signal)",
              marginBottom: 8,
            }}
          >
            ◆ {p.thematique}
          </div>
          <p
            className="obs-serif"
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--color-fg)",
            }}
          >
            {p.positionDeclaree}
          </p>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontSize: 11,
              color: "var(--color-fg-dim)",
            }}
          >
            <span className="obs-mono" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Source
            </span>
            {p.sourceUrl ? (
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--color-fg-mute)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {p.source}
              </a>
            ) : (
              <span>{p.source}</span>
            )}
            {p.sourceDate && <span>· {fmtDate(p.sourceDate)}</span>}
          </div>
        </article>
      ))}
      {pendingCount > 0 && (
        <p
          className="obs-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-warn)",
            margin: 0,
          }}
        >
          {fmt(pendingCount)} position{pendingCount > 1 ? "s" : ""} en cours de vérification éditoriale — non affichée{pendingCount > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}
