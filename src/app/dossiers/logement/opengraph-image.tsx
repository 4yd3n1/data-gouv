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
const AMBER   = "#f59e0b";

export default async function Image() {
  const [avgVacancy, avgSecondary, voteCount] = await Promise.all([
    prisma.statLocale.aggregate({
      where: { indicateur: "HOUSING_VACANCY_RATE", geoType: "DEP" },
      _avg: { valeur: true },
    }),
    prisma.statLocale.aggregate({
      where: { indicateur: "HOUSING_SECONDARY_RATE", geoType: "DEP" },
      _avg: { valeur: true },
    }),
    prisma.scrutinTag.count({ where: { tag: "logement" } }),
  ]);

  const vacancy   = avgVacancy._avg.valeur   != null ? `${avgVacancy._avg.valeur.toFixed(1)} %`   : "8,7 %";
  const secondary = avgSecondary._avg.valeur != null ? `${avgSecondary._avg.valeur.toFixed(1)} %` : "11,5 %";

  const stats = [
    { label: "Logements vacants (moy.)",       value: vacancy,                              color: AMBER },
    { label: "Résidences secondaires (moy.)",  value: secondary,                            color: TEAL  },
    { label: "Votes parlementaires classés",   value: voteCount.toLocaleString("fr-FR"),    color: WHITE },
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
              DOSSIER CITOYEN · L'OBSERVATOIRE
            </p>
            <p
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 16px",
                lineHeight: 1.0,
              }}
            >
              Logement
            </p>
            <p
              style={{
                fontSize: 22,
                color: LIGHT,
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 540,
              }}
            >
              Politique du logement, construction, HLM, loyers et conditions d'habitat — données par département.
            </p>
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
            {stats.map((s) => (
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
                    fontSize: 30,
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
