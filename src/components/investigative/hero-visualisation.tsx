import { FranceMap } from "@/components/france-map";
import { INDICATOR_MAP, type DeptData, type IndicatorKey } from "@/data/indicators";
import { fmtCompact, fmtEuro, fmtPct } from "@/lib/format";
import { SrcChip } from "./src-chip";
import { Eyebrow } from "./eyebrow";

export function HeroVisualisation({
  data,
  indicator,
  caption,
  source,
  figLabel,
}: {
  data: Record<string, DeptData>;
  indicator: IndicatorKey;
  caption: string;
  source: string;
  figLabel?: string;
}) {
  const config = INDICATOR_MAP[indicator];
  const values = Object.values(data)
    .map((d) => d[indicator])
    .filter((v): v is number => typeof v === "number" && v > 0);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;

  const fmt = (value: number): string => {
    switch (config.format) {
      case "euro":
        return fmtEuro(value);
      case "pct":
        return fmtPct(value);
      case "compact":
        return fmtCompact(value);
      case "number":
        return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    }
  };

  // Horizontal gradient: left = min value, right = max value.
  // Orient so that "worse" is darker regardless of indicator direction.
  const gradient = config.higherIsBetter
    ? `linear-gradient(90deg, ${config.palette[0]}, ${config.palette[3]}, ${config.palette[6]})`
    : `linear-gradient(90deg, ${config.palette[6]}, ${config.palette[3]}, ${config.palette[0]})`;

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
      {values.length > 0 && (
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
          <span>{fmt(min)}</span>
          <div style={{ flex: 1, height: 6, background: gradient }} />
          <span>{fmt(max)}</span>
        </div>
      )}
      <hr className="hair" />
      <SrcChip items={[source]} />
    </aside>
  );
}
