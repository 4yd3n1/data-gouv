# Handoff — data-gouv Civic Intelligence Platform

> Created: Mar 1, 2026. For the next agent picking up this project.

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

**~800,000+ rows across 22 models.**

### UI Status (all pages render correctly)

22 routes across 5 sections:

| Section | Routes |
|---------|--------|
| `/gouvernance` | Hub + Députés list/detail + Sénateurs list/detail + Lobbyistes list/detail + Scrutins list/detail + **Partis list/detail (NEW)** |
| `/elections` | **Hub (NEW)** + **Législatives 2024 results (NEW)** |
| `/economie` | Dashboard with SVG charts |
| `/territoire` | Region browser + Département detail |
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
| [`prisma/schema.prisma`](../prisma/schema.prisma) | 22 models — source of truth for DB structure |
| [`src/lib/db.ts`](../src/lib/db.ts) | Prisma singleton with `@prisma/adapter-pg` |
| [`src/lib/nuance-colors.ts`](../src/lib/nuance-colors.ts) | Political nuance code → CSS color/label mapping |
| [`src/lib/format.ts`](../src/lib/format.ts) | French number/date formatting (7 functions) |
| [`scripts/ingest.ts`](../scripts/ingest.ts) | Master ingestion orchestrator, 7 waves |
| [`src/app/globals.css`](../src/app/globals.css) | Design tokens — bureau palette, teal/amber/rose accents |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Root layout — navbar (6 links), footer |
| [`documentation/frontend.md`](frontend.md) | Full UI reference: all 22 routes, 12 components, design system |
| [`documentation/schema.md`](schema.md) | Full DB reference: all 22 models with fields, indexes, row counts |
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

**4 client components** (need `"use client"`): `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`.

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

## Recent Work (this session)

1. **Fixed `ingest:elus` OOM** — changed package.json from broken `node ... tsx` to `NODE_OPTIONS=--max-old-space-size=8192 tsx`
2. **Ran `pnpm ingest:elus`** successfully — 593,153 élus ingested across 10 mandate types in ~380s
3. **Updated `documentation/frontend.md`** — added 4 new pages, updated route map (19→22), nav (5→6), build output, file structure
4. **Created `documentation/schema.md`** — new file, full reference for all 22 models with every field, type, index, row count, and ingestion source
5. **Updated `CLAUDE.md`** — data layers table expanded, all ingest commands listed, full ingestion order, references to schema.md and frontend.md

---

## Potential Next Steps

These haven't been started — just ideas based on what data is available:

- **`/gouvernance/elus`** — list/search page for 593K local elected officials (filter by typeMandat, departement, commune)
- **Elections detail pages** — `/elections/legislatives-2024/[dept]/[circo]` — single constituency deep-dive
- **Cross-reference enrichment** — link `ElectionLegislative` winners to `Depute` records (match on nom/prenom/dept)
- **Territoire enrichment** — add `Elu` counts per department to `/territoire/[departementCode]`
- **More election years** — 2022 legislative, 2022 présidentielle, 2020 municipales are all available on data.gouv.fr
- **Search across all data** — global search bar linking to deputé/sénateur/lobbyiste/monument results
- **`/gouvernance/scrutins` improvements** — full-text search on titre, group vote visualization
