# CLAUDE.md (data-gouv civic intelligence platform)

Guidance for Claude Code. Keep current; remove or update if things change.

## Project Overview

French civic intelligence platform ingesting public data from data.gouv.fr, INSEE, and other government open data sources into PostgreSQL. Cross-references governance, economy, territory, and cultural heritage. Sole objective: **show transparency through data**.

Architectural blueprint: [`ARCHITECTURAL-PLAN.md`](ARCHITECTURAL-PLAN.md) — never lose this.

## Tech Stack

- **Next.js 16** (App Router, TypeScript), **Tailwind CSS 4**
- **PostgreSQL 14** + **Prisma 7** ORM (with `@prisma/adapter-pg` driver)
- **pnpm** / **Node.js 20.19.2+** (minimum for Prisma 7)
- ~800K rows across 30 models + IngestionLog. Full schema: [`documentation/schema.md`](documentation/schema.md)
- Full frontend reference: [`documentation/frontend.md`](documentation/frontend.md)

## MCP Integration

- Config: `.mcp.json` → `https://mcp.data.gouv.fr/mcp`
- 10 tools (search_datasets, query_resource_data, etc.) — use to discover datasets, not app runtime

## Commands

```bash
pnpm dev              # Next.js dev server (port 3000) — auto-uses Node 20.19.2 via .nvmrc
pnpm build            # Production build
pnpm db:migrate       # Run Prisma migrations
pnpm db:generate      # Generate Prisma client (required after every migration)
pnpm ingest           # Full ingestion (all waves — see scripts/ingest.ts)
pnpm refresh:search   # Wave 10: refresh search_index materialized view
```

Detailed ingest scripts, wave ordering, and API URLs: `.claude/rules/ingestion.md` (auto-loads when editing scripts/).

## Database

- **Name**: `datagouv` — `postgresql://aydenmomika@localhost:5432/datagouv`
- **CRITICAL**: always `import { prisma } from "@/lib/db"` — named export. Default import causes build error.
- Prisma 7 datasource URL lives in `prisma.config.ts`, not `schema.prisma`

## Rules

- Never commit secrets or `.env.local`
- Never push without explicit user approval
- Ingestion scripts must be idempotent (upsert, not insert)
- All monetary/numeric displays use French formatting (1 234,56 €) — use `src/lib/format.ts`
- Dark theme (slate bg, teal accents) — "Intelligence Bureau" aesthetic
- No emojis in UI; French UI copy: direct, natural, Le Monde register
- Node.js 20.19.2+ required; run `pnpm db:generate` after every migration

## Rules Files (auto-loaded by Claude Code)

- `.claude/rules/ingestion.md` — wave order, API URLs, idempotency rules (loads when editing `scripts/**`)
- `.claude/rules/schema.md` — critical field names, DB config, Prisma gotchas (loads when editing `prisma/**`, `src/lib/db.ts`, `scripts/lib/**`)
- `.claude/rules/frontend.md` — component patterns, theme, route structure, search rules (loads when editing `src/app/**`, `src/components/**`, `src/lib/**`)

## Compact Instructions

When compacting, always preserve:
- All files modified in the current session and what changed
- Critical schema field names (wrong names = TypeScript build errors)
- Current phase / feature being built and decisions made
- Any test results or build errors encountered
