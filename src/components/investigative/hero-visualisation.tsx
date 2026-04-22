import { FranceMap } from "@/components/france-map";
import type { DeptData, IndicatorKey } from "@/data/indicators";
import { SrcChip } from "./src-chip";
import { Eyebrow } from "./eyebrow";

export function HeroVisualisation({
  data,
  indicator,
  caption,
  legendLeft,
  legendRight,
  source,
  figLabel,
}: {
  data: Record<string, DeptData>;
  indicator: IndicatorKey;
  caption: string;
  legendLeft: string;
  legendRight: string;
  source: string;
  figLabel?: string;
}) {
  return (
    <aside
      style={{
        border: "1px solid var(--line)",
        padding: "16px 18px 18px",
        background: "var(--color-ink-1)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow>Visualisation liée</Eyebrow>
        {figLabel && <Eyebrow>{figLabel}</Eyebrow>}
      </div>
      <div
        className="obs-serif"
        style={{ fontSize: 16, lineHeight: 1.35, color: "var(--color-fg)" }}
      >
        {caption}
      </div>
      <div style={{ background: "var(--color-ink-0)", border: "1px solid var(--line)" }}>
        <FranceMap
          data={data}
          defaultIndicator={indicator}
          size="sm"
          showPills={false}
          showRanking={false}
          showDetail={false}
          linkBase="/territoire/"
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 9.5,
          color: "var(--color-fg-mute)",
          letterSpacing: "0.08em",
        }}
      >
        <span>{legendLeft}</span>
        <div
          style={{
            flex: 1,
            height: 6,
            background:
              "linear-gradient(90deg, oklch(0.70 0.08 215 / 0.75), oklch(0.40 0.07 215 / 0.5), var(--color-ink-2), oklch(0.55 0.12 27 / 0.65), oklch(0.70 0.17 27 / 0.9))",
          }}
        />
        <span>{legendRight}</span>
      </div>
      <hr className="hair" />
      <SrcChip items={[source]} />
    </aside>
  );
}
