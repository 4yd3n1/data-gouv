# Frontend Architecture — L'Observatoire Citoyen

## Status: Phase 3 COMPLETE

17 routes, 5 shared components, production build passing. All pages use Server Components with direct Prisma queries — no API layer.

---

## Design System

### Aesthetic: "Intelligence Bureau"
Dark-mode civic dashboard. Deep navy base, teal for data/navigation accents, amber for financial metrics, rose for alerts/monuments. Instrument Serif for display headings, DM Sans for body text.

### Color Palette (`globals.css` @theme)
| Token | Hex | Usage |
|-------|-----|-------|
| `bureau-950` | `#080c14` | Page background |
| `bureau-900` | `#0c1018` | Header/footer background |
| `bureau-800` | `#111827` | Card backgrounds |
| `bureau-700` | `#1a2236` | Borders |
| `bureau-600` | `#243049` | Hover borders |
| `bureau-500` | `#3b4f6e` | Muted text, labels |
| `bureau-400` | `#64748b` | Secondary text |
| `bureau-300` | `#94a3b8` | Body text |
| `bureau-200` | `#cbd5e1` | Primary text (via body default) |
| `bureau-100` | `#e2e8f0` | Headings, emphasized text |
| `teal` | `#2dd4bf` | Data accents, links, navigation active |
| `amber` | `#f59e0b` | Financial figures, museum attendance |
| `rose` | `#f43f5e` | Monuments, alerts, protection badges |
| `blue` | `#3b82f6` | Economy charts |

### Typography
- **Display**: `Instrument Serif 400` via `next/font/google` → `--font-display`
- **Body**: `DM Sans` via `next/font/google` → `--font-body`
- Display font applied with: `font-[family-name:var(--font-display)]`

### Visual Effects (`globals.css`)
| Class | Effect |
|-------|--------|
| `.grid-bg` | Subtle teal grid pattern (48px spacing) for hero sections |
| `.glow-teal` / `.glow-amber` | Box-shadow glow effects |
| `.card-accent` | Top gradient border (teal) via `::before` pseudo-element |
| `.fade-up` + `.delay-1..4` | Staggered entrance animation (translateY + opacity) |
| `.bar-fill` | Score bar width animation (0 → target) |
| `.search-glow` | Teal focus ring + glow for search inputs |
| `body::after` | Noise grain overlay (fractalNoise SVG, 2.5% opacity) |

---

## Route Map (17 routes)

### Static (prerendered at build time)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Hero stats, section cards, recent declarations |
| `/gouvernance` | Hub | Cards linking to deputes/senateurs/lobbyistes with counts |
| `/economie` | Dashboard | Inline SVG MiniChart for each indicator (GDP, unemployment, enterprises) |
| `/territoire` | Browser | Regions grouped with departments, deputy/senator/monument counts |
| `/patrimoine` | Hub | Top 10 museums by attendance (bar chart), monument domains |

### Dynamic (server-rendered on demand)
| Route | Page | Key Features |
|-------|------|-------------|
| `/gouvernance/deputes` | List | Search, political group filter chips, pagination (30/page) |
| `/gouvernance/deputes/[id]` | Profile | Info sidebar, ScoreBar (participation/loyalty/speciality/majority), contact links |
| `/gouvernance/senateurs` | List | Search, pagination |
| `/gouvernance/senateurs/[id]` | Profile | Mandates timeline, commissions list |
| `/gouvernance/lobbyistes` | List | Search, action counts per entity |
| `/gouvernance/lobbyistes/[id]` | Detail | Info panel, paginated actions list |
| `/patrimoine/musees` | List | Search, latest attendance figure per museum |
| `/patrimoine/musees/[id]` | Detail | SVG bar chart (attendance by year), data table (payant/gratuit/scolaires...) |
| `/patrimoine/monuments` | List | Search, protection type filter chips, century badges |
| `/patrimoine/monuments/[id]` | Detail | Info panel, description/historique text, OpenStreetMap GPS link |
| `/territoire/[departementCode]` | Cross-ref | Stats bar + deputies + senators + museums + monuments for one department |

---

## Shared Components

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| `PageHeader` | `src/components/page-header.tsx` | Server | Breadcrumb nav + title/subtitle, used on every section page |
| `SearchInput` | `src/components/search-input.tsx` | Client (`"use client"`) | URL param-based search with debounce, pending spinner, Suspense-compatible |
| `Pagination` | `src/components/pagination.tsx` | Server | Page numbers with ellipsis, previous/next arrows, preserves existing URL params |
| `StatCard` / `StatRow` | `src/components/stat-card.tsx` | Server | Number + label display with accent colors (teal/amber/rose) |
| `ScoreBar` | `src/components/score-bar.tsx` | Server | Horizontal animated bar for deputy participation scores (0-100) |

---

## Key Patterns

### Server Components + Prisma
All pages are async Server Components. Prisma queries run directly in the component — no API routes, no client-side fetching. Data flows: Prisma → Server Component → HTML.

```tsx
export default async function Page() {
  const data = await prisma.model.findMany({ ... });
  return <div>{/* render data */}</div>;
}
```

### Search with URL Params
Search uses Next.js `searchParams` (Promise in Next.js 16). The `SearchInput` client component pushes `?q=...` to the URL. The server component reads it:

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  // params.q, params.page, params.type, etc.
}
```

### Suspense Boundaries
Client components (`SearchInput`) wrapped in `<Suspense>`. Data-fetching sections wrapped with fallback:

```tsx
<Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
  <DataList searchParams={params} />
</Suspense>
```

### SVG Charts (no library)
Economy page uses inline SVG `MiniChart` component — area charts with gradient fills. Museum detail uses SVG bar chart. No chart library dependency.

### French Formatting (`src/lib/format.ts`)
| Function | Example Output |
|----------|---------------|
| `fmt(1234567)` | `1 234 567` |
| `fmtEuro(50000)` | `50 000 €` |
| `fmtPct(12.5)` | `12,5 %` |
| `fmtDate(date)` | `26 février 2026` |
| `fmtCompact(1500000)` | `1,5M` |

---

## File Structure

```
src/
├── app/
│   ├── globals.css              # Theme colors, effects, animations
│   ├── layout.tsx               # Root: fonts, navbar (5 items), footer
│   ├── page.tsx                 # Dashboard homepage
│   ├── gouvernance/
│   │   ├── page.tsx             # Hub (3 cards)
│   │   ├── deputes/
│   │   │   ├── page.tsx         # List + group filters
│   │   │   └── [id]/page.tsx    # Profile + scores
│   │   ├── senateurs/
│   │   │   ├── page.tsx         # List
│   │   │   └── [id]/page.tsx    # Profile + mandates
│   │   └── lobbyistes/
│   │       ├── page.tsx         # Registry list
│   │       └── [id]/page.tsx    # Detail + actions
│   ├── economie/
│   │   └── page.tsx             # SVG charts dashboard
│   ├── territoire/
│   │   ├── page.tsx             # Region/dept browser
│   │   └── [departementCode]/page.tsx  # Cross-reference
│   └── patrimoine/
│       ├── page.tsx             # Hub: top museums + domains
│       ├── musees/
│       │   ├── page.tsx         # List + search
│       │   └── [id]/page.tsx    # Detail + attendance chart
│       └── monuments/
│           ├── page.tsx         # List + type filters
│           └── [id]/page.tsx    # Detail + GPS link
├── components/
│   ├── page-header.tsx          # Breadcrumbs + title
│   ├── search-input.tsx         # Client-side URL search
│   ├── pagination.tsx           # Page numbers
│   ├── stat-card.tsx            # Stats display
│   └── score-bar.tsx            # Animated score bars
└── lib/
    ├── db.ts                    # Prisma client (pg adapter)
    └── format.ts                # French number/date formatting
```

---

## Build Output

```
Route (app)                           Type
┌ ○ /                                 Static
├ ○ /economie                         Static
├ ○ /gouvernance                      Static
├ ƒ /gouvernance/deputes              Dynamic
├ ƒ /gouvernance/deputes/[id]         Dynamic
├ ƒ /gouvernance/lobbyistes           Dynamic
├ ƒ /gouvernance/lobbyistes/[id]      Dynamic
├ ƒ /gouvernance/senateurs            Dynamic
├ ƒ /gouvernance/senateurs/[id]       Dynamic
├ ○ /patrimoine                       Static
├ ƒ /patrimoine/monuments             Dynamic
├ ƒ /patrimoine/monuments/[id]        Dynamic
├ ƒ /patrimoine/musees                Dynamic
├ ƒ /patrimoine/musees/[id]           Dynamic
├ ○ /territoire                       Static
└ ƒ /territoire/[departementCode]     Dynamic
```
