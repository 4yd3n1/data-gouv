import { ImageResponse } from "next/og";
import { getDossier } from "@/lib/dossier-config";

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
        <div style={{ height: 3, backgroundColor: accentColor, width: "100%", flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "44px 72px",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: accentColor, margin: 0, textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 600 }}>
            DOSSIER · L'OBSERVATOIRE CITOYEN
          </p>
          <p style={{ fontSize: 56, fontWeight: 700, color: WHITE, margin: "0", lineHeight: 1.05, maxWidth: 820 }}>
            {dossier.label}
          </p>
          <p style={{ fontSize: 20, color: LIGHT, margin: 0, lineHeight: 1.4, maxWidth: 720 }}>
            {dossier.subtitle}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
              padding: "14px 20px",
              backgroundColor: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              maxWidth: 680,
            }}
          >
            <div style={{ width: 3, height: 32, backgroundColor: accentColor, flexShrink: 0, borderRadius: 2 }} />
            <p style={{ fontSize: 14, color: WHITE, margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
              {dossier.stat}
            </p>
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
            <div style={{ width: 16, height: 2, backgroundColor: accentColor }} />
            <p style={{ fontSize: 11, color: accentColor, margin: 0 }}>Transparence par les données</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
