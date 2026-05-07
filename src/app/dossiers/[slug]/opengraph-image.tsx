import { ImageResponse } from "next/og";
import { getDossier } from "@/lib/dossier-config";

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
const ROSE    = "#f43f5e";
const AMBER   = "#f59e0b";

const COLOR_MAP: Record<string, string> = {
  teal: TEAL,
  rose: ROSE,
  amber: AMBER,
  blue: "#60a5fa",
};

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dossier = getDossier(slug);

  if (!dossier) return new Response("Not found", { status: 404 });

  const accentColor = COLOR_MAP[dossier.color] ?? TEAL;

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
        <div style={{ height: 3, backgroundColor: accentColor, width: "100%", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "52px 64px 40px",
            justifyContent: "space-between",
          }}
        >
          {/* Kicker */}
          <p
            style={{
              fontSize: 13,
              color: accentColor,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 600,
            }}
          >
            DOSSIER · L'OBSERVATOIRE CITOYEN
          </p>

          {/* Title block */}
          <div>
            <p
              style={{
                fontSize: 58,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 16px",
                lineHeight: 1.05,
                maxWidth: 860,
              }}
            >
              {dossier.label}
            </p>
            <p
              style={{
                fontSize: 20,
                color: LIGHT,
                margin: "0 0 28px",
                lineHeight: 1.4,
                maxWidth: 760,
              }}
            >
              {dossier.subtitle}
            </p>

            {/* Key stat */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "18px 22px",
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                maxWidth: 760,
              }}
            >
              <div style={{ width: 3, height: 40, backgroundColor: accentColor, flexShrink: 0, borderRadius: 2 }} />
              <div>
                <p style={{ fontSize: 15, color: WHITE, margin: "0 0 4px", fontWeight: 600, lineHeight: 1.3 }}>
                  {dossier.stat}
                </p>
                <p style={{ fontSize: 12, color: DIM, margin: 0, letterSpacing: "0.06em" }}>
                  {dossier.statSource}
                </p>
              </div>
            </div>
          </div>

          {/* Sources row */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {["HATVP", "AGORA", "INSEE", "data.gouv.fr"].map((src) => (
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
                }}
              >
                {src}
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
            L'OBSERVATOIRE CITOYEN
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 20, height: 2, backgroundColor: accentColor }} />
            <p style={{ fontSize: 12, color: accentColor, margin: 0 }}>Transparence par les données</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
