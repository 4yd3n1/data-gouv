# Frontend Implementation

> Last updated: Feb 28, 2026

Complete reference for all UI pages, components, styling, and patterns.

---

## Architecture

- **Next.js 16** App Router — all pages are React Server Components by default
- **Tailwind CSS 4** with custom theme tokens defined in `globals.css`
- **No client-side data fetching** — every page queries Prisma directly at render time
- **4 client components**: `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs` (all use `"use client"`)
- **French localization** throughout: `<html lang="fr">`, `fr-FR` locale for numbers/dates

---

## Design System

### Aesthetic: "Intelligence Bureau"

Dark-mode civic dashboard. Deep navy base, teal for data/navigation accents, amber for financial metrics, rose for alerts/monuments. Instrument Serif for display headings, DM Sans for body text.

### Color Palette

Custom Tailwind tokens in [globals.css](../src/app/globals.css):

| Token | Hex | Usage |
|-------|-----|-------|
| `bureau-950` | `#080c14` | Page background |
| `bureau-900` | `#0c1018` | Header/footer background |
| `bureau-800` | `#111827` | Card backgrounds |
| `bureau-700` | `#1a2236` | Borders, scrollbar |
| `bureau-600` | `#243049` | Muted borders |
| `bureau-500` | `#3b4f6e` | Secondary text |
| `bureau-400` | `#64748b` | Labels, captions |
| `bureau-300` | `#94a3b8` | Body text |
| `bureau-200` | `#cbd5e1` | Primary text |
| `bureau-100` | `#e2e8f0` | Headings, emphasis |
| `teal` | `#2dd4bf` | Primary accent, CTAs, active states, "Pour" votes |
| `teal-dim` | `#2dd4bf20` | Subtle teal backgrounds |
| `amber` | `#f59e0b` | Economy, financial, "Abstention" votes |
| `amber-dim` | `#f59e0b18` | Subtle amber backgrounds |
| `rose` | `#f43f5e` | Monuments, "Contre" votes, rejections |
| `blue` | `#3b82f6` | Territory, governance |

### Typography

Fonts loaded via `next/font/google` in [layout.tsx](../src/app/layout.tsx):

| Font | Variable | Usage |
|------|----------|-------|
| DM Sans | `--font-body` | Body text, UI labels |
| Instrument Serif | `--font-display` | Page titles, brand name |

Applied with: `font-[family-name:var(--font-display)]` for headings.

### Visual Effects

| Effect | Class / Selector | Description |
|--------|-----------------|-------------|
| Noise overlay | `body::after` | SVG fractalNoise, opacity 0.025, fixed position |
| Grid pattern | `.grid-bg` | 48px teal grid lines at 4% opacity (hero sections) |
| Card accent | `.card-accent::before` | 1px gradient line at top of cards |
| Glow | `.glow-teal`, `.glow-amber` | 60px box-shadow for stat cards |
| Fade-up | `.fade-up` + `.delay-{1..4}` | 0.6s staggered entrance animation |
| Bar fill | `.bar-fill` | 0.8s width animation for score bars |
| Search glow | `.search-glow:focus` | Teal ring + blur on search input focus |
| Scrollbar | `::-webkit-scrollbar` | 5px dark styled scrollbar |
| Scrollbar hide | `.scrollbar-hide` | Hidden scrollbar for horizontal tab navigation |

---

## Layout

[layout.tsx](../src/app/layout.tsx) provides the shell:

- **Navbar**: Sticky top, backdrop-blur, SVG logo + "L'Observatoire" brand + 5 nav links (Accueil, Gouvernance, Economie, Territoire, Patrimoine)
- **Main**: `flex-1` content area
- **Footer**: Data source attribution ("data.gouv.fr, INSEE, Senat, HATVP") + "L'Observatoire Citoyen 2025"
- **Container**: `max-w-7xl px-6` on list pages; `max-w-4xl px-6` on profile detail pages (focused editorial width)

**Metadata**: `"L'Observatoire Citoyen — Intelligence civique francaise"`

---

## Route Map (19 routes)

### Static (prerendered at build time)
| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero stats, 4 section cards, recent declarations, overview grid |
| `/gouvernance` | Hub — 4 cards (Deputes, Senateurs, Lobbyistes, Scrutins) with counts |
| `/economie` | Dashboard — SVG MiniChart per indicator |
| `/territoire` | Browser — regions with department cards |
| `/patrimoine` | Hub — top 10 museums + monument domains |

### Dynamic (server-rendered on demand)
| Route | Key Features |
|-------|-------------|
| `/gouvernance/deputes` | Search, groupe filter, dept filter, pagination |
| `/gouvernance/deputes/[id]` | Hero profile + tabs (Activite/Declarations/Informations) |
| `/gouvernance/senateurs` | Search, pagination |
| `/gouvernance/senateurs/[id]` | Hero profile + tabs (Mandats & Commissions/Declarations/Informations) |
| `/gouvernance/lobbyistes` | Search, pagination |
| `/gouvernance/lobbyistes/[id]` | Info panel, actions list |
| `/gouvernance/scrutins` | Search, result filter (adopte/rejete), pagination |
| `/gouvernance/scrutins/[id]` | Result summary, group bars, individual votes |
| `/patrimoine/musees` | Search, pagination |
| `/patrimoine/musees/[id]` | SVG bar chart, attendance table |
| `/patrimoine/monuments` | Search, protection type filter, pagination |
| `/patrimoine/monuments/[id]` | Info panel, GPS link, description/historique |
| `/territoire/[departementCode]` | Stats bar + deputies + senators + museums + monuments |

---

## Pages Detail

### `/` — Homepage ("L'Observatoire Citoyen")

**File**: [page.tsx](../src/app/page.tsx)

**Data**: Counts of all entities + 6 recent declarations with highest `totalParticipations`.

**Sections**:
1. **Hero** — `.grid-bg` pattern, display-font title, 4 `StatCard` (Deputes teal, Senateurs blue, Scrutins amber, Monuments rose)
2. **Explorer les donnees** — 4 section cards with SVG icons, accent colors, descriptions, arrow links
3. **Declarations d'interets** — 6 cards showing officials with highest financial participations
4. **Vue d'ensemble** — 10-stat grid covering all data sources

---

### `/gouvernance` — Governance Hub

**File**: [page.tsx](../src/app/gouvernance/page.tsx)

**Data**: Counts + active counts for deputes/senateurs/lobbyistes/scrutins.

**Layout**: 4 accent-bordered cards, each linking to subsection with aggregate stats.

---

### `/gouvernance/deputes` — Deputies List

**File**: [page.tsx](../src/app/gouvernance/deputes/page.tsx)

**Features**:
- Search by nom/prenom/departement (case-insensitive `contains`)
- Filter by groupe — chiplet buttons from `groupBy`
- Filter by departement — chiplet buttons
- Pagination: 30 per page
- Sort: `actif desc, nom asc`

**Display per row**: Avatar, name, groupe badge, department, participation + loyaute score bars.

**Components**: `PageHeader`, `SearchInput`, `Avatar`, `Pagination`

---

### `/gouvernance/deputes/[id]` — Deputy Detail

**File**: [page.tsx](../src/app/gouvernance/deputes/[id]/page.tsx)

**Data**:
- Deputy with departement relation
- 10 recent votes (with scrutin)
- Deports ordered by dateCreation desc
- Declarations matched by `nom + prenom + typeMandat:"Depute"` (with participations + revenus)
- Reads `searchParams.tab` (default: `"activite"`)

**Layout** (hero + tabbed content, `max-w-4xl` centered):
- **Hero banner** (`ProfileHero`): 96px avatar with teal ring, display-font name, group badge pill, status dot (teal glow if active), contact pills (email/twitter/website), 4 `ScoreGauge` boxes (participation/specialite/loyaute/majorite in teal/blue/amber/rose)
- **Tab bar** (`ProfileTabs`): URL-driven `?tab=` navigation, teal active indicator
- **Tab: Activite** (default): Recent votes as clickable cards (`VoteBadge` + title + date) + deports list
- **Tab: Declarations**: `DeclarationSection` (expandable cards, unchanged)
- **Tab: Informations**: `dl` grid (`sm:grid-cols-2`) — groupe, dept, circ., legislature, naissance, profession, mandats, experience, prise de fonction

**Components**: `ProfileHero`, `ProfileTabs`, `Avatar`, `ScoreGauge`, `VoteBadge`, `DeclarationSection`

---

### `/gouvernance/senateurs` — Senators List

**File**: [page.tsx](../src/app/gouvernance/senateurs/page.tsx)

**Features**: Search by nom/prenom/departement, pagination (30/page).

**Display**: Avatar, name, groupe, department.

---

### `/gouvernance/senateurs/[id]` — Senator Detail

**File**: [page.tsx](../src/app/gouvernance/senateurs/[id]/page.tsx)

**Data**: Senator with mandats + commissions, declarations by `nom + prenom + typeMandat:"Senateur"`. Reads `searchParams.tab` (default: `"mandats"`).

**Layout** (hero + tabbed content, `max-w-4xl` centered):
- **Hero banner** (`ProfileHero`): 96px avatar with teal ring, display-font name, status dot, no scores (senators), no badge
- **Tab bar** (`ProfileTabs`): URL-driven `?tab=` navigation
- **Tab: Mandats & Commissions** (default): Mandate cards (libelle, type, date range with "en cours" in teal) + commission cards (nom, fonction, date range)
- **Tab: Declarations**: `DeclarationSection` (expandable cards, unchanged)
- **Tab: Informations**: `dl` grid — groupe, departement, profession, naissance, prise de fonction

**Components**: `ProfileHero`, `ProfileTabs`, `Avatar`, `DeclarationSection`

---

### `/gouvernance/lobbyistes` — Lobbyists List

**File**: [page.tsx](../src/app/gouvernance/lobbyistes/page.tsx)

**Data**: Lobbyiste with `_count.actions`, search by org name, 30/page.

**Display**: Org name, category, effectif, action count.

---

### `/gouvernance/lobbyistes/[id]` — Lobbyist Detail

**File**: [page.tsx](../src/app/gouvernance/lobbyistes/[id]/page.tsx)

**Data**: Lobbyiste with actions (limit 50).

**Layout**: Info card (type, category, SIREN, effectif, chiffre d'affaires, address, registration) + actions list.

---

### `/gouvernance/scrutins` — Parliamentary Votes List

**File**: [page.tsx](../src/app/gouvernance/scrutins/page.tsx)

**Features**: Search by title, filter by result (adopte/rejete), pagination (30/page).

**Display**: Scrutin number, date, `ScrutinResultBadge`, title, vote counts.

---

### `/gouvernance/scrutins/[id]` — Vote Detail

**File**: [page.tsx](../src/app/gouvernance/scrutins/[id]/page.tsx)

**Data**: Scrutin with groupeVotes (with organe) + all voteRecords (with depute subset).

**Sections**:
1. Title + `ScrutinResultBadge` + demandeur
2. Summary — 5 stat boxes (Votants, Pour, Contre, Abstentions, Non-votants)
3. Group breakdown — horizontal stacked bars per group (teal=pour, rose=contre, amber=abstention, grey=non-votant)
4. Individual votes — 4 columns by position with deputy name links

---

### `/economie` — Economic Indicators

**File**: [page.tsx](../src/app/economie/page.tsx)

**Data**: All indicateurs with observations ordered by periodeDebut asc.

**Layout**: Card per indicator — name, source, frequency, latest value, inline SVG line chart (MiniChart function), description.

**Charts**: SVG polyline + gradient fill. Colors: amber (GDP), rose (unemployment), teal (enterprises).

---

### `/territoire` — Territory Overview

**File**: [page.tsx](../src/app/territoire/page.tsx)

**Data**: Regions with departments, each with counts (communes COM, deputes, senateurs, musees, monuments).

**Layout**: Regions as sections, department cards with count badges.

---

### `/territoire/[departementCode]` — Department Detail

**File**: [page.tsx](../src/app/territoire/[departementCode]/page.tsx)

**Data**: Department + region, deputes, senateurs, musees (20), monuments (20), counts.

**Layout**: 5-stat bar + 2x2 grid (deputies, senators, museums, monuments with links).

---

### `/patrimoine` — Heritage Overview

**File**: [page.tsx](../src/app/patrimoine/page.tsx)

**Data**: Museum/monument counts, top 10 museums by attendance, top 8 monument domains.

**Layout**: 2 section cards + top 10 ranking (animated bar-fill) + domains grid.

---

### `/patrimoine/musees` — Museums List

**File**: [page.tsx](../src/app/patrimoine/musees/page.tsx)

Search by name/ville, 30/page. Shows name, ville, region, last attendance.

---

### `/patrimoine/musees/[id]` — Museum Detail

**File**: [page.tsx](../src/app/patrimoine/musees/[id]/page.tsx)

**Data**: Museum with frequentations, departement, commune.

**Layout**: 3 info cards + SVG bar chart (52px per year, hover opacity) + table (Total, Payant, Gratuit, Scolaires, <18, 18-25).

---

### `/patrimoine/monuments` — Monuments List

**File**: [page.tsx](../src/app/patrimoine/monuments/page.tsx)

Search + protectionType filter (top 6 types), 30/page. Shows name, commune, dept, region, type badge, siecle.

---

### `/patrimoine/monuments/[id]` — Monument Detail

**File**: [page.tsx](../src/app/patrimoine/monuments/[id]/page.tsx)

**Data**: Monument with departement + commune.

**Layout**: Status badges + 3-col info panel + OpenStreetMap link (if coordinates) + description + historique (whitespace-pre-line).

---

## Components (12)

### `PageHeader` — Server Component

**File**: [page-header.tsx](../src/components/page-header.tsx)

```typescript
{ title: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[] }
```

Breadcrumbs nav (teal hover links) + display-font title + optional subtitle. `border-b border-bureau-700/30 bg-bureau-900/50`.

---

### `SearchInput` — Client Component

**File**: [search-input.tsx](../src/components/search-input.tsx)

```typescript
{ placeholder?: string; paramName?: string }  // defaults: "Rechercher...", "q"
```

Reads `useSearchParams`, pushes `?q=...` via `useRouter` on change, resets `page` param. Shows animated border-t-teal spinner via `useTransition`. Magnifying glass SVG icon. `.search-glow` focus effect.

---

### `Pagination` — Server Component

**File**: [pagination.tsx](../src/components/pagination.tsx)

```typescript
{ currentPage: number; totalPages: number; baseUrl: string; searchParams?: Record<string, string> }
```

Prev/next arrows + page numbers with ellipsis (shows +/-2 around current, first, last). Preserves other URL params. Returns null if `totalPages <= 1`. Current page highlighted `bg-teal/10 text-teal`.

---

### `ProfileHero` — Server Component

**File**: [profile-hero.tsx](../src/components/profile-hero.tsx)

```typescript
{
  avatar: { src?: string | null; initials: string }
  name: string; subtitle: string
  status: { active: boolean; label: string }
  breadcrumbs: { label: string; href?: string }[]
  badge?: string                    // Group abbreviation pill (teal)
  scores?: { value: number | null; label: string; color: "teal" | "amber" | "blue" | "rose" }[]
  contact?: { email?: string | null; twitter?: string | null; website?: string | null }
  children?: React.ReactNode        // Tab bar slot
}
```

Full-width hero banner shared by deputy and senator profiles. `bg-bureau-900/60 border-b`. Contains: breadcrumbs, 96px `Avatar` (lg) with teal ring, Instrument Serif `text-3xl` name, group badge pill, status dot (teal glow if active), horizontal contact pills with SVG icons, optional `ScoreGauge` row, and children slot for tab bar. Responsive: `flex-col` on mobile, `sm:flex-row` on desktop.

---

### `ProfileTabs` — Client Component

**File**: [profile-tabs.tsx](../src/components/profile-tabs.tsx)

```typescript
{ tabs: { key: string; label: string; count?: number }[]; defaultTab: string }
```

URL-driven tab navigation. Reads `?tab=` from `useSearchParams`, pushes new value via `useRouter`. Active tab: `text-teal` with `h-0.5 bg-teal` bottom indicator. Inactive: `text-bureau-500 hover:text-bureau-300`. Horizontal scroll on mobile with `.scrollbar-hide`. Wrapped in `<Suspense>` when used.

---

### `ScoreGauge` — Server Component

**File**: [score-gauge.tsx](../src/components/score-gauge.tsx)

```typescript
{ value: number | null; label: string; color?: "teal" | "amber" | "blue" | "rose" }
```

Compact stat box for profile hero. Bold `text-2xl` colored value + `text-[10px]` uppercase label below. Returns null if value is null. Used in a horizontal row with `divide-x` separators inside `ProfileHero`.

---

### `Avatar` — Client Component

**File**: [avatar.tsx](../src/components/avatar.tsx)

```typescript
{ src?: string | null; initials: string; size?: "sm" | "md" | "lg" }
```

`<img>` with `onError` fallback to dark circle with text initials. sm = h-9 w-9, md = h-14 w-14, lg = h-24 w-24 with `ring-2 ring-teal/30 ring-offset-2 ring-offset-bureau-950`. `rounded-full object-cover`.

---

### `ScoreBar` — Server Component

**File**: [score-bar.tsx](../src/components/score-bar.tsx)

```typescript
{ value: number | null; label: string; color?: "teal" | "amber" | "blue" | "rose" }
```

Horizontal bar clamped to 0-100%. Label + `value.toFixed(1)` above bar. Returns null if value is null. `.bar-fill` animation.

---

### `VoteBadge` — Server Component

**File**: [vote-badge.tsx](../src/components/vote-badge.tsx)

```typescript
{ position: string }
```

Color-coded pill: Pour (teal), Contre (rose), Abstention (amber), Non-votant (grey). Maps raw position strings to French labels.

---

### `ScrutinResultBadge` — Server Component

**File**: [scrutin-result-badge.tsx](../src/components/scrutin-result-badge.tsx)

```typescript
{ sortCode: string }
```

"Adopte" (teal) or "Rejete" (rose) based on `sortCode.toLowerCase().includes("adopt")`.

---

### `StatCard` + `StatRow` — Server Component

**File**: [stat-card.tsx](../src/components/stat-card.tsx)

```typescript
StatCard: { value: number; label: string; accent?: "teal" | "amber" | "rose" | "blue"; delay?: number }
StatRow: { children: React.ReactNode }  // grid-cols-2 sm:grid-cols-4
```

Large bold `fmt(value)` + uppercase label. Colored border + text per accent. `.fade-up` with delay. `.glow-teal`/`.glow-amber` effects.

---

### `DeclarationSection` — Client Component

**File**: [declaration-section.tsx](../src/components/declaration-section.tsx)

```typescript
{ declarations: Declaration[] }
// Declaration: { id, typeDeclaration, dateDepot, organe, qualiteDeclarant,
//   totalParticipations, totalRevenus, participations[], revenus[] }
```

Renders nothing if no declarations. Each declaration is an expandable `DeclarationCard`. Designed to distill verbose HATVP PDFs (often 5–9 pages of "0 € Net") into a scannable, intelligence-focused layout.

**Collapsed state**: Type badge (DI/DIA/DIM color-coded) + title + date + metadata (qualite, organe) + quick summary line ("3 rémunérations · 25 bénévoles") + total revenue (teal) + chevron.

**Expanded state**:
1. **Revenue summary stat boxes** (`RevenueSummary`) — Horizontal boxes showing latest-year totals per category (Total Déclaré, Mandats Électifs, Activités Professionnelles, etc.). Only categories with revenue > 0 are shown.
2. **Paid activity cards** (`ActivityCard`) — Per revenue type (ordered: mandats > professionnel > consultant > dirigeant). Each card has a colored left border by type (teal=mandats, blue=professional, purple=consulting, amber=board). Shows employer/org name, role, year range, latest amount. Multi-year data displayed as a **mini vertical bar chart** (`MiniChart`) — CSS-only bars proportional to max amount, with 2-digit year labels and hover tooltips.
3. **Unpaid positions list** (`UnpaidPositions`) — All-zero board positions collapsed into a compact dense list with count badge. Shows "Org · Role · Period" per line. Initially shows 5 items with "+ N autres positions" toggle. Replaces pages of "0 € Net" from HATVP PDFs.
4. **Financial participations** — Company name + shares/capital detail + evaluation (amber) + remuneration. Only shown when participations exist.

**Smart filtering**: Empty categories (consultant: Néant, participations: none) are not rendered at all. Revenue types with all-zero amounts only appear in the compact unpaid list.

**Sub-components** (internal to file):
- `MiniChart` — Pure CSS vertical bar chart. Bars flex-1 with max-w-5, height as percentage of max. Hover changes opacity. Year labels as 2-digit text below.
- `ActivityCard` — Colored left-border card. For dirigeant type: shows org as main label, role as sub. For others: description as main, employer as sub.
- `UnpaidPositions` — Collapsible list with dot bullets, truncated names, and year ranges right-aligned. 5-item initial limit with expand toggle.
- `RevenueSummary` — Stat boxes: grand total (bureau-100, xl font) + per-type breakdowns (colored text + dot).
- `DeclarationCard` — Accordion container with smart header summary.

---

## Formatting Utilities

**File**: [format.ts](../src/lib/format.ts)

| Function | Input | Output | Example |
|----------|-------|--------|---------|
| `fmt` | `number \| null` | French-formatted number | `1 234 567` |
| `fmtEuro` | `number \| null` | Currency (EUR, no decimals) | `50 000 EUR` |
| `fmtPct` | `number \| null` | Percentage (1 decimal) | `45,3 %` |
| `fmtDate` | `Date \| string \| null` | Full French date | `6 fevrier 2025` |
| `fmtShortDate` | `Date \| string \| null` | Short date | `fevr. 2025` |
| `fmtCompact` | `number` | Compact notation | `1,5M` / `45k` |
| `slugify` | `string` | URL-safe slug | `saint-denis` |

All return `"—"` for null/undefined (except `slugify` and `fmtCompact`).

---

## Database Client

**File**: [db.ts](../src/lib/db.ts)

- Uses `@prisma/adapter-pg` with `pg.Pool`
- Connection: `DATABASE_URL` env or `postgresql://aydenmomika@localhost:5432/datagouv`
- Global singleton in dev (hot-reload safe), single instance in prod
- Exported as `prisma` for server components

---

## Key Patterns

### Server Components + Prisma

All pages are async Server Components. Prisma queries run directly — no API routes, no client-side fetching.

```tsx
export default async function Page() {
  const data = await prisma.model.findMany({ ... });
  return <div>{/* render data */}</div>;
}
```

### Search with URL Params

`SearchInput` pushes `?q=...` to URL. Server components read via `searchParams` prop (Promise in Next.js 16):

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const { q, page } = await searchParams;
  const where = q ? { nom: { contains: q, mode: "insensitive" } } : {};
}
```

### Pagination

30 items per page. `skip` / `take` with Prisma. URL `?page=N` param preserved by `Pagination` component alongside other search params.

### Filter Chips

Group/type filters rendered as button links. Active filter highlighted with `bg-teal/10 text-teal`. Counts shown inline.

### Suspense Boundaries

Client components wrapped in `<Suspense>` with fallback divs:

```tsx
<Suspense fallback={<div className="animate-pulse text-bureau-600">Chargement...</div>}>
  <SearchInput />
</Suspense>
```

### SVG Charts (no library)

Economy page: inline `MiniChart` function — SVG polyline with gradient fill.
Museum detail: SVG bar chart (52px per year, scaled to max).
No external chart library dependency.

---

## Responsive Design

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | Mobile-first | Single column, px-6 padding |
| `sm` (640px) | Tablet | 2-column grids, side-by-side stats |
| `lg` (1024px) | Desktop | 3-4 column grids, sidebar layouts |

List pages: `max-w-7xl px-6`. Profile detail pages: `max-w-4xl px-6` (focused editorial width).

---

## Build Output

```
Route (app)                                Type
┌ ○ /                                      Static
├ ○ /gouvernance                           Static
├ ƒ /gouvernance/deputes                   Dynamic
├ ƒ /gouvernance/deputes/[id]              Dynamic
├ ƒ /gouvernance/lobbyistes                Dynamic
├ ƒ /gouvernance/lobbyistes/[id]           Dynamic
├ ƒ /gouvernance/scrutins                  Dynamic
├ ƒ /gouvernance/scrutins/[id]             Dynamic
├ ƒ /gouvernance/senateurs                 Dynamic
├ ƒ /gouvernance/senateurs/[id]            Dynamic
├ ○ /economie                              Static
├ ○ /patrimoine                            Static
├ ƒ /patrimoine/monuments                  Dynamic
├ ƒ /patrimoine/monuments/[id]             Dynamic
├ ƒ /patrimoine/musees                     Dynamic
├ ƒ /patrimoine/musees/[id]                Dynamic
├ ○ /territoire                            Static
└ ƒ /territoire/[departementCode]          Dynamic
```

5 static (prerendered) + 13 dynamic (server-rendered on demand) = 18 routes + `/_not-found`.

---

## File Structure

```
src/
├── app/
│   ├── globals.css              # Theme colors, effects, animations
│   ├── layout.tsx               # Root: fonts, navbar (5 items), footer
│   ├── page.tsx                 # Dashboard homepage
│   ├── gouvernance/
│   │   ├── page.tsx             # Hub (4 cards)
│   │   ├── deputes/
│   │   │   ├── page.tsx         # List + group/dept filters
│   │   │   └── [id]/page.tsx    # Hero profile + tabs (activite/declarations/infos)
│   │   ├── senateurs/
│   │   │   ├── page.tsx         # List
│   │   │   └── [id]/page.tsx    # Hero profile + tabs (mandats/declarations/infos)
│   │   ├── lobbyistes/
│   │   │   ├── page.tsx         # Registry list
│   │   │   └── [id]/page.tsx    # Detail + actions
│   │   └── scrutins/
│   │       ├── page.tsx         # Vote list + result filter
│   │       └── [id]/page.tsx    # Group bars + individual votes
│   ├── economie/
│   │   └── page.tsx             # SVG charts dashboard
│   ├── territoire/
│   │   ├── page.tsx             # Region/dept browser
│   │   └── [departementCode]/page.tsx  # Cross-reference
│   └── patrimoine/
│       ├── page.tsx             # Hub: top museums + domains
│       ├── musees/
│       │   ├── page.tsx         # List + search
│       │   └── [id]/page.tsx    # Detail + attendance chart + table
│       └── monuments/
│           ├── page.tsx         # List + type filters
│           └── [id]/page.tsx    # Detail + GPS link + description
├── components/
│   ├── avatar.tsx               # Client: img with fallback initials (sm/md/lg)
│   ├── declaration-section.tsx  # Client: expandable declaration cards
│   ├── page-header.tsx          # Server: breadcrumbs + title (list pages)
│   ├── pagination.tsx           # Server: page numbers with ellipsis
│   ├── profile-hero.tsx         # Server: full-width hero banner (profile pages)
│   ├── profile-tabs.tsx         # Client: URL-driven tab navigation (profile pages)
│   ├── score-bar.tsx            # Server: animated horizontal bar (list pages)
│   ├── score-gauge.tsx          # Server: compact stat box (profile hero)
│   ├── scrutin-result-badge.tsx # Server: Adopte/Rejete badge
│   ├── search-input.tsx         # Client: URL-based search with spinner
│   ├── stat-card.tsx            # Server: number + label card
│   └── vote-badge.tsx           # Server: Pour/Contre/Abstention/Non-votant
└── lib/
    ├── db.ts                    # Prisma client (pg adapter, singleton)
    └── format.ts                # French number/date formatting (7 functions)
```
