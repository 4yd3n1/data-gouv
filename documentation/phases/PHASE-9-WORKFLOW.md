# Phase 9 — Claude Code Workflow & Parallel Agent Strategy

> Companion document to PHASE-9-PLAN.md
> Purpose: How to organize, parallelize, test, and verify Phase 9 work using Claude Code
> Stack: Next.js + Prisma + PostgreSQL on Hetzner

---

## 1. Project Foundation: CLAUDE.md

Before any agent touches the codebase, the project needs a solid `CLAUDE.md` at root. This is the single most important file — every agent session, every worktree, every subagent reads it. Keep it under 300 lines. Reference other files for detail.

### Recommended CLAUDE.md structure for L'Observatoire:

```markdown
# L'Observatoire Citoyen

French civic data platform. Next.js 14 App Router + Prisma + PostgreSQL.
Production: Hetzner VPS. ISR caching with revalidate.
Bureau-dark aesthetic: zinc-900 backgrounds, teal-400 accents, mono headings.

## Commands
npm run dev              # Start dev server (port 3000)
npm run build            # Production build (catches type errors)
npm run lint             # ESLint
npx prisma migrate dev   # Run pending migrations
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db seed       # Run seed scripts
npm run test             # Jest tests (if configured)

## Architecture
- /src/app/             → App Router pages (server components by default)
- /src/components/      → Shared UI components
- /src/lib/             → Data fetching, utilities, Prisma queries
- /prisma/schema.prisma → Single schema file, all models
- /prisma/seed/         → Seed scripts (TypeScript)
- /public/              → Static assets

## Key Patterns
- Server Components by default. Only use "use client" when interactivity required.
- Data fetching in page.tsx via async functions calling /src/lib/ helpers.
- ISR: use `export const revalidate = 3600` on data pages.
- Prisma queries: use `select` to limit fields. Use `$queryRaw` for complex analytics.
- All French-language UI. Variable names and comments in English.
- Tailwind only. No CSS modules, no styled-components.

## Database
- PostgreSQL 15. Prisma ORM.
- ~36 models after Phase 9. See @prisma/schema.prisma
- Migrations are linear. Never edit existing migrations.

## Phase 9 Specifics
- New models: PersonnalitePublique, MandatGouvernemental, EntreeCarriere,
  InteretDeclare, EvenementJudiciaire, ActionLobby
- See @docs/PHASE-9-PLAN.md for full data model and reasoning
- See @docs/PHASE-9-CHECKLISTS.md for acceptance criteria per sub-phase

## Gotchas
- NEVER delete or overwrite existing seed data for other phases
- NEVER modify existing Prisma models without explicit instruction
- Always run `npx prisma generate` after schema changes
- Always run `npm run build` before declaring a task complete
- Bureau aesthetic: no rounded corners > md, no bright colors, zinc palette
- XML parsing: use fast-xml-parser, NOT xml2js (memory issues on large files)
- HATVP XML files can be 200MB+. Stream, don't load into memory.
```

The `@docs/PHASE-9-PLAN.md` syntax tells Claude Code to load that file when needed, without bloating every session's context.

---

## 2. Custom Agents — Your Specialist Team

Claude Code lets you define specialized agents in `.claude/agents/`. Each is a markdown file with YAML frontmatter that any session can spawn as a subagent. They inherit your CLAUDE.md context automatically.

For Phase 9, create these specialists:

### Agent 1: Schema Architect — `.claude/agents/schema-architect.md`

```markdown
---
name: schema-architect
description: Designs and implements Prisma schema changes, migrations, and seed scripts
model: opus
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

You are a database schema specialist for a Next.js + Prisma + PostgreSQL project.

## Your responsibilities:
- Design Prisma models that follow existing conventions in schema.prisma
- Write migrations (via `npx prisma migrate dev --name <name>`)
- Write TypeScript seed scripts in /prisma/seed/
- Validate schema consistency (relations, indexes, enums)

## Rules:
- Study existing schema.prisma before adding anything
- Use UUID for all primary keys (@default(uuid()))
- Use @updatedAt for all timestamp fields
- Add indexes on foreign keys and commonly queried fields
- Enum names in SCREAMING_SNAKE_CASE
- Model names in PascalCase, field names in camelCase
- After schema changes: run prisma generate, then prisma migrate dev
- After migration: run npm run build to verify no type errors

## Verification:
After completing work, run these checks and report results:
1. `npx prisma validate` — schema is valid
2. `npx prisma generate` — client regenerates without error
3. `npm run build` — full build passes
4. Check that existing tests still pass
```

### Agent 2: Data Ingestor — `.claude/agents/data-ingestor.md`

```markdown
---
name: data-ingestor
description: Builds ingestion scripts for external data sources (HATVP, AGORA, gouvernement.fr)
model: sonnet
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

You are a data pipeline specialist. You build TypeScript scripts that download,
parse, and ingest external data into PostgreSQL via Prisma.

## Your responsibilities:
- Write ingestion scripts in /prisma/seed/ or /scripts/ingest/
- Handle CSV, XML, and JSON parsing
- Implement fuzzy name matching for cross-referencing people across sources
- Handle encoding issues (French accents, special characters)
- Implement idempotent upserts (re-running a script never duplicates data)

## Data source rules:
- HATVP XML: use fast-xml-parser with streaming for large files
- AGORA JSON: 80MB file, parse incrementally
- Always store the source URL and access date for every ingested record
- Normalize French names: lowercase, remove accents, trim particles (de, du, le)
- Log ingestion stats: records processed, inserted, updated, skipped, errors

## Verification:
1. Script runs without error: `npx tsx scripts/ingest/<script>.ts`
2. Database has expected record count: verify with prisma studio or raw query
3. No duplicate records on re-run
4. All foreign key references resolve
5. `npm run build` passes
```

### Agent 3: Page Builder — `.claude/agents/page-builder.md`

```markdown
---
name: page-builder
description: Builds Next.js pages and components following the bureau aesthetic
model: sonnet
allowed_tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

You are a frontend specialist for a French civic data platform with a
bureau-dark aesthetic (zinc-900 backgrounds, teal-400 accents, Inter + JetBrains Mono).

## Your responsibilities:
- Build Next.js App Router pages (server components first)
- Create reusable UI components in /src/components/
- Implement responsive layouts with Tailwind
- Add proper metadata, OpenGraph tags, and structured data (Schema.org)

## Design system rules:
- Study 3-4 existing pages before building anything new
- Server Components by default. "use client" only for interactivity
- Tailwind only. Follow existing color conventions (zinc, teal, amber for warnings)
- No rounded corners larger than rounded-md
- French UI text. Use proper typography (guillemets « », non-breaking spaces before :;!?)
- Tables: border-zinc-800, header bg-zinc-800/50
- Cards: bg-zinc-900 border border-zinc-800
- Links: text-teal-400 hover:text-teal-300
- ISR: add `export const revalidate = 3600` to data pages

## Verification:
1. `npm run build` passes without errors
2. Page renders correctly at /gouvernement and /gouvernement/[slug]
3. Responsive: works at mobile (375px), tablet (768px), desktop (1280px)
4. No hydration errors in browser console
5. Metadata and OG tags present (check with View Source)
```

### Agent 4: Test & Verify — `.claude/agents/verifier.md`

```markdown
---
name: verifier
description: Runs acceptance checks, validates data integrity, catches regressions
model: sonnet
allowed_tools:
  - Read
  - Bash
  - Glob
  - Grep
---

You are a QA specialist. You verify that completed work meets acceptance criteria
without introducing regressions.

## Your workflow:
1. Read the checklist for the current sub-phase from @docs/PHASE-9-CHECKLISTS.md
2. Run each check systematically
3. Report: PASS / FAIL / WARN for each item
4. If FAIL: describe what's wrong and which file needs fixing

## Standard checks (run for EVERY sub-phase):
- `npx prisma validate` — schema valid
- `npx prisma generate` — client generates
- `npm run build` — full build passes (this catches type errors)
- `npm run lint` — no new lint errors
- Check that no existing routes are broken (grep for import errors)
- Check that no existing seed data was overwritten

## Data integrity checks:
- All PersonnalitePublique records have a slug
- All MandatGouvernemental records have valid personnaliteId FK
- No orphaned records in child tables
- InteretDeclare records link to valid PersonnalitePublique
- No duplicate slugs

## You NEVER modify code. You only read and report.
```

---

## 3. Custom Skills — Reusable Workflows

Skills are like agents but can bundle scripts. Put these in `.claude/skills/`:

### Skill: HATVP Parser — `.claude/skills/hatvp-parse/SKILL.md`

```markdown
---
name: hatvp-parse
description: Parse HATVP open data declarations (CSV index + XML content)
invocation: user
---

## Instructions

When asked to parse HATVP data:

1. Download the CSV index from https://www.hatvp.fr/open-data/
2. Filter declarations for government officials (Ministre, Secrétaire d'État, etc.)
3. Parse the XML declarations using the bundled schema reference
4. Map XML sections to InteretDeclare model fields per the mapping in mapping.md
5. Output upsert-ready JSON

See @mapping.md for XML section → database field mapping.
See @schema-sample.xml for example declaration structure.
```

### Skill: Acceptance Check — `.claude/skills/phase-check/SKILL.md`

```markdown
---
name: phase-check
description: Run acceptance criteria checklist for a completed sub-phase
invocation: user
---

## Instructions

When invoked with `/phase-check 9A` (or 9B, 9C, etc.):

1. Read the relevant checklist from docs/PHASE-9-CHECKLISTS.md
2. Execute each check item (build, lint, data queries, route checks)
3. Output a structured report:

### Phase 9A — Acceptance Report
| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | Prisma schema valid | ✅ PASS | |
| 2 | Build passes | ✅ PASS | |
| 3 | /gouvernement renders | ✅ PASS | 35 members displayed |
| ... | ... | ... | ... |

4. If any FAIL: stop and describe what needs fixing before proceeding
```

---

## 4. Checklists File — The Source of Truth

Create `docs/PHASE-9-CHECKLISTS.md` in the repo. This is what the verifier agent and the `/phase-check` skill read. Every sub-phase gets explicit, testable criteria.

```markdown
# Phase 9 — Acceptance Checklists

## 9A: Data Model + Government Seed

### Schema
- [ ] PersonnalitePublique model exists with all fields from PHASE-9-PLAN
- [ ] MandatGouvernemental model exists with all fields
- [ ] EntreeCarriere model exists with all fields
- [ ] InteretDeclare model exists with all fields
- [ ] EvenementJudiciaire model exists with all fields
- [ ] ActionLobby model exists with all fields
- [ ] All enums defined (TypeMandat, CategorieCarriere, TypeEvenement, etc.)
- [ ] Indexes on: personnaliteId (all child tables), slug (unique), ministereCode
- [ ] `npx prisma validate` passes
- [ ] `npx prisma migrate dev` creates migration without error

### Seed
- [ ] Seed script populates current government (~35 members)
- [ ] President record exists with type = PRESIDENT
- [ ] PM record exists with type = PREMIER_MINISTRE
- [ ] All ministers have: nom, prenom, slug, titreCourt, dateDebut
- [ ] Députés cross-referenced: where match exists, deputeId is set
- [ ] Re-running seed doesn't create duplicates (upsert on slug)

### Pages
- [ ] /gouvernement renders a grid of all government members
- [ ] /gouvernement/[slug] renders basic profile with photo placeholder
- [ ] Members sorted by protocol order (rang field)
- [ ] Click navigates to individual profile
- [ ] Bureau aesthetic: zinc-900 bg, teal accents, proper typography

### Integration
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No existing routes broken
- [ ] No existing seed data affected
- [ ] revalidate = 3600 set on both new pages

---

## 9B: HATVP Interest Declarations

### Ingestion
- [ ] Script downloads and parses HATVP CSV index
- [ ] Filters to government officials only
- [ ] Parses XML declarations into InteretDeclare records
- [ ] Maps all 7+ rubrique types correctly
- [ ] Matches declarations to PersonnalitePublique by normalized name
- [ ] Stores declarationRef and dateDeclaration
- [ ] Re-run is idempotent
- [ ] Ingestion logs: X processed, Y inserted, Z matched, W unmatched

### Display
- [ ] Profile page shows "Intérêts déclarés" section
- [ ] Grouped by rubrique with collapsible sections
- [ ] Each item shows: contenu, organisation (if any), dates (if any)
- [ ] Link to original HATVP declaration
- [ ] "Aucune déclaration référencée" when empty (not blank section)
- [ ] Multiple declarations: most recent shown by default

### Integration
- [ ] `npm run build` passes
- [ ] Profile page doesn't break for ministers with 0 declarations
- [ ] Profile page handles ministers with 30+ items gracefully

---

## 9C: AGORA Lobby Registry

### Ingestion
- [ ] Script downloads AGORA consolidated JSON
- [ ] Parses lobby actions targeting ministerial cabinets
- [ ] ministereCode matching table exists and is documented
- [ ] ActionLobby records created with all required fields
- [ ] Deduplication on org + ministry + year
- [ ] Re-run is idempotent

### Display
- [ ] Profile page shows "Lobbying déclaré" section
- [ ] Summary: total actions this year, top organizations
- [ ] Breakdown by domain
- [ ] Each entry links to AGORA registry source
- [ ] Neutral framing ("ciblant ce ministère" not "influencing")
- [ ] Empty state handled

### Integration
- [ ] `npm run build` passes
- [ ] AGORA data doesn't bloat page load (paginate or limit)

---

## 9D: Career Timeline

### Data Generation
- [ ] Script auto-generates EntreeCarriere from MandatGouvernemental
- [ ] Script auto-generates EntreeCarriere from Depute/Senateur records
- [ ] Script extracts career entries from HATVP ACTIVITE_ANTERIEURE
- [ ] Deduplication: same role from 2 sources doesn't create 2 entries
- [ ] Each entry has source field (HATVP / ASSEMBLEE / MANUELLE)

### Display
- [ ] Vertical timeline component renders on profile page
- [ ] Present (top) to past (bottom) chronological order
- [ ] Visual differentiation by categorie (government = filled bar, elected = circle, etc.)
- [ ] Date ranges displayed (or "depuis" for ongoing)
- [ ] Source badge on each entry
- [ ] Handles ministers with sparse timelines gracefully

### Integration
- [ ] `npm run build` passes
- [ ] Timeline component is a separate reusable component
- [ ] No layout shift on page load

---

## 9E: Full Profile UI

### Layout
- [ ] Profile header: photo, name, title, age, education, party
- [ ] Tabbed or scrollable sections: Parcours, Intérêts, Judiciaire, Lobbying
- [ ] "Affaires judiciaires" section shows "Aucune affaire référencée" placeholder
- [ ] Cross-link to parliamentary profile if deputeId exists
- [ ] Responsive: mobile, tablet, desktop

### Government Index
- [ ] Grouped by type: President → PM → Ministres → Délégués → Secrétaires
- [ ] Government name and formation date displayed
- [ ] Search/filter by name or portfolio

### Navigation
- [ ] "Gouvernement" in main navbar
- [ ] SEO: meta title, description, OG tags on all profile pages
- [ ] Schema.org Person structured data
- [ ] Print stylesheet (@media print) for clean CV output

### Integration
- [ ] `npm run build` passes
- [ ] All 35+ profile pages render without error
- [ ] Lighthouse performance score > 80

---

## 9F: Research Agent

### Agent Script
- [ ] Node.js script calls Claude API with web search
- [ ] Processes one minister at a time
- [ ] Career enrichment: extracts milestones from press sources
- [ ] Judicial history: extracts proceedings with proper legal terminology
- [ ] Every claim has: sourceUrl, sourceDate, sourcePrincipale
- [ ] Output: JSON file per minister in /data/research-output/

### Review Workflow
- [ ] CLI or simple UI to review agent output
- [ ] Accept / reject / edit per item
- [ ] Accepted items ingested into database with verifie = true
- [ ] Rejected items logged but not displayed

### Safety
- [ ] No judicial claim displayed without verifie = true
- [ ] Source URLs are valid and accessible
- [ ] Only Tier 1-3 press sources used
- [ ] No editorializing in resume fields

---

## 9G: President + Historical Governments

- [ ] President profile has expanded sections (elections, 49.3, governments formed)
- [ ] Historical government list: at least 2 previous governments
- [ ] Each historical government shows full member list
- [ ] /gouvernement?mandat=X filter works
- [ ] Cross-links from minister timelines to government pages
- [ ] `npm run build` passes
```

---

## 5. Parallel Execution Strategy

This is where the real speed comes from. Phase 9 has natural parallelism — use it.

### The Dependency Graph

```
9A (schema + seed + basic pages)
 │
 ├──→ 9B (HATVP ingestion)      ── can start as soon as schema exists
 ├──→ 9C (AGORA ingestion)      ── can start as soon as schema exists
 ├──→ 9D (career timeline)      ── needs 9B partially (HATVP data) but can start structure
 │
 └──→ 9E (full UI)              ── needs 9B + 9C + 9D data to be complete
      │
      └──→ 9F (research agent)  ── needs 9E pages to display results
           │
           └──→ 9G (president + history) ── needs everything above
```

**Key insight:** 9B, 9C, and parts of 9D can run in parallel once 9A is merged. They touch completely different files:
- 9B touches: `/scripts/ingest/hatvp.ts`, `/src/lib/hatvp-queries.ts`, interests section of profile page
- 9C touches: `/scripts/ingest/agora.ts`, `/src/lib/lobby-queries.ts`, lobby section of profile page
- 9D touches: `/scripts/generate-career.ts`, `/src/components/CareerTimeline.tsx`

No file overlap = safe parallelism.

### Worktree Setup

For the parallel phase (9B + 9C + 9D), open 3 terminal windows:

```bash
# Terminal 1: HATVP ingestion
claude --worktree phase9b-hatvp

# Terminal 2: AGORA ingestion
claude --worktree phase9c-agora

# Terminal 3: Career timeline
claude --worktree phase9d-timeline
```

Each gets its own branch, its own working directory, its own Claude session. No conflicts.

**Your role as orchestrator:**
1. Fire off each session with a focused prompt (see Section 6)
2. Monitor progress across terminals
3. When each finishes, run `/phase-check 9B` (etc.) in that worktree
4. If checks pass, merge to main: `git checkout main && git merge worktree-phase9b-hatvp`
5. After all three merged, start 9E on main

### When NOT to Parallelize

- **9A (schema)** — must be sequential on main. All other work depends on it.
- **9E (full UI)** — integrates work from 9B + 9C + 9D. Must run after they merge.
- **9F (research agent)** — depends on having profiles to enrich. Sequential.
- **9G (president)** — depends on everything. Last in line.

The rule is simple: if two tasks edit different files and have no data dependency, parallelize. If they share files or one needs the other's output, serialize.

---

## 6. Session Prompts — What to Tell Each Agent

The quality of your initial prompt determines whether you spend 20 minutes or 2 hours on a sub-phase. Be specific, reference files, and state the exit criteria.

### 9A Prompt (main branch, single session):

```
I'm implementing Phase 9A of L'Observatoire Citoyen — government official profiles.

Read @docs/PHASE-9-PLAN.md for the full data model specification.
Read @docs/PHASE-9-CHECKLISTS.md section 9A for acceptance criteria.

Tasks:
1. Add 6 new Prisma models to schema.prisma: PersonnalitePublique,
   MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire,
   ActionLobby. Follow the field specs in the plan exactly. Add all enums.
2. Run prisma migrate dev --name "add-government-profiles"
3. Create seed script at prisma/seed/gouvernement.ts that populates the current
   French government. Use data from the latest government composition.
4. Build /gouvernement/page.tsx — grid of all members sorted by rang
5. Build /gouvernement/[slug]/page.tsx — basic profile shell with photo, name,
   title, dates, and empty section placeholders
6. Cross-reference: for each minister, check if they exist in the Depute table
   by name and link deputeId if found

When done, run every check in the 9A checklist and report results.
```

### 9B Prompt (worktree, after 9A merged):

```
I'm implementing Phase 9B — HATVP interest declaration ingestion.

Read @docs/PHASE-9-PLAN.md section "Source 1: HATVP Open Data" for context.
Read @docs/PHASE-9-CHECKLISTS.md section 9B for acceptance criteria.

The Prisma schema already has InteretDeclare model. Don't modify the schema.

Tasks:
1. Create /scripts/ingest/hatvp.ts
   - Download liste.csv from HATVP open data
   - Filter to declarations where qualite matches government roles
   - Parse corresponding XML declarations using fast-xml-parser
   - Map XML sections to InteretDeclare rubrique enum values
   - Match declarations to PersonnalitePublique records by normalized name
   - Upsert into database (idempotent)
   - Log stats: processed, inserted, matched, unmatched
2. Create /src/lib/hatvp-queries.ts with query functions:
   - getInteretsForPersonnalite(personnaliteId)
   - getDeclarationsByRubrique(personnaliteId, rubrique)
3. Add "Intérêts déclarés" section to /gouvernement/[slug]/page.tsx
   - Grouped by rubrique, collapsible
   - Link to original HATVP declaration
   - Handle empty state

When done, run every check in the 9B checklist and report results.
```

### 9C and 9D follow the same pattern — reference the plan, reference the checklist, be explicit about files to create, state exit criteria.

---

## 7. Subagent Patterns Within Sessions

Beyond worktrees for parallelism across sessions, you can use subagents within a single session for focused subtasks. Two patterns matter for Phase 9:

### Pattern A: Scout Before Build

Before implementing anything, send a scout subagent to analyze the codebase:

```
Before we start Phase 9B, spawn a subagent to explore the current codebase:
- What existing patterns are used for data ingestion scripts?
- How are query functions structured in /src/lib/?
- What's the current profile page structure at /gouvernement/[slug]/?
Report back with the patterns we should follow.
```

This prevents the building agent from inventing new patterns that clash with existing code. The scout runs read-only (Glob, Grep, Read) and returns a summary.

### Pattern B: Parallel Research Subagents

For the Phase 9F research agent, when you need to research multiple ministers:

```
Research these 5 ministers in parallel using separate subagents:
1. [Minister A] — career + judicial search
2. [Minister B] — career + judicial search
3. [Minister C] — career + judicial search
4. [Minister D] — career + judicial search
5. [Minister E] — career + judicial search

Each subagent should output a JSON file at /data/research-output/[slug].json
following the schema in @docs/research-output-schema.json
```

Claude Code will spawn 5 parallel subagents, each doing web searches independently. This is 5x faster than sequential research.

### Pattern C: Build + Verify in Sequence

After any building task, chain a verification subagent:

```
Now spawn the verifier agent to run the 9B checklist.
It should only read files and run commands — no modifications.
Report the checklist results.
```

This catches issues immediately, before you context-switch to something else.

---

## 8. Merge Strategy

With multiple worktrees producing parallel work, you need a clean merge workflow.

### The Rule: Feature Branches → Main via PR

Every worktree creates a branch. When work passes its checklist:

```bash
# In the worktree session, ask Claude to:
# 1. Commit all changes with a descriptive message
# 2. Push the branch
# 3. Create a PR targeting main

"Commit all changes, push the branch, and create a PR targeting main.
Title: 'Phase 9B: HATVP interest declaration ingestion'
Description: Include the checklist results from the verification run."
```

### Merge Order Matters

When 9B, 9C, and 9D all finish around the same time:

1. Merge 9B first (HATVP) — it's the largest and most foundational
2. Merge 9C second (AGORA) — no overlap with 9B files
3. Merge 9D last (timeline) — it depends on 9B's HATVP data being present

After each merge into main, the next worktree should rebase on updated main before creating its PR. This keeps the history clean and catches integration issues early.

### Handling Conflicts

The only likely conflict zone is the profile page (`/gouvernement/[slug]/page.tsx`), since 9B, 9C, and 9D all add sections to it.

**Prevention strategy:** In 9B, 9C, and 9D, each agent builds its section as a standalone component:
- 9B creates `<InteretsSection personnaliteId={id} />`
- 9C creates `<LobbySection ministereCode={code} />`
- 9D creates `<CareerTimeline personnaliteId={id} />`

The profile page just imports and renders these components. When merging, each PR adds one import + one component render — trivial to resolve even if they conflict.

**Put this rule in CLAUDE.md:** "New profile sections must be self-contained components imported into the profile page. Never inline section logic directly in page.tsx."

---

## 9. Session Naming & Resume

Claude Code lets you resume sessions. Name them well:

```bash
# Start named sessions
claude --worktree phase9b-hatvp --resume "Phase 9B: HATVP Ingestion"
```

Use `/resume` to find and continue sessions. This matters because:
- Phase 9B might take multiple sittings
- You might need to pause, review, and continue
- Named sessions are findable in the `/resume` picker

### Session Hygiene

At the start of each session, tell Claude:

```
We're continuing Phase 9B. Read @docs/PHASE-9-CHECKLISTS.md section 9B.
Last time we completed the ingestion script. Today: build the display components.
Here's where we left off: [brief description]
```

Claude Code has no memory between sessions. Every resume needs context. The CLAUDE.md provides project context; you provide task context.

---

## 10. The Research Agent (Phase 9F) — Special Architecture

The research agent is different from everything else because it calls the Claude API from your code, not from Claude Code itself. This is "Claude calling Claude."

### Why Not Just Use Claude Code Directly?

Because the research agent needs to:
1. Run in batch mode (process 35 ministers overnight)
2. Produce structured JSON output (not conversational text)
3. Use web search systematically (not ad hoc)
4. Be re-runnable with consistent output format
5. Feed into a review queue (not directly into the database)

### Implementation with Claude Code

Use Claude Code to *build* the research agent, then run the agent as a standalone script:

```bash
# Session 1: Build the agent script
claude --worktree phase9f-agent
> "Build a Node.js script at /scripts/research-agent.ts that:
   1. Takes a minister slug as argument
   2. Reads their PersonnalitePublique + existing data from the database
   3. Calls the Anthropic API with web search to research their career + judicial history
   4. Outputs structured JSON to /data/research-output/[slug].json
   5. See @docs/research-output-schema.json for the expected output format
   6. See PHASE-9-PLAN.md section 9F for the system prompt and search strategy"

# Session 2: Run the agent for all ministers
npx tsx scripts/research-agent.ts bruno-le-maire
npx tsx scripts/research-agent.ts gerald-darmanin
# ... or write a batch runner that processes all ministers
```

### Cost Control

The research agent uses Claude API tokens + web search. Budget estimate:
- ~5-10 searches per minister × 35 ministers = 175–350 searches
- ~2K tokens per minister output
- Total: roughly $5–15 per full batch run

Run one minister first as a test. Review the output. Refine the prompt. Then batch the rest.

---

## 11. End-to-End Timeline with Parallel Execution

Here's how a well-orchestrated Phase 9 plays out:

```
Day 1 (Session 22):
├── [main]     9A: Schema + migration + seed + basic pages
├── [main]     Run /phase-check 9A → all pass
└── [main]     Commit + push

Day 2 (Session 23-24-25 — PARALLEL):
├── [worktree] 9B: HATVP ingestion + display     ←── Terminal 1
├── [worktree] 9C: AGORA ingestion + display      ←── Terminal 2
├── [worktree] 9D: Career timeline generation      ←── Terminal 3
│
├── As each finishes: run /phase-check → merge to main
└── Merge order: 9B → 9C → 9D (rebase before each)

Day 3 (Session 26):
├── [main]     9E: Full profile UI, navigation, SEO
└── [main]     Run /phase-check 9E → all pass

Day 4-5 (Sessions 27-28):
├── [worktree] 9F: Build research agent script
├── [main]     Run agent for 1 test minister, review output
├── [main]     Refine prompt, batch run all ministers
└── [main]     Review + accept/reject research results

Day 6 (Session 29):
├── [main]     9G: President profile + historical governments
└── [main]     Final /phase-check across all sections
```

With parallelism on Day 2, you're effectively doing 3 sessions of work in 1 day. That's the multiplier.

---

## 12. File Organization Summary

```
project-root/
├── .claude/
│   ├── agents/
│   │   ├── schema-architect.md
│   │   ├── data-ingestor.md
│   │   ├── page-builder.md
│   │   └── verifier.md
│   ├── skills/
│   │   ├── hatvp-parse/
│   │   │   ├── SKILL.md
│   │   │   ├── mapping.md
│   │   │   └── schema-sample.xml
│   │   └── phase-check/
│   │       └── SKILL.md
│   └── worktrees/          ← auto-created, add to .gitignore
├── CLAUDE.md                ← project root, committed to git
├── docs/
│   ├── PHASE-9-PLAN.md
│   ├── PHASE-9-CHECKLISTS.md
│   └── research-output-schema.json
├── scripts/
│   └── ingest/
│       ├── hatvp.ts
│       ├── agora.ts
│       └── generate-career.ts
├── data/
│   └── research-output/     ← agent JSON outputs, gitignored
├── prisma/
│   ├── schema.prisma
│   └── seed/
│       └── gouvernement.ts
└── src/
    ├── app/
    │   └── gouvernement/
    │       ├── page.tsx
    │       └── [slug]/
    │           └── page.tsx
    ├── components/
    │   ├── CareerTimeline.tsx
    │   ├── InteretsSection.tsx
    │   ├── LobbySection.tsx
    │   └── JudiciaireSection.tsx
    └── lib/
        ├── hatvp-queries.ts
        ├── lobby-queries.ts
        └── career-queries.ts
```

---

## 13. Key Principles — The Short Version

1. **CLAUDE.md is king.** Every agent reads it. Keep it accurate, keep it concise.

2. **Checklists before code.** Write acceptance criteria before building. Run them after. No exceptions.

3. **Parallelize on file boundaries.** If two tasks don't touch the same files, they can run in separate worktrees simultaneously.

4. **Components over page code.** Each profile section is its own component. This prevents merge conflicts and enables parallel development.

5. **Scout before build.** Spawn a read-only subagent to study existing patterns before writing new code. This prevents style drift.

6. **Verify immediately.** After each sub-phase, run the verifier agent before moving on. Bugs compound — catch them early.

7. **Name your sessions.** You will resume them. Future-you will thank present-you.

8. **The research agent is a script, not a conversation.** Build it with Claude Code, run it as a batch process, review its output as a human.

9. **Merge order matters.** Largest/most foundational first. Rebase before PR.

10. **Never trust, always verify.** `npm run build` is the final arbiter. If it passes, you're good. If it doesn't, you're not.
