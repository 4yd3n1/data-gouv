# Frontend Implementation

> Last updated: Mar 4, 2026 — Session 26. 59 routes + 5 OG image routes, 31 components.

Complete reference for all UI pages, components, styling, and patterns.

---

## Architecture

- **Next.js 16** App Router — all pages are React Server Components by default
- **Tailwind CSS 4** with custom theme tokens defined in `globals.css`
- **No client-side data fetching** — every page queries Prisma directly at render time
- **9 client components**: `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`, `SearchBox`, `FranceMap`, `DeltaBadge` (all use `"use client"`)
- **1 shared lib**: `nuance-colors.ts` — political party color mapping used by elections pages
- **French localization** throughout: `<html lang="fr">`, `fr-FR` locale for numbers/dates
- **ISR** (`export const revalidate = N`): homepage + votes = 3600s; dossiers + representants hub + economie + patrimoine + territoire hub = 86400s; profiles = dynamic (no revalidate)
- **generateMetadata**: all 9 key dynamic routes export `generateMetadata` for SEO

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

- **Navbar**: Sticky top, backdrop-blur, SVG logo + "L'Observatoire" brand + **`NavSearch`** (always-visible search form — `flex`, not `hidden md:flex`) + **7 nav links** (Accueil, Dossiers, Représentants, Votes, Économie, Territoire, Patrimoine)
- **Main**: `flex-1` content area
- **Footer**: Data source attribution ("data.gouv.fr, INSEE, Senat, HATVP") + "L'Observatoire Citoyen 2025"
- **Container**: `max-w-7xl px-6` on list pages; `max-w-4xl px-6` on profile detail pages (focused editorial width)

**Metadata**: `"L'Observatoire Citoyen — Intelligence civique française"`

---

## Route Map (59 routes + 5 OG image routes)

### Static (prerendered at build time)
| Route | Purpose |
|-------|---------|
| `/` | Homepage — dynamic headline, dossier cards, recent votes, conflict alerts, dept lookup, postal code CTA |
| `/dossiers` | Dossier hub — 8 issue cards |
| `/representants` | Représentants hub — 6 section cards with counts + president card |
| `/elections` | Hub — Législatives 2024 card + national summary stats |
| `/economie` | Dashboard — SVG MiniChart per indicator (15+ series) |
| `/territoire` | Browser — regions with department cards + `FranceMap` (Phase 8A/8B, 6 indicators, dept click → `/territoire/[code]`) |
| `/gouvernement` | Government index — members grouped by type (President → PM → Ministres → Délégués → Secrétaires), avatar grid, links to profiles (Phase 9A) |
| `/patrimoine` | Hub — top 10 museums + monument domains |
| `/votes` | Votes hub — 13 topic grid + recent scrutins |
| `/votes/alignements` | Alignment matrix — N×N group co-vote heatmap, top 5 allies/opponents per group (ISR 86400) |
| `/president` | Macron profile — 4 tabs: Promesses (20 curated), Bilan Économique, Lobbying & Agenda, Déclarations HATVP |

### Dossiers (8 dynamic pages)
| Route | Topic |
|-------|-------|
| `/dossiers/pouvoir-dachat` | Purchasing power — `FranceMap` (rev/income), inflation, votes, lobbying (Phase 8B) |
| `/dossiers/confiance-democratique` | Democratic trust — declarations, party money, 49.3 |
| `/dossiers/dette-publique` | Public debt — `FranceMap` (det/debt), budget votes, local debt (Phase 8B) |
| `/dossiers/emploi-jeunesse` | Employment & youth — `FranceMap` (cho/unemployment), education stats EDUC_NO_DIPLOMA + EDUC_BAC_PLUS + EDUC_HIGHER_EDUC (Phase 8B/8C) |
| `/dossiers/logement` | Housing — permits, vacancy, votes, lobbying |
| `/dossiers/sante` | Healthcare — `FranceMap` (med/GP density), PLFSS votes (Phase 8B) |
| `/dossiers/transition-ecologique` | Ecology — votes, lobbying, declared energy interests |
| `/dossiers/retraites` | Pensions — 49.3 votes, group positions, individual votes |

### Représentants (canonical people section)
| Route | Key Features |
|-------|-------------|
| `/representants/deputes` | Search, groupe filter, dept filter, pagination |
| `/representants/deputes/[id]` | Hero profile + tabs (Activité / Déclarations / **Transparence** / Informations) |
| `/representants/senateurs` | Search, pagination |
| `/representants/senateurs/[id]` | Hero profile + tabs (Mandats & Commissions / Déclarations / Informations) |
| `/representants/elus` | Local officials list — 593K rows, paginated |
| `/representants/elus/maires` | Mayors subset |
| `/representants/lobbyistes` | Search, pagination |
| `/representants/lobbyistes/[id]` | Info panel, actions list |
| `/representants/scrutins` | Search, result filter, pagination |
| `/representants/scrutins/[id]` | Result summary, group bars, individual votes |
| `/representants/partis` | Year selector, sort options, aggregate stats |
| `/representants/partis/[id]` | Revenue/expense breakdown bars, multi-year table |

### Gouvernement (Phase 9)
| Route | Key Features |
|-------|-------------|
| `/gouvernement` | Index grid — all current members sorted by protocol `rang`, grouped by `TypeMandat` (ISR 3600) |
| `/gouvernement/[slug]` | Profile page — `ProfileHero` + `ProfileTabs` (3 tabs: Intérêts déclarés / Mandats / Parcours). Sections: `InteretsSection` (HATVP, progressive disclosure per rubrique, `<details>` expander), `MandatsSection` (timeline), `LobbySection`, `JudiciaireSection`, `CareerSection`. Conflict alert banner when `alerteConflit` entries exist. (Phase 9A + 9E) |

### Gouvernance (legacy — HTTP 308 redirects to /representants)
`/gouvernance/*` routes remain active (still served; linked from older bookmarks and deputy profiles). Redirects configured in `next.config.ts`.

### Votes (dedicated votes section)
| Route | Key Features |
|-------|-------------|
| `/votes` | Tag grid (13 topics), stats, recent scrutins |
| `/votes/par-sujet/[tag]` | Tag-filtered scrutins, pagination, vote bars, related tags |
| `/votes/mon-depute` | 3-state deputy lookup: empty → list → detail with tag breakdown |
| `/votes/alignements` | N×N group alignment heatmap. Backed by `src/lib/alignment.ts` (`computeAlignment()`). Top 5 allies (teal) and opponents (rose) per group. ISR 86400. |

### Comparaisons (Phase 7D)
| Route | Key Features |
|-------|-------------|
| `/comparer/territoires` | 3-state dept comparison. State 1: two code inputs + suggestions. State 2 (`?a=XX`): dept A shown + B form. State 3 (`?a=XX&b=YY`): full comparison — `MetricRow` layout, `DeltaBadge` on winning side. |
| `/comparer/deputes` | 4-state deputy comparison. State 1: name search `?qa=`. State 2 (`?a=PA*`): A shown + B search. State 3 (`?a=PA*&b=PA*`): comparison with scores, tag bars, transparence, shared scrutins (accord/désaccord). Deputy B values in amber. |

### Mon Territoire
| Route | Key Features |
|-------|-------------|
| `/mon-territoire` | 3-state civic dashboard: empty prompt (postal input) → disambiguation picker → full dashboard (représentants, économie, budget, santé & sécurité, votes, patrimoine, explorer plus). Mini `FranceMap` highlights selected dept (Phase 8B). |

### Recherche (Session 15/18 — 7B)
| Route | Key Features |
|-------|-------------|
| `/recherche` | Full-text search across 800K+ rows — entity type pills (Tous / Députés / Sénateurs / Lobbyistes / Scrutins / Communes / Partis), color-coded result cards. URL-driven: `?q=` + `?type=`. Backed by `search_index` materialized view (GIN, `french` stemming). Static injection: "Emmanuel Macron → /president" for queries matching `macron`/`president`/`elysee`/`manu`. |

### Territory & Economy
| Route | Key Features |
|-------|-------------|
| `/territoire/[departementCode]` | Full département dashboard: demographics, economy, budget, representatives, culture, security/health. Mini `FranceMap` in hero (highlights selected dept). Has "Comparer →" link in breadcrumb. Education stats (EDUC_NO_DIPLOMA, EDUC_BAC_PLUS, EDUC_HIGHER_EDUC) in Éducation section (Phase 8B/8C). |
| `/territoire/commune/[communeCode]` | Commune card: elu list, budget, patrimoine |
| `/elections/legislatives-2024` | Tour switcher, dept filter, nuance bars, candidate list |
| `/patrimoine/musees` | Search, pagination |
| `/patrimoine/musees/[id]` | SVG bar chart, attendance table |
| `/patrimoine/monuments` | Search, protection type filter, pagination |
| `/patrimoine/monuments/[id]` | Info panel, GPS link, description/historique |

### OG Image Routes (Phase 7E + Session 18/19 fixes)
Next.js `opengraph-image.tsx` files — `runtime = "nodejs"`, 1200×630, inline styles only (no Tailwind).

| Route | Key Data |
|-------|----------|
| `/opengraph-image` | Homepage brand — platform name, tagline, 8 dossier chips, 3 stat cards (800K+ données, 57 dashboards, 8 dossiers). Static, no DB. |
| `/dossiers/logement/opengraph-image` | Logement dossier — queries live housing stats: avg vacancy rate + avg secondary rate (StatLocale) + vote count (ScrutinTag). |
| `/representants/deputes/[id]/opengraph-image` | Initials monogram + name + groupe + participation % + vote count + conflict count |
| `/territoire/[departementCode]/opengraph-image` | Dept + region name + 3 INSEE indicators (MEDIAN_INCOME, POVERTY_RATE, UNEMPLOYMENT_RATE) + counts (deputés, sénateurs, élus) |
| `/gouvernance/scrutins/[id]/opengraph-image` | Result badge (ADOPTÉ green / REJETÉ red) + truncated title + pour/contre bar + vote counts |

**Critical rule**: never use remote `<img src>` in satori/ImageResponse — network failures crash the route with `chrome-error://chromewebdata/`. Always use initials or inline SVG.

---

## Pages Detail

### `/` — Homepage

**File**: [page.tsx](../src/app/page.tsx) | `revalidate = 3600`

**Data**: Latest economic indicator value (dynamic headline), 8 dossier configs, 6 recent scrutins with group votes, 6 high-declaration officials (conflict alerts), all entity counts for the grid.

**Sections**:
1. **Hero** — `.grid-bg` pattern, Instrument Serif headline from latest data (e.g. "La dette publique atteint 115,6% du PIB"), 4 hero stat tiles
2. **Dossiers Thématiques** — 8 issue cards with key stats, each linking to `/dossiers/[slug]`
3. **Derniers Scrutins** — 6 most recent parliamentary votes with result badge + group breakdown
4. **Alertes Transparence** — Officials with highest financial participations (amber alert cards)
5. **Votre Territoire** — `DeptLookup` client component → département dashboard redirect
6. **Vue d'ensemble** — 13-stat grid (all entity counts)

---

### `/dossiers` — Dossier Hub

**File**: [page.tsx](../src/app/dossiers/page.tsx) | `revalidate = 86400`

8 issue cards from `dossier-config.ts`, each with label, description, stat, and link. `DossierNav` sidebar.

---

### `/dossiers/[slug]` — Dossier Pages

All 8 follow the same layout pattern:

**Components**: `DossierHero` + `DossierNav` + `IndicatorCard` row + `TopicVoteList` + `LobbyingDensity` + `ConflictAlert` (where applicable) + `RankingTable` (where applicable) + `DeptMap` (where applicable)

**Data patterns by dossier**:

| Dossier | Key Data Queries |
|---------|----------------|
| `pouvoir-dachat` | Indicateurs (pib/emploi/prix/salaires), StatLocale MEDIAN_INCOME by dept, Scrutins tagged budget/fiscalite, ActionLobbyiste fiscal/économi |
| `confiance-democratique` | DeclarationInteret counts, Lobbyiste/ActionLobbyiste aggregates, PartiPolitique aide vs dons, Scrutin motions de censure |
| `dette-publique` | Indicateurs (finances domain), Scrutins tagged budget, BudgetLocal aggregates |
| `emploi-jeunesse` | Indicateurs (emploi domain), StatLocale EMPLOYMENT_RATE/UNEMPLOYMENT_RATE by dept, Scrutins travail/education |
| `logement` | Indicateurs (construction domain), StatLocale housing vacancy, Scrutins logement, ActionLobbyiste immobili |
| `sante` | DensiteMedicale by dept (GP density), Scrutins sante, ActionLobbyiste santé/pharma, `DeptMap` |
| `transition-ecologique` | Scrutins ecologie, ActionLobbyiste énergi/environnement, DeclarationInteret energy sector |
| `retraites` | Scrutins retraites (especially 49.3), GroupeVote breakdown, VoteRecord per-deputy on censure motions |

---

### `/representants/deputes/[id]` — Deputy Detail (Enhanced)

**File**: [page.tsx](../src/app/representants/deputes/[id]/page.tsx)

**Tabs**: Activité / Déclarations / **Transparence** / Informations

**Transparence tab** (new in Phase 3):
- `ConflictAlert`: declared participations financières cross-referenced against votes on matching ScrutinTag domains
- Tag breakdown: bar chart of deputy's vote positions per policy domain (% pour/contre/abstention)
- Déports list with scrutin links
- "A voté sur N textes liés à ses intérêts déclarés"

---

### `/votes` — Votes Hub

**File**: [page.tsx](../src/app/votes/page.tsx) | `revalidate = 3600`

**Data**: ScrutinTag counts per tag (13 topics), total scrutin count, 10 recent scrutins.

**Sections**:
1. Tag grid — 13 topic pills with vote counts, each linking to `/votes/par-sujet/[tag]`
2. Stats row — total votes, total tagged, date range
3. Recent scrutins — last 10 with result badge, title, date

---

### `/votes/par-sujet/[tag]` — Votes by Topic

**File**: [page.tsx](../src/app/votes/par-sujet/[tag]/page.tsx)

**Data**: Scrutins filtered by ScrutinTag, paginated (20/page). Related tags from overlapping ScrutinTag records.

**Layout**: `PageHeader` (tag label + count) + recent related tags pills + scrutin list with group vote bars + `Pagination`.

**Note**: `VALID_TAGS` array hardcoded — returns 404 for unknown tags.

---

### `/votes/mon-depute` — Deputy Voting Lookup

**File**: [page.tsx](../src/app/votes/mon-depute/page.tsx) | `revalidate = 3600`

**URL params**: `?q=` for name search, `?id=` for selected deputy.

**3-state rendering**:
1. **Empty** (no params) — prompt to search
2. **List** (`?q=`) — deputies matching name, each with link that sets `?id=`
3. **Detail** (`?id=`) — tag breakdown bar chart + position stats (% pour/contre/abstention) + 20 recent votes

---

### `/mon-territoire` — Civic Dashboard by Postal Code (Session 14)

**File**: [page.tsx](../src/app/mon-territoire/page.tsx)

**URL params**: `?cp=XXXXX` (postal code), `?code=INSEE_CODE` (direct commune code).

**Data infra**: `src/data/postal-codes.json` (6,328 postal codes → INSEE lists, La Poste Hexasmal) + `src/lib/postal-resolver.ts` (ARM→COM parent resolution).

**3-state rendering**:
1. **Empty** (no params) — `SearchInput paramName="cp"` + example postal codes (Paris, Lyon, Marseille, Bordeaux, Lille, Strasbourg) + link to `/territoire` browser
2. **Resolve** (`?cp=` only) — 0 results: error state; 1 result: render dashboard directly; N results: disambiguation list with commune name, département, "Choisir" links
3. **Dashboard** (`?code=` present, or single resolution) — 13-query `Promise.all`:
   - `prisma.commune.findUnique` + `prisma.departement.findUnique`
   - `prisma.depute.findMany` (actif, by dept, take 6)
   - `prisma.senateur.findMany` (actif, by dept, take 4)
   - `prisma.elu.findFirst` (maire of commune)
   - `prisma.elu.count` (all commune elus)
   - `prisma.statLocale.findMany` (by dept)
   - `prisma.budgetLocal.findFirst` (by commune, fallback to dept)
   - `prisma.densiteMedicale.findFirst` (`specialite: "MG"`, by dept)
   - `prisma.statCriminalite.findMany` (by dept, take 20)
   - `prisma.voteRecord.findMany` (by dept's deputies, take 8, with scrutin + tags + depute)
   - `prisma.musee.findMany` (by dept, take 3)
   - `prisma.monument.count` (by dept)

**Dashboard sections**: Mes Représentants · Économie locale · Budget local · Santé & Sécurité · Comment votent mes députés · Patrimoine local · Explorer plus

**generateMetadata**: when `?code=` present, queries commune + dept and returns `{ title: "${commune} (${deptCode}) — Mon Territoire · L'Observatoire Citoyen" }`.

---

### `/territoire/[departementCode]` — Département Dashboard (Phase 3 rewrite)

**File**: [page.tsx](../src/app/territoire/[departementCode]/page.tsx)

**Data** (all parallel): dept + region, communes count, deputes, senateurs, elu count, StatLocale (all indicators for this dept), BudgetLocal (latest year), musees/monuments counts, recent VoteRecords by dept's deputies, DensiteMedicale, StatCriminalite.

**Sections**:
1. **Header** — dept name + region, commune/elu counts
2. **Démographie** — `IndicatorCard` row: POP_TOTAL, POP_65PLUS, POP_0019, SVG trend
3. **Économie locale** — median income, poverty rate, employment rate, unemployment rate
4. **Représentants** — deputies list with vote participation, senators list, elu count
5. **Votes récents** — last 10 votes by this dept's deputies
6. **Budget** — BudgetLocal: recettes/dépenses/dette per habitant (if populated)
7. **Santé & Sécurité** — GP density (DensiteMedicale) + top crime categories (StatCriminalite)
8. **Patrimoine** — museum + monument counts with links

---

### `/territoire/commune/[communeCode]` — Commune Card (Phase 3 new)

**File**: [page.tsx](../src/app/territoire/commune/[communeCode]/page.tsx)

**Data**: Commune + département + elu list (paginated) + BudgetLocal (latest) + musees/monuments counts.

**Sections**: Commune header + budget KPIs + elu list + patrimoine links.

---

### All other pages (unchanged from v1)

- `/economie` — `revalidate = 86400`, SVG MiniChart per indicator (now 15+ series)
- `/representants/scrutins` + `/[id]` — group bars, individual votes (same as legacy `/gouvernance/scrutins`)
- `/representants/lobbyistes` + `/[id]` — info panel, actions
- `/representants/partis` + `/[id]` — year selector, revenue/expense bars
- `/elections/legislatives-2024` — tour switcher, nuance bars
- `/patrimoine/musees` + `/[id]` — SVG attendance chart
- `/patrimoine/monuments` + `/[id]` — GPS link, description

---

## Components (22)

### New in Phase 2–4

#### `DossierHero` — Server Component

**File**: [dossier-hero.tsx](../src/components/dossier-hero.tsx)

```typescript
{ slug: string; label: string; description: string; stat?: string; statSource?: string }
```

Full-width hero banner for dossier pages. `.grid-bg` pattern, Instrument Serif heading, framing stat with source attribution. `bg-bureau-900/60 border-b`.

---

#### `DossierNav` — Server Component

**File**: [dossier-nav.tsx](../src/components/dossier-nav.tsx)

```typescript
{ current: string }  // current dossier slug
```

Horizontal pill navigation between the 8 dossiers. Active dossier highlighted `bg-teal/10 text-teal`. Reads slug list from `dossier-config.ts`.

---

#### `IndicatorCard` — Server Component

**File**: [indicator-card.tsx](../src/components/indicator-card.tsx)

```typescript
{ label: string; value: string | number; unit?: string; trend?: "up" | "down" | "flat"; color?: "teal" | "amber" | "rose" | "blue"; sublabel?: string }
```

KPI tile with trend arrow (↑↓→), colored value, unit, and optional sublabel. Used in dossier pages and département dashboard.

---

#### `TopicVoteList` — Server Component

**File**: [topic-vote-list.tsx](../src/components/topic-vote-list.tsx)

```typescript
{ scrutins: ScrutinWithTags[]; title?: string; limit?: number }
```

Scrutin list filtered by topic — each row shows title, date, `ScrutinResultBadge`, and horizontal group vote bars (teal=pour, rose=contre, amber=abstention). Links to `/representants/scrutins/[id]`.

---

#### `LobbyingDensity` — Server Component

**File**: [lobbying-density.tsx](../src/components/lobbying-density.tsx)

```typescript
{ actions: ActionWithLobbyiste[]; domaine: string; title?: string }
```

Summary of lobbying actions in a given domain. Shows top organizations ranked by action count, total action count, and "X organisations · Y actions déclarées" summary line.

---

#### `ConflictAlert` — Server Component

**File**: [conflict-alert.tsx](../src/components/conflict-alert.tsx)

```typescript
{ conflicts: { sectorLabel: string; voteCount: number; participationValue?: number }[]; deputeName?: string }
```

Amber-accented alert card for cross-reference findings. Factual tone: "Participations financières déclarées dans le secteur [X]. A voté sur [N] textes liés à ce secteur." Returns null if no conflicts.

---

#### `RankingTable` — Server Component

**File**: [ranking-table.tsx](../src/components/ranking-table.tsx)

```typescript
{ rows: { code: string; libelle: string; value: number; rank: number }[]; unit: string; color?: string; linkBase?: string }
```

Sortable département ranking table. Each row shows rank number, dept name (linked to `/territoire/[code]` if `linkBase` provided), value with unit, and a thin proportional bar.

---

#### `DeptLookup` — Client Component

**File**: [dept-lookup.tsx](../src/components/dept-lookup.tsx)

```typescript
{ placeholder?: string }
```

Search input that accepts a département name, code, or postal code prefix. On submit, redirects to `/territoire/[code]`. Uses `useRouter`. Shows a dropdown of matching departments from a static list. `.search-glow` focus effect.

---

#### `DeptMap` — Server Component

**File**: [dept-map.tsx](../src/components/dept-map.tsx)

```typescript
{ data: { code: string; libelle: string; value: number }[]; color?: string; unit: string; limit?: number; linkBase?: string }
```

Ranked bar visualization for département data. Renders a vertical bar chart (not an SVG map) with all 101 departments sorted by value, colored by intensity. Used on dossier pages for geographic indicator distribution.

---

#### `NavSearch` — Client Component (Session 15/18 — 7B)

**File**: [nav-search.tsx](../src/components/nav-search.tsx)

```typescript
// No props — self-contained
```

Compact search input in the navbar. Always `flex` (not `hidden md:flex`). Uses `useRef` to read DOM value + `onKeyDown` on the input (Enter) + `type="button"` `onClick` on the magnifier icon — no `<form>` wrapper. Navigates to `/recherche?q=<value>` via `useRouter`. Min 2-char enforced. Styled: `w-44 border-bureau-700/50 bg-bureau-800/60 focus:border-teal-500/60`.

---

#### `SearchBox` — Client Component (Session 18 — 7B fix)

**File**: [search-box.tsx](../src/components/search-box.tsx)

```typescript
{ defaultValue?: string }
```

Full-width search input for the `/recherche` page. Same pattern as `NavSearch`: `useRef` + `onKeyDown` + `type="button"` `onClick`, no `<form>`. Accepts `defaultValue` for pre-filled queries. Used with `key={q}` on the parent to force remount when query changes (ensures `defaultValue` resets). Styled: `w-full rounded-xl py-2.5 pl-10 pr-4`.

---

#### `TimelineChart` — Server Component

**File**: [timeline-chart.tsx](../src/components/timeline-chart.tsx)

```typescript
{ data: { label: string; value: number }[]; color?: string; unit?: string; height?: number; showEvery?: number }
```

SVG polyline chart for time-series data. Gradient fill below line. `showEvery` controls x-axis label density. Server-rendered (no interactivity needed). Used on `/votes/mon-depute` and dossier pages.

---

#### `DeltaBadge` — Server Component (Phase 7D)

**File**: [delta-badge.tsx](../src/components/delta-badge.tsx)

```typescript
{ value: number | null; reference: number | null }
```

Shows a % difference between `value` and `reference`. Always teal (call only for the winning/better side). Returns null if either input is null or reference is 0. Used in `/comparer/territoires` `MetricRow` layout.

---

#### `FranceMap` — Client Component (Phase 8A)

**File**: [france-map.tsx](../src/components/france-map.tsx)

```typescript
{
  data: Record<string, DeptData>       // from getFranceMapData() in src/lib/france-map-data.ts
  defaultIndicator?: IndicatorKey      // "rev" | "cho" | "det" | "med" | "edu" | "pop"
  selectedCode?: string                // highlight a dept (mini mode)
  onSelect?: (code: string) => void    // click handler (overrides linkBase)
  linkBase?: string                    // e.g. "/territoire" → clicks go to /territoire/[code]
  size?: "full" | "mini"              // full = legend + pills; mini = compact highlight badge
  showRanking?: boolean               // bottom-5 ranking list
  showDetail?: boolean                // hover tooltip panel
  showPills?: boolean                 // indicator selector pills
}
```

Interactive SVG choropleth of French departments (96 metro + 5 overseas insets). Hex-lerp color scale across 7-stop palette (not CSS `color-mix`). Tooltip follows cursor via `getBoundingClientRect`. "Voir le tableau de bord" button always links to `/territoire/[code]`, decoupled from `linkBase`.

**Data files**:
- `src/data/france-geo.ts` — SVG paths from `@svg-maps/france.departments`, `viewBox 0 0 613 585`, `DEPT_PATHS`, `OVERSEAS_INSETS`
- `src/data/indicators.ts` — 6 `IndicatorConfig` objects, `INDICATORS[]`, `INDICATOR_MAP`, `DeptData`, `IndicatorKey`, `format: "euro"|"pct"|"compact"|"number"`
- `src/lib/france-map-data.ts` — `getFranceMapData()` server async function, 4 parallel Prisma queries, `distinct + orderBy: { annee: "desc" }` for latest year per dept

**Integrated on** (Phase 8B): `/territoire` (full, rev), `/dossiers/pouvoir-dachat` (full, rev), `/dossiers/sante` (full, med), `/dossiers/emploi-jeunesse` (full, cho), `/dossiers/dette-publique` (full, det), `/territoire/[dept]` (mini), `/mon-territoire` (mini).

---

### New in Phase 9 — Gouvernement Section Components

Five server components in `src/components/gouvernement/`. Each is a self-contained async server component — never inline section logic directly in `gouvernement/[slug]/page.tsx`.

| Component | File | Purpose |
|-----------|------|---------|
| `InteretsSection` | [gouvernement/interets-section.tsx](../src/components/gouvernement/interets-section.tsx) | HATVP declared interests grouped by `rubrique`, progressive disclosure (first 5 inline, rest in native `<details><summary>`), `InteretItem` sub-component, conflict alert per item |
| `MandatsSection` | [gouvernement/mandats-section.tsx](../src/components/gouvernement/mandats-section.tsx) | Timeline of government mandates (`border-l` vertical line, dot per mandate, active = teal dot) |
| `CareerSection` | [gouvernement/career-section.tsx](../src/components/gouvernement/career-section.tsx) | Career timeline placeholder (9D not yet ingested) |
| `LobbySection` | [gouvernement/lobby-section.tsx](../src/components/gouvernement/lobby-section.tsx) | `ActionLobby` count for current `ministereCode` (9C not yet ingested) |
| `JudiciaireSection` | [gouvernement/judiciaire-section.tsx](../src/components/gouvernement/judiciaire-section.tsx) | Verified judicial events only (`verifie = true`); renders `null` when count = 0 |

---

### Original Components (12, unchanged)

#### `PageHeader` — Server Component

**File**: [page-header.tsx](../src/components/page-header.tsx)

```typescript
{ title: string; subtitle?: string; breadcrumbs?: { label: string; href?: string }[] }
```

Breadcrumbs nav (teal hover links) + display-font title + optional subtitle. `border-b border-bureau-700/30 bg-bureau-900/50`.

---

#### `SearchInput` — Client Component

**File**: [search-input.tsx](../src/components/search-input.tsx)

```typescript
{ placeholder?: string; paramName?: string }  // defaults: "Rechercher...", "q"
```

Reads `useSearchParams`, pushes `?q=...` via `useRouter` on change, resets `page` param. Shows animated border-t-teal spinner via `useTransition`. Magnifying glass SVG icon. `.search-glow` focus effect.

---

#### `Pagination` — Server Component

**File**: [pagination.tsx](../src/components/pagination.tsx)

```typescript
{ currentPage: number; totalPages: number; baseUrl: string; searchParams?: Record<string, string> }
```

Prev/next arrows + page numbers with ellipsis (shows +/-2 around current, first, last). Preserves other URL params. Returns null if `totalPages <= 1`. Current page highlighted `bg-teal/10 text-teal`.

---

#### `ProfileHero` — Server Component

**File**: [profile-hero.tsx](../src/components/profile-hero.tsx)

```typescript
{
  avatar: { src?: string | null; initials: string }
  name: string; subtitle: string
  status: { active: boolean; label: string }
  breadcrumbs: { label: string; href?: string }[]
  badge?: string
  scores?: { value: number | null; label: string; color: "teal" | "amber" | "blue" | "rose" }[]
  contact?: { email?: string | null; twitter?: string | null; website?: string | null }
  children?: React.ReactNode
}
```

Full-width hero banner shared by deputy and senator profiles. Contains: breadcrumbs, 96px `Avatar` with teal ring, Instrument Serif name, group badge pill, status dot, contact pills, optional `ScoreGauge` row, children slot for tab bar.

---

#### `ProfileTabs` — Client Component

**File**: [profile-tabs.tsx](../src/components/profile-tabs.tsx)

```typescript
{ tabs: { key: string; label: string; count?: number }[]; defaultTab: string }
```

URL-driven tab navigation. Reads `?tab=` from `useSearchParams`, pushes new value via `useRouter`. Active tab: `text-teal` with `h-0.5 bg-teal` bottom indicator. Horizontal scroll on mobile with `.scrollbar-hide`. Wrapped in `<Suspense>` when used.

---

#### `ScoreGauge` — Server Component

**File**: [score-gauge.tsx](../src/components/score-gauge.tsx)

```typescript
{ value: number | null; label: string; color?: "teal" | "amber" | "blue" | "rose" }
```

Compact stat box for profile hero. Bold `text-2xl` colored value + `text-[10px]` uppercase label. Returns null if value is null.

---

#### `Avatar` — Client Component

**File**: [avatar.tsx](../src/components/avatar.tsx)

```typescript
{ src?: string | null; initials: string; size?: "sm" | "md" | "lg" }
```

`<img>` with `onError` fallback to dark circle with text initials. sm=h-9, md=h-14, lg=h-24 with teal ring. `rounded-full object-cover`.

---

#### `ScoreBar` — Server Component

**File**: [score-bar.tsx](../src/components/score-bar.tsx)

```typescript
{ value: number | null; label: string; color?: "teal" | "amber" | "blue" | "rose" }
```

Horizontal bar clamped to 0-100%. Label + `value.toFixed(1)` above bar. `.bar-fill` animation.

---

#### `VoteBadge` — Server Component

**File**: [vote-badge.tsx](../src/components/vote-badge.tsx)

```typescript
{ position: string }
```

Color-coded pill: Pour (teal), Contre (rose), Abstention (amber), Non-votant (grey).

---

#### `ScrutinResultBadge` — Server Component

**File**: [scrutin-result-badge.tsx](../src/components/scrutin-result-badge.tsx)

```typescript
{ sortCode: string }
```

"Adopté" (teal) or "Rejeté" (rose) based on `sortCode.toLowerCase().includes("adopt")`.

---

#### `StatCard` + `StatRow` — Server Component

**File**: [stat-card.tsx](../src/components/stat-card.tsx)

```typescript
StatCard: { value: number; label: string; accent?: "teal" | "amber" | "rose" | "blue"; delay?: number }
StatRow: { children: React.ReactNode }
```

Large bold `fmt(value)` + uppercase label. Colored border + text per accent. `.fade-up` with delay.

---

#### `DeclarationSection` — Client Component

**File**: [declaration-section.tsx](../src/components/declaration-section.tsx)

```typescript
{ declarations: Declaration[] }
```

Expandable HATVP declaration cards. Collapsed: type badge + title + date + summary line. Expanded: revenue summary stat boxes + paid activity cards with mini bar charts + unpaid positions collapsed list + financial participations. Smart filtering: empty categories not rendered.

---

## Formatting Utilities

**File**: [format.ts](../src/lib/format.ts)

| Function | Input | Output | Example |
|----------|-------|--------|---------|
| `fmt` | `number \| null` | French-formatted number | `1 234 567` |
| `fmtEuro` | `number \| null` | Currency (EUR, no decimals) | `50 000 EUR` |
| `fmtPct` | `number \| null` | Percentage (1 decimal) | `45,3 %` |
| `fmtDate` | `Date \| string \| null` | Full French date | `6 février 2025` |
| `fmtShortDate` | `Date \| string \| null` | Short date | `févr. 2025` |
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

30 items per page (40 for elus). `skip` / `take` with Prisma. URL `?page=N` param preserved by `Pagination` component alongside other search params.

### Dossier Config

**File**: [dossier-config.ts](../src/lib/dossier-config.ts)

Central registry of all 8 dossiers. Each entry: `{ slug, label, description, stat, statSource, tags, lobbyDomains, color }`. Used by `DossierNav`, dossier hub page, and homepage.

### ISR Revalidation

```tsx
export const revalidate = 3600;  // Homepage, votes pages
export const revalidate = 86400; // Dossiers, economie, patrimoine, territoire hub, representants hub
// (no export) = fully dynamic — deputy/senator/lobbyiste/scrutin profiles
```

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
`TimelineChart` component: server-rendered SVG polyline.
No external chart library dependency.

### generateMetadata

Dynamic routes export `generateMetadata` for SEO. Pattern:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.depute.findUnique({ where: { id } });
  return { title: `${item?.prenom} ${item?.nom} — L'Observatoire Citoyen` };
}
```

Applied to: deputés/[id], sénateurs/[id], lobbyistes/[id], partis/[id], territoire/[dept], territoire/commune/[code], scrutins/[id] (×2 routes), musées/[id], monuments/[id].

**Gotcha — `partis/[id]`**: The URL `id` parameter is a CUID string. `generateMetadata` must use `findUnique({ where: { id } })`. An earlier version incorrectly called `parseInt(id, 10)` to look up by `codeCNCC` (an Int) — this produced `NaN`, which Prisma rejected as an invalid `Int`, causing a server exception on every party detail page load. Fixed in Session 20.

---

## Responsive Design

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | Mobile-first | Single column, px-6 padding |
| `sm` (640px) | Tablet | 2-column grids, side-by-side stats |
| `lg` (1024px) | Desktop | 3-4 column grids, sidebar layouts |

List pages: `max-w-7xl px-6`. Profile detail pages: `max-w-4xl px-6` (focused editorial width). Dossier pages: `max-w-5xl px-6`.

---

## Build Output (Session 26 — 59 routes + 5 OG)

```
Route (app)                                                   Type
┌ ƒ /opengraph-image                                          Dynamic (OG — Session 18/19)
├ ○ /                                                         Static (ISR 3600)
├ ○ /dossiers                                                 Static (ISR 86400)
├ ƒ /dossiers/confiance-democratique                          Dynamic
├ ƒ /dossiers/dette-publique                                  Dynamic
├ ƒ /dossiers/emploi-jeunesse                                 Dynamic
├ ƒ /dossiers/logement                                        Dynamic
├ ƒ /dossiers/logement/opengraph-image                        Dynamic (OG — Session 18/19)
├ ƒ /dossiers/pouvoir-dachat                                  Dynamic
├ ƒ /dossiers/retraites                                       Dynamic
├ ƒ /dossiers/sante                                           Dynamic
├ ƒ /dossiers/transition-ecologique                           Dynamic
├ ○ /representants                                            Static (ISR 86400)
├ ƒ /representants/deputes                                    Dynamic
├ ƒ /representants/deputes/[id]                               Dynamic
├ ƒ /representants/deputes/[id]/opengraph-image               Dynamic (OG — 7E)
├ ƒ /representants/elus                                       Dynamic
├ ƒ /representants/elus/maires                                Dynamic
├ ƒ /representants/lobbyistes                                 Dynamic
├ ƒ /representants/lobbyistes/[id]                            Dynamic
├ ƒ /representants/partis                                     Dynamic
├ ƒ /representants/partis/[id]                                Dynamic
├ ƒ /representants/scrutins                                   Dynamic
├ ƒ /representants/scrutins/[id]                              Dynamic
├ ƒ /representants/senateurs                                  Dynamic
├ ƒ /representants/senateurs/[id]                             Dynamic
├ ○ /gouvernance                                              Static (legacy)
├ ƒ /gouvernance/deputes                                      Dynamic (legacy)
├ ƒ /gouvernance/deputes/[id]                                 Dynamic (legacy)
├ ƒ /gouvernance/elus                                         Dynamic (legacy)
├ ƒ /gouvernance/elus/maires                                  Dynamic (legacy)
├ ƒ /gouvernance/lobbyistes                                   Dynamic (legacy)
├ ƒ /gouvernance/lobbyistes/[id]                              Dynamic (legacy)
├ ƒ /gouvernance/partis                                       Dynamic (legacy)
├ ƒ /gouvernance/partis/[id]                                  Dynamic (legacy)
├ ƒ /gouvernance/scrutins                                     Dynamic (legacy, still active)
├ ƒ /gouvernance/scrutins/[id]                                Dynamic (legacy, still active)
├ ƒ /gouvernance/scrutins/[id]/opengraph-image                Dynamic (OG — 7E)
├ ƒ /gouvernance/senateurs                                    Dynamic (legacy)
├ ƒ /gouvernance/senateurs/[id]                               Dynamic (legacy)
├ ƒ /recherche                                                Dynamic (7B + Session 18)
├ ○ /votes                                                    Static (ISR 3600)
├ ○ /votes/alignements                                        Static (ISR 86400 — 7F)
├ ƒ /votes/mon-depute                                         Dynamic
├ ƒ /votes/par-sujet/[tag]                                    Dynamic
├ ƒ /comparer/territoires                                     Dynamic (7D)
├ ƒ /comparer/deputes                                         Dynamic (7D)
├ ○ /elections                                                Static
├ ƒ /elections/legislatives-2024                              Dynamic
├ ○ /economie                                                 Static (ISR 86400)
├ ○ /territoire                                               Static (ISR 86400)
├ ƒ /territoire/[departementCode]                             Dynamic
├ ƒ /territoire/[departementCode]/opengraph-image             Dynamic (OG — 7E)
├ ƒ /territoire/commune/[communeCode]                         Dynamic
├ ○ /patrimoine                                               Static (ISR 86400)
├ ƒ /patrimoine/monuments                                     Dynamic
├ ƒ /patrimoine/monuments/[id]                                Dynamic
├ ƒ /patrimoine/musees                                        Dynamic
├ ƒ /patrimoine/musees/[id]                                   Dynamic
├ ○ /president                                                Static (Phase 6)
└ ƒ /mon-territoire                                           Dynamic (7A)
```

11 static + 48 dynamic = 59 routes. Plus 5 OG image routes = 64 total in build output.

New since Session 20: `/gouvernement` (static ISR 3600), `/gouvernement/[slug]` (dynamic, Phase 9A+9E).

---

## File Structure

```
src/
├── app/
│   ├── globals.css              # Theme colors, effects, animations
│   ├── layout.tsx               # Root: fonts, navbar (7 items), footer
│   ├── page.tsx                 # Homepage (ISR 3600)
│   ├── opengraph-image.tsx      # OG 1200×630: platform brand + 8 dossier chips + 3 stats (Session 18/19)
│   ├── dossiers/
│   │   ├── page.tsx             # Dossier hub (ISR 86400)
│   │   ├── pouvoir-dachat/page.tsx
│   │   ├── confiance-democratique/page.tsx
│   │   ├── dette-publique/page.tsx
│   │   ├── emploi-jeunesse/page.tsx
│   │   ├── logement/
│   │   │   ├── page.tsx
│   │   │   └── opengraph-image.tsx  # OG 1200×630: housing stats (vacancy %, secondary %, vote count) (Session 18/19)
│   │   ├── sante/page.tsx
│   │   ├── transition-ecologique/page.tsx
│   │   └── retraites/page.tsx
│   ├── representants/
│   │   ├── page.tsx             # Hub (ISR 86400)
│   │   ├── deputes/
│   │   │   ├── page.tsx         # List + group/dept filters
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Hero + tabs (activite/declarations/transparence/infos)
│   │   │       └── opengraph-image.tsx  # OG 1200×630: initials + name + stats (7E)
│   │   ├── senateurs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── elus/
│   │   │   ├── page.tsx
│   │   │   └── maires/page.tsx
│   │   ├── lobbyistes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── partis/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── scrutins/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── gouvernance/             # Legacy (still active for scrutins; others redirect)
│   │   ├── page.tsx
│   │   ├── deputes/[id]/page.tsx
│   │   ├── senateurs/[id]/page.tsx
│   │   ├── lobbyistes/[id]/page.tsx
│   │   ├── partis/[id]/page.tsx
│   │   └── scrutins/
│   │       ├── page.tsx
│   │       ├── [id]/page.tsx
│   │       └── [id]/opengraph-image.tsx  # OG 1200×630: result badge + title + vote bar (7E)
│   ├── recherche/
│   │   └── page.tsx             # Full-text search + president static injection (7B + Session 18)
│   ├── votes/
│   │   ├── page.tsx             # Hub (ISR 3600)
│   │   ├── alignements/page.tsx # N×N alignment heatmap (ISR 86400 — 7F)
│   │   ├── par-sujet/[tag]/page.tsx
│   │   └── mon-depute/page.tsx
│   ├── comparer/
│   │   ├── territoires/page.tsx # 3-state dept comparison (7D)
│   │   └── deputes/page.tsx     # 4-state deputy comparison (7D)
│   ├── elections/
│   │   ├── page.tsx
│   │   └── legislatives-2024/page.tsx
│   ├── economie/
│   │   └── page.tsx             # ISR 86400
│   ├── territoire/
│   │   ├── page.tsx             # ISR 86400
│   │   ├── [departementCode]/
│   │   │   ├── page.tsx                # Full dashboard + "Comparer →" link
│   │   │   └── opengraph-image.tsx     # OG 1200×630: dept + region + 3 INSEE indicators (7E)
│   │   └── commune/[communeCode]/page.tsx
│   ├── president/
│   │   └── page.tsx             # Macron profile — 4 tabs (Phase 6)
│   ├── gouvernement/
│   │   ├── page.tsx             # Government index — grouped by TypeMandat, ISR 3600 (Phase 9A)
│   │   └── [slug]/
│   │       └── page.tsx         # Profile — ProfileHero + ProfileTabs (3 tabs) (Phase 9A+9E)
│   ├── mon-territoire/
│   │   └── page.tsx             # 3-state civic dashboard by postal code (Session 14) + mini FranceMap (8B)
│   └── patrimoine/
│       ├── page.tsx             # ISR 86400
│       ├── musees/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── monuments/
│           ├── page.tsx
│           └── [id]/page.tsx
├── components/
│   ├── dossier-hero.tsx         # Server: dossier page hero banner
│   ├── dossier-nav.tsx          # Server: horizontal dossier pill nav
│   ├── indicator-card.tsx       # Server: KPI tile with trend arrow
│   ├── topic-vote-list.tsx      # Server: scrutins filtered by tag
│   ├── lobbying-density.tsx     # Server: domain-filtered lobbying summary
│   ├── conflict-alert.tsx       # Server: cross-reference finding alert (href + votePour/voteContre — 7C)
│   ├── delta-badge.tsx          # Client: % difference badge, always teal (7D)
│   ├── france-map.tsx           # Client: SVG choropleth of French depts, 6 indicators (Phase 8A)
│   ├── nav-search.tsx           # Client: navbar search, always flex, useRef+onKeyDown (7B/Session 18)
│   ├── search-box.tsx           # Client: /recherche page search input (Session 18)
│   ├── ranking-table.tsx        # Server: département ranking by indicator
│   ├── dept-lookup.tsx          # Client: dept search → territoire redirect
│   ├── dept-map.tsx             # Server: ranked bar visualization for dept data
│   ├── timeline-chart.tsx       # Server: SVG polyline time-series chart
│   ├── avatar.tsx               # Client: img with fallback initials
│   ├── declaration-section.tsx  # Client: expandable HATVP declaration cards
│   ├── page-header.tsx          # Server: breadcrumbs + title (list pages)
│   ├── pagination.tsx           # Server: page numbers with ellipsis
│   ├── profile-hero.tsx         # Server: full-width hero banner (profiles)
│   ├── profile-tabs.tsx         # Client: URL-driven tab navigation
│   ├── score-bar.tsx            # Server: animated horizontal bar
│   ├── score-gauge.tsx          # Server: compact stat box (profile hero)
│   ├── scrutin-result-badge.tsx # Server: Adopté/Rejeté badge
│   ├── search-input.tsx         # Client: URL-based search with spinner
│   ├── stat-card.tsx            # Server: number + label card
│   ├── vote-badge.tsx           # Server: Pour/Contre/Abstention/Non-votant
│   └── gouvernement/            # Phase 9 section components (all async server components)
│       ├── interets-section.tsx # Server: HATVP interests grouped by rubrique, <details> expander
│       ├── mandats-section.tsx  # Server: government mandate timeline (border-l + dots)
│       ├── career-section.tsx   # Server: career timeline placeholder (9D pending)
│       ├── lobby-section.tsx    # Server: ActionLobby count by ministereCode (9C pending)
│       └── judiciaire-section.tsx # Server: verified judicial events (verifie=true only; null if none)
├── data/
│   ├── lobbyists-curated.ts     # Static curated lobbyist profiles (10 orgs, Phase 6)
│   ├── president-macron.ts      # Static Macron data — BIO + 20 promises (Phase 6)
│   ├── postal-codes.json        # La Poste Hexasmal: 6,328 postal codes → INSEE lists (Session 14)
│   ├── france-geo.ts            # SVG paths for French depts (@svg-maps/france.departments) (Phase 8A)
│   └── indicators.ts            # IndicatorConfig[], INDICATOR_MAP, DeptData, IndicatorKey (Phase 8A)
└── lib/
    ├── db.ts                    # Prisma client (pg adapter, singleton) — named export `{ prisma }`
    ├── dossier-config.ts        # Dossier metadata (slug, label, tags, lobbyDomains)
    ├── format.ts                # French number/date formatting (7 functions)
    ├── nuance-colors.ts         # Political nuance code → { color, bg, label } mapping
    ├── alignment.ts             # computeAlignment(): $queryRaw CTE self-join on GroupeVote (7F)
    ├── postal-resolver.ts       # resolvePostalCode(): CP → ResolvedTerritory[] (Session 14)
    ├── president-utils.ts       # getBaselineObservation() + computeDelta() (Phase 6)
    ├── france-map-data.ts       # getFranceMapData(): 4 parallel Prisma queries → Record<string, DeptData> (Phase 8A)
    └── search.ts                # globalSearch(): search_index view + president static injection (7B/Session 18)
```
