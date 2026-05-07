import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { resolvePostalCode } from "@/lib/postal-resolver";

export const runtime = "nodejs";
export const revalidate = 3600;
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

function GenericCard({ label }: { label: string }) {
  return (
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
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: "44px 56px",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: DIM,
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 600,
          }}
        >
          VOTRE DÉPUTÉ
        </p>
        <p style={{ fontSize: 52, fontWeight: 700, color: WHITE, margin: 0, textAlign: "center", lineHeight: 1.1 }}>
          {label}
        </p>
        <p style={{ fontSize: 17, color: LIGHT, margin: 0 }}>L&apos;Observatoire Citoyen</p>
      </div>
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
        <p style={{ fontSize: 12, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 600 }}>
          L&apos;OBSERVATOIRE CITOYEN
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 2, backgroundColor: TEAL }} />
          <p style={{ fontSize: 12, color: TEAL, margin: 0 }}>Transparence des élus</p>
        </div>
      </div>
    </div>
  );
}

export default async function Image({
  searchParams,
}: {
  searchParams?: Promise<{ cp?: string; commune?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const { cp, commune } = params;

  // No params — generic prompt card
  if (!cp && !commune) {
    return new ImageResponse(<GenericCard label="Quel est votre député ?" />, { ...size });
  }

  // Resolve to a single deputy
  let depute: {
    prenom: string;
    nom: string;
    groupeAbrev: string;
    groupe: string;
    departementNom: string;
    circonscription: number;
    scoreParticipation: number | null;
  } | null = null;
  let conflictCount = 0;

  try {
    let deptCode: string | null = null;

    if (commune) {
      const communeRow = await prisma.commune.findUnique({
        where: { code: commune },
        select: { departementCode: true },
      });
      deptCode = communeRow?.departementCode ?? null;
    } else if (cp) {
      const territories = await resolvePostalCode(cp);
      if (territories.length === 1) {
        deptCode = territories[0].departementCode;
      } else if (territories.length === 0) {
        return new ImageResponse(<GenericCard label="Code postal inconnu" />, { ...size });
      } else {
        // Ambiguous — generic card
        return new ImageResponse(<GenericCard label={`Code postal ${cp}`} />, { ...size });
      }
    }

    if (deptCode) {
      const deputes = await prisma.depute.findMany({
        where: { departementRefCode: deptCode, actif: true },
        select: {
          id: true,
          prenom: true,
          nom: true,
          groupeAbrev: true,
          groupe: true,
          departementNom: true,
          circonscription: true,
          scoreParticipation: true,
        },
        take: 1,
      });

      if (deputes.length > 0) {
        depute = deputes[0];
        conflictCount = await prisma.conflictSignal.count({ where: { deputeId: deputes[0].id } });
      }
    }
  } catch {
    // Fall through to generic
  }

  if (!depute) {
    return new ImageResponse(<GenericCard label="Aucun député trouvé" />, { ...size });
  }

  const participation =
    depute.scoreParticipation != null
      ? `${Math.round(depute.scoreParticipation)} %`
      : "—";

  const postalLabel = cp ?? commune ?? "";

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
            padding: "40px 56px 32px",
            gap: "52px",
          }}
        >
          {/* Left: identity */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            {/* Monogram avatar */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                backgroundColor: conflictCount > 0 ? `${ROSE}22` : SURFACE,
                border: `2px solid ${conflictCount > 0 ? ROSE : BORDER}`,
                marginBottom: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  color: conflictCount > 0 ? ROSE : TEAL,
                  fontWeight: 700,
                }}
              >
                {depute.prenom[0]}{depute.nom[0]}
              </span>
            </div>

            {/* Eyebrow */}
            <p
              style={{
                fontSize: 12,
                color: DIM,
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 600,
              }}
            >
              VOTRE DÉPUTÉ · {postalLabel}
            </p>

            {/* Name */}
            <p style={{ fontSize: 48, fontWeight: 700, color: WHITE, margin: "0 0 2px", lineHeight: 1.05 }}>
              {depute.prenom}
            </p>
            <p style={{ fontSize: 48, fontWeight: 700, color: WHITE, margin: "0 0 16px", lineHeight: 1.05 }}>
              {depute.nom}
            </p>

            {/* Party + dept */}
            <p style={{ fontSize: 16, color: TEAL, margin: "0 0 4px", fontWeight: 600, letterSpacing: "0.06em" }}>
              {depute.groupeAbrev}
            </p>
            <p style={{ fontSize: 14, color: LIGHT, margin: "0 0 4px" }}>
              {depute.departementNom}
            </p>
            <p style={{ fontSize: 13, color: DIM, margin: 0 }}>
              {depute.circonscription}e circonscription
            </p>
          </div>

          {/* Right: stat cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              width: 260,
              paddingTop: 4,
            }}
          >
            {[
              { label: "Participation", value: participation, color: TEAL },
              {
                label: "Conflits détectés",
                value: String(conflictCount),
                color: conflictCount > 0 ? ROSE : LIGHT,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: SURFACE,
                  borderRadius: 8,
                  padding: "16px 20px",
                  border: `1px solid ${BORDER}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <p style={{ fontSize: 10, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 700, color: stat.color, margin: 0, fontVariantNumeric: "tabular-nums" }}>
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
          <p style={{ fontSize: 12, color: DIM, margin: 0, textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 600 }}>
            L&apos;OBSERVATOIRE CITOYEN
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 2, backgroundColor: TEAL }} />
            <p style={{ fontSize: 12, color: TEAL, margin: 0 }}>Transparence des élus</p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
