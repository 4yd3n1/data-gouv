# Handoff — data-gouv Civic Intelligence Platform

> Updated: Mar 26, 2026 (Session 40). Current phase: **UX Restructure (Phases 1-3 done, 4-6 pending)** + Phase 9 Government Profiles.

---

## What This Is

French civic intelligence platform. Next.js 16 App Router + Prisma 7 + PostgreSQL 14. Ingests open data from data.gouv.fr, INSEE, HATVP, Sénat, Assemblée Nationale. Goal: **maximum transparency through public data**. "Intelligence Bureau" aesthetic (dark, teal accents, Instrument Serif headings).

Full blueprint: [`ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md)

---

## Current State — Phases 1–8 + Phase 9 + UX Restructure (Sessions 33–40)

~800K rows across 42 Prisma models. **~35 active routes** + ~30 legacy (Phase 6 deletion pending) + 5 OG image routes. **4-item nav**: Signaux | Profils | Votes | Territoire. `pnpm build` verified zero TS errors (Session 40).

| Layer | Models | Rows |
|-------|--------|------|
| Territory | Region, Departement, Commune | 37,031 |
| Governance | Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste | ~106,500 |
| Parliament | Organe, Scrutin, GroupeVote, VoteRecord, Deport, ScrutinTag, ConflictSignal | varies |
| Parliamentary Laws *(Session 33)* | LoiParlementaire, ScrutinLoi | 19 lois, 2,589 links |
| Local | StatLocale (~1,644), BudgetLocal (69,023), StatCriminalite, DensiteMedicale | varies |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 |
| Elections | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies |
| Gov. Profiles *(Phase 9 + Session 34)* | PersonnalitePublique, MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire, ActionLobby | 44 persons, 49 mandats, 474 career, **14 judicial** (Bergé CJR upgrade + Jeanbrun 2nd entry), 184 HATVP interests, 131,842 ActionLobby |
| Media Ownership *(Session 35)* | GroupeMedia, MediaProprietaire, ParticipationMedia, Filiale | 10 groups, 10 owners, 10 participations, 72 filiales |

| Cross-references *(Session 37–38)* | nuance-party-map, conflict drill-down, commission-lobby overlap | static mappings + runtime queries |
| Historical govts *(Session 37, not yet seeded)* | 4 data files: Borne (36), Attal (35), Barnier (41), Lecornu (36) | 148 members prepared |

| Signals *(Session 38)* | signal-types.ts, signal-card.tsx | 6 signal types computed at query time (no new models) |
| UX Restructure *(Session 40)* | /profils hub, /signaux filters, slug.ts | ~35 active routes (was 62), 4-nav, search-first homepage |

**Client components** (14): `SearchInput`, `SearchBox`, `Avatar`, `DeclarationSection`, `ProfileTabs`, `DeptLookup`, `NavSearch`, `FranceMap`, `DeltaBadge`, `GroupExpander`, `ScrutinAccordion`, `MediaBoard`, `MobileNav`, `ConflictDrilldown`.

**UX Restructure (Session 40)**:
- **Nav**: 9 → 4 items (Signaux | Profils | Votes | Territoire). Patrimoine demoted to footer.
- **Homepage**: Search-first hero (giant search bar + entity pills), inline top 6 signals, 5 recent votes, territory lookup. Killed: HeroSlider, dossier grid, KPI counters.
- **`/profils` hub**: Unified people directory. `/profils/[slug]` (ministers), `/profils/deputes/[id]`, `/profils/senateurs/[id]`, `/profils/ministres`, `/profils/lobbyistes`, `/profils/partis`, `/profils/elus`, `/profils/comparer`.
- **`/signaux`**: URL-param filters (`?type=conflits&severity=CRITIQUE`). Deep-dive "Enquête" cards linking to surviving dossiers.
- **Killed**: 8 dossier pages + index (redirect to /signaux or /territoire). `HeroSlider` component deleted.
- **Kept**: `/dossiers/medias`, `/dossiers/financement-politique` (linked from /signaux).
- **Legacy routes**: `/representants/*` and `/gouvernement/*` still active — Phase 6 will delete them and activate redirects to `/profils/*`.
- **Remaining phases**: 4 (Votes simplification), 5 (Territory+Economics merge), 6 (Cleanup/delete old routes).

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
pnpm seed:gouvernement                          # Seed 4 governments (Borne/Attal/Barnier/Lecornu, 148 members total)
npx tsx scripts/generate-carriere.ts             # Auto-generate EntreeCarriere from mandats + Depute/Senateur
npx tsx scripts/ingest-hatvp.ts                  # Ingest HATVP XML declarations (re-run safe)
npx tsx scripts/ingest-agora.ts                  # AGORA lobby → 131,842 ActionLobby (20 ministry codes)
npx tsx scripts/ingest-research-output.ts --all  # Career + judicial from data/research-output/*.json

# Session 33 (run manually)
npx tsx scripts/seed-lois.ts           # Seed 19 LoiParlementaire + 2,589 ScrutinLoi links (idempotent)

# Session 35+37 (run manually)
pnpm seed:medias                       # Seed media groups + owners + état-français gov link (idempotent)
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
- **`/gouvernance/*`** redirects to `/profils/*` (final destination). `/representants/scrutins/*` still active (scrutin detail pages).
- **HATVP XML**: use `fast-xml-parser`. Files can be 200MB+. Stream, don't load into memory.
- **New `/gouvernement` profile sections** must be self-contained components (`<InteretsSection />`, `<LobbySection />`, etc.) imported into `page.tsx`. Never inline section logic directly in `page.tsx`.
- **Lecornu II government** (Session 34): 37 current members. Bayrou mandates closed with `dateFin = 2025-10-11`. AGORA `MINISTERECODE_KEYWORDS` updated with 20 codes (was ~14). HATVP XML not yet published for Lecornu II ministers.
- **`LoiParlementaire` + `ScrutinLoi`** (Session 33): `lucide-react` is NOT installed — use inline SVG for icons in `GroupExpander` and `ScrutinAccordion`. The `role = "VOTE_FINAL"` `ScrutinLoi` row drives the group breakdown bar; every law should have at most one.
- **`GroupExpander` deputy key**: deputies are grouped by `groupeAbrev` matched against `Organe.libelleAbrege`. Both values must match (verified: `"RN"` === `"RN"`).
- **`/gouvernement` SIGINT redesign (Session 36)**: page.tsx is a pure Server Component with inline sub-components (`Brackets`, `TierLabel`, `StemNode`, `SpreadConnector`, `PresidentCard`, `PremierMinistreCard`, `MinistreCard`, `DelegueCard`, `SecretaireCard`). No "use client". `Brackets` uses `border-current` — parent `text-{color}` class tints all 4 corner spans. `.sigint-amber::after`, `.gov-hero-card`, `.live-dot-amber`, `.threat-bar` added to `globals.css`.
- **`EvenementJudiciaire` no timestamp columns** — table has no `createdAt`/`updatedAt`. Do not include in INSERT or UPDATE statements.
- **`ConflictDrilldown`** (Session 37) — client component. Wraps ConflictAlert content + expandable vote list per tag. Only used in deputy Transparence tab (conflictSignals branch). `ConflictAlert` still used in fallback branch.
- **Senator Transparence tab** (Session 37) — 4th tab. `COMMISSION_DOMAINS` constant maps commission names to lobbying keywords via regex. `ActionLobbyiste.count` queries run in parallel per matched commission. `mode: "insensitive"` requires `as const` for Prisma type.
- **Nuance-party mapping** (Session 37) — `src/lib/nuance-party-map.ts`. Coalition nuances (UG, ENS) map to multiple codeCNCC. `getNuancesForParty(codeCNCC)` is the reverse lookup. Election stats use tour 1 for vote share, `elu: true` across all tours for seat count.
- **Historical government seed** (Session 37) — `seed-gouvernement.ts` refactored. Imports 4 data files from `scripts/data/`. Macron added automatically to each government (not in data files). **Not yet run** — run `pnpm seed:gouvernement` then `npx tsx scripts/generate-carriere.ts`.
- **`/gouvernement` historical filter** (Session 37) — `?gouvernement=borne|attal|barnier` query param. `GOV_SLUGS` mapping in page.tsx. Queries mandats by `gouvernement` name instead of `dateFin: null`.
- **`MediaTutelleSection`** (Session 37) — only renders when `ministereCode === "CULTURE"`. Queries `GroupeMedia` via `participations: { some: { typeControle: "ETAT" } }`.
- **`seed-medias.ts` personnaliteSlug** (Session 37) — `ProprietaireDef` gained `personnaliteSlug` field. État-français linked to `catherine-pegard` (current Culture minister). Resolved to `personnaliteId` during seed.
- **Bergé judicial record (Session 36)**: `type` = `COUR_JUSTICE_REPUBLIQUE` (not ENQUETE_PRELIMINAIRE). Information judiciaire opened 2025-01-31. Nature: faux témoignage (crèches privées / LPCR affair).
- **Jeanbrun has two active judicial entries (Session 36)**: (1) SIVU/logements — Parquet de Créteil, nature corrected to `prise illégale d'intérêts, recel, concussion, soustraction et détournement de biens d'un dépôt public`. (2) favoritisme/marchés urbains — PNF, information judiciaire opened June 2022, Anticor partie civile Jan 2022, relates to CITALLIOS urban development contracts.
- **DeclarationInteret case-insensitive matching** (Session 38) — HATVP XML stores names UPPERCASE (e.g., `FAYSSAT`). Deputy profile query now uses `mode: "insensitive" as const` for `nom`/`prenom` matching. Without this, deputies with uppercase HATVP names showed empty declarations despite having ConflictSignal alerts on the homepage.
- **SMIC BDM series is an index, not euros** (Session 38) — Series `010605027` returns index values (base 100), not actual SMIC in euros. `unite` corrected from `"eur"` to `"indice"` in both ingestion config and DB. Economy page display updated to format `"eur"` with `€` symbol and 2 decimals, `"indice"` as plain number.
- **Nav collapsed to 4 items** (Session 40) — `layout.tsx` NAV: `Signaux | Profils | Votes | Territoire`. Killed: Accueil, Dossiers, Représentants, Gouvernement, Économie, Patrimoine. Patrimoine → footer link only.
- **`/profils` is the new canonical people hub** (Session 40) — `/profils/[slug]` for ministers, `/profils/deputes/[id]` for deputies, etc. Old `/representants/*` and `/gouvernement/*` still active (Phase 6 deletion pending).
- **`/signaux` has URL-param filters** (Session 40) — `?type=conflits|portes-tournantes|lobbying|medias|declarations|dissidences` + `?severity=CRITIQUE|NOTABLE|INFORMATIF`. Server-side filtering, filter bar with pills.
- **Missing French accents on `/dossiers/medias`** (Session 39) — ~30 accent-less strings fixed across `dossier-config.ts` and `medias/page.tsx` (médias, contrôlent, propriété, télévision, numériques, etc.).
- **Economy data display bugs** (Session 39) — (1) PIB on `/dossiers/pouvoir-dachat` showed "3 Md €" — division was by 1,000,000 instead of 1,000 (value is in millions). Now shows correct ~2,639 Md €. (2) SMIC unit changed from "€" to "(indice)" since BDM series `010605027` returns index values. (3) Dette publique on `/economie` showed "22 157 %" — unit was wrong (`pourcent` instead of `centaines_millions_eur`). Fixed in DB + ingestion config. Now shows correct ~2,216 Md €. Economie page gained unit-aware formatting for `centaines_millions_eur`, `millions_eur`, `milliards_eur`, `indice`.
- **Homepage stat cards clickable** (Session 39) — 4 KPI cards (Députés, Élus, Scrutins, Monuments) wrapped in `<Link>` to respective routes.
- **Dossier nav overflow indicator** (Session 39) — `DossierNav` gained right-edge gradient fade to signal scrollable content (10 dossiers, last 2 hidden on most viewports).
- **Museum name capitalization** (Session 39) — `capitalizeMuseumName()` helper on `/patrimoine` page. Source data stores names lowercase.
- **Deputy/Senator photo URLs are 404** (Session 39) — Assemblée Nationale changed URL structure. `photoUrl` values in DB (`https://www.assemblee-nationale.fr/dyn/deputes/{id}/image`) return 404. Avatar component correctly falls back to initials. Requires new photo source, not a code fix.

---

## Next: UX Restructure Phases 4-6 + Phase 9G Remaining

### UX Restructure (remaining)
- **Phase 4** — Votes simplification: absorb `/votes/par-sujet/[tag]` into `/votes?sujet=`, kill `/votes/mon-depute`, move scrutin pages to `/votes/scrutins/`
- **Phase 5** — Territory + Economics merge: absorb `/economie` into `/territoire?vue=economie`, move `/comparer/territoires` to `/territoire/comparer`
- **Phase 6** — Cleanup: delete `/representants/*`, `/gouvernement/*`, `/gouvernance/*` page stubs, activate ~30 commented redirects in `next.config.ts`, update `search_index` URLs

### Phase 9G (remaining)
Run `pnpm seed:gouvernement` + `generate-carriere` for historical govts, research agents for ~80 new members, HATVP declarations for Lecornu II (when published).

| Document | Purpose |
|----------|---------|
| [`documentation/phases/phase9-plan.md`](phases/phase9-plan.md) | Full data model, source analysis, sub-phase breakdown |
| [`documentation/phases/PHASE-9-CHECKLISTS.md`](phases/PHASE-9-CHECKLISTS.md) | Acceptance criteria per sub-phase (9A → 9G) |
| [`documentation/phases/PHASE-9-WORKFLOW.md`](phases/PHASE-9-WORKFLOW.md) | Parallel execution, worktrees, agent prompts |

Sub-phases:
- ✅ **9A** — schema + migration + seed (Bayrou government, ~25 ministers)
- ✅ **9B** — HATVP XML ingestion (184 interests, 6 declarations for Bayrou)
- ✅ **9E** — Profile UI (`ProfileHero` + `ProfileTabs`, separate Affaires judiciaires tab, all section components)
- ✅ **9C** — AGORA lobby ingestion → 131,842 `ActionLobby` records (20 ministry codes); keyword-matched `reponsablesPublics` → `ministereCode`; `LobbySection` shows top orgs + domain breakdown
- ✅ **9D** — Career timeline → `generate-carriere.ts` populates `EntreeCarriere` from mandats + Depute/Senateur data; `CareerSection` shows vertical timeline with colored dots
- ✅ **9F** — Research agents: 12 parallel web-research agents produced 38 `data/research-output/*.json` files (Tier 1-2 press). 474 career entries + 13 judicial events ingested. `review-agent-output.ts` interactive CLI for verification.
- ✅ **9G (partial)** — President profile fully migrated: `/president` 308-redirects to `/gouvernement/emmanuel-macron`; 4 president-specific section components; 6-tab layout with hero scores + contact for president detection.
- ✅ **9H** — Lecornu II government rework (Session 34): Bayrou mandates closed, 37 Lecornu II members seeded (Oct 2025 + Feb 2026 reshuffle), `ingest-agora.ts` updated with 20 ministry codes (was ~14), all members researched via parallel agents, full ingestion pipeline re-run. Build clean.
- ✅ **9G (historical govts)** — Session 37: data files for Borne/Attal/Barnier created (36+35+41 members). Seed refactored to process all 4 chronologically. `/gouvernement` page supports `?gouvernement=` filter. **Seed not yet run.**
- ⬜ **9G (remaining)** — Run seed + generate-carriere + research agents for ~80 new members; HATVP declarations for Lecornu II (when published)

---

## Recent Sessions

| Session | What Was Built |
|---------|----------------|
| **40** (Mar 26) | **UX Restructure Phases 1-3** — Inspired by Track AIPAC + TheyWorkForYou. (1) Nav 9→4 items (Signaux, Profils, Votes, Territoire). NavSearch enlarged w-80 + `/` keyboard shortcut. (2) Homepage full rewrite: search-first hero (giant search bar, entity pills), inline top 6 signal cards, 5 recent votes, territory lookup. Killed: HeroSlider component, dossier grid, KPI counters, economic indicators. (3) New `/profils` hub: unified people directory at `/profils` (index), `/profils/[slug]` (ministers from `/gouvernement/[slug]`), `/profils/deputes`, `/profils/senateurs`, `/profils/ministres`, `/profils/lobbyistes`, `/profils/partis`, `/profils/elus`, `/profils/comparer`. All links updated. (4) Killed 8 dossier pages + index (redirect to `/signaux` or `/territoire`). Kept: `/dossiers/medias`, `/dossiers/financement-politique`. (5) `/signaux` gains URL-param filter pills (type + severity) + deep-dive "Enquête" cards for surviving dossiers. (6) DossierNav simplified to 2 links + "← Signaux" back link. (7) `src/lib/slug.ts` utility. (8) Footer: "Patrimoine culturel" link. Phase 6 redirects prepared as comments in `next.config.ts`. Docs updated (frontend.md, data-ingestion.md). Build clean. |
| **39** (Mar 25) | **Full UX/UI Audit + 7 Fixes** — Comprehensive browser testing of all major routes using Chrome automation. 3 bug fixes: (1) ~30 missing French accents across `/dossiers/medias` page + `dossier-config.ts`. (2) PIB display on pouvoir-dachat showed "3 Md €" (division by 1M instead of 1K) — fixed to show 2,639 Md €. (3) Dette publique on `/economie` showed "22 157 %" — BDM series `001694258` returns centaines de millions, not percentages. Unit corrected in DB + ingestion. Economie page gained unit-aware formatting for 5 unit types. 4 UX improvements: (4) Homepage stat cards (Députés/Élus/Scrutins/Monuments) wrapped in `<Link>` to respective routes. (5) `DossierNav` right-edge gradient fade for overflow indication. (6) Museum names capitalized on `/patrimoine`. (7) Investigated deputy photo URLs — all 404 (AN changed URL structure), Avatar fallback to initials is correct. Build clean. |
| **38** (Mar 25) | **Full Browser Testing + QA Fixes** — Comprehensive browser testing of all 62 routes from citizen perspective. 4 fixes: (1) Case-insensitive `DeclarationInteret` matching in deputy profile (`mode: "insensitive" as const`) — HATVP stores uppercase names, causing empty declarations for deputies like Fayssat despite 7.7M€ in financial participations. (2) SMIC BDM series `010605027` corrected from `unite: "eur"` to `unite: "indice"` — values are index (base 100), not euros. Economy page display now formats `"eur"` with euro symbol + 2 decimals. (3) "Gouvernement" link added to main nav (8 items). (4) "Gouvernance" → "Représentants" in 13 breadcrumbs across `/representants/*` pages. Build clean. |
| **37** (Mar 25) | **Transparency Cross-References (5 items)** — (1) `ConflictDrilldown` client component: deputy Transparence tab now shows expandable per-tag vote lists (position badge, linked scrutin, date, result) when conflict signals exist. (2) Senator Transparence tab (4th tab): financial interest stat cards + commission-lobbying overlap via 6-domain regex matching against `ActionLobbyiste` counts. (3) Historical governments: `scripts/data/gouvernement-{borne,attal,barnier}.ts` created (36+35+41 members), `gouvernement-lecornu.ts` extracted, `seed-gouvernement.ts` refactored to import all 4 chronologically. `/gouvernement` page gains `?gouvernement=` filter + "Gouvernements precedents" selector. (4) Media-political connections: `/dossiers/medias` new "Connexions politiques" section (contextePolitique cards for all 10 owners) + "Lobbying ciblant le ministere de la Culture" (AGORA top 5 + domain breakdown). `seed-medias.ts` links etat-francais to Culture minister via `personnaliteSlug`. New `MediaTutelleSection` component on Culture minister profile. (5) Elections-party finance: `nuance-party-map.ts` (23 nuance→codeCNCC mappings + coalition detection), `nuance-colors.ts` gains COM/RDG/VEC, party detail page "Performance electorale" section, election page `FinanceTable`, new `/dossiers/financement-politique` dossier (4 sections: cost/seat bars, funding structure stacked bars, electoral yield table, 2021-2024 evolution). `dossier-config.ts` updated. `package.json` gains `seed:gouvernement`. `data-ingestion.md` section 15 fully rewritten. Build clean. |
| **36** (Mar 8) | **Judicial Research + /gouvernement SIGINT Redesign** — (1) Deep judicial research across all 37 Lecornu II government members via parallel agents + Tier 1/2 press review. 35 members confirmed clean. DB corrections: Bergé `EvenementJudiciaire` upgraded from `ENQUETE_PRELIMINAIRE` → `COUR_JUSTICE_REPUBLIQUE` (information judiciaire opened 2025-01-31 at CJR for faux témoignage, crèches privées/LPCR affair). Jeanbrun: nature field corrected on existing SIVU/logements entry (`prise illégale d'intérêts, recel, concussion...`) + new `ENQUETE_PRELIMINAIRE` entry added (PNF information judiciaire June 2022, favoritisme/marchés urbains CITALLIOS, Anticor partie civile). Total EvenementJudiciaire: 14 (up from 13). (2) `/gouvernement` page fully redesigned as SIGINT intelligence bureau console using `frontend-design` skill. New components: `Brackets` (4-corner targeting reticle), `TierLabel` (section header with classification badge), `StemNode` (relay node, amber/teal variants), `SpreadConnector`, `PresidentCard`, `PremierMinistreCard`, `MinistreCard`, `DelegueCard`, `SecretaireCard`. 5-tier color system: amber (T1/President), teal (T2/PM), blue (T3/Ministres), violet (T4/Délégués), rose (T5/Secrétaires). New CSS classes: `.sigint-amber::after`, `.gov-hero-card`, `.live-dot-amber`, `.threat-bar`. Build clean. |
| **35** (Mar 6) | **Media Ownership Dossier + Design Overhaul** — 4 new Prisma models (`GroupeMedia`, `MediaProprietaire`, `ParticipationMedia`, `Filiale`) + 2 enums (`TypeMedia`, `TypeControle`). Migration `20260306131115_add_media_ownership`. `seed-medias.ts`: 10 groups, 10 owners, 72 filiales. Route `/dossiers/medias` with `MediaBoard` (client, interactive owner cards), `ConcentrationChart` (CSS stacked bars), `CamembertChart` (SVG donut). 13 new CSS classes in `globals.css` (`.stat-card`, `.owner-card`, `.section-divider`, `.lobby-stat`, `.mobile-menu-btn`, `.mobile-nav-overlay` etc.). `MobileNav` hamburger menu added to layout. Build clean. |
| **34** (Mar 5) | **Lecornu II Government Rework** — Full transition from Bayrou to Lecornu II (formed Oct 12, 2025, reshuffled Feb 26, 2026). 12 Bayrou mandates closed (`dateFin`). 37 Lecornu II members seeded with bios, photos, formation, deputy/senator cross-refs. `ingest-agora.ts` updated: 20 ministry codes (was ~14), 131,842 ActionLobby (was 94,924). 12 parallel research agents produced 38 `data/research-output/*.json` files → 474 career entries + 13 judicial events. 4 bio corrections applied (Bregeon, Rufo, Forissier, Galliard-Minier). Full pipeline: seed → ingest-research-output → generate-carriere → ingest-agora → refresh:search. Build verified zero TS errors. |
| **33** (Mar 4) | **Parliamentary Laws Hub** — 2 new Prisma models (`LoiParlementaire`, `ScrutinLoi`), migration `20260304164319_add_loi_parlementaire`, seed script covering 19 major laws (censures, PLF, loi narcotrafic, aide à mourir, etc.) with 2,589 `ScrutinLoi` links. New routes: `/votes/lois` (hub with filters) + `/votes/lois/[slug]` (detail with `GroupExpander` + `ScrutinAccordion`). `Grandes lois` section added to `/votes` hub. 3 new components: `LoiCard` (Server), `GroupExpander` (Client), `ScrutinAccordion` (Client). `/representants/scrutins` gains SPS/MOC type filter. Fixed: `ScrutinAccordion` missing `key` prop on finalVote; Bayrou motions cluster designated `VOTE_FINAL`. Build verified zero TS errors. |
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
