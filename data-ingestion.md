# Data Ingestion & Transparency Pipeline — Complete Report

## The Big Picture

The platform ingests data from **15+ French government open data sources** through a **10-wave pipeline** of 25+ idempotent scripts, populating **42 Prisma models** (~800K rows). Every page is a server-rendered transparency lens — no client-side data fetching. The architecture guarantees that raw government data flows through a single path: **Source → Ingest → PostgreSQL → Server Component → Transparency Metrics → Render**.

---

## 1. External Data Sources (15+ pipelines)

| Domain | Source | What It Provides | Volume |
|--------|--------|-----------------|--------|
| **Deputies** | AN/Datan Tabular API | 577 active + 2,100 historic deputies with participation/loyalty scores | ~2,400 rows |
| **Senators** | Sénat CSV (ISO-8859-1) | 348 senators + mandates + commissions | ~1,700 rows |
| **Lobbyists** | HATVP AGORA JSON (80MB) | ~1,500 orgs, 131K+ lobbying actions | ~142K rows |
| **Declarations** | HATVP XML (143MB) | Financial interests, participations, revenues for all declarants | ~500K rows (12,756 declarations + 13K participations + 475K revenus) |
| **Votes** | AN JSON archive (5,831 files) | Every parliamentary vote + per-deputy position | ~973K vote records |
| **Organes** | AN JSON archive (7,137 files) | Parliamentary bodies (groups, commissions) | ~7K rows |
| **Economy** | INSEE BDM (SDMX) + data.gouv GDP | 15 macro indicators (unemployment, inflation, debt, SMIC...) | ~2K observations |
| **Territory** | INSEE COG 2026 CSV | Regions, departments, communes | ~36K rows |
| **Local stats** | INSEE Mélodi API | Income, poverty, population, employment, housing, education by dept | ~5K rows |
| **Budgets** | OFGL Opendatasoft | Municipal/departmental revenue, spending, debt | ~10K rows |
| **Crime** | SSMSI CSV | 6 crime categories by dept, 2016–2025 | ~6K rows |
| **Health** | DREES API | Medical density (6 specialties) by dept | ~8K rows |
| **Elected officials** | RNE CSV (10 files) | 640K mayors, councillors, etc. | ~640K rows |
| **Elections** | Interior Ministry CSV | 2024 legislative results (2 tours, 577 constituencies) | ~6K rows |
| **Party finances** | CNCCFP CSV | Revenue/expense accounts for ~35 parties, 2021–2024 | ~140 rows |
| **Culture** | Ministry Tabular API | 3K museums + attendance, 46K monuments | ~65K rows |
| **Government** | Manual research + seed + deep investigation | 44 members (current); 148 across 4 govts after historical seed. Career timelines, **15 judicial events** (Darmanin CJR added Session 44), lobby targeting, **24 conflict flags** (revolving doors, vote contradictions, HATVP gaps, lobby-career overlaps) | ~600 rows (current), ~2K after full seed |
| **Media** | Manual seed | 10 groups, 10 owners, 72 subsidiaries, ARCOM signalements, political connections | ~100 rows |
| **Party-Election** | Nuance-party mapping | Election results cross-referenced with CNCCFP party finances via nuance codes | static mapping (23 nuances) |
| **Bilan Macron** *(Session 45)* | Deep web research (4 parallel agents, 150+ searches) + official sources (INSEE, Eurostat, DREES, France Stratégie, Oxfam, CEVIPOF, Amnesty, RSF, EIU). All key claims independently fact-checked (3 verification agents, 30+ searches). | Structured static data covering 7 dimensions: poverty/inequality (6 before/after metrics), purchasing power (4), debt/fiscal (5 + 5 fiscal gifts), employment (3), healthcare (6 + 4 social cuts + 4 education + 3 public services), human rights (police violence stats + 5 democratic erosion + 3 labor rights + 5 environment + 5 social fabric), elite enrichment (3 billionaire metrics + 5 facts + 4 revolving door cases + 8 contrast rows). Verified figures: billionaires x2.15 (Challenges: 571→1,228 Md), 49.3 Borne 23x (France Info), deficit 5.1% (INSEE Mar 27 2026), youth unemp ~24%→21.5%, dividends source Vernimmen/CAC 40, hospital beds trend since ~2003 (DREES/IRDES). | static data file (`src/data/bilan-macron.ts`) — no new DB models |

---

## 2. Ingestion Pipeline (10-Wave Architecture)

Every script is **idempotent** (upsert, never raw insert). The wave order enforces FK dependencies:

```
Wave 1a:  Territoires (COG)                    <- MUST BE FIRST (all FKs depend on it)
Wave 1b:  Deputes || Senateurs || Lobbyistes   <- parallel, no interdependency
Wave 2:   Economie (GDP + 15 BDM series)
Wave 3:   Musees || Monuments                  <- parallel
Wave 4:   Declarations HATVP (150MB XML)       <- needs Depute/Senateur IDs
Wave 5a:  Organes                              <- must precede scrutins
Wave 5b:  Scrutins || Deports                  <- parallel, need Organe + Depute IDs
Wave 5c:  Tag scrutins (keyword -> domain)     <- needs scrutins
Wave 5d:  Compute conflict signals             <- needs tags + declarations
Wave 6:   Photos (URL assignment)
Wave 7:   Elus || Elections || Partis           <- parallel
Wave 8:   INSEE Local || Budgets               <- parallel
Wave 9:   Criminalite || Medecins              <- parallel
Wave 10:  REFRESH MATERIALIZED VIEW search_index  <- FINAL
```

### Package.json Scripts

```bash
pnpm ingest                    # Full orchestrated run (ingest.ts)
pnpm ingest:territoires        # Wave 1a: COG (INSEE) geography
pnpm ingest:deputes            # Wave 1b: Deputies (Datan)
pnpm ingest:senateurs          # Wave 1b: Senators (Senat)
pnpm ingest:lobbies            # Wave 1b: Lobbyists (HATVP)
pnpm ingest:economie           # Wave 2: GDP + economic indicators
pnpm ingest:musees             # Wave 3: Museums + attendance
pnpm ingest:monuments          # Wave 3: Historical monuments
pnpm ingest:declarations       # Wave 4: HATVP interest declarations
pnpm ingest:organes            # Wave 5a: AN parliamentary bodies
pnpm ingest:scrutins           # Wave 5b: Parliamentary votes
pnpm ingest:deports            # Wave 5b: Recusal declarations
pnpm ingest:photos             # Wave 6: Deputy/senator photos
pnpm ingest:elus               # Wave 7: RNE elected officials (8GB heap)
pnpm ingest:elections          # Wave 7: 2024 election results
pnpm ingest:partis             # Wave 7: Party accounts (CNCCFP)
pnpm ingest:insee-local        # Wave 8: INSEE Melodi local stats
pnpm ingest:budgets            # Wave 8: DGFIP local finances (OFGL)
pnpm ingest:criminalite        # Wave 9: SSMSI crime stats
pnpm ingest:medecins           # Wave 9: DREES medical density
pnpm compute:conflicts         # Wave 5d: Compute conflict signals
pnpm tag:scrutins              # Wave 5c: Tag votes by policy domain
pnpm refresh:search            # Wave 10: Refresh full-text search index
pnpm ingest:agora              # Phase 9: AGORA lobby targeting ministries
pnpm generate:carriere         # Phase 9: Generate government career timelines
pnpm seed:medias               # Phase 8: Seed media ownership data
pnpm seed:gouvernement         # Phase 9: Seed 4 governments (Borne/Attal/Barnier/Lecornu)
pnpm audit:declarations        # Audit: verify HATVP XML vs DB vs display (read-only)

# Session 44: Analysis scripts (read-only, produce JSON reports)
npx tsx scripts/analyze-vote-contradictions.ts  # Vote contradiction analysis for deputy-ministers → data/vote-contradictions.json
npx tsx scripts/analyze-lobby-exposure.ts       # Lobby exposure + career overlap analysis → data/lobby-exposure.json
npx tsx scripts/add-conflict-flags.ts           # Add revolving door + vote contradiction flags to research-output JSONs
npx tsx scripts/update-investigation-findings.ts # Add judicial events + conflict flags from investigation agents
npx tsx scripts/update-wave2-findings.ts        # Add wave 2 findings (Tabarot PNF, Rist pharma, Pegard Epstein, etc.)
```

---

## 3. Detailed Ingestion Pathways

### Wave 1a: Territories (COG — Code Officiel Geographique)

**File**: `scripts/ingest-territoires.ts`

- **Source**: INSEE official geographic nomenclature (2026 version)
  - `https://www.insee.fr/fr/statistiques/fichier/8740222/v_region_2026.csv`
  - `https://www.insee.fr/fr/statistiques/fichier/8740222/v_departement_2026.csv`
  - `https://www.insee.fr/fr/statistiques/fichier/8740222/v_commune_2026.csv`
- **Prisma Models**: `Region`, `Departement`, `Commune`
- **Idempotency**: Upsert (keyed by code)
- **Transformations**:
  - Normalize department codes (uppercase for Corsica: 2a -> 2A)
  - Derive missing DEP/REG from commune parent codes
  - Skip communes with unresolvable department
  - Batch 500 communes per transaction
- **Error Handling**: Skip rows with missing DEP; verify department codes exist in parent table
- **Volume**: ~17 regions, ~96 departments, ~35,000 communes
- **Critical**: Must run first — all other scripts depend on FK to territories

---

### Wave 1b: Deputies (National Assembly)

**File**: `scripts/ingest-deputes.ts`

- **Source**: Datan (data.gouv.fr Tabular API)
  - Active: `https://tabular-api.data.gouv.fr/api/resources/092bd7bb-1543-405b-b53c-932ebb49bb8e/data/`
  - Historic: `https://tabular-api.data.gouv.fr/api/resources/817fda38-d616-43e9-852f-790510f4d157/data/`
- **Prisma Model**: `Depute`
- **Idempotency**: Upsert on `id` (AN source ID)
- **Transformations**:
  - Normalize department code (uppercase)
  - Parse dates, integers, floats safely
  - Validate department code exists in DB; skip FK if missing
  - Active deputies take precedence (avoid overwriting active=true with historic)
- **Volume**: ~577 active, ~2,101 historic (~2,400 net unique after dedup)
- **Fields Mapped**: legislature, civilite, nom/prenom, departement, groupe, scores, profession, contact info

---

### Wave 1b: Senators (Upper House)

**File**: `scripts/ingest-senateurs.ts`

- **Source**: Official Senat open data (ISO-8859-1 encoded)
  - `https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv`
  - `https://data.senat.fr/data/senateurs/ODSEN_ELUSEN.csv`
  - `https://data.senat.fr/data/senateurs/ODSEN_CUR_COMS.csv`
- **Prisma Models**: `Senateur`, `MandatSenateur`, `CommissionSenateur`
- **Idempotency**:
  - `Senateur`: Upsert on `id` (Matricule)
  - `MandatSenateur`, `CommissionSenateur`: Delete then insert (no stable composite IDs)
- **Transformations**:
  - Strip SQL comment lines (%) from CSV
  - Parse dates, resolve department names to codes via lookup
  - Determine actif status from "Etat" column (ACTIF = true)
- **Volume**: ~348 senators, ~348 mandates, ~1,000+ commissions
- **Special Handling**: Department code resolution via fuzzy name matching to official list

---

### Wave 1b: Lobbyists (HATVP Registry)

**File**: `scripts/ingest-lobbyistes.ts`

- **Source**: HATVP Open Data JSON (80MB+)
  - `https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json`
- **Prisma Models**: `Lobbyiste`, `ActionLobbyiste`
- **Idempotency**:
  - `Lobbyiste`: Upsert on `id` (SHA256 hash of denomination, 16-char)
  - `ActionLobbyiste`: Delete then insert (nesting depth = 3)
- **Transformations**:
  - Nested JSON 3 levels deep: publication -> exercice -> activite -> action
  - Extract latest exercice for staff/revenue data
  - Find earliest registration date across exercices
  - Join address components (adresse, codePostal, ville)
  - Summarize action types (first 3 of actionsMenees)
  - Parse HATVP dates: DD-MM-YYYY or DD/MM/YYYY
- **Volume**: ~10,000 lobbyists, ~131,000+ actions (AGORA-linked version: ~131,842 after Lecornu II reshuffle)
- **Error Handling**: Skip publications without denomination; graceful handling of missing dates

---

### Wave 2: Economy (GDP + BDM Indicators)

**File**: `scripts/ingest-economie.ts`

- **Sources**:
  1. **GDP**: data.gouv.fr CSV
     - `https://www.data.gouv.fr/fr/datasets/r/cd2ac200-0130-459e-809f-843f46e20d28`
  2. **BDM (Bank of Macroeconomic Data)**: INSEE SDMX
     - Base: `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/`
     - 15 series (unemployment, enterprise creation, inflation, SMIC, housing, debt, etc.)
- **Prisma Models**: `Indicateur`, `Observation`
- **Idempotency**: Upsert on `(indicateurId, periode)` composite key
- **Transformations**:
  - Parse French decimal separators (comma -> dot)
  - Create/update `Indicateur` metadata (code, name, domain, unit, frequency)
  - Parse SDMX XML response using custom parser
  - Keep last N observations per series (e.g., 80 for quarterly, 120 for monthly)
  - Dimension filtering for employment/housing (CVS correction, ensemble aggregations)
- **Volume**: 1 GDP indicator (~75 annual obs), 15 BDM series (~2,000+ total observations)
- **Rate Limiting**: None; INSEE BDM has no rate limits but responses are small
- **Failure Mode**: Missing BDM series return 404 gracefully (logged as warn)

**BDM Series Ingested (13 total)**:
- Unemployment rate (quarterly, CVS-adjusted)
- Unemployment count (quarterly, CVS-adjusted)
- Enterprise creation (monthly, CVS-adjusted)
- Inflation — overall IPC (monthly)
- Inflation — food products (monthly)
- Inflation — energy (monthly)
- SMIC hourly index (annual, base 100 — NOT euro value)
- Housing permits authorized (monthly)
- Housing starts (monthly)
- Public debt (annual) — BDM `001694258`, unit `centaines_millions_eur` (Session 39 fix: was incorrectly labeled `pourcent`, values are raw debt ~22K = 2,216 Md €, NOT percentages)
- Interest expense on public debt (annual, milliards_eur)
- Public expenditure (annual) — BDM `001710399`, unit `nombre` (raw BDM values, unit unclear)
- Salaried employment total (quarterly)
- Temporary employment (quarterly)

---

### Wave 3: Museums (Ministry of Culture)

**File**: `scripts/ingest-musees.ts`

- **Source**: Tabular API
  - `https://tabular-api.data.gouv.fr/api/resources/7708e380-e7f8-4b56-936a-5d2a262d852d/data/`
- **Prisma Models**: `Musee`, `FrequentationMusee`
- **Idempotency**:
  - `Musee`: Upsert on `id` (IDMuseofile)
  - `FrequentationMusee`: Upsert on `(museeId, annee)` composite
- **Transformations**:
  - Resolve commune code -> department code
  - Validate FKs to Commune/Departement before setting
  - Extract year from annual data
  - Paginate through Tabular API (12,292 rows, ~62 pages)
- **Volume**: ~6,400 unique museums, ~12,292 attendance rows (multiple years per museum)
- **Deduplication**: Track seen museums to avoid re-upserts on same batch

---

### Wave 3: Monuments (Ministry of Culture)

**File**: `scripts/ingest-monuments.ts`

- **Source**: Tabular API
  - `https://tabular-api.data.gouv.fr/api/resources/3a52af4a-f9da-4dcc-8110-b07774dfb3bc/data/`
- **Prisma Model**: `Monument`
- **Idempotency**: Upsert on `id` (Reference code)
- **Transformations**:
  - Parse GPS coordinates: "lat, lon" -> separate fields; validate bounding box (France)
  - Resolve department code (numeric -> padded, e.g., "1" -> "01")
  - Resolve commune code (5-digit INSEE); validate FKs
  - Extract protection dates, categories (protection status, denomination)
  - Delay between API pages: 150ms (polite)
- **Volume**: ~46,700 monuments
- **Special Handling**: Coordinate validation to reject outliers; FK validation before assignment

---

### Wave 4: HATVP Interest Declarations

**File**: `scripts/ingest-declarations.ts` (parsing logic in `scripts/lib/hatvp-parser.ts`)

- **Source**: HATVP merged XML file (download with resume/retry)
  - `https://hatvp.fr/livraison/merge/declarations.xml` (~143MB)
  - Local fallback cache: `documentation/hatvp-old-context/declarations.xml`
- **Prisma Models**: `DeclarationInteret`, `ParticipationFinanciere`, `RevenuDeclaration`
- **Idempotency**: Delete-all then upsert per UUID. Child records (participations, revenus) cascade-deleted and recreated.
- **Transformations**:
  - **Download with Resume**: Supports HTTP 206 partial content; retries up to 30 times with 2s backoff
  - **XML Parsing**: Regex-based manual extraction (`extractText`, `extractBlock`, `parseAllMontants`) — NOT fast-xml-parser. Handles triple-nested `<montant>` tags via regex.
  - **Shared Parser**: `scripts/lib/hatvp-parser.ts` — all pure parsing functions extracted (Session 42). Used by both ingestion and audit scripts.
  - **Montant Parsing**: `parseMontant()` — strips spaces, commas to periods, parseFloat. Returns null for NaN.
  - **Date Parsing**: `parseFrenchDate()` — handles DD/MM/YYYY HH:MM:SS, DD/MM/YYYY, MM/YYYY formats
  - **Revenue Grouping**: `totalRevenus` = sum of latest-year montant per `type|description|employeur` group
  - **Participation Totals**: `totalParticipations` = sum of all `evaluation` fields
- **Volume**: 12,756 declarations (1,973 deputy/senator), 13,230 participations, 474,601 revenus. Total: ~500K rows.
- **Audit Script** (Session 42): `pnpm audit:declarations` — 3-phase read-only verification (XML vs DB, internal consistency, cross-system). Produces JSON report at `data/audit-declarations-{date}.json`. Session 42 result: **1,973/1,973 perfect matches** against fresh HATVP XML.
- **Special Handling**:
  - HATVP server flakiness -> resume from last byte on retry
  - Profile queries use `mode: "insensitive" as const` for nom/prenom matching on ALL routes (Session 42 fix — was missing on senator routes + `/gouvernance/deputes/`)
  - As of early 2026: Government declarations marked "publication a venir" (not in XML yet)

---

### Wave 5a: Parliamentary Bodies (Organes)

**File**: `scripts/ingest-organes.ts`

- **Source**: Local JSON files (cached from AN open data)
  - `documentation/hatvp-old-context/an-data/json/organe/` (~7,137 files)
- **Prisma Model**: `Organe`
- **Idempotency**: Upsert on `id` (uid from JSON)
- **Transformations**:
  - Extract: codeType, libelle, libelleAbrege, legislature, dateDebut/dateFin, couleur
  - Parse dates safely (ISO string -> Date)
  - Parse legislature as integer
- **Volume**: ~7,137 organes
- **Critical**: Must precede scrutins ingestion (FK dependency)

---

### Wave 5b: Parliamentary Votes (Scrutins)

**File**: `scripts/ingest-scrutins.ts`

- **Source**: Local JSON files (cached from AN open data)
  - `documentation/hatvp-old-context/scrutins/json/` (~5,831 files as of Mar 2026)
  - To update: download latest AN scrutin JSON archive, extract into this folder, re-run `pnpm ingest:scrutins`
- **Prisma Models**: `Scrutin`, `GroupeVote`, `VoteRecord`
- **Idempotency**:
  - `Scrutin`: Upsert on `id` (uid)
  - `GroupeVote`, `VoteRecord`: Delete then insert (child records)
- **Transformations**:
  - Parse vote metadata: date, type, sort (result code), counts (pour/contre/abstentions/nonVotants)
  - Per-group breakdowns: create GroupeVote (only if Organe exists)
  - Individual votes: collect and create VoteRecord (only if Deputy exists)
  - Normalize single-item-or-array JSON structures to arrays
  - Parse counts safely (handle nulls, default to 0)
- **Volume**: ~5,831 scrutins, ~973K individual vote records (Oct 2024 – Mar 2026)
- **Batch Processing**: 50 files per batch for memory efficiency
- **FK Validation**: Pre-load valid Deputy/Organe IDs; skip records with missing FKs

---

### Wave 5b: Recusal Declarations (Deports)

**File**: `scripts/ingest-deports.ts`

- **Source**: Local JSON files
  - `documentation/hatvp-old-context/an-data/json/deport/` (~33 files)
- **Prisma Model**: `Deport`
- **Idempotency**: Upsert on `id` (uid)
- **Transformations**:
  - Link to Deputy (FK validation)
  - Extract: legislature, portee (scope), instance (body), cible (target), explication
- **Volume**: ~33 deports (low volume)

---

### Wave 5c: Tag Scrutins by Policy Domain

**File**: `scripts/tag-scrutins.ts`

- **Source**: Scrutin titles/descriptions + keyword mapping
- **Prisma Model**: `ScrutinTag` (relation table)
- **Idempotency**: Delete then insert on all tags
- **Transformations**:
  - Keyword matcher: 1,000+ policy keywords organized by domain (e.g., "defense", "immigration", "health")
  - Case-insensitive, accent-insensitive matching against scrutin `titre` + `objet`
  - Multi-tag per scrutin (many domains may be relevant)
  - Domain buckets: defense, justice, healthcare, environment, economy, employment, etc.
- **Volume**: ~5,831 scrutins, typically 2-5 tags per scrutin
- **Dependency**: Must run after scrutins ingestion; must run before computeConflicts

---

### Wave 5d: Compute Conflict Signals

**File**: `scripts/compute-conflicts.ts`

- **Source**: Derived from `DeclarationInteret` + `VoteRecord` + `ScrutinTag`
- **Prisma Model**: `ConflictSignal` (temporary staging table)
- **Idempotency**: Delete then insert all signals
- **Algorithm**:
  - For each deputy with declarations (interests)
  - Find votes on scrutins tagged with domain keywords matching declared interests
  - Flag as conflict if vote is FOR and declared against; AGAINST and declared for
  - Compute conflict score, severity, recommendation
  - Store in staging table for UI review
- **Volume**: ~100-500 signals (varies by parliament composition)
- **Dependencies**: Requires completed scrutins + declarations + tags

---

### Wave 6: Photo URLs

**File**: `scripts/ingest-photos.ts`

- **Source**: Official AN/Senat endpoints + local file copies
  - Deputies: `https://www.assemblee-nationale.fr/dyn/deputes/{id}/image`
  - Senators: `https://www.senat.fr/senimg/senateur{id}.jpg`
  - Ministers: Local files from `documentation/HATVP-data/backend/public/government/`
- **Prisma Model**: `Depute`, `Senateur` (photoUrl field)
- **Idempotency**: Only update records with null photoUrl
- **Transformations**:
  - Batch update deputy photo URLs (500 at a time)
  - Update senator photo URLs
  - Copy minister photos to `public/photos/ministres/` (if source directory exists)
- **Volume**: Depends on how many deputies/senators already have photoUrl set
- **No Network Calls**: Photos are set to official URLs; not fetched/validated during ingest

---

### Wave 7: RNE Elected Officials

**File**: `scripts/ingest-elus.ts` (requires `NODE_OPTIONS=--max-old-space-size=8192`)

- **Source**: 10 CSV files from data.gouv.fr static
  - Maires, Conseillers municipaux, Conseillers communautaires, etc.
  - All from: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/...`
- **Prisma Model**: `Elu`
- **Idempotency**: Upsert on (typeMandat, codeDepartement, codeCommune, nom, prenom) composite
- **Transformations**:
  - Column name variations across files (use helper to find known variants)
  - Parse dates, CSP codes, department/commune codes
  - Validate FKs to Departement/Commune; skip if missing
  - Map typeMandat enum (maire, conseiller_municipal, etc.)
- **Volume**: ~640,000 elected officials across 10 types
- **Memory**: Requires 8GB heap due to large batch processing
- **Batch Size**: 500 rows

**RNE CSV Endpoints (10 mandate types)**:
- Maires: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-104211/elus-maires-mai.csv`
- Conseillers municipaux: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103336/elus-conseillers-municipaux-cm.csv`
- Conseillers communautaires: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103622/elus-conseillers-communautaires-epci.csv`
- Conseillers departementaux: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103735/elus-conseillers-departementaux-cd.csv`
- Conseillers regionaux: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103814/elus-conseillers-regionaux-cr.csv`
- Conseillers d'arrondissement: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103208/elus-conseillers-darrondissements-ca.csv`
- Membres d'assemblee: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103847/elus-membres-dune-assemblee-ma.csv`
- Representants Parlement Europeen: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103935/elus-representants-parlement-europeen-rpe.csv`
- Conseillers francais de l'etranger: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-105715/elus-conseillers-des-francais-de-letranger-cons.csv`
- Assemblee francaise de l'etranger: `https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-105746/elus-assemblee-des-francais-de-letranger-afe.csv`

---

### Wave 7: 2024 Legislative Election Results

**File**: `scripts/ingest-elections.ts`

- **Source**: data.gouv.fr static CSV (two tours)
  - Tour 1: `https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-1er-tour/20240710-171413/resultats-definitifs-par-circonscriptions-legislatives.csv`
  - Tour 2: `https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-2nd-tour/20240710-170728/resultats-definitifs-par-circonscription.csv`
- **Prisma Models**: `ElectionLegislative`, `CandidatLegislatif`
- **Idempotency**: Delete all records for (annee=2024, tour) then insert
- **Transformations**:
  - Parse percentages (French format: comma decimal, % suffix)
  - Normalize department codes (pad single digits: "1" -> "01", uppercase Corsica)
  - Extract 2-digit circo number from full circo code
  - Parse wide-format candidate columns (Nom candidat 1..19 for tour 1, 1..4 for tour 2)
  - Extract votes, percentages, election status (elu/not)
  - Validate department codes exist in DB
- **Volume**: ~1,078 elections (577 tour 1, 501 tour 2), ~5,000+ candidates
- **Special Handling**: Wide format -> flatten to separate CandidatLegislatif rows

---

### Wave 7: Political Party Accounts (CNCCFP)

**File**: `scripts/ingest-partis.ts`

- **Source**: 4 annual CNCCFP CSV files (2021-2024)
  - `https://static.data.gouv.fr/resources/.../comptes-partis-exercice-{year}.csv`
- **Prisma Model**: `ComptePolitique`
- **Idempotency**: Delete then insert all records
- **Transformations**:
  - Extract 160+ accounting columns (revenues, expenses, loans, cash)
  - Sum multiple loan types (credit, personnes physiques taux preferentiel, autres, partis)
  - Calculate totals from subcategories where needed
  - Parse amounts with French separators (space for thousands, comma for decimal)
  - Map party code (CNCCFP) -> party name
  - Compute balances (result = receipts - expenses)
- **Volume**: ~2,000-2,500 party-year combinations
- **Schema**: Requires many financial fields (160+)

**CNCCFP Endpoints (4 years)**:
- 2024: `https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-110641/comptes-partis-exercice-2024.csv`
- 2023: `https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-120352/comptes-partis-exercice-2023.csv`
- 2022: `https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-121141/comptes-partis-exercice-2022.csv`
- 2021: `https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-151846/comptes-partis-exercice-2021.csv`

---

### Wave 8: INSEE Local Statistics (Melodi API)

**File**: `scripts/ingest-insee-local.ts`

- **Source**: INSEE Melodi API (no API key required, 30 req/min limit)
  - Base: `https://api.insee.fr/melodi/data/`
  - 5 datasets:
    1. **FILOSOFI 2021**: Median income, poverty, deciles (D1/D9)
       - Dataset: `DS_FILOSOFI_CC`
       - Measures: MED_SL, PR_MD60, D1_SL, D9_SL, IR_D9_D1_SL
    2. **Recensement 2022 — Population**: By age groups
       - Dataset: `DS_RP_POPULATION_PRINC`
       - Age codes: _T, Y_GE65, Y_LT20, Y20T64
    3. **Recensement 2022 — Employment**: Active population, employment rates
       - Dataset: `DS_RP_EMPLOI_LR_PRINC`
    4. **Recensement 2022 — Housing**: Dwelling stock, vacancy, secondary homes
       - Dataset: `DS_RP_LOGEMENT_PRINC`
       - OCS codes: _T, DW_MAIN, DW_VAC, DW_SEC_DW_OCC
    5. **Recensement 2022 — Education**: Diploma levels
       - Dataset: `DS_RP_DIPLOMES_PRINC`
       - EDUC codes: 001T100_RP, 350T351_RP, 500_RP, 600_RP, 700_RP
- **Prisma Model**: `StatLocale`
- **Idempotency**: Upsert on `(source, indicateur, annee, geoType, geoCode)` composite
- **Transformations**:
  - CSV format: semicolon-delimited, BOM-prefixed
  - Parse observations: convert "s" (secret) and "nd" (no data) to null
  - Fetch 5 datasets per department in parallel (101 depts x 5 datasets = 505 calls)
  - Calculate derived indicators:
    - Housing vacancy rate = vacant / total
    - Secondary home rate = secondary / total
    - Density per capita = (values / population)
- **Volume**: ~1,644 rows per run (101 depts x 5 datasets, ~3-5 measures per dataset)
- **Rate Limiting**: 2,100ms between requests (30 req/min)
- **Failure Mode**: Returns empty array on dept failure; safe for re-run
- **Retry Logic**: 3 attempts per fetch with exponential backoff

**Output Indicators**:
- `FILOSOFI_MEDIAN_INCOME`, `FILOSOFI_POVERTY_RATE`, `FILOSOFI_D1`, `FILOSOFI_D9`, `FILOSOFI_GINI`
- `POP_TOTAL`, `POP_BY_AGE_BANDS`
- `EMPLOI_RATE`, `UNEMPLOYMENT_RATE`, `EMPLOYMENT_BY_SECTOR`
- `HOUSING_TOTAL`, `HOUSING_VACANCY_RATE`, `HOUSING_SECONDARY_RATE`
- `EDUC_NO_DIPLOMA`, `EDUC_BAC_PLUS`, `EDUC_HIGHER_EDUC`

---

### Wave 8: Local Government Finances (OFGL)

**File**: `scripts/ingest-budgets.ts`

- **Source**: OFGL (Opendatasoft API)
  - Base: `https://data.ofgl.fr/api/explore/v2.1/catalog/datasets/`
  - Departments: `ofgl-base-departements-consolidee`
  - Communes: `ofgl-base-communes-consolidee`
- **Prisma Models**: `BudgetLocal`
- **Idempotency**: Delete then insert per entity type
- **Transformations**:
  - CSV format: semicolon-delimited, long (one row per entity/year/aggregate)
  - Pivot long -> wide: aggregate types (Depenses totales, Recettes totales, Frais de personnel, Encours de dette)
  - Fallback aggregates if primary not present:
    - "Depenses totales hors remb" -> totalDepenses
    - "Recettes totales hors emprunts" -> totalRecettes
  - Compute derived fields:
    - depenseParHab = totalDepenses / population
    - detteParHab = encoursDette / population
    - resultatComptable = totalRecettes - totalDepenses
  - Join with population from INSEE StatLocale (POP_TOTAL) for per-capita calculation
- **Volume**: ~2,300+ communes (2022-2023), ~96 departments (2020-2023)
- **Years**: Departments trended 2020-2023; communes 2022-2023 only

---

### Wave 9: Crime Statistics (SSMSI)

**File**: `scripts/ingest-criminalite.ts`

- **Source**: SSMSI (Service Statistique Ministeriel de la Securite Interieure) static CSV
  - `https://static.data.gouv.fr/resources/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales/20260129-160318/donnee-dep-data.gouv-2025-geographie2025-produit-le2026-01-22.csv`
- **Prisma Model**: `StatCriminalite`
- **Idempotency**: Upsert on `(departementCode, indicateur, annee)` composite
- **Transformations**:
  - CSV format: semicolon-delimited, French decimal (comma)
  - Map SSMSI indicateur labels -> 6 internal codes:
    - Coups et blessures volontaires -> coups_blessures
    - Vols sans violence -> vols_sans_violence
    - Cambriolages -> cambriolages
    - Violences sexuelles -> violences_sexuelles
    - Escroqueries -> escroqueries
    - Destructions/degradations -> destructions
    - Homicides/tentatives -> homicides/tentatives_homicide
  - Parse counts (nombre) and rates (taux_pour_mille)
  - Pad department codes to standard format ("1" -> "01")
  - Validate department code exists in DB
- **Volume**: ~2,000+ records (6 crime types x 96 depts x multiple years)
- **Frequency**: ~10 years of data (2016+)

---

### Wave 9: Medical Professional Density (DREES)

**File**: `scripts/ingest-medecins.ts`

- **Source**: DREES Opendatasoft API
  - `https://data.drees.solidarites-sante.gouv.fr/api/explore/v2.1/catalog/datasets/la-demographie-des-professionnels-de-sante-depuis-2012/records`
- **Prisma Model**: `DensiteMedicale`
- **Idempotency**: Upsert on `(departementCode, specialite, annee)` composite
- **Transformations**:
  - Query filters: niveaugeo="Departement", genre="Ensemble", age="Ensemble", mode_exercice="Ensemble"
  - Map profession labels -> 6 specialite codes: MG (generaliste), SPEC (specialiste), INFIRMIER, DENTISTE, PHARMACIEN, KINESITHERAPEUTE
  - Extract active count (nb_actifs)
  - Join with StatLocale POP_TOTAL to compute pour10k (density per 10k population)
  - Validate department code exists in DB
- **Volume**: ~2,000-3,000 records (6 specialties x 96+ depts x 12+ years)
- **Pagination**: 100 records per page, total_count from first response

---

### Phase 9: AGORA Lobby Actions (Ministry-Level)

**File**: `scripts/ingest-agora.ts`

- **Source**: HATVP AGORA JSON (same as lobbyist source, different extraction)
- **Prisma Model**: `ActionLobby`
- **Idempotency**: Delete then insert **within a single `prisma.$transaction()`** (Session 41). Records accumulate in memory first, then atomic delete+insert prevents partial data loss on failure. 2-minute timeout for large datasets.
- **Transformations**:
  - Extract actions targeting specific ministries via `ministereCode`
  - 20 ministry codes mapped to current government structure
  - Link lobbying orgs to ministry portfolios (NOT directly to PersonnalitePublique)
- **Volume**: ~131,842 ActionLobby rows
- **Key**: Join via `MandatGouvernemental.ministereCode` -> `ActionLobby.ministereCode`

---

### Phase 9: Government Career Timelines

**File**: `scripts/generate-carriere.ts`

- **Prisma Models**: `EntreeCarriere`
- **Logic**: Sources = `MandatGouvernemental` (mandate dates) + `Depute`/`Senateur` (parliamentary tenure)
- **Transform**: NOT HATVP ACTIVITE_ANTERIEURE (financial disclosure, not career) — removed as it produced garbage entries
- **Purpose**: Build career timeline visualization for gouvernement profiles

---

### Phase 9: Research Output Ingestion

**File**: `scripts/ingest-research-output.ts`

- **Source**: `data/research-output/*.json` (38 files from parallel research agents)
- **Prisma Models**: `PersonnalitePublique`, `EntreeCarriere`, `EvenementJudiciaire`
- **Volume**: 474 career entries, 14 judicial events across 44 government members
- **Transformations**:
  - Parse JSON: name, title, dates, organization, source
  - Link to PersonnalitePublique by normalized name match
  - Create EntreeCarriere rows with source (HATVP, PRESSE, MANUELLE), URL, date
  - Create EvenementJudiciaire rows with type, nature, jurisdiction, status
  - Compute `verifie` boolean for judicial events (CRITICAL: only display if true)

---

### Seed Scripts

**Media Ownership** (`scripts/seed-medias.ts`):
- Prisma Models: `GroupeMedia`, `MediaProprietaire`, `ParticipationMedia`, `Filiale`
- Source: Hardcoded seed data (10 groups, 10 owners, 72 filiales)
- Idempotency: Delete all, then seed (one-time seed, not incremental)

**Parliamentary Laws** (`scripts/seed-lois.ts`):
- Prisma Models: `LoiParlementaire`, `ScrutinLoi`
- Source: Hardcoded seed (19 laws, 2,589 scrutin links)
- Idempotency: Delete all, then seed

**Government Profiles** (`scripts/seed-gouvernement.ts`):
- Prisma Models: `PersonnalitePublique`, `MandatGouvernemental`
- Source: `scripts/data/gouvernement-{lecornu,borne,attal,barnier}.ts`
- Volume: 44 PersonnalitePublique total (37 Lecornu II + historical)
- **Formation data reconciled** (Session 41): All 20 minister `formation` fields verified against `data/research-output/*.json` (Tier 1-2 press sources). 20 errors corrected, including 3 wholly fabricated entries (Barbut, Ferrari, Papin). `LECORNU_RESHUFFLE_DEPARTURES` updated to include `charlotte-parmentier-lecocq`.

---

### Wave 10: Search Index Refresh

**File**: `scripts/refresh-search.ts`

- **SQL**: Drops and recreates `search_index` materialized view + GIN/B-tree indexes (Session 41 — was previously just `REFRESH MATERIALIZED VIEW`)
- **Timing**: Final step after all data ingested
- **Purpose**: Full-text search view combining deputy names, senator names, scrutin titles, lobby org names, commune names, party names
- **URLs**: Canonical `/profils/*` paths for deputies, senators, lobbyists, parties. Scrutins at `/votes/scrutins/[id]` (updated Session 43). Communes at `/territoire/commune/[code]`.
- **Must run after**: Any schema change affecting search entities, or after Phase 6 route cleanup

---

## 4. Shared Utility Libraries

### `scripts/lib/api-client.ts`

- `fetchAllPages(resourceId, options)`: Async generator for Tabular API pagination
- `fetchAllRows(resourceId, options)`: Collect all pages into flat array
- `fetchText(url, encoding?)`: Fetch raw text (handles ISO-8859-1 for French CSVs)
- `fetchJson<T>(url)`: Fetch JSON
- `fetchGzip(url)`: Decompress gzip response
- **Tabular API Details**: Base `https://tabular-api.data.gouv.fr/api/resources`, page size 200, 100ms delay between pages

### `scripts/lib/insee-client.ts`

- `fetchFilosofiDep(depCode)`: FILOSOFI 2021 (income, poverty)
- `fetchPopulationDep(depCode)`: Recensement 2022 population by age
- `fetchEmploiDep(depCode)`: Employment rates
- `fetchLogementDep(depCode)`: Housing stock + vacancy/secondary rates
- `fetchEducationDep(depCode)`: Education levels by diploma
- **Rate Limiting**: 2,100ms between requests (30 req/min API limit)
- **Retry Logic**: 3 attempts per fetch with 5s backoff; 10s on HTTP 429

### `scripts/lib/csv-parser.ts`

- `parseCsv<T>(text, options?)`: PapaParse wrapper (configurable delimiter, handle quoted fields)
- `parseDateSafe(s)`: Multiple date formats (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, partial)
- `parseIntSafe(s)`: Null if non-numeric or undefined
- `parseFloatSafe(s)`: Handle French decimal (comma -> dot)
- `parseBoolSafe(s)`: Boolean coercion
- `trimText(s)`: Null-safe trim

### `scripts/lib/departement-lookup.ts`

- `buildDepartementLookup()`: Fetch all departments from DB; build name -> code map
- `resolveDepartementCode(lookup, name)`: Fuzzy name match to code
- `departementCodeFromCommune(communeCode)`: Extract 2-digit from commune code

### `scripts/lib/ingestion-log.ts`

- `logIngestion(source, fn)`: Wrapper that times execution, logs to DB
  - Creates `IngestionLog` record with status, duration, row counts
- **Metadata**: Must be `Record<string, unknown>`, NOT `JSON.stringify(...)`

### `scripts/lib/sdmx-parser.ts`

- `parseSdmxResponse(xml)`: Parse INSEE BDM SDMX XML response
- `periodToDate(periodStr)`: Convert SDMX period string to JavaScript Date (quarterly, monthly, annual)

### `scripts/lib/sector-tag-map.ts`

- ~1,000+ policy keywords organized by domain buckets for scrutin tagging

---

## 5. Data Treatment: How Raw Data Becomes Transparency

### 5.1 Cross-Reference Engine (the core value proposition)

The platform doesn't just display data — it **cross-references** across domains to surface conflicts and patterns:

| Cross-Reference | How It Works |
|----------------|--------------|
| **Vote <-> Declared Interests** | `ScrutinTag` keywords match declared sector in `DeclarationInteret` -> `ConflictSignal` if deputy voted FOR legislation favoring their declared financial interest |
| **Lobby <-> Ministry** | `ActionLobby.ministereCode` joins to `MandatGouvernemental.ministereCode` — shows which orgs lobbied which minister's portfolio (indirect link, no FK to person) |
| **Lobby Domain <-> Vote Topics** | `LOBBY_DOMAIN_KEYWORDS` maps lobby domains ("sante", "fiscal") to `ScrutinTag` — shows if lobbied sectors got legislative attention |
| **Presidential Promises <-> Economic Reality** | `getBaselineObservation()` finds indicator value at election date -> `computeDelta()` against current -> promise status (tenu/partiel/non tenu) |
| **Deputy Deports** | `Deport` records = explicit conflict-of-interest recusals — displayed as transparency signal |
| **Media <-> Ownership** | `GroupeMedia` -> `Filiale` -> `MediaProprietaire` -> `ParticipationMedia` — concentration mapping |

### 5.2 Transparency Metrics Computed Per Page

#### Deputy Profiles (`/profils/deputes/[id]`, legacy: `/representants/deputes/[id]`)

**Prisma Queries:**
- `VoteRecord` (10 most recent) linked to `Scrutin` with tags
- `Deport` (recusations) — direct flag of declared conflicts of interest
- `DeclarationInteret` (by name/prenom + typeMandat) — includes `participations` and `revenus`
- `ScrutinTag` (groupBy tag) — vote topic distribution per deputy
- `ConflictSignal` — pre-computed conflict signals

**Transparency Metrics:**
1. **Conflict Detection**: Filter declarations where `totalParticipations > 0`, sum total participation amounts, cross-reference with tagged votes
2. **Vote-Interest Cross-Reference**: Build `ScrutinTag` frequency bar chart (which legislative topics voted on), display as horizontal bar with percentage relative to max topic count
3. **Deports**: Display `Deport.cibleTexte` + jurisdiction/date — explicit conflicts of interest abstentions

**Tab Structure:**
- **Activite**: Recent votes + deports timeline
- **Declarations**: `DeclarationSection` (client component) expands declarations
- **Transparence**: "Interets financiers declares" stat box, tagged vote count, deport count, `ConflictAlert` cards (sector + participation amount + related vote count), vote breakdown by legislative theme
- **Informations**: Contact, professional background

**4 participation scores**: participation (0-100), specialty (0-100), loyalty (0-100), majority (0-100)

---

#### Senator Profiles (`/profils/senateurs/[id]`, legacy: `/representants/senateurs/[id]`)

**Prisma Query:**
- `Senateur.findUnique` with `mandats` + `commissions` ordered by dateDebut desc
- `DeclarationInteret` by name/prenom + typeMandat="Senateur"

**Key Differences from Deputies:**
- Mandats + Commissions instead of participation scores
- Simpler structure (no conflict cross-reference to votes yet)
- 3-tab model: Mandats & Commissions | Declarations | Informations

---

#### Government Profiles (`/profils/[slug]`, legacy: `/gouvernement/[slug]`)

**Architecture:** Most sophisticated profile page.

**Query:**
```
PersonnalitePublique.findUnique({
  include: {
    mandats: { orderBy: { rang } },
    interets: { where: { alerteConflit: true }, take: 1 },
    _count: { interets, carriere },
    evenements: { where: { verifie: true }, select: { id } }
  }
})
```

**Conflict Detection:**
- `hasConflictAlert = personnalite.interets.length > 0` (at least one alert declaration)
- Count judicial events (only if `verifie: true` — CRITICAL RULE)

**Tabs:**
1. **Parcours** -> Career timeline from `EntreeCarriere` (HATVP + government sources)
2. **Declarations HATVP** (for non-presidents) -> `InteretsSection` component
   - Groups by rubrique (MANDAT_ELECTIF, ACTIVITE_ANTERIEURE, PARTICIPATION, etc.)
   - Conflict alerts highlighted (amber border if `alerteConflit: true`)
   - Links to HATVP source
3. **Mandats & Lobbying** -> `MandatsSection` + `LobbySection`
   - **LobbySection**: Queries `ActionLobby` by `ministereCode`
   - Groups by representantNom (top 5 orgs)
   - Groups domains (comma-separated) and counts
   - Shows year range, top domains
4. **Affaires judiciaires** (if verifie count > 0) -> `JudiciaireSection`
   - Only events where `verifie = true`
   - Severity coloring (red=condamnation, amber=mise en examen, gray=enquete)
   - Status badges (EN_COURS, CLOS, APPEL_EN_COURS)
   - CRITICAL: Legal disclaimer that "mise en examen != condamnation"
5. **Activite parlementaire** (if deputeId or senateurId) -> `ParliamentarySection`
   - Redirects to this profile if person also in Depute/Senateur tables

**Lobby-Interest Cross-Reference (LobbySection):**
- `ActionLobby.findMany` filtered by `ministereCode` (minister's code from mandate)
- NOT a direct FK to PersonnalitePublique — join through mandate
- Top 5 organizations lobbying this ministry
- Domains split and counted (e.g., "Fiscalite, Budgets" -> 1 fiscalite, 1 budget)

---

#### President Profile (`/profils/emmanuel-macron`, redirect from `/president`)

**Super-rich transparency profile.** Queries:
- `DeclarationInteret` (Macron by name search — multiple mandates)
- `Indicateur` (PIB, CHOMAGE, IPC, DETTE, SMIC) with all observations ascending
- `ActionLobbyiste` groupBy domaine (top 15)
- `ActionLobbyiste` filtered to curated lobbyists (POWER_LOBBYISTS, CONSULTING_LOBBYISTS)
- `ScrutinTag` groupBy tag counts

**Transparency Metrics:**

1. **Promise Evidence Tracking:**
   - `getPromesseSummary(electionYear)` from `/data/president-macron.ts` (hard-coded promises)
   - For each promise with `indicateurCode`:
     - Get baseline observation at `ELECTION_DATES[electionYear]` (2017-05-07 or 2022-04-24)
     - Get latest observation
     - Compute `computeDelta(baseline, current)` -> delta value + direction (up/down/flat) + formatted string
     - Compare to promise target
   - Example: Promise "Reduire le chomage de 2%" -> baseline 9.5% (2017) -> current 7.4% (2024) -> delta -2.1% -> status "TENU"

2. **Economic Baseline Comparison:**
   - Unemployment: baseline -> latest delta
   - GDP: compute growth rate delta
   - Debt/GDP: compute ratio change
   - SMIC: compute wage change
   - Transparency goal: Hold president accountable to economic pledges

3. **Lobbying Density Analysis:**
   - Group all actions by domain (top 15)
   - Consolidate curated lobbyists (e.g., all Mutualite branches -> single count)
   - Compute action counts per curated power lobbyist
   - Transparency goal: Show wealthy interests' access to executive

**Cross-Reference: Lobby Domain -> Vote Topic:**
- LOBBY_DOMAIN_KEYWORDS maps lobby domain text to ScrutinTag (e.g., "sante", "pharma" -> tag "sante")
- Compute vote counts per tag
- Purpose: Show if lobbied sectors had legislative attention

**Tabs (president-specific):**
1. **Promesses** -> Promise status grid (tenu/partiel/non tenu) + evidence
2. **Bilan economique** -> Timeline charts + delta comparisons
3. **Lobbying & Agenda** -> Top curated lobbyists + domains
4. **Declarations HATVP** -> Uses `DeclarationInteret` (not `InteretDeclare`)
5. **Affaires judiciaires** (if events exist) -> Judicial events

---

#### Vote Pages (`/votes`, `/votes/par-sujet/[tag]`, `/votes/mon-depute`)

**Votes Overview (`/votes`):**
- `ScrutinTag` groupBy tag + count
- `Scrutin` count + count where sortCode contains "adopt"
- 8 most recent scrutins + tags
- 4 top `LoiParlementaire` by rang with final vote scrutin
- **Adoption rate** = (adopted count / total count) x 100

**Vote Detail (`/votes/scrutins/[id]`):**
- Individual votes grouped by position (pour, contre, abstention, nonVotant)
- Per political group: majority position badge, stacked bar chart (pour%, contre%, abst%), raw counts
- Individual deputy vote list, click to profile

**Mon Depute (`/votes/mon-depute`):**
- Deputy search by name
- Position summary: 4-stat grid (pour%, contre%, abst%, non-votant%)
- Tag breakdown: Horizontal bars showing vote distribution by legislative theme
- Recent votes: 20 most recent with vote badge + date + tags

---

#### Thematic Dossiers (killed in Session 39 — redirected to `/signaux` or `/territoire`; surviving: `/dossiers/medias`, `/dossiers/financement-politique`)

**Parallel Queries:**
- Economic indicators: PIB, CHOMAGE, IPC, SMIC from `Indicateur`
- Votes: Scrutins tagged with relevant topic (10 recent)
- Lobbying: Count of `ActionLobbyiste` with matching domaine
- Lobbyists: Count and top 5 orgs by action count
- Territory: `StatLocale` (MEDIAN_INCOME by dept, top 10)
- Map data: France choropleth data via `getFranceMapData()`

**Transparency Metrics:**
1. **Sparkline computation**: Reverse observations (oldest -> newest), extract valeur arrays for mini charts
2. **Latest value extraction**: Most recent observation per indicator
3. **Lobbying density**: Count topic-related actions + orgs, identifies top 5 lobbyists by action count
4. **Ranking table**: Sort depts by metric descending, show rank, dept name, value
5. **Topic votes integration**: Top 10 scrutins on topic, group by political group

**Sections:**
1. Les chiffres cles -> 4 IndicatorCard components (latest values + sparklines)
2. Revenus par departement -> RankingTable (top/bottom 10 depts)
3. Votes par theme -> TopicVoteList (recent scrutins with per-group breakdowns)
4. Lobbying & Agenda -> LobbyingDensity (org counts + domains)
5. Vue interactive -> FranceMap with choropleth

---

#### Territory Pages (`/territoire`, `/territoire/[code]`)

**Queries:**
- `Region` with departements + counts (communes, deputes, senateurs, monuments, musees)
- `getFranceMapData()` -> parallel StatLocale queries for 6 indicators

**Presentation:**
1. Interactive choropleth map (FranceMap) — 7-stop color palette, 6 switchable indicators, click to navigate
2. Regions & Departments table — grouped by region, per-dept: deputy count, senator count, monument count
3. Per-department detail: income, poverty, unemployment, crime, medical density, budget

---

#### Gouvernement Index (`/profils/ministres`, legacy: `/gouvernement`)

**Visual hierarchy: 5-tier organigramme (SIGINT redesign)**:

```
T1 (Amber)  -- President -- 1 PresidentCard
    | StemNode (relay)
T2 (Teal)   -- Premier ministre -- 1 PremierMinistreCard
    | SpreadConnector
T3 (Blue)   -- Ministres -- 3-col grid (MinistreCard)
    |
T4 (Violet) -- Ministres delegues -- 4-col grid (DelegueCard)
    |
T5 (Rose)   -- Secretaires d'Etat -- 4-col grid (SecretaireCard)
```

Components: `Brackets` (4-corner reticle), `TierLabel` (classification badge headers), `StemNode` (relay node amber/teal), `SpreadConnector`, card components per tier. Sort by `rang` (protocol order).

---

## 6. Core Data Transformations

### Format Utilities (`src/lib/format.ts`)

```typescript
fmt(n)          // "1 234" (fr-FR locale)
fmtEuro(n)      // "1 234 EUR"
fmtPct(n)       // "12,5 %"
fmtDate(d)      // "25 mars 2026"
fmtShortDate(d) // "mar 2026"
fmtCompact(n)   // "1,2M" or "45k"
slugify(s)      // "bruno-le-maire" (NFD normalize + lowercase)
```

### Presidential Utilities (`src/lib/president-utils.ts`)

```typescript
getBaselineObservation(observations, targetDate)
// Find observation closest to targetDate
// Used for 2017 vs 2022 election year comparison

computeDelta(baseline, current, decimals)
// Returns { delta, direction: "up"|"down"|"flat", formatted: "+1,2" }
// Threshold: +/-0.05 for direction (prevents floating-point jitter)
```

### Conflict Detection Pattern

**Three-layer detection:**
1. **Direct declaration**: `DeclarationInteret` with `totalParticipations > 0`
2. **Vote-interest cross-reference**: Match `ScrutinTag` topics to declared sectors
3. **Pre-computed signals**: `ConflictSignal` table with `voteCount` + `votePour/voteContre`

**Presentation rule:** Only display on dedicated tab or `/signaux` feed (not homepage hero). Amber border + warning icon.

### Judicial Events: Verification Gate

**CRITICAL RULE:**
```typescript
// Only display events where verifie = true
// Unverified events must never appear on public pages.
const events = await prisma.evenementJudiciaire.findMany({
  where: { personnaliteId, verifie: true }
})
```

**Severity coloring:**
- `CONDAMNATION` -> high (red)
- `MISE_EN_EXAMEN` -> medium (amber)
- `ENQUETE_PRELIMINAIRE` -> low (gray)

**Legal disclaimer (mandatory):**
> "Les procedures suivantes sont issues de sources de presse Tier 1-2 et verifiees manuellement. Mise en examen ne vaut pas condamnation."

### Declaration Expansion (Client-Side)

**DeclarationSection component (`src/components/declaration-section.tsx`):**
- Accordion pattern: each declaration is expandable
- Revenue aggregation: group by (description, employeur) -> collect years + montants
- Activity card rendering: colored left border per revenue type (teal=mandat, blue=prof, purple=conseil, amber=dirigeant)
- Participation financieres: list with evaluation + remuneration fields
- State management: `useState(false)` for expansion toggle (client-side, no network calls)

---

## 7. Lobbying Integration Patterns

### Direct Link (Government Ministers)

```
Step 1: Get minister's current mandate
  const mandate = minister.mandats.find(m => m.dateFin === null)

Step 2: Use ministereCode as join key
  const actions = await prisma.actionLobby.findMany({
    where: { ministereCode: mandate?.ministereCode }
  })
```

**No FK to PersonnalitePublique** — intentional. Supports:
- Lobbying persists across minister changes
- Multiple ministries targeted by same action
- Clean separation of lobbying registry (AGORA) from government roster

### Domain Matching (President Profile)

```typescript
LOBBY_DOMAIN_KEYWORDS = [
  { keywords: ["sante", "pharma"], tag: "sante" },
  { keywords: ["fiscal", "taxe"], tag: "fiscalite" },
  // ... 8 more
]

// Match lobby domain to vote topic
function matchDomainToTag(domaine: string) {
  for (const m of LOBBY_DOMAIN_KEYWORDS) {
    if (m.keywords.some(kw => domaine.includes(kw)))
      return { tag: m.tag, label: m.label }
  }
  return null
}
```

**Use case:** Show if Macron voted on topics lobbied to him (e.g., "energy" lobby -> ecology votes).

---

## 8. Key Query Patterns

### Pattern 1: Count-Based Filtering

```typescript
// Deputy's conflict declarations count
const conflictDeclCount = declarations.filter(d => (d.totalParticipations ?? 0) > 0).length
// Then show in tab badge: <Badge count={conflictDeclCount} />
```

### Pattern 2: Parallel Aggregation

```typescript
const [votes, deports, declarations, scrutinTagCounts, taggedVoteCount, conflictSignals] =
  await Promise.all([...])
```

### Pattern 3: Ordered + Limited Fetch

```typescript
// Most recent declaration (take 1, order desc)
const mostRecent = await prisma.declarationInteret.findMany({
  where: { nom, prenom, typeMandat },
  orderBy: { dateDepot: "desc" },
  take: 1
})
```

### Pattern 4: GroupBy for Frequency Distribution

```typescript
// Vote frequency per legislative theme
prisma.scrutinTag.groupBy({
  by: ["tag"],
  where: { scrutin: { votes: { some: { deputeId } } } },
  _count: { tag: true },
  orderBy: { _count: { tag: "desc" } }
})
```

---

## 9. Data Integrity Guardrails

| Guardrail | Implementation |
|-----------|---------------|
| **Judicial verification gate** | `EvenementJudiciaire.verifie` MUST be `true` before display — unverified events never rendered |
| **Legal disclaimer** | "Mise en examen ne vaut pas condamnation" — mandatory on judicial sections |
| **Source citation** | Every judicial claim requires `sourceUrl` + `sourceDate` + `sourcePrincipale` (tier 1-3 press) |
| **No synthesis** | Never combine sources without explicit citation |
| **Lobby indirection** | ActionLobby links through `ministereCode`, not person FK — prevents false attribution |
| **HATVP name normalization** | NFD decompose, remove accents/particles before matching declarant -> deputy/senator |
| **FK validation** | Every ingestion script validates FKs exist before assignment; orphans logged and skipped |
| **Idempotency** | All scripts use upsert; safe for unlimited re-runs with no duplicates |
| **Audit logging** | `IngestionLog` records every run: source, duration, row counts, errors |

---

## 10. Rate Limits & Performance

| Source | Rate Limit | Delay/Retry | Notes |
|--------|-----------|------------|-------|
| Tabular API | None | 100ms/page | 200 rows/page; pagination generator |
| INSEE Melodi | 30 req/min | 2,100ms | 101 depts x 5 datasets = 505 calls ~ 17 min |
| INSEE BDM | None | None | Small responses (~1-5KB) |
| DREES | None | None | Paginated 100/page |
| OFGL | None | None | Opendatasoft export API |
| SSMSI | None | None | Static CSV download |
| HATVP JSON (lobbyists) | None | None | ~80MB; stream parse if >100MB |
| HATVP XML (declarations) | Flaky | Resume + retry x30 | Download with HTTP 206 resume; 2s backoff |

---

## 11. Dependency Graph

```
Territories (Wave 1a)
|-- Deputes (Wave 1b)
|-- Senateurs (Wave 1b)
|-- Lobbyistes (Wave 1b)
|-- Economie (Wave 2)
|-- Musees (Wave 3)
|-- Monuments (Wave 3)
|-- Declarations (Wave 4)
|-- Organes (Wave 5a)
|-- Scrutins (Wave 5b)
|   |-- Tag Scrutins (Wave 5c)
|   |   +-- Compute Conflicts (Wave 5d)
|-- Deports (Wave 5b)
|-- Photos (Wave 6)
|-- Elus (Wave 7)
|-- Elections (Wave 7)
|-- Partis (Wave 7)
|-- INSEE Local (Wave 8)
|-- Budgets (Wave 8)
|-- Criminalite (Wave 9)
|-- Medecins (Wave 9)
+-- Search Index Refresh (Wave 10)
```

---

## 12. Summary Table: Source -> Model -> Idempotency

| Wave | Script | Source | Model(s) | Idempotency | Volume |
|------|--------|--------|----------|-------------|--------|
| 1a | ingest-territoires | INSEE COG CSV | Region, Departement, Commune | Upsert | 17+96+35K |
| 1b | ingest-deputes | Datan Tabular API | Depute | Upsert on id | ~2,400 |
| 1b | ingest-senateurs | Senat CSV | Senateur, MandatSenateur, CommissionSenateur | Upsert / Delete+Insert | ~348+1K |
| 1b | ingest-lobbyistes | HATVP JSON | Lobbyiste, ActionLobbyiste | Upsert / Delete+Insert | ~10K + 131K |
| 2 | ingest-economie | data.gouv.fr CSV + INSEE BDM | Indicateur, Observation | Upsert | ~2K obs |
| 3 | ingest-musees | Ministry Tabular API | Musee, FrequentationMusee | Upsert | ~6.4K + 12K |
| 3 | ingest-monuments | Ministry Tabular API | Monument | Upsert | ~46.7K |
| 4 | ingest-declarations | HATVP XML | Declaration, DeclarationInteret | Upsert / Delete+Insert | ~2K + 10K |
| 5a | ingest-organes | Local JSON files | Organe | Upsert | ~7.1K |
| 5b | ingest-scrutins | Local JSON files | Scrutin, GroupeVote, VoteRecord | Upsert / Delete+Insert | 5.8K + 973K |
| 5b | ingest-deports | Local JSON files | Deport | Upsert | ~33 |
| 5c | tag-scrutins | DB (scrutins) | ScrutinTag | Delete+Insert | ~10-20K tags |
| 5d | compute-conflicts | DB (declarations + scrutins + tags) | ConflictSignal | Delete+Insert | ~100-500 |
| 6 | ingest-photos | Official endpoints + local files | Depute.photoUrl, Senateur.photoUrl | Update null only | ~900 |
| 7 | ingest-elus | RNE CSV (10 files) | Elu | Upsert | ~640K |
| 7 | ingest-elections | data.gouv.fr CSV | ElectionLegislative, CandidatLegislatif | Delete+Insert | 1K + 5K |
| 7 | ingest-partis | CNCCFP CSV (4 years) | ComptePolitique | Delete+Insert | ~2.5K |
| 8 | ingest-insee-local | INSEE Melodi API | StatLocale | Upsert | ~1.6K per run |
| 8 | ingest-budgets | OFGL API | BudgetLocal | Delete+Insert | ~2.3K |
| 9 | ingest-criminalite | SSMSI CSV | StatCriminalite | Upsert | ~2K |
| 9 | ingest-medecins | DREES API | DensiteMedicale | Upsert | ~3K |
| 10 | refresh-search | Materialized view | search_index | REFRESH MV | N/A |
| P9 | ingest-agora | HATVP AGORA JSON | ActionLobby | Delete+Insert | ~131K |
| P9 | generate-carriere | DB (mandats + deputes) | EntreeCarriere | Upsert | ~500 |
| P9 | ingest-research-output | Local JSON files | EntreeCarriere, EvenementJudiciaire | Upsert | ~488 |
| S44 | analyze-vote-contradictions | DB (VoteRecord + ScrutinTag) | JSON report | Read-only | 11 results |
| S44 | analyze-lobby-exposure | DB (ActionLobby + EntreeCarriere) | JSON report | Read-only | 34 results |
| S44 | add-conflict-flags | JSON files | research-output/*.json | Update | 16 files |
| S44 | update-investigation-findings | Agent reports | research-output/*.json | Update | 8 files |
| Seed | seed-medias | Hardcoded | GroupeMedia, MediaProprietaire, Filiale | Delete+Insert | ~92 |
| Seed | seed-lois | Hardcoded | LoiParlementaire, ScrutinLoi | Delete+Insert | 19 + 2,589 |
| Seed | seed-gouvernement | Hardcoded | PersonnalitePublique, MandatGouvernemental | Upsert | ~44 + 49 |

---

## 13. Total Database Volume

Across all waves:
- **Territory**: ~35,000 communes + 101 departments + 17 regions
- **People**: ~640K elus + ~900 deputies/senators + 44 gouvernement (148 after historical seed) + ~10K lobbyists
- **Votes**: ~5,831 scrutins + ~973K vote records + ~20K tags
- **Economic**: ~2,000 observations across 15 indicators
- **Culture**: ~50K monuments, ~6K museums + ~12K attendance records
- **Finance**: ~2.5K party accounts + ~10K budgets
- **Health**: ~3K medical density records
- **Crime**: ~2K crime records
- **Declarations**: ~12K interest declarations
- **Lobbying**: ~131K lobby actions (ministry-level, AGORA) + ~10K lobbyist actions (HATVP)
- **Judicial**: 14 verified events
- **Media**: ~92 media entities (10 groups, 10 owners, 72 filiales)
- **Cross-references**: nuance-party mapping (23 codes), commission-lobbying overlap, conflict drill-down votes
- **Search**: 1 materialized view
- **Total Row Count**: **~800,000-900,000 rows** (excluding indices)

---

## 14. Local Data Files & Documentation Cache

### Local Documentation Directories

- `documentation/hatvp-old-context/`
  - `scrutins/json/` — ~5,831 scrutin JSON files (AN open data, last updated Mar 2026)
  - `an-data/json/organe/` — ~7,137 organe JSON files
  - `an-data/json/deport/` — ~33 deport JSON files
  - `declarations.xml` — ~150MB HATVP merged declarations (cached download)

- `documentation/HATVP-data/backend/public/government/`
  - Minister photos (copied to `public/photos/ministres/`)

- `data/research-output/`
  - ~38 JSON files (research agent output)
  - Profile: name, title, dates, source, URLs

---

## 15. Transparency Cross-References (Status)

### Connected (implemented)

1. **Deputy vote-interest drill-down** — `ConflictDrilldown` component on Transparence tab. When a conflict signal exists (declared financial interest + votes on related legislation), users can expand to see every individual vote: position badge, scrutin title (linked), date, result. Votes fetched by signal tag, grouped server-side. Component: `src/components/conflict-drilldown.tsx`.

2. **Senator Transparence tab** — New 4th tab on senator profiles. Financial interest stat cards (participations, declaration count) + commission-lobbying overlap: senator's commission names are matched against 6 domain patterns (affaires sociales, finances, environnement, etc.) and cross-referenced with `ActionLobbyiste` counts. Shows lobbying action volume in each matching domain.

3. **Historical governments** — Seed data for 4 governments: Borne (36 members), Attal (35), Barnier (41), Lecornu II (36). Data files: `scripts/data/gouvernement-{borne,attal,barnier,lecornu}.ts`. Refactored `seed-gouvernement.ts` processes them chronologically. `/profils/ministres` page supports `?gouvernement=borne|attal|barnier` filter + "Gouvernements precedents" selector. **Seed not yet run** — run `npx tsx scripts/seed-gouvernement.ts` then `npx tsx scripts/generate-carriere.ts`.

4. **Media <-> political connections** — `/dossiers/medias` (surviving dossier, linked from `/signaux`) surfaces `contextePolitique` from all 10 media owners in a dedicated "Connexions politiques" section (amber-accented cards). AGORA lobbying targeting the Culture ministry shown with top 5 orgs + domain breakdown. `seed-medias.ts` links etat-francais to Culture minister via `personnaliteSlug`. `MediaTutelleSection` component shows state-owned media groups on the Culture minister's `/profils/[slug]` profile.

5. **Election results <-> party finances** — `src/lib/nuance-party-map.ts` maps 23 election nuance codes to CNCCFP `codeCNCC` values (direct + coalition). Party detail page (`/profils/partis/[id]`) shows "Performance electorale" section (seats, vote share T1, cost per seat). Election page (`/elections/legislatives-2024`) shows `FinanceTable` (aide publique, recettes, dons, seats, cost/seat per nuance). `/dossiers/financement-politique` (surviving dossier, linked from `/signaux`) with 4 sections: cost per seat bars, funding structure stacked bars, electoral yield table, 2021-2024 evolution for RN/Renaissance/LFI/LR.

### Not yet connected

1. **HATVP declarations for Lecornu II government** — marked "publication a venir" by HATVP as of Q1 2026. The `InteretDeclare` model and ingestion pipeline are ready; the data isn't published yet.

2. **Career/judicial research for historical governments** — ~80 unique new members from Borne/Attal/Barnier need research agent runs for `EntreeCarriere` and `EvenementJudiciaire` backfill. Run research agents in batches then `npx tsx scripts/ingest-research-output.ts --all`.

---

### 16. Deep Government Investigation (Session 44)

Full transparency investigation of all 37 Lecornu II ministers. 6-phase pipeline:

**Phase 1 — Judicial deep dive**: 12 parallel web-research agents (~200+ searches). Each minister searched for: judicial proceedings, conflicts of interest, HATVP declarations, controversies. Findings added to `data/research-output/*.json` as `judicial_events` and `conflict_flags`. Key findings: Darmanin CJR complaint (classement sans suite), Tabarot PNF enquete (ongoing), Rist 309 pharma links, Pegard Epstein photo, Farandou/Papin official recusal decrees.

**Phase 2 — Revolving door documentation**: 6 `PORTE_TOURNANTE` conflict flags with AGORA lobby action counts. Script: `scripts/add-conflict-flags.ts`.

**Phase 3 — Vote contradiction analysis**: `scripts/analyze-vote-contradictions.ts` queries `VoteRecord` for 17 deputy-ministers, maps `ministereCode` → `ScrutinTag`, finds "contre" votes on portfolio topics. Output: `data/vote-contradictions.json`. Top: Lefevre 81.5%, Galliard-Minier 68.4%, Amiel 40.4%.

**Phase 4 — Lobby exposure cross-reference**: `scripts/analyze-lobby-exposure.ts` maps 131,842 `ActionLobby` by `ministereCode`, checks career-lobby overlaps. Output: `data/lobby-exposure.json`. Top: EDF→130 actions on Bregeon's ministry, SNCF→75 on Farandou's.

**Phase 5 — Ingestion**: `ingest-research-output.ts --all` + `generate-carriere.ts` + `refresh:search`.

**Phase 6 — UI conflict indicators**: 3 component enhancements (CareerSection revolving door badge, ParliamentarySection vote contradiction alert, LobbySection career overlap highlight). `PORTFOLIO_KEYWORDS` expanded in `signal-types.ts`.

3. **Deputy enrichment** — Activite tab "Domaines d'activite" (vote records grouped by ScrutinTag), deeper lobby cross-reference on Transparence tab (top ScrutinTag topics x ActionLobbyiste.domaine keywords), `ConflictAlert` with `totalParticipations > 0` alert on Declarations tab.

4. **Senator enrichment** — New "Transparence" tab has commission-lobby overlap but no `ConflictAlert` integration for declarations with participations.

---

## 16. Critical Field Names (Wrong Names = TypeScript Build Errors)

- `Scrutin.dateScrutin` (NOT `dateSeance`)
- `Scrutin.sortCode` (NOT `sort`)
- `Scrutin.abstentions` (NOT `abstention`)
- `Scrutin.votes VoteRecord[]` — relation is `votes` NOT `voteRecords`
- `GroupeVote.abstentions` (NOT `abstention`); no `nomOrgane` field — use `organeRef`
- `Lobbyiste.nom` (NOT `nomOrganisation`)
- `Lobbyiste.categorieActivite` (NOT `categorie`)
- `Depute.groupe` (NOT `groupePolitique`)
- `Elu.nom`/`Elu.prenom` (NOT `nomElu`/`prenomElu`)
- `Elu.codeDepartement` (NOT `departementCode`)
- `DensiteMedicale.specialite` (NOT `profession`)
- `{ prisma }` named export from `@/lib/db` — default import = build error
- `logIngestion()` metadata: `Record<string, unknown>`, NOT `JSON.stringify(...)`
- `EvenementJudiciaire` has NO `createdAt`/`updatedAt` timestamp columns
- `ActionLobby` has NO direct FK to `PersonnalitePublique` — link via `ministereCode`
- `MediaProprietaire.contextePolitique` — nullable String, political connection context
- `MediaProprietaire.personnaliteId` — nullable FK to `PersonnalitePublique` (e.g. etat-francais → Culture minister)
- `PartiPolitique.codeCNCC` — CNCCFP party identifier; mapped to election nuance codes via `src/lib/nuance-party-map.ts`
- `CandidatLegislatif.nuance` — election nuance code (ENS, RN, UG, etc.); `elu` boolean for seat winner

---

## 17. Architecture Summary

```
+------------------------------------------------------------------+
|                    15+ Government Open Data Sources                |
|  AN - Senat - HATVP - INSEE - DREES - SSMSI - OFGL - CNCCFP     |
+-------------------------------+----------------------------------+
                                |
                     +----------v----------+
                     |  10-Wave Ingestion   |
                     |  25+ idempotent      |
                     |  TypeScript scripts  |
                     |  (upsert, FK valid)  |
                     +----------+----------+
                                |
                     +----------v----------+
                     |   PostgreSQL 14      |
                     |   42 Prisma models   |
                     |   ~800K rows         |
                     |   + search_index MV  |
                     +----------+----------+
                                |
                     +----------v----------+
                     |  Server Components   |
                     |  Parallel Prisma     |
                     |  queries -> metrics  |
                     |  -> cross-references |
                     +----------+----------+
                                |
                     +----------v----------+
                     |  Transparency Layer  |
                     |  Conflict drill-down |
                     |  Commission-lobby    |
                     |  overlap detection   |
                     |  Nuance-party map    |
                     |  Media-political     |
                     |  cross-reference     |
                     |  Judicial gate       |
                     |  Territory ranking   |
                     +----------+----------+
                                |
                     +----------v----------+
                     |   ~35 Active Routes  |
                     |   14 Client Comps    |
                     |   Zero client fetch  |
                     +----------------------+
```

The entire system is designed so that **every piece of data about an elected official, government member, or public institution is traceable to its source, cross-referenced against related domains, and presented with appropriate legal guardrails**. The transparency isn't just display — it's the cross-referencing engine (votes <-> interests <-> lobbying <-> economic outcomes <-> election financing) that makes the platform more than a data viewer.

### New cross-reference modules (Session 37)

| Module | Files | What it connects |
|--------|-------|-----------------|
| Conflict drill-down | `conflict-drilldown.tsx` | Deputy financial declarations → individual tagged votes |
| Senator transparency | Senator `page.tsx` | Commission memberships → lobbying domain activity |
| Nuance-party mapping | `nuance-party-map.ts` | Election nuance codes → CNCCFP party finances |
| Media-political | `medias/page.tsx`, `media-tutelle-section.tsx` | Media owners → political context + Culture ministry lobby |
| Historical governments | `scripts/data/gouvernement-*.ts` | 4 governments × ~37 members = 148 cross-government careers |
