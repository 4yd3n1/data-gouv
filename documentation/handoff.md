# Handoff — data-gouv Civic Intelligence Platform

> Updated: Mar 3, 2026 (Session 20). For the next agent picking up this project.

---

## What This Is

A French civic intelligence platform built on Next.js 16 + PostgreSQL. Ingests public open data from data.gouv.fr, INSEE, HATVP, Sénat, and Assemblée Nationale into a single normalized database and exposes it through a dark-themed UI ("Intelligence Bureau" aesthetic). Goal: **maximum transparency through public data**.

---

## Current State — Everything Is Working

The project is fully functional as of this handoff. Dev server runs, all data is ingested, all pages render.

### Data Status (all ingested and verified)

| Layer | Models | Rows |
|-------|--------|------|
| Territory | Region, Departement, Commune | 37,031 |
| Governance | Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste | ~106,500 |
| Economy | Indicateur, Observation | 358 |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies |
| Parliament | Organe, Scrutin, GroupeVote, VoteRecord, Deport | varies |
| Elections & RNE | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 |

**~800,000+ rows across 30 models** (incl. StatLocale, BudgetLocal, ScrutinTag, StatCriminalite, DensiteMedicale added in Phases 1 + 5; `ConflictSignal` added in Phase 7C).

### UI Status (all pages render correctly)

57 routes + 5 OG image routes across 12 sections (build verified Mar 3, 2026, Session 20):

| Section | Routes |
|---------|--------|
| `/` | Homepage — dynamic headline, dossiers grid, recent votes, top conflict signals (ConflictSignal), DeptLookup + postal code CTA |
| `/dossiers` | Hub + 8 thematic issue pages (pouvoir-dachat, confiance-democratique, dette-publique, emploi-jeunesse, logement, sante, transition-ecologique, retraites) |
| `/representants` | Hub + Députés list/detail (4 tabs incl. Transparence with ConflictSignal) + Sénateurs list/detail + Lobbyistes list/detail + Élus locaux + Partis list/detail |
| `/gouvernance` | Redirects to `/representants` (HTTP 308) — Scrutins list/detail stay here |
| `/votes` | Hub + par-sujet/[tag] (13 thèmes) + mon-depute lookup |
| `/elections` | Hub + Législatives 2024 results |
| `/economie` | Dashboard with SVG charts |
| `/territoire` | Region browser + Département dashboard (StatLocale + BudgetLocal + votes) + Commune card |
| `/patrimoine` | Hub + Musées list/detail + Monuments list/detail |
| `/president` | Macron profile — 4 tabs: Promesses (20 curated), Bilan Économique, Lobbying & Agenda, Déclarations HATVP |
| `/mon-territoire` | Civic dashboard by postal code — 3-state: empty prompt / disambiguation / full dashboard (représentants, budget, santé, votes, patrimoine) |
| `/recherche` | Full-text search — `search_index` materialized view (GIN, `french` stemming), entity type pills, color-coded result cards. Navbar `NavSearch` on desktop. |
| `/comparer` | Comparison mode (Phase 7D) — `/comparer/territoires?a=75&b=93` side-by-side département comparison (3 states: empty picker / partial / full); `/comparer/deputes?a=PA*&b=PA*` deputy comparison (4 states incl. name-based search flow). `DeltaBadge` component. "Comparer →" links on `/territoire/[dept]` breadcrumb and `/representants/deputes/[id]` utility bar. |
| OG images (Phase 7E + fixes) | `opengraph-image.tsx` in 5 routes: `/` (homepage — static, 8 dossier chips, 3 stat cards), `/dossiers/logement` (live housing stats from StatLocale + vote count), `/representants/deputes/[id]` (initials + name + stats), `/territoire/[departementCode]` (income/poverty/unemployment), `/gouvernance/scrutins/[id]` (vote bar + result badge). All use `runtime = "nodejs"` + `{ prisma }` named import. `1200×630` bureau-950 background with teal/rose accents. |
| `/votes/alignements` | Party alignment matrix (Phase 7F) — `src/lib/alignment.ts` computes pairwise alignment rates via `$queryRaw` self-join on `GroupeVote`. Page shows: overview stats, color-coded heat map (teal=alliance, rose=opposition), top 5 allies, top 5 opponents, methodology note. Linked from `/votes` hub ("Matrice d'alignement →"). `revalidate = 86400`. |

---

## How to Run

```bash
# Start dev server (auto-uses Node 20.19.2 via .nvmrc)
pnpm dev

# Full re-ingestion (takes ~10 min, all idempotent)
pnpm ingest

# Individual scripts
pnpm ingest:elus         # 593K rows — uses 8GB heap via NODE_OPTIONS
```

**Critical**: Node 20.19.2+ is required for Prisma 7's WASM client. The `pnpm dev` script handles this automatically via nvm + `.nvmrc`. If running scripts directly, use `nvm use 20.19.2` first.

---

## Key Files

| File | Purpose |
|------|---------|
| [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md) | **Master blueprint** — citizen-centric redesign, dossier system, cross-reference engine, 5-phase implementation plan |
| [`arch-plan2.md`](../arch-plan2.md) | **Phase 7 plan** — 6 sub-phases (7A✅ 7B✅ 7C✅ 7D 7E 7F): search, conflict signals, comparison, OG images, alignment matrix |
| [`prisma/schema.prisma`](../prisma/schema.prisma) | 30 models — source of truth for DB structure |
| [`src/lib/db.ts`](../src/lib/db.ts) | Prisma singleton with `@prisma/adapter-pg` |
| [`src/lib/dossier-config.ts`](../src/lib/dossier-config.ts) | 8 thematic dossier definitions (slug, label, tags, lobbyDomains, color, priority) |
| [`src/lib/nuance-colors.ts`](../src/lib/nuance-colors.ts) | Political nuance code → CSS color/label mapping |
| [`src/lib/format.ts`](../src/lib/format.ts) | French number/date formatting (7 functions) |
| [`scripts/ingest.ts`](../scripts/ingest.ts) | Master ingestion orchestrator, 10 waves (Wave 5c: tag-scrutins, Wave 5d: compute-conflicts, Wave 8: insee-local + budgets, Wave 9: criminalite + medecins, Wave 10: refresh search_index) |
| [`scripts/compute-conflicts.ts`](../scripts/compute-conflicts.ts) | Pre-computes `ConflictSignal` table — run after tag-scrutins. `pnpm compute:conflicts`. Exported `computeConflicts()` also called by orchestrator (Wave 5d). |
| [`scripts/lib/sector-tag-map.ts`](../scripts/lib/sector-tag-map.ts) | 15 RegExp patterns mapping company names → ScrutinTag arrays. Used by `compute-conflicts.ts`. |
| [`scripts/refresh-search.ts`](../scripts/refresh-search.ts) | Standalone `REFRESH MATERIALIZED VIEW search_index`. `pnpm refresh:search`. |
| [`src/lib/search.ts`](../src/lib/search.ts) | `globalSearch()` — full-text search via `search_index` materialized view. `entityType` validated against allowlist before SQL interpolation. |
| [`src/components/nav-search.tsx`](../src/components/nav-search.tsx) | Client component — compact navbar search form (`hidden md:flex`), navigates to `/recherche?q=...`. |
| [`next.config.ts`](../next.config.ts) | HTTP 308 redirects: `/gouvernance/*` → `/representants/*` |
| [`src/app/globals.css`](../src/app/globals.css) | Design tokens — bureau palette, teal/amber/rose accents |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Root layout — navbar (7 links incl. Dossiers, Votes, Représentants), footer |
| [`src/data/lobbyists-curated.ts`](../src/data/lobbyists-curated.ts) | Curated power lobbyist profiles — 7 power orgs + 3 consulting firms with `victoireLegislative`, `alerte`, `connexionMacron` |
| [`src/data/president-macron.ts`](../src/data/president-macron.ts) | Static Macron data — BIO, 20 curated campaign promises (10×2017, 10×2022) |
| [`src/lib/president-utils.ts`](../src/lib/president-utils.ts) | `getBaselineObservation()` + `computeDelta()` — reuse for any "before mandate / now" KPI |
| [`src/data/postal-codes.json`](../src/data/postal-codes.json) | Static map: 6,328 postal codes → INSEE commune code list (La Poste Hexasmal, 347KB) |
| [`src/lib/postal-resolver.ts`](../src/lib/postal-resolver.ts) | Resolves postal code → `ResolvedTerritory[]` with ARM→COM parent resolution and deduplication |
| [`src/app/mon-territoire/page.tsx`](../src/app/mon-territoire/page.tsx) | 3-state civic dashboard: empty prompt / disambiguation picker / full civic dashboard |
| [`documentation/frontend.md`](frontend.md) | Full UI reference: all 54 routes, 23 components, design system |
| [`documentation/schema.md`](schema.md) | Full DB reference: all 30 models with fields, indexes, row counts |
| [`CLAUDE.md`](../CLAUDE.md) | Project rules and quick reference for Claude |

---

## Architecture

```
Next.js 16 App Router (TypeScript)
  ↓ async Server Components query Prisma directly
Prisma 7 (WASM client, @prisma/adapter-pg)
  ↓
PostgreSQL 14 — database: datagouv
```

No API routes used for UI — all pages are server components that call Prisma directly at render time. Zero client-side data fetching.

**6 client components** (need `"use client"`): `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`.

**2 static data files** (no DB, curated by hand): `src/data/lobbyists-curated.ts` (10 orgs), `src/data/president-macron.ts` (20 promises + bio).

---

## Design System

"Intelligence Bureau" — dark civic dashboard.

- **Palette**: `bureau-950` to `bureau-100` (deep navy to near-white)
- **Accents**: teal (navigation/data), amber (financial), rose (monuments/alerts), blue (territory)
- **Fonts**: Instrument Serif (display headings) + DM Sans (body)
- **Pattern**: noise overlay + `.grid-bg` + `.card-accent` gradient line
- **Animations**: `.fade-up` stagger on load, `.bar-fill` for score bars

---

## Known Quirks & Decisions

### Node version
Must be 20.19.2+. Prisma 7 WASM requires it. `.nvmrc` pins it. `pnpm dev` auto-switches via nvm.

### ElectionLegislative — no FK to Departement
Overseas constituencies use dept codes like `"ZZ"` (Français établis hors de France) that don't exist in the COG `Departement` table. The FK was intentionally removed (migration `20260301102159_drop_election_dept_fk`). `codeDepartement` is a plain string.

### Depute.departementCode vs departementRefCode
`departementCode` = raw source code (overseas like `"099"`, `"975"` may not be in COG). `departementRefCode` = nullable FK, only set when the code exists in DB. Always use `departementRefCode` for joins.

### ingest:elus memory
The conseiller_municipal CSV has 485K rows — needs 8GB heap. The script uses `NODE_OPTIONS=--max-old-space-size=8192`. Do not change this to `node ... tsx` — `node_modules/.bin/tsx` is a shell script, not a JS file, and causes `SyntaxError: missing ) after argument list`.

### Commune typecom filter
The `Commune` table has 4 types: COM (full communes), ARM (arrondissements), COMD (delegated), COMA (associated). Always filter `where: { typecom: "COM" }` for count displays and general UI.

---

## Architectural Plan — Complete ✅

The platform has been fully redesigned from a **data-source browser** into a **citizen-centric transparency tool**. All 6 phases are complete as of March 1, 2026. Full blueprint: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md).

### The Core Shift (Achieved)

| Before (v1) | After (v2) — Done |
|-------------|------------|
| Organized by data source | Organized by citizen concern |
| Siloed models | Cross-referenced connections |
| National indicators only | Localized to your département (INSEE Données Locales) |
| Deputies and votes separated | Conflict-of-interest detection |
| 593K elus with no context | Local officials linked to commune budgets |
| Homepage: stat grid | Homepage: "what matters right now" |

### 5 Implementation Phases

| Phase | Goal | Status | Key Deliverables |
|-------|------|--------|------------------|
| **1. Foundation** | Data infrastructure | ✅ Done | New models (`StatLocale`, `BudgetLocal`, `ScrutinTag`), INSEE Données Locales API integration, BDM expansion to 15+ indicators, vote topic classification (3,170 tags) |
| **2. Dossiers + Homepage** | Issue-centric pages | ✅ Done | `/dossiers/` section (8 thematic pages), redesigned homepage, 8 new components (`DossierHero`, `DossierNav`, `IndicatorCard`, `TopicVoteList`, `ConflictAlert`, `LobbyingDensity`, `RankingTable`, `DeptLookup`) |
| **3. Enhanced Profiles + Territory** | Cross-referenced profiles | ✅ Done | "Transparence" tab on deputy profiles, route rename `/gouvernance`→`/representants`, full département dashboards (StatLocale + BudgetLocal + votes), commune card page |
| **4. Votes Section** | Dedicated vote exploration | ✅ Done | `/votes/` hub (tag grid + stats + recent scrutins), `/votes/par-sujet/[tag]` (paginated per topic), `/votes/mon-depute` (deputy lookup 3-state), `TimelineChart` SVG component, `DeptMap` ranked component |
| **5. Polish + Data** | Additional sources + quality | ✅ Done | Crime stats (SSMSI → `StatCriminalite`), medical density (DREES → `DensiteMedicale`), ISR caching (`revalidate` on 7 pages), `generateMetadata` on 9 dynamic routes, UI integration in `/dossiers/sante` + `/territoire/[dept]`, Wave 9 in orchestrator |
| **6. Presidential Profile** | Flagship cross-reference page | ✅ Done | `/president` (Macron) — 4-tab architecture: 20 curated promises w/ evidence deltas, before/after economic KPIs, lobby domain × vote cross-reference, HATVP declarations. Static data: `src/data/lobbyists-curated.ts` (10 orgs with `victoireLegislative`, `alerte`, `connexionMacron`) + `src/data/president-macron.ts`. Utility: `src/lib/president-utils.ts` (`getBaselineObservation`, `computeDelta`). Homepage CTA + `/representants` president card. |

### New Data Sources

| Source | API | What It Adds |
|--------|-----|-------------|
| **INSEE Mélodi** | CSV (anonymous, no key needed) | Population, income, poverty, employment, **housing tenure** per département — replaces deprecated DDL API |
| **INSEE BDM expansion** | SDMX (existing infra) | Inflation, wages, housing permits, debt trajectory (15+ series) |
| **DGFIP Finances Locales** | CSV on data.gouv.fr | Commune/dept budgets since 2000 |
| **SSMSI** | CSV on data.gouv.fr | Crime stats by département |
| **DREES** | CSV | GP density per commune |

### 5 Cross-Reference Systems

1. **Conflict of Interest** — `DeclarationInteret` + `ParticipationFinanciere` → `VoteRecord` + `ScrutinTag`: surface officials voting on topics matching their declared financial interests
2. **Lobbying → Votes** — `ActionLobbyiste.domaine` → `ScrutinTag.tag` → `GroupeVote`: lobbying intensity vs. legislative activity per domain
3. **Party Finances → Elections** — `PartiPolitique` → `CandidatLegislatif.nuance` → `ElectionLegislative`: party spending power vs. electoral outcomes
4. **Territory → Everything** — `Departement` → deputies + senators + elus + demographics + budget + culture: complete département dashboard
5. **Deputy Accountability** — `Depute` + `VoteRecord` + `ScrutinTag` + `DeclarationInteret` + `Deport`: factual transparency profile

### Achieved Scale

| Metric | Original | Achieved |
|--------|---------|--------|
| Models | 22 | **30** (incl. `ConflictSignal` — 7C) |
| Total rows | ~800K | **~800K+** |
| Routes | 22 | **57** (incl. `/recherche` 7B, `/comparer` 7D, `/votes/alignements` 7F) |
| Components | 12 | **23** (incl. `NavSearch` — 7B) |
| Data sources | 7 | **12** (added INSEE Mélodi, SSMSI, DREES, DGFIP) |
| Cross-references | 0 | **5 systemic + 1 pre-computed** (conflict, lobbying→votes, party finances, territory, deputy accountability + `ConflictSignal` materialised table) |

### Remaining Work (low priority)

| Task | Script | Priority |
|------|--------|----------|
| DGFIP local budgets | `pnpm ingest:budgets` | ✅ DONE — 69,023 rows (380 depts + 68,643 communes), OFGL Opendatasoft source |
| Crime stats | `pnpm ingest:criminalite` | MEDIUM — StatCriminalite empty |
| Medical density | `pnpm ingest:medecins` | MEDIUM — DensiteMedicale empty |
| DEP 36 (Indre) retry | `pnpm ingest:insee-local` | LOW — lost to rate limit, 11/12 stats present |
| Deputy profile enrichment | Edit `/representants/deputes/[id]/page.tsx` | MEDIUM — 2 remaining: (1) Activité tab: "Domaines d'activité" bar (ScrutinTag groupBy), (2) Transparence tab: lobby cross-reference (matchDomainToTag). Item 3 (ConflictAlert from `ConflictSignal`) ✅ DONE in 7C |
| Senator profile enrichment | Edit `/representants/senateurs/[id]/page.tsx` | MEDIUM — 2 items: (1) New "Transparence" tab with DeclarationInteret × lobby cross-ref, (2) Déclarations tab: ConflictAlert using `ConflictSignal` |
| Phase 7D — Comparison mode | `src/app/comparer/territoires/page.tsx` + `comparer/deputes/page.tsx` | ✅ DONE — side-by-side département or député comparison, `DeltaBadge` highlighting |
| Phase 7E — OG images | `opengraph-image.tsx` in 5 routes | ✅ DONE — deputies, depts, scrutins (Session 17) + homepage + logement (Session 18/19) |
| Phase 7F — Alignment matrix | `src/app/votes/alignements/page.tsx` | ✅ DONE — heat map + `src/lib/alignment.ts` (Session 17) |
| Run `pnpm compute:conflicts` | Post-ingestion | REQUIRED — `ConflictSignal` table is empty until this runs after `tag:scrutins`. Run once after full ingest. |

**Full plans**: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md) (Phases 1–6) · [`arch-plan2.md`](../arch-plan2.md) (Phase 7)

---

## Known Quirks — Phase 2/3 Additions

### Route duality: /gouvernance and /representants both exist
Both directories serve content. `/gouvernance` has the original files (kept for scrutins at `/gouvernance/scrutins/*`). `/representants` is the canonical new path for deputes/senateurs/elus/lobbyistes/partis. HTTP 308 redirects in `next.config.ts` handle old `/gouvernance/*` URLs. Do not remove `/gouvernance/scrutins` — it's still the active route, linked from many pages.

### StatLocale is populated (1,408 rows); BudgetLocal is populated (69,023 rows)
`StatLocale` was ingested via `pnpm ingest:insee-local`. No API key required — uses Mélodi "libre" plan anonymously. Mayotte (976) has no Mélodi data at all. A handful of depts (08, 18, 27, 33, 42, 50, 58, 68, 77, 94) occasionally lose 1–2 datasets to rate-limit exhaustion on burst runs — safe to re-run idempotently.

**Indicators**: FILOSOFI (income/poverty 2021), RP Population (2022), RP Employment (2022), **RP Housing (2022 — Session 18/19)**. New housing indicators: `HOUSING_TOTAL` (NB), `HOUSING_VACANCY_RATE` (%), `HOUSING_SECONDARY_RATE` (%). Dataset: `DS_RP_LOGEMENT_PRINC` (OCS column: `_T` = total, `DW_VAC` = vacant, `DW_SEC_DW_OCC` = secondary). Avg vacancy rate 8.7%, avg secondary rate 11.5% across 95 depts.

Housing data is now shown in:
- `/dossiers/logement` — Section 3 "Parc immobilier par territoire" (two `RankingTable`s + 2 `IndicatorCard`s for national averages)
- `/territoire/[departementCode]` — 2 new `StatCard`s in the Économie section (vacants + résidences secondaires)
`BudgetLocal` was ingested via `pnpm ingest:budgets` (Session 12). Source: **OFGL Opendatasoft API** (original data.collectivites-locales.gouv.fr URLs were dead). 380 département records + 68,643 commune records (2022 + 2023 for ~34K communes). `/territoire/[dept]`, `/territoire/commune/[code]`, and `/dossiers/dette-publique` are now fully populated.

### ARM communes — postal code to commune resolution

Paris (75001–75020), Lyon (1st–9th), and Marseille (1st–16th) are arrondissements in the COG with `typecom: "ARM"`. They have a `comparent` field pointing to the parent COM code (75056, 69123, 13055). When resolving postal codes (`src/lib/postal-resolver.ts`), ARM communes must be detected and replaced with their parent COM — otherwise you get arrondissement INSEE codes that don't represent the actual city. `src/data/postal-codes.json` maps postal codes to the raw INSEE codes from La Poste (which include ARM codes); the resolver does the parent substitution.

### `search_index` materialized view — field name gotchas

The migration SQL uses `Depute."groupe"` (not `groupePolitique`) and `Lobbyiste."categorieActivite"` (not `categorie`). Wrong field names in the view SQL cause silent empty strings (no error), not a build failure. The `globalSearch()` function in `src/lib/search.ts` uses an `entityType` allowlist — **never** interpolate raw user input into the SQL query. `REFRESH MATERIALIZED VIEW search_index` must be run after re-ingestion (`pnpm refresh:search` or automatically via Wave 10 in `pnpm ingest`).

### `ConflictSignal` is empty until `compute:conflicts` runs

After a fresh ingestion or after running `pnpm ingest:declarations` + `pnpm tag:scrutins`, you must run `pnpm compute:conflicts` to populate the `ConflictSignal` table. Until then, the homepage, `/dossiers/confiance-democratique`, and deputy Transparence tabs show empty states (graceful degradation, no errors). This is by design — the fallback to live `DeclarationInteret` queries is intentional.

### `{ prisma }` is a named export

`src/lib/db.ts` exports `prisma` as a **named export**: `export const prisma = ...`. Always import as `import { prisma } from "@/lib/db"`. Using `import prisma from "@/lib/db"` (default import) will cause a build error: `Export default doesn't exist in target module`.

### Scrutin relation is `votes` not `voteRecords`
The `Scrutin` model has `votes VoteRecord[]` — always use `votes` in Prisma where clauses. Using `voteRecords` causes a TypeScript build error.

### Elu field names
`Elu.codeDepartement` (not `departementCode`), `Elu.codeCommune` (not `communeCode`).

### Curated data editorial policy
`src/data/lobbyists-curated.ts` and `src/data/president-macron.ts` are **factual only** — no editorial labels, no verdicts. State the fact ("Marie-Anne Barbat-Layani, DG de la FBF, nommée présidente de l'AMF") and let the reader draw the conclusion. Never use loaded terms ("pantouflage", "conflit d'intérêt avéré") as labels — use `alerte` to surface the raw structural fact. UI copy throughout uses classic French register (Le Monde / Libération style), not slang or bureaucratic language.

---

## Work History

### Session 17 (Mar 2, 2026) — Sub-phases 7E + 7F: OG Images + Alignment Matrix

**7E — Dynamic OG Image Templates** (+3 image endpoints, same route count):

1. **`src/app/representants/deputes/[id]/opengraph-image.tsx`** (NEW) — 1200×630. Left: avatar (photoUrl or initials circle) + name + party + département. Right: 3 stat cards (participation %, vote count, conflict count — rose if >0). Bottom: branding bar.

2. **`src/app/territoire/[departementCode]/opengraph-image.tsx`** (NEW) — 1200×630. Header: dept code + name + region. Stats row: revenu médian (teal), taux de pauvreté (rose if >20%), chômage (amber if >12%). Footer: deputeCount + senateurCount + eluCount. Fixed: `Departement` has no `regionNom` — uses `region: { select: { libelle: true } }` relation.

3. **`src/app/gouvernance/scrutins/[id]/opengraph-image.tsx`** (NEW) — 1200×630. Badge: ADOPTÉ (teal) / REJETÉ (rose). Title truncated to 120 chars. Proportional pour/contre bar (800px total). Vote counts with percentages. Top accent line color matches result.

All three: `export const runtime = "nodejs"` (Prisma needs Node runtime), `{ prisma }` named import, `export const size = { width: 1200, height: 630 }`, `export const contentType = "image/png"`, `params: Promise<...>` (Next.js 16 async params).

**7F — Party Alignment Matrix** (+1 route → 57 total):

4. **`src/lib/alignment.ts`** (NEW) — Exports `computeAlignment(minShared = 5)`. Uses `prisma.$queryRaw` with a CTE self-join on `GroupeVote` filtered to `Organe.codeType = 'GP'`. Dominant position = whichever of `pour`/`contre` is strictly higher; groups with `abstentions` as highest are excluded from that scrutin's pair count. Returns `{ pairs: AlignmentPair[], groups: GroupInfo[] }` with groups ordered by total vote volume (size proxy).

5. **`src/app/votes/alignements/page.tsx`** (NEW, ~270 lines) — `revalidate = 86400`. Calls `computeAlignment()`. Renders: overview stat cards (groups, pairs, avg alignment, max shared scrutins), color legend, N×N heat map table (diagonal = 100% in teal, no-data = "—", data cells colored by rate with `title` tooltip showing raw counts), top 5 allies list (teal), top 5 opponents list (rose), methodology note. Empty state if no data (with `pnpm ingest:scrutins` hint). Color scale: ≥88% deep teal → ≥74% light teal → ≥56% neutral → ≥38% light rose → <38% deep rose.

6. **`src/app/votes/page.tsx`** (MODIFIED) — Added "Matrice d'alignement →" link alongside existing "Trouver mon député →" in the tag grid header.

**Build**: 57 routes (+ 3 OG image endpoints in build output), zero TypeScript errors.

---

### Session 20 (Mar 3, 2026) — QA fixes: party page crash + homepage OG

**Bug fix — `/representants/partis/[id]`**: `generateMetadata` was calling `parseInt(id, 10)` on a CUID string (e.g. `cmm7lp62w0057qkvp6kg0ahhl`), producing `NaN`, which Prisma rejected as an invalid `Int` for the `codeCNCC` field → server exception visible in browser. Fixed by replacing `findFirst({ where: { codeCNCC: parseInt(id) } })` with `findUnique({ where: { id } })`, consistent with the page component itself. File: `src/app/representants/partis/[id]/page.tsx`.

**New OG image — `/opengraph-image`**: Static homepage OG image (`src/app/opengraph-image.tsx`) was missing — route returned 404. Created 1200×630 static image: platform brand ("L'Observatoire Citoyen"), tagline, 8 dossier chips grid, 3 stat cards (800K+ données, 57 tableaux, 8 dossiers). No DB query.

(Note: `/dossiers/logement/opengraph-image` was committed in Session 18/19 and was already present — the 404 in the original QA sweep was a dev-server cache artifact.)

**Build**: 57 routes + 5 OG image routes, zero TypeScript errors.

---

### Sessions 18/19 (Mar 3, 2026) — GEO-LOG housing data + OG image fixes + documentation

**INSEE RP Housing ingest** — `DS_RP_LOGEMENT_PRINC` via Mélodi API. Added `fetchLogementDep()` to `scripts/lib/insee-client.ts`. OCS column: `_T` = total, `DW_VAC` = vacant, `DW_SEC_DW_OCC` = secondary residence (no tenure/owner data in this dataset). New `StatLocale` indicators: `HOUSING_TOTAL` (NB), `HOUSING_VACANCY_RATE` (%), `HOUSING_SECONDARY_RATE` (%). 222 new rows (95 depts × up to 3 indicators — some lost to rate-limit). National averages: vacancy 8.7%, secondary 11.5%.

**UI additions**:
- `/dossiers/logement` — Section 3 "Parc immobilier par territoire": two `RankingTable`s (vacancy top-10, secondary top-10) + 2 `IndicatorCard`s for national averages.
- `/territoire/[departementCode]` — 2 `StatCard`s in Économie section (logements vacants, résidences secondaires). `hasEconomie` guard expanded to include housing indicators.

**OG images**:
- `src/app/opengraph-image.tsx` (NEW) — static homepage brand image, 8 dossier chips, 3 stat cards.
- `src/app/dossiers/logement/opengraph-image.tsx` (NEW) — async, queries `StatLocale` avg vacancy/secondary rates + `ScrutinTag` vote count.

**Documentation pass**: `ARCHITECTURAL-PLAN.md`, `documentation/handoff.md`, `documentation/frontend.md`, `documentation/schema.md` all updated to reflect StatLocale 1,408 rows, 5 OG routes, and 5 previously undocumented models (StatLocale, BudgetLocal, ScrutinTag, StatCriminalite, DensiteMedicale).

**Build**: 57 routes + 5 OG image routes, zero TypeScript errors.

---

### Session 16 (Mar 2, 2026) — Sub-phase 7D: Comparison Mode

**7D — Comparison Mode** (+2 routes → 56 total):

1. **`src/components/delta-badge.tsx`** (NEW) — `DeltaBadge` component. Shows percentage difference (`+N.N %` / `-N.N %`) in teal. Always shown on the "winning" side; caller decides which side that is. Props: `value` and `reference` (both nullable).

2. **`src/app/comparer/territoires/page.tsx`** (NEW, ~380 lines) — 3-state département comparison:
   - **State 1** (no params): picker form with two dept code inputs + 4 suggested comparisons.
   - **State 2** (`?a=XX` only): left shows dept A summary card with key stats; right shows input form for dept B (form has `<input type="hidden" name="a">` so GET preserves both).
   - **State 3** (`?a=XX&b=YY`): full comparison — split hero with both names, then `CompareSection` + `MetricRow` layout for Identité, Population, Économie, Budget, Santé, Représentation, Patrimoine. `DeltaBadge` shown on the better side; background `bg-teal/5` highlights the winning cell. `higherIsBetter=false` for poverty/debt/unemployment.

3. **`src/app/comparer/deputes/page.tsx`** (NEW, ~420 lines) — 4-state deputy comparison:
   - **State 1** (no params): search form for deputy A (`?qa=name`).
   - **State `?qa=name`**: list of matching deputies to pick as A.
   - **State `?a=PA*`**: shows deputy A card + search form for B (`?a=PA*&qb=name`).
   - **State `?a=PA*&qb=name`**: shows deputy A + matching list for B.
   - **State `?a=PA*&b=PA*`**: full comparison — scores, votes-by-tag side-by-side bars, transparence metrics, last 10 shared scrutins with accord/désaccord indicator. Deputy B values highlighted in amber (vs teal for deputy A) for visual distinction.

4. **`src/app/territoire/[departementCode]/page.tsx`** (MODIFIED) — Added `Comparer →` link on right side of breadcrumb nav (`ml-auto`), pointing to `/comparer/territoires?a={code}`.

5. **`src/app/representants/deputes/[id]/page.tsx`** (MODIFIED) — Added slim utility bar between `ProfileHero` and tab content with "Comparer avec un autre député →" link pointing to `/comparer/deputes?a={id}`.

**Build**: 56 routes (55 in build output + `/_not-found`), zero TypeScript errors.

---

### Session 15 (Mar 2, 2026) — Sub-phases 7B + 7C: Global Search + ConflictSignal

**7B — Global Search** (54 routes, +1 `/recherche`):

1. **`prisma/migrations/20260302000000_add_search_index/migration.sql`** (NEW) — PostgreSQL `MATERIALIZED VIEW search_index` with GIN index (`french` text search). 6 entity types: `depute`, `senateur`, `lobbyiste`, `scrutin`, `commune` (COM only), `parti`. Critical field names: `Depute.groupe` (NOT `groupePolitique`), `Lobbyiste.categorieActivite` (NOT `categorie`).

2. **`src/lib/search.ts`** (NEW) — `globalSearch(query, limit, entityType?)`. `entityType` validated against `VALID_ENTITY_TYPES` allowlist before SQL string interpolation — injection-safe. Returns `{ entityType, entityId, title, subtitle, url, rank }[]`.

3. **`src/components/nav-search.tsx`** (NEW, client component) — Compact search form inserted in navbar. `hidden md:flex` — intentionally desktop-only (narrow-viewport "not visible" is expected behavior). Controlled input + `useRouter().push()` on submit (2-char min).

4. **`src/app/recherche/page.tsx`** (NEW) — Results page: entity type pills (`?type=` param), color-coded cards per entity type, empty state (no `q`) + no-results state, `generateMetadata` with query in title.

5. **`src/app/layout.tsx`** (MODIFIED) — `<NavSearch />` inserted between logo and nav links.

6. **`scripts/ingest.ts`** (MODIFIED) — Wave 10 added (final step): `REFRESH MATERIALIZED VIEW search_index`.

7. **`scripts/refresh-search.ts`** + `pnpm refresh:search` script added.

**Key bug**: `Depute.groupePolitique` and `Lobbyiste.categorie` don't exist — correct fields are `groupe` and `categorieActivite`. Build fails silently in the migration SQL if wrong (view just returns empty subtitle string), but TypeScript would error in query code.

---

**7C — ConflictSignal** (no new routes):

1. **`prisma/schema.prisma`** (MODIFIED) — New `ConflictSignal` model (30th model). Unique constraint: `(nom, prenom, typeMandat, secteurDeclaration, tag)`. `deputeId` is `String?` — `Depute.id` is `PA*` format, not integer.

2. **`prisma/migrations/20260302120000_add_conflict_signal/migration.sql`** (NEW) — table + 4 indexes (typeMandat, tag, deputeId, participationCount DESC).

3. **`scripts/lib/sector-tag-map.ts`** (NEW) — 15 RegExp patterns mapping company names from `ParticipationFinanciere.nomSociete` → ScrutinTag tag arrays (e.g., `/énergie|pétrole|nucléaire.../` → `["ecologie", "budget"]`).

4. **`scripts/compute-conflicts.ts`** (NEW) — Exported `computeConflicts()`. Algorithm: load all `DeclarationInteret` with `totalParticipations > 0` + include `participations` → group by `nomSociete` → `matchSectorToTags()` → for each (deputeId, tag) count `VoteRecord` → upsert `ConflictSignal`. Also has `require.main === module` standalone entrypoint for `pnpm compute:conflicts`.

5. **`scripts/ingest.ts`** (MODIFIED) — Wave 5d between tag-scrutins and ingestPhotos: `await computeConflicts()`.

6. **`src/components/conflict-alert.tsx`** (MODIFIED) — Added `href` prop (takes precedence over `declarationId` for link), `votePour`/`voteContre` optional display props.

7. **`src/app/page.tsx`** (MODIFIED) — Homepage "Alertes Transparence" now reads from `prisma.conflictSignal.findMany({ where: { voteCount: { gt: 0 } }, orderBy: { participationCount: "desc" }, take: 3 })` instead of live `declarationInteret` join.

8. **`src/app/dossiers/confiance-democratique/page.tsx`** (MODIFIED) — New "Section 2 — Participations financières × votes" using `topConflictSignals` from `conflictSignal.findMany({ where: { voteCount: { gt: 0 } }, orderBy: { voteCount: "desc" }, take: 10 })`.

9. **`src/app/representants/deputes/[id]/page.tsx`** (MODIFIED) — Transparence tab uses `conflictSignals` from `conflictSignal.findMany({ where: { deputeId: id } })` when populated; graceful fallback to live `DeclarationInteret` loop when table is empty.

**Critical**: `pnpm db:generate` required after migration before `pnpm build` — regenerates Prisma client types. Build fails with `Property 'conflictSignal' does not exist on type 'PrismaClient'` otherwise.

**Note**: `ConflictSignal` table is empty until `pnpm compute:conflicts` runs post-ingestion. All integration points have graceful empty-state fallbacks.

**Build**: 54 routes, zero TypeScript errors.

---

### Session 14 (Mar 2, 2026) — Sub-phase 7A: `/mon-territoire` — Civic Dashboard by Postal Code

1. **`src/data/postal-codes.json`** (NEW, 347KB) — 6,328 French postal codes mapped to lists of INSEE commune codes. Sourced from official La Poste Hexasmal CSV on data.gouv.fr (resource `008a2dda-...`). The datanova.laposte.fr API was rejected (returned only 1,342 codes from dept 01–09). CSV was fetched with `curl | iconv | awk | node` and deduplicated. Format: `{ "75011": ["75111"], "33000": ["33063"], "01000": ["01053", "01344"] }`.

2. **`src/lib/postal-resolver.ts`** (NEW) — Resolves postal code → `ResolvedTerritory[]`. Looks up INSEE codes from the JSON, queries `Commune` with departement+region, then detects ARM communes (`typecom === "ARM"`) and replaces them with their parent COM via `Commune.comparent`. Deduplicates: multiple Paris ARMs all resolve to 75056 (Paris COM).

3. **`src/app/mon-territoire/page.tsx`** (NEW, ~500 lines) — 3-state server page:
   - **State 1** (no params): `SearchInput paramName="cp"` + example codes (Paris 75011, Lyon 69001, Marseille 13001, Bordeaux 33000, Lille 59000, Strasbourg 67000) + link to `/territoire` browser
   - **State 2** (`?cp=` only): calls `resolvePostalCode()` → 0 results = error; 1 result = render dashboard directly; N results = disambiguation list with `?cp=XXX&code=INSEE` links
   - **State 3** (`?code=` present): 13-query `Promise.all` fetching all data layers → full civic dashboard: Mes Représentants (deputes + senateurs + maire), Économie locale (StatLocale), Budget local (commune → dept fallback), Santé & Sécurité (DensiteMedicale + StatCriminalite), Comment votent mes députés (recent scrutins), Patrimoine local (musées + monuments), Explorer plus (links to `/territoire/[dept]`, `/territoire/commune/[code]`, `/votes/mon-depute`)
   - Inline `SectionHeader` + `StatCard` helpers (identical pattern to `/territoire/[departementCode]/page.tsx`)
   - `generateMetadata` returns commune name + dept code when `?code=` is present

4. **`src/app/page.tsx`** (MODIFIED) — Added teal "Tableau de bord par code postal" CTA link below `DeptLookup` in the "Votre Territoire" section, navigating to `/mon-territoire`.

5. **Build**: 53 routes, zero TypeScript errors.

**Key bugs caught during implementation**:
- `import prisma from "@/lib/db"` → must be `import { prisma } from "@/lib/db"` (named export, no default)
- `Elu.prenomElu` / `Elu.nomElu` don't exist → correct fields are `Elu.prenom` / `Elu.nom`
- `DensiteMedicale` query uses `specialite: "MG"` (not `profession: "MG"`)

---

### Session 13 (Mar 2, 2026) — Département Dashboard UX Redesign

1. **Full visual redesign of `/territoire/[departementCode]/page.tsx`** (commit `79d9db7`):
   - **Rich hero** replaces the generic `PageHeader`: département name in display font, region label, decorative dept code (large low-opacity background), and a horizontal key-stats row (Habitants · Communes · Élus locaux · Représentants nationaux · Revenu médian).
   - **Removed duplicate top KPI grid** — the 8-cell grid was redundant with data shown in the hero and individual sections below.
   - **Section headers** — consistent `SectionHeader` helper component: colored left-bar accent + uppercase label + optional sublabel + source note. Each section has a distinct accent color (amber → économie, teal → budget, rose → santé, blue → représentants).
   - **Budget trend chart** — enlarged from 300×50 px to 560×90 px; added gradient area fill (teal→transparent), value labels above each data point, year labels below the baseline, outer ring + inner dot on each point.
   - **Stat cards** — `card-accent` top gradient line, numbers at `text-3xl` (vs `text-xl` before), extracted as `StatCard` helper component.
   - **Représentants section** — list-with-dividers layout replacing separate card blocks; colored avatar rings (blue for AN, teal for Sénat); header row with `card-accent`.
2. **Build**: 52 routes, zero TypeScript errors.

---

### Session 12 (Mar 1, 2026) — BudgetLocal Ingestion (OFGL)

1. **Rewrote `scripts/ingest-budgets.ts`** — Original URLs (`data.collectivites-locales.gouv.fr`) are dead. New source: **OFGL Opendatasoft API** with targeted filtered queries per année + type (commune/département).
2. **Regenerated Prisma client** — `pnpm db:generate` needed for `prisma.budgetLocal` to resolve after schema was already migrated.
3. **Ingested 69,023 BudgetLocal rows** — 380 département records + 68,643 commune records (2022 + 2023 for ~34K communes).
4. **Pages now live**: `/territoire/[dept]` budget section (4 KPIs + 4-year trend), `/territoire/commune/[code]` budget communal (6 KPIs), `/dossiers/dette-publique` top-10 ranked bar.
5. **Sample data**: Paris 2020–2023 dépenses €3,776 → €4,187 → €4,300/hab, dette €3,519 → €4,579/hab. Top indebted depts: Paris, Cantal, Dordogne, Nièvre, Seine-Saint-Denis.

### Session 11 (Mar 1, 2026) — Lobbying Data Enrichment + Consulting Firm Profiles

1. **Corrected Boury Tallon founder names** — Previous data had wrong names ("Thierry Boury + Jean-Michel Tallon"). Corrected to Paul Boury (HEC, founded 1987) + Pascal Tallon (HEC, DG from 2000). Firm renamed in 2012. Added: both founders co-created AFCL (1991, French lobbying industry's self-regulatory body) and held AFCL presidency — noted as conflict in the `alerte` field.
2. **Enriched Anthenor Public Affairs** — Updated leader to Timothé de Romance (CEO since 2021). Added `connexionMacron` field: founder Gilles Lamarque (Sciences Po + INSEAD) came from MEDEF → Publicis European affairs → Renault public affairs, and current CEO teaches lobbying at Sciences Po Paris. Added *société à mission* status to note. Corrected sector details (ANSM, CEPS, DGAC, DGITM).
3. **Enriched Lysios Public Affairs** — Corrected name to "Lysios Public Affairs", updated to 30+ consultants across Paris + Brussels (not 24), added founding year (2003), Brussels expansion (2007), EPACA membership.
4. **Updated consulting card rendering** (`src/app/president/page.tsx`) — Cards now display: Direction / Réseau & parcours / À noter / amber conflict alert (when `alerte` set). Previously showed only secteur + note.
5. **Neutrality policy** — Removed "pantouflage" label from FBF entry; replaced with neutral factual description of Marie-Anne Barbat-Layani's move from FBF DG to AMF president. Platform principle: state facts, let the reader conclude. No editorial labels on any curated content.
6. **Build**: 52 routes, zero TypeScript errors.

### Session 10 (Mar 1, 2026) — Phase 6: Presidential Profile + Lobbying Intelligence

1. **`/president` page** — Macron profile: 4 tabs (`promesses`, `bilan`, `lobbying`, `declarations`). ProfileHero with 4 summary stats. Tab navigation via existing `ProfileTabs` + `Suspense`.
2. **`src/data/president-macron.ts`** — 20 curated campaign promises (10 × 2017, 10 × 2022) with `indicateurCode`, `scrutinTag`, `status`, `statusNote`. Static BIO object.
3. **`src/data/lobbyists-curated.ts`** — New static file: `POWER_LOBBYISTS` (7 orgs — MEDEF, FNSEA, Mutualité, FFA, CNB, FBF, SER) + `CONSULTING_LOBBYISTS` (3 firms) with `victoireLegislative`, `alerte`, `connexionMacron` fields. Research via 5 parallel background agents covering all major legislation under Macron's two mandates.
4. **`src/lib/president-utils.ts`** — `getBaselineObservation(observations, targetDate)` + `computeDelta(baseline, current, unit)` — reuse for any "before mandate / now" KPI on other profile pages.
5. **`LOBBY_DOMAIN_KEYWORDS` + `matchDomainToTag()`** in `president/page.tsx` — cross-reference HATVP action domains to ScrutinTag vocabulary; shows "N votes parlementaires sur ce thème" per domain.
6. **Homepage + `/representants` hub** — Amber "Profil Macron — Exemple →" CTA added to homepage hero; amber president card added at top of `/representants` hub.
7. **`ActionLobbyiste` has no DateTime** — lobbying stats are all-time; `periode` is free text only. Cannot filter by mandate period.
8. **Build**: 52 routes, zero TypeScript errors.

### Session 9 (Mar 1, 2026) — Documentation, Bug Fixes, Full Commit

1. **Fixed stale Prisma client** — `TypeError: Cannot read properties of undefined (reading 'findFirst')` on `/territoire/[dept]` caused by dev server caching pre-Phase-5 client. Fix: kill + restart `pnpm dev`. `/territoire/75` confirmed 200 after restart.
2. **Updated `ARCHITECTURAL-PLAN.md`** — All 5 phase headers marked `✅ COMPLETE (March 1, 2026)`. "What We Have" table expanded to 29 models. "What's Missing" converted to resolution tracker with remaining ingestion tasks. Route count updated to 50. INSEE Priority 1 section migrated to Mélodi API details. Appendix A URL corrected.
3. **Rewrote `documentation/frontend.md`** — Full rewrite: 50 routes (up from 22), 22 components (up from 12), all new sections (dossiers, representants, votes, territoire commune), ISR revalidation table, generateMetadata patterns, complete component API signatures.
4. **Committed all work** — 64 files staged and committed (commit `8b9dda5`): all Phase 1–5 code (schema, migrations, ingestion scripts, routes, components, lib), updated documentation, CLAUDE.md, next.config.ts.
5. **Updated `documentation/handoff.md`** — This file: Session 9 entry, 27→29 models, achieved vs. target scale, all phases marked complete, remaining work table.

### Session 8 (Mar 1, 2026) — INSEE Mélodi Migration + StatLocale Ingestion

1. **Identified DDL deprecation** — INSEE portal screenshot confirmed `Données Locales V0.1` is no longer updated; data now in Mélodi. `Mélodi "libre" plan is fully anonymous — no API key required`.
2. **Rewrote `scripts/lib/insee-client.ts`** — Migrated from DDL (JSON/Cellule[]) to Mélodi (semicolon CSV, BOM-safe). Three new datasets:
   - `DS_FILOSOFI_CC` → `MED_SL`, `PR_MD60`, `D1_SL`, `D9_SL`, `IR_D9_D1_SL` (FILOSOFI 2021)
   - `DS_RP_POPULATION_PRINC` → `POP_TOTAL`, `POP_65PLUS`, `POP_0019`, `POP_1564` (Recensement 2022)
   - `DS_RP_EMPLOI_LR_PRINC` → `UNEMPLOYMENT_RATE_LOCAL`, `ACTIVITY_RATE`, `EMPLOYMENT_RATE` computed from `EMPSTA_ENQ` counts (Recensement 2022)
3. **Rewrote `scripts/ingest-insee-local.ts`** — Removed `INSEE_API_KEY` requirement entirely; script now runs with zero config.
4. **Ran ingestion** — `pnpm ingest:insee-local` completed: **1,186 StatLocale rows** across 101 départements in 347s. DEP 36 (Indre) lost population rows to rate-limit exhaustion; Mayotte (976) has no Mélodi data (0 rows). All other 99 depts: 12 stats each.
5. **No DB schema changes** — `StatLocale` model unchanged; upsert logic handles new data transparently.

### Session 7 (Mar 1, 2026) — Phase 5: Polish + New Data Sources

1. **`StatCriminalite` + `DensiteMedicale` models** — Added to Prisma schema, migration `20260301170607_add_statcriminalite_densitemedicale` applied.
2. **`scripts/ingest-criminalite.ts`** — SSMSI static CSV (semicolon-delimited, French decimal commas), maps 8 crime indicator labels to internal codes, batch upserts to `StatCriminalite`.
3. **`scripts/ingest-medecins.ts`** — DREES Opendatasoft API for medical professional demographics by département; maps 6 profession types (MG, SPEC, INFIRMIER, DENTISTE, PHARMACIEN, KINESITHERAPEUTE) to `DensiteMedicale`.
4. **`generateMetadata`** — Added to 9 dynamic routes: deputes/[id], senateurs/[id], lobbyistes/[id], partis/[id], territoire/[dept], territoire/commune/[code], gouvernance/scrutins/[id], representants/scrutins/[id], musees/[id], monuments/[id].
5. **ISR revalidation** — `export const revalidate` added to 7 static-ish pages: homepage (1h), votes hub (1h), economie (24h), representants hub (24h), dossiers hub (24h), patrimoine hub (24h), territoire hub (24h). `/votes/par-sujet/[tag]` (1h) and `/dossiers/sante` (24h) also added.
6. **UI integration** — `/dossiers/sante` now shows MG density `DeptMap` (live data or fallback). `/territoire/[dept]` now shows Santé & Sécurité section (MG density + crime stats).
7. **Orchestrator updated** — Wave 9 in `ingest.ts`: `Promise.all([ingestCriminalite(), ingestMedecins()])`. New npm scripts: `ingest:criminalite`, `ingest:medecins`.
8. **Build**: 50 routes, zero TypeScript errors.

### Session 6 (Mar 1, 2026) — Phase 4: Votes Section

1. **`/votes` hub** — Overview page: 4 summary stats, 13-tag grid (each linking to `/votes/par-sujet/[tag]`), 8 recent scrutins with tag chips, "Mon député" CTA.
2. **`/votes/par-sujet/[tag]`** — Topic scrutins with pagination: adopted/rejected stats, vote bars per scrutin, related tags footer, links to full scrutin detail.
3. **`/votes/mon-depute`** — Deputy vote lookup: 3-state URL-driven page (empty prompt → name search list → selected deputy detail with position breakdown + tag chart + recent votes).
4. **`TimelineChart`** (`src/components/timeline-chart.tsx`) — Server-side SVG polyline chart with area fill, y-axis labels, configurable color/unit/showEvery.
5. **`DeptMap`** (`src/components/dept-map.tsx`) — Ranked horizontal bar chart for département data, configurable limit/color/unit/linkBase.
6. **Build**: 53 routes, zero TypeScript errors.

### Session 5 (Mar 1, 2026) — Phase 3: Enhanced Profiles + Territory + Route Rename
1. **Deputy "Transparence" tab** — 4th tab on `/representants/deputes/[id]`: declared financial interests (ConflictAlert), vote theme breakdown (13-tag bar chart), déports. Queries `scrutinTag.groupBy` + `voteRecord.count`.
2. **Enhanced département dashboard** — Full rewrite of `/territoire/[departementCode]/page.tsx`: StatLocale (median income, poverty, unemployment), BudgetLocal (4 KPIs + SVG polyline trend chart), recent votes via `Scrutin.votes` relation, elu count.
3. **Route rename** — `src/app/gouvernance/` copied to `src/app/representants/`, all internal links updated, HTTP 308 redirects added in `next.config.ts`. Nav updated to "Représentants". Scrutins remain at `/gouvernance/scrutins`.
4. **Commune card page** — New `/territoire/commune/[communeCode]/page.tsx`: elu list (maires + conseillers), BudgetLocal (6 KPIs), musées, monuments.
5. **Build**: 50 routes, zero TypeScript errors.

### Session 4 (Mar 1, 2026) — Phase 1 + Phase 2: Data Infrastructure + Dossier System
1. **Phase 1 — Schema + Ingestion**: Added `StatLocale`, `BudgetLocal`, `ScrutinTag` models (migration `20260301152351`). Created `scripts/tag-scrutins.ts` (3,170 tags), expanded `ingest-economie.ts` (12 new BDM series), created `ingest-budgets.ts`, `scripts/lib/insee-client.ts`, `ingest-insee-local.ts`. Updated orchestrator with Wave 5c + Wave 8.
2. **Phase 2 — Dossiers + Homepage**: Created `src/lib/dossier-config.ts` (8 dossiers). Built 8 components: `DossierHero`, `DossierNav`, `IndicatorCard`, `TopicVoteList`, `LobbyingDensity`, `ConflictAlert`, `RankingTable`, `DeptLookup`. Created `/dossiers` hub + all 8 dossier pages. Full homepage redesign. Updated nav to 7 links.
3. **Build**: 40 routes, zero errors.

### Session 3 (Mar 1, 2026) — Architectural Plan
1. **Researched French citizen concerns** — mapped top 11 issues (Ipsos, CEVIPOF, IFOP polls) to available data
2. **Identified cross-reference opportunities** — 5 systemic cross-references from existing data
3. **Researched INSEE APIs** — Données Locales (per-commune demographics), BDM expansion (150K+ series), DGFIP finances locales
4. **Created `ARCHITECTURAL-PLAN.md`** — 650+ line master blueprint: vision, schema evolution, dossier system, implementation phases, technical specs

### Session 2 (Mar 1, 2026) — Elections & RNE Layer
1. **Added Phase 7 models** — Elu (593K), ElectionLegislative (1,078), CandidatLegislatif (5,103), PartiPolitique (2,180)
2. **Built ingestion scripts** — `ingest-elus.ts`, `ingest-elections.ts`, `ingest-partis.ts`
3. **Built new pages** — `/elections` hub, `/elections/legislatives-2024`, `/gouvernance/elus`, `/gouvernance/partis` + detail pages
4. **Created `nuance-colors.ts`** — 20 political nuance codes with color/label mapping
5. **Fixed `ingest:elus` OOM** — 8GB heap via `NODE_OPTIONS`

### Session 1 (Feb 28, 2026) — Foundation + Profile Redesign
1. **Initial platform build** — schema, 7 data layers, ingestion pipeline, 19 routes
2. **Profile page redesign** — `ProfileHero` + `ProfileTabs` pattern for deputies and senators
3. **Created documentation** — `schema.md`, `frontend.md`, `CLAUDE.md`
