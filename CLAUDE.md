# CLAUDE.md (data-gouv civic intelligence platform)

Guidance for Claude Code. Keep current; remove or update if things change.

## Project Overview

French civic intelligence platform ingesting public data from data.gouv.fr, INSEE, and other government open data sources into PostgreSQL. Cross-references governance, economy, territory, and cultural heritage. Sole objective: **show transparency through data**.

Architectural blueprint: [`ARCHITECTURAL-PLAN.md`](ARCHITECTURAL-PLAN.md) — never lose this.

## Tech Stack

- **Next.js 16** (App Router, TypeScript), **Tailwind CSS 4**
- **PostgreSQL 14** + **Prisma 7** ORM (with `@prisma/adapter-pg` driver)
- **pnpm** / **Node.js 20.19.2+** (minimum for Prisma 7)
- ~1M rows across 57 Prisma models + `IngestionLog`. Full schema: [`documentation/schema.md`](documentation/schema.md)
- Full frontend reference: [`documentation/frontend.md`](documentation/frontend.md)
- Ingestion pipeline reference: [`documentation/data-ingestion.md`](documentation/data-ingestion.md); data-source catalog: [`data-cat.md`](data-cat.md); blueprint index: [`documentation/blueprint.md`](documentation/blueprint.md)

## Editorial / research dossiers

Analytical documents distinct from technical references. Load on demand.

- [`documentation/presidency-recap.md`](documentation/presidency-recap.md) — Macron presidency recap (Apr 28, 2026, ~6 500 mots). Cross-references `EntreeCarriere`, `MandatGouvernemental`, `ActionLobby` (Élysée), `EvenementJudiciaire`, `Indicateur`/`Observation`, plus external sources (Cour des comptes, Sénat, INSEE, DREES, Oxfam, RSF, EIU, RTE, CRE). Includes detailed §9.3 on French electricity market liberalization, ARENH structural critique, bouclier tarifaire fiscal cost (72 Md€ brut, 36 Md€ net), CRIM rendement (2–5 % du potentiel), EDF renationalization. Editorial register: Le Monde, sourced, distinguishing measured facts from interpretation.

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

## Phase 9 — Government Profiles

Phases 9A–9H complete. Reference docs (load on demand, not always):
- Plan: `@documentation/phases/phase9-plan.md`
- Checklists: `@documentation/phases/PHASE-9-CHECKLISTS.md`
- Workflow: `@documentation/phases/PHASE-9-WORKFLOW.md`

**Component rule**: New `/profils/[slug]` (ex-`/gouvernement`) sections must be self-contained components (`<HatvpDeclarationsSection />`, `<InteretsSection />`, `<LobbySection />`, `<DeportSection />`, `<CareerSection />`, `<ProfileSummary />`, etc.) imported into `page.tsx`. Never inline section logic directly in `page.tsx`.

### Session 68 — HATVP declarations surface simplification

Minister `Documents` now means **Déclarations HATVP** and is powered by `<HatvpDeclarationsSection>` (`src/components/gouvernement/hatvp-declarations-section.tsx`). It is the canonical profile surface for DI + DSP.

- **Reading goal**: show both `DI — Déclaration d'intérêts` and `DSP — Déclaration de situation patrimoniale` for each government member in one clean, readable tab.
- **DI framing**: split `Fonctions publiques et gouvernementales`, `Revenus non publics déclarés`, and `Mandats électifs`. Book income, private-sector jobs, advances, consulting, publisher income, etc. must be labeled **Non public** and kept separate from public remuneration.
- **DSP framing**: show Actifs / Passif / Net first, then grouped rows for important patrimoine sections (`Immeubles`, `Assurances vie`, `Comptes & épargne`, `Passif`) with native `<details>` for density.
- **Source discipline**: values come from `getDossierData()` (`DeclarationInteret` + `RevenuDeclaration` + `DeclarationPatrimoine` + `PatrimoineRow`). Do not relabel declared HATVP amounts as certified salary or employer cost.
- **Legacy note**: `<HatvpDossier>` remains a lower-level/raw PDF-faithful renderer but is no longer the primary `/profils/[slug]?tab=documents` UX.

### Session 66 — Investigation-surface transformation

Whole-frontend pivot from "datasets exposed" to a consistent investigation surface. Same reading order on every profile, same vocabulary across the site. Full session entry in [`documentation/handoff.md`](documentation/handoff.md) → Recent Sessions → Session 66.

- **5-section profile frame** — `Résumé / Signaux / Chronologie / Relations / Documents` on minister + deputy + senator. Same tab keys, type-specific labels (deputy tab 3 = "Activité", senator tab 3 = "Mandats"). President variant keeps specialized tabs. Parti uses h2 section markers in same vocabulary, single-scroll. Lobbyiste kept on Variant A editorial register.
- **Documents tab meaning** — for ministers, `Documents` is the HATVP declarations surface, not a CV/payroll page. It should answer: what did they declare in DI, what did they declare in DSP, which revenues are public vs non-public, and what patrimoine/passif is visible.
- **Foundation primitives** — `<SourceChip>` (with `basis` field for computed-indicator provenance — never flatten), `<SignalFormula>` (reads from `SIGNAL_REGISTRY` in `signal-types.ts`), `<DataFreshnessBadge>` (NOT `LastVerifiedBadge` — "vérifié" is reserved for officially-verified facts), `<RelationsGrid>`, `<StaleDataNotice>`.
- **Dashboard homepage** — `GouvernementBoard` + Signaux band + lobby InteractiveStrip + `VotesStructurants` above the fold; `HatvpScoreboard` + Territoires + Dossiers rotation + Méthodologie/Corrections band below.
- **Trust layer** — new `/corrections` route reading `IngestionLog` + RESOLVED `ErrorReport` (URL-sanitized via `safeUrl()` / `safeSubmittedUrl()`). `/methodologie` extended with 7 anchored signal sections generated dynamically from `SIGNAL_REGISTRY`.
- **Search investigation cards** — `enrichSearchResults(results, topN=5)` joins signal counts on top 5 (cache-ready helper shape). `getLobbyisteAgoraCounts` enriches lobbyiste results.
- **HTTP 308 tab redirects** in `next.config.ts` — minister source uses `:slug((?!emmanuel-macron$)[^/]+)`. The `[^/]+` is critical: `.+` greedily crosses `/` and preempts senator/deputy rules.
- **Universal signal caveat** — "Un signal est un croisement de données, pas une preuve." embedded on every signal surface via `SIGNAL_REGISTRY[type].caveat`. Never opt-out.

### Session 47 — Décrets de déport (ministerial conflict of interest)

- New model: `DecretDeport` + enum `BasisDeport` (7 categories). Migration `20260421165309_add_decret_deport`.
- **Source of truth**: `https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets` — registre du Premier ministre. **Not HATVP** — HATVP reviews privately and issues recommendations; the PM signs the décret and publishes to JORF.
- Registre page is Cloudflare-protected; fetch via browser automation (claude-in-chrome), encode as typed `DeportSeed[]` in `scripts/seed-decrets-deport.ts`.
- Idempotent upsert on `(personnaliteId, perimetre)` composite unique.
- 11 décrets seeded (Lecornu II). HATVP cited 14; 3 signed but not yet in the registre — re-check weekly.
- UI: `<DeportBanner />` (cross-tab red alert below `ProfileHero`) + `<DeportSection />` (inside the `Signaux` tab, `#deports` anchor). Déports are PM/JORF conflict-prevention signals, not HATVP declaration rows.
- Distinct from the legacy `Deport` model (AN per-instance deputy recusals — different thing).

## Pre-2027 Civic-Virality Strategy (Session 63 — planning, not yet shipped)

Strategic plan + 5 P0 subplans for pre-2027 launch synthesized 2026-05-02. **Plans live at `~/.claude/plans/`** (outside repo, personal scope). Load on demand when working on the corresponding track:

- **Master plan**: `~/.claude/plans/ok-give-me-final-dazzling-wave.md` — flywheel framing (Video → /v/[slug] landing → site polish → Tier-1 citations); P0/P1/P2/Q4 tracks; cuts (ElevenLabs, landscape format) and deferrals (newsletter, bots, quiz formats → P2).
- **P0.1 Legitimacy stack**: `~/.claude/plans/p0-1-legitimacy-stack.md` — `/apropos`, JSON-LD (Organization + Person + GovernmentPosition), per-route OG/Twitter cards on `/profils/[slug]`+`/signaux`+`/dossiers/[slug]`, `/signaler-une-erreur` + `ErrorReport` model, `robots.ts` + dynamic `sitemap.ts`, `not-found.tsx`/`loading.tsx`/`error.tsx`, footer placeholder activation.
- **P0.2 Per-video landing pages `/v/[slug]`**: `~/.claude/plans/p0-2-landing-pages.md` — file-based manifest reading from Remotion drafts dir; HTML chart renderer mirroring Remotion compositions; sources expanded; embed/newsletter CTAs (newsletter form to `NewsletterPending` model). **Blocked by P0.3** (shared schemas).
- **P0.3 AI pipeline + schema sharing**: `~/.claude/plans/p0-3-ai-pipeline.md` — shared `viral-schemas` package via `file:` protocol at `/Users/aydenmomika/packages/viral-schemas/`; read-only `remotion_reader` Postgres role + symlinked `schema.prisma`; Anthropic Claude 4.7 LLM draft generator with prompt caching + Zod validation + idempotent SHA-256 cache; 4 TODO providers fleshed out (`personnalite:<slug>`, `judicial:<id>`, `lobby:<ministereCode>`, `conflict:<id>`). **Sourcing gate stays sacred — do not modify**. Default scope: augment, not replace.
- **P0.4 Polish audit**: `~/.claude/plans/p0-4-polish-audit.md` — route-by-route audit checklist at `documentation/launch-polish-audit.md`; mobile spot-fix on hot routes at 375×812; Lighthouse ≥ 90 perf / ≥ 95 a11y on `/`+`/profils/[slug]`+`/v/[slug]`; `linkinator` dead-link sweep; axe DevTools AA pass.
- **P0.5 Mon député rebrand**: `~/.claude/plans/p0-5-mon-depute.md` — new `/mon-depute` route deliberately narrow (`/mon-territoire` stays as comprehensive dashboard); branded result card with HATVP highlights + votes + contradictions; share buttons (WhatsApp first); per-`?cp=` cached dynamic OG image. Reuses `resolvePostalCode()` from `src/lib/postal-resolver.ts`.

**Sequencing**: P0.1 + P0.4 + P0.5 independent; P0.3 blocks P0.2. Recommended ship order: P0.1 → (P0.3 || P0.4 || P0.5 in parallel) → P0.2 → launch gate. Cross-tracks: P1 (citation/embargo strategy, format diversification, distribution ops) starts post-launch; P2 (newsletter, bots, embeds) deferred per user; Q4 = 2027 election-debate live fact-check dashboard (design doc target 2026-08-31).

**Open decisions surfaced for user before P0.3 kickoff**: AI pipeline scope (augment vs replace), `/apropos` disclosure level, schema-package format (local-link default), `/mon-depute` route name. None launch-blocking.

## Rules Files (auto-loaded by Claude Code)

- `.claude/rules/ingestion.md` — wave order, API URLs, idempotency rules (loads when editing `scripts/**`)
- `.claude/rules/schema.md` — critical field names, DB config, Prisma gotchas (loads when editing `prisma/**`, `src/lib/db.ts`, `scripts/lib/**`)
- `.claude/rules/frontend.md` — component patterns, theme, route structure, search rules (loads when editing `src/app/**`, `src/components/**`, `src/lib/**`)
- `.claude/rules/gouvernement.md` — Phase 9 model field names, HATVP/AGORA gotchas (loads when editing `src/app/gouvernement/**`, `scripts/**gouvernement*`, `scripts/**hatvp*`, `scripts/**agora*`)

## Context Management

Context is your most important resource. Proactively use subagents (Task tool) to keep exploration, research, and verbose operations out of the main conversation.

**Default to spawning agents for:**
- Codebase exploration (reading 3+ files to answer a question)
- Research tasks (web searches, doc lookups, investigating how something works)
- Code review or analysis (produces verbose output)
- Any investigation where only the summary matters

**Stay in main context for:**
- Direct file edits the user requested
- Short, targeted reads (1-2 files)
- Conversations requiring back-and-forth
- Tasks where user needs intermediate steps

**Rule of thumb:** If a task will read more than ~3 files or produce output the user doesn't need to see verbatim, delegate it to a subagent and return a summary.

## Compact Instructions

When compacting, always preserve:
- All files modified in the current session and what changed
- Critical schema field names (wrong names = TypeScript build errors)
- Current phase / feature being built and decisions made
- Any test results or build errors encountered
