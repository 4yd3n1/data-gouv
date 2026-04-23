"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DEPT_PATHS, SVG_VIEWBOX, OVERSEAS_INSETS } from "@/data/france-geo";
import { INDICATORS, INDICATOR_MAP, type DeptData, type IndicatorKey } from "@/data/indicators";
import { fmtEuro, fmtPct, fmtCompact } from "@/lib/format";

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpHex(colorA: string, colorB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function interpolateColor(t: number, palette: string[]): string {
  const idx = Math.max(0, Math.min(1, t)) * (palette.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, palette.length - 1);
  return lerpHex(palette[lo], palette[hi], idx - lo);
}

function getMinMax(data: Record<string, DeptData>, key: IndicatorKey): [number, number] {
  const vals = Object.values(data).map((d) => d[key]).filter((v) => v > 0);
  if (vals.length === 0) return [0, 1];
  return [Math.min(...vals), Math.max(...vals)];
}

function getT(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

// ─── Format helper ────────────────────────────────────────────────────────────

function formatValue(value: number, key: IndicatorKey): string {
  const config = INDICATOR_MAP[key];
  switch (config.format) {
    case "euro":    return fmtEuro(value);
    case "pct":     return fmtPct(value);
    case "compact": return fmtCompact(value);
    case "number":  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FranceMapProps {
  data: Record<string, DeptData>;
  defaultIndicator?: IndicatorKey;
  selectedCode?: string;
  onSelect?: (code: string) => void;
  linkBase?: string;
  size?: "sm" | "md" | "lg";
  showRanking?: boolean;
  showDetail?: boolean;
  showPills?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FranceMap({
  data,
  defaultIndicator = "rev",
  selectedCode: externalSelected,
  onSelect,
  linkBase,
  size = "lg",
  showRanking,
  showDetail,
  showPills = true,
}: FranceMapProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeIndicator, setActiveIndicator] = useState<IndicatorKey>(defaultIndicator);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const selectedCode = externalSelected ?? internalSelected;
  const isLg = size === "lg";
  const doShowRanking = showRanking ?? isLg;
  const doShowDetail = showDetail ?? isLg;

  const activeConfig = INDICATOR_MAP[activeIndicator];

  const [min, max] = useMemo(() => getMinMax(data, activeIndicator), [data, activeIndicator]);

  // Higher-is-worse indicators (pov, cho, det) invert the color ramp so darker = worse.
  const computeFill = useCallback(
    (value: number | null | undefined) => {
      if (value == null || value <= 0) return "#1a2236";
      const rawT = getT(value, min, max);
      const t = activeConfig.higherIsBetter ? rawT : 1 - rawT;
      return interpolateColor(t, activeConfig.palette);
    },
    [min, max, activeConfig.higherIsBetter, activeConfig.palette],
  );

  // Sorted list for ranking sidebar
  const ranked = useMemo(() => {
    const entries = Object.entries(data).filter(([, d]) => d[activeIndicator] > 0);
    entries.sort(([, a], [, b]) =>
      activeConfig.higherIsBetter
        ? b[activeIndicator] - a[activeIndicator]
        : a[activeIndicator] - b[activeIndicator]
    );
    return entries; // index 0 = best
  }, [data, activeIndicator, activeConfig.higherIsBetter]);

  const top5 = ranked.slice(0, 5);
  const bottom5 = ranked.slice(-5).reverse();

  const handlePathClick = useCallback(
    (code: string) => {
      if (onSelect) {
        onSelect(code);
      } else if (linkBase) {
        router.push(`${linkBase}${code}`);
      } else {
        setInternalSelected((prev) => (prev === code ? null : code));
      }
    },
    [onSelect, linkBase, router]
  );

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleSvgMouseLeave = useCallback(() => {
    setHoveredCode(null);
    setTooltipPos(null);
  }, []);

  // Tooltip data
  const tooltipDept = hoveredCode ? data[hoveredCode] : null;
  const tooltipRank = hoveredCode
    ? ranked.findIndex(([code]) => code === hoveredCode) + 1
    : null;

  // Detail panel data
  const detailDept = selectedCode ? data[selectedCode] : null;

  const sizeClass =
    size === "sm" ? "max-w-xs" : size === "md" ? "max-w-md" : "w-full";

  return (
    <div className={`${sizeClass} font-sans`}>
      {/* ── Indicator pills ─────────────────────────────────────────────── */}
      {showPills && <div className="flex flex-wrap gap-2 mb-4">
        {INDICATORS.map((ind) => {
          const isActive = ind.key === activeIndicator;
          return (
            <button
              key={ind.key}
              onClick={() => setActiveIndicator(ind.key)}
              className={[
                "px-3 py-1.5 rounded text-xs font-medium transition-all",
                "border",
                isActive
                  ? "text-white"
                  : "border-bureau-700 text-bureau-300 hover:border-bureau-500 hover:text-bureau-100",
              ].join(" ")}
              style={isActive ? { borderColor: ind.accent, color: ind.accent, backgroundColor: `${ind.accent}18` } : undefined}
            >
              {ind.label}
            </button>
          );
        })}
      </div>}

      {/* ── Map + Ranking ─────────────────────────────────────────────────── */}
      <div className="flex gap-4">
        {/* SVG map */}
        <div className="relative flex-1 min-w-0">
          <svg
            ref={svgRef}
            viewBox={SVG_VIEWBOX}
            className="w-full"
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={handleSvgMouseLeave}
          >
            {/* Metropolitan paths */}
            {Object.entries(DEPT_PATHS).map(([code, geo]) => {
              if (["971", "972", "973", "974", "976"].includes(code)) return null;
              const value = data[code]?.[activeIndicator] ?? null;
              const fill = computeFill(value);
              const isHovered = hoveredCode === code;
              const isSelected = selectedCode === code;
              return (
                <path
                  key={code}
                  d={geo.d}
                  fill={fill}
                  stroke={isSelected ? "#ffffff" : isHovered ? "#cbd5e1" : "#243049"}
                  strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.5}
                  className="cursor-pointer transition-colors duration-150"
                  role="button"
                  aria-label={`${geo.label} — ${value != null ? formatValue(value, activeIndicator) : "données indisponibles"}`}
                  onMouseEnter={() => setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onClick={() => handlePathClick(code)}
                />
              );
            })}

            {/* Overseas insets */}
            {Object.entries(OVERSEAS_INSETS).map(([code, inset]) => {
              const value = data[code]?.[activeIndicator] ?? null;
              const fill = computeFill(value);
              const isHovered = hoveredCode === code;
              const isSelected = selectedCode === code;
              return (
                <g key={code}>
                  <rect
                    x={inset.x}
                    y={inset.y}
                    width={70}
                    height={22}
                    fill={fill}
                    stroke={isSelected ? "#ffffff" : isHovered ? "#cbd5e1" : "#243049"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    rx={2}
                    className="cursor-pointer transition-colors duration-150"
                    onMouseEnter={() => setHoveredCode(code)}
                    onMouseLeave={() => setHoveredCode(null)}
                    onClick={() => handlePathClick(code)}
                  />
                  <text
                    x={inset.x + 35}
                    y={inset.y + 14}
                    textAnchor="middle"
                    fontSize={7}
                    fill="#94a3b8"
                    className="pointer-events-none select-none"
                  >
                    {inset.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltipPos && tooltipDept && hoveredCode && (
            <div
              className="absolute pointer-events-none z-10 bg-bureau-900/95 border border-bureau-600 rounded px-2.5 py-1.5 text-xs backdrop-blur-sm"
              style={{
                left: Math.min(tooltipPos.x + 12, (svgRef.current?.clientWidth ?? 500) - 150),
                top: Math.max(tooltipPos.y - 48, 4),
              }}
            >
              <div className="font-medium text-bureau-100">
                {tooltipDept.n}
                <span className="ml-1.5 text-bureau-400 font-mono text-[10px]">{hoveredCode}</span>
              </div>
              <div className="text-bureau-300 mt-0.5">
                {data[hoveredCode]![activeIndicator] > 0
                  ? formatValue(data[hoveredCode]![activeIndicator], activeIndicator)
                  : "—"}{" "}
                <span className="text-bureau-500">{activeConfig.unit}</span>
              </div>
              {tooltipRank != null && tooltipRank > 0 && (
                <div className="text-bureau-500 text-[10px] mt-0.5">
                  Rang {tooltipRank} / {ranked.length}
                </div>
              )}
            </div>
          )}

          {/* Legend — top of bar matches max-value color (inverted ramp for !higherIsBetter so dark = worse) */}
          <div className="absolute top-2 right-2 flex items-stretch gap-1">
            <div className="relative h-24 w-3">
              <div
                className="w-3 h-24 rounded"
                style={{
                  background: activeConfig.higherIsBetter
                    ? `linear-gradient(to bottom, ${activeConfig.palette[6]}, ${activeConfig.palette[3]}, ${activeConfig.palette[0]})`
                    : `linear-gradient(to bottom, ${activeConfig.palette[0]}, ${activeConfig.palette[3]}, ${activeConfig.palette[6]})`,
                }}
              />
            </div>
            <div className="relative h-24 flex flex-col justify-between">
              <span className="text-[9px] text-bureau-400 leading-none">
                {max > 0 ? formatValue(max, activeIndicator) : "max"}
              </span>
              <span className="text-[9px] text-bureau-400 leading-none">
                {min > 0 ? formatValue(min, activeIndicator) : "min"}
              </span>
            </div>
          </div>
        </div>

        {/* Ranking sidebar */}
        {doShowRanking && (
          <div className="w-44 shrink-0 flex flex-col gap-3 text-xs">
            <div>
              <div className="text-bureau-400 uppercase tracking-wider text-[10px] mb-1.5">
                ▲ Top 5
              </div>
              {top5.map(([code, dept], i) => (
                <button
                  key={code}
                  className={[
                    "w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-colors",
                    hoveredCode === code ? "bg-bureau-700/60" : "hover:bg-bureau-800/60",
                  ].join(" ")}
                  onMouseEnter={() => setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onClick={() => handlePathClick(code)}
                >
                  <span className="text-bureau-500 w-4 shrink-0">{i + 1}.</span>
                  <span className="text-bureau-300 truncate flex-1">{dept.n}</span>
                  <span className="text-bureau-400 shrink-0 font-mono text-[10px]">
                    {formatValue(dept[activeIndicator], activeIndicator)}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <div className="text-bureau-400 uppercase tracking-wider text-[10px] mb-1.5">
                ▼ Bas du classement
              </div>
              {bottom5.map(([code, dept], i) => (
                <button
                  key={code}
                  className={[
                    "w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-colors",
                    hoveredCode === code ? "bg-bureau-700/60" : "hover:bg-bureau-800/60",
                  ].join(" ")}
                  onMouseEnter={() => setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onClick={() => handlePathClick(code)}
                >
                  <span className="text-bureau-500 w-4 shrink-0">{ranked.length - i}.</span>
                  <span className="text-bureau-300 truncate flex-1">{dept.n}</span>
                  <span className="text-bureau-400 shrink-0 font-mono text-[10px]">
                    {formatValue(dept[activeIndicator], activeIndicator)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bento detail panel ────────────────────────────────────────────── */}
      {doShowDetail && (
        <div
          className={[
            "mt-4 rounded-lg border p-4",
            detailDept ? "border-bureau-700/50 bg-bureau-900/40" : "border-bureau-700/30 border-dashed",
          ].join(" ")}
        >
          {detailDept && selectedCode ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-bureau-100">{detailDept.n}</span>
                  <span className="ml-2 text-bureau-400 font-mono text-xs">{selectedCode}</span>
                </div>
                <button
                  className="text-bureau-500 hover:text-bureau-300 text-xs transition-colors"
                  onClick={() => setInternalSelected(null)}
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {INDICATORS.map((ind) => {
                  const value = detailDept[ind.key];
                  const indAvg = (() => {
                    const vals = Object.values(data).map((d) => d[ind.key]).filter((v) => v > 0);
                    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                  })();
                  const delta = indAvg > 0 ? ((value - indAvg) / indAvg) * 100 : 0;
                  const isBetter = ind.higherIsBetter ? delta > 0 : delta < 0;
                  const isActive = ind.key === activeIndicator;
                  return (
                    <div
                      key={ind.key}
                      className={[
                        "rounded p-2 border transition-colors",
                        isActive ? "border-opacity-60" : "border-bureau-700/30 bg-bureau-800/30",
                      ].join(" ")}
                      style={isActive ? { borderColor: `${ind.accent}60`, backgroundColor: `${ind.accent}10` } : undefined}
                    >
                      <div className="text-bureau-500 text-[10px] uppercase tracking-wider truncate">
                        {ind.label}
                      </div>
                      <div className="text-bureau-100 text-sm font-medium mt-0.5">
                        {value > 0 ? formatValue(value, ind.key) : "—"}
                      </div>
                      {value > 0 && indAvg > 0 && (
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: isBetter ? "#2dd4bf" : "#f43f5e" }}
                        >
                          {isBetter ? "↑" : "↓"}{" "}
                          {Math.abs(delta).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                          <span className="text-bureau-600 ml-0.5">moy.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-right">
                <button
                  className="text-xs text-bureau-400 hover:text-teal transition-colors"
                  onClick={() => router.push(`/territoire/${selectedCode}`)}
                >
                  Voir le tableau de bord →
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-bureau-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 mb-2">
                <path d="M12 21c0 0-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z" />
                <circle cx={12} cy={10} r={2.5} />
              </svg>
              <span className="text-sm">Cliquer sur un département pour explorer ses données</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
