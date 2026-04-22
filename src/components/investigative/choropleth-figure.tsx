import { FranceMap } from "@/components/france-map";
import type { DeptData, IndicatorKey } from "@/data/indicators";
import { SrcChip } from "./src-chip";

export function ChoroplethFigure({
  data,
  indicator,
  title,
  source,
  href,
  figNumber,
}: {
  data: Record<string, DeptData>;
  indicator: IndicatorKey;
  title: string;
  source: string;
  href: string;
  figNumber?: string;
}) {
  return (
    <figure className="obs-card" style={{ margin: 0 }}>
      <figcaption
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.14em",
            color: "var(--color-fg-mute)",
          }}
        >
          {title}
        </span>
        {figNumber && (
          <span
            className="obs-mono"
            style={{ fontSize: "var(--fs-mono-xs)", color: "var(--color-fg-dim)" }}
          >
            {figNumber}
          </span>
        )}
      </figcaption>
      <div
        style={{
          background: "var(--color-ink-0)",
          border: "1px solid var(--line)",
          padding: "6px 0",
        }}
      >
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
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <SrcChip items={[source]} />
        <a href={href} className="lnk-arrow">
          <span>Carte</span>
          <span aria-hidden>→</span>
        </a>
      </div>
    </figure>
  );
}
