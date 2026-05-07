import { Eyebrow } from "@/components/investigative/eyebrow";
import { fmtCompact, fmtShortDate } from "@/lib/format";
import {
  CATEGORIE_LABELS,
  MESURE_LABELS,
  PAYS_LABELS,
  SECTEUR_LABELS,
  type SouveraineteRow,
} from "@/lib/souverainete-data";
import { CategorieAcquisition } from "@prisma/client";

const CATEGORY_BADGE: Record<
  CategorieAcquisition,
  { label: string; tone: "red" | "verified" | "warn" | "neutral" }
> = {
  CESSION_ETRANGERE: { label: "Cession", tone: "red" },
  FUSION_DOMICILIATION: { label: "Fusion-domic.", tone: "red" },
  SCISSION_DOMICILIATION: { label: "Scission-domic.", tone: "red" },
  VENTE_DETRESSE: { label: "Détresse", tone: "red" },
  RESTRUCTURATION_DETTE: { label: "Dette", tone: "warn" },
  VETO_IEF: { label: "Veto IEF", tone: "verified" },
  RETRAIT_POLITIQUE: { label: "Retrait politique", tone: "verified" },
  SAUVETAGE_DOMESTIQUE: { label: "Sauvetage", tone: "verified" },
  RACHAT_ETATIQUE: { label: "Rachat État", tone: "verified" },
  ANCRAGE_DOMESTIQUE: { label: "Ancrage", tone: "warn" },
};

const TONE_CLASS: Record<string, string> = {
  red: "sig-tag",
  verified: "sig-tag sig-tag--verified",
  warn: "sig-tag sig-tag--amber",
  neutral: "sig-tag sig-tag--neutral",
};

export function SouveraineteTable({
  rows,
}: {
  rows: readonly SouveraineteRow[];
}) {
  // Sort: most recent first by dateAnnonce, fallback dateCloture
  const sorted = [...rows].sort((a, b) => {
    const ad = a.dateAnnonce ?? a.dateCloture ?? new Date(0);
    const bd = b.dateAnnonce ?? b.dateCloture ?? new Date(0);
    return bd.getTime() - ad.getTime();
  });

  return (
    <section style={{ marginBottom: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <Eyebrow>FIG. 5</Eyebrow>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "var(--color-fg)",
            margin: 0,
          }}
        >
          Cas documentés
        </h2>
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-fg-mute)",
          margin: "8px 0 22px 0",
          maxWidth: "72ch",
        }}
      >
        Ordre antichronologique. Toute affirmation factuelle est sourcée — la
        source primaire est cliquable. Les phases enfants (post-veto,
        recapitalisation, rachat étatique) sont indentées sous leur dossier
        parent.
      </p>

      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          borderTop: "1px solid var(--color-ink-2)",
        }}
      >
        {sorted.map((row) => (
          <CaseRow key={row.id} row={row} />
        ))}
      </ol>
    </section>
  );
}

function CaseRow({ row }: { row: SouveraineteRow }) {
  const badge = CATEGORY_BADGE[row.categorie];
  const valeur = row.valeurEur
    ? formatValueEur(row.valeurEur)
    : "—";
  const dateRef = row.dateAnnonce ?? row.dateCloture;
  const isChild = !!row.parentDealId;

  return (
    <li
      style={{
        borderBottom: "1px solid var(--color-ink-2)",
        padding: "20px 0",
        paddingLeft: isChild ? 32 : 0,
        position: "relative",
      }}
    >
      {isChild && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 8,
            top: 28,
            width: 16,
            height: 1,
            background: "var(--color-fg-faint)",
          }}
        />
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) auto",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Col 1 — target + acquirer */}
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <span className={TONE_CLASS[badge.tone]}>
              {badge.label.toUpperCase()}
            </span>
            <span
              className="obs-mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "var(--color-fg-mute)",
              }}
            >
              {dateRef ? fmtShortDate(dateRef) : "—"}
            </span>
            {row.precedeMacron && (
              <span
                className="obs-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  color: "var(--color-fg-faint)",
                  border: "1px solid var(--color-ink-2)",
                  padding: "1px 6px",
                }}
              >
                PRÉ-MACRON
              </span>
            )}
          </div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              lineHeight: 1.25,
              color: "var(--color-fg)",
              margin: "0 0 4px 0",
              fontWeight: 500,
            }}
          >
            {row.cibleNom}
          </h3>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-fg-mute)",
              lineHeight: 1.4,
              marginBottom: 4,
            }}
          >
            {SECTEUR_LABELS[row.cibleSecteur]}
            {row.cibleSousSecteur ? ` · ${row.cibleSousSecteur}` : ""}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-fg)", lineHeight: 1.4 }}>
            <span style={{ color: "var(--color-fg-mute)" }}>vers</span>{" "}
            <span style={{ fontWeight: 500 }}>{row.acquereurNom}</span>{" "}
            <span style={{ color: "var(--color-fg-mute)" }}>
              ({PAYS_LABELS[row.acquereurPays]}
              {row.acquereurType ? `, ${row.acquereurType.toLowerCase()}` : ""})
            </span>
          </div>
        </div>

        {/* Col 2 — context + sovereignty issue */}
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--color-fg-mute)",
          }}
        >
          <p style={{ margin: "0 0 6px 0", color: "var(--color-fg)" }}>
            {row.contexte}
          </p>
          <p style={{ margin: 0, fontStyle: "italic" }}>
            {row.enjeuxSouverainete}
          </p>
          {row.iefReference && (
            <p
              className="obs-mono"
              style={{
                margin: "8px 0 0 0",
                fontSize: 11,
                letterSpacing: "0.08em",
                color: "var(--color-fg-faint)",
              }}
            >
              IEF · {row.iefReference}
            </p>
          )}
        </div>

        {/* Col 3 — value + measure + source */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              lineHeight: 1,
              color: "var(--color-fg)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {valeur}
          </div>
          <div
            className="obs-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "var(--color-fg-faint)",
              textAlign: "right",
            }}
          >
            {MESURE_LABELS[row.mesureEtat].toUpperCase()}
          </div>
          {row.ministreReferent && (
            <div
              style={{
                fontSize: 11,
                color: "var(--color-fg-mute)",
                textAlign: "right",
              }}
            >
              {row.ministreReferent}
            </div>
          )}
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="obs-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "var(--color-signal)",
              textDecoration: "none",
              borderBottom: "1px solid var(--color-signal)",
              paddingBottom: 1,
              marginTop: 4,
            }}
          >
            {row.sourcePrincipale} →
          </a>
        </div>
      </div>
    </li>
  );
}

function formatValueEur(eur: bigint): string {
  const num = Number(eur);
  const fr = (v: number, digits: number) =>
    v.toLocaleString("fr-FR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  if (num >= 1_000_000_000) return `${fr(num / 1_000_000_000, num >= 10_000_000_000 ? 0 : 1)} Md€`;
  if (num >= 1_000_000) return `${fr(num / 1_000_000, 0)} M€`;
  return `${fr(num, 0)} €`;
}
