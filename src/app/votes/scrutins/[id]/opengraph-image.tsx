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
const TEXT    = "#cbd5e1";
const WHITE   = "#e2e8f0";
const TEAL    = "#2dd4bf";
const ROSE    = "#f43f5e";
const AMBER   = "#f59e0b";

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const scrutin = await prisma.scrutin.findUnique({
    where: { id },
    select: {
      numero: true,
      titre: true,
      sortCode: true,
      pour: true,
      contre: true,
      abstentions: true,
      dateScrutin: true,
      libelleTypeVote: true,
    },
  });

  if (!scrutin) return new Response("Not found", { status: 404 });

  const adopted = scrutin.sortCode.toLowerCase().includes("adopt");
  const resultColor = adopted ? TEAL : ROSE;
  const resultLabel = adopted ? "ADOPTÉ" : "REJETÉ";

  const total = scrutin.pour + scrutin.contre;
  const pourPct = total > 0 ? Math.round((scrutin.pour / total) * 100) : 50;
  const contrePct = 100 - pourPct;

  // Bar widths in px (total bar = 800px)
  const barTotal = 800;
  const pourWidth  = Math.round((pourPct  / 100) * barTotal);
  const contreWidth = barTotal - pourWidth;

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
        <div style={{ height: 3, backgroundColor: resultColor, width: "100%", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "48px 56px 36px",
          }}
        >
          {/* Scrutin label + result badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "20px",
              marginBottom: 28,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: DIM,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
              }}
            >
              SCRUTIN N°{scrutin.numero} · {fmtDate(scrutin.dateScrutin)}
            </p>
            {/* Result badge */}
            <div
              style={{
                backgroundColor: adopted ? "#0d3b35" : "#3b0d14",
                border: `1px solid ${resultColor}`,
                borderRadius: 6,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: resultColor,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {resultLabel}
              </p>
            </div>
          </div>

          {/* Vote title */}
          <p
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: WHITE,
              margin: "0 0 8px",
              lineHeight: 1.25,
              maxWidth: 1000,
            }}
          >
            {truncate(scrutin.titre, 120)}
          </p>
          <p style={{ fontSize: 15, color: DIM, margin: "0 0 40px" }}>
            {scrutin.libelleTypeVote}
          </p>

          {/* Vote bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "row", height: 28, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: pourWidth, backgroundColor: TEAL, opacity: 0.85 }} />
              <div style={{ width: contreWidth, backgroundColor: ROSE, opacity: 0.75 }} />
            </div>

            {/* Vote counts */}
            <div style={{ display: "flex", flexDirection: "row", gap: "40px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: TEAL,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {scrutin.pour.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontSize: 14, color: DIM }}>Pour · {pourPct} %</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: ROSE,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {scrutin.contre.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontSize: 14, color: DIM }}>Contre · {contrePct} %</span>
              </div>
              {scrutin.abstentions > 0 && (
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: LIGHT,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {scrutin.abstentions.toLocaleString("fr-FR")}
                  </span>
                  <span style={{ fontSize: 14, color: DIM }}>Abstentions</span>
                </div>
              )}
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
            <div style={{ width: 20, height: 2, backgroundColor: resultColor }} />
            <p style={{ fontSize: 12, color: resultColor, margin: 0 }}>
              Votes de l'Assemblée nationale
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
