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
const TEAL    = "#2dd4bf";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [personnalite, mandatCount, interetCount] = await Promise.all([
    prisma.personnalitePublique.findUnique({
      where: { slug },
      select: {
        prenom: true,
        nom: true,
        mandats: {
          where: { dateFin: null },
          take: 1,
          select: { titreCourt: true, gouvernement: true },
        },
      },
    }),
    prisma.mandatGouvernemental.count({ where: { personnalite: { slug } } }),
    prisma.interetDeclare.count({ where: { personnalite: { slug } } }),
  ]);

  if (!personnalite) return new Response("Not found", { status: 404 });

  const initials = `${personnalite.prenom[0] ?? ""}${personnalite.nom[0] ?? ""}`.toUpperCase();
  const currentMandat = personnalite.mandats[0];

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
            flexDirection: "row",
            padding: "40px 56px 32px",
            gap: "40px",
            alignItems: "center",
          }}
        >
          {/* Avatar monogram */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              backgroundColor: SURFACE,
              border: `2px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 32, color: TEAL, fontWeight: 700 }}>{initials}</span>
          </div>

          {/* Identity */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: DIM, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>
              MINISTRE · {currentMandat?.gouvernement?.replace("Gouvernement ", "") ?? "FRANCE"}
            </p>
            <p style={{ fontSize: 48, fontWeight: 700, color: WHITE, margin: "0 0 2px", lineHeight: 1.0 }}>
              {personnalite.prenom} {personnalite.nom}
            </p>
            {currentMandat?.titreCourt && (
              <p style={{ fontSize: 16, color: LIGHT, margin: "12px 0 0", lineHeight: 1.3 }}>
                {currentMandat.titreCourt}
              </p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 220 }}>
            {[
              { label: "Mandats", value: mandatCount.toLocaleString("fr-FR"), color: WHITE },
              { label: "Intérêts HATVP", value: interetCount.toLocaleString("fr-FR"), color: TEAL },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: SURFACE,
                  borderRadius: 8,
                  padding: "14px 18px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <p style={{ fontSize: 10, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 26, fontWeight: 700, color: stat.color, margin: 0 }}>
                  {stat.value}
                </p>
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
            <p style={{ fontSize: 11, color: TEAL, margin: 0 }}>Transparence des élus</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
