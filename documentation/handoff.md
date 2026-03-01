# Handoff — data-gouv Civic Intelligence Platform

> Updated: Mar 1, 2026 (Session 9). For the next agent picking up this project.

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

**~800,000+ rows across 29 models** (incl. StatLocale, BudgetLocal, ScrutinTag, StatCriminalite, DensiteMedicale added in Phases 1 + 5).

### UI Status (all pages render correctly)

50 routes across 8 sections (build verified Mar 1, 2026, Session 9):

| Section | Routes |
|---------|--------|
| `/` | Homepage — dynamic headline, dossiers grid, recent votes, conflict alerts, DeptLookup |
| `/dossiers` | Hub + 8 thematic issue pages (pouvoir-dachat, confiance-democratique, dette-publique, emploi-jeunesse, logement, sante, transition-ecologique, retraites) |
| `/representants` | Hub + Députés list/detail (4 tabs incl. Transparence) + Sénateurs list/detail + Lobbyistes list/detail + Élus locaux + Partis list/detail |
| `/gouvernance` | Redirects to `/representants` (HTTP 308) — Scrutins list/detail stay here |
| `/votes` | Hub + par-sujet/[tag] (13 thèmes) + mon-depute lookup |
| `/elections` | Hub + Législatives 2024 results |
| `/economie` | Dashboard with SVG charts |
| `/territoire` | Region browser + Département dashboard (StatLocale + BudgetLocal + votes) + Commune card |
| `/patrimoine` | Hub + Musées list/detail + Monuments list/detail |

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
| [`prisma/schema.prisma`](../prisma/schema.prisma) | 29 models — source of truth for DB structure |
| [`src/lib/db.ts`](../src/lib/db.ts) | Prisma singleton with `@prisma/adapter-pg` |
| [`src/lib/dossier-config.ts`](../src/lib/dossier-config.ts) | 8 thematic dossier definitions (slug, label, tags, lobbyDomains, color, priority) |
| [`src/lib/nuance-colors.ts`](../src/lib/nuance-colors.ts) | Political nuance code → CSS color/label mapping |
| [`src/lib/format.ts`](../src/lib/format.ts) | French number/date formatting (7 functions) |
| [`scripts/ingest.ts`](../scripts/ingest.ts) | Master ingestion orchestrator, 9 waves (Wave 5c: tag-scrutins, Wave 8: insee-local + budgets, Wave 9: criminalite + medecins) |
| [`next.config.ts`](../next.config.ts) | HTTP 308 redirects: `/gouvernance/*` → `/representants/*` |
| [`src/app/globals.css`](../src/app/globals.css) | Design tokens — bureau palette, teal/amber/rose accents |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Root layout — navbar (7 links incl. Dossiers, Votes, Représentants), footer |
| [`documentation/frontend.md`](frontend.md) | Full UI reference: all 50 routes, 22 components, design system |
| [`documentation/schema.md`](schema.md) | Full DB reference: all 29 models with fields, indexes, row counts |
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

**5 client components** (need `"use client"`): `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`.

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

The platform has been fully redesigned from a **data-source browser** into a **citizen-centric transparency tool**. All 5 phases are complete as of March 1, 2026. Full blueprint: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md).

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

### New Data Sources

| Source | API | What It Adds |
|--------|-----|-------------|
| **INSEE Mélodi** | CSV (anonymous, no key needed) | Population, income, poverty, employment per département — replaces deprecated DDL API |
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
| Models | 22 | **29** |
| Total rows | ~800K | **~800K+** (BudgetLocal not yet ingested) |
| Routes | 22 | **50** |
| Components | 12 | **22** |
| Data sources | 7 | **12** (added INSEE Mélodi, SSMSI, DREES, DGFIP) |
| Cross-references | 0 | **5 systemic** (conflict, lobbying→votes, party finances, territory, deputy accountability) |

### Remaining Work (low priority)

| Task | Script | Priority |
|------|--------|----------|
| DGFIP local budgets | `pnpm ingest:budgets` | HIGH — BudgetLocal empty, UI guards in place |
| Crime stats | `pnpm ingest:criminalite` | MEDIUM — StatCriminalite empty |
| Medical density | `pnpm ingest:medecins` | MEDIUM — DensiteMedicale empty |
| DEP 36 (Indre) retry | `pnpm ingest:insee-local` | LOW — lost to rate limit, 11/12 stats present |

**Full plan**: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md)

---

## Known Quirks — Phase 2/3 Additions

### Route duality: /gouvernance and /representants both exist
Both directories serve content. `/gouvernance` has the original files (kept for scrutins at `/gouvernance/scrutins/*`). `/representants` is the canonical new path for deputes/senateurs/elus/lobbyistes/partis. HTTP 308 redirects in `next.config.ts` handle old `/gouvernance/*` URLs. Do not remove `/gouvernance/scrutins` — it's still the active route, linked from many pages.

### StatLocale is populated (1,186 rows); BudgetLocal may be empty
`StatLocale` was ingested via `pnpm ingest:insee-local` (Session 8). No API key required — uses Mélodi "libre" plan anonymously. DEP 36 (Indre) is missing population rows due to rate-limit exhaustion; Mayotte (976) has no Mélodi data at all. To re-run a single département: `pnpm ingest:insee-local` is idempotent.
`BudgetLocal` script (`ingest-budgets.ts`) exists but DGFIP ingestion has not been run. The UI guards both with `statLocale.length > 0` and `budgetDept !== null`.

### Scrutin relation is `votes` not `voteRecords`
The `Scrutin` model has `votes VoteRecord[]` — always use `votes` in Prisma where clauses. Using `voteRecords` causes a TypeScript build error.

### Elu field names
`Elu.codeDepartement` (not `departementCode`), `Elu.codeCommune` (not `communeCode`).

---

## Work History

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
