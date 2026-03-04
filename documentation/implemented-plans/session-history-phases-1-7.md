# Session History — Phases 1–7 (Sessions 1–20)

> Archived from handoff.md on Mar 3, 2026.
> These sessions are complete. No action needed.
> Active work: see handoff.md + documentation/phases/phase9-plan.md

---

## Architectural Plan — Complete ✅

Fully redesigned from a **data-source browser** into a **citizen-centric transparency tool**. Full blueprint: [`ARCHITECTURAL-PLAN.md`](../../ARCHITECTURAL-PLAN.md).

| Phase | Goal | Status |
|-------|------|--------|
| **1. Foundation** | Data infrastructure | ✅ Done |
| **2. Dossiers + Homepage** | Issue-centric pages | ✅ Done |
| **3. Enhanced Profiles + Territory** | Cross-referenced profiles | ✅ Done |
| **4. Votes Section** | Vote hub + per-topic/per-deputy views | ✅ Done |
| **5. Polish + New Data Sources** | StatCriminalite, DensiteMedicale, ISR, metadata | ✅ Done |
| **6. Presidential Profile** | Macron profile + lobby intelligence | ✅ Done |
| **7. Search + ConflictSignal + Comparison + OG** | 7A–7F | ✅ Done |

---

## Work History

### Session 20 (Mar 3, 2026) — QA fixes: party page crash + homepage OG

**Bug fix — `/representants/partis/[id]`**: `generateMetadata` was calling `parseInt(id, 10)` on a CUID string, producing `NaN`, which Prisma rejected as an invalid `Int` for `codeCNCC`. Fixed by replacing `findFirst({ where: { codeCNCC: parseInt(id) } })` with `findUnique({ where: { id } })`. File: `src/app/representants/partis/[id]/page.tsx`.

**New OG image — `/opengraph-image`**: Static homepage OG image was missing (404). Created 1200×630 static image: platform brand, tagline, 8 dossier chips grid, 3 stat cards. No DB query.

**Build**: 57 routes + 5 OG image routes, zero TypeScript errors.

---

### Sessions 18/19 (Mar 3, 2026) — GEO-LOG housing data + OG image fixes + documentation

**INSEE RP Housing ingest** — `DS_RP_LOGEMENT_PRINC` via Mélodi API. Added `fetchLogementDep()` to `scripts/lib/insee-client.ts`. OCS column: `_T` = total, `DW_VAC` = vacant, `DW_SEC_DW_OCC` = secondary residence. New `StatLocale` indicators: `HOUSING_TOTAL` (NB), `HOUSING_VACANCY_RATE` (%), `HOUSING_SECONDARY_RATE` (%). 222 new rows. National averages: vacancy 8.7%, secondary 11.5%.

**UI additions**:
- `/dossiers/logement` — Section 3 "Parc immobilier par territoire": two `RankingTable`s + 2 `IndicatorCard`s.
- `/territoire/[departementCode]` — 2 `StatCard`s in Économie section (vacants + résidences secondaires).

**OG images**: `src/app/opengraph-image.tsx` (NEW, static) + `src/app/dossiers/logement/opengraph-image.tsx` (NEW, async).

**Documentation pass**: `ARCHITECTURAL-PLAN.md`, `documentation/handoff.md`, `documentation/frontend.md`, `documentation/schema.md` all updated.

**Build**: 57 routes + 5 OG image routes, zero TypeScript errors.

---

### Session 17 (Mar 2, 2026) — Sub-phases 7E + 7F: OG Images + Alignment Matrix

**7E — Dynamic OG Image Templates** (+3 image endpoints):

1. **`src/app/representants/deputes/[id]/opengraph-image.tsx`** — 1200×630. Photo/initials + name + party + stats (participation %, vote count, conflict count).
2. **`src/app/territoire/[departementCode]/opengraph-image.tsx`** — Dept code + name + region + 3 stats. Fixed: `Departement` has no `regionNom` — uses `region: { select: { libelle: true } }`.
3. **`src/app/gouvernance/scrutins/[id]/opengraph-image.tsx`** — ADOPTÉ/REJETÉ badge, proportional vote bar.

All three: `export const runtime = "nodejs"`, `{ prisma }` named import, `params: Promise<...>` (Next.js 16 async params).

**7F — Party Alignment Matrix** (+1 route → 57 total):

4. **`src/lib/alignment.ts`** — `computeAlignment(minShared = 5)`. CTE self-join on `GroupeVote`. Returns `{ pairs: AlignmentPair[], groups: GroupInfo[] }`.
5. **`src/app/votes/alignements/page.tsx`** — `revalidate = 86400`. N×N heat map, top-5 allies, top-5 opponents. Color scale: ≥88% deep teal → <38% deep rose.
6. **`src/app/votes/page.tsx`** — Added "Matrice d'alignement →" link.

**Build**: 57 routes + 3 OG image endpoints, zero TypeScript errors.

---

### Session 16 (Mar 2, 2026) — Sub-phase 7D: Comparison Mode

1. **`src/components/delta-badge.tsx`** — `DeltaBadge` showing `+N.N %` / `-N.N %` delta in teal.
2. **`src/app/comparer/territoires/page.tsx`** — 3-state comparison: picker → partial → full side-by-side with `MetricRow` + `DeltaBadge`.
3. **`src/app/comparer/deputes/page.tsx`** — 4-state deputy comparison: search A → pick A → search B → full comparison with vote-by-tag bars.
4. **`/territoire/[departementCode]`** — Added "Comparer →" link in breadcrumb.
5. **`/representants/deputes/[id]`** — Added "Comparer avec un autre député →" utility bar.

**Build**: 56 routes, zero TypeScript errors.

---

### Session 15 (Mar 2, 2026) — Sub-phases 7B + 7C: Global Search + ConflictSignal

**7B — Global Search** (+1 route `/recherche`):
- `prisma/migrations/.../migration.sql` — `MATERIALIZED VIEW search_index` with GIN index (`french` text search). Uses `Depute.groupe` (NOT `groupePolitique`), `Lobbyiste.categorieActivite` (NOT `categorie`).
- `src/lib/search.ts` — `globalSearch()`. `entityType` validated against allowlist before SQL interpolation.
- `src/components/nav-search.tsx` — Compact navbar search form.
- `src/app/recherche/page.tsx` — Results with entity type pills.
- Wave 10 in `ingest.ts`: `REFRESH MATERIALIZED VIEW search_index`.

**7C — ConflictSignal**:
- New `ConflictSignal` model (30th model). Unique constraint: `(nom, prenom, typeMandat, secteurDeclaration, tag)`.
- `scripts/lib/sector-tag-map.ts` — 15 RegExp patterns mapping company names → ScrutinTag arrays.
- `scripts/compute-conflicts.ts` — exported `computeConflicts()`. Wave 5d in orchestrator.
- Homepage, `/dossiers/confiance-democratique`, deputy Transparence tab all use `conflictSignal` with graceful empty-state fallbacks.

**Critical**: `{ prisma }` is named export. `Depute.id` is `PA*` format (not integer). `ConflictSignal` empty until `pnpm compute:conflicts` runs.

---

### Session 14 (Mar 2, 2026) — Sub-phase 7A: `/mon-territoire` — Civic Dashboard by Postal Code

- `src/data/postal-codes.json` — 6,328 postal codes → INSEE commune code lists. 347KB, from La Poste Hexasmal CSV.
- `src/lib/postal-resolver.ts` — Resolves postal code → `ResolvedTerritory[]`. ARM communes (Paris/Lyon/Marseille arrondissements) replaced with parent COM via `comparent`.
- `src/app/mon-territoire/page.tsx` — 3-state: empty prompt / disambiguation / full civic dashboard (13-query `Promise.all`).
- Homepage: added postal code CTA link.

**Key bugs**: `import { prisma }` not default. `Elu.prenom/nom` not `prenomElu/nomElu`. `DensiteMedicale.specialite` not `profession`.

---

### Session 13 (Mar 2, 2026) — Département Dashboard UX Redesign

Full visual redesign of `/territoire/[departementCode]/page.tsx`:
- Rich hero with département name, region, decorative dept code, key-stats row.
- `SectionHeader` helper with colored left-bar accent.
- Enlarged budget trend chart (560×90 px) with gradient fill, value labels.
- `StatCard` helper with `card-accent` gradient.
- Représentants list-with-dividers replacing separate card blocks.

---

### Session 12 (Mar 1, 2026) — BudgetLocal Ingestion (OFGL)

- Rewrote `scripts/ingest-budgets.ts` — OFGL Opendatasoft API (original URLs were dead).
- Ingested 69,023 BudgetLocal rows (380 département + 68,643 commune records, 2022+2023).
- Pages live: `/territoire/[dept]`, `/territoire/commune/[code]`, `/dossiers/dette-publique`.
- Sample: Paris 2023 dépenses €4,187/hab, dette €4,579/hab.

---

### Session 11 (Mar 1, 2026) — Lobbying Data Enrichment + Consulting Firm Profiles

- Corrected Boury Tallon founder names (Paul Boury + Pascal Tallon, both HEC, co-created AFCL 1991).
- Enriched Anthenor Public Affairs (CEO Timothé de Romance) and Lysios Public Affairs (30+ consultants, founded 2003).
- Updated consulting card rendering in `president/page.tsx`.
- Neutrality policy: removed "pantouflage" label. State facts only — no editorial labels.

---

### Session 10 (Mar 1, 2026) — Phase 6: Presidential Profile + Lobbying Intelligence

- `/president` — 4 tabs: promesses, bilan, lobbying, declarations. `ProfileHero` + `ProfileTabs`.
- `src/data/president-macron.ts` — 20 curated promises + BIO.
- `src/data/lobbyists-curated.ts` — 7 power orgs + 3 consulting firms with `victoireLegislative`, `alerte`, `connexionMacron`.
- `src/lib/president-utils.ts` — `getBaselineObservation()` + `computeDelta()`.
- `ActionLobbyiste` has no DateTime — lobbying stats always all-time; `periode` is free text.

---

### Session 9 (Mar 1, 2026) — Documentation, Bug Fixes, Full Commit

- Fixed stale Prisma client (`TypeError: Cannot read properties of undefined`): kill + restart `pnpm dev`.
- Updated `ARCHITECTURAL-PLAN.md` with all phases complete.
- Rewrote `documentation/frontend.md` — 50 routes, 22 components.
- Committed all Phase 1–5 code (64 files, commit `8b9dda5`).

---

### Session 8 (Mar 1, 2026) — INSEE Mélodi Migration + StatLocale Ingestion

- Identified DDL deprecation; migrated to Mélodi "libre" plan (anonymous, no API key).
- Rewrote `scripts/lib/insee-client.ts` for Mélodi (semicolon CSV, BOM-safe). Three datasets: `DS_FILOSOFI_CC`, `DS_RP_POPULATION_PRINC`, `DS_RP_EMPLOI_LR_PRINC`.
- Ingested 1,186 StatLocale rows across 101 depts in 347s. Mayotte (976) = 0 rows expected.

---

### Session 7 (Mar 1, 2026) — Phase 5: Polish + New Data Sources

- `StatCriminalite` + `DensiteMedicale` models added.
- `scripts/ingest-criminalite.ts` (SSMSI static CSV) + `scripts/ingest-medecins.ts` (DREES Opendatasoft API).
- `generateMetadata` added to 9 dynamic routes.
- ISR `revalidate` added to 7 static-ish pages.
- UI: `/dossiers/sante` → MG density map. `/territoire/[dept]` → Santé & Sécurité section.
- Wave 9 in orchestrator: `Promise.all([ingestCriminalite(), ingestMedecins()])`.

---

### Session 6 (Mar 1, 2026) — Phase 4: Votes Section

- `/votes` hub, `/votes/par-sujet/[tag]`, `/votes/mon-depute` (3-state URL-driven).
- `TimelineChart` (SVG polyline, server-side) + `DeptMap` (ranked bar chart).
- 53 routes, zero TypeScript errors.

---

### Session 5 (Mar 1, 2026) — Phase 3: Enhanced Profiles + Territory + Route Rename

- Deputy "Transparence" tab: declared interests, vote theme breakdown, déports.
- Full `/territoire/[departementCode]` rewrite with StatLocale + BudgetLocal + votes.
- Route rename `/gouvernance/` → `/representants/` with HTTP 308 redirects. Scrutins stay at `/gouvernance/scrutins`.
- Commune card page `/territoire/commune/[communeCode]`.

---

### Session 4 (Mar 1, 2026) — Phase 1 + Phase 2: Data Infrastructure + Dossier System

- Phase 1: `StatLocale`, `BudgetLocal`, `ScrutinTag` models. Ingestion scripts (tag-scrutins, insee-local, budgets). 3,170 scrutin tags.
- Phase 2: `src/lib/dossier-config.ts` (8 dossiers). 8 components. `/dossiers` hub + all 8 dossier pages. Homepage redesign.

---

### Session 3 (Mar 1, 2026) — Architectural Plan

- Researched French citizen concerns (Ipsos, CEVIPOF, IFOP polls).
- Identified 5 cross-reference opportunities.
- Created `ARCHITECTURAL-PLAN.md` — 650+ line master blueprint.

---

### Session 2 (Mar 1, 2026) — Elections & RNE Layer

- Models: `Elu` (593K), `ElectionLegislative` (1,078), `CandidatLegislatif` (5,103), `PartiPolitique` (2,180).
- Ingestion scripts + pages: `/elections`, `/elections/legislatives-2024`, `/gouvernance/elus`, `/gouvernance/partis`.
- `nuance-colors.ts` — 20 political nuance codes.
- Fixed `ingest:elus` OOM with 8GB heap (`NODE_OPTIONS`).

---

### Session 1 (Feb 28, 2026) — Foundation + Profile Redesign

- Initial data ingestion: Députés, Sénateurs, Lobbyistes, Scrutins, HATVP declarations.
- Profile page redesign: `ProfileHero` + `ProfileTabs` pattern.
- Route structure established.
