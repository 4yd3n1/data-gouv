import { ImageResponse } from "next/og";
import { getDraft, getDraftTitle, getDraftSubtitle } from "@/lib/factcheck-manifest";

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
  const rawSubtitle = getDraftSubtitle(draft);

  // Clamp title to ~70 chars for display
  const title =
    rawTitle.length > 70 ? rawTitle.slice(0, 67) + "…" : rawTitle;

  const subtitle =
    rawSubtitle && rawSubtitle.length > 90
      ? rawSubtitle.slice(0, 87) + "…"
      : rawSubtitle;

  // Category monogram (first 2 chars)
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
            padding: "44px 56px 36px",
            gap: "48px",
          }}
        >
          {/* Left: hero text */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <p
              style={{
                fontSize: 11,
                color: DIM,
                margin: "0 0 16px",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                fontWeight: 600,
              }}
            >
              FACT CHECK · {categoryLabel}
            </p>

            {/* Title */}
            <p
              style={{
                fontSize: 46,
                fontWeight: 700,
                color: WHITE,
                margin: "0 0 18px",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p
                style={{
                  fontSize: 17,
                  color: LIGHT,
                  margin: 0,
                  lineHeight: 1.4,
                  fontStyle: "italic",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Right: category icon + verdict */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              width: 280,
              paddingTop: 4,
              flexShrink: 0,
            }}
          >
            {/* Category monogram */}
            <div
              style={{
                width: 80,
                height: 80,
                backgroundColor: SURFACE,
                border: `2px solid ${accentColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: accentColor,
                  letterSpacing: "-0.02em",
                }}
              >
                {monogram}
              </span>
            </div>

            {/* Verdict card */}
            <div
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                padding: "18px 20px",
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
                  letterSpacing: "0.16em",
                  fontWeight: 600,
                }}
              >
                {draft.verdictLabel}
              </p>
              <p
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: accentColor,
                  margin: 0,
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {draft.verdictValue}
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
            <div style={{ width: 20, height: 2, backgroundColor: accentColor }} />
            <p style={{ fontSize: 12, color: TEXT, margin: 0 }}>
              {draft.tldr.length > 60 ? draft.tldr.slice(0, 57) + "…" : draft.tldr}
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
