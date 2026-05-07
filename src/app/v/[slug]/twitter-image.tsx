import { ImageResponse } from "next/og";
import { getDraft, getDraftTitle } from "@/lib/factcheck-manifest";

export const runtime = "nodejs";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

const BG      = "#080c14";
const SURFACE = "#111827";
const BORDER  = "#1a2236";
const DIM     = "#64748b";
const LIGHT   = "#94a3b8";
const TEXT    = "#cbd5e1";
const WHITE   = "#e2e8f0";

const CATEGORY_COLOR: Record<string, string> = {
  ECONOMIE: "#d4a017",
  SOCIAL:   "#ff3b30",
  SANTE:    "#2dd4bf",
  DEMOCRATIE: "#3b5278",
  CLIMAT:   "#22c55e",
};

const CATEGORY_LABEL: Record<string, string> = {
  ECONOMIE: "ÉCONOMIE",
  SOCIAL:   "SOCIAL",
  SANTE:    "SANTÉ",
  DEMOCRATIE: "DÉMOCRATIE",
  CLIMAT:   "CLIMAT",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const draft = await getDraft(slug);
  if (!draft) return new Response("Not found", { status: 404 });

  const accentColor = CATEGORY_COLOR[draft.branding.category] ?? "#2dd4bf";
  const categoryLabel = CATEGORY_LABEL[draft.branding.category] ?? draft.branding.category;

  const rawTitle = getDraftTitle(draft);
  const title =
    rawTitle.length > 65 ? rawTitle.slice(0, 62) + "…" : rawTitle;

  const monogram = categoryLabel.slice(0, 2);

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
        <div style={{ height: 4, backgroundColor: accentColor, width: "100%", flexShrink: 0 }} />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            padding: "40px 56px 32px",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                color: DIM,
                margin: "0 0 14px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
              FACT CHECK · {categoryLabel}
            </p>
            <p
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 16px",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: DIM,
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                {draft.verdictLabel}
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: accentColor,
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {draft.verdictValue}
              </p>
            </div>
          </div>

          {/* Right: monogram */}
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: SURFACE,
              border: `2px solid ${accentColor}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: accentColor,
                letterSpacing: "-0.02em",
              }}
            >
              {monogram}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
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
          <p
            style={{
              fontSize: 11,
              color: DIM,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              fontWeight: 600,
            }}
          >
            L'OBSERVATOIRE CITOYEN
          </p>
          <p style={{ fontSize: 11, color: TEXT, margin: 0, letterSpacing: "0.08em" }}>
            observatoire.fr
          </p>
        </div>
      </div>
    ),
    { ...size }
  );
}
