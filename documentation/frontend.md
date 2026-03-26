# Frontend Implementation

> Last updated: Mar 26, 2026 — Session 39 (UX Restructure). ~35 active routes + ~30 legacy (Phase 6 removal pending) + 5 OG image routes, 42 components, 14 client components.

Complete reference for all UI pages, components, styling, and patterns.

---

## Architecture

- **Next.js 16** App Router — all pages are React Server Components by default
- **Tailwind CSS 4** with custom theme tokens defined in `globals.css`
- **No client-side data fetching** — every page queries Prisma directly at render time
- **14 client components**: `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`, `SearchBox`, `FranceMap`, `DeltaBadge`, `GroupExpander`, `ScrutinAccordion`, `MediaBoard`, `MobileNav`, `ConflictDrilldown` (all use `"use client"`) — `HeroSlider` deleted in Session 39
- **1 shared lib**: `nuance-colors.ts` — political party color mapping used by elections pages
- **French localization** throughout: `<html lang="fr">`, `fr-FR` locale for numbers/dates
- **ISR** (`export const revalidate = N`): homepage + votes = 3600s; profils hub + economie + patrimoine + territoire hub = 86400s; profiles = dynamic (no revalidate); surviving dossiers (medias, financement-politique) = 86400s
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
| Stat card | `.stat-card` | Hover lift (translateY -2px) + teal glow on stat number cards |
| Stat gradients | `.stat-number-rose/amber/teal` | Gradient text (`background-clip: text`) for stat card numbers |
| Owner card | `.owner-card` | Dark gradient bg + border-bureau-600 hover transition for media owner cards |
| Bar segment | `.bar-segment` | Brightness hover (1.3) for stacked bar chart segments |
| Filter active | `.filter-active` | Teal gradient bg + white text for active filter pills |
| Section divider | `.section-divider` | Top border with gradient (transparent → bureau-600 → transparent) + 3rem top padding |
| Desc block | `.desc-block` | Left 3px teal accent border for description paragraphs |
| Lobby stat | `.lobby-stat` | Hover brightness (1.1) for lobbying stat cards |
| Mobile menu btn | `.mobile-menu-btn` | Hidden on desktop (>768px), 36px teal-bordered circle button |
| Mobile nav overlay | `.mobile-nav-overlay` | Full-screen slide-down overlay with slideDown keyframe, hidden on desktop |
| Selection | `::selection` | Teal background selection highlight |
| SIGINT section | `.sigint-section` | `position: relative; overflow: hidden` with animated scan-line (`::after` 1px teal gradient sweeping at 8s linear) |
| SIGINT amber | `.sigint-amber::after` | Overrides scan-line gradient to amber — used on President/amber sections |
| Glass panel | `.glass-panel` | Frosted glass: `rgba(12,16,24,0.65)` bg + `backdrop-filter: blur(12px)` + teal/8% border |
| Dossier card | `.dossier-card` | Dark gradient card with hover luminous border (gradient mask technique) + `translateY(-3px)` lift |
| Dossier card active | `.dossier-card-active` | Expanded/selected state: teal/15% border + 80px teal glow |
| Data value | `.data-value` | Tabular nums, `letter-spacing: 0.02em` for monospace data displays |
| Live dot | `.live-dot` | 6px teal pulsing circle, `pulse-dot` keyframe 3s infinite |
| Live dot amber | `.live-dot-amber` | Same as live-dot but amber — used in President/classification bar |
| Classification badge | `.classification-badge` | 9px uppercase, teal border, `letter-spacing: 0.2em` — `CLASSIFIÉ` / tier labels |
| Threat bar | `.threat-bar` | 3px animated-fill bar at bottom edge of hero cards (`threat-fill` keyframe scaleX 0→1) |
| Gov hero card | `.gov-hero-card` | `/gouvernement` President/PM hero cards: dot-matrix overlay, `translateY(-2px)` hover, sigint-section base |

---

## Layout

[layout.tsx](../src/app/layout.tsx) provides the shell:

- **Navbar**: Sticky top, backdrop-blur, SVG logo + "L'Observatoire" brand (click → `/`) + **`NavSearch`** (always-visible search form — `flex`, `w-80`, `/` keyboard shortcut to focus) + **4 nav links** (**Signaux**, **Profils**, **Votes**, **Territoire**) wrapped in `.nav-links` div (hidden on mobile via CSS) + **`MobileNav`** hamburger menu (visible only on mobile <768px). Session 39 restructure: collapsed from 9 items; killed from nav: Accueil, Dossiers, Représentants, Gouvernement, Économie, Patrimoine.
- **Main**: `flex-1` content area
- **Footer**: Data source attribution ("data.gouv.fr, INSEE, Senat, HATVP") + "Patrimoine culturel" link + "L'Observatoire Citoyen 2025"
- **Mobile nav**: `MobileNav` client component — hamburger button (`.mobile-menu-btn`) toggles full-screen overlay (`.mobile-nav-overlay`) with `slideDown` animation. Closes on link click.
- **Container**: `max-w-7xl px-6` on list pages; `max-w-4xl px-6` on profile detail pages (focused editorial width)

**Breadcrumbs**: `/profils/*` pages use `{ label: "Profils", href: "/profils" }`. Legacy `/representants/*` pages still use `{ label: "Représentants", href: "/representants" }`. `PageHeader` component renders breadcrumbs with `/` separators.

**Metadata**: `"L'Observatoire Citoyen — Intelligence civique française"`

---

## Route Map (~35 active + ~30 legacy + 5 OG image routes)

### Static (prerendered at build time)
| Route | Purpose |
|-------|---------|
| `/` | Homepage — search-first hero with giant search bar, entity pills (Députés, Sénateurs, Ministres, Lobbyistes, Votes), inline top 6 signals, 5 recent votes, territory lookup. Session 39 rewrite: removed HeroSlider, dossier grid, KPI counters, economic indicators. |
| `/profils` | **People hub** (Session 39) — index page linking to all people sections: députés, sénateurs, ministres, lobbyistes, partis, élus, comparer |
| `/profils/ministres` | Government index — Lecornu II government (37 members), grouped by type (President → PM → Ministres → Délégués → Secrétaires), avatar grid, links to profiles. Supports `?gouvernement=borne|attal|barnier` filter. Copy of `/gouvernement` page with updated links. |
| `/elections` | Hub — Législatives 2024 card + national summary stats |
| `/economie` | Dashboard — SVG MiniChart per indicator (15+ series). No longer in nav; accessible via footer/search. |
| `/territoire` | Browser — regions with department cards + `FranceMap` (Phase 8A/8B, 6 indicators, dept click → `/territoire/[code]`) |
| `/patrimoine` | Hub — top 10 museums + monument domains. No longer in nav; accessible via footer link "Patrimoine culturel". |
| `/votes` | Votes hub — 13 topic grid + recent scrutins |
| `/votes/alignements` | Alignment matrix — N×N group co-vote heatmap, top 5 allies/opponents per group (ISR 86400) |
| `/president` | **HTTP 308 permanent redirect → `/profils/emmanuel-macron`** |

### Dossiers (2 surviving + 8 killed → redirected)

**Surviving deep-dive enquêtes** (linked from `/signaux`):
| Route | Topic |
|-------|-------|
| `/dossiers/medias` | **Media ownership concentration** — `MediaBoard` (interactive owner cards), `ConcentrationChart` (CSS stacked bars), `CamembertChart` (SVG donut), votes culture, lobbying audiovisuel/presse (Session 35) |
| `/dossiers/financement-politique` | **Political financing** — cost per seat bars, funding structure stacked bars, electoral yield table, 2021-2024 evolution for RN/Renaissance/LFI/LR (Session 37) |

**Killed dossier pages** (Session 39 — all redirect via `next.config.ts`):
| Old Route | Redirects To |
|-----------|-------------|
| `/dossiers` | `/signaux` |
| `/dossiers/pouvoir-dachat` | `/territoire` |
| `/dossiers/confiance-democratique` | `/signaux` |
| `/dossiers/dette-publique` | `/territoire` |
| `/dossiers/emploi-jeunesse` | `/territoire` |
| `/dossiers/logement` | `/territoire` |
| `/dossiers/sante` | `/territoire` |
| `/dossiers/transition-ecologique` | `/signaux` |
| `/dossiers/retraites` | `/signaux` |

### Signaux (Session 39)
| Route | Key Features |
|-------|-------------|
| `/signaux` | Transparency signal feed — URL-param-driven filter pills by type (Conflits, Portes tournantes, Lobbying, Médias, Déclarations, Dissidences) and by severity (Critique, Notable, Informatif). Deep-dive "Enquête" link cards at bottom for `/dossiers/medias` + `/dossiers/financement-politique`. |

### Profils (new canonical people section — Session 39)
| Route | Key Features |
|-------|-------------|
| `/profils` | People hub index — links to all people sections |
| `/profils/deputes` | Search, groupe filter, dept filter, pagination |
| `/profils/deputes/[id]` | **Redirects to `/profils/[slug]`** if `PersonnalitePublique.deputeId` matches. Otherwise: Hero profile + tabs (Activité / Déclarations / **Transparence** / Informations) |
| `/profils/senateurs` | Search, pagination |
| `/profils/senateurs/[id]` | **Redirects to `/profils/[slug]`** if `PersonnalitePublique.senateurId` matches. Otherwise: Hero profile + tabs (Mandats & Commissions / Déclarations / **Transparence** / Informations). Transparence tab: commission-lobbying overlap via `COMMISSION_DOMAINS` regex → `ActionLobbyiste.count` queries |
| `/profils/ministres` | Government index — SIGINT organigram, `?gouvernement=` filter |
| `/profils/[slug]` | Minister profile — `ProfileHero` + `ProfileTabs`. Same as old `/gouvernement/[slug]` with updated internal links. |
| `/profils/elus` | Local officials list — 593K rows, paginated |
| `/profils/lobbyistes` | Search, pagination |
| `/profils/lobbyistes/[id]` | Info panel, actions list |
| `/profils/partis` | Year selector, sort options, aggregate stats |
| `/profils/partis/[id]` | Revenue/expense breakdown bars, multi-year table |
| `/profils/comparer` | Deputy comparison (4-state) |

### Représentants (legacy — being phased out in Phase 6)
Old `/representants/*` routes still exist with identical pages. Will be replaced with redirects to `/profils/*` in Phase 6.
| Route | Key Features |
|-------|-------------|
| `/representants/deputes` | Search, groupe filter, dept filter, pagination |
| `/representants/deputes/[id]` | **Redirects to `/gouvernement/[slug]`** if `PersonnalitePublique.deputeId` matches. Otherwise: Hero profile + tabs (Activité / Déclarations / **Transparence** / Informations) |
| `/representants/senateurs` | Search, pagination |
| `/representants/senateurs/[id]` | **Redirects to `/gouvernement/[slug]`** if `PersonnalitePublique.senateurId` matches. Otherwise: Hero profile + tabs (Mandats & Commissions / Déclarations / **Transparence** / Informations). Transparence tab (Session 37): commission-lobbying overlap via `COMMISSION_DOMAINS` regex → `ActionLobbyiste.count` queries |
| `/representants/elus` | Local officials list — 593K rows, paginated |
| `/representants/elus/maires` | Mayors subset |
| `/representants/lobbyistes` | Search, pagination |
| `/representants/lobbyistes/[id]` | Info panel, actions list |
| `/representants/scrutins` | Search, result filter, **SPS/MOC type filter** (`?type=sps\|moc`), pagination |
| `/representants/scrutins/[id]` | Result summary, group bars, individual votes |
| `/representants/partis` | Year selector, sort options, aggregate stats |
| `/representants/partis/[id]` | Revenue/expense breakdown bars, multi-year table |

### Gouvernement (legacy — being phased out in Phase 6)
| Route | Key Features |
|-------|-------------|
| `/gouvernement` | SIGINT intelligence bureau organigram. Still active; will redirect to `/profils/ministres` in Phase 6. |
| `/gouvernement/[slug]` | Profile page. Still active; will redirect to `/profils/[slug]` in Phase 6. |

### Gouvernance (legacy — HTTP 308 redirects to /profils)
`/gouvernance/*` routes redirect to `/profils/*` (updated from `/representants/*` in Session 39). Configured in `next.config.ts`.

### Votes (dedicated votes section)
| Route | Key Features |
|-------|-------------|
| `/votes` | Tag grid (13 topics), stats, recent scrutins, **Grandes lois** section (top 4 laws by `rang` with inline GroupBar) |
| `/votes/lois` | Parliamentary Laws hub — 19 major laws. Filters: statut (Tous/Adoptés/Rejetés), type (PLF/PROJET_LOI/etc), tag pills. `LoiCard` grid with inline GroupBar. `revalidate = 3600`. [Session 33] |
| `/votes/lois/[slug]` | Law detail — hero stats (votants/pour/contre/abstentions), `GroupExpander` (party breakdown, expandable deputy list), `ScrutinAccordion` (all linked scrutins, VOTE_FINAL pinned top). `generateMetadata` for SEO. [Session 33] |
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
| `/recherche` | Full-text search across 800K+ rows — entity type pills (Tous / Députés / Sénateurs / Lobbyistes / Scrutins / Communes / Partis), color-coded result cards. URL-driven: `?q=` + `?type=`. Backed by `search_index` materialized view (GIN, `french` stemming). Static injection: "Emmanuel Macron → `/gouvernement/emmanuel-macron`" for queries matching `macron`/`president`/`elysee`/`manu`. |

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
| `/opengraph-image` | Homepage brand — platform name, tagline, stat cards. Static, no DB. |
| `/dossiers/logement/opengraph-image` | Logement dossier — queries live housing stats: avg vacancy rate + avg secondary rate (StatLocale) + vote count (ScrutinTag). |
| `/representants/deputes/[id]/opengraph-image` | Initials monogram + name + groupe + participation % + vote count + conflict count |
| `/territoire/[departementCode]/opengraph-image` | Dept + region name + 3 INSEE indicators (MEDIAN_INCOME, POVERTY_RATE, UNEMPLOYMENT_RATE) + counts (deputés, sénateurs, élus) |
| `/gouvernance/scrutins/[id]/opengraph-image` | Result badge (ADOPTÉ green / REJETÉ red) + truncated title + pour/contre bar + vote counts |

**Critical rule**: never use remote `<img src>` in satori/ImageResponse — network failures crash the route with `chrome-error://chromewebdata/`. Always use initials or inline SVG.

---

## Pages Detail

### `/` — Homepage (Session 39 rewrite)

**File**: [page.tsx](../src/app/page.tsx) | `revalidate = 3600`

**Data**: Top 6 signals (conflict, lobby, judicial), 5 recent scrutins with group votes, entity counts (députés, sénateurs, ministres, lobbyistes, scrutins).

**Sections**:
1. **Search-first hero** — `.grid-bg` pattern, giant centered search bar, entity pills (Députés, Sénateurs, Ministres, Lobbyistes, Votes) each linking to `/profils/*` or `/votes`
2. **Signaux récents** — Top 6 transparency signals inline, "Tous les signaux →" link to `/signaux`
3. **Derniers Scrutins** — 5 most recent parliamentary votes with result badge + group breakdown
4. **Votre Territoire** — `DeptLookup` client component → département dashboard redirect

Removed in Session 39: `HeroSlider`, dossier grid, KPI counters, economic indicators.

---

### `/dossiers/medias` and `/dossiers/financement-politique` — Surviving Dossier Pages

The 2 surviving dossier pages are deep-dive enquêtes linked from `/signaux`. They use `DossierNav` (simplified to 2 links + "← Signaux" back link).

**Data patterns**:

| Dossier | Key Data Queries |
|---------|----------------|
| `medias` | GroupeMedia (with Filiale[], ParticipationMedia.proprietaire.personnalite), Filiale count, Scrutins culture tag, ActionLobbyiste audiovisuel/presse/media, top 5 lobbying orgs |
| `financement-politique` | ComptePolitique (4 years), ElectionLegislative results, CandidatLegislatif seats/votes by nuance, nuance-party-map cross-reference |

### `/dossiers/medias` — Media Ownership Concentration (Session 35)

**File**: [page.tsx](../src/app/dossiers/medias/page.tsx) | `revalidate = 86400`

Unique dossier page with dedicated components for media ownership visualization. Does NOT follow the standard dossier template — uses `MediaBoard`, `ConcentrationChart`, and `CamembertChart` instead of `IndicatorCard`/`RankingTable`.

**5 sections**:
1. **Context cards** — 3 `stat-card` tiles (9 billionaires, RSF rank 25th, filiale count) + `desc-block` explainer
2. **Intelligence Board** — `MediaBoard` client component in `<Suspense>`: 10 expandable owner cards with filter pills by media type, fortune display, government cross-ref links, subsidiary pills grouped by TypeMedia
3. **Concentration par type** — 2-column grid: `ConcentrationChart` (CSS horizontal stacked bars) + `CamembertChart` (SVG donut) + 4 type mini-stat cards (TV, Radio, Presse, Numerique)
4. **Votes au Parlement** — `TopicVoteList` filtered by culture tag
5. **Lobbying audiovisuel et presse** — `LobbyingDensity` with audiovisuel/presse/media domain filter

**Data**: `Promise.all` — 6 parallel queries (groupeMedia with nested includes, filiale count, scrutins, actionLobbyiste count, lobbyiste count, top 5 orgs).

---

### `/representants/deputes/[id]` — Deputy Detail (Enhanced)

**File**: [page.tsx](../src/app/representants/deputes/[id]/page.tsx)

**Tabs**: Activité / Déclarations / **Transparence** / Informations

**Declaration matching** (Session 38 fix): `DeclarationInteret` query uses `mode: "insensitive" as const` for `nom`/`prenom` to handle HATVP uppercase names (e.g., `FAYSSAT` vs `Fayssat`). Without this, deputies with uppercase HATVP entries showed empty declarations.

**Transparence tab** (Phase 3 + Session 37 `ConflictDrilldown`):
- Stat cards: total participations déclarées (€), votes sur textes thématiques, déports count
- `ConflictDrilldown` (client component): per-tag conflict alerts with expandable vote lists showing position badge, scrutin link, date, result (adopté/rejeté)
- Tag breakdown: bar chart of deputy's vote positions per policy domain
- Déports list with scrutin links

---

### `/votes` — Votes Hub

**File**: [page.tsx](../src/app/votes/page.tsx) | `revalidate = 3600`

**Data**: ScrutinTag counts per tag (13 topics), total scrutin count, 10 recent scrutins, top 4 `LoiParlementaire` by `rang` (with VOTE_FINAL scrutin and `groupeVotes` for inline GroupBar).

**Sections**:
1. Tag grid — 13 topic pills with vote counts, each linking to `/votes/par-sujet/[tag]`
2. Stats row — total votes, total tagged, date range
3. **Grandes lois** — 4 major law cards (SessionLinks to `/votes/lois/[slug]`, inline party-position GroupBar) + "Voir toutes les lois →" CTA
4. Recent scrutins — last 10 with result badge, title, date

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

- `/economie` — `revalidate = 86400`, SVG MiniChart per indicator (now 15+ series). Unit-aware formatting (Session 39): `pourcent` → "X %", `eur` → "X,XX €", `centaines_millions_eur` → "X Md €" (÷10), `millions_eur` → "X Md €" (÷1000), `milliards_eur` → "X,X Md €", `indice` → plain number, all others → `fmt(Math.round(val))`. DETTE_PIB uses `centaines_millions_eur` (BDM series `001694258` returns raw debt, not % of GDP). SMIC uses `indice` (base 100).
- `/representants/scrutins` + `/[id]` — group bars, individual votes (same as legacy `/gouvernance/scrutins`)
- `/representants/lobbyistes` + `/[id]` — info panel, actions
- `/representants/partis` + `/[id]` — year selector, revenue/expense bars
- `/elections/legislatives-2024` — tour switcher, dept filter, nuance bars, **FinanceTable** (Session 37: aide publique/recettes/dons/sièges cross-referenced with CNCCFP via `nuance-party-map.ts`)
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

Simplified navigation for the 2 surviving dossier pages (medias, financement-politique) + "← Signaux" back link. Active dossier highlighted `bg-bureau-700 text-bureau-100`. `overflow-x-auto scrollbar-hide` for horizontal scroll. Right-edge gradient fade (`pointer-events-none`, `from-bureau-900/90 to-transparent`) signals overflow. Reads slug list from `dossier-config.ts`.

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

Enlarged search input in the navbar (Session 39: `w-52` → `w-80`). Always `flex` (not `hidden md:flex`). Uses `useRef` to read DOM value + `onKeyDown` on the input (Enter) + `type="button"` `onClick` on the magnifier icon — no `<form>` wrapper. Navigates to `/recherche?q=<value>` via `useRouter`. Min 2-char enforced. `/` keyboard shortcut to focus. Styled: `w-80 border-bureau-700/50 bg-bureau-800/60 focus:border-teal-500/60`.

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

**Integrated on** (Phase 8B): `/territoire` (full, rev), `/territoire/[dept]` (mini), `/mon-territoire` (mini). Previously also on 4 killed dossier pages (pouvoir-dachat, sante, emploi-jeunesse, dette-publique).

---

### New in Phase 9 — Gouvernement Section Components

Ten server components in `src/components/gouvernement/`. Each is a self-contained async server component — never inline section logic directly in `gouvernement/[slug]/page.tsx`.

| Component | File | Purpose |
|-----------|------|---------|
| `InteretsSection` | [gouvernement/interets-section.tsx](../src/components/gouvernement/interets-section.tsx) | HATVP declared interests grouped by `rubrique`, progressive disclosure (first 5 inline, rest in native `<details><summary>`), `InteretItem` sub-component, conflict alert per item |
| `MandatsSection` | [gouvernement/mandats-section.tsx](../src/components/gouvernement/mandats-section.tsx) | Timeline of government mandates (`border-l` vertical line, dot per mandate, active = teal dot) |
| `CareerSection` | [gouvernement/career-section.tsx](../src/components/gouvernement/career-section.tsx) | Vertical career timeline from `EntreeCarriere`. Dot color by `categorie` (teal=gouvernemental, blue=électif, amber=fonction publique, purple=formation). "Parcours partiel" notice when no PRESSE source. |
| `LobbySection` | [gouvernement/lobby-section.tsx](../src/components/gouvernement/lobby-section.tsx) | `ActionLobby` data for current `ministereCode`: total count, top 5 orgs by count, top 6 domains, year range. Source link to AGORA registry. |
| `JudiciaireSection` | [gouvernement/judiciaire-section.tsx](../src/components/gouvernement/judiciaire-section.tsx) | Verified judicial events only (`verifie = true`); renders `null` when count = 0 |
| `ParliamentarySection` | [gouvernement/parliamentary-section.tsx](../src/components/gouvernement/parliamentary-section.tsx) | Conditional — renders `null` if neither `deputeId` nor `senateurId` set. Deputies: 4 score bars, group/department, 8 recent vote links with `VoteBadge`, contact pills. Senators: group/department, active commissions (top 3), date of office. |
| `PresidentBilanSection` | [gouvernement/president-bilan-section.tsx](../src/components/gouvernement/president-bilan-section.tsx) | **President-only.** KPI grid (chômage, PIB, dette, SMIC from `Indicateur`), chômage timeline (`TimelineChart`), electoral results from `BIO.elections`, brief bio note. Baseline computed via `getBaselineObservation` at `ELECTION_DATES[2017]`. |
| `PresidentPromessesSection` | [gouvernement/president-promesses-section.tsx](../src/components/gouvernement/president-promesses-section.tsx) | **President-only.** Props: `electionYear: 2017 \| 2022`. Election selector links (to `?tab=promesses&election=YEAR`), summary bar, promise cards with INSEE evidence blocks and parliament vote links. Data: `Indicateur` + `ScrutinTag` counts. |
| `PresidentLobbyingSection` | [gouvernement/president-lobbying-section.tsx](../src/components/gouvernement/president-lobbying-section.tsx) | **President-only.** Overview stats, power lobbyist cards, consulting firm grid, domain cross-reference. Data: `ActionLobbyiste` group-by domain + curated SIREN action counts + `ScrutinTag` counts. |
| `PresidentDeclarationsSection` | [gouvernement/president-declarations-section.tsx](../src/components/gouvernement/president-declarations-section.tsx) | **President-only.** Fetches `DeclarationInteret` by name "Macron" (different model from `InteretDeclare`). Summary stats, `ConflictAlert` for declarations with participations, `DeclarationSection` full list. |

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

### New in Session 33 — Parliamentary Laws Components

#### `LoiCard` — Server Component

**File**: [loi-card.tsx](../src/components/loi-card.tsx)

```typescript
{
  slug: string; titreCourt: string; resumeSimple: string
  type: string; statut: string; dateVote?: Date | null; scrutinsCount: number
  voteFinal?: { groupeVotes: { organeRef: string; positionMajoritaire: string; pour: number; contre: number; abstentions: number; nonVotants: number; organe?: { couleur?: string | null } | null }[] } | null
}
```

Card for a single `LoiParlementaire`. Shows type badge, short title, plain-language summary, `ScrutinResultBadge` for statut, vote date, scrutin count, and an inline `GroupBar` (teal=pour/rose=contre/amber=abstention stacked bar per group). Links to `/votes/lois/[slug]`.

---

#### `GroupExpander` — Client Component

**File**: [group-expander.tsx](../src/components/group-expander.tsx)

```typescript
{
  groups: Group[]    // GroupeVote aggregates with organe color + libelleAbrege
  deputies: Deputy[] // VoteRecord rows with position + groupeAbrev
}
```

Expandable group-by-group vote breakdown for law detail pages. Each row: colored dot, group name, majority position badge, mini stacked bar (pour/contre/abstention), `N p · N c · N a` counts, chevron. Click expands deputy list filtered by `position` (`["pour", "contre", "abstention", "nonVotant"]`), grouped by position column, showing up to 30 deputies per position with links to `/representants/deputes/[id]`. Deputies matched by `groupeAbrev === g.libelleAbrege`. Inline `ChevronDown` SVG (not lucide-react).

---

#### `ScrutinAccordion` — Client Component

**File**: [scrutin-accordion.tsx](../src/components/scrutin-accordion.tsx)

```typescript
{
  scrutins: { id: string; titre: string; dateScrutin: Date; sortCode: string; pour: number; contre: number; abstentions: number; role: string }[]
  voteFinalId?: string
}
```

Collapsible list of scrutins linked to a law. The `VOTE_FINAL` scrutin is always pinned to the top regardless of expand state. Other scrutins show the first 5 by default; "N scrutins supplémentaires" button expands the rest. Each row: role badge (`VOTE_FINAL`/`AMENDEMENT`/`ARTICLE`/`MOTION`/`PROCEDURAL`), truncated title, mini stacked bar (hidden on mobile), `ScrutinResultBadge`, date. Links to `/representants/scrutins/[id]`. Inline `ChevronDown` SVG (not lucide-react).

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

Registry of dossier metadata. Reduced from 8+2 to 2 surviving dossiers (medias, financement-politique) in Session 39. Each entry: `{ slug, label, description, stat, statSource, tags, lobbyDomains, color }`. Used by `DossierNav`.

### ISR Revalidation

```tsx
export const revalidate = 3600;  // Homepage, votes pages, /signaux, /profils/ministres
export const revalidate = 86400; // Surviving dossiers (medias, financement-politique), economie, patrimoine, territoire hub, profils hub
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

## Build Output (Session 39 — ~35 active + ~30 legacy + 5 OG)

```
Route (app)                                                   Type
┌ ƒ /opengraph-image                                          Dynamic (OG)
├ ○ /                                                         Static (ISR 3600) — Session 39 rewrite
├ ○ /signaux                                                  Static (ISR 3600 — Session 39)
├ ƒ /dossiers/medias                                          Dynamic (Session 35 — surviving)
├ ƒ /dossiers/financement-politique                           Dynamic (Session 37 — surviving)
├ ○ /profils                                                  Static (ISR 86400 — Session 39)
├ ƒ /profils/deputes                                          Dynamic (Session 39)
├ ƒ /profils/deputes/[id]                                     Dynamic (Session 39)
├ ƒ /profils/senateurs                                        Dynamic (Session 39)
├ ƒ /profils/senateurs/[id]                                   Dynamic (Session 39)
├ ○ /profils/ministres                                        Static (ISR 3600 — Session 39)
├ ƒ /profils/[slug]                                           Dynamic (Session 39)
├ ƒ /profils/elus                                             Dynamic (Session 39)
├ ƒ /profils/lobbyistes                                       Dynamic (Session 39)
├ ƒ /profils/lobbyistes/[id]                                  Dynamic (Session 39)
├ ƒ /profils/partis                                           Dynamic (Session 39)
├ ƒ /profils/partis/[id]                                      Dynamic (Session 39)
├ ƒ /profils/comparer                                         Dynamic (Session 39)
├ ○ /representants                                            Static (legacy — Phase 6 removal)
├ ƒ /representants/deputes                                    Dynamic (legacy)
├ ƒ /representants/deputes/[id]                               Dynamic (legacy)
├ ƒ /representants/deputes/[id]/opengraph-image               Dynamic (OG — 7E)
├ ƒ /representants/elus                                       Dynamic (legacy)
├ ƒ /representants/elus/maires                                Dynamic (legacy)
├ ƒ /representants/lobbyistes                                 Dynamic (legacy)
├ ƒ /representants/lobbyistes/[id]                            Dynamic (legacy)
├ ƒ /representants/partis                                     Dynamic (legacy)
├ ƒ /representants/partis/[id]                                Dynamic (legacy)
├ ƒ /representants/scrutins                                   Dynamic (legacy)
├ ƒ /representants/scrutins/[id]                              Dynamic (legacy)
├ ƒ /representants/senateurs                                  Dynamic (legacy)
├ ƒ /representants/senateurs/[id]                             Dynamic (legacy)
├ ○ /gouvernement                                             Static (legacy — Phase 6 removal)
├ ƒ /gouvernement/[slug]                                      Dynamic (legacy)
├ ○ /gouvernance                                              Static (legacy — redirects to /profils)
├ ƒ /gouvernance/scrutins                                     Dynamic (legacy, still active)
├ ƒ /gouvernance/scrutins/[id]                                Dynamic (legacy, still active)
├ ƒ /gouvernance/scrutins/[id]/opengraph-image                Dynamic (OG — 7E)
├ ƒ /recherche                                                Dynamic (7B + Session 18)
├ ○ /votes                                                    Static (ISR 3600)
├ ○ /votes/alignements                                        Static (ISR 86400 — 7F)
├ ○ /votes/lois                                               Static (ISR 3600 — Session 33)
├ ƒ /votes/lois/[slug]                                        Dynamic (Session 33)
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
├ ○ /president                                                Static (redirect → /profils/emmanuel-macron)
└ ƒ /mon-territoire                                           Dynamic (7A)
```

~35 active functional routes + ~30 legacy (Phase 6 deletion pending) + 5 OG image routes.

**Redirects configured in `next.config.ts`** (Session 39):
- `/gouvernance/*` → `/profils/*`
- `/president` → `/profils/emmanuel-macron`
- `/dossiers` → `/signaux`
- 8 killed dossier paths → `/signaux` or `/territoire`
- Phase 6 (prepared as comments): `/representants/*` → `/profils/*`, `/gouvernement/*` → `/profils/*`

---

## File Structure

```
src/
├── app/
│   ├── globals.css              # Theme colors, effects, animations
│   ├── layout.tsx               # Root: fonts, navbar (4 items: Signaux/Profils/Votes/Territoire), footer
│   ├── page.tsx                 # Homepage (ISR 3600)
│   ├── opengraph-image.tsx      # OG 1200×630: platform brand + 8 dossier chips + 3 stats (Session 18/19)
│   ├── signaux/
│   │   └── page.tsx             # Signal feed with filter pills (ISR 3600 — Session 39)
│   ├── profils/
│   │   ├── page.tsx             # People hub index (ISR 86400 — Session 39)
│   │   ├── deputes/             # Copies of /representants/deputes with updated links
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── senateurs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── ministres/page.tsx   # Copy of /gouvernement with updated links (ISR 3600)
│   │   ├── [slug]/page.tsx      # Copy of /gouvernement/[slug] with updated links
│   │   ├── elus/page.tsx
│   │   ├── lobbyistes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── partis/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── comparer/page.tsx    # Deputy comparison (copy of /comparer/deputes)
│   ├── dossiers/
│   │   ├── medias/page.tsx          # Media ownership concentration (Session 35 — surviving)
│   │   └── financement-politique/page.tsx  # Political financing (Session 37 — surviving)
│   ├── representants/               # Legacy — Phase 6 removal pending
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
│   │   ├── lois/
│   │   │   ├── page.tsx         # Parliamentary Laws hub (ISR 3600 — Session 33)
│   │   │   └── [slug]/page.tsx  # Law detail (Session 33)
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
│   ├── media-board.tsx          # Client: interactive media owner cards with filter pills (Session 35)
│   ├── concentration-chart.tsx  # Server: CSS horizontal stacked bars by media type (Session 35)
│   ├── camembert-chart.tsx      # Server: SVG donut chart for media group share (Session 35)
│   ├── mobile-nav.tsx           # Client: hamburger menu + full-screen overlay (Session 35)
│   ├── loi-card.tsx             # Server: law card with type badge + inline GroupBar (Session 33)
│   ├── scrutin-accordion.tsx    # Client: expandable scrutin list for law detail (Session 33)
│   ├── group-expander.tsx       # Client: expandable party vote breakdown (Session 33)
│   ├── conflict-drilldown.tsx   # Client: expandable per-tag vote list on Transparence tab (Session 37)
│   └── gouvernement/            # Phase 9 section components (all async server components)
│       ├── interets-section.tsx # Server: HATVP interests grouped by rubrique, <details> expander
│       ├── mandats-section.tsx  # Server: government mandate timeline (border-l + dots)
│       ├── career-section.tsx   # Server: career timeline (MandatGouvernemental + Depute/Senateur entries)
│       ├── lobby-section.tsx    # Server: ActionLobby by ministereCode — top orgs/domains, year range
│       ├── judiciaire-section.tsx # Server: verified judicial events (verifie=true only; null if none)
│       └── parliamentary-section.tsx # Server: vote scores + recent votes (deputy) or commissions (senator)
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
    ├── slug.ts                   # generateSlug(prenom, nom) utility (Session 39)
    ├── nuance-colors.ts         # Political nuance code → { color, bg, label } mapping
    ├── alignment.ts             # computeAlignment(): $queryRaw CTE self-join on GroupeVote (7F)
    ├── postal-resolver.ts       # resolvePostalCode(): CP → ResolvedTerritory[] (Session 14)
    ├── president-utils.ts       # getBaselineObservation() + computeDelta() (Phase 6)
    ├── france-map-data.ts       # getFranceMapData(): 4 parallel Prisma queries → Record<string, DeptData> (Phase 8A)
    └── search.ts                # globalSearch(): search_index view + president static injection (7B/Session 18)
```
