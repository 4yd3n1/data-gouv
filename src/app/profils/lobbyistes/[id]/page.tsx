import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import {
  getLobbyisteAgoraDetail,
  getLobbyisteOwnership,
  type LobbyOwnership,
} from "@/lib/lobby-overview";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { SrcChip } from "@/components/investigative/src-chip";
import { BarRows, type BarRowItem } from "@/components/investigative/bar-rows";
import { LobbyTimelineChart } from "@/components/signaux/lobby-timeline-chart";
import {
  DirigeantsSection,
  GovTiesSection,
  PositionsSection,
} from "@/components/signaux/lobbyiste-ownership";

const CELL_PADDING = "10px 14px";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const l = await prisma.lobbyiste.findUnique({
    where: { id },
    select: { nom: true, categorieActivite: true },
  });
  if (!l) return { title: "Lobbyiste introuvable — L'Observatoire" };
  return {
    title: `${l.nom} — Registre des lobbyistes · L'Observatoire`,
    description: `Activités de lobbying déclarées à la HATVP par ${l.nom}${l.categorieActivite ? ` (${l.categorieActivite})` : ""}.`,
  };
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
          fontSize: 26,
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
            fontSize: 11,
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

function SectionHeader({
  eyebrow,
  figLabel,
  title,
  subtitle,
}: {
  eyebrow: string;
  figLabel?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
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
              aria-hidden
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
          fontSize: "clamp(22px, 2.4vw, 30px)",
          lineHeight: 1.1,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="obs-serif"
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--color-fg-mute)",
            maxWidth: 720,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default async function LobbyisteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lobbyiste = await prisma.lobbyiste.findUnique({
    where: { id },
    include: {
      actions: { take: 20 },
      _count: { select: { actions: true } },
    },
  });
  if (!lobbyiste) notFound();

  const [agora, ownership] = await Promise.all([
    getLobbyisteAgoraDetail(lobbyiste.nom),
    getLobbyisteOwnership(lobbyiste.id),
  ]);

  const metaItems: { label: string; value: string }[] = [
    lobbyiste.type && { label: "Type", value: lobbyiste.type },
    lobbyiste.siren && { label: "SIREN", value: lobbyiste.siren },
    lobbyiste.effectif && { label: "Effectif", value: lobbyiste.effectif },
    lobbyiste.chiffreAffaires && {
      label: "Chiffre d'affaires",
      value: lobbyiste.chiffreAffaires,
    },
    lobbyiste.adresse && { label: "Adresse", value: lobbyiste.adresse },
    lobbyiste.dateInscription && {
      label: "Inscription HATVP",
      value: fmtDate(lobbyiste.dateInscription),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const domainBarItems: BarRowItem[] = agora
    ? agora.byDomain.slice(0, 10).map((d, i) => ({
        label: d.label,
        value: d.declarations,
        display: fmt(d.declarations),
        color:
          i < 3
            ? "var(--color-signal)"
            : i < 6
              ? "oklch(0.55 0.12 27 / 0.6)"
              : "var(--color-fg-faint)",
      }))
    : [];

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
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signaux?type=lobby"
              className="obs-mono"
              style={{
                color: "var(--color-fg-dim)",
                fontSize: "var(--fs-mono-xs)",
                textDecoration: "none",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              ← Dashboard Lobbying
            </Link>
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
            <Eyebrow tone="red">◆ Registre HATVP · Lobbyiste</Eyebrow>
          </div>

          <h1
            className="hd"
            style={{
              fontSize: "clamp(32px, 3.6vw, 48px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: 960,
              fontWeight: 400,
            }}
          >
            {lobbyiste.nom}
          </h1>

          {lobbyiste.categorieActivite && (
            <p
              className="obs-serif"
              style={{
                marginTop: 14,
                fontSize: 16,
                lineHeight: 1.5,
                color: "var(--color-fg-mute)",
                maxWidth: 720,
              }}
            >
              {lobbyiste.categorieActivite}
            </p>
          )}

          {metaItems.length > 0 && (
            <dl
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "14px 24px",
                maxWidth: 960,
              }}
            >
              {metaItems.map((m) => (
                <div key={m.label}>
                  <dt
                    className="obs-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      color: "var(--color-fg-dim)",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    {m.label}
                  </dt>
                  <dd
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--color-fg)",
                    }}
                  >
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <SrcChip items={["AGORA", "HATVP"]} />
          </div>

          {/* Stat strip */}
          {agora ? (
            <div
              style={{
                marginTop: 28,
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0,1fr))",
                gap: 1,
                background: "var(--line)",
                border: "1px solid var(--line)",
              }}
              className="lobby-hero-stats"
            >
              <StatCell
                value={fmt(agora.totalDeclarations)}
                label="Déclarations AGORA"
                sub={`Période ${agora.firstYear}–${agora.lastYear}`}
              />
              <StatCell
                value={String(agora.distinctMinistries)}
                label="Ministères ciblés"
                sub={
                  agora.topMinistry
                    ? `1ᵉʳ ${agora.topMinistry.label} (${fmt(agora.topMinistry.declarations)})`
                    : undefined
                }
              />
              <StatCell
                value={String(agora.distinctDomains)}
                label="Domaines d'intervention"
                sub={
                  agora.topDomain
                    ? `1ᵉʳ ${agora.topDomain.label} (${fmt(agora.topDomain.declarations)})`
                    : undefined
                }
              />
              <StatCell
                value={`${agora.firstYear}→${agora.lastYear}`}
                label="Période couverte"
                sub={
                  agora.timeline.years.length > 0
                    ? `${agora.timeline.years.length} exercices`
                    : undefined
                }
              />
            </div>
          ) : (
            <p
              style={{
                marginTop: 28,
                padding: "14px 18px",
                fontSize: 13,
                lineHeight: 1.55,
                color: "var(--color-fg-mute)",
                background: "var(--color-ink-1)",
                border: "1px solid var(--line)",
              }}
            >
              Aucune déclaration AGORA appariée à ce nom. Le registre est
              réconcilié par normalisation (suffixes juridiques retirés) ; une
              absence peut signaler soit une inscription sans dépôts annuels,
              soit un libellé divergent côté AGORA.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-20">
        {agora && (
          <>
            {/* Section 1 — Ministères ciblés */}
            <section id="par-ministere" style={{ scrollMarginTop: 80 }}>
              <SectionHeader
                eyebrow="Cibles"
                figLabel={`FIG. 1 · ${agora.distinctMinistries} ministères`}
                title="Ministères ciblés par ce lobbyiste"
                subtitle="Répartition des déclarations AGORA par ministère, tout exercice confondu. La « part » est calculée sur le total du lobbyiste uniquement."
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
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Ministère
                      </th>
                      <th
                        style={{ textAlign: "right", padding: CELL_PADDING }}
                      >
                        Déclarations
                      </th>
                      <th
                        style={{ textAlign: "right", padding: CELL_PADDING }}
                      >
                        Part
                      </th>
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Ministre en poste
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agora.byMinistry.map((row) => (
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
                          className="obs-mono"
                          style={{
                            padding: CELL_PADDING,
                            textAlign: "right",
                            fontSize: 11,
                            color: "var(--color-fg-dim)",
                          }}
                        >
                          {(row.share * 100).toLocaleString("fr-FR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          %
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

            {/* Section 2 — Domaines */}
            {domainBarItems.length > 0 && (
              <section id="par-domaine" style={{ scrollMarginTop: 80 }}>
                <SectionHeader
                  eyebrow="Thématiques"
                  figLabel={`FIG. 2 · Top ${domainBarItems.length}`}
                  title="Domaines d'intervention"
                  subtitle="Champ libre « domaine » d'AGORA, avec fusion des synonymes courants (Santé + Système de santé, Agriculture + Agroalimentaire…)."
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
              </section>
            )}

            {/* Section 4 — Timeline */}
            {agora.timeline.years.length > 1 && (
              <section id="evolution" style={{ scrollMarginTop: 80 }}>
                <SectionHeader
                  eyebrow="Évolution"
                  figLabel={`FIG. 4 · ${agora.timeline.years.length} exercices`}
                  title={`Déclarations par année, ${agora.firstYear}–${agora.lastYear}`}
                  subtitle="Volume cumulatif par exercice fiscal, stacké par les ministères les plus ciblés. Chaque lobbyiste dispose de 3 mois après la clôture de son exercice pour déposer son rapport d'activité (art. 18-5 du règlement HATVP) — les deux dernières années sont donc mécaniquement incomplètes tant que les filings continuent d'arriver."
                />

                <div
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--color-ink-1)",
                    padding: "22px 24px",
                  }}
                >
                  <LobbyTimelineChart data={agora.timeline} />
                </div>
              </section>
            )}

            {/* Section 6 — Sample declarations */}
            <section id="declarations" style={{ scrollMarginTop: 80 }}>
              <SectionHeader
                eyebrow="Déclarations"
                figLabel={`FIG. 6 · ${agora.samples.length} lignes`}
                title="Dernières déclarations"
                subtitle="Extrait du registre AGORA pour ce lobbyiste, classé par exercice décroissant. Chaque ligne est une combinaison (ministère × exercice × tranche × domaine × type d'action)."
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
                    fontSize: 12,
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
                      <th style={{ textAlign: "left", padding: CELL_PADDING, width: 80 }}>
                        Exercice
                      </th>
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Ministère
                      </th>
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Domaine
                      </th>
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Type d'action
                      </th>
                      <th style={{ textAlign: "left", padding: CELL_PADDING }}>
                        Tranche dépenses
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agora.samples.map((s) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: "1px solid var(--line)" }}
                      >
                        <td
                          className="obs-mono"
                          style={{
                            padding: CELL_PADDING,
                            color: "var(--color-fg-mute)",
                          }}
                        >
                          {s.exercice ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: CELL_PADDING,
                            color: "var(--color-fg)",
                          }}
                        >
                          {s.ministereLabel}
                        </td>
                        <td
                          style={{
                            padding: CELL_PADDING,
                            color: "var(--color-fg-mute)",
                          }}
                        >
                          {s.domaine ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: CELL_PADDING,
                            color: "var(--color-fg-dim)",
                          }}
                        >
                          {s.typeAction ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: CELL_PADDING,
                            color: "var(--color-fg-dim)",
                          }}
                        >
                          {s.depensesTranche ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {agora.totalDeclarations > agora.samples.length && (
                <p
                  className="obs-mono"
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: "var(--color-fg-dim)",
                    textTransform: "uppercase",
                  }}
                >
                  {fmt(agora.samples.length)} / {fmt(agora.totalDeclarations)} lignes affichées
                </p>
              )}
            </section>
          </>
        )}

        {/* Propriétaires & dirigeants — always visible */}
        <section id="dirigeants" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Gouvernance"
            figLabel={
              agora
                ? `FIG. 3 · ${ownership.counts.dirigeantsTotal} dirigeant${ownership.counts.dirigeantsTotal > 1 ? "s" : ""}`
                : `${ownership.counts.dirigeantsTotal} dirigeant${ownership.counts.dirigeantsTotal > 1 ? "s" : ""}`
            }
            title={`Qui dirige ${lobbyiste.nom}`}
            subtitle="Dirigeants déclarés au Registre National des Entreprises (via recherche-entreprises.api.gouv.fr) + recherche éditoriale complémentaire sur les parcours. Les bénéficiaires effectifs (RBE) ne sont pas accessibles publiquement depuis l'arrêt CJUE 2022."
          />
          <DirigeantsSection data={ownership} />
        </section>

        {/* Liens avec le gouvernement — always visible */}
        <section id="liens-gouvernement" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Recoupements"
            figLabel={
              agora
                ? `FIG. 5 · ${ownership.counts.govTiesTotal} lien${ownership.counts.govTiesTotal > 1 ? "s" : ""}`
                : `${ownership.counts.govTiesTotal} lien${ownership.counts.govTiesTotal > 1 ? "s" : ""}`
            }
            title="Liens avec le gouvernement"
            subtitle="Personnalités publiques de notre base dont la carrière privée ou la déclaration HATVP mentionne cette organisation. Recoupement automatique par nom normalisé — une absence peut signaler un nom de filiale divergent ou une personne non encore répertoriée."
          />
          <GovTiesSection data={ownership} />
        </section>

        {/* Positions éditoriales */}
        <section id="positions" style={{ scrollMarginTop: 80 }}>
          <SectionHeader
            eyebrow="Agenda"
            title={`Ce que ${lobbyiste.nom} défend`}
            subtitle="Positions déclarées par l'organisation, issues de nos sources éditoriales. Seuls les éléments validés manuellement s'affichent (statut verifie=true)."
          />
          <PositionsSection data={ownership} />
        </section>

        {/* Fallback: ActionLobbyiste (old narrow dataset) — shown only when still relevant */}
        {lobbyiste.actions.length > 0 && (
          <section id="hatvp-actions" style={{ scrollMarginTop: 80 }}>
            <SectionHeader
              eyebrow="Registre HATVP"
              title="Activités déclarées au registre (extraits)"
              subtitle={`${lobbyiste._count.actions} entrée${lobbyiste._count.actions > 1 ? "s" : ""} dans le registre HATVP initial, avant ventilation AGORA.`}
            />
            <div
              style={{
                border: "1px solid var(--line)",
                background: "var(--color-ink-1)",
              }}
            >
              {lobbyiste.actions.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    padding: "14px 18px",
                    borderBottom:
                      i < lobbyiste.actions.length - 1
                        ? "1px solid var(--line)"
                        : undefined,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "baseline",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--color-fg)",
                      lineHeight: 1.5,
                    }}
                  >
                    {a.description || a.type || "Action non détaillée"}
                    {(a.domaine || a.type || a.periode) && (
                      <div
                        className="obs-mono"
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          color: "var(--color-fg-dim)",
                          textTransform: "uppercase",
                        }}
                      >
                        {[a.domaine, a.type, a.periode]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div style={{ textAlign: "center", paddingTop: 12 }}>
          <Link
            href="/signaux?type=lobby"
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
            ← Dashboard lobbying
          </Link>
        </div>
      </div>
    </>
  );
}
