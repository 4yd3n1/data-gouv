import { Eyebrow } from "@/components/investigative/eyebrow";
import { SrcChip } from "@/components/investigative/src-chip";
import { fmtCompact } from "@/lib/format";
import type { SouveraineteOverview } from "@/lib/souverainete-data";

export function SouveraineteHero({
  stats,
}: {
  stats: SouveraineteOverview["stats"];
}) {
  const valeurMd = Number(stats.valeurCessionsEur / BigInt(1_000_000_000));
  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-ink-2)",
        background: "var(--color-ink-0)",
      }}
    >
      <div
        className="mx-auto max-w-5xl px-6 py-12 space-y-6"
        style={{ paddingTop: 80, paddingBottom: 56 }}
      >
        <Eyebrow tone="red">Souveraineté économique · Dossier</Eyebrow>
        <h1
          className="hd"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 5vw, 58px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--color-fg)",
            maxWidth: "32ch",
            margin: 0,
          }}
        >
          Les fleurons français{" "}
          <em style={{ fontStyle: "italic", color: "var(--color-signal)" }}>
            cédés à l'étranger
          </em>{" "}
          depuis 2014.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 19,
            lineHeight: 1.5,
            color: "var(--color-fg-mute)",
            maxWidth: "62ch",
          }}
        >
          {stats.totalCas} cas documentés et sourcés — cessions, OPA bloquées,
          fusions par domiciliation, sauvetages domestiques, rachats étatiques.
          De Lafarge-Holcim ({stats.plusAncien}) à SFR-opérateurs français
          ({stats.plusRecent}). Construit pour rendre lisible la doctrine IEF
          réelle, au-delà des annonces.
        </p>
        <div style={{ marginTop: 24 }}>
          <SrcChip
            items={[
              "Bercy",
              "Légifrance",
              "Le Monde",
              "Les Échos",
              "L'Usine Nouvelle",
              "Marleix 2018",
              "Sénat R23-568",
            ]}
          />
        </div>

        {/* 4-stat strip */}
        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 0,
            border: "1px solid var(--color-ink-2)",
            background: "var(--color-ink-1)",
          }}
        >
          <StatCell
            label="Cessions étrangères"
            value={stats.cessionsEtrangeres.toString()}
            sub="abouties, période 2014–2026"
          />
          <StatCell
            label="Vétos IEF (France)"
            value={stats.vetosFrancais.toString()}
            sub="Photonis 2020, Segault 2023"
            divider
          />
          <StatCell
            label="Sauvetages domestiques"
            value={stats.sauvetages.toString()}
            sub="consortium FR ou rachat État"
            divider
          />
          <StatCell
            label="Valeur cumulée"
            value={`${fmtCompact(valeurMd)} Md€`}
            sub="cessions étrangères seules"
            divider
            tone="red"
          />
        </div>
      </div>
    </header>
  );
}

function StatCell({
  label,
  value,
  sub,
  divider,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  divider?: boolean;
  tone?: "red";
}) {
  return (
    <div
      style={{
        padding: "20px 18px",
        borderLeft: divider ? "1px solid var(--color-ink-2)" : undefined,
      }}
    >
      <div
        className="obs-mono"
        style={{
          fontSize: "var(--fs-mono-xs)",
          letterSpacing: "0.14em",
          color: "var(--color-fg-mute)",
          marginBottom: 8,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          lineHeight: 1,
          color: tone === "red" ? "var(--color-signal)" : "var(--color-fg)",
          fontVariantNumeric: "tabular-nums",
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--color-fg-faint)",
          lineHeight: 1.4,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
