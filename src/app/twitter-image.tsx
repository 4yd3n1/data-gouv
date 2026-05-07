import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

const BG      = "#080c14";
const SURFACE = "#111827";
const BORDER  = "#1a2236";
const DIM     = "#64748b";
const LIGHT   = "#94a3b8";
const WHITE   = "#e2e8f0";
const TEAL    = "#2dd4bf";

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
        <div style={{ height: 3, backgroundColor: TEAL, width: "100%", flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "48px 72px",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: TEAL,
              margin: "0 0 20px",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 600,
            }}
          >
            INTELLIGENCE CIVIQUE · DONNÉES PUBLIQUES
          </p>
          <p
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: WHITE,
              margin: "0 0 16px",
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
            }}
          >
            L&apos;Observatoire
          </p>
          <p
            style={{
              fontSize: 22,
              color: LIGHT,
              margin: "0 0 32px",
              lineHeight: 1.4,
              maxWidth: 640,
            }}
          >
            Bureau des données publiques — gouvernance, votes, lobbying, territoire. 800 000+ lignes de données vérifiables.
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            {["HATVP", "AGORA", "Assemblée", "INSEE"].map((src) => (
              <div
                key={src}
                style={{
                  padding: "5px 12px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 4,
                  fontSize: 11,
                  color: DIM,
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  backgroundColor: SURFACE,
                }}
              >
                {src}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            height: 48,
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
          <p style={{ fontSize: 11, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600 }}>
            L'OBSERVATOIRE CITOYEN
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 16, height: 2, backgroundColor: TEAL }} />
            <p style={{ fontSize: 11, color: TEAL, margin: 0 }}>Transparence par les données</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
