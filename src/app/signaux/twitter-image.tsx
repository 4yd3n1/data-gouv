import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

const BG      = "#080c14";
const SURFACE = "#111827";
const BORDER  = "#1a2236";
const DIM     = "#64748b";
const LIGHT   = "#94a3b8";
const WHITE   = "#e2e8f0";
const ROSE    = "#f43f5e";
const TEAL    = "#2dd4bf";

export default async function Image() {
  const [conflictCount, latestLog] = await Promise.all([
    prisma.conflictSignal.count(),
    prisma.ingestionLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const lastUpdate = latestLog?.createdAt
    ? latestLog.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

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
        <div style={{ height: 3, backgroundColor: ROSE, width: "100%", flexShrink: 0 }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            padding: "44px 72px",
            gap: "56px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <p style={{ fontSize: 13, color: ROSE, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 600 }}>
              SIGNAUX D'ALERTE
            </p>
            <p style={{ fontSize: 72, fontWeight: 700, color: WHITE, margin: "0 0 8px", lineHeight: 1.0 }}>
              {conflictCount.toLocaleString("fr-FR")}
            </p>
            <p style={{ fontSize: 22, color: LIGHT, margin: 0, lineHeight: 1.4 }}>
              signaux détectés — conflits, portes tournantes, lobbying, dissidences
            </p>
          </div>

          <div
            style={{
              backgroundColor: SURFACE,
              borderRadius: 12,
              padding: "28px 32px",
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              width: 260,
              flexShrink: 0,
            }}
          >
            <p style={{ fontSize: 11, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              MISE À JOUR
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: TEAL, margin: 0 }}>
              {lastUpdate}
            </p>
            <p style={{ fontSize: 12, color: DIM, margin: "8px 0 0", lineHeight: 1.5 }}>
              HATVP · AGORA · Assemblée · Sénat
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
            <div style={{ width: 16, height: 2, backgroundColor: ROSE }} />
            <p style={{ fontSize: 11, color: ROSE, margin: 0 }}>Transparence des institutions</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
