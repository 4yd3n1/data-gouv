# Project Plan & Status — L'Observatoire Citoyen

> Started: 2026-02-26
> Last updated: 2026-04-21 (Session 47)
> Project: `/Users/aydenmomika/data-gouv/`
> Replaces: `initial-plan.md` (Feb 28) + `plan2.md` (Feb 26) — both merged here.

---

## Vision

A single place where any citizen can understand how France actually works — who governs, where the money goes, and what the results are. No opinions, no media narratives. Data, cross-referenced and made readable. Sole objective: **show transparency through data**.

### Three Core Questions

Every page helps answer one of these:

1. **Who decides?** — Deputies, senators, ministers, mayors, councillors, lobbyists. Their votes, declarations, conflicts of interest, campaign finance, party funding.
2. **Where does the money go?** — State budget, local taxes, public procurement, subsidies, dotations. Follow the euro from taxpayer to contractor.
3. **What are the results?** — Crime rates, school quality, hospital coverage, unemployment, enterprise creation, road safety, cultural access — territory-level outcomes that test if the money and decisions produce results.

### Six Interconnected Layers

```
┌──────────────────────────────────────────────────┐
│                  GOVERNANCE                       │
│  Deputies · Senators · Ministers · Mayors         │
│  Lobbyists · Declarations · Votes · Parties       │
│  Conflict signals · Déports ministériels          │
├──────────────────────────────────────────────────┤
│                  ELECTIONS                        │
│  Legislative results · Party accounts             │
│  Campaign finance · Nuance mapping                │
├──────────────────────────────────────────────────┤
│               PUBLIC FINANCE                      │
│  Commune budgets · State dotations                │
├──────────────────────────────────────────────────┤
│                  ECONOMY                          │
│  GDP · Unemployment · Enterprise creation         │
│  Income · Housing · Education (INSEE Mélodi)      │
├──────────────────────────────────────────────────┤
│                 TERRITORY                         │
│  Regions · Départements · Communes                │
│  Crime · Medical density · FranceMap              │
├──────────────────────────────────────────────────┤
│               CULTURE & MEDIA                     │
│  Museums · Monuments · Media ownership            │
│  ARCOM signalements                               │
└──────────────────────────────────────────────────┘
```

### What this is NOT

- Not a news site or opinion platform
- Not a social network for citizens
- Not a tool for government officials
- Not trying to be comprehensive about everything — curated around the three questions

---

## What We Built — Phases 1–9 (complete)

### Phase 1: Setup & Architecture (Feb 26)

- Evaluated the data.gouv.fr MCP — kept for data discovery, local DB for serving.
- Explored datasets via MCP → produced [`../data-cat.md`](../data-cat.md) catalog.
- Architecture decisions: Next.js full-stack, App Router, Server Components, PostgreSQL + Prisma.
- Initialized: Next.js 16, React 19, Tailwind CSS 4, Prisma 7.
- Database: PostgreSQL `datagouv`, initial migration, Prisma client singleton.

### Phase 2: Data Ingestion (Feb 26–27)

12 ingestion scripts across 5 data layers, all idempotent:

| Wave | Script | Source | Rows |
|------|--------|--------|------|
| 1a | `ingest-territoires.ts` | INSEE COG CSV | ~37K (18 regions + 101 depts + 36,912 communes) |
| 1b | `ingest-deputes.ts` | data.gouv.fr Tabular API | 2,101 |
| 1b | `ingest-senateurs.ts` | Sénat CSV (ISO-8859-1) | ~5,900 (1,943 + 3,348 mandats + 616 commissions) |
| 1b | `ingest-lobbyistes.ts` | HATVP registry JSON | ~98,500 (3,883 + 94,646 actions) |
| 2 | `ingest-economie.ts` | GDP CSV + INSEE BDM SDMX XML | ~350 (11 indicateurs + 717 observations) |
| 3 | `ingest-musees.ts` | data.gouv.fr Tabular API | ~13,400 (1,226 + 12,148 attendance) |
| 3 | `ingest-monuments.ts` | data.gouv.fr Tabular API | 46,697 |
| 4 | `ingest-declarations.ts` | HATVP merged XML | DeclarationInteret + participations + revenus |
| 5a | `ingest-organes.ts` | AN JSON archive | 7,137 |
| 5b | `ingest-scrutins.ts` | AN JSON archive | ~972K VoteRecord + 66,787 GroupeVote + 5,831 Scrutin |
| 5b | `ingest-deports.ts` | AN JSON archive | 33 (deputy-instance recusals) |
| 6 | `ingest-photos.ts` | AN/Sénat official URLs | ~4,044 updates |

**Shared libraries**: `api-client.ts` (Tabular API paginator), `csv-parser.ts` (papaparse wrapper), `sdmx-parser.ts` (INSEE BDM), `ingestion-log.ts` (timing), `departement-lookup.ts` (fuzzy matching), `hatvp-parser.ts` (Session 42 — extracted 10 functions for cross-script reuse), `normalize-name.ts` (Session 46 — NFD + strip accents for cross-dataset joins).

### Phase 3: Governance UI (Feb 27)

Searchable lists + detail pages for: **Deputies** (bio, contact, voting record, déclarations, déports) · **Senators** (mandats, commissions, déclarations) · **Lobbyists** (actions de représentation) · **Scrutins** (group breakdown bars, individual votes).

### Phase 4: Economy, Territory, Heritage UI (Feb 27)

Économie (GDP + unemployment time-series, French formatting) · Territoire (regions/depts/communes overview + department pages) · Patrimoine (musees + monuments with coordinates).

### Phase 5: Homepage & Cross-cutting (Feb 27–28)

"L'Observatoire Citoyen" hero, 4 exploration cards, recent declarations w/ patrimoine amounts. Photo avatars. Déclarations cross-linked on deputy + senator profiles via `[nom, prenom] + typeMandat` lookup.

### Phase 6: Declaration Content Enhancement (Feb 28)

- Regex-based `parseAllMontants` fixed triple-nested `<montant>` XML parsing (was silently returning 0 rows).
- Full year-by-year breakdowns: 231K revenues across 4 types (dirigeant, mandat_electif, professionnel, consultant).
- Shared `DeclarationSection` expandable-card component (client).

### Phase 7: Elections & Elected Officials (RNE)

593K rows ingested. New models: `Elu`, `ElectionLegislative`, `CandidatLegislatif`, `PartiPolitique`. Scripts: `ingest-elus.ts` (8GB heap), `ingest-elections.ts`, `ingest-partis.ts`. Nuance-party mapping (`src/data/nuance-party-map.ts`, 23 nuances → CNCCFP `codeCNCC`). Routes: `/profils/elus`, `/profils/partis`, `/elections`, `/elections/legislatives-2024/*`.

### Phase 8: Territory Outcomes + FranceMap + Public Finance

- **INSEE Mélodi API** (`ingest-insee-local.ts`) → `StatLocale`: income, population, employment, housing, education by dept. 11 indicators, ~1,790 rows.
- **DGFIP finances locales via OFGL** (`ingest-budgets.ts`) → `BudgetLocal`: 69,023 rows.
- **SSMSI crime stats** + **DREES medical density** (added as 0-row tables, prepared for re-run).
- **`<FranceMap />`** client component (8A) + 6 indicator configs + `getFranceMapData()` server loader. Integrated on 7 pages (8B): `/territoire`, 4 dossiers, plus mini-map on `/territoire/[dept]` + `/mon-territoire`.

### Phase 9: Government Profiles (9A–9H complete)

Ministerial profile system. Models: `PersonnalitePublique`, `MandatGouvernemental`, `EntreeCarriere`, `InteretDeclare`, `EvenementJudiciaire`, `ActionLobby`, and now `DecretDeport` (Session 47).

Seed: `scripts/seed-gouvernement.ts` seeds 4 governments (Lecornu II + historical files prepared for Borne/Attal/Barnier). Ministerial career timelines generated by `generate-carriere.ts` from MandatGouvernemental + Depute/Senateur (NOT HATVP ACTIVITE_ANTERIEURE — it produced garbage).

Profile layout: `ProfileHero` + `ProfileTabs` with tabs Parcours · Déclarations HATVP · Mandats & Lobbying · Affaires judiciaires (conditional) · Activité parlementaire (conditional). `/profils/deputes/[id]` and `/profils/senateurs/[id]` redirect to `/profils/[slug]` when a `PersonnalitePublique` maps to them — one canonical profile per person.

### Sessions 33–47 (post-phase evolution)

| Session | Feature |
|---------|---------|
| 33 | `LoiParlementaire` + `ScrutinLoi` — 19 laws, 2,589 links, `/votes/lois` |
| 34 | Lecornu II government rework — 37 members, 131,842 `ActionLobby` actions ingested via AGORA |
| 35 | **Media ownership dossier** — 4 models (GroupeMedia, MediaProprietaire, ParticipationMedia, Filiale), 10 groups, 72 filiales, ARCOM signalements, `/dossiers/medias` |
| 36 | Judicial research + SIGINT `/gouvernement` redesign |
| 37 | Transparency cross-references — `ConflictDrilldown` on deputy Transparence tab, senator Transparence tab (4th tab), historical government seed files, media-political dossier enrichment, elections-party dossier (`/dossiers/financement-politique`) |
| 38 | `/signaux` cross-dataset intelligence — 6 signal types, pure query-time logic, no new models |
| 39 | **UX restructure phase 1–3** — nav 9→4 items, homepage rewrite (search-first hero + inline signals + territory lookup), new `/profils/*` hub |
| 40–42 | Voting overhaul, HATVP audit (Session 42: `audit-declarations.ts` — 1,973/1,973 perfect matches) |
| 43 | **UX restructure phase 4–6** — extracted `src/lib/vote-tags.ts`, moved `/economie`→`/territoire/economie`, deleted 29 legacy pages, activated all `next.config.ts` redirects, -6,203 lines net |
| 44 | **Deep government investigation** — 12 parallel web-research agents, 24 conflict flags across 16 ministers, `PORTE_TOURNANTE` signals (Bregeon/EDF 130, Farandou/SNCF 75, Lescure/Natixis 33, Baptiste/IBM 11, Papin/Système U, Pégard/Le Point), vote-contradiction analysis, lobby-career overlap |
| 45 | **Bilan Macron dossier** — `/dossiers/bilan-macron` (7-section data-driven assessment, `src/data/bilan-macron.ts` ~740 lines typed constants, 7 new components in `src/components/bilan/`, fact-checked by 3 verification agents) |
| 46 | **HATVP normalization + re-ingestion** — `normalizeName()` helper, 4 tables get `nomNormalise`+`prenomNormalise` btree-indexed cols, HATVP XML re-ingested → `InteretDeclare` jumped 184→1,988 rows (2→67 personnalites). Case-sensitivity bug fixed (471 + 517 unreachable senator/deputy declarations) |
| 47 | **Décrets de déport** — `DecretDeport` model + `BasisDeport` enum, 11 décrets seeded from `info.gouv.fr` registre du PM (not HATVP), `<DeportBanner />` (cross-tab alert) + `<DeportSection />` (HATVP tab), UI integration on `/profils/[slug]` |

---

## Database: 43 Models (~800K rows)

All counts from live DB at 2026-04-21.

### Territory Layer (3 models)
| Model | Rows | Source |
|-------|------|--------|
| `Region` | 18 | INSEE COG CSV |
| `Departement` | 101 | INSEE COG CSV |
| `Commune` | 36,912 | INSEE COG CSV |

### Governance Layer — Parliament (8 models)
| Model | Rows | Source |
|-------|------|--------|
| `Depute` | 2,101 | Datan Tabular API |
| `Senateur` | 1,943 | Sénat CSV |
| `MandatSenateur` | 3,348 | Sénat ODSEN_ELUSEN |
| `CommissionSenateur` | 616 | Sénat ODSEN_CUR_COMS |
| `Organe` | 7,137 | AN JSON |
| `Scrutin` | 5,831 | AN JSON |
| `GroupeVote` | 66,787 | AN JSON (nested) |
| `VoteRecord` | 972,856 | AN JSON (nested) |

### Governance Layer — Lobbying + Declarations (6 models)
| Model | Rows | Source |
|-------|------|--------|
| `Lobbyiste` | 3,883 | HATVP registry JSON |
| `ActionLobbyiste` | 94,646 | HATVP registry JSON |
| `DeclarationInteret` | 10,226 | HATVP XML (Session 46) |
| `ParticipationFinanciere` | 10,936 | HATVP XML |
| `RevenuDeclaration` | 381,088 | HATVP XML |
| `Deport` | 33 | AN JSON (deputy-instance recusals) |

### Government Profiles (Phase 9 + Session 47) — 7 models
| Model | Rows | Source |
|-------|------|--------|
| `PersonnalitePublique` | 110 | `seed-gouvernement.ts` + research |
| `MandatGouvernemental` | 164 | `seed-gouvernement.ts` |
| `EntreeCarriere` | 854 | `generate-carriere.ts` + press research |
| `InteretDeclare` | 1,988 | `ingest-hatvp.ts` (Session 46) |
| `EvenementJudiciaire` | 31 | manual research (verified Tier 1–2 sources) |
| `ActionLobby` | 131,842 | AGORA JSON |
| **`DecretDeport`** | **11** | **info.gouv.fr registre PM (Session 47)** |

### Elections & Elected Officials (4 models)
| Model | Rows | Source |
|-------|------|--------|
| `Elu` | 593,153 | RNE CSV (8GB heap) |
| `ElectionLegislative` | 1,078 | Min. Intérieur 2024 |
| `CandidatLegislatif` | 5,103 | Min. Intérieur 2024 |
| `PartiPolitique` | 2,179 | CNCCFP |

### Economy + Local Stats (4 models)
| Model | Rows | Source |
|-------|------|--------|
| `Indicateur` | 11 | GDP + INSEE BDM |
| `Observation` | 717 | GDP + INSEE BDM |
| `StatLocale` | 1,790 | INSEE Mélodi |
| `BudgetLocal` | 69,023 | OFGL / DGFIP |

### Culture (3 models)
| Model | Rows | Source |
|-------|------|--------|
| `Musee` | 1,226 | Ministry Tabular API |
| `FrequentationMusee` | 12,148 | Ministry Tabular API |
| `Monument` | 46,697 | Ministry Tabular API |

### Legislative Laws + Vote Tags (3 models)
| Model | Rows | Source |
|-------|------|--------|
| `LoiParlementaire` | 19 | manual seed (Session 33) |
| `ScrutinLoi` | 2,589 | `seed-lois.ts` |
| `ScrutinTag` | 3,170 | `tag-scrutins.ts` |

### Media Ownership (4 models, Session 35)
| Model | Rows | Source |
|-------|------|--------|
| `GroupeMedia` | 10 | manual seed |
| `MediaProprietaire` | 10 | manual seed |
| `ParticipationMedia` | 10 | manual seed |
| `Filiale` | 72 | manual seed |
| `SignalementArcom` | 20 | manual seed |

### Cross-reference + Safety (2 models)
| Model | Rows | Source |
|-------|------|--------|
| `ConflictSignal` | 524 | `compute-conflicts.ts` |
| `StatCriminalite`, `DensiteMedicale` | 0 | (tables created, ingestion scripts prepared — pending re-run) |

### System (1 model)
| Model | Rows | Purpose |
|-------|------|---------|
| `IngestionLog` | 52 | Auto-log per run (status, duration, metadata) |

**Total: 43 models + `IngestionLog`, ~800K rows, ~60 indexes + 1 materialized view (`search_index`).**

Name normalization (Session 46): `Depute`, `Senateur`, `DeclarationInteret`, `PersonnalitePublique` all carry `nomNormalise` + `prenomNormalise` compound-indexed — use them for every cross-dataset name join (Prisma `mode: "insensitive"` handles case but not accents, silently drops ~30% of minister→declaration joins).

---

## UI Routes (current)

```
/                                         Homepage (search hero + 6 signals + territory lookup)
/signaux                                  Cross-dataset intelligence (6 signal types)
/signaux?type=X&severity=Y                URL-param filters
/profils                                  People hub
/profils/[slug]                           Minister profile (+ DeportBanner + signal strip)
/profils/deputes                          Deputies list
/profils/deputes/[id]                     → redirects to /profils/[slug] when a PersonnalitePublique maps
/profils/senateurs                        Senators list
/profils/senateurs/[id]                   → same redirect behaviour
/profils/ministres                        Government index (SIGINT organigram, ?gouvernement= filter)
/profils/elus                             Local officials (593K, paginated)
/profils/lobbyistes                       Lobbyists list
/profils/lobbyistes/[id]                  Lobbyist detail
/profils/partis                           Parties hub (year selector, aggregate stats)
/profils/partis/[id]                      Party detail (multi-year revenue/expense)
/profils/comparer                         Deputy comparison (4-state)
/votes                                    Parliamentary votes hub
/votes/scrutins/[id]                      Canonical scrutin detail
/votes/lois                               Laws list (Session 33)
/votes/par-sujet/[tag]                    Votes grouped by ScrutinTag
/votes/mon-depute                         Search a specific deputy's votes
/territoire                               Territory hub + FranceMap
/territoire/[dept]                        Department dashboard
/territoire/commune/[code]                Commune detail
/territoire/comparer                      Dept comparison
/territoire/economie                      Macro indicators (ex /economie)
/mon-territoire                           Postal-code lookup
/elections                                Elections hub
/elections/legislatives-2024/*            2024 results
/patrimoine                               Heritage overview
/patrimoine/musees                        Museums + detail pages
/patrimoine/monuments                     Monuments + detail pages
/dossiers/bilan-macron                    Bilan Macron (Session 45, 7 sections)
/dossiers/medias                          Media ownership (Session 35)
/dossiers/financement-politique           Party & election finance
/recherche                                Global full-text search (search_index view)
/president                                Macron dedicated profile
```

Legacy routes (`/gouvernance/*`, `/representants/*`, `/gouvernement/*`, `/comparer/*`) → HTTP 308 redirects configured in `next.config.ts`.

---

## Components (50+ total)

### Shared primitives
`PageHeader` · `Pagination` · `SearchInput` (client) · `SearchBox` (client) · `NavSearch` (client, `/` shortcut) · `MobileNav` (client) · `StatCard` · `IndicatorCard` · `ScoreBar` · `ScoreGauge` · `DeltaBadge` (client) · `Avatar` (client) · `ShareButton`

### Charts & maps
`TimelineChart` · `CamembertChart` · `ConcentrationChart` · `DeptMap` · `FranceMap` (client, hex-lerp palette) · `LobbyingDensity` · `MediaTreemap` · `PowerMap` · `RankingTable`

### Profile page building blocks
`ProfileHero` · `ProfileTabs` (client, `?tab=`) · `ProfileSignalBanner`

### Gouvernement section components (12)
In `src/components/gouvernement/`:

| Component | Purpose |
|-----------|---------|
| `CareerSection` | `EntreeCarriere` timeline w/ `matchRevolvingDoor()` — amber "Porte tournante" badges when `CARRIERE_PRIVEE` matches `PORTFOLIO_KEYWORDS` |
| `MandatsSection` | Government mandate timeline |
| `InteretsSection` | HATVP interests grouped by `rubrique`, progressive disclosure (first 5 inline, rest in `<details>`) |
| `LobbySection` | AGORA lobby data for current ministry + "Ancien employeur" highlight |
| `JudiciaireSection` | `EvenementJudiciaire` (only `verifie = true`) |
| `ParliamentarySection` | Conditional; 4 score bars + vote-contradiction alert + recent votes |
| **`DeportBanner`** (Session 47) | Cross-tab red strip below `ProfileHero` showing décret de déport |
| **`DeportSection`** (Session 47) | Full décret cards in Déclarations HATVP tab |
| `MediaTutelleSection` | For Culture minister — ARCOM signalements + top filiales |
| `PresidentBilanSection` | President-only: KPI grid + chômage timeline |
| `PresidentPromessesSection` | President-only: promise evaluation w/ evidence |
| `PresidentLobbyingSection` | President-only: power lobbyists + consulting firms |
| `PresidentDeclarationsSection` | President-only: `DeclarationInteret` (different model) |

### Specialized sections
`ConflictAlert` · `ConflictDrilldown` (client, expandable tag-grouped vote list) · `DeclarationSection` (client) · `DossierHero` · `DossierNav` · `GroupExpander` (client) · `LoiCard` · `MediaBoard` (client) · `ArcomSection` · `ScrutinAccordion` (client) · `ScrutinResultBadge` · `SignalCard` · `VoteBadge` · `DeptLookup` (client) · 7 components in `src/components/bilan/`

---

## Ingestion Pipeline — 10 waves

```
Wave 1a:  ingestTerritoires()                       # must be first (FK targets)
Wave 1b:  Promise.all([deputes, senateurs, lobbyistes])
Wave 2:   ingestEconomie()
Wave 3:   Promise.all([musees, monuments])
Wave 4:   ingestDeclarations()
Wave 5a:  ingestOrganes()                           # must precede scrutins
Wave 5b:  Promise.all([scrutins, deports])          # AN deputy-instance deports
Wave 5c:  tagScrutins()                             # must precede Wave 5d
Wave 5d:  computeConflicts()                        # after tags + declarations
Wave 6:   ingestPhotos()
Wave 7:   Promise.all([elus, elections, partis])
Wave 8:   Promise.all([inseeLocal, budgets])
Wave 9:   Promise.all([criminalite, medecins])
Wave 10:  REFRESH search_index materialized view
```

All scripts are idempotent (upsert, not insert). `logIngestion()` wraps each with timing + IngestionLog write. Metadata is `Record<string, unknown>`, not `JSON.stringify(...)`.

### Seed scripts (out-of-band)

- `seed-gouvernement.ts` — Lecornu II + historical Borne/Attal/Barnier configs
- `seed-lois.ts` — 19 laws + 2,589 scrutin links
- `seed-medias.ts` — 10 groups, 10 owners, 72 filiales (Session 35)
- `seed-decrets-deport.ts` — **11 décrets from info.gouv.fr registre (Session 47)**
- `generate-carriere.ts` — `EntreeCarriere` from MandatGouvernemental + Depute/Senateur

### Audit / analysis (read-only)

- `audit-declarations.ts` (Session 42) — 3-phase XML vs DB verification, produces JSON report at `data/audit-declarations-{date}.json`
- `analyze-vote-contradictions.ts` (Session 44) — vote contradictions for deputy-ministers
- `analyze-lobby-exposure.ts` (Session 44) — lobby-career overlap analysis
- `backfill-normalized-names.ts` (Session 46) — idempotent

---

## Tech Stack

| Package | Version |
|---------|---------|
| Next.js | 16.1.6 |
| React | 19.2.4 |
| TypeScript | 5.9.3 |
| Prisma | 7.4.1 (+ `@prisma/adapter-pg`) |
| Tailwind CSS | 4.2.1 |
| Node.js | 20.19.2+ (required for Prisma 7) |
| pnpm | 10.12.1 |
| PostgreSQL | 14.18 |
| fast-xml-parser | HATVP XML (200MB+ stream-parse) |
| papaparse | CSV parsing (semicolon/quoted/BOM) |

---

## Commands

```bash
# Development
pnpm dev                  # Next.js (port 3000) — auto-uses Node 20.19.2 via .nvmrc
pnpm build                # Production build
pnpm db:migrate           # Prisma migrations
pnpm db:generate          # Regenerate Prisma client (required after every migration)

# Full ingestion
pnpm ingest               # All waves (see scripts/ingest.ts)
pnpm refresh:search       # Wave 10: refresh search_index materialized view

# Per-wave (all idempotent)
pnpm ingest:territoires   # Wave 1a
pnpm ingest:deputes       # Wave 1b
pnpm ingest:senateurs     # Wave 1b
pnpm ingest:lobbies       # Wave 1b
pnpm ingest:economie      # Wave 2
pnpm ingest:musees        # Wave 3
pnpm ingest:monuments     # Wave 3
pnpm ingest:declarations  # Wave 4
pnpm ingest:organes       # Wave 5a
pnpm ingest:scrutins      # Wave 5b
pnpm ingest:deports       # Wave 5b (AN deputy-instance)
pnpm ingest:photos        # Wave 6
pnpm ingest:elus          # Wave 7 (needs 8GB heap)
pnpm ingest:elections     # Wave 7
pnpm ingest:partis        # Wave 7
pnpm ingest:insee-local   # Wave 8
pnpm ingest:budgets       # Wave 8
pnpm ingest:criminalite   # Wave 9
pnpm ingest:medecins      # Wave 9
pnpm tag:scrutins         # Wave 5c
pnpm compute:conflicts    # Wave 5d

# Phase 9 + Session 47
pnpm ingest:agora                         # AGORA lobby targeting
pnpm generate:carriere                    # Build EntreeCarriere
pnpm seed:gouvernement                    # 4 governments seed
pnpm seed:medias                          # Media ownership (Session 35)
pnpm tsx scripts/seed-decrets-deport.ts   # 11 décrets (Session 47)
pnpm audit:declarations                   # Audit HATVP XML vs DB (Session 42)
```

---

## Key Data Source URLs

| Target | URL |
|--------|-----|
| Active deputies | `https://tabular-api.data.gouv.fr/api/resources/092bd7bb-.../data/` |
| Historic deputies | `https://tabular-api.data.gouv.fr/api/resources/817fda38-.../data/` |
| Senators general | `https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv` |
| HATVP lobbyists | `https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json` |
| HATVP declarations XML | `https://www.hatvp.fr/livraison/merge/declarations.xml` (~120MB) |
| HATVP dossiers CSV | `https://www.hatvp.fr/livraison/opendata/liste.csv` |
| **Registre PM déports** | `https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets` (Cloudflare — browser automation) |
| INSEE BDM | `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}` |
| INSEE Mélodi | `https://api.insee.fr/melodi` (no key, 30 req/min) |
| Museums | `https://tabular-api.data.gouv.fr/api/resources/7708e380-.../data/` |
| Monuments | `https://tabular-api.data.gouv.fr/api/resources/3a52af4a-.../data/` |

---

## Lessons Learned

Accumulated across Phases 1–9 and Sessions 33–47.

### Build-time / setup
1. **Prisma 7 breaking change**: `url` removed from `schema.prisma`; use `prisma.config.ts` + `@prisma/adapter-pg` with `pg.Pool`. Node 20.19+ required.
2. **`pnpm db:generate` is mandatory after every migration** — build fails otherwise.
3. **Turbopack caches the generated Prisma client** — restart `pnpm dev` after `db:generate`.
4. **`{ prisma }` named export** from `@/lib/db` — default import causes build error.
5. **tsconfig**: exclude `documentation/` from build.

### Ingestion specifics
6. **data.gouv.fr MCP search** uses AND logic — short specific queries work best.
7. **Sénat data** is not on Tabular API — direct CSV from `data.senat.fr` (ISO-8859-1, SQL-comment headers `%`).
8. **AN JSON**: single-voter objects must be normalized to arrays (`Array.isArray(x) ? x : x ? [x] : []`).
9. **`VoteRecord` volume** (~938K rows) requires batch inserts (500 per batch) and pre-loaded Depute ID sets for FK validation.
10. **Declarations matching** has no direct FK — uses `[nomNormalise, prenomNormalise]` compound index + typeMandat filter (Session 46 fix — accent-insensitive mode alone silently dropped ~30% of joins).
11. **Overseas depts** (`099`, `975`, `977`, `986–988`) are not in COG — added `departementRefCode` as nullable FK separate from raw `departementCode`.
12. **Delegated communes** (2,576 COMD/COMA) have empty DEP — resolve from parent commune code.
13. **HATVP `<montant>` triple nesting**: XML has `<montant>` at 3 levels. `indexOf`-based matching breaks; use regex `<annee>\s*(\d{4})\s*</annee>\s*<montant>\s*([^<]+)</montant>`.
14. **HATVP server flakiness**: resume from last byte on retry. Also cache the 120MB XML locally — HATVP drops connections on multi-minute streams.
15. **INSEE Mélodi rate limit**: 30 req/min, 2,100ms delay between calls. Parallel fetches to same dept hit 429 — re-running is safe (upsert).
16. **AGORA JSON is ~80MB** — parse incrementally, not `JSON.parse` on the whole file.

### HATVP + info.gouv.fr specifics (Sessions 46–47)
17. **HATVP ≠ PM registre**. HATVP issues confidential recommendations; the PM signs + publishes the décret to JORF, mirrored at info.gouv.fr. For déport tracking, info.gouv.fr is the source of truth, not HATVP.
18. **info.gouv.fr is Cloudflare-protected** — `curl`/`WebFetch` get 403. Use claude-in-chrome browser automation to scrape the registre.
19. **`ACTIVITE_ANTERIEURE` is not a career source** — HATVP rubrique 2 is a financial-disclosure field; it produced garbage entries ("Élevage chevaux", "Publications") when used for `EntreeCarriere`. Use MandatGouvernemental + Depute/Senateur only.
20. **A déport can exist without the declaration being public** — HATVP reviews confidentially, the PM signs the décret, but the declaration may publish weeks later (e.g. David Amiel, Session 47).

### UI / Next 16 specifics
21. **ProfileTabs requires `<Suspense>` wrapper** — uses `useSearchParams`.
22. **Never use `<form>` or `next/form` for search** — browser automation + React 19 both break native submit. Use `onKeyDown` + `useRef`.
23. **`NavSearch` always `flex`** (never `hidden md:flex`) — fails at DPR 2 / browser-tool viewport.
24. **OG images**: never `<img src>` remote URLs in satori — use initials monogram; always `runtime = "nodejs"`, `{ prisma }` named import.
25. **`TimelineChart` sort**: data must be sorted by period before passing in.
26. **French formatting** via `src/lib/format.ts` (`formatEuro`, `formatInt`, `formatPct`) — never inline `toLocaleString`.

### Schema field-name gotchas (wrong = TS build errors)
27. `Scrutin.dateScrutin` (not `dateSeance`), `Scrutin.sortCode` (not `sort`), `Scrutin.abstentions` (not `abstention`), `Scrutin.votes VoteRecord[]` (not `voteRecords`).
28. `GroupeVote.abstentions` (not `abstention`); no `nomOrgane` field — use `organeRef`.
29. `Lobbyiste.nom` (not `nomOrganisation`), `Lobbyiste.categorieActivite` (not `categorie`).
30. `Depute.groupe` (not `groupePolitique`) — critical for `search_index` materialized view.
31. `Elu.nom` / `Elu.prenom` (not `nomElu` / `prenomElu`), `Elu.codeDepartement` (not `departementCode`).
32. `DensiteMedicale.specialite` (not `profession`).
33. `EvenementJudiciaire` has **no timestamp columns** — do NOT include `createdAt`/`updatedAt` in INSERTs.
34. `EvenementJudiciaire.verifie` — **never display on public profiles unless `true`**.

---

## Outstanding work

- **Seed historical governments** — Borne / Attal / Barnier seed files prepared, not yet run.
- **Link remaining `deputeId`** values on Lecornu II ministers (only 6/17 deputy-ministers linked).
- **3 missing déports** — HATVP cited 14, registre shows 11. Candidates: Farandou (SNCF), Lescure (Natixis), Pégard (Le Point). Re-check info.gouv.fr weekly.
- **`/signaux` `deport` signal type** — add to `src/lib/signals.ts` so the 11 déports appear on the intelligence feed.
- **`StatCriminalite` + `DensiteMedicale`** — tables empty. Re-run `ingest-criminalite` + `ingest-medecins`.

---

## Known gaps (no open data exists)

- **IRFM / parliamentary expenses** — no structured open data anywhere.
- **Élysée / Matignon spending** — not published.
- **Association subsidies national rollup** — only fragmented municipal datasets (162 local datasets, no national aggregate).

---

## Directory Structure

```
data-gouv/
├── .mcp.json                            # data.gouv.fr MCP config
├── ARCHITECTURAL-PLAN.md                # Long-form architecture
├── CLAUDE.md                            # Agent-facing project rules
├── data-cat.md                          # Data source catalog
├── prisma/
│   ├── schema.prisma                    # 43 models + IngestionLog
│   ├── prisma.config.ts                 # Datasource URL (Prisma 7)
│   └── migrations/                      # ~50 migrations
├── scripts/
│   ├── ingest.ts                        # Orchestrator (10 waves)
│   ├── ingest-*.ts                      # 20 ingestion scripts
│   ├── seed-*.ts                        # 5 seed scripts
│   ├── generate-carriere.ts             # Build EntreeCarriere
│   ├── audit-declarations.ts            # Session 42
│   ├── analyze-vote-contradictions.ts   # Session 44
│   ├── analyze-lobby-exposure.ts        # Session 44
│   ├── backfill-normalized-names.ts     # Session 46
│   ├── compute-conflicts.ts             # Wave 5d
│   ├── tag-scrutins.ts                  # Wave 5c
│   ├── refresh-search.ts                # Wave 10
│   ├── data/                            # Static seed data (governments, lois, medias)
│   └── lib/                             # Shared utilities
├── src/
│   ├── app/                             # Routes (see above)
│   ├── components/
│   │   ├── gouvernement/                # 12 section components
│   │   ├── signaux/                     # signal cards
│   │   ├── bilan/                       # 7 Bilan Macron components
│   │   └── *.tsx                        # 40+ shared components
│   ├── data/                            # Typed static data (bilan-macron, nuance maps, france-geo, etc.)
│   ├── lib/                             # db, format, normalize-name, search, signals, vote-tags, ...
│   └── types/
├── documentation/
│   ├── initial-plan.md                  # This file (Session 47 — fused from plan2.md + initial-plan.md)
│   ├── blueprint.md                     # Current-state pointer map
│   ├── schema.md                        # All 43 models
│   ├── frontend.md                      # Routes + components
│   ├── data-ingestion.md                # 10-wave pipeline reference
│   ├── handoff.md                       # Session history
│   ├── phases/                          # Phase 9 plan/checklists/workflow
│   └── hatvp-old-context/               # Cached HATVP XML
└── public/
    └── photos/                          # Deputy/senator/minister photos
```
