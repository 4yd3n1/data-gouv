# ARCHITECTURAL PLAN — L'Observatoire Citoyen v2

> The master blueprint for transforming data-gouv from a data-source browser
> into France's most powerful citizen-facing transparency platform.
>
> Created: March 1, 2026
> **Last updated: March 4, 2026 — Phases 1–5 + Phase 7 (Power Features) + Phase 8 (FranceMap) + Phase 9A/9B/9C/9D/9E/9F/9G (Government Profiles) + Session 33 (Parliamentary Laws Hub) COMPLETE ✅**

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Current State Assessment](#2-current-state-assessment)
3. [Citizen Concerns Mapping](#3-citizen-concerns-mapping)
4. [Target Architecture](#4-target-architecture)
5. [New Data Sources & APIs](#5-new-data-sources--apis)
6. [Schema Evolution](#6-schema-evolution)
7. [Cross-Reference Engine](#7-cross-reference-engine)
8. [Dossier System](#8-dossier-system)
9. [Information Architecture](#9-information-architecture)
10. [UI/UX Evolution](#10-uiux-evolution)
11. [Implementation Phases](#11-implementation-phases)
12. [Technical Specifications](#12-technical-specifications)

---

## 1. Vision & Philosophy

### The Problem

The current platform is organized **by data source** — gouvernance, économie, territoire, patrimoine. That's a developer's mental model, not a citizen's. A citizen doesn't wake up thinking "I want to browse lobbyists." They think:

> *"Why can't I afford to live? Who's responsible? Are they doing anything about it?"*

We have 800K+ rows of elected officials, voting records, lobbying activity, financial declarations, party finances, election results, and economic indicators. But none of it is cross-referenced to answer the questions people actually have.

### The Solution

Reorganize the entire platform around **citizen concerns** — purchasing power, healthcare, housing, democratic trust, public debt — and cross-reference every data layer to show cause-and-effect chains:

```
Economic reality (INSEE) → Who voted what (Scrutin) → Who lobbied (HATVP) →
Who has conflicts of interest (Declarations) → Who got elected anyway (Elections)
```

### Core Principles

1. **Issue-first, not data-first** — Enter through a concern, discover through connections
2. **Cross-reference everything** — No data silo should exist alone
3. **Localize to the citizen** — National indicators must break down to your département
4. **Surface conflicts of interest** — The data to detect them exists; connect it
5. **No editorializing** — Show data, let citizens draw conclusions
6. **Every element serves transparency** — If it doesn't reveal something, remove it

---

## 2. Current State Assessment

### What We Have (Working)

> **Updated March 4, 2026** — All phases complete through Session 33. 38 models, 61 routes + 5 OG endpoints, 39 components (12 client).

| Layer | Models | Rows | Status |
|-------|--------|------|--------|
| Territory (COG) | Region, Departement, Commune | 37,031 | Complete |
| Parliament | Depute, Senateur, MandatSenateur, CommissionSenateur | ~8,008 | Complete |
| Lobbying | Lobbyiste, ActionLobbyiste | ~98,529 | Complete |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies | Complete |
| Economy | Indicateur, Observation | ~700+ | Complete — 15+ BDM series ✅ |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 | Complete |
| Parliament Votes | Organe, Scrutin, GroupeVote, VoteRecord, Deport | varies | Complete |
| Elections & RNE | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 | Complete |
| Local Stats (INSEE) | StatLocale | 1,408 | Complete — Mélodi API ✅ |
| Local Budgets (DGFIP) | BudgetLocal | 69,023 | Complete — OFGL Opendatasoft ✅ |
| Vote Tags | ScrutinTag | 3,170 | Complete ✅ |
| Security | StatCriminalite | varies | Complete — SSMSI ✅ |
| Healthcare | DensiteMedicale | varies | Complete — DREES ✅ |
| Conflict Signals | ConflictSignal | varies | Complete — Phase 7C ✅ |
| Search Index | search_index (PG view) | all entities | Complete — Phase 7B ✅ |
| **Total** | **30 models** | **~800,000+** | |

### What's Missing (original gaps — now resolved)

| Gap | Resolution |
|-----|--------|
| ~~No localized economic data~~ | **DONE** — StatLocale: income, poverty, pop, employment per dept (INSEE Mélodi) |
| ~~No cross-references~~ | **DONE** — Dossier pages cross-reference all layers; ConflictAlert on deputy profiles |
| ~~No issue-centric navigation~~ | **DONE** — 8 dossier pages + hub at `/dossiers` |
| ~~No conflict-of-interest detection~~ | **DONE** — Pre-computed `ConflictSignal` table (7C); deputy Transparence tab; homepage alerts |
| ~~No local finance data~~ | **DONE** — 69,023 rows (380 depts + 68,643 communes), OFGL Opendatasoft (Session 12) ✅ |
| ~~No demographic context~~ | **DONE** — Territoire dept dashboard shows age/income/employment/poverty |
| **Deputies ↔ Declarations matched by name only** | Still string-match — no FK added (acceptable for now) |
| ~~No vote-topic classification~~ | **DONE** — 3,170 ScrutinTag records; `/votes/par-sujet/[tag]` pages |
| ~~No global search~~ | **DONE** — Materialized view `search_index` + `/recherche` + NavSearch (7B) |
| ~~No postal code civic dashboard~~ | **DONE** — `/mon-territoire?cp=` full dashboard (7A) |
| ~~No comparison mode~~ | **DONE** — `/comparer/territoires` + `/comparer/deputes` (7D) |
| ~~No social sharing cards~~ | **DONE** — OG images for deputy, département, scrutin (7E) |
| ~~No party alignment visualization~~ | **DONE** — `/votes/alignements` heat map (7F) |

### Remaining Work

| Item | Priority | Notes |
|------|----------|-------|
| Run `pnpm ingest:criminalite` | MEDIUM | Model exists; SSMSI ingestion script ready |
| Run `pnpm ingest:medecins` | MEDIUM | Model exists; DREES ingestion script ready |
| Run `pnpm ingest:insee-local` again for DEP 36 | LOW | Hit rate-limit; only 8/12 stats for Indre |
| Deputy ↔ Declaration FK | LOW | Still name-matched; fragile but functional |

### Current Route Structure (61 routes + 5 OG endpoints — as of Session 33)

```
/                          → Homepage (dynamic hero + dossier cards + conflict alerts + DeptLookup)
/president                 → HTTP 308 redirect → /gouvernement/emmanuel-macron
/dossiers                  → Hub (8 issue cards)
  /pouvoir-dachat          → Purchasing power dossier
  /confiance-democratique  → Democratic trust dossier (with ConflictSignal)
  /dette-publique          → Public debt dossier
  /emploi-jeunesse         → Youth employment dossier
  /logement                → Housing dossier
  /sante                   → Health / medical deserts dossier
  /transition-ecologique   → Ecology dossier
  /retraites               → Pensions dossier
/gouvernement              → Index grid (Protocol-sorted, grouped by type) [Phase 9A]
  /[slug]                  → Minister/president profile (Phase 9E/9G)
/representants             → Hub (with president card)
  /deputes                 → List + /[id] profile (4 tabs, conflict signals, compare link)
                             /[id]/opengraph-image (OG card)
  /senateurs               → List + /[id] profile
  /elus                    → Local officials list
  /lobbyistes              → List + /[id] detail
  /scrutins                → Vote list (SPS/MOC type filter) + /[id] detail
                             (gouvernance/scrutins/[id]/opengraph-image — OG card)
  /partis                  → Party finances + /[id] detail
/votes                     → Hub (tag grid + recent scrutins + Grandes lois section)
  /lois                    → Parliamentary Laws hub — 19 major laws, filter by type/statut [Session 33]
  /lois/[slug]             → Law detail — group positions, ScrutinAccordion [Session 33]
  /par-sujet/[tag]         → Tag-filtered scrutins with pagination
  /mon-depute              → 3-state deputy vote lookup
  /alignements             → Party alignment heat map (N×N matrix)
/comparer                  → (no hub)
  /territoires             → Side-by-side département comparison
  /deputes                 → Side-by-side deputy comparison
/recherche                 → Global full-text search (/recherche?q=&type=)
/mon-territoire            → Postal code → full civic dashboard
/economie                  → 15+ indicators dashboard
/territoire                → Region browser
  /[departementCode]       → Rich département dashboard (compare link)
                             /[departementCode]/opengraph-image (OG card)
  /commune/[communeCode]   → Commune card
/patrimoine                → Hub
  /musees                  → List + /[id] detail
  /monuments               → List + /[id] detail
/elections                 → Hub
  /legislatives-2024       → Results
```

---

## 3. Citizen Concerns Mapping

### France 2025-2026: What Citizens Actually Care About

Source: Ipsos Fractures Françaises, CEVIPOF Baromètre, IFOP, Gallup.

| # | Issue | % Concerned | Key Stat |
|---|-------|-------------|----------|
| 1 | **Pouvoir d'achat** | 43-49% | 88% pessimistic about economy |
| 2 | **Avenir du système social** | 38% | Pension reform via 49.3 |
| 3 | **Insécurité / délinquance** | 33% | 453K crimes recorded 2025 |
| 4 | **Immigration** | 28% | 384K permits, 90% OQTF not executed |
| 5 | **Santé / déserts médicaux** | 18% | 9M in medical deserts |
| 6 | **Logement** | rising | 350K homeless, rental supply -32% |
| 7 | **Éducation** | growing | Cour des Comptes: "failed" |
| 8 | **Dette publique** | 77% worried | 3,416B€ = 115.6% GDP |
| 9 | **Transition écologique** | 18% | -0.8% emissions vs -5% needed |
| 10 | **Confiance politique** | 78% distrust | Worst corruption index ever (27th) |
| 11 | **Emploi des jeunes** | rising | 21.5% youth unemployment |

### The Trust Crisis — Our Core Opportunity

- **78%** have no confidence in politics (record, +4 pts in 1 year)
- **68%** say corruption is widespread in government (+13 pts)
- **France ranked 27th** in Transparency International CPI 2025 — all-time worst
- Only **mayors retain trust** (68%) — all other institutions below 30%
- **91%** believe France is headed in the wrong direction

This platform exists to give citizens the data tools to verify, not just trust.

### Mapping Issues → Data We Have / Need

| Issue | Data We Have | Data We Need |
|-------|-------------|-------------|
| **Pouvoir d'achat** | GDP, unemployment, enterprise creation (4 series) | Inflation by sector, wages, SMIC evolution, median income by dept (INSEE) |
| **Système social / Retraites** | Scrutin votes (incl. 49.3 motions), deputy profiles | COR pension projections, social spending budget (data.gouv.fr) |
| **Insécurité** | Territory data (communes, depts) | Crime stats by dept (SSMSI), police headcount |
| **Santé** | Territory, elected officials | GP density by commune (ARS/data.gouv.fr), hospital deficits |
| **Logement** | Territory, elected officials | Housing permits (INSEE BDM), HLM wait times, Airbnb density |
| **Dette publique** | GDP indicator | Debt trajectory, interest payments, spending by ministry (data.gouv.fr) |
| **Confiance politique** | Deputies, senators, lobbyists, declarations, votes, party finances | Cross-references between all of these |
| **Emploi des jeunes** | Unemployment indicator (national) | Youth unemployment by dept (INSEE), CDI/CDD ratios |
| **Transition écologique** | Lobbying data (domaine filtering) | Emissions by sector (CITEPA), green budget tagging |
| **Local accountability** | 593K Elu records | Commune budgets (DGFIP), local spending |

---

## 4. Target Architecture

### Design Philosophy: Issue-Centric, Cross-Referenced

```
                    ┌──────────────────────┐
                    │   CITIZEN CONCERNS    │
                    │   (Dossier Pages)     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼───────┐ ┌──────▼───────┐
     │  WHO           │ │  WHAT         │ │  WHERE       │
     │  Représentants │ │  Votes &      │ │  Territoire  │
     │  Lobbyistes    │ │  Déclarations │ │  Économie    │
     │  Partis        │ │  Lobbying     │ │  Démographie │
     └────────┬──────┘ └──────┬───────┘ └──────┬───────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │    CROSS-REFERENCE    │
                    │    ENGINE             │
                    │                      │
                    │  Lobbying → Votes    │
                    │  Declarations → Votes│
                    │  Party $ → Elections │
                    │  Territory → All     │
                    └──────────────────────┘
```

### Conceptual Shift

| Before (v1) | After (v2) |
|-------------|------------|
| Browse by data source | Enter through a citizen concern |
| Siloed models | Cross-referenced connections |
| National indicators only | Localized to your département |
| Deputies and votes separated | Deputy profile shows conflict-of-interest signals |
| 593K elus with no context | Local officials linked to commune budgets |
| Homepage: stat grid | Homepage: "what matters right now" |

---

## 5. New Data Sources & APIs

### Priority 1: INSEE Données Locales API — ✅ COMPLETE

**Endpoint**: ~~`https://api.insee.fr/donnees-locales/V0.1`~~ **DEPRECATED** → migrated to **`https://api.insee.fr/melodi`** (Mélodi v1.13.1)
**Auth**: **None required** — Mélodi "libre" plan is fully anonymous, no API key needed
**Rate limit**: 30 queries/minute (2100ms between requests)
**Format**: CSV (semicolon-delimited, BOM-prefixed)

**Datasets actually used** (Mélodi replaces all original cube IDs):

| Dataset ID | Replaces | Indicators | Status |
|---|---|---|---|
| `DS_FILOSOFI_CC` | GEO-REV | Median income, poverty rate, D1/D9 deciles | ✅ Ingested (2021) |
| `DS_RP_POPULATION_PRINC` | GEO-POP | Population by age bracket | ✅ Ingested (2022) |
| `DS_RP_EMPLOI_LR_PRINC` | GEO-EMP | Employment, unemployment, activity rates | ✅ Ingested (2022) |

> **Note**: GEO-LOG (housing) ✅ ingested (Session 18/19) — `DS_RP_LOGEMENT_PRINC`, indicators: `HOUSING_TOTAL`, `HOUSING_VACANCY_RATE`, `HOUSING_SECONDARY_RATE`. GEO-DIP (education), GEO-ETR (nationality), GEO-ENT (enterprises) not yet ingested — datasets exist in Mélodi but scripts not written.

**Cubes to ingest**:

| Cube ID | Dataset | Key Indicators | Geographic Level |
|---------|---------|----------------|-----------------|
| GEO-POP | Recensement | Population by age bracket, sex | Commune, Dept |
| GEO-REV | FILOSOFI | Median income, poverty rate, Gini coefficient | Commune, Dept |
| GEO-EMP | Recensement | Employment rate, unemployment rate, activity rate | Employment zone, Dept |
| GEO-LOG | Recensement | Housing stock, vacancy rate, owner/renter split | Commune, Dept |
| GEO-DIP | Recensement | Education level distribution | Commune, Dept |
| GEO-ETR | Recensement | Foreign-born population, nationality | Dept |
| GEO-ENT | REE/Sirene | Business creation, density | Commune, Dept |

**New Prisma models**: `StatLocale` (generic local stat container) — see [Schema Evolution](#6-schema-evolution).

### Priority 2: INSEE BDM Expansion (HIGH)

**Endpoint**: Existing SDMX infra (`bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}`)
**Currently**: 4 indicators, 354 observations
**Target**: 15-20 indicators, ~2,000+ observations

**New series to ingest**:

| idBank | Indicator | Domain | Relevance |
|--------|-----------|--------|-----------|
| 001763852 | Inflation (IPC) mensuelle | prix | Pouvoir d'achat |
| 001768682 | Inflation alimentaire | prix | Pouvoir d'achat |
| 001769682 | Inflation énergie | prix | Pouvoir d'achat, Transition |
| 010605027 | SMIC horaire brut | salaires | Pouvoir d'achat |
| 001587885 | Salaire moyen par tête | salaires | Pouvoir d'achat |
| 001656956 | Logements autorisés | construction | Logement |
| 001656957 | Logements commencés | construction | Logement |
| 001694258 | Dette publique % PIB | finances | Dette publique |
| 001694274 | Charge d'intérêts | finances | Dette publique |
| 001710399 | Dépenses publiques % PIB | finances | Dette publique |
| 001587878 | Emploi salarié total | emploi | Emploi |
| 001587791 | Emploi intérimaire | emploi | Emploi jeunes |

### Priority 3: Finances Locales (HIGH)

**Source**: DGFIP via [collectivites-locales.gouv.fr](https://www.collectivites-locales.gouv.fr/finances-locales/open-data)
**Format**: CSV on data.gouv.fr
**Coverage**: Individual commune budgets since 2000, département budgets since 2008

**Key fields**:
- Total revenue / Total expenditure
- Investment spending
- Operating expenses
- Debt level
- Tax revenue (taxe foncière, etc.)
- State transfers (DGF)

**New Prisma model**: `BudgetLocal` — see [Schema Evolution](#6-schema-evolution).

### Priority 4: Additional Open Data (MEDIUM)

| Source | Format | What It Adds | Dossier |
|--------|--------|-------------|---------|
| **SSMSI** (crime stats by dept) | CSV on data.gouv.fr | Crimes by type per département | Insécurité |
| **ARS / DREES** (GP density) | CSV on data.gouv.fr | Doctors per 10K inhabitants per commune | Santé |
| **CITEPA** (emissions) | CSV | CO2 emissions by sector, trajectory | Transition écologique |
| **Budget de l'État** (PLF) | CSV on data.gouv.fr | Ministry-level spending over time | Dette, all dossiers |
| **Annexes budgétaires** (niches fiscales) | PDF/CSV | Tax expenditure beneficiaries | Dette, Confiance |

### Data Volume Projections

| Current | Addition | New Total |
|---------|----------|-----------|
| 22 models, ~800K rows | +6-8 models, ~500K-1M rows | ~28-30 models, ~1.5M+ rows |

---

## 6. Schema Evolution

### New Models

```prisma
// ─────────────────────────────────────────────
// LOCALIZED STATISTICS (INSEE Données Locales)
// ─────────────────────────────────────────────

model StatLocale {
  id              String   @id @default(cuid())
  source          String   // "FILOSOFI", "RP", "REE"
  indicateur      String   // "MEDIAN_INCOME", "POVERTY_RATE", "POP_TOTAL", etc.
  annee           Int
  geoType         String   // "COM", "DEP", "REG"
  geoCode         String   // "75056", "75", "11"
  valeur          Float
  unite           String   // "EUR", "%", "NB"
  metadata        String?  // JSON for additional breakdowns
  createdAt       DateTime @default(now())

  @@unique([source, indicateur, annee, geoType, geoCode])
  @@index([indicateur, geoType])
  @@index([geoCode, geoType])
  @@index([annee])
  @@index([indicateur, geoCode])
}

// ─────────────────────────────────────────────
// LOCAL GOVERNMENT FINANCES (DGFIP)
// ─────────────────────────────────────────────

model BudgetLocal {
  id                  String   @id @default(cuid())
  geoType             String   // "COM", "DEP", "REG", "EPCI"
  geoCode             String   // commune/dept/region code
  geoLibelle          String
  annee               Int
  population          Int?
  // Revenue
  totalRecettes       Float?
  recettesFonct       Float?
  recettesInvest      Float?
  impotsTaxes         Float?
  dotationsSubv       Float?
  // Expenditure
  totalDepenses       Float?
  depensesFonct       Float?
  depensesInvest      Float?
  chargesPersonnel    Float?
  // Debt
  encoursDette        Float?
  annuiteDette        Float?
  // Derived
  resultatComptable   Float?
  depenseParHab       Float?
  detteParHab         Float?
  createdAt           DateTime @default(now())

  @@unique([geoType, geoCode, annee])
  @@index([geoType, geoCode])
  @@index([annee])
  @@index([geoType, annee])
}

// ─────────────────────────────────────────────
// VOTE TOPIC TAGS (for cross-referencing)
// ─────────────────────────────────────────────

model ScrutinTag {
  id          String @id @default(cuid())
  scrutinId   Int
  tag         String // "budget", "fiscalite", "sante", "logement", etc.
  confidence  Float  @default(1.0) // 0-1 for keyword-matched vs manual

  scrutin     Scrutin @relation(fields: [scrutinId], references: [id], onDelete: Cascade)

  @@unique([scrutinId, tag])
  @@index([tag])
  @@index([scrutinId])
}

// ─────────────────────────────────────────────
// CRIME STATISTICS (SSMSI)
// ─────────────────────────────────────────────

model StatCriminalite {
  id                String   @id @default(cuid())
  annee             Int
  codeDepartement   String
  categorie         String   // "vols", "violences", "escroqueries", etc.
  faitsConstates    Int
  tauxPour1000      Float?
  createdAt         DateTime @default(now())

  @@unique([annee, codeDepartement, categorie])
  @@index([codeDepartement])
  @@index([annee])
  @@index([categorie])
}

// ─────────────────────────────────────────────
// MEDICAL DENSITY (ARS / DREES)
// ─────────────────────────────────────────────

model DensiteMedicale {
  id                String   @id @default(cuid())
  annee             Int
  geoType           String   // "COM", "DEP"
  geoCode           String
  profession        String   // "generaliste", "specialiste", "infirmier"
  effectif          Int
  pourDixMille      Float    // per 10,000 inhabitants
  createdAt         DateTime @default(now())

  @@unique([annee, geoType, geoCode, profession])
  @@index([geoType, geoCode])
  @@index([profession])
}
```

### Schema Modifications to Existing Models

```prisma
// Add to Scrutin model:
model Scrutin {
  // ... existing fields ...
  tags          ScrutinTag[]    // NEW: topic classification
}

// Add to Indicateur model — expand domaine enum coverage:
// Current domaines: "pib", "emploi", "entreprises"
// New domaines: "prix", "salaires", "construction", "finances", "social"
```

### Vote Topic Classification Strategy

Scrutin titles contain policy domain keywords. We classify by keyword matching on `titre`:

| Tag | Keywords (French) |
|-----|-------------------|
| `budget` | budget, finances, loi de finances, PLF, PLFSS |
| `fiscalite` | impôt, taxe, fiscal, TVA, ISF, CSG, prélèvement |
| `sante` | santé, hôpital, médecin, PLFSS, sécurité sociale |
| `logement` | logement, habitat, HLM, loyer, hébergement |
| `retraites` | retraite, pension, cotisation, régime spécial |
| `education` | éducation, enseignement, école, université |
| `securite` | sécurité, police, gendarmerie, justice, pénal |
| `immigration` | immigration, étranger, asile, séjour, frontière |
| `ecologie` | climat, environnement, énergie, carbone, biodiversité |
| `travail` | emploi, travail, chômage, formation, apprentissage |
| `defense` | défense, armée, militaire, OPEX |
| `agriculture` | agriculture, PAC, rural, alimentaire |
| `culture` | culture, patrimoine, musée, spectacle |

Confidence: 1.0 for exact multi-word match, 0.7 for single keyword, adjustable.

---

## 7. Cross-Reference Engine

This is the highest-value feature of the platform. No French civic tech tool currently does systematic cross-referencing across lobbying, votes, declarations, and party finances.

### Cross-Reference 1: Conflict of Interest Detection

**Models involved**: `DeclarationInteret` + `ParticipationFinanciere` + `VoteRecord` + `Scrutin` + `ScrutinTag`

**Logic**:
1. Deputy X has `ParticipationFinanciere` records showing ownership in Company Y (sector: energy)
2. `ScrutinTag` identifies votes related to `ecologie` or `fiscalite` affecting energy
3. `VoteRecord` shows how Deputy X voted on those scrutins
4. Surface: "Deputy X declared €50K in energy company shares and voted [pour/contre] on energy regulation Bill Z"

**Implementation**: Server-side query joining declarations (matched by `nom + prenom`) → tag-filtered scrutins → vote records. No ML needed — pure relational joins.

**Display**: Alert card on deputy profile page, amber accent, factual tone:
> "Participations financières déclarées dans le secteur [X]. A voté sur [N] textes liés à ce secteur."

### Cross-Reference 2: Lobbying → Policy Domain → Votes

**Models involved**: `ActionLobbyiste` + `ScrutinTag` + `GroupeVote` + `Scrutin`

**Logic**:
1. `ActionLobbyiste.domaine` identifies which policy areas lobbyists target
2. `ScrutinTag.tag` classifies votes by the same domains
3. Show: "In domain [X], [N] lobbying organizations declared [M] actions. Parliament voted [Y] times on related legislation."
4. Drill down: which political groups voted in alignment with lobbying positions

**Display**: Dossier section showing lobbying intensity vs. legislative activity per domain.

### Cross-Reference 3: Party Finances → Electoral Performance

**Models involved**: `PartiPolitique` + `CandidatLegislatif` + `ElectionLegislative`

**Logic**:
1. `PartiPolitique` has financial data per party (revenue, aide publique, dons)
2. `CandidatLegislatif.nuance` maps to political families
3. Cross-reference: party spending power vs. electoral outcomes
4. Show: "Parties with highest public aid [aidePublique1 + aidePublique2] vs. their 2024 election results"

**Nuance → Party family mapping** (using `nuance-colors.ts` as base):
| Nuance codes | Party family |
|---|---|
| FI, EXG | Gauche radicale |
| SOC, DVG, UG | Gauche |
| ECO | Écologistes |
| ENS, MDM, HOR, DVC | Centre / Majorité |
| LR, DVD, UDI | Droite |
| RN, REC, EXD, UXD | Droite nationale |

### Cross-Reference 4: Territory → Everything

**Models involved**: `Departement` + `Depute` + `Senateur` + `Elu` + `StatLocale` + `BudgetLocal` + all culture models

**Logic**: For any département, show:
- **Who represents you**: Deputies, senators, local elected officials
- **How they vote**: Aggregate voting patterns of your département's deputies
- **Your economic reality**: Median income, poverty rate, unemployment (from INSEE Données Locales)
- **Your local budget**: Commune/dept spending, debt, investment (from DGFIP)
- **Your cultural heritage**: Museums, monuments, attendance trends

This transforms `/territoire/[departementCode]` from a simple list page into a **complete département dashboard**.

### Cross-Reference 5: Deputy Accountability Score

**Models involved**: `Depute` + `VoteRecord` + `ScrutinTag` + `DeclarationInteret` + `Deport`

A factual transparency profile for each deputy:
- **Participation rate**: Already exists (`scoreParticipation`)
- **Conflict-of-interest exposure**: Count of votes on topics matching declared interests
- **Recusal compliance**: Deport declarations vs. conflict-topic votes
- **Lobbying exposure**: How many lobbying actions target their commission's domain

Not an editorial "score" — a factual **transparency dashboard** showing data connections.

---

## 8. Dossier System

### What Is a Dossier?

A dossier is a **thematic investigation page** that pulls data from multiple models to tell a complete story about a citizen concern. It's not editorial — it's a structured data lens.

### Dossier Template Structure

Every dossier follows this layout:

```
┌─────────────────────────────────────────────────────────────┐
│  DOSSIER HERO                                               │
│  Title + citizen concern framing + key polling stat         │
│  "43% des Français citent le pouvoir d'achat comme          │
│   leur préoccupation principale" — Ipsos 2025               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▎ LES CHIFFRES                                             │
│  Key indicators from Indicateur/Observation + StatLocale    │
│  Interactive time-series (reuse MiniChart, expand to full)  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐              │
│  │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │              │
│  └────────┘ └────────┘ └────────┘ └────────┘              │
│                                                             │
│  ▎ LA CARTE                                                 │
│  Département-level breakdown of key indicator               │
│  (StatLocale filtered by relevant indicateur + geoType=DEP) │
│  Clickable → /territoire/[dept]                             │
│                                                             │
│  ▎ QUI A VOTÉ QUOI                                          │
│  Scrutins tagged with this dossier's domain                 │
│  Group-level vote breakdown (reuse scrutin detail pattern)  │
│  Link to individual scrutin pages                           │
│                                                             │
│  ▎ LE LOBBYING                                              │
│  ActionLobbyiste filtered by matching domaine               │
│  Top organizations + action counts                         │
│  "X organisations ont déclaré Y actions dans ce domaine"   │
│                                                             │
│  ▎ LES INTÉRÊTS DÉCLARÉS                                    │
│  Deputies/senators with declared interests in this sector  │
│  Cross-referenced with their votes on tagged scrutins      │
│  Factual display, no editorial judgment                    │
│                                                             │
│  ▎ PAR TERRITOIRE                                           │
│  Table/ranking of départements by relevant StatLocale       │
│  + who represents each (deputy count, senator count)        │
│                                                             │
│  ▎ CHRONOLOGIE                                              │
│  Timeline of key votes + indicator evolution               │
│  "When did inflation peak? What was voted that quarter?"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dossier Definitions

#### Dossier 1: Pouvoir d'Achat (Priority: HIGHEST)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | `Indicateur` | PIB, chômage + NEW inflation, SMIC, salaire moyen |
| Map | `StatLocale` | Median income by département (FILOSOFI) |
| Votes | `Scrutin` + `ScrutinTag` | tag IN ("budget", "fiscalite") |
| Lobbying | `ActionLobbyiste` | domaine LIKE "%fiscal%" OR "%économi%" |
| Interests | `DeclarationInteret` + `ParticipationFinanciere` | Sector: finance, immobilier |
| Territory | `StatLocale` | Poverty rate ranking by département |

#### Dossier 2: Confiance Démocratique (Priority: HIGHEST)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | External (polling) | Trust metrics (static cards with source links) |
| Declarations | `DeclarationInteret` | Total count, average participations, compliance rate |
| Lobbying density | `Lobbyiste` + `ActionLobbyiste` | Total actions per year, top domains |
| Party money | `PartiPolitique` | Revenue breakdown: public aid vs. private donations |
| 49.3 trail | `Scrutin` | Votes on motions de censure |
| Revolving doors | `DeclarationInteret` + `RevenuDeclaration` | Officials with private sector income |
| Local opacity | `Elu` | 593K officials with zero financial transparency |

#### Dossier 3: Dette Publique (Priority: HIGH)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | `Indicateur` | NEW: debt/GDP, interest charges, public spending/GDP |
| Budget votes | `Scrutin` + `ScrutinTag` | tag = "budget" |
| Local debt | `BudgetLocal` | Aggregate debt by dept, debt per habitant ranking |
| Spending growth | `BudgetLocal` | Year-over-year expenditure growth |
| Party positions | `GroupeVote` | How groups voted on budget laws |

#### Dossier 4: Emploi & Jeunesse (Priority: HIGH)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | `Indicateur` | Unemployment + NEW: youth unemployment, interim |
| Map | `StatLocale` | Employment rate by département (RP census) |
| Education | `StatLocale` | Education level distribution by département |
| Votes | `Scrutin` + `ScrutinTag` | tag IN ("travail", "education") |
| Local officials | `Elu` | CSP distribution of elected officials vs. population |

#### Dossier 5: Logement (Priority: MEDIUM)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | `Indicateur` | NEW: housing permits, housing starts |
| Map | `StatLocale` | Vacancy rate, owner/renter split by dept |
| Votes | `Scrutin` + `ScrutinTag` | tag = "logement" |
| Local budgets | `BudgetLocal` | Housing investment by commune |
| Lobbying | `ActionLobbyiste` | domaine LIKE "%logement%" OR "%immobili%" |

#### Dossier 6: Santé (Priority: MEDIUM)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | Static + `DensiteMedicale` | GP density national average |
| Map | `DensiteMedicale` | GP per 10K by département — desert identification |
| Votes | `Scrutin` + `ScrutinTag` | tag = "sante" |
| Lobbying | `ActionLobbyiste` | domaine LIKE "%santé%" OR "%pharma%" |

#### Dossier 7: Transition Écologique (Priority: MEDIUM)

| Section | Data Source | Query |
|---------|-----------|-------|
| KPIs | External/static | Emissions trajectory stats |
| Votes | `Scrutin` + `ScrutinTag` | tag = "ecologie" |
| Lobbying | `ActionLobbyiste` | domaine LIKE "%énergi%" OR "%environnement%" OR "%agricul%" |
| Interests | `DeclarationInteret` | Officials with energy sector interests |
| Party money | `PartiPolitique` | Cross-ref green party finances vs. results |

#### Dossier 8: Retraites (Priority: MEDIUM)

| Section | Data Source | Query |
|---------|-----------|-------|
| Key votes | `Scrutin` + `ScrutinTag` | tag = "retraites" — especially 49.3 motions |
| Group positions | `GroupeVote` | How each group voted on pension-related bills |
| Individual votes | `VoteRecord` | Every deputy's position on censure motions |
| Economic context | `Indicateur` | Employment, GDP trends around reform period |

---

## 9. Information Architecture

### New Route Structure

```
/ (Homepage — redesigned: "What matters right now")
│
├── /dossiers/                              ← NEW SECTION
│   ├── pouvoir-dachat                      ← Highest priority
│   ├── confiance-democratique              ← Highest priority
│   ├── dette-publique                      ← High priority
│   ├── emploi-jeunesse                     ← High priority
│   ├── logement                            ← Medium priority
│   ├── sante                               ← Medium priority
│   ├── transition-ecologique               ← Medium priority
│   └── retraites                           ← Medium priority
│
├── /representants/                         ← RENAMED from /gouvernance
│   ├── (hub page)                          ← Enhanced hub
│   ├── deputes/                            ← Enhanced with conflict signals
│   │   └── [id]/                           ← Enhanced profile
│   ├── senateurs/
│   │   └── [id]/
│   ├── elus/                               ← Enhanced with budget context
│   ├── lobbyistes/
│   │   └── [id]/                           ← Enhanced with vote cross-ref
│   ├── scrutins/
│   │   └── [id]/                           ← Enhanced with tags + lobbying
│   └── partis/
│       └── [id]/                           ← Enhanced with electoral cross-ref
│
├── /votes/                                 ← NEW: dedicated votes section
│   ├── (hub — votes by topic)
│   ├── par-sujet/[tag]                     ← All votes on "sante", "budget", etc.
│   └── mon-depute/                         ← "How does MY deputy vote?" lookup
│
├── /territoire/                            ← ENHANCED with local data
│   ├── (hub — region browser, unchanged)
│   ├── [departementCode]/                  ← MAJOR enhancement: full dashboard
│   └── [communeCode]/                      ← NEW: commune card
│
├── /economie/                              ← ENHANCED with more indicators
│   └── (dashboard — 15-20 indicators)
│
├── /patrimoine/                            ← UNCHANGED
│   ├── musees/ + [id]
│   └── monuments/ + [id]
│
└── /elections/                             ← UNCHANGED for now
    └── legislatives-2024/
```

### Navigation Evolution

**Current nav** (6 links):
```
Accueil | Gouvernance | Élections | Économie | Territoire | Patrimoine
```

**New nav** (7 links):
```
Accueil | Dossiers | Représentants | Votes | Économie | Territoire | Patrimoine
```

`Élections` moves under `Représentants` (or stays as sub-link). `Dossiers` becomes the primary entry point. `Votes` gets promoted to top-level navigation.

### Homepage Redesign

The homepage should answer: **"What should I know right now?"**

```
┌─────────────────────────────────────────────────────────────┐
│  L'OBSERVATOIRE CITOYEN                                     │
│  "Comprendre la France par les données"                     │
│                                                             │
│  Hero: Dynamic headline from latest data                    │
│  e.g., "La dette publique atteint 115,6% du PIB"          │
│  or "78% des Français ne font pas confiance à la politique"│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▎ DOSSIERS THÉMATIQUES                                     │
│  8 issue cards with key stats + trend arrows               │
│  Each links to /dossiers/[slug]                             │
│  Sorted by relevance (polling % or data freshness)          │
│                                                             │
│  ▎ DERNIERS SCRUTINS                                        │
│  Latest parliamentary votes with result + group breakdown  │
│  "Votre Assemblée a voté hier sur..."                      │
│                                                             │
│  ▎ ALERTES TRANSPARENCE                                     │
│  Top conflict-of-interest signals from cross-reference     │
│  Latest high-value declarations                            │
│  Lobbying activity spikes                                  │
│                                                             │
│  ▎ VOTRE TERRITOIRE                                         │
│  Quick département lookup → dashboard                       │
│  "Entrez votre code postal ou département"                 │
│                                                             │
│  ▎ EN CHIFFRES                                              │
│  The data inventory (existing stat grid, refined)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. UI/UX Evolution

### Design System Preservation

The "Intelligence Bureau" aesthetic stays. It works for the civic intelligence framing. We preserve:

- **Palette**: bureau-950 to bureau-100 + teal/amber/rose/blue accents
- **Fonts**: Instrument Serif (display) + DM Sans (body)
- **Effects**: Noise overlay, grid-bg, card-accent, fade-up animations
- **Components**: ProfileHero, ProfileTabs, PageHeader, SearchInput, Pagination, Avatar, etc.

### New Components Needed

| Component | Type | Purpose |
|-----------|------|---------|
| `DossierHero` | Server | Issue page hero with concern framing + key stat |
| `DossierNav` | Server | Sidebar/pill navigation between dossiers |
| `IndicatorCard` | Server | KPI display with trend arrow (↑↓→) and sparkline |
| `DeptMap` | Client | SVG France map with département coloring by indicator |
| `ConflictAlert` | Server | Factual cross-reference finding display |
| `TopicVoteList` | Server | Scrutins filtered by ScrutinTag, with group bars |
| `LobbyingDensity` | Server | Domain-filtered lobbying activity summary |
| `DeptLookup` | Client | Search input → département dashboard redirect |
| `TimelineChart` | Client | Combined timeline: votes + indicators on same axis |
| `RankingTable` | Server | Sortable département ranking by any StatLocale indicator |

### Enhanced Existing Components

| Component | Enhancement |
|-----------|------------|
| `ProfileHero` | Add conflict-of-interest signal badges (amber alert) |
| `ProfileTabs` | Add "Transparence" tab showing cross-references |
| Deputy `[id]` page | New tab: cross-referenced lobbying + declared interests vs. votes |
| `/territoire/[dept]` | Full dashboard with demographics, economy, budget, representatives |

### Data Visualization Strategy

| Visualization | Use Case | Implementation |
|---------------|----------|----------------|
| **Sparkline** | Inline trend in indicator cards | SVG, server-rendered |
| **Time-series** | Full indicator charts (existing MiniChart, enhanced) | SVG, server-rendered |
| **Département map** | Geographic distribution of any indicator | SVG France map, client-side hover |
| **Horizontal bars** | Vote group positions (existing, reuse) | CSS + server |
| **Ranking tables** | Département comparison | Server component, sortable |
| **Sankey / flow** | Money flow in party finances (future) | Client component |
| **Timeline** | Votes + indicators synchronized | Client component |

---

## 11. Implementation Phases

### Phase 1: Foundation — ✅ COMPLETE (March 1, 2026)

**Goal**: Data infrastructure for cross-referencing + INSEE expansion.

| Task | Priority | Files |
|------|----------|-------|
| Add `StatLocale` model to schema | P0 | `prisma/schema.prisma` |
| Add `BudgetLocal` model to schema | P0 | `prisma/schema.prisma` |
| Add `ScrutinTag` model to schema | P0 | `prisma/schema.prisma` |
| Run migration | P0 | `prisma/migrations/` |
| Create `scripts/ingest-insee-local.ts` | P0 | New file |
| Create `scripts/ingest-budgets.ts` | P0 | New file |
| Create `scripts/tag-scrutins.ts` | P0 | New file |
| Expand `scripts/ingest-economie.ts` with new BDM series | P1 | Existing file |
| Register INSEE Données Locales API key | P0 | `.env.local` |
| Add new scripts to `scripts/ingest.ts` orchestrator | P1 | Existing file |
| Update `package.json` with new ingest commands | P1 | Existing file |

**Ingestion order update**:
```
Wave 1a:  ingestTerritoires()                    // unchanged
Wave 1b:  Promise.all([Deputes, Senateurs, Lobbies]) // unchanged
Wave 2:   ingestEconomie()                       // EXPANDED (15+ indicators)
Wave 3:   Promise.all([Musees, Monuments])        // unchanged
Wave 4:   ingestDeclarations()                   // unchanged
Wave 5a:  ingestOrganes()                        // unchanged
Wave 5b:  Promise.all([Scrutins, Deports])        // unchanged
Wave 5c:  tagScrutins()                          // NEW — runs after scrutins
Wave 6:   ingestPhotos()                         // unchanged
Wave 7:   Promise.all([Elus, Elections, Partis])  // unchanged
Wave 8:   Promise.all([                          // NEW WAVE
            ingestInseeLocal(),                  // StatLocale from INSEE API
            ingestBudgets(),                     // BudgetLocal from DGFIP
          ])
```

### Phase 2: Dossier System + Homepage — ✅ COMPLETE (March 1, 2026)

**Goal**: Issue-centric pages that cross-reference data.

| Task | Priority | Files |
|------|----------|-------|
| Create `DossierHero` component | P0 | `src/components/dossier-hero.tsx` |
| Create `IndicatorCard` component | P0 | `src/components/indicator-card.tsx` |
| Create `TopicVoteList` component | P0 | `src/components/topic-vote-list.tsx` |
| Create `LobbyingDensity` component | P0 | `src/components/lobbying-density.tsx` |
| Create `ConflictAlert` component | P1 | `src/components/conflict-alert.tsx` |
| Create `RankingTable` component | P1 | `src/components/ranking-table.tsx` |
| Build `/dossiers` hub page | P0 | `src/app/dossiers/page.tsx` |
| Build `/dossiers/pouvoir-dachat` | P0 | `src/app/dossiers/pouvoir-dachat/page.tsx` |
| Build `/dossiers/confiance-democratique` | P0 | `src/app/dossiers/confiance-democratique/page.tsx` |
| Build `/dossiers/dette-publique` | P1 | `src/app/dossiers/dette-publique/page.tsx` |
| Build `/dossiers/emploi-jeunesse` | P1 | `src/app/dossiers/emploi-jeunesse/page.tsx` |
| Redesign homepage | P0 | `src/app/page.tsx` |
| Update navigation | P0 | `src/app/layout.tsx` |

### Phase 3: Enhanced Profiles + Territory — ✅ COMPLETE (March 1, 2026)

**Goal**: Cross-referenced deputy profiles + rich département dashboards.

| Task | Priority | Files |
|------|----------|-------|
| Add "Transparence" tab to deputy profile | P0 | `src/app/representants/deputes/[id]/page.tsx` |
| Show conflict-of-interest cross-references | P0 | Same |
| Show lobbying activity in deputy's commission domain | P1 | Same |
| Enhanced `/territoire/[departementCode]` dashboard | P0 | `src/app/territoire/[departementCode]/page.tsx` |
| — Demographics section (StatLocale: population, age) | P0 | Same |
| — Economy section (StatLocale: income, poverty, employment) | P0 | Same |
| — Budget section (BudgetLocal for dept + top communes) | P1 | Same |
| — Representatives section (deputies + senators + elu count) | P0 | Same |
| — Culture section (museums + monuments, existing) | P1 | Same |
| Build `/territoire/[communeCode]` commune card | P2 | New page |
| Rename `/gouvernance` → `/representants` (with redirects) | P1 | Route restructure |

### Phase 4: Votes Section + Remaining Dossiers — ✅ COMPLETE (March 1, 2026)

**Goal**: Dedicated votes exploration + complete dossier coverage.

| Task | Priority | Files |
|------|----------|-------|
| Build `/votes` hub (votes by topic) | P1 | `src/app/votes/page.tsx` |
| Build `/votes/par-sujet/[tag]` | P1 | `src/app/votes/par-sujet/[tag]/page.tsx` |
| Build `/votes/mon-depute` lookup | P1 | `src/app/votes/mon-depute/page.tsx` |
| Build remaining dossiers (logement, sante, ecologie, retraites) | P2 | `src/app/dossiers/*/page.tsx` |
| Build `DeptMap` SVG component | P2 | `src/components/dept-map.tsx` |
| Build `TimelineChart` component | P2 | `src/components/timeline-chart.tsx` |

### Phase 7: Power Features — ✅ COMPLETE (March 2–3, 2026)

**Goal**: Transform the complete transparency platform into one that's searchable, personalizable, comparative, and shareable. All sub-phases independent — 5 sessions total.

| Sub-phase | Feature | Session | Routes |
|-----------|---------|---------|--------|
| **7A** | `/mon-territoire` — postal code → full civic dashboard | 14 | +1 |
| **7B** | Global search — `search_index` materialized view + `/recherche` + NavSearch | 15 | +1 |
| **7C** | `ConflictSignal` — pre-computed conflict detection (30th model) | 15 | 0 |
| **7D** | Comparison mode — `/comparer/territoires` + `/comparer/deputes` | 16 | +2 |
| **7E** | OG image templates — deputy, département, scrutin (1200×630) | 17 | +3 OG |
| **7F** | Party alignment matrix — `/votes/alignements` heat map | 17 | +1 |

**Key technical notes**:
- `search_index` is a PostgreSQL materialized view (not a Prisma model) — GIN index, `french` stemming, 6 entity types
- President static result injected in `globalSearch()` — `/president` is static, not DB-backed
- `ConflictSignal.deputeId` is `String?` — Depute.id uses PA* format, not integer
- OG images: never use remote `<img>` in satori — use initials monogram to avoid network failures
- NavSearch: always `flex` (not `hidden md:flex`), no `<form>` wrapper, pure `useRef`+`onKeyDown`
- Full detail: `arch-plan2.md`

**New npm scripts added**:
- `pnpm compute:conflicts` — populates ConflictSignal (Wave 5d)
- `pnpm refresh:search` — refreshes search_index materialized view (Wave 10)

---

### Phase 8: FranceMap Component — ✅ COMPLETE (Sessions 19–20, March 3, 2026)

**Goal**: Interactive SVG choropleth map of France integrated across territory and dossier pages.

| Sub-phase | Feature | Notes |
|-----------|---------|-------|
| **8A** | `FranceMap` component + `france-geo.ts` + `indicators.ts` + `france-map-data.ts` | Client component, hex lerp color scale, cursor tooltip |
| **8B** | Integrations: `/territoire`, 4 dossiers, `/territoire/[dept]`, `/mon-territoire` | Mini-map replaces decorative dept badge |

**Key technical notes**:
- SVG paths from `@svg-maps/france.departments` (type-cast as `SvgLocation[]`)
- Color: hex lerp across 7-stop palette, NOT CSS `color-mix`
- Tooltip follows cursor via `getBoundingClientRect`
- "Voir le tableau de bord" button hardcoded to `/territoire/[code]`, decoupled from `linkBase`
- `viewBox="0 0 613 585"`, overseas insets positioned inside SVG

---

### Phase 9: Government Profiles — 🔄 IN PROGRESS (Sessions 21–28, March 2026)

**Goal**: Full government official profiles with career timelines, interest declarations, lobby data, and judicial events.

| Sub-phase | Feature | Status | Key data |
|-----------|---------|--------|----------|
| **9A** | Schema (6 models) + government seed (~35 ministers) + basic pages | ✅ COMPLETE | 35 PersonnalitePublique, 35+ MandatGouvernemental |
| **9B** | HATVP interest declarations ingestion | ✅ COMPLETE | 184 InteretDeclare (Bayrou), 6 declarations |
| **9C** | AGORA lobby registry ingestion | ✅ COMPLETE | 94,924 ActionLobby records, 12 ministereCode values |
| **9D** | Career timeline generation + UI | ✅ COMPLETE | 17 EntreeCarriere (Bayrou: 5), vertical timeline |
| **9E** | Full profile UI — ProfileHero + ProfileTabs + all section components | ✅ COMPLETE | 3 tabs, conflict alerts, cross-links |
| **9F** | Research agent — press-sourced career + judicial events | ⏳ PENDING | |
| **9G** | President profile + historical governments | ⏳ PENDING | |

**New models (6)**: `PersonnalitePublique`, `MandatGouvernemental`, `EntreeCarriere`, `InteretDeclare`, `EvenementJudiciaire`, `ActionLobby`

**New scripts**:
- `pnpm ingest:agora` — downloads AGORA JSON, keyword-matches `reponsablesPublics` → 12 ministry codes
- `pnpm generate:carriere` — generates career timeline from structured sources (mandats + Depute/Senateur + HATVP activities)

**Key technical notes**:
- `ActionLobby` has no direct FK to `PersonnalitePublique` — join via `MandatGouvernemental.ministereCode`
- HATVP XMLs only available for current government members who filed (Bayrou confirmed; others pending)
- Career deduplication: `categorie|titre.toLowerCase()|organisation.toLowerCase()` key
- `EvenementJudiciaire.verifie` guard — NEVER display without `verifie = true`
- AGORA ministry matching: normalize (lowercase + strip accents) → ordered keyword list, most-specific first

---

### Phase 5: Polish + Additional Data — ✅ COMPLETE (March 1, 2026)

**Goal**: Additional data sources, performance, accessibility.

| Task | Priority | Files |
|------|----------|-------|
| Ingest crime statistics (SSMSI) | P2 | `scripts/ingest-criminalite.ts` |
| Ingest medical density (DREES) | P2 | `scripts/ingest-medecins.ts` |
| Add `StatCriminalite` model | P2 | `prisma/schema.prisma` |
| Add `DensiteMedicale` model | P2 | `prisma/schema.prisma` |
| Performance optimization (ISR, caching) | P1 | Various |
| SEO: metadata, OG tags per dossier | P1 | Various |
| Accessibility audit (RGAA compliance) | P1 | Various |
| Mobile responsiveness pass | P1 | Various |
| Update all documentation | P0 | `CLAUDE.md`, `documentation/*.md` |

---

## 12. Technical Specifications

### INSEE Données Locales API Integration

```typescript
// scripts/lib/insee-client.ts

const INSEE_API_BASE = "https://api.insee.fr/donnees-locales/V0.1";
const INSEE_API_KEY = process.env.INSEE_API_KEY; // from portail-api.insee.fr

interface InseeLocalResponse {
  Cellule: Array<{
    Zone: { "@codgeo": string; "@nivgeo": string };
    Mesure: { "@code": string; "@valeur": string };
    Modalite: Array<{ "@code": string; "@variable": string }>;
  }>;
}

// Rate limiter: 30 req/min
async function fetchInseeLocal(
  cube: string,
  geo: string, // "DEP-75" or "COM-75056"
  modalites?: Record<string, string>
): Promise<InseeLocalResponse> {
  // Implementation with rate limiting + retry
}
```

### Vote Classification Script

```typescript
// scripts/tag-scrutins.ts

const TAG_RULES: Record<string, string[]> = {
  budget: ["budget", "finances publiques", "loi de finances", "PLF", "PLFSS"],
  fiscalite: ["impôt", "taxe", "fiscal", "TVA", "CSG", "prélèvement"],
  sante: ["santé", "hôpital", "médecin", "PLFSS", "sécurité sociale"],
  logement: ["logement", "habitat", "HLM", "loyer", "hébergement"],
  retraites: ["retraite", "pension", "cotisation vieillesse"],
  education: ["éducation", "enseignement", "école", "université"],
  securite: ["sécurité", "police", "gendarmerie", "justice", "pénal"],
  immigration: ["immigration", "étranger", "asile", "séjour"],
  ecologie: ["climat", "environnement", "énergie", "carbone", "biodiversité"],
  travail: ["emploi", "travail", "chômage", "formation professionnelle"],
  defense: ["défense", "armée", "militaire", "OPEX"],
  agriculture: ["agriculture", "PAC", "rural", "alimentaire"],
};

// For each Scrutin, match titre against keywords → upsert ScrutinTag
// Multi-word matches get confidence 1.0, single-word 0.7
```

### Département Dashboard Data Loading

```typescript
// src/app/territoire/[departementCode]/page.tsx — enhanced

async function getDepartementData(code: string) {
  const [
    dept, communes, deputes, senateurs, elus,
    stats, budget, musees, monuments, recentVotes
  ] = await Promise.all([
    prisma.departement.findUnique({ where: { code }, include: { region: true } }),
    prisma.commune.count({ where: { departementCode: code, typecom: "COM" } }),
    prisma.depute.findMany({ where: { departementRefCode: code, actif: true } }),
    prisma.senateur.findMany({ where: { departementCode: code, actif: true } }),
    prisma.elu.count({ where: { codeDepartement: code } }),
    prisma.statLocale.findMany({ where: { geoCode: code, geoType: "DEP" } }),
    prisma.budgetLocal.findMany({
      where: { geoCode: code, geoType: "DEP" },
      orderBy: { annee: "desc" },
      take: 5,
    }),
    prisma.musee.count({ where: { departementCode: code } }),
    prisma.monument.count({ where: { departementCode: code } }),
    // Recent votes by this dept's deputies
    prisma.voteRecord.findMany({
      where: { depute: { departementRefCode: code } },
      orderBy: { scrutin: { dateScrutin: "desc" } },
      take: 10,
      include: { scrutin: true },
    }),
  ]);

  return { dept, communes, deputes, senateurs, elus, stats, budget, musees, monuments, recentVotes };
}
```

### Dossier Page Data Loading Pattern

```typescript
// src/app/dossiers/pouvoir-dachat/page.tsx — example

async function getPouvoirDachatData() {
  const [
    indicators, localStats, taggedVotes, lobbyActions, declarations
  ] = await Promise.all([
    // National indicators: GDP, unemployment, inflation, wages
    prisma.indicateur.findMany({
      where: { domaine: { in: ["pib", "emploi", "prix", "salaires"] } },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 20 } },
    }),

    // Departement-level median income ranking
    prisma.statLocale.findMany({
      where: { indicateur: "MEDIAN_INCOME", geoType: "DEP", annee: 2022 },
      orderBy: { valeur: "asc" },
    }),

    // Parliamentary votes on budget/fiscal topics
    prisma.scrutin.findMany({
      where: { tags: { some: { tag: { in: ["budget", "fiscalite"] } } } },
      include: {
        groupeVotes: { include: { organe: true } },
        tags: true,
      },
      orderBy: { dateScrutin: "desc" },
      take: 20,
    }),

    // Lobbying actions in economic/fiscal domain
    prisma.actionLobbyiste.findMany({
      where: {
        OR: [
          { domaine: { contains: "fiscal" } },
          { domaine: { contains: "économi" } },
          { domaine: { contains: "budget" } },
        ],
      },
      include: { lobbyiste: true },
      take: 50,
    }),

    // Deputies with financial interests in relevant sectors
    prisma.declarationInteret.findMany({
      where: {
        totalParticipations: { gt: 0 },
        typeMandat: { in: ["Député", "Sénateur"] },
      },
      include: { participations: true },
      orderBy: { totalParticipations: "desc" },
      take: 20,
    }),
  ]);

  return { indicators, localStats, taggedVotes, lobbyActions, declarations };
}
```

### Performance Considerations

| Concern | Strategy |
|---------|----------|
| **StatLocale table size** | ~100K rows (101 depts × 7 indicators × ~10 years + communes). Index on `(indicateur, geoType, geoCode)`. |
| **BudgetLocal table size** | ~500K rows (36K communes × ~15 years). Index on `(geoType, geoCode, annee)`. |
| **ScrutinTag joins** | Small table (<10K rows). Composite index on `(tag, scrutinId)`. |
| **Cross-reference queries** | Server-side only, no client fetching. Use Prisma `include` with `take` limits. |
| **INSEE API rate limiting** | 30 req/min. Batch ingestion with delay. Cache locally in DB, never query live. |
| **Large list pages (Elu: 593K)** | Already paginated (40/page). Add département pre-filter for faster queries. |
| **Homepage data freshness** | Use Next.js ISR (`revalidate: 3600`) for homepage, dossiers. Dynamic for profiles. |

### File Structure (New/Modified)

```
data-gouv/
├── prisma/
│   ├── schema.prisma                    # +4 models (StatLocale, BudgetLocal, ScrutinTag, ...)
│   └── migrations/                      # New migration
├── scripts/
│   ├── ingest.ts                        # +Wave 5c (tagScrutins) + Wave 8 (INSEE, budgets)
│   ├── ingest-economie.ts              # EXPANDED (15+ indicators)
│   ├── ingest-insee-local.ts           # NEW — INSEE Données Locales API
│   ├── ingest-budgets.ts              # NEW — DGFIP local finance CSVs
│   ├── tag-scrutins.ts                # NEW — keyword classify scrutin titles
│   ├── ingest-criminalite.ts          # NEW (Phase 5) — SSMSI data
│   ├── ingest-medecins.ts            # NEW (Phase 5) — medical density
│   └── lib/
│       ├── api-client.ts              # Existing
│       └── insee-client.ts            # NEW — INSEE API wrapper with rate limiting
├── src/
│   ├── app/
│   │   ├── page.tsx                   # REDESIGNED homepage
│   │   ├── layout.tsx                 # Updated nav (7 links)
│   │   ├── dossiers/                  # NEW SECTION
│   │   │   ├── page.tsx               # Dossier hub (8 issue cards)
│   │   │   ├── pouvoir-dachat/
│   │   │   │   └── page.tsx
│   │   │   ├── confiance-democratique/
│   │   │   │   └── page.tsx
│   │   │   ├── dette-publique/
│   │   │   │   └── page.tsx
│   │   │   ├── emploi-jeunesse/
│   │   │   │   └── page.tsx
│   │   │   ├── logement/
│   │   │   │   └── page.tsx
│   │   │   ├── sante/
│   │   │   │   └── page.tsx
│   │   │   ├── transition-ecologique/
│   │   │   │   └── page.tsx
│   │   │   └── retraites/
│   │   │       └── page.tsx
│   │   ├── representants/             # RENAMED from /gouvernance
│   │   │   ├── page.tsx               # Enhanced hub
│   │   │   ├── deputes/               # Enhanced with cross-refs
│   │   │   ├── senateurs/
│   │   │   ├── elus/
│   │   │   ├── lobbyistes/
│   │   │   ├── scrutins/
│   │   │   └── partis/
│   │   ├── votes/                     # NEW SECTION
│   │   │   ├── page.tsx               # Votes by topic hub
│   │   │   ├── par-sujet/
│   │   │   │   └── [tag]/
│   │   │   │       └── page.tsx
│   │   │   └── mon-depute/
│   │   │       └── page.tsx
│   │   ├── territoire/                # ENHANCED
│   │   │   ├── page.tsx               # Existing
│   │   │   ├── [departementCode]/     # MAJOR enhancement
│   │   │   │   └── page.tsx
│   │   │   └── [communeCode]/         # NEW
│   │   │       └── page.tsx
│   │   ├── economie/                  # Enhanced (15+ indicators)
│   │   ├── patrimoine/                # Unchanged
│   │   └── elections/                 # Unchanged
│   ├── components/
│   │   ├── dossier-hero.tsx           # NEW
│   │   ├── dossier-nav.tsx            # NEW
│   │   ├── indicator-card.tsx         # NEW
│   │   ├── topic-vote-list.tsx        # NEW
│   │   ├── lobbying-density.tsx       # NEW
│   │   ├── conflict-alert.tsx         # NEW
│   │   ├── ranking-table.tsx          # NEW
│   │   ├── dept-lookup.tsx            # NEW
│   │   ├── dept-map.tsx               # NEW (Phase 4)
│   │   ├── timeline-chart.tsx         # NEW (Phase 4)
│   │   ├── profile-hero.tsx           # Enhanced (conflict badges)
│   │   ├── profile-tabs.tsx           # Existing
│   │   ├── page-header.tsx            # Existing
│   │   ├── search-input.tsx           # Existing
│   │   ├── pagination.tsx             # Existing
│   │   ├── avatar.tsx                 # Existing
│   │   ├── score-gauge.tsx            # Existing
│   │   ├── score-bar.tsx              # Existing
│   │   ├── vote-badge.tsx             # Existing
│   │   ├── scrutin-result-badge.tsx   # Existing
│   │   ├── stat-card.tsx              # Existing
│   │   └── declaration-section.tsx    # Existing
│   └── lib/
│       ├── db.ts                      # Existing
│       ├── format.ts                  # Existing
│       ├── nuance-colors.ts           # Existing
│       └── dossier-config.ts          # NEW — dossier metadata, tags, colors
└── documentation/
    ├── ARCHITECTURAL-PLAN.md          # THIS FILE
    ├── frontend.md                    # Updated
    ├── schema.md                      # Updated
    └── handoff.md                     # Updated
```

---

## Appendix A: Data Source URLs

| Source | URL | Format | Auth |
|--------|-----|--------|------|
| INSEE BDM | `https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}` | XML/SDMX | None |
| INSEE Mélodi (Données Locales) | `https://api.insee.fr/melodi/data/{id}/to-csv?GEO=DEP-{code}` | CSV | **None** |
| INSEE Métadonnées | `https://api.insee.fr/metadonnees/V1/` | JSON | API key |
| DGFIP Finances Locales | `https://data.gouv.fr/datasets/comptes-individuels-des-communes/` | CSV | None |
| SSMSI Crime Stats | `https://www.data.gouv.fr/datasets/bases-statistiques-communale-et-departementale-de-la-delinquance/` | CSV | None |
| DREES Medical Density | `https://data.drees.solidarites-sante.gouv.fr/` | CSV | None |
| data.gouv.fr MCP | `https://mcp.data.gouv.fr/mcp` | MCP | None |

## Appendix B: Key References

- [Ipsos Fractures Françaises 2025](https://www.ipsos.com/fr-fr/fractures-francaises-2025)
- [CEVIPOF Baromètre de Confiance Vague 16](https://www.sciencespo.fr/cevipof/)
- [Gallup — France's Political Crisis](https://news.gallup.com/poll/700160/france-political-crisis-rattles-trust-institutions.aspx)
- [Transparency International CPI 2025](https://transparency-france.org/2026/02/10/communique-indice-de-perception-2025/)
- [INSEE API Catalogue](https://www.insee.fr/fr/information/8184146)
- [Finances Locales Open Data](https://www.collectivites-locales.gouv.fr/finances-locales/open-data)
- [data.gouv.fr Comptes Publics](https://www.data.gouv.fr/pages/donnees_comptes-publics)
- [France OGP Action Plan 2024-2026](https://www.opengovpartnership.org/wp-content/uploads/2024/01/France_Action-Plan_2023-2025_December_EN.pdf)

## Appendix C: Estimated Final Scale

| Metric | Original baseline | Target (plan) | **Actual (Phase 7 complete)** |
|--------|------------------|---------------|-------------------------------|
| Prisma models | 22 + IngestionLog | 26-28 + IngestionLog | **38 + IngestionLog** |
| Total rows | ~800K | ~1.5-2M | **~800K+ (ingestion scripts ready for more)** |
| Routes | 22 | ~40 | **61 + 5 OG endpoints** |
| Components | 12 | ~22 | **39 (12 client components)** |
| Ingestion scripts | 16 | 20-22 | **20** |
| Data sources | 7 | 10+ | **10 (+ INSEE Local, DGFIP, SSMSI, DREES)** |
| Nav sections | 6 | 7 | **7** |
| Dossiers | 0 | 8 | **8** |
| Cross-references | 0 | 5 systemic | **5+ (ConflictSignal pre-computed, alignment matrix, lobbying × votes)** |
| Search | None | Not in original plan | **Global full-text search (materialized view + GIN index)** |
| Comparison | None | Not in original plan | **Territoire + deputy side-by-side comparison** |
| Social sharing | None | Not in original plan | **OG images for 3 entity types** |
| Civic dashboard | None | Not in original plan | **`/mon-territoire` postal code dashboard** |

---

*This document is the single source of truth for the platform's evolution. Update it as decisions are made and phases are completed.*
