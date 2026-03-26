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

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [depute, voteCount, conflictCount] = await Promise.all([
    prisma.depute.findUnique({
      where: { id },
      select: {
        prenom: true,
        nom: true,
        groupe: true,
        groupeAbrev: true,
        departementNom: true,
        scoreParticipation: true,
      },
    }),
    prisma.voteRecord.count({ where: { deputeId: id } }),
    prisma.conflictSignal.count({ where: { deputeId: id } }),
  ]);

  if (!depute) return new Response("Not found", { status: 404 });

  const participation =
    depute.scoreParticipation != null
      ? `${Math.round(depute.scoreParticipation)} %`
      : "—";

  const stats = [
    { label: "Participation", value: participation, color: TEAL },
    { label: "Votes enregistrés", value: voteCount.toLocaleString("fr-FR"), color: WHITE },
    {
      label: "Conflits détectés",
      value: String(conflictCount),
      color: conflictCount > 0 ? ROSE : LIGHT,
    },
  ];

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
            gap: "48px",
          }}
        >
          {/* Left: identity */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            {/* Avatar */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: SURFACE,
                border: `2px solid ${BORDER}`,
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 36, color: TEAL, fontWeight: 700 }}>
                {depute.prenom[0]}
                {depute.nom[0]}
              </span>
            </div>

            {/* Name & affiliation */}
            <p
              style={{
                fontSize: 13,
                color: DIM,
                margin: "0 0 10px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
              }}
            >
              DÉPUTÉ · {depute.groupeAbrev}
            </p>
            <p
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 4px",
                lineHeight: 1.05,
              }}
            >
              {depute.prenom}
            </p>
            <p
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 18px",
                lineHeight: 1.05,
              }}
            >
              {depute.nom}
            </p>
            <p style={{ fontSize: 17, color: LIGHT, margin: "0 0 6px", lineHeight: 1.3 }}>
              {depute.groupe}
            </p>
            <p style={{ fontSize: 15, color: DIM, margin: 0 }}>{depute.departementNom}</p>
          </div>

          {/* Right: stats */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              width: 300,
              paddingTop: 4,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
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
                  {stat.label}
                </p>
                <p
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: stat.color,
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stat.value}
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
            L'OBSERVATOIRE CITOYEN
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
