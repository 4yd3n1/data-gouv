# Blueprint — data-gouv civic intelligence platform

Index of the current state of the platform. Canonical architectural plan: [`../ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md). This file is a pointer map, not a substitute — update it when models, routes, or section components change.

## Stack snapshot

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- PostgreSQL 14, Prisma 7 with `@prisma/adapter-pg`
- pnpm, Node 20.19.2+
- **43 Prisma models** + `IngestionLog`, ~800K rows
- Server-rendered everywhere — no client-side data fetching

## Documentation map

| Doc | Scope |
|-----|-------|
| [`schema.md`](schema.md) | All 43 Prisma models, enums, row counts, field names |
| [`frontend.md`](frontend.md) | Routes, profile page tabs, section components, search, OG images |
| [`data-ingestion.md`](data-ingestion.md) | 10-wave ingestion pipeline, source URLs, idempotency rules |
| [`handoff.md`](handoff.md) | Session history, decisions, outstanding work |
| [`../ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md) | Long-form architectural vision |
| [`../CLAUDE.md`](../CLAUDE.md) | Agent-facing project rules |

## Phase status

| Phase | Status |
|-------|--------|
| 1–8 — foundation, ingestion, search, territory, FranceMap | ✅ complete |
| 9 — Government profiles (PersonnalitePublique, MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire, ActionLobby) | ✅ 9A–9H complete |
| 9G historical — Borne / Attal / Barnier seed files prepared | ⏳ not yet seeded |
| Session 46 — HATVP normalization + re-ingestion (1,988 InteretDeclare / 67 personnalites) | ✅ committed |
| Session 47 — **Décrets de déport** — `DecretDeport` model + `DeportBanner` + `DeportSection`, 11 seeded from `info.gouv.fr` registre | ✅ implemented, uncommitted |

## Session 47 — at a glance

- **New model** `DecretDeport` with `BasisDeport` enum (7 categories). Migration `20260421165309_add_decret_deport`.
- **Source of truth** `https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets` — not HATVP. HATVP issues private recommendations; the PM signs + publishes the décret to JORF.
- **11 décrets seeded** (Lecornu, Darmanin, Papin, Barrot, Rist, Amiel, Baptiste, Tabarot, Bergé, Chabaud, Forissier). HATVP press release cited 14; 3 décrets signed but not yet in the registre.
- **UI surfaced** on `/profils/[slug]`: `DeportBanner` (cross-tab red strip below `ProfileHero`) + `DeportSection` (full cards in Déclarations HATVP tab, `#deports` anchor).
- **Scripts**: `scripts/seed-decrets-deport.ts` (idempotent upsert on `(personnaliteId, perimetre)`).

## Outstanding work

- Seed historical governments (Borne / Attal / Barnier).
- Link remaining `deputeId` values on Lecornu II ministers.
- Consider adding `deport` signal type to `src/lib/signals.ts` so `/signaux` surfaces the 11 déports.
- Re-check `info.gouv.fr` registre weekly for the 3 missing Lecornu II déports.
