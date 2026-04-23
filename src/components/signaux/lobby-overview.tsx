import Link from "next/link";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { SrcChip } from "@/components/investigative/src-chip";
import { BarRows, type BarRowItem } from "@/components/investigative/bar-rows";
import { fmt } from "@/lib/format";
import type { LobbyOverviewData } from "@/lib/lobby-overview";
import { LobbyTimelineChart } from "./lobby-timeline-chart";

const CELL_PADDING = "12px 14px";

function SectionHeader({
  eyebrow,
  figLabel,
  title,
  subtitle,
  meta,
}: {
  eyebrow: string;
  figLabel?: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <Eyebrow tone="red" size="sm">
          ◆ {eyebrow}
        </Eyebrow>
        {figLabel && (
          <>
            <span
              className="obs-mono"
              style={{
                color: "var(--color-fg-dim)",
                fontSize: "var(--fs-mono-xs)",
              }}
            >
              //
            </span>
            <Eyebrow>{figLabel}</Eyebrow>
          </>
        )}
      </div>
      <h2
        className="hd"
        style={{
          margin: 0,
          fontSize: "clamp(28px, 3.2vw, 42px)",
          lineHeight: 1.05,
          fontWeight: 400,
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="obs-serif"
          style={{
            marginTop: 10,
            fontSize: 16,
            lineHeight: 1.45,
            color: "var(--color-fg-mute)",
            maxWidth: 760,
          }}
        >
          {subtitle}
        </p>
      )}
      {meta && <div style={{ marginTop: 14 }}>{meta}</div>}
    </div>
  );
}

function StatCell({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div style={{ background: "var(--color-ink-1)", padding: "18px 20px" }}>
      <div
        className="obs-serif"
        style={{
          fontSize: 30,
          lineHeight: 1,
          color: "var(--color-fg)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div
        className="obs-mono"
        style={{
          marginTop: 8,
          fontSize: 10,
          letterSpacing: "0.14em",
          color: "var(--color-fg-mute)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "var(--color-fg-dim)",
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function LobbyOverview({ data }: { data: LobbyOverviewData }) {
  const { stats, byMinistry, byRepresentant, byDomaine, timeline } = data;
  const avgPerYearRecent = (() => {
    const recent = timeline.years.filter(
      (y) => y.year >= "2022" && y.year <= "2024",
    );
    if (!recent.length) return 0;
    return Math.round(
      recent.reduce((s, y) => s + y.total, 0) / recent.length,
    );
  })();

  const domainBarItems: BarRowItem[] = byDomaine.map((d, i) => ({
    label: d.label,
    value: d.declarations,
    display: fmt(d.declarations),
    color:
      i < 3
        ? "var(--color-signal)"
        : i < 6
          ? "oklch(0.55 0.12 27 / 0.6)"
          : "var(--color-fg-faint)",
  }));

  return (
    <>
      {/* Hero */}
      <section
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--color-ink-0)",
        }}
      >
        <div
          className="mx-auto max-w-7xl px-6"
          style={{ paddingTop: 40, paddingBottom: 32 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Eyebrow tone="red">◆ Signaux · Lobbying</Eyebrow>
            <span
              className="obs-mono"
              style={{
                color: "var(--color-fg-dim)",
                fontSize: "var(--fs-mono-xs)",
              }}
              aria-hidden
            >
              //
            </span>
            <Eyebrow>
              Période couverte {stats.firstYear} → {stats.lastYear}
            </Eyebrow>
          </div>

          <h1
            className="hd"
            style={{
              fontSize: "clamp(36px, 4.1vw, 56px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: 960,
              fontWeight: 400,
            }}
          >
            Qui lobbyiste{" "}
            <em>
              {fmt(stats.distinctRepresentants)} représentants d&apos;intérêts,
            </em>{" "}
            {fmt(stats.distinctMinistries)} ministères ciblés.
          </h1>

          <p
            className="obs-serif"
            style={{
              marginTop: 18,
              maxWidth: 720,
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--color-fg)",
            }}
          >
            Tout le lobbying déclaré au registre AGORA (HATVP) depuis 2018.
            Filtrable par ministère, représentant et domaine d&apos;intervention.
            Une déclaration n&apos;est pas une rencontre — voir la{" "}
            <a
              href="#methodologie"
              style={{
                color: "var(--color-fg)",
                textDecorationThickness: "1px",
              }}
            >
              méthodologie
            </a>
            .
          </p>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <SrcChip items={["AGORA", "HATVP"]} />
          </div>

          {/* Stat strip */}
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              gap: 1,
              background: "var(--line)",
              border: "1px solid var(--line)",
            }}
            className="lobby-hero-stats"
          >
            <StatCell
              value={fmt(stats.distinctRepresentants)}
              label="Représentants d'intérêts"
              sub="Enregistrés HATVP, actifs au registre"
            />
            <StatCell
              value={fmt(stats.totalDeclarations)}
              label="Déclarations AGORA"
              sub={`Moy. ${fmt(avgPerYearRecent)}/an sur 2022-2024`}
            />
            <StatCell
              value={String(stats.distinctMinistries)}
              label="Ministères ciblés"
              sub="Incluant Élysée + Matignon"
            />
            <StatCell
              value={`${stats.firstYear} → ${stats.lastYear}`}
              label="Période couverte"
              sub={
                Number(stats.lastYear) >= new Date().getFullYear()
                  ? "Dernière année partielle"
                  : ""
              }
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-20">
        {/* Section 1 — Pression par ministère */}
        <section id="par-ministere" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Pression par ministère"
            figLabel={`FIG. 1 · ${stats.distinctMinistries} ministères`}
            title="Où s'exerce l'influence ?"
            subtitle="Chaque ligne = un ministère, classé par nombre de déclarations AGORA reçues. « Part du 1er lobbyiste » indique la concentration : à 10 %+, une seule structure domine visiblement le registre de ce ministère."
          />

          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
                minWidth: 720,
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
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    Ministère
                  </th>
                  <th style={{ textAlign: "right", padding: CELL_PADDING }}>
                    Déclarations
                  </th>
                  <th style={{ textAlign: "right", padding: CELL_PADDING }}>
                    Représentants
                  </th>
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    1ᵉʳ lobbyiste (part)
                  </th>
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    Ministre en poste
                  </th>
                </tr>
              </thead>
              <tbody>
                {byMinistry.map((row) => (
                  <tr
                    key={row.code}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg)",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        textAlign: "right",
                        color: "var(--color-fg)",
                      }}
                    >
                      {fmt(row.declarations)}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        textAlign: "right",
                        color: "var(--color-fg-mute)",
                      }}
                    >
                      {fmt(row.representants)}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg-mute)",
                      }}
                    >
                      {row.topRepresentantNom}
                      <span
                        className="obs-mono"
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          color: "var(--color-fg-dim)",
                        }}
                      >
                        {(row.topRepresentantShare * 100).toLocaleString(
                          "fr-FR",
                          { maximumFractionDigits: 1 },
                        )}{" "}
                        %
                      </span>
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg-dim)",
                      }}
                    >
                      {row.ministerSlug && row.ministerLabel ? (
                        <Link
                          href={`/profils/${row.ministerSlug}?tab=mandats`}
                          style={{
                            color: "var(--color-fg-mute)",
                            textDecoration: "underline",
                            textDecorationColor: "var(--line)",
                            textDecorationThickness: "1px",
                            textUnderlineOffset: 3,
                          }}
                        >
                          {row.ministerLabel}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2 — Top 20 représentants */}
        <section id="par-representant" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Acteurs"
            figLabel={`FIG. 2 · Top ${byRepresentant.length}`}
            title="Les 20 lobbyistes les plus actifs"
            subtitle="Classement par nombre de déclarations AGORA, tous ministères confondus. « Ministères touchés » mesure la polyvalence ; un cabinet de conseil ciblant 17 ministères négocie pour une clientèle hétérogène."
          />

          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
                minWidth: 720,
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
                  <th
                    style={{
                      textAlign: "right",
                      padding: CELL_PADDING,
                      width: 40,
                    }}
                  >
                    #
                  </th>
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    Représentant
                  </th>
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    Catégorie
                  </th>
                  <th style={{ textAlign: "right", padding: CELL_PADDING }}>
                    Déclarations
                  </th>
                  <th style={{ textAlign: "right", padding: CELL_PADDING }}>
                    Ministères
                  </th>
                  <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                    Domaines principaux
                  </th>
                </tr>
              </thead>
              <tbody>
                {byRepresentant.map((row) => (
                  <tr
                    key={row.nom}
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <td
                      className="obs-mono"
                      style={{
                        padding: CELL_PADDING,
                        textAlign: "right",
                        color: "var(--color-fg-dim)",
                      }}
                    >
                      {String(row.rank).padStart(2, "0")}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg)",
                      }}
                    >
                      {row.lobbyisteId ? (
                        <Link
                          href={`/profils/lobbyistes/${row.lobbyisteId}`}
                          style={{
                            color: "var(--color-fg)",
                            textDecoration: "underline",
                            textDecorationColor: "var(--line)",
                            textDecorationThickness: "1px",
                            textUnderlineOffset: 3,
                          }}
                        >
                          {row.nom}
                        </Link>
                      ) : (
                        row.nom
                      )}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg-mute)",
                        fontSize: 12,
                      }}
                    >
                      {row.categorie}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        textAlign: "right",
                        color: "var(--color-fg)",
                      }}
                    >
                      {fmt(row.declarations)}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        textAlign: "right",
                        color: "var(--color-fg-mute)",
                      }}
                    >
                      {row.ministriesTouched}
                    </td>
                    <td
                      style={{
                        padding: CELL_PADDING,
                        color: "var(--color-fg-dim)",
                        fontSize: 12,
                      }}
                    >
                      {row.topDomains.join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3 — Top domaines */}
        <section id="par-domaine" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Thématiques"
            figLabel={`FIG. 3 · Top ${byDomaine.length}`}
            title="Sujets les plus lobbyistés"
            subtitle="Le champ « domaine » d'AGORA est un texte libre (7 700+ valeurs uniques) : nous le décomposons par virgule et regroupons les synonymes évidents (Santé + Système de santé, Agriculture + Agroalimentaire…)."
          />

          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              padding: "22px 24px",
            }}
          >
            <BarRows items={domainBarItems} labelWidth={200} />
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            {byDomaine.slice(0, 8).map((d) => (
              <div
                key={d.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: 16,
                  fontSize: 13,
                  color: "var(--color-fg-mute)",
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: 12,
                }}
              >
                <div style={{ color: "var(--color-fg)" }}>
                  {d.label}
                  <span
                    className="obs-mono"
                    style={{
                      marginLeft: 10,
                      fontSize: 10,
                      color: "var(--color-fg-dim)",
                    }}
                  >
                    {fmt(d.declarations)}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--color-fg-dim)" }}>
                    Principaux :{" "}
                  </span>
                  {d.topReps.slice(0, 3).join(" · ")}
                  {d.topMinistries.length > 0 && (
                    <>
                      <span style={{ color: "var(--color-fg-dim)" }}>
                        {" "}
                        · Ministères :{" "}
                      </span>
                      {d.topMinistries.join(", ")}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 — Timeline */}
        <section id="evolution" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Évolution"
            figLabel={`FIG. 4 · ${timeline.years.length} exercices`}
            title={`Déclarations par année, ${timeline.years[0]?.year ?? ""}–${timeline.years[timeline.years.length - 1]?.year ?? ""}`}
            subtitle="Volume cumulatif par exercice fiscal, stacké par les 6 ministères les plus ciblés. Les dernières années ne sont pas complètes : les filings arrivent au registre après la clôture de l'exercice."
          />

          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              padding: "22px 24px",
            }}
          >
            <LobbyTimelineChart data={timeline} />
          </div>
        </section>

        {/* Section 5 — Méthodologie */}
        <section id="methodologie" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Méthodologie"
            title="Comment lire ces chiffres"
          />

          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--color-ink-1)",
              padding: "24px 28px",
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 32,
            }}
            className="lobby-methodo-grid"
          >
            <div
              className="obs-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "var(--color-fg-dim)",
                textTransform: "uppercase",
                lineHeight: 1.6,
              }}
            >
              Source
              <br />
              Unité
              <br />
              Limites
              <br />
              Couverture
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "var(--color-fg)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <p>
                <strong style={{ color: "var(--color-fg)" }}>Source.</strong>{" "}
                Registre AGORA de la Haute Autorité pour la transparence de la
                vie publique (HATVP), qui compile les déclarations annuelles des
                représentants d&apos;intérêts enregistrés. Dataset{" "}
                <a
                  href="https://www.hatvp.fr/open-data/"
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: "var(--color-fg)",
                    textDecorationColor: "var(--line)",
                  }}
                >
                  hatvp.fr/open-data
                </a>
                .
              </p>
              <p>
                <strong style={{ color: "var(--color-fg)" }}>Unité.</strong>{" "}
                Une <em>déclaration</em> = une ligne du filing annuel d&apos;un
                représentant, scopée à une combinaison (ministère × exercice ×
                tranche de dépenses × domaine × type d&apos;action). Ce{" "}
                <strong>n&apos;est pas</strong> une rencontre ni un meeting.
                Le même représentant remplit typiquement plusieurs déclarations
                par an quand son activité couvre plusieurs domaines.
              </p>
              <p>
                <strong style={{ color: "var(--color-fg)" }}>Limites.</strong>{" "}
                Le champ <code>typeAction</code> est un vocabulaire contraint
                (146 valeurs, dont une formulation générique qui couvre 33 % des
                lignes). Le champ <code>domaine</code> est du texte libre (7 700
                valeurs) ; nous regroupons les synonymes courants (ex. « Santé »
                et « Système de santé » comptés ensemble). Le champ{" "}
                <code>sourceUrl</code> est vide pour toutes les lignes du
                dataset actuel → pas de lien vers les filings HATVP originaux.
              </p>
              <p>
                <strong style={{ color: "var(--color-fg)" }}>
                  Couverture temporelle.
                </strong>{" "}
                Période {stats.firstYear}–{stats.lastYear}. Les années les plus
                récentes ({Number(stats.lastYear) - 1}-{stats.lastYear}) sont
                partielles car les filings annuels arrivent au registre après
                la clôture de l&apos;exercice fiscal.
              </p>
            </div>
          </div>
        </section>

        {/* Back to general signaux */}
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <Link
            href="/signaux"
            className="obs-mono"
            style={{
              color: "var(--color-fg-mute)",
              fontSize: "var(--fs-mono-sm)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderBottom: "1px solid var(--line)",
              paddingBottom: 2,
            }}
          >
            ← Tous les signaux
          </Link>
        </div>
      </div>
    </>
  );
}
