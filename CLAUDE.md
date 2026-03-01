# CLAUDE.md (data-gouv civic intelligence platform)

Guidance for Claude Code. Keep current; remove or update if things change.

## Project Overview

French civic intelligence platform that ingests public data from data.gouv.fr, INSEE, and other government open data sources into PostgreSQL. Cross-references governance, economy, territory, and cultural heritage data through a Next.js interface. Sole objective: **show transparency through data**.

## Architectural Plan

The platform is being redesigned from a data-source browser into a citizen-centric transparency tool. The master blueprint is:

- **Local file**: [`ARCHITECTURAL-PLAN.md`](ARCHITECTURAL-PLAN.md)
- **Permanent reference**: https://x.com/Gdams70/status/2027876110659371343

This plan covers: issue-centric dossier system, cross-reference engine (lobbying → votes → declarations), INSEE local data expansion, local government budgets, vote topic classification, and a 5-phase implementation roadmap. **Never lose this plan.**

## Tech Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **PostgreSQL 14** + **Prisma 7** ORM (with `@prisma/adapter-pg` driver)
- **Tailwind CSS 4**
- **pnpm** package manager
- **Node.js 20.19.2** (minimum 20.19 required for Prisma 7)

## Data Layers & Sources

### Territory Layer (COG — Code Officiel Géographique)
| Model | Rows | Source |
|-------|------|--------|
| Region | 18 | INSEE COG CSV |
| Departement | 101 | INSEE COG CSV |
| Commune | 36,912 | INSEE COG CSV |

### Governance Layer
| Model | Rows | Source |
|-------|------|--------|
| Depute | 2,101 | Datan via data.gouv.fr Tabular API |
| Senateur | 1,943 | Official Sénat CSVs (ISO-8859-1) |
| MandatSenateur | 3,348 | Sénat ODSEN_ELUSEN.csv |
| CommissionSenateur | 616 | Sénat ODSEN_CUR_COMS.csv |
| Lobbyiste | 3,883 | HATVP registry JSON |
| ActionLobbyiste | 94,646 | HATVP registry JSON (nested) |

### Economy Layer (INSEE BDM time-series)
| Model | Rows | Source |
|-------|------|--------|
| Indicateur | 4 | GDP CSV + INSEE BDM SDMX XML |
| Observation | 354 | GDP CSV + INSEE BDM SDMX XML |

Series: PIB annuel, Taux de chômage trimestriel, Nombre de chômeurs trimestriel, Créations d'entreprises mensuelles.

### Culture Layer
| Model | Rows | Source |
|-------|------|--------|
| Musee | 1,226 | data.gouv.fr Tabular API |
| FrequentationMusee | 12,148 | data.gouv.fr Tabular API |
| Monument | 46,697 | data.gouv.fr Tabular API |

### Declarations Layer (HATVP)
| Model | Rows | Source |
|-------|------|--------|
| DeclarationInteret | varies | HATVP XML open data |
| ParticipationFinanciere | varies | HATVP XML (nested) |
| RevenuDeclaration | varies | HATVP XML (nested) |

### Parliamentary Votes Layer (AN open data)
| Model | Rows | Source |
|-------|------|--------|
| Organe | varies | AN open data XML |
| Scrutin | varies | AN open data XML |
| GroupeVote | varies | AN open data XML |
| VoteRecord | varies | AN open data XML |
| Deport | varies | AN open data XML |

### Elections & RNE Layer
| Model | Rows | Source |
|-------|------|--------|
| Elu | 593,153 | DGCL Répertoire National des Élus CSVs |
| ElectionLegislative | 1,078 | data.gouv.fr static CSV (2024 results) |
| CandidatLegislatif | 5,103 | data.gouv.fr static CSV (nested candidates) |
| PartiPolitique | 2,180 | CNCCFP party accounts CSV (2021–2024) |

**Total: ~800,000+ rows across 22 models + IngestionLog.**

Full schema reference: [`documentation/schema.md`](documentation/schema.md)

## MCP Integration

- Config: `.mcp.json` → `https://mcp.data.gouv.fr/mcp`
- 10 tools available (search_datasets, query_resource_data, download_and_parse_resource, etc.)
- Use MCP tools to explore/discover new datasets, not for app runtime

## Directory Structure

```
data-gouv/
├── .mcp.json                  # datagouv MCP config
├── .nvmrc                     # Node 20.19.2 — auto-used by pnpm dev
├── prisma/
│   ├── schema.prisma          # 22 models + IngestionLog
│   └── migrations/
├── scripts/
│   ├── ingest.ts              # Orchestrator (runs all 7 waves in order)
│   ├── ingest-territoires.ts  # COG regions/depts/communes
│   ├── ingest-deputes.ts      # Deputies from Tabular API
│   ├── ingest-senateurs.ts    # Senators from Sénat CSVs
│   ├── ingest-lobbyistes.ts   # HATVP lobbyist registry
│   ├── ingest-economie.ts     # GDP + INSEE BDM series
│   ├── ingest-musees.ts       # Museum attendance
│   ├── ingest-monuments.ts    # Historical monuments
│   ├── ingest-declarations.ts # HATVP interest declarations
│   ├── ingest-organes.ts      # AN parliamentary bodies
│   ├── ingest-scrutins.ts     # AN parliamentary votes
│   ├── ingest-deports.ts      # AN recusal declarations
│   ├── ingest-photos.ts       # Deputy/senator photo enrichment
│   ├── ingest-elus.ts         # RNE elected officials (593K rows)
│   ├── ingest-elections.ts    # 2024 legislative results
│   ├── ingest-partis.ts       # CNCCFP party accounts
│   └── lib/
│       ├── api-client.ts      # Tabular API paginator + fetchText/Json/Gzip
│       ├── csv-parser.ts      # papaparse wrapper, date/number parsing
│       ├── sdmx-parser.ts     # INSEE BDM SDMX XML parser
│       ├── ingestion-log.ts   # Timing + IngestionLog wrapper
│       └── departement-lookup.ts  # Name→code fuzzy matching
├── src/
│   ├── app/                   # Next.js App Router — 22 routes
│   ├── components/            # 12 UI components
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton (pg adapter)
│   │   ├── format.ts          # French number/date formatting
│   │   └── nuance-colors.ts   # Political nuance code → color mapping
│   └── types/
└── documentation/
    ├── frontend.md            # All pages, components, design system, patterns
    └── schema.md              # All 22 models, fields, relations, row counts
```

## Commands

```bash
pnpm dev              # Next.js dev server (port 3000) — auto-uses Node 20.19.2 via .nvmrc
pnpm build            # Production build
pnpm db:migrate       # Run Prisma migrations
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio

# Ingestion (all idempotent, safe to re-run)
pnpm ingest              # Full ingestion (all 7 waves in order)
pnpm ingest:territoires  # Wave 1a: COG territories
pnpm ingest:deputes      # Wave 1b: Deputies
pnpm ingest:senateurs    # Wave 1b: Senators
pnpm ingest:lobbies      # Wave 1b: Lobbyists
pnpm ingest:economie     # Wave 2: GDP + unemployment + enterprises
pnpm ingest:musees       # Wave 3: Museums + attendance
pnpm ingest:monuments    # Wave 3: Historical monuments
pnpm ingest:declarations # Wave 4: HATVP interest declarations
pnpm ingest:organes      # Wave 5a: AN parliamentary bodies
pnpm ingest:scrutins     # Wave 5b: Parliamentary votes
pnpm ingest:deports      # Wave 5b: Recusal declarations
pnpm ingest:photos       # Wave 6: Deputy/senator photos
pnpm ingest:elus         # Wave 7: RNE elected officials (uses 8GB heap)
pnpm ingest:elections    # Wave 7: 2024 legislative results
pnpm ingest:partis       # Wave 7: CNCCFP party accounts
pnpm ingest:insee-local  # Wave 8: INSEE Données Locales (requires INSEE_API_KEY)
pnpm ingest:budgets      # Wave 8: DGFIP finances locales
pnpm ingest:criminalite  # Wave 9: SSMSI crime stats by département
pnpm ingest:medecins     # Wave 9: DREES medical density by département
```

## Ingestion Order

Territories must be ingested first (other scripts resolve FK references to departments/communes).

```
Wave 1a:  ingestTerritoires()
Wave 1b:  Promise.all([ingestDeputes(), ingestSenateurs(), ingestLobbyistes()])
Wave 2:   ingestEconomie()
Wave 3:   Promise.all([ingestMusees(), ingestMonuments()])
Wave 4:   ingestDeclarations()
Wave 5a:  ingestOrganes()                   # must precede scrutins
Wave 5b:  Promise.all([ingestScrutins(), ingestDeports()])
Wave 6:   ingestPhotos()
Wave 7:   Promise.all([ingestElus(), ingestElections(), ingestPartis()])
Wave 8:   Promise.all([ingestInseeLocal(), ingestBudgets()])
Wave 9:   Promise.all([ingestCriminalite(), ingestMedecins()])
```

## Key API URLs

- Deputies Tabular API: `https://tabular-api.data.gouv.fr/api/resources/092bd7bb-.../data/`
- Historic Deputies: `https://tabular-api.data.gouv.fr/api/resources/817fda38-.../data/`
- Senators CSV: `https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv`
- HATVP JSON: `https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json`
- INSEE BDM: `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}`
- Museums: `https://tabular-api.data.gouv.fr/api/resources/7708e380-.../data/`
- Monuments: `https://tabular-api.data.gouv.fr/api/resources/3a52af4a-.../data/`

## Database

- **Name**: `datagouv`
- **Connection**: `postgresql://aydenmomika@localhost:5432/datagouv`
- Prisma 7 uses `prisma.config.ts` for datasource URL (not in schema.prisma)
- `src/lib/db.ts` uses `@prisma/adapter-pg` with `pg.Pool`
- All ingestion scripts upsert (safe to re-run)
- `IngestionLog` table tracks every run with timing, row counts, and metadata

## Schema Notes

- **Depute.departementCode** vs **departementRefCode**: `departementCode` stores the raw source code (may include overseas codes like 099, 975 that aren't in COG). `departementRefCode` is the nullable FK to Departement (set only when code exists in DB).
- **Senateur.departementCode**: Resolved from department name via fuzzy matching (accent/hyphen normalization).
- **Commune types**: COM (full commune), ARM (arrondissement), COMD (delegated), COMA (associated). Filter to COM for most UI displays.
- **Monument coordinates**: `latitude`/`longitude` parsed from `coordonnees_au_format_WGS84` field.
- **ElectionLegislative.codeDepartement**: Plain string, no FK to Departement — overseas constituencies use codes like `"ZZ"` not in COG. FK was removed in migration `20260301102159_drop_election_dept_fk`.
- Full schema details: [`documentation/schema.md`](documentation/schema.md)

## UI Patterns

- **Profile pages** (deputies, senators): `ProfileHero` + `ProfileTabs` with URL-driven `?tab=` navigation, `max-w-4xl` centered content
- **List pages**: `PageHeader` + `SearchInput` + `Pagination`, `max-w-7xl` wide layout
- **4 client components**: `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`
- **22 routes**: 6 static + 16 dynamic (see [`documentation/frontend.md`](documentation/frontend.md))
- Full frontend reference: [`documentation/frontend.md`](documentation/frontend.md)

## Rules

- Never commit secrets or `.env.local`
- Never push without explicit user approval
- Ingestion scripts must be idempotent (upsert, not insert)
- All monetary/numeric displays use French formatting (1 234,56 €)
- Dark theme (slate bg, teal accents) — "Intelligence Bureau" aesthetic
- Keep it focused: every UI element must serve transparency
- Node.js 20.19.2+ required (Prisma 7 compatibility)
