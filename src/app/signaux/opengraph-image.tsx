import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

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

const TYPE_LABELS: Record<string, string> = {
  conflit: "Conflits d'intérêts",
  porte: "Portes tournantes",
  lobby: "Lobbying",
  "lobby-owner": "Liens lobby",
  media: "Nexus médias",
  ecart: "Écarts HATVP",
  dissidence: "Dissidences",
};

export default async function Image() {
  const [conflictCount, totalSignals, latestLog] = await Promise.all([
    prisma.conflictSignal.count(),
    prisma.conflictSignal.groupBy({
      by: ["tag"],
      _count: { tag: true },
      orderBy: { _count: { tag: "desc" } },
      take: 4,
    }),
    prisma.ingestionLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const lastUpdate = latestLog?.createdAt
    ? latestLog.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const topTypes = totalSignals.map((row) => ({
    label: TYPE_LABELS[row.tag] ?? row.tag,
    count: row._count.tag,
  }));

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
        <div style={{ height: 3, backgroundColor: ROSE, width: "100%", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            padding: "44px 56px 36px",
            gap: "48px",
          }}
        >
          {/* Left: headline */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                color: ROSE,
                margin: "0 0 14px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
              }}
            >
              TABLEAU DE BORD DES SIGNAUX
            </p>
            <p
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 8px",
                lineHeight: 1.0,
              }}
            >
              {conflictCount.toLocaleString("fr-FR")}
            </p>
            <p
              style={{
                fontSize: 22,
                color: LIGHT,
                margin: "0 0 28px",
                lineHeight: 1.3,
              }}
            >
              signaux détectés
            </p>

            {/* Type breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topTypes.map((t) => (
                <div
                  key={t.label}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: TEAL, flexShrink: 0 }} />
                  <p style={{ fontSize: 14, color: LIGHT, margin: 0, flex: 1 }}>
                    {t.label}
                  </p>
                  <p style={{ fontSize: 14, color: WHITE, margin: 0, fontWeight: 600 }}>
                    {t.count.toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: meta */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              width: 280,
              paddingTop: 4,
            }}
          >
            <div
              style={{
                backgroundColor: SURFACE,
                borderRadius: 10,
                padding: "22px",
                border: `1px solid ${BORDER}`,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                Dernière mise à jour
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: AMBER, margin: 0 }}>
                {lastUpdate}
              </p>
            </div>
            <div
              style={{
                backgroundColor: SURFACE,
                borderRadius: 10,
                padding: "22px",
                border: `1px solid ${BORDER}`,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                Sources
              </p>
              <p style={{ fontSize: 13, color: LIGHT, margin: 0, lineHeight: 1.5 }}>
                HATVP · AGORA · Assemblée nationale · Sénat
              </p>
            </div>
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
            <div style={{ width: 20, height: 2, backgroundColor: ROSE }} />
            <p style={{ fontSize: 12, color: ROSE, margin: 0 }}>Transparence des institutions</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
