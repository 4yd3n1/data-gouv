# Handoff — data-gouv Civic Intelligence Platform

> Updated: Mar 4, 2026 (Session 32). Current phase: **Phase 9 — Government Profiles**.

---

## What This Is

French civic intelligence platform. Next.js 16 App Router + Prisma 7 + PostgreSQL 14. Ingests open data from data.gouv.fr, INSEE, HATVP, Sénat, Assemblée Nationale. Goal: **maximum transparency through public data**. "Intelligence Bureau" aesthetic (dark, teal accents, Instrument Serif headings).

Full blueprint: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md)

---

## Current State — Phases 1–8 Complete + Phase 9 In Progress

~800K rows across 36 Prisma models. 59 routes + 5 OG image routes. `pnpm build` verified zero TS errors (Session 26).

| Layer | Models | Rows |
|-------|--------|------|
| Territory | Region, Departement, Commune | 37,031 |
| Governance | Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste | ~106,500 |
| Parliament | Organe, Scrutin, GroupeVote, VoteRecord, Deport, ScrutinTag, ConflictSignal | varies |
| Local | StatLocale (~1,644), BudgetLocal (69,023), StatCriminalite, DensiteMedicale | varies |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 |
| Elections | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies |
| Gov. Profiles *(Phase 9)* | PersonnalitePublique, MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire, ActionLobby | seed data + 184 HATVP interests (Bayrou) |

**Client components** (8): `SearchInput`, `SearchBox`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`, `FranceMap`.

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

# Phase 9 (run manually — not yet in pnpm ingest)
npx tsx scripts/seed-gouvernement.ts   # Seed current government ministers
npx tsx scripts/ingest-hatvp.ts        # Ingest HATVP XML declarations (re-run safe)
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

Sub-phases:
- ✅ **9A** — schema + migration + seed (Bayrou government, ~25 ministers)
- ✅ **9B** — HATVP XML ingestion (184 interests, 6 declarations for Bayrou)
- ✅ **9E** — Profile UI (`ProfileHero` + `ProfileTabs`, separate Affaires judiciaires tab, all section components)
- ✅ **9C** — AGORA lobby ingestion → 94,924 `ActionLobby` records; keyword-matched `reponsablesPublics` → `ministereCode`; `LobbySection` shows top orgs + domain breakdown
- ✅ **9D** — Career timeline → `generate-carriere.ts` populates `EntreeCarriere` from mandats + Depute/Senateur data; `CareerSection` shows vertical timeline with colored dots
- ✅ **9F** — Research agent: `EvenementJudiciaire` for Bayrou + Darmanin (Tier 1-2 press sources, `verifie` workflow with `scripts/review-agent-output.ts`); Macron judicial event (McKinsey/PSG) + 7 career entries ingested
- ✅ **9G (partial)** — President profile fully migrated: `/president` 308-redirects to `/gouvernement/emmanuel-macron`; 4 president-specific section components (`PresidentBilanSection`, `PresidentPromessesSection`, `PresidentLobbyingSection`, `PresidentDeclarationsSection`); 6-tab layout with hero scores + contact for president detection. Search static injection updated to `/gouvernement/emmanuel-macron`.
- ⬜ **9G (remaining)** — Historical governments (Borne, Attal, Barnier…); more ministers' judicial/career research

---

## Recent Sessions

| Session | What Was Built |
|---------|----------------|
| **32** (Mar 4) | President profile migration: `/president` 308-redirect → `/gouvernement/emmanuel-macron`. 4 president-specific section components (`PresidentBilanSection`, `PresidentPromessesSection`, `PresidentLobbyingSection`, `PresidentDeclarationsSection`). Gouvernement page detects `isPresident` → 6-tab layout with hero scores/contact. Search static injection URL updated. Docs updated. |
| **31** (Mar 4) | Phase 9F: `data/research-output/` JSON workflow + `review-agent-output.ts` interactive CLI. Bayrou + Darmanin judicial research (Tier 1-2 press). `JudiciaireSection` rebuilt (event cards, severity dots, statut badges). Macron research: 7 career entries + McKinsey affaire ingested. Tab badge shows judiciaireCount. |
| **29–30** (Mar 4) | Unified profiles: 7 ministers got `deputeId` populated via name-match → redirect from `/representants/deputes/[id]`. 4-tab redesign. Gouvernement card on `/representants` hub. `Affaires judiciaires` separated into own conditional tab. |
| **28** (Mar 4) | Phase 9C: `ingest-agora.ts` (94,924 ActionLobby, keyword ministry matching); upgraded `LobbySection`. Phase 9D: `generate-carriere.ts` (EntreeCarriere from mandats + Depute/Senateur); vertical timeline `CareerSection`. Build clean. |
| **27** (Mar 4) | Commit + push Sessions 21–26 work; updated handoff.md, schema.md, frontend.md to reflect Phases 8 + 9A/9B/9E |
| **26** (Mar 4) | Phase 9E UI fix: `/gouvernement/[slug]` now uses `ProfileHero` + `ProfileTabs` (3 tabs: Intérêts · Mandats · Parcours); all section components aligned to project design language |
| **25** (Mar 3) | Phase 9E UI: two-column layout, progressive disclosure in `interets-section.tsx`, contrast fixes across all section components |
| **24** (Mar 3) | Phase 8C fix: correct Mélodi dataset `DS_RP_DIPLOMES_PRINC`; ingested `EDUC_NO_DIPLOMA`, `EDUC_BAC_PLUS`, `EDUC_HIGHER_EDUC` |
| **23** (Mar 3) | Phase 8C: education ingestion in `insee-client.ts`; surfaced in `/dossiers/emploi-jeunesse` + `/territoire/[dept]` |
| **22** (Mar 3) | Phase 8B: FranceMap integrated into 7 pages; `showPills` prop; fixed missing `revalidate` on 3 dossier pages |
| **21** (Mar 3) | Phase 8A: FranceMap component (`france-map.tsx`), data files (`france-geo.ts`, `indicators.ts`, `france-map-data.ts`), integrated at `/territoire` hub |
| **18–20** (Mar 3) | Phase 7E/7F QA: housing data, OG images (homepage + logement), party page crash fix |

Full session history (Sessions 1–20): [`documentation/implemented-plans/session-history-phases-1-7.md`](implemented-plans/session-history-phases-1-7.md)
