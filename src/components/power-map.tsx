"use client";

import { useState, useRef, useEffect } from "react";

const TYPE_COLORS: Record<string, string> = {
  TELEVISION: "#60a5fa",
  RADIO: "#fbbf24",
  PRESSE_QUOTIDIENNE: "#2dd4bf",
  PRESSE_MAGAZINE: "#0d9488",
  NUMERIQUE: "#fb7185",
  AGENCE: "#94a3b8",
};

interface PowerMapGroup {
  slug: string;
  nomCourt: string;
  filialeCount: number;
  dominantType: string;
  fortuneEstimee: number | null;
  hasGovLink: boolean;
  ownerInitials: string;
  ownerName: string;
  signalementCount: number;
}

interface PowerMapProps {
  groups: PowerMapGroup[];
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(w);
    });
    observer.observe(ref.current);
    setWidth(ref.current.clientWidth || 800);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export function PowerMap({ groups }: PowerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  // Responsive dimensions
  const isMobile = containerWidth < 500;
  const isTablet = containerWidth < 768;

  const svgW = 800;
  const svgH = isMobile ? 600 : 500;
  const cx = svgW / 2;
  const cy = svgH / 2;

  const radiusX = isMobile ? 200 : isTablet ? 240 : 280;
  const radiusY = isMobile ? 220 : isTablet ? 180 : 180;

  const maxCount = Math.max(...groups.map((g) => g.filialeCount), 1);
  const totalCount = groups.reduce((s, g) => s + g.filialeCount, 0);

  const nodeScale = isMobile ? 0.8 : 1;

  const positioned = groups.map((g, i) => {
    const angle = (i / groups.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radiusX;
    const y = cy + Math.sin(angle) * radiusY;
    const nodeRadius = (16 + (g.filialeCount / maxCount) * 20) * nodeScale;
    return { ...g, x, y, nodeRadius };
  });

  return (
    <div ref={containerRef} className="w-full">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-auto"
        role="img"
        aria-label="Carte de propriété des médias français"
      >
        <defs>
          <pattern id="pm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(45,212,191,0.03)"
              strokeWidth="0.5"
            />
          </pattern>
          <radialGradient id="pm-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(45,212,191,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Glow filter for hovered nodes */}
          <filter id="pm-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={svgW} height={svgH} fill="url(#pm-grid)" />

        {/* Center glow */}
        <circle cx={cx} cy={cy} r={isMobile ? 80 : 120} fill="url(#pm-glow)" />

        {/* Connection lines */}
        {positioned.map((g) => {
          const thickness = 0.6 + (g.filialeCount / maxCount) * 3;
          const color = TYPE_COLORS[g.dominantType] ?? "#64748b";
          const isHovered = hoveredSlug === g.slug;
          const isDimmed = hoveredSlug !== null && !isHovered;
          return (
            <line
              key={`line-${g.slug}`}
              x1={cx}
              y1={cy}
              x2={g.x}
              y2={g.y}
              stroke={color}
              strokeWidth={isHovered ? thickness + 1 : thickness}
              opacity={isHovered ? 0.65 : isDimmed ? 0.08 : 0.28}
              strokeDasharray={g.hasGovLink ? "none" : "5 3"}
              style={{ transition: "opacity 0.3s ease, stroke-width 0.3s ease" }}
            />
          );
        })}

        {/* Center node */}
        <circle
          cx={cx}
          cy={cy}
          r={isMobile ? 40 : 52}
          fill="rgba(10,15,26,0.92)"
          stroke="rgba(200,215,240,0.14)"
          strokeWidth={1}
        />
        <circle
          cx={cx}
          cy={cy}
          r={isMobile ? 40 : 52}
          fill="none"
          stroke="oklch(0.70 0.17 27 / 0.25)"
          strokeWidth={0.5}
          strokeDasharray="2 3"
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#e8eaf0"
          fontFamily='"Source Serif 4","Source Serif Pro",Georgia,serif'
          fontSize={isMobile ? 22 : 28}
          fontWeight={400}
          letterSpacing="-0.01em"
        >
          {totalCount}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill="#8a93a8"
          fontFamily='"JetBrains Mono","IBM Plex Mono",ui-monospace,monospace'
          fontSize={isMobile ? 7.5 : 8.5}
          letterSpacing="0.18em"
        >
          MÉDIAS RECENSÉS
        </text>

        {/* Owner nodes */}
        {positioned.map((g) => {
          const color = TYPE_COLORS[g.dominantType] ?? "#64748b";
          const isHovered = hoveredSlug === g.slug;
          const isDimmed = hoveredSlug !== null && !isHovered;
          return (
            <g
              key={g.slug}
              onMouseEnter={() => setHoveredSlug(g.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              style={{
                cursor: "pointer",
                opacity: isDimmed ? 0.3 : 1,
                transition: "opacity 0.3s ease",
              }}
              filter={isHovered ? "url(#pm-node-glow)" : undefined}
            >
              {/* Outer glow ring */}
              <circle
                cx={g.x}
                cy={g.y}
                r={g.nodeRadius + 4}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 1 : 0.5}
                opacity={isHovered ? 0.5 : 0.2}
                style={{ transition: "stroke-width 0.3s ease, opacity 0.3s ease" }}
              />
              {/* Hit area (invisible, larger) */}
              <circle
                cx={g.x}
                cy={g.y}
                r={g.nodeRadius + 12}
                fill="transparent"
              />
              {/* Main node */}
              <circle
                cx={g.x}
                cy={g.y}
                r={g.nodeRadius}
                fill="rgba(12,16,24,0.85)"
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                opacity={0.9}
                style={{ transition: "stroke-width 0.3s ease" }}
              />
              {/* Gov link indicator (amber dot) */}
              {g.hasGovLink && (
                <circle
                  cx={g.x + g.nodeRadius - 4}
                  cy={g.y - g.nodeRadius + 4}
                  r={4}
                  fill="#f59e0b"
                  stroke="rgba(8,12,20,0.8)"
                  strokeWidth={1}
                />
              )}
              {/* ARCOM warning indicator (rose dot) */}
              {g.signalementCount > 3 && (
                <circle
                  cx={g.x + g.nodeRadius - 4}
                  cy={g.y + g.nodeRadius - 4}
                  r={4}
                  fill="#f43f5e"
                  stroke="rgba(8,12,20,0.8)"
                  strokeWidth={1}
                />
              )}
              {/* Initials */}
              <text
                x={g.x}
                y={g.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={isMobile ? 9 : 11}
                fontWeight={600}
              >
                {g.ownerInitials}
              </text>
              {/* Name label */}
              <text
                x={g.x}
                y={g.y + g.nodeRadius + 14}
                textAnchor="middle"
                fill={isHovered ? "#e2e8f0" : "#94a3b8"}
                fontSize={isMobile ? 8 : 9}
                style={{ transition: "fill 0.3s ease" }}
              >
                {g.nomCourt}
              </text>
              {/* Count label */}
              <text
                x={g.x}
                y={g.y + g.nodeRadius + 25}
                textAnchor="middle"
                fill="#64748b"
                fontSize={isMobile ? 7 : 8}
              >
                {g.filialeCount} medias
              </text>
              {/* Hover tooltip: fortune + signalements */}
              {isHovered && (g.fortuneEstimee != null || g.signalementCount > 0) && (
                <>
                  {g.fortuneEstimee != null && (
                    <text
                      x={g.x}
                      y={g.y - g.nodeRadius - (g.signalementCount > 0 ? 20 : 10)}
                      textAnchor="middle"
                      fill="#f59e0b"
                      fontSize={9}
                      fontWeight={600}
                    >
                      {g.fortuneEstimee} Md EUR
                    </text>
                  )}
                  {g.signalementCount > 0 && (
                    <text
                      x={g.x}
                      y={g.y - g.nodeRadius - 8}
                      textAnchor="middle"
                      fill="#f43f5e"
                      fontSize={8}
                      fontWeight={600}
                    >
                      {g.signalementCount} signalement{g.signalementCount > 1 ? "s" : ""} ARCOM
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
