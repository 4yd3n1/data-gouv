# CLAUDE.md (data-gouv civic intelligence platform)

Guidance for Claude Code. Keep current; remove or update if things change.

## Project Overview

French civic intelligence platform that ingests public data from data.gouv.fr, INSEE, and other government open data sources into PostgreSQL. Cross-references governance, economy, territory, and cultural heritage data through a Next.js interface. Sole objective: **show transparency through data**.

## Tech Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **PostgreSQL 14** + **Prisma 7** ORM (with `@prisma/adapter-pg` driver)
- **Tailwind CSS 4** + **shadcn/ui**
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

**Total: ~204,000 rows across 15 models.**

## MCP Integration

- Config: `.mcp.json` → `https://mcp.data.gouv.fr/mcp`
- 10 tools available (search_datasets, query_resource_data, download_and_parse_resource, etc.)
- Use MCP tools to explore/discover new datasets, not for app runtime

## Directory Structure

```
data-gouv/
├── .mcp.json                  # datagouv MCP config
├── prisma/
│   ├── schema.prisma          # 15 models + IngestionLog
│   └── migrations/
├── scripts/
│   ├── ingest.ts              # Orchestrator (runs all waves in order)
│   ├── ingest-territoires.ts  # COG regions/depts/communes
│   ├── ingest-deputes.ts      # Deputies from Tabular API
│   ├── ingest-senateurs.ts    # Senators from Sénat CSVs
│   ├── ingest-lobbyistes.ts   # HATVP lobbyist registry
│   ├── ingest-economie.ts     # GDP + INSEE BDM series
│   ├── ingest-musees.ts       # Museum attendance
│   ├── ingest-monuments.ts    # Historical monuments
│   └── lib/
│       ├── api-client.ts      # Tabular API paginator + fetchText/Json/Gzip
│       ├── csv-parser.ts      # papaparse wrapper, date/number parsing
│       ├── sdmx-parser.ts     # INSEE BDM SDMX XML parser
│       ├── ingestion-log.ts   # Timing + IngestionLog wrapper
│       └── departement-lookup.ts  # Name→code fuzzy matching
├── src/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # UI components
│   ├── lib/
│   │   └── db.ts              # Prisma client singleton (pg adapter)
│   └── types/
```

## Commands

```bash
pnpm dev              # Next.js dev server (port 3000)
pnpm build            # Production build
pnpm db:migrate       # Run Prisma migrations
pnpm db:generate      # Generate Prisma client
pnpm db:studio        # Open Prisma Studio

# Ingestion (all idempotent, safe to re-run)
pnpm ingest           # Full ingestion (all waves in order)
pnpm ingest:territoires  # Wave 1: COG territories
pnpm ingest:deputes      # Wave 1: Deputies
pnpm ingest:senateurs    # Wave 1: Senators
pnpm ingest:lobbies      # Wave 1: Lobbyists
pnpm ingest:economie     # Wave 2: GDP + unemployment + enterprises
pnpm ingest:musees       # Wave 3: Museums + attendance
pnpm ingest:monuments    # Wave 3: Historical monuments
```

## Ingestion Order

Territories must be ingested first (other scripts resolve FK references to departments/communes).

```
1. ingestTerritoires()                              # Must be first
2. Promise.all([ingestDeputes(), ingestSenateurs(), ingestLobbyistes()])
3. ingestEconomie()
4. Promise.all([ingestMusees(), ingestMonuments()])
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

## Rules

- Never commit secrets or `.env.local`
- Never push without explicit user approval
- Ingestion scripts must be idempotent (upsert, not insert)
- All monetary/numeric displays use French formatting (1 234,56 €)
- Dark theme (slate bg, blue accents) - match blueprint aesthetic
- Keep it focused: every UI element must serve transparency
- Node.js 20.19.2+ required (Prisma 7 compatibility)
