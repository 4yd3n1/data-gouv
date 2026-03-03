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
const AMBER   = "#f59e0b";
const ROSE    = "#f43f5e";

function fmtNum(v: number | null | undefined, decimals = 0): string {
  if (v == null) return "—";
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default async function Image({
  params,
}: {
  params: Promise<{ departementCode: string }>;
}) {
  const { departementCode } = await params;

  const [dept, stats, deputeCount, senateurCount, eluCount] = await Promise.all([
    prisma.departement.findUnique({
      where: { code: departementCode },
      select: { code: true, libelle: true, region: { select: { libelle: true } } },
    }),
    prisma.statLocale.findMany({
      where: {
        geoType: "DEP",
        geoCode: departementCode,
        indicateur: { in: ["MEDIAN_INCOME", "POVERTY_RATE", "UNEMPLOYMENT_RATE"] },
      },
      orderBy: { annee: "desc" },
    }),
    prisma.depute.count({ where: { departementRefCode: departementCode } }),
    prisma.senateur.count({ where: { departementCode } }),
    prisma.elu.count({ where: { codeDepartement: departementCode } }),
  ]);

  if (!dept) return new Response("Not found", { status: 404 });

  // Pick latest value for each indicator
  const statMap: Record<string, number> = {};
  for (const s of stats) {
    if (!(s.indicateur in statMap)) statMap[s.indicateur] = s.valeur;
  }

  const medianIncome = statMap["MEDIAN_INCOME"];
  const povertyRate  = statMap["POVERTY_RATE"];
  const unemployRate = statMap["UNEMPLOYMENT_RATE"];

  const indicators = [
    {
      label: "Revenu médian",
      value: medianIncome != null ? `${fmtNum(medianIncome)} €` : "—",
      color: TEAL,
    },
    {
      label: "Taux de pauvreté",
      value: povertyRate != null ? `${fmtNum(povertyRate, 1)} %` : "—",
      color: povertyRate != null && povertyRate > 20 ? ROSE : LIGHT,
    },
    {
      label: "Chômage",
      value: unemployRate != null ? `${fmtNum(unemployRate, 1)} %` : "—",
      color: unemployRate != null && unemployRate > 12 ? AMBER : LIGHT,
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
            flexDirection: "column",
            padding: "48px 56px 36px",
          }}
        >
          {/* Department header */}
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 40 }}>
            <p
              style={{
                fontSize: 13,
                color: DIM,
                margin: "0 0 12px",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 600,
              }}
            >
              DÉPARTEMENT · {dept.code}
            </p>
            <p
              style={{
                fontSize: 62,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 10px",
                lineHeight: 1.0,
              }}
            >
              {dept.libelle}
            </p>
            <p style={{ fontSize: 18, color: LIGHT, margin: 0 }}>{dept.region?.libelle}</p>
          </div>

          {/* Stats grid */}
          <div style={{ display: "flex", flexDirection: "row", gap: "16px", marginBottom: 32 }}>
            {indicators.map((ind) => (
              <div
                key={ind.label}
                style={{
                  flex: 1,
                  backgroundColor: SURFACE,
                  borderRadius: 10,
                  padding: "20px 24px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
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
                  {ind.label}
                </p>
                <p
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    color: ind.color,
                    margin: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ind.value}
                </p>
              </div>
            ))}
          </div>

          {/* Representation footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "32px",
            }}
          >
            {[
              { label: "Députés", value: deputeCount },
              { label: "Sénateurs", value: senateurCount },
              { label: "Élus locaux", value: eluCount.toLocaleString("fr-FR") },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: TEXT,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {typeof r.value === "number" ? r.value.toLocaleString("fr-FR") : r.value}
                </span>
                <span style={{ fontSize: 14, color: DIM }}>{r.label}</span>
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
            <p style={{ fontSize: 12, color: TEAL, margin: 0 }}>Données INSEE · Transparence territoriale</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
