# Phase 8 — Interactive France Map + UX & Data Enrichment

> For: L'Observatoire Citoyen data-gouv platform
> Created: March 3, 2026
> Updated: March 3, 2026 — post-prototype validation
> Depends on: Phase 7 complete (30 models, 57 routes)
> Estimated effort: 4–5 sessions
> Prototype spec: `france-explorer-combined.jsx` (validated design decisions)

---

## Vision

Transform the platform's territorial experience from **text lists** to **visual exploration**. A clickable SVG map of France — colored by any indicator — becomes the platform's signature interaction. Users click a département, see instant data, and drill into the full dashboard.

This is the feature that makes the platform feel like a real product, not a data browser.

---

## Overview

| Sub-phase | Feature | Effort | Key Deliverable |
|-----------|---------|--------|-----------------|
| **8A** | Interactive France SVG map component | 1 session | `<FranceMap>` reusable client component |
| **8B** | Map integration across the platform | 1 session | 6+ page integrations |
| **8C** | Mélodi data enrichment (housing + education) | 1 session | 2 new ingestion scripts, ~2K+ new StatLocale rows |
| **8D** | UX polish pass — mobile, transitions, empty states | 1 session | Platform-wide refinement |

---

## Critical Implementation Notes (added post-prototype)

These findings from the prototype session override earlier assumptions in this plan:

1. **SVG source is solved**: `@svg-maps/france.departments` npm package is already installed. It contains pre-computed SVG paths for all 96 metropolitan départements. ViewBox: `0 0 613 585`. Import directly — no GeoJSON fetching, no projection math, no build scripts.

2. **External fetch is blocked**: The artifact sandbox blocks all external HTTP requests (including `raw.githubusercontent.com`). Any approach requiring runtime GeoJSON fetching will produce a blank map. All geo data must be bundled.

3. **Prototype is the spec**: `france-explorer-combined.jsx` contains the validated implementation of all 8A interactions: 6 indicator pills, 7-color palette interpolation, top/bottom 5 rankings, bento detail panel with trend arrows, cross-linked hover states. Port it to TSX.

4. **Data shape validated**: `DEPT_DATA` keyed by code (`"01"` through `"95"`) with `{n, r, pop, rev, pov, cho, med, det}` per département works for all 6 indicators.

---

## Sub-phase 8A: Interactive France SVG Map Component

**Goal**: A single, reusable `<FranceMap>` client component that renders all 96 metropolitan départements (+ 5 overseas insets) as clickable SVG paths with choropleth coloring, hover tooltips, indicator switching, ranking sidebars, and bento detail panel.

> **Key input**: The validated prototype `france-explorer-combined.jsx` contains working implementations of all interactions described below. Use it as the behavioral spec.

### Architecture

> **Prototype reference**: `france-explorer-combined.jsx` contains validated choropleth logic, 6 indicator configs with 7-color palettes, top/bottom 5 ranking sidebars, bento detail panel with trend arrows, and cross-linked hover states. Use it as ground truth.

```
<FranceMap>
  Props:
    data: Record<string, DeptData>                             → all dept data (see shape below)
    indicator: IndicatorKey                                    → active indicator key ("rev"|"pov"|"cho"|"pop"|"med"|"det")
    selectedCode?: string                                      → highlight one dept
    onSelect?: (code: string) => void                         → callback on click
    linkBase?: string                                          → "/territoire/" for navigation
    size?: "sm" | "md" | "lg"                                 → responsive sizing
    showRanking?: boolean                                      → top/bottom 5 sidebar (default: true for lg)
    showDetail?: boolean                                       → bento detail panel (default: true for lg)
```

#### Validated data shapes (from prototype)

```typescript
// Per-département data object
interface DeptData {
  n: string;    // name: "Ain"
  r: string;    // region code: "ARA"
  pop: number;  // population
  rev: number;  // revenu médian €
  pov: number;  // taux de pauvreté %
  cho: number;  // chômage %
  med: number;  // densité médicale /10k hab.
  det: number;  // dette locale €/hab.
}

// 6 indicator configs validated in prototype
interface IndicatorConfig {
  key: string;            // "rev", "pov", "cho", "pop", "med", "det"
  label: string;          // "Revenu médian"
  unit: string;           // "€", "%", "/10k hab."
  icon: string;           // emoji or Lucide icon
  palette: string[];      // 7-color gradient array (dark → accent)
  accent: string;         // highlight color for active state
  higherIsBetter: boolean; // controls trend arrow direction
}
```

#### Choropleth logic (validated in prototype)

- `interpolateColor(t, palette)`: Given normalized value 0–1, interpolates across 7-stop palette
- `getT(value, indicator)`: Normalizes département value to 0–1 based on min/max across all depts for that indicator
- On indicator switch: recompute min/max, recolor all paths, update ranking, update legend
- Each département path gets `fill` from interpolated gradient, `stroke` based on hover/selection state

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Import SVG paths from `@svg-maps/france.departments` | `src/data/france-geo.ts` | P0 |
| 2 | Build `FranceMap` client component with choropleth | `src/components/france-map.tsx` | P0 |
| 3 | Build indicator selector pills (6 indicators) | Inside `france-map.tsx` | P0 |
| 4 | Build `MapTooltip` sub-component | Inside `france-map.tsx` | P0 |
| 5 | Build `MapLegend` sub-component (vertical gradient bar) | Inside `france-map.tsx` | P1 |
| 6 | Build ranking sidebar (top 5 / bottom 5) | Inside `france-map.tsx` | P1 |
| 7 | Build bento detail panel (6 metric cards + trend arrows) | Inside `france-map.tsx` | P1 |
| 8 | Add overseas département inset boxes | Inside `france-map.tsx` | P2 |

### 1. SVG Path Data (`src/data/france-geo.ts`)

**Source: `@svg-maps/france.departments` npm package** (already installed in the project).

This package provides pre-computed SVG paths for all 96 metropolitan départements with:
- ViewBox: `0 0 613 585` (already projected, no Lambert-93 math needed)
- Each location: `{ name: "Ain", id: "01", path: "m 413.70408,308.36159 ..." }`
- Correct département code → path mapping

**No build script needed.** Just import and augment with centroids + region codes:

```typescript
// src/data/france-geo.ts
import svgMap from "@svg-maps/france.departments";

export interface DeptGeo {
  d: string;                  // SVG path data (from npm package)
  centroid: [number, number]; // [x, y] for tooltip positioning (compute from path bbox)
  label: string;              // "Ain", "Aisne", etc. (from npm package)
  regionCode: string;         // "ARA", "HDF", etc. (manual mapping, 13 regions)
}

// Transform the npm package data into our format
export const DEPT_PATHS: Record<string, DeptGeo> = Object.fromEntries(
  svgMap.locations.map(loc => [
    loc.id,
    {
      d: loc.path,
      centroid: computeCentroid(loc.path), // bbox center of path
      label: loc.name,
      regionCode: DEPT_TO_REGION[loc.id],  // lookup table
    }
  ])
);

export const SVG_VIEWBOX = svgMap.viewBox; // "0 0 613 585"

// Overseas départements: separate inset boxes (paths not in the npm package)
export const OVERSEAS_CODES = ["971", "972", "973", "974", "976"];
```

**Key difference from original plan**: No GeoJSON fetching, no projection math, no simplification build step. The npm package handles all of this. Centroid computation is a simple bbox center calculation on the path data.

### 1b. Indicator Configs (`src/data/indicators.ts`)

Validated in the prototype — 6 indicators with 7-color gradient palettes:

```typescript
export const INDICATORS: IndicatorConfig[] = [
  {
    key: "rev", label: "Revenu médian", unit: "€",
    icon: "💰", accent: "#14b8a6",
    palette: ["#042f2e","#0f5e59","#0d7377","#0e9aa0","#2dd4bf","#5eead4","#99f6e4"],
    higherIsBetter: true,
  },
  {
    key: "pov", label: "Taux de pauvreté", unit: "%",
    icon: "📉", accent: "#f43f5e",
    palette: ["#4c0519","#881337","#be123c","#e11d48","#f43f5e","#fb7185","#fecdd3"],
    higherIsBetter: false,
  },
  {
    key: "cho", label: "Chômage", unit: "%",
    icon: "🏭", accent: "#f59e0b",
    palette: ["#451a03","#78350f","#a16207","#ca8a04","#eab308","#facc15","#fef08a"],
    higherIsBetter: false,
  },
  {
    key: "pop", label: "Population", unit: "hab.",
    icon: "👥", accent: "#6366f1",
    palette: ["#1e1b4b","#312e81","#3730a3","#4338ca","#6366f1","#818cf8","#c7d2fe"],
    higherIsBetter: true,
  },
  {
    key: "med", label: "Densité médicale", unit: "/10k",
    icon: "🏥", accent: "#10b981",
    palette: ["#022c22","#064e3b","#065f46","#047857","#059669","#10b981","#6ee7b7"],
    higherIsBetter: true,
  },
  {
    key: "det", label: "Dette locale", unit: "€/hab.",
    icon: "🏛️", accent: "#8b5cf6",
    palette: ["#2e1065","#4c1d95","#5b21b6","#6d28d9","#7c3aed","#8b5cf6","#c4b5fd"],
    higherIsBetter: false,
  },
];
```

### 2. `FranceMap` Component (`src/components/france-map.tsx`)

The prototype (`france-explorer-combined.jsx`) contains the complete validated implementation. Key implementation notes for the production port:

**ViewBox**: `0 0 613 585` (from `@svg-maps/france.departments`, NOT 700×620)

**Color interpolation** — use 7-stop palette, not `color-mix()`:

```typescript
function interpolateColor(t: number, palette: string[]): string {
  // t is 0–1, palette has 7 colors
  const idx = t * (palette.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, palette.length - 1);
  const frac = idx - lo;
  // Lerp between palette[lo] and palette[hi] by frac
  // (hex → rgb → lerp → hex)
  return lerpHex(palette[lo], palette[hi], frac);
}
```

**Component structure** (validated in prototype):

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─ Indicator selector pills ───────────────────────────┐   │
│  │ Revenu │ Pauvreté │ Chômage │ Population │ Méd │ Det │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────┐  ┌──── Ranking ───────┐ │
│  │                                │  │ ▲ TOP 5            │ │
│  │     SVG MAP (613×585)          │  │ 1. Hauts-de-S 26k€ │ │
│  │     96 dept paths              │  │ 2. Paris      25k€ │ │
│  │     choropleth fill            │  │ ...                 │ │
│  │     hover tooltip              │  │                     │ │
│  │     ┌─ Legend ─┐               │  │ ▼ BOTTOM 5         │ │
│  │     │ gradient │               │  │ 92. Aude      18k€ │ │
│  │     │ min/max  │               │  │ ...                 │ │
│  │     └──────────┘               │  └────────────────────┘ │
│  └────────────────────────────────┘                          │
│                                                              │
│  ┌─── Bento Detail Panel (when dept selected) ───────────┐  │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │  │
│  │ │Pop     │ │Revenu  │ │Députés │ │Chômage │ │Méd   │ │  │
│  │ │2.1M    │ │23 450€ │ │12      │ │8.2%    │ │9.1   │ │  │
│  │ │↑ +12%  │ │↓ -3%   │ │        │ │↑ mieux │ │↓ pire│ │  │
│  │ └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│  (empty state: dashed border + MapPin icon when no dept)    │
└─────────────────────────────────────────────────────────────┘
```

**Interaction flow** (validated in prototype):
1. User clicks indicator pill → map recolors all 96 paths, ranking updates, legend updates
2. User hovers département → tooltip appears with name, code, value, rank
3. User clicks département → bento detail panel populates with 6 metrics + trend arrows vs national average
4. User hovers ranking item → corresponding département highlights on map
5. User clicks ranking item → selects that département

**Trend arrows in detail panel**:
- `↑` teal = better than national average (considering `higherIsBetter` flag)
- `↓` rose = worse than national average
- Shows exact % deviation: "↑ +12% vs moy."

**Active indicator highlighting**: Selected metric gets accent-colored border in bento panel.

**Production implementation**: Port the prototype's React component from JSX to TSX, replacing inline data with API-fetched data, and the embedded SVG viewBox/paths with the `@svg-maps/france.departments` import.

### Design details (bureau aesthetic)

- **Default state**: Départements filled in `bureau-800` (no data) or choropleth gradient
- **Hover**: Lighter stroke + tooltip appears at centroid position
- **Selected**: White 2px stroke (for `/mon-territoire` to highlight user's dept)
- **Region borders**: Optional thicker strokes grouping départements by `regionCode`
- **Overseas**: Inset boxes at bottom-left (Guadeloupe, Martinique, Guyane, Réunion, Mayotte)
- **Legend**: Vertical gradient bar with min/max labels
- **Transitions**: `transition-colors duration-150` on fill changes
- **Accessibility**: `role="button"` + `aria-label` on each path with value

### Acceptance criteria (8A)

- [ ] `france-geo.ts` imports 96 metropolitan paths from `@svg-maps/france.departments`
- [ ] `indicators.ts` contains 6 indicator configs with 7-color palettes
- [ ] Map renders at 3 sizes (sm/md/lg) with viewBox `0 0 613 585`
- [ ] 6 indicator selector pills switch choropleth coloring dynamically
- [ ] 7-stop palette interpolation produces smooth gradients (not `color-mix`)
- [ ] Hover tooltip shows département name, code, value, and rank
- [ ] Click selects département → bento detail panel shows 6 metrics
- [ ] Trend arrows show ↑/↓ vs national average with % deviation
- [ ] Top 5 / Bottom 5 ranking sidebar updates on indicator switch
- [ ] Ranking items cross-link to map (hover highlights, click selects)
- [ ] Empty state (no dept selected): dashed border + MapPin icon prompt
- [ ] Active indicator gets accent-colored border in detail panel
- [ ] Overseas départements render as inset boxes (bottom-left)
- [ ] Legend displays vertical gradient bar + min/max labels
- [ ] Mobile: map scales to container width, detail panel stacks below
- [ ] Only npm dependency: `@svg-maps/france.departments` (already installed)
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 8B: Map Integration Across the Platform

**Goal**: Embed `<FranceMap>` in every page where territorial data comparison makes sense.

### Integration points

| # | Page | Map usage | Color | Data source |
|---|------|-----------|-------|-------------|
| 1 | `/territoire` (hub) | Full-width hero map — click to explore | teal | `StatLocale` MEDIAN_INCOME or POP_TOTAL |
| 2 | `/territoire/[dept]` | Small map with selected dept highlighted | blue | Static (just highlight) |
| 3 | `/mon-territoire` | Small map with user's dept highlighted | teal | Static (just highlight) |
| 4 | `/dossiers/pouvoir-dachat` | Choropleth: median income by dept | amber | `StatLocale` MEDIAN_INCOME |
| 5 | `/dossiers/sante` | Choropleth: GP density by dept | rose | `DensiteMedicale` MG |
| 6 | `/dossiers/emploi-jeunesse` | Choropleth: unemployment rate | amber | `StatLocale` UNEMPLOYMENT |
| 7 | `/dossiers/logement` | Choropleth: vacancy rate (after 8C) | blue | `StatLocale` VACANCY_RATE |
| 8 | `/dossiers/dette-publique` | Choropleth: dept debt per habitant | rose | `BudgetLocal` detteParHab |
| 9 | `/comparer/territoires` | Two small maps, each with selected dept | blue | Static (highlight only) |
| 10 | `/votes/alignements` | (future) Geographic vote pattern map | teal | `VoteRecord` aggregated |

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Territoire hub: hero map with indicator selector | `src/app/territoire/page.tsx` | P0 |
| 2 | Territoire dept: contextual mini-map | `src/app/territoire/[departementCode]/page.tsx` | P1 |
| 3 | Mon-territoire: mini-map with highlight | `src/app/mon-territoire/page.tsx` | P1 |
| 4 | Dossier pouvoir-dachat: income map | `src/app/dossiers/pouvoir-dachat/page.tsx` | P0 |
| 5 | Dossier santé: GP density map | `src/app/dossiers/sante/page.tsx` | P1 |
| 6 | Dossier emploi: unemployment map | `src/app/dossiers/emploi-jeunesse/page.tsx` | P1 |
| 7 | Dossier dette: debt map | `src/app/dossiers/dette-publique/page.tsx` | P2 |
| 8 | Comparer: highlight maps | `src/app/comparer/territoires/page.tsx` | P2 |

### 1. Territoire hub — hero map with indicator selector

This is the most impactful integration. Replace the current region browser with:

```
┌─────────────────────────────────────────────────────────────┐
│  TERRITOIRE                                                  │
│  "Explorer la France par les données"                        │
│                                                              │
│  ┌─ Indicator selector pills ───────────────────────────┐    │
│  │ Revenu médian │ Pauvreté │ Chômage │ Population │ ... │   │
│  └───────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────┐  │
│  │                                    │  │ TOP 5          │  │
│  │          FRANCE MAP                │  │ 1. Paris  42k€ │  │
│  │     (choropleth by selected        │  │ 2. Hts-S 28k€  │  │
│  │      indicator)                    │  │ 3. Yveln 27k€  │  │
│  │                                    │  │ ...            │  │
│  │     Click a département            │  │                │  │
│  │     to explore →                   │  │ BOTTOM 5       │  │
│  │                                    │  │ 97. Aisne 19k€ │  │
│  │                                    │  │ ...            │  │
│  └────────────────────────────────────┘  └────────────────┘  │
│                                                              │
│  ▎ RÉGIONS                                                   │
│  [existing region cards below, kept as secondary nav]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Indicator selector**: A row of pills (client component) that switches the map's choropleth data. Each pill triggers a re-render with different `StatLocale` indicator values.

**Sidebar ranking**: Top 5 and bottom 5 départements for the selected indicator — each linking to `/territoire/[code]`.

**Implementation note**: The indicator selector needs to be a client component, but the data can be loaded server-side for all indicators at once (they're in `StatLocale`, ~1,200 rows total — small enough to pass as props).

### 2. Dossier page maps

Each dossier page replaces or augments its existing `DeptMap` (horizontal bar chart) with a `FranceMap` choropleth. The bar chart can remain below as a ranked list, with the map above providing geographic context.

**Pattern for dossier integration**:

```typescript
// Example: /dossiers/pouvoir-dachat/page.tsx

const incomeByDept = await prisma.statLocale.findMany({
  where: { indicateur: "MEDIAN_INCOME", geoType: "DEP" },
  orderBy: { annee: "desc" },
  distinct: ["geoCode"],
});

const mapData = incomeByDept.map(s => ({
  code: s.geoCode,
  value: s.valeur,
  label: `${s.annee}`,
}));

// In JSX:
<FranceMap
  data={mapData}
  colorScale="amber"
  unit="€"
  legend="Revenu médian"
  linkBase="/territoire/"
  size="lg"
/>
```

### Acceptance criteria (8B)

- [ ] `/territoire` hub shows interactive choropleth with indicator selector
- [ ] At least 4 dossier pages have choropleth maps
- [ ] `/territoire/[dept]` shows mini-map with selected département highlighted
- [ ] `/mon-territoire` shows mini-map with user's département highlighted
- [ ] All maps link to département dashboards on click
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 8C: Mélodi Data Enrichment

**Goal**: Add housing and education data from INSEE Mélodi to fill gaps in dossier pages and territory dashboards.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Write `GEO-LOG` housing ingestion | `scripts/ingest-insee-housing.ts` | P0 |
| 2 | Write `GEO-DIP` education ingestion | `scripts/ingest-insee-education.ts` | P0 |
| 3 | Add to orchestrator (Wave 8 parallel) | `scripts/ingest.ts` | P1 |
| 4 | Verify `StatCriminalite` + `DensiteMedicale` row counts | CLI check | P1 |
| 5 | Retry DEP 36 (Indre) for missing population data | `scripts/ingest-insee-local.ts` | P2 |
| 6 | Integrate new data into dossier pages + territory | Various pages | P1 |

### 1. Housing data (`GEO-LOG`)

**Mélodi dataset**: `DS_RP_LOGEMENT_PRINC`
**Indicators to extract**:

| StatLocale indicateur | Mélodi measure | Description |
|----------------------|----------------|-------------|
| `HOUSING_TOTAL` | Count with `TYPMEN_ENQ=_T` | Total housing stock |
| `HOUSING_VACANCY_RATE` | Computed: vacant / total | Vacancy rate % |
| `HOUSING_OWNER_RATE` | Computed: owners / occupied | Owner-occupier rate % |
| `HOUSING_RENTER_RATE` | Computed: renters / occupied | Renter rate % |
| `HOUSING_HLM_RATE` | Computed: HLM / rented | Social housing share % |

**Script pattern**: Identical to `ingest-insee-local.ts` — loop 101 départements, fetch CSV from Mélodi, parse semicolons + BOM, upsert to `StatLocale`.

```typescript
// scripts/ingest-insee-housing.ts
// Endpoint: https://api.insee.fr/melodi/data/DS_RP_LOGEMENT_PRINC/to-csv
//   ?GEO=DEP-{code}&TIME_PERIOD=2021&TYPMEN_ENQ=_T
// Rate limit: 2100ms between requests (same as existing)
// Output: StatLocale upserts with source="RP", geoType="DEP"
```

### 2. Education data (`GEO-DIP`)

**Mélodi dataset**: `DS_RP_DIPLOMES_FORM_PRINC`
**Indicators to extract**:

| StatLocale indicateur | Description |
|----------------------|-------------|
| `EDUC_NO_DIPLOMA` | % population 15+ with no diploma |
| `EDUC_BAC_PLUS` | % population 15+ with bac or higher |
| `EDUC_HIGHER_EDUC` | % population 15+ with bac+2 or higher |

### 3. Integration

Once ingested, these enrich:

| Page | New data shown |
|------|---------------|
| `/dossiers/logement` | Vacancy rate choropleth map (FranceMap), HLM share ranking, owner/renter ratio cards |
| `/dossiers/emploi-jeunesse` | Education level breakdown per dept, "no diploma" ranking |
| `/territoire/[dept]` | Housing section (vacancy, ownership), Education section |
| `/mon-territoire` | Housing + education stats in local economy section |
| `/comparer/territoires` | Housing + education rows in comparison table |

### Acceptance criteria (8C)

- [ ] `ingest-insee-housing.ts` ingests 5 housing indicators × 101 depts
- [ ] `ingest-insee-education.ts` ingests 3 education indicators × 101 depts
- [ ] Both scripts added to orchestrator
- [ ] `StatCriminalite` and `DensiteMedicale` row counts verified > 0
- [ ] `/dossiers/logement` shows vacancy rate map + HLM share
- [ ] `/dossiers/emploi-jeunesse` shows education stats
- [ ] `/territoire/[dept]` shows new housing + education sections
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 8D: UX Polish Pass

**Goal**: Systematic UX improvements across the platform — transitions, empty states, mobile layout, loading states, and micro-interactions.

### Tasks

| # | Task | Scope | Priority |
|---|------|-------|----------|
| 1 | Page transition animations | Platform-wide | P0 |
| 2 | Empty state designs | All data-dependent sections | P0 |
| 3 | Mobile responsive audit | All 57 routes | P0 |
| 4 | Skeleton loading states | Server components with slow queries | P1 |
| 5 | Scroll-driven animations | Homepage + dossier pages | P2 |
| 6 | Keyboard navigation | FranceMap + all interactive elements | P1 |
| 7 | Print stylesheet | Deputy profiles + territory dashboards | P2 |

### 1. Page transitions

Add staggered `fade-up` animations to page sections. The platform already has `.fade-up` in `globals.css` — extend with `animation-delay` for sequential reveal:

```css
/* globals.css additions */
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.10s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.20s; }
.stagger-5 { animation-delay: 0.25s; }
.stagger-6 { animation-delay: 0.30s; }
```

Apply to each section in dossier pages, territory dashboards, and profile pages.

### 2. Empty states

Design consistent empty-state components for when data is missing:

```typescript
// src/components/empty-state.tsx

interface EmptyStateProps {
  icon: "chart" | "map" | "person" | "vote" | "building";
  title: string;       // "Aucune donnée disponible"
  subtitle?: string;   // "Les statistiques pour ce département ne sont pas encore ingérées."
}
```

Use across:
- `StatLocale` sections when indicators are missing (e.g., Mayotte)
- `BudgetLocal` sections for communes without budget data
- `DensiteMedicale` / `StatCriminalite` when tables are empty
- Search results when no matches found

### 3. Mobile responsive audit

Key areas to check:
- `FranceMap`: Must scale to 100% container width; tooltips must not overflow viewport
- `/comparer/*`: Two-column layout must stack to single column below `md` breakpoint
- `/mon-territoire`: All sections must be readable at 375px width
- Navbar search: Already desktop-only (`hidden md:flex`) — add mobile search icon that opens full-screen overlay
- Tables in dossier pages: Horizontal scroll wrapper for narrow viewports

### 4. Skeleton loading states

For pages with expensive queries, add `loading.tsx` files with skeleton UI:

```typescript
// src/app/territoire/[departementCode]/loading.tsx
// src/app/mon-territoire/loading.tsx
// src/app/dossiers/[slug]/loading.tsx

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Skeleton matching page layout */}
      <div className="h-8 w-48 rounded bg-bureau-800 mb-4" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-bureau-800" />
        ))}
      </div>
    </div>
  );
}
```

### 5. Keyboard navigation for FranceMap

- Tab through départements (focus ring visible)
- Enter/Space to "click" (navigate)
- Arrow keys to move between adjacent départements
- Escape to deselect

### Acceptance criteria (8D)

- [ ] Staggered fade-up animations on all major pages
- [ ] Empty states show for all missing-data scenarios
- [ ] All pages render correctly at 375px width
- [ ] Skeleton loading states on 3+ pages
- [ ] FranceMap fully keyboard-navigable
- [ ] Build passes with zero TypeScript errors

---

## Updated Architecture After Phase 8

| Metric | After Phase 7 | After Phase 8 |
|--------|--------------|--------------|
| Routes | 57 | 57 (no new routes) |
| Components | ~27 | ~32 (`FranceMap`, `MapTooltip`, `MapLegend`, `IndicatorPills`, `EmptyState`) |
| StatLocale rows | 1,186 | ~2,200+ (housing + education) |
| Data indicators | 12 per dept | 20+ per dept |
| Client components | 6 | 7 (`FranceMap`) |
| Dossier pages with maps | 0 | 5+ |

---

## Session Planning

| Session | Sub-phase | What ships |
|---------|-----------|-----------|
| **18** | 8A | `FranceMap` component + `france-geo.ts` (from `@svg-maps/france.departments`) + `indicators.ts` |
| **19** | 8B | Map integrated in territoire hub + 4 dossier pages + mon-territoire |
| **20** | 8C | Housing + education Mélodi scripts + page integration |
| **21** | 8D | Mobile audit + empty states + transitions + loading states |

---

## Design Notes — Bureau Aesthetic + Maps

The map must feel like it belongs in the Intelligence Bureau. Key visual guidelines:

- **No bright fills on empty départements** — use `bureau-800` as neutral, not white or light gray
- **Choropleth goes dark-to-accent** — `bureau-800` (low) → accent color (high), never white-to-color
- **Border strokes**: `bureau-700` default, `bureau-200` on hover, `white` on selected
- **Tooltip**: `bureau-900/95` backdrop-blur, border `bureau-600`, matches existing card style
- **Legend**: Vertical gradient bar (same as `TimelineChart` pattern), positioned top-right
- **Overseas inset**: Boxed in `bureau-900` with `bureau-600` border, bottom-left position
- **Noise overlay**: The existing `.noise-overlay` CSS applies to the page — map sits on top naturally
- **Animation**: `transition-colors duration-150` on path fills for smooth hover feedback
- **Font**: `DM Sans` for all map text (labels, tooltip, legend) — consistent with body

**Never**:
- Use bright/saturated colors for the "no data" state
- Put text directly on the map SVG (except overseas labels)
- Use drop shadows on département paths
- Break the dark-first color logic of the bureau palette
- Fetch GeoJSON at runtime (sandbox blocks external requests — use bundled SVG paths)
- Use `color-mix()` for choropleth (use 7-stop palette interpolation instead)