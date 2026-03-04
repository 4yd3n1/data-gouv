# Handoff — data-gouv Civic Intelligence Platform

> Updated: Mar 4, 2026 (Session 26). Current phase: **Phase 9 — Government Profiles**.

---

## What This Is

French civic intelligence platform. Next.js 16 App Router + Prisma 7 + PostgreSQL 14. Ingests open data from data.gouv.fr, INSEE, HATVP, Sénat, Assemblée Nationale. Goal: **maximum transparency through public data**. "Intelligence Bureau" aesthetic (dark, teal accents, Instrument Serif headings).

Full blueprint: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md)

---

## Current State — Phases 1–8 Complete

~800K rows across 30 Prisma models. 57 routes + 5 OG image routes. `pnpm build` verified zero TS errors (Session 24).

| Layer | Models | Rows |
|-------|--------|------|
| Territory | Region, Departement, Commune | 37,031 |
| Governance | Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste | ~106,500 |
| Parliament | Organe, Scrutin, GroupeVote, VoteRecord, Deport, ScrutinTag, ConflictSignal | varies |
| Local | StatLocale (~1,644), BudgetLocal (69,023), StatCriminalite, DensiteMedicale | varies |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 |
| Elections | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies |

**Client components** (8): `SearchInput`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`, `FranceMap`, `DeltaBadge`.

---

## How to Run

```bash
pnpm dev              # Dev server (auto-uses Node 20.19.2 via .nvmrc)
pnpm build            # Production build — catches TS errors
pnpm db:migrate       # Run Prisma migrations
pnpm db:generate      # Regenerate client (required after every migration)
pnpm ingest           # Full ingestion (all waves, ~10 min, idempotent)
pnpm ingest:insee-local  # INSEE Mélodi (5 datasets × 101 depts — re-run safe)
pnpm compute:conflicts   # Populate ConflictSignal (run after tag-scrutins)
pnpm refresh:search      # Refresh search_index materialized view
```

---

## Critical Quirks

- **Node 20.19.2+** required. Prisma 7 WASM. `.nvmrc` pins it. `pnpm dev` auto-switches.
- **`{ prisma }` is a named export.** `import prisma from "@/lib/db"` = build error.
- **`pnpm db:generate` required after every migration.** Build fails with "Property X doesn't exist on PrismaClient".
- **Scrutin relation**: `votes VoteRecord[]` — use `votes` (not `voteRecords`) in Prisma.
- **`Elu` fields**: `Elu.nom/prenom` (not `nomElu/prenomElu`), `Elu.codeDepartement` (not `departementCode`).
- **`DensiteMedicale`**: field is `specialite` (not `profession`).
- **`ConflictSignal` is empty** until `pnpm compute:conflicts` runs. All UI has graceful fallbacks.
- **`search_index` view**: uses `Depute.groupe` (not `groupePolitique`), `Lobbyiste.categorieActivite` (not `categorie`). Refreshed in Wave 10.
- **`ElectionLegislative`**: no FK to `Departement` — overseas codes (`"ZZ"`) don't exist in COG. `codeDepartement` is plain string.
- **`Depute.departementRefCode`** for joins (not `departementCode` which can be `"099"`).
- **`ingest:elus`** needs 8GB heap — do not change `NODE_OPTIONS=--max-old-space-size=8192`.
- **ARM communes** (Paris/Lyon/Marseille): `postal-resolver.ts` replaces ARM codes with parent COM via `comparent`. Always filter `typecom: "COM"` for counts.
- **`/gouvernance/scrutins/*`** stays active. HTTP 308 in `next.config.ts` only redirects other `/gouvernance/*`.
- **HATVP XML**: use `fast-xml-parser`. Files can be 200MB+. Stream, don't load into memory.
- **New `/gouvernement` profile sections** must be self-contained components (`<InteretsSection />`, `<LobbySection />`, etc.) imported into `page.tsx`. Never inline section logic directly in `page.tsx`.

---

## Next: Phase 9 — Government Official Profiles

| Document | Purpose |
|----------|---------|
| [`documentation/phases/phase9-plan.md`](phases/phase9-plan.md) | Full data model, source analysis, sub-phase breakdown |
| [`documentation/phases/PHASE-9-CHECKLISTS.md`](phases/PHASE-9-CHECKLISTS.md) | Acceptance criteria per sub-phase (9A → 9G) |
| [`documentation/phases/PHASE-9-WORKFLOW.md`](phases/PHASE-9-WORKFLOW.md) | Parallel execution, worktrees, agent prompts |

6 new Prisma models: `PersonnalitePublique`, `MandatGouvernemental`, `EntreeCarriere`, `InteretDeclare`, `EvenementJudiciaire`, `ActionLobby`. New routes: `/gouvernement` + `/gouvernement/[slug]`. Rules file: `.claude/rules/gouvernement.md`.

Sub-phases: **9A** (schema+seed+basic pages) → **9B** (HATVP) → **9C** (AGORA) → **9D** (career timeline) → **9E** (full UI) → **9F** (research agent) → **9G** (president + history).

---

## Recent Sessions

| Session | What Was Built |
|---------|----------------|
| **26** (Mar 4) | Phase 9E UI fix: `/gouvernement/[slug]` now uses `ProfileHero` + `ProfileTabs` (3 tabs: Intérêts · Mandats · Parcours); all section components aligned to project design language |
| **25** (Mar 3) | Phase 9E UI: two-column layout, progressive disclosure in `interets-section.tsx`, contrast fixes across all section components |
| **24** (Mar 3) | Phase 8C fix: correct Mélodi dataset `DS_RP_DIPLOMES_PRINC`; ingested `EDUC_NO_DIPLOMA`, `EDUC_BAC_PLUS`, `EDUC_HIGHER_EDUC` |
| **23** (Mar 3) | Phase 8C: education ingestion in `insee-client.ts`; surfaced in `/dossiers/emploi-jeunesse` + `/territoire/[dept]` |
| **22** (Mar 3) | Phase 8B: FranceMap integrated into 7 pages; `showPills` prop; fixed missing `revalidate` on 3 dossier pages |
| **21** (Mar 3) | Phase 8A: FranceMap component (`france-map.tsx`), data files (`france-geo.ts`, `indicators.ts`, `france-map-data.ts`), integrated at `/territoire` hub |
| **18–20** (Mar 3) | Phase 7E/7F QA: housing data, OG images (homepage + logement), party page crash fix |

Full session history (Sessions 1–20): [`documentation/implemented-plans/session-history-phases-1-7.md`](implemented-plans/session-history-phases-1-7.md)
