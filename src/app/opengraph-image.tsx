import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG      = "#080c14";
const SURFACE = "#111827";
const BORDER  = "#1a2236";
const DIM     = "#64748b";
const LIGHT   = "#94a3b8";
const WHITE   = "#e2e8f0";
const TEAL    = "#2dd4bf";
const AMBER   = "#f59e0b";

const TOPICS = [
  "Pouvoir d'achat",
  "Confiance démocratique",
  "Dette publique",
  "Emploi & jeunesse",
  "Logement",
  "Santé",
  "Transition écologique",
  "Retraites",
];

const STATS = [
  { value: "800 K+", label: "données publiques croisées", color: TEAL },
  { value: "57",     label: "tableaux de bord citoyens",   color: WHITE },
  { value: "8",      label: "dossiers thématiques",         color: AMBER },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: BG,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, backgroundColor: TEAL, width: "100%", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            padding: "44px 56px 36px",
            gap: "56px",
          }}
        >
          {/* Left: brand + dossier chips */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 12,
                color: TEAL,
                margin: "0 0 20px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
              L'OBSERVATOIRE CITOYEN
            </p>
            <p
              style={{
                fontSize: 58,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 6px",
                lineHeight: 1.05,
              }}
            >
              Intelligence civique
            </p>
            <p
              style={{
                fontSize: 22,
                color: LIGHT,
                margin: "0 0 36px",
                lineHeight: 1.4,
                maxWidth: 500,
              }}
            >
              Données gouvernementales, votes, lobbying et budgets — pour chaque citoyen.
            </p>

            {/* Dossier chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {TOPICS.map((t) => (
                <div
                  key={t}
                  style={{
                    backgroundColor: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    padding: "6px 12px",
                    display: "flex",
                  }}
                >
                  <span style={{ fontSize: 13, color: LIGHT }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: stats */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              width: 280,
              paddingTop: 4,
            }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: SURFACE,
                  borderRadius: 10,
                  padding: "18px 22px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: DIM,
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: s.color,
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom branding bar */}
        <div
          style={{
            height: 52,
            backgroundColor: SURFACE,
            display: "flex",
            alignItems: "center",
            paddingLeft: 56,
            paddingRight: 56,
            justifyContent: "space-between",
            borderTop: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: DIM,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontWeight: 600,
            }}
          >
            DONNÉES PUBLIQUES · FRANCE
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 20, height: 2, backgroundColor: TEAL }} />
            <p style={{ fontSize: 12, color: TEAL, margin: 0 }}>Transparence des élus</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
