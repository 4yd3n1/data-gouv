# Transparency Data Tool — Project Plan & Status

> Started: Feb 26, 2026
> Last updated: Feb 28, 2026 (vision + roadmap added)
> Project: `/Users/aydenmomika/data-gouv/`

---

## What We Built

### Phase 1: Setup & Architecture (Feb 26)

1. **Evaluated the datagouv MCP** — kept for data discovery, local DB for serving
2. **Explored datasets via MCP** — produced [data-cat.md](../data-cat.md) catalog
3. **Architecture decisions** — Next.js full-stack, App Router, Server Actions, PostgreSQL + Prisma
4. **Initialized project** — Next.js 16, React 19, Tailwind CSS 4, Prisma 7
5. **Set up database** — PostgreSQL `datagouv`, initial migration, Prisma client singleton

### Phase 2: Data Ingestion (Feb 26–27)

Built 12 ingestion scripts covering 5 data layers:

| Wave | Script | Source | Rows |
|------|--------|--------|------|
| 1 | `ingest-territoires.ts` | INSEE COG CSV | ~37,031 (18 regions + 101 depts + 36,912 communes) |
| 1 | `ingest-deputes.ts` | data.gouv.fr Tabular API | 2,101 |
| 1 | `ingest-senateurs.ts` | Sénat CSVs (ISO-8859-1) | ~5,907 (1,943 + 3,348 mandats + 616 commissions) |
| 1 | `ingest-lobbyistes.ts` | HATVP registry JSON | ~98,529 (3,883 + 94,646 actions) |
| 2 | `ingest-economie.ts` | GDP CSV + INSEE BDM SDMX XML | ~358 (4 indicateurs + 354 observations) |
| 3 | `ingest-musees.ts` | data.gouv.fr Tabular API | ~13,374 (1,226 + 12,148 fréquentations) |
| 3 | `ingest-monuments.ts` | data.gouv.fr Tabular API | 46,697 |
| 4 | `ingest-declarations.ts` | HATVP declarations ZIP | DeclarationInteret + participations + revenus |
| 5a | `ingest-organes.ts` | AN JSON files (local) | ~7,137 |
| 5b | `ingest-scrutins.ts` | AN JSON files (local) | ~994K (4,691 scrutins + ~51,600 groupe votes + ~938K vote records) |
| 5b | `ingest-deports.ts` | AN JSON files (local) | 33 |
| 6 | `ingest-photos.ts` | AN/Sénat official URLs | ~4,044 updates |

**Supporting libraries**: `api-client.ts` (Tabular API paginator), `csv-parser.ts` (papaparse wrapper), `sdmx-parser.ts` (INSEE BDM XML), `ingestion-log.ts` (timing), `departement-lookup.ts` (fuzzy matching).

### Phase 3: Governance UI (Feb 27)

- **Deputies** — searchable list with photo avatars + detail pages (bio, contact, voting record, déclarations d'intérêts, déports)
- **Senators** — searchable list with photo avatars + detail pages (bio, mandats, commissions, déclarations d'intérêts)
- **Lobbyists** — searchable list + detail pages (organization info, actions de représentation)
- **Scrutins** — searchable/filterable list + detail pages (result badge, group breakdown bars, individual votes with deputy links)
- **Governance hub** — 4-card navigation (Députés, Sénateurs, Lobbyistes, Scrutins) with aggregate stats

### Phase 4: Economy, Territory, & Heritage UI (Feb 27)

- **Économie** — GDP, unemployment, enterprise creation time-series with French formatting
- **Territoire** — regions/departments/communes overview + department detail pages
- **Patrimoine** — museums (list + detail with attendance data) + monuments (list + detail with coordinates)

### Phase 5: Homepage & Cross-cutting (Feb 27–28)

- **Homepage** ("L'Observatoire Citoyen") — hero stats (députés, sénateurs, scrutins, monuments), 4 exploration cards, recent declarations with financial highlights, full overview statistics
- **Déclarations d'intérêts** — displayed on both deputy and senator profile pages (type, deposit date, financial participations, revenus), matched by nom + prénom + typeMandat
- **Photo integration** — real AN/Sénat photos with fallback initials avatar

### Phase 6: Declaration Content Enhancement (Feb 28)

- **Bug fix**: Revenue parsing was returning 0 rows due to triple-nested `<montant>` XML tags breaking the `indexOf`-based parser. Replaced with regex-based `parseAllMontants` function.
- **Data enrichment**: Now stores all years per activity (not just latest), producing 231K revenue rows across 4 types (dirigeant, mandat_electif, professionnel, consultant).
- **New component**: `DeclarationSection` (client component) — expandable cards with organized content:
  - Revenue sections grouped by type (color-coded: blue/teal/purple/amber)
  - Activities aggregated by description + employer, showing year-by-year breakdowns
  - Financial participations with company details (shares, capital, remuneration)
  - Summary totals in collapsed header for quick scanning
- **Shared component**: Used on both deputy and senator profile pages, replacing inline duplicated code.

---

## Current Status

### DONE
- [x] MCP evaluation and data discovery
- [x] Architecture decisions + CLAUDE.md
- [x] Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- [x] PostgreSQL `datagouv` database + Prisma 7
- [x] Prisma schema: **22 models** + IngestionLog
- [x] 12 ingestion scripts (all idempotent, ~1.2M rows total)
- [x] Governance UI: deputies, senators, lobbyists, scrutins
- [x] Economy UI: time-series indicators
- [x] Territory UI: regions, departments, communes
- [x] Heritage UI: museums + monuments
- [x] Homepage with aggregate stats + recent declarations
- [x] Photo avatars (deputies + senators)
- [x] Parliamentary votes with per-deputy positions
- [x] Déclarations d'intérêts on deputy/senator profiles
- [x] Déports (conflict-of-interest recusals) on deputy profiles
- [x] Declaration content: expandable cards with revenues (231K rows), participations, year-by-year breakdowns

### POTENTIAL NEXT STEPS
- Global search across all data layers
- Data freshness / auto-refresh ingestion
- Performance optimization (pagination, caching)

---

## Vision — "L'Observatoire Citoyen"

A single place where any citizen can understand how France actually works — who governs, where the money goes, and what the results are. Not opinions, not media narratives. Just data, cross-referenced and made readable.

### Three Core Questions

Every page on the platform should help answer one of these:

1. **Who decides?** — Deputies, senators, mayors, councillors, lobbyists. Their votes, declarations, conflicts of interest, campaign finance, party funding.
2. **Where does the money go?** — State budget, local taxes, public procurement, subsidies, dotations, parliamentary reserves. Follow the euro from taxpayer to contractor.
3. **What are the results?** — Crime rates, school quality, hospital coverage, unemployment, enterprise creation, road safety, cultural access. Territory-level outcomes that tell you if the money and decisions are producing results.

### Target Architecture — 6 Interconnected Layers

```
┌─────────────────────────────────────────────────┐
│                  GOVERNANCE                      │
│  Deputies · Senators · Mayors · Councillors      │
│  Lobbyists · Declarations · Votes · Parties      │
├─────────────────────────────────────────────────┤
│                  ELECTIONS                        │
│  Legislative results · Presidential sponsorships │
│  Campaign finance · Party accounts               │
├─────────────────────────────────────────────────┤
│               PUBLIC FINANCE                     │
│  Commune budgets · Local taxes · Procurement     │
│  State dotations · Parliamentary reserves        │
├─────────────────────────────────────────────────┤
│                  ECONOMY                         │
│  GDP · Unemployment · Enterprise creation        │
│  Real estate prices (DVF)                        │
├─────────────────────────────────────────────────┤
│                 TERRITORY                        │
│  Regions · Départements · Communes               │
│  Crime stats · Schools · Hospitals · Risks       │
├─────────────────────────────────────────────────┤
│               CULTURE & HERITAGE                 │
│  Museums · Monuments · Attendance                │
└─────────────────────────────────────────────────┘
```

### Cross-Reference Power

- **Deputy profile** → votes + declarations + election results in their constituency + campaign finance + crime/education/health stats of communes they represent
- **Commune page** → mayor (RNE) + budget (balances comptables) + tax rates (REI) + crime + schools + hospitals + monuments + procurement contracts + state dotations
- **Party page** → financial accounts (CNCCFP) + all elected officials (RNE) + aggregate campaign spending
- **Département dashboard** → aggregates all of the above across communes

### What This Is NOT

- Not a news site or opinion platform
- Not a social network for citizens
- Not a tool for government officials
- Not trying to be comprehensive about everything — curated around the three questions above

---

## Expansion Roadmap

### Phase 7: Elections & Elected Officials (RNE)

**New datasets:**

| Dataset | data.gouv.fr ID | Source | Est. Rows |
|---------|-----------------|--------|-----------|
| Répertoire National des Élus (RNE) | `5c34c4d1634f4173183a64f1` | Min. Intérieur | ~600K |
| Élections législatives 2024 — 1er tour | `6682d0c255dcda5df20b1d90` | Min. Intérieur | ~100K |
| Élections législatives 2024 — 2nd tour | `668b4092826ddcf70e9e62cd` | Min. Intérieur | ~100K |
| Comptes des partis politiques | `53699158a3a729239d203c2f` | CNCCFP | 40 resources |

**New models:** Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique

**New ingestion scripts:** `ingest-elus.ts`, `ingest-elections.ts`, `ingest-partis.ts`

**New UI routes:**
```
/gouvernance/elus                   All elected officials (RNE)
/gouvernance/elus/maires            Mayors list
/gouvernance/partis                 Political parties + finances
/gouvernance/partis/[id]            Party detail (accounts + members)
/elections                          Elections hub
/elections/legislatives-2024        Results by constituency
```

### Phase 8: Public Finance

**New datasets:**

| Dataset | data.gouv.fr ID | Source |
|---------|-----------------|--------|
| Balances comptables des communes | `5551f561c751df7646190c78` | Min. Économie |
| Impôts locaux (REI) | `6657c57abbefc8869c7c6364` | Min. Économie |
| DECP — Commande publique consolidée | `5cd57bf68b4c4179299eb0e9` | Min. Économie |
| Dotations investissement collectivités | `6176785207139a929a2776fe` | DGCL |
| Réserve parlementaire | `558837cfc751df7991a453bc` | Assemblée nationale |

**New models:** BalanceComptable, ImpotLocal, MarchePublic, Dotation

### Phase 9: Territory Outcomes

**New datasets:**

| Dataset | data.gouv.fr ID | Source |
|---------|-----------------|--------|
| Délinquance enregistrée | `621df2954fa5a3b5a023e23c` | Min. Intérieur |
| FINESS — Établissements santé | `53699569a3a729239d2046eb` | Min. Santé |
| Annuaire de l'éducation | `5889d03fa3a72974cbf0d5b1` | Min. Éducation |
| Accidents corporels | `53698f4ca3a729239d2036df` | Min. Intérieur |

**New models:** StatDelinquance, EtablissementSante, EtablissementScolaire

### Phase 10: Enrichment

**New datasets:**

| Dataset | data.gouv.fr ID | Source |
|---------|-----------------|--------|
| DVF — Valeurs foncières | `5c4ae55a634f4117716d5656` | Min. Économie |
| Comptes de campagne | Various CNCCFP | CNCCFP |
| Questions-Réponses AN | `53699e82a3a729239d205ec1` | DILA/JORF |
| Amendements Sénat | `53a8b7f8a3a72905b7ce595d` | Sénat |
| Rapports Cour des comptes | `57470e8688ee38574dd1b934` | Cour des comptes |

**Available APIs (no ingestion needed — query at runtime):**
- API Geo (`geo.api.gouv.fr`) — GeoJSON boundaries + populations
- API Recherche d'Entreprises (`recherche-entreprises.api.gouv.fr`) — Enterprise search
- API Géorisques (`georisques.gouv.fr/api/v1/`) — Natural/tech risks per territory

### Known Gaps (No Open Data Exists)

- IRFM / parliamentary expenses — no structured open data anywhere
- Élysée/Matignon spending — not published
- National consolidated association subsidies — only fragmented municipal datasets (162 local datasets, no national rollup)

---

## Database: 22 Models

### Territory Layer (3 models)
| Model | Rows | Source |
|-------|------|--------|
| Region | 18 | INSEE COG CSV |
| Departement | 101 | INSEE COG CSV |
| Commune | 36,912 | INSEE COG CSV |

### Governance Layer (9 models)
| Model | Rows | Source |
|-------|------|--------|
| Depute | 2,101 | data.gouv.fr Tabular API |
| Senateur | 1,943 | Sénat CSVs (ISO-8859-1) |
| MandatSenateur | 3,348 | Sénat ODSEN_ELUSEN.csv |
| CommissionSenateur | 616 | Sénat ODSEN_CUR_COMS.csv |
| Lobbyiste | 3,883 | HATVP registry JSON |
| ActionLobbyiste | 94,646 | HATVP registry JSON (nested) |
| DeclarationInteret | 6,320 | HATVP declarations XML |
| ParticipationFinanciere | 6,552 | HATVP declarations XML (nested) |
| RevenuDeclaration | 231,036 | HATVP declarations XML (nested) |

### Economy Layer (2 models)
| Model | Rows | Source |
|-------|------|--------|
| Indicateur | 4 | GDP CSV + INSEE BDM SDMX XML |
| Observation | 354 | GDP CSV + INSEE BDM SDMX XML |

### Culture Layer (3 models)
| Model | Rows | Source |
|-------|------|--------|
| Musee | 1,226 | data.gouv.fr Tabular API |
| FrequentationMusee | 12,148 | data.gouv.fr Tabular API |
| Monument | 46,697 | data.gouv.fr Tabular API |

### Parliamentary Votes (4 models)
| Model | Rows | Source |
|-------|------|--------|
| Organe | ~7,137 | AN JSON files |
| Scrutin | 4,691 | AN JSON files |
| GroupeVote | ~51,600 | AN JSON files (nested) |
| VoteRecord | ~938,000 | AN JSON files (nested) |

### Recusals (1 model)
| Model | Rows | Source |
|-------|------|--------|
| Deport | 33 | AN JSON files |

**Total: ~1.2M rows across 22 models.**

---

## UI Routes

```
/                                    Homepage ("L'Observatoire Citoyen")
/gouvernance                         Governance hub (4 cards)
/gouvernance/deputes                 Deputies list (searchable, photo avatars)
/gouvernance/deputes/[id]            Deputy detail (photo, votes, déclarations, déports)
/gouvernance/senateurs               Senators list (searchable, photo avatars)
/gouvernance/senateurs/[id]          Senator detail (photo, mandats, commissions, déclarations)
/gouvernance/lobbyistes              Lobbyists list (searchable)
/gouvernance/lobbyistes/[id]         Lobbyist detail (actions de représentation)
/gouvernance/scrutins                Scrutins list (searchable, filterable)
/gouvernance/scrutins/[id]           Scrutin detail (group bars, individual votes)
/economie                            Economic indicators (time-series)
/territoire                          Territory overview
/territoire/[departementCode]        Department detail
/patrimoine                          Heritage overview
/patrimoine/musees                   Museums list
/patrimoine/musees/[id]              Museum detail (attendance)
/patrimoine/monuments                Monuments list
/patrimoine/monuments/[id]           Monument detail
```

---

## Components

| Component | Purpose |
|-----------|---------|
| `avatar.tsx` | Client component: `<img>` with `onError` fallback to initials |
| `vote-badge.tsx` | Pour (teal), Contre (rose), Abstention (amber), Non-votant (gray) |
| `scrutin-result-badge.tsx` | Adopté (teal) / Rejeté (rose) |
| `stat-card.tsx` | Statistics display card |
| `search-input.tsx` | Search field with loading spinner |
| `score-bar.tsx` | Score visualization bar |
| `page-header.tsx` | Page title/subtitle header with breadcrumbs |
| `pagination.tsx` | Pagination controls with ellipsis |
| `declaration-section.tsx` | Expandable declaration cards with revenues/participations |

---

## Directory Structure

```
data-gouv/
├── .mcp.json                  # datagouv MCP config
├── prisma/
│   ├── schema.prisma          # 22 models + IngestionLog
│   └── migrations/
├── scripts/
│   ├── ingest.ts              # Orchestrator (6 waves)
│   ├── ingest-territoires.ts  # Wave 1: COG regions/depts/communes
│   ├── ingest-deputes.ts      # Wave 1: Deputies
│   ├── ingest-senateurs.ts    # Wave 1: Senators
│   ├── ingest-lobbyistes.ts   # Wave 1: Lobbyists
│   ├── ingest-economie.ts     # Wave 2: GDP + INSEE BDM series
│   ├── ingest-musees.ts       # Wave 3: Museums + attendance
│   ├── ingest-monuments.ts    # Wave 3: Historical monuments
│   ├── ingest-declarations.ts # Wave 4: HATVP declarations
│   ├── ingest-organes.ts      # Wave 5a: AN institutional bodies
│   ├── ingest-scrutins.ts     # Wave 5b: Parliamentary votes
│   ├── ingest-deports.ts      # Wave 5b: Recusals
│   ├── ingest-photos.ts       # Wave 6: Deputy/Senator photos
│   └── lib/
│       ├── api-client.ts      # Tabular API paginator + fetchText/Json/Gzip
│       ├── csv-parser.ts      # papaparse wrapper, date/number parsing
│       ├── sdmx-parser.ts     # INSEE BDM SDMX XML parser
│       ├── ingestion-log.ts   # Timing + IngestionLog wrapper
│       └── departement-lookup.ts  # Name→code fuzzy matching
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Dark theme, Inter, fr lang
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css        # Tailwind import
│   │   ├── gouvernance/       # Governance section (4 subsections)
│   │   ├── economie/          # Economy section
│   │   ├── territoire/        # Territory section
│   │   └── patrimoine/        # Heritage section (musees + monuments)
│   ├── components/            # 9 reusable components
│   ├── lib/
│   │   └── db.ts              # Prisma client singleton (pg adapter)
│   └── types/
├── documentation/
│   ├── initial-plan.md        # This file
│   └── hatvp-old-context/     # Source AN/HATVP data (JSON files)
└── public/
    └── photos/ministres/      # Minister photos (copied from HATVP data)
```

---

## Tech Stack

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.9.3 |
| Prisma | 7.4.1 |
| Tailwind CSS | 4.2.1 |
| Node.js | 20.19.2 |
| pnpm | 10.12.1 |
| PostgreSQL | 14.18 |

---

## Commands

```bash
pnpm dev                # Next.js dev server (port 3000)
pnpm build              # Production build
pnpm db:migrate         # Run Prisma migrations
pnpm db:generate        # Generate Prisma client
pnpm db:studio          # Open Prisma Studio

# Ingestion (all idempotent, safe to re-run)
pnpm ingest             # Full ingestion (all 6 waves in order)
pnpm ingest:territoires # Wave 1: COG territories
pnpm ingest:deputes     # Wave 1: Deputies
pnpm ingest:senateurs   # Wave 1: Senators
pnpm ingest:lobbies     # Wave 1: Lobbyists
pnpm ingest:economie    # Wave 2: GDP + unemployment + enterprises
pnpm ingest:musees      # Wave 3: Museums + attendance
pnpm ingest:monuments   # Wave 3: Historical monuments
pnpm ingest:declarations # Wave 4: HATVP declarations
pnpm ingest:organes     # Wave 5a: AN institutional bodies
pnpm ingest:scrutins    # Wave 5b: Parliamentary votes
pnpm ingest:deports     # Wave 5b: Recusals
pnpm ingest:photos      # Wave 6: Deputy/Senator photos
```

---

## Key Ingestion URLs

| Target | URL |
|--------|-----|
| Active Deputies | `https://tabular-api.data.gouv.fr/api/resources/092bd7bb-.../data/` |
| Historic Deputies | `https://tabular-api.data.gouv.fr/api/resources/817fda38-.../data/` |
| Senators General | `https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv` |
| Senators Mandates | `https://data.senat.fr/data/senateurs/ODSEN_ELUSEN.csv` |
| Senators Commissions | `https://data.senat.fr/data/senateurs/ODSEN_CUR_COMS.csv` |
| HATVP Registry | `https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json` |
| INSEE BDM | `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}` |
| Museums | `https://tabular-api.data.gouv.fr/api/resources/7708e380-.../data/` |
| Monuments | `https://tabular-api.data.gouv.fr/api/resources/3a52af4a-.../data/` |

---

## Lessons Learned

1. **Prisma 7 breaking change**: `url` removed from `schema.prisma`, must use `prisma.config.ts` at project root
2. **data.gouv.fr MCP search**: Uses AND logic — short specific queries work best
3. **Sénat data**: Not on Tabular API — direct CSV download from `data.senat.fr` (ISO-8859-1 encoding)
4. **AN JSON data**: Single-voter objects must be normalized to arrays (`Array.isArray(x) ? x : x ? [x] : []`)
5. **VoteRecord volume**: ~938K records requires batch inserts (500 per batch) and pre-loaded Depute ID sets for FK validation
6. **Declarations matching**: No direct FK — uses `[nom, prenom]` index + typeMandat filter for deputy/senator lookup
7. **tsconfig.json**: Exclude `documentation/` from build to avoid TS errors on non-source files
8. **HATVP `<montant>` triple nesting**: XML uses `<montant>` at 3 levels (list container → year entry → amount value). Simple `indexOf` tag matching breaks; use regex `<annee>\s*(\d{4})\s*</annee>\s*<montant>\s*([^<]+)</montant>` instead
