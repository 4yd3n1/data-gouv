# Transparency Data Tool — Session Recap

> Date: Feb 26, 2026
> Project: `/Users/aydenmomika/data-gouv/`

---

## What We Did

### 1. Evaluated the datagouv MCP

Started by assessing whether to use data.gouv.fr's official MCP server or build a custom skill.

**Decision**: Keep the MCP for data discovery + build a local DB for serving. The MCP provides 10 read-only tools for searching/querying data.gouv.fr — no skill can replace that. The MCP is for exploration, not runtime.

**MCP config**: `.mcp.json` → `https://mcp.data.gouv.fr/mcp`

### 2. Explored Available Data via MCP

Used MCP tools to discover and preview datasets. Key findings:

| Source | Dataset ID | Rows | Queryable |
|--------|-----------|------|-----------|
| Active Deputies (Datan) | `5fc8b732d30fbf1ed6648aab` | 577 | Tabular API |
| Historic Deputies (Datan) | `60f2ffc8284ff5e8c1ed0655` | 2,101 | Tabular API |
| Senators (official Sénat) | `58c2c63f88ee387e365cfcf1` | ~348 | Direct CSV |
| HATVP Lobbyist Registry | `5a2adc8688ee382ed328b586` | Large | JSON download |
| Lobbyist Actions (separated) | `5d13692f634f41364f8929b8` | Large | CSV.GZ (104.8 MB) |
| Parliamentary Declarations | `53dfccb5a3a729110ca8d363` | — | ZIP files |

Also produced a comprehensive data catalog: [data-cat.md](../data-cat.md) covering economy, governance, elections, public finances, culture, and demographics.

### 3. Made Architecture Decisions

User chose:
- **Tech stack**: Next.js full-stack (App Router, Server Actions, PostgreSQL + Prisma)
- **V1 scope**: All officials + lobbyists (deputies, senators, HATVP registry)
- **MCP role**: Ingest then serve (pull data into local DB, serve from DB)

### 4. Created CLAUDE.md

Project instructions file with data sources, directory structure, commands, API URLs, database info, and rules.

### 5. Initialized the Project

**Packages installed**:
- next 16.1.6, react 19.2.4, react-dom 19.2.4
- @prisma/client 7.4.1, prisma 7.4.1
- tailwindcss 4.2.1, @tailwindcss/postcss, postcss
- typescript 5.9.3, tsx 4.21.0, dotenv 17.3.1
- eslint 10.0.2, eslint-config-next

**Issues resolved**:
- Prisma 7 requires Node 20.19+ → pinned via `.nvmrc`, nvm use
- Prisma 7 moved `url` out of `schema.prisma` → created `prisma.config.ts` at project root with `datasource.url`
- `create-next-app` conflicts with existing files → manually assembled project
- PostgreSQL user is `aydenmomika` not `postgres` → fixed connection string

### 6. Set Up Database

- Created PostgreSQL database `datagouv`
- Prisma schema with 7 models: `Depute`, `Senateur`, `MandatSenateur`, `CommissionSenateur`, `Lobbyiste`, `ActionLobbyiste`, `IngestionLog`
- Applied initial migration `20260226190034_init`
- Generated Prisma client
- Created singleton at `src/lib/db.ts`

### 7. Verified Everything Works

- Dev server starts and returns 200 OK
- Database connected and migrated
- All scripts configured in package.json

---

## Current Status

### DONE
- [x] MCP evaluation and data discovery
- [x] Architecture decisions
- [x] CLAUDE.md project instructions
- [x] Next.js 16 + React 19 + TypeScript
- [x] Tailwind CSS 4 + PostCSS
- [x] PostgreSQL `datagouv` database
- [x] Prisma 7 schema (7 models) + migration
- [x] Prisma client singleton
- [x] Dev server verified
- [x] Data catalog ([data-cat.md](../data-cat.md))

### NEXT UP — Phase 2: Data Ingestion
- [ ] `scripts/lib/api-client.ts` — HTTP client for Tabular API
- [ ] `scripts/ingest-deputes.ts` — 577 active + 2101 historic
- [ ] `scripts/ingest-senateurs.ts` — CSV parsing from data.senat.fr
- [ ] `scripts/ingest-lobbyistes.ts` — JSON + CSV.GZ parsing from HATVP
- [ ] `scripts/ingest.ts` — Orchestrator
- [ ] Run and verify row counts

### PENDING
- Phase 3: Deputies UI (list + profile pages)
- Phase 4: Senators UI (list + profile + mandates/commissions)
- Phase 5: Lobbyists UI (registry + detail + actions)
- Phase 6: Homepage, global search, polish

---

## Tech Stack (Actual Versions)

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

## Files Created

```
data-gouv/
├── .mcp.json              # datagouv MCP (pre-existing)
├── .nvmrc                 # Node 20.19.2
├── .env.local             # DATABASE_URL
├── .gitignore
├── CLAUDE.md              # Project instructions
├── data-cat.md            # Full data catalog from MCP exploration
├── package.json           # 12 scripts (dev, build, ingest:*, db:*)
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── prisma.config.ts       # Prisma 7 datasource (project root)
├── prisma/
│   ├── schema.prisma      # 7 models
│   └── migrations/20260226190034_init/
├── documentation/
│   ├── hatvp/hatvp-blueprint.md  # Original blueprint (read-only)
│   └── initial-plan.md           # This file
├── src/
│   ├── app/
│   │   ├── globals.css    # Tailwind import
│   │   ├── layout.tsx     # Dark theme, Inter, fr lang
│   │   └── page.tsx       # Placeholder
│   ├── components/ui/     # Ready for shadcn/ui
│   ├── lib/db.ts          # Prisma singleton
│   └── types/             # Ready for shared types
└── scripts/lib/           # Ready for ingestion utils
```

---

## Key Ingestion URLs

| Target | URL |
|--------|-----|
| Active Deputies | `https://tabular-api.data.gouv.fr/api/resources/092bd7bb-1543-405b-b53c-932ebb49bb8e/data/` |
| Historic Deputies | `https://tabular-api.data.gouv.fr/api/resources/817fda38-d616-43e9-852f-790510f4d157/data/` |
| Senators General | `https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv` |
| Senators Mandates | `https://data.senat.fr/data/senateurs/ODSEN_ELUSEN.csv` |
| Senators Commissions | `https://data.senat.fr/data/senateurs/ODSEN_CUR_COMS.csv` |
| HATVP Registry | `http://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json` |
| HATVP Actions | `https://static.data.gouv.fr/resources/donnees-du-repertoire-des-representants-dinterets-au-format-csv/20250610-152939/2-actions.csv.gz` |

---

## Lessons Learned

1. **Prisma 7 breaking change**: `url` removed from `schema.prisma`, must use `prisma.config.ts` at project root with `datasource.url`
2. **data.gouv.fr MCP search**: Uses AND logic — short specific queries work, multi-word French queries often return zero
3. **Sénat data**: Not on Tabular API — must download CSVs directly from `data.senat.fr` (redirects HTTP→HTTPS)
4. **Port 3000**: May be in use by other projects, Next.js auto-falls back to 3001
