# Phase 7 — Power Features Implementation Plan

> For: L'Observatoire Citoyen data-gouv platform
> Created: March 2, 2026
> Depends on: Phases 1–6 complete (29 models, 52 routes, 800K+ rows)
> Estimated effort: 5–6 sessions
> **7A shipped: Session 14 (Mar 2, 2026) — 53 routes**

---

## Overview

Phase 7 transforms data-gouv from a complete transparency platform into one that's **searchable, personalizable, comparative, and shareable**. Every sub-phase builds on existing models and patterns — no new data sources required.

| Sub-phase | Feature | Effort | New Routes | Dependencies |
|-----------|---------|--------|------------|--------------|
| **7A** ✅ | `/mon-territoire` — postal code civic dashboard | 1 session | 1 | None |
| **7B** | Global search — materialized view + `/recherche` | 1 session | 1 | None |
| **7C** | `ConflictSignal` — pre-computed conflict detection | 1 session | 0 (enhances existing) | None |
| **7D** | Comparison mode — territoires + députés | 1 session | 2 | 7A (layout pattern) |
| **7E** | OG image templates — social sharing cards | 0.5 session | 0 (image routes) | None |
| **7F** | Party alignment matrix — `/votes/alignements` | 0.5 session | 1 | None |

**Total**: ~5 sessions, +5 routes, +1 model, +1 materialized view, +6 files

Sub-phases are independent unless noted. Recommended order: 7A → 7B → 7C → 7D → 7E → 7F.

---

## Sub-phase 7A: `/mon-territoire` — One-Input Civic Dashboard ✅ DONE (Session 14, Mar 2, 2026)

**Shipped**: `src/app/mon-territoire/page.tsx` (3-state: empty → disambiguation → dashboard), `src/lib/postal-resolver.ts`, `src/data/postal-codes.json` (6,328 postal codes, La Poste Hexasmal). Homepage CTA added below DeptLookup in `src/app/page.tsx`.

**Implementation notes**:
- `Commune` has no postal code field — static JSON lookup from La Poste Hexasmal used instead
- ARM communes (Paris 75001–75020, Lyon, Marseille) resolved to parent COM via `Commune.comparent`
- `DensiteMedicale` field is `specialite` (not `profession` as written below)
- `{ prisma }` is a named export from `@/lib/db` — not a default export
- `SearchInput` supports `paramName` prop — used with `paramName="cp"` for postal input

**Goal**: A single page where a user enters a postal code and gets their complete civic picture — representatives, budget, economy, health, security — all on one screen.

**Why first**: This is the product's clearest "aha moment" and the direct precursor to ZYKAY scope-based personalization. It also exercises every data layer built in Phases 1–6.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Create postal code → commune resolver utility | `src/lib/postal-resolver.ts` | P0 |
| 2 | Build `/mon-territoire` page (server component) | `src/app/mon-territoire/page.tsx` | P0 |
| 3 | Add nav link or homepage CTA | `src/app/layout.tsx` or `src/app/page.tsx` | P1 |
| 4 | Add `generateMetadata` for SEO | Same page file | P1 |

### 1. Postal code resolver (`src/lib/postal-resolver.ts`)

The `Commune` model has `codePostal` (or can be mapped from INSEE code). We need a function that:

```typescript
// src/lib/postal-resolver.ts

import prisma from "@/lib/db";

export interface ResolvedTerritory {
  commune: { code: string; libelle: string; population: number | null };
  departementCode: string;
  departementLibelle: string;
  regionCode: string;
  regionLibelle: string;
}

/**
 * Resolve a postal code to commune(s) + département + région.
 * Many postal codes map to multiple communes — return all matches.
 * Falls back to département code if only 2 digits entered.
 */
export async function resolvePostalCode(input: string): Promise<ResolvedTerritory[]> {
  const cleaned = input.trim().replace(/\s/g, "");

  // If 2-digit input, treat as département code
  if (cleaned.length === 2) {
    // Return the département directly
  }

  // If 5-digit input, look up by codesPostaux field
  if (cleaned.length === 5) {
    // Commune.codesPostaux contains the postal code
    // Join to Departement + Region for full context
  }

  return [];
}
```

**Key decision**: Check how postal codes are stored in the current `Commune` model. If there's no `codePostal` field, the INSEE commune code's first 2 digits give the département, and we can use a static postal code → commune mapping file from data.gouv.fr (`base-officielle-codes-postaux`). Alternatively, query the API Geo at build time.

**Recommended approach**: Ingest the official postal code CSV from data.gouv.fr (`laposte_hexasmal.csv`) into a lightweight lookup table or JSON file:

```typescript
// Alternative: static JSON mapping (no new model needed)
// Download once: https://datanova.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/lines
// Save as src/data/postal-codes.json — ~39K entries
// Structure: { "75001": ["75056"], "75002": ["75056"], "13001": ["13055"], ... }
```

### 2. `/mon-territoire` page structure

**URL pattern**: `/mon-territoire?cp=75011` (postal code as URL param, like `/votes/mon-depute?q=`)

**Three states** (same pattern as `/votes/mon-depute`):

1. **Empty state** — postal code input prompt with `DeptLookup`-style search
2. **Disambiguation** — if postal code maps to multiple communes, show picker
3. **Full dashboard** — the civic profile

**Dashboard sections** (all existing queries, composed):

```
┌─────────────────────────────────────────────────────────────┐
│  MON TERRITOIRE                                             │
│  [Commune name], [Département] — [Région]                   │
│  Population: X · Code postal: XXXXX                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▎ MES REPRÉSENTANTS                                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Député(s)     │ │ Sénateur(s)  │ │ Maire        │        │
│  │ Photo + name  │ │ Photo + name │ │ Name + party │        │
│  │ Participation │ │ Commission   │ │ Since year   │        │
│  │ Conflict ⚠️   │ │              │ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  → Conseillers municipaux: N · Conseillers dept: N          │
│                                                             │
│  ▎ ÉCONOMIE LOCALE                                          │
│  StatLocale for this département:                           │
│  Revenu médian · Taux de pauvreté · Taux de chômage        │
│  Comparison to national average (↑/↓ arrows)                │
│                                                             │
│  ▎ BUDGET COMMUNAL                                          │
│  BudgetLocal for this commune (if available):               │
│  Dépenses/hab · Dette/hab · Recettes · Investissement       │
│  Or: BudgetLocal for département if commune not available   │
│                                                             │
│  ▎ SANTÉ & SÉCURITÉ                                         │
│  DensiteMedicale: GP density for département                │
│  StatCriminalite: crime rate for département                │
│  Comparison to national average                             │
│                                                             │
│  ▎ COMMENT VOTENT MES DÉPUTÉS                               │
│  Last 5 votes by this département's deputies                │
│  Vote position + scrutin title + result badge               │
│  Tag breakdown (ScrutinTag groupBy for their votes)         │
│                                                             │
│  ▎ PATRIMOINE LOCAL                                         │
│  Musée count · Monument count for département               │
│  Top 3 musées by fréquentation                              │
│                                                             │
│  ▎ EXPLORER PLUS                                            │
│  → Tableau de bord du département [code]                    │
│  → Fiche commune [name]                                     │
│  → Tous les élus de [commune]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Data loading function

```typescript
async function getMonTerritoireData(communeCode: string, deptCode: string) {
  const [
    commune, dept,
    deputes, senateurs, maire, eluCount,
    stats, budgetCommune, budgetDept,
    densiteMed, criminalite,
    recentVotes, musees, monuments
  ] = await Promise.all([
    prisma.commune.findUnique({ where: { code: communeCode } }),
    prisma.departement.findUnique({ where: { code: deptCode }, include: { region: true } }),
    prisma.depute.findMany({ where: { departementRefCode: deptCode, actif: true },
      include: { voteRecords: { take: 1 } } }), // just to check participation
    prisma.senateur.findMany({ where: { departementCode: deptCode, actif: true } }),
    prisma.elu.findFirst({ where: { codeCommune: communeCode, fonction: { startsWith: "Maire" } } }),
    prisma.elu.count({ where: { codeCommune: communeCode } }),
    prisma.statLocale.findMany({ where: { geoCode: deptCode, geoType: "DEP" } }),
    prisma.budgetLocal.findFirst({ where: { geoCode: communeCode, geoType: "COM" },
      orderBy: { annee: "desc" } }),
    prisma.budgetLocal.findFirst({ where: { geoCode: deptCode, geoType: "DEP" },
      orderBy: { annee: "desc" } }),
    prisma.densiteMedicale.findFirst({ where: { geoCode: deptCode, geoType: "DEP",
      profession: "MG" }, orderBy: { annee: "desc" } }),
    prisma.statCriminalite.findMany({ where: { codeDepartement: deptCode },
      orderBy: { annee: "desc" }, take: 8 }),
    prisma.voteRecord.findMany({
      where: { depute: { departementRefCode: deptCode } },
      orderBy: { scrutin: { dateScrutin: "desc" } },
      take: 10,
      include: { scrutin: { include: { tags: true } }, depute: true },
    }),
    prisma.musee.findMany({ where: { departementCode: deptCode }, take: 3,
      orderBy: { frequentations: { _count: "desc" } } }),
    prisma.monument.count({ where: { departementCode: deptCode } }),
  ]);

  return { commune, dept, deputes, senateurs, maire, eluCount,
           stats, budgetCommune, budgetDept, densiteMed, criminalite,
           recentVotes, musees, monuments };
}
```

### 4. ZYKAY integration note

This page is architecturally identical to what the ZK-personalized version will be. The only difference:
- **Now**: user types postal code → resolve commune → query
- **Later**: ZYKAY widget presents proof → verify Groth16 → extract `commune` public signal → same query

The page component doesn't change. Only the input method does.

### Acceptance criteria

- [ ] Postal code input on `/mon-territoire` resolves to commune(s)
- [ ] Multi-commune disambiguation works (e.g., "13001" → Marseille)
- [ ] Full dashboard renders with all sections populated
- [ ] National averages shown for comparison where available
- [ ] Links to existing detail pages (`/territoire/[dept]`, `/territoire/commune/[code]`, deputy profiles)
- [ ] `generateMetadata` with commune/dept name
- [ ] Mobile responsive (single column on small screens)
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 7B: Global Search

**Goal**: One search bar in the navbar that searches across all 800K+ rows. Users can find any deputy, senator, lobbyist, scrutin, commune, or party from a single input.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Create PostgreSQL materialized view + GIN index | `prisma/migrations/` (raw SQL) | P0 |
| 2 | Create search query utility | `src/lib/search.ts` | P0 |
| 3 | Build `/recherche` results page | `src/app/recherche/page.tsx` | P0 |
| 4 | Add search input to navbar | `src/app/layout.tsx` | P1 |
| 5 | Add refresh command to ingestion orchestrator | `scripts/ingest.ts` | P2 |

### 1. Materialized view (raw SQL migration)

Prisma doesn't support materialized views natively. Use a raw SQL migration:

```sql
-- prisma/migrations/YYYYMMDD_add_search_index/migration.sql

CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS

-- Deputies
SELECT
  'depute' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  nom || ' ' || prenom AS title,
  'Député · ' || COALESCE("groupePolitique", '') AS subtitle,
  '/representants/deputes/' || id AS url,
  to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE("groupePolitique", '')) AS search_vector
FROM "Depute"

UNION ALL

-- Senators
SELECT
  'senateur', CAST(id AS TEXT),
  nom || ' ' || prenom,
  'Sénateur · ' || COALESCE("groupePolitique", ''),
  '/representants/senateurs/' || id,
  to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE("groupePolitique", ''))
FROM "Senateur"

UNION ALL

-- Lobbyists
SELECT
  'lobbyiste', CAST(id AS TEXT),
  nom,
  'Lobbyiste · ' || COALESCE(categorie, ''),
  '/representants/lobbyistes/' || id,
  to_tsvector('french', nom || ' ' || COALESCE(categorie, ''))
FROM "Lobbyiste"

UNION ALL

-- Scrutins
SELECT
  'scrutin', CAST(id AS TEXT),
  titre,
  CASE WHEN "sortCode" = 'adopté' THEN 'Adopté' ELSE 'Rejeté' END
    || ' · ' || TO_CHAR("dateScrutin", 'DD/MM/YYYY'),
  '/gouvernance/scrutins/' || id,
  to_tsvector('french', titre)
FROM "Scrutin"

UNION ALL

-- Communes (COM only)
SELECT
  'commune', code,
  libelle,
  'Commune · ' || "departementCode",
  '/territoire/commune/' || code,
  to_tsvector('french', libelle)
FROM "Commune"
WHERE typecom = 'COM'

UNION ALL

-- Parties
SELECT
  'parti', CAST(id AS TEXT),
  nom,
  'Parti politique',
  '/representants/partis/' || id,
  to_tsvector('french', nom)
FROM "PartiPolitique";

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_search_index_vector
  ON search_index USING gin(search_vector);

-- B-tree index for entity_type filtering
CREATE INDEX IF NOT EXISTS idx_search_index_type
  ON search_index (entity_type);
```

**Refresh strategy**: Run `REFRESH MATERIALIZED VIEW search_index;` at the end of each `pnpm ingest` run. Add to orchestrator as final step.

### 2. Search utility (`src/lib/search.ts`)

```typescript
import prisma from "@/lib/db";

export interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

export async function globalSearch(
  query: string,
  limit = 20,
  entityType?: string
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const typeFilter = entityType ? `AND entity_type = '${entityType}'` : "";

  const results = await prisma.$queryRawUnsafe<SearchResult[]>(`
    SELECT
      entity_type AS "entityType",
      entity_id AS "entityId",
      title,
      subtitle,
      url,
      ts_rank(search_vector, plainto_tsquery('french', $1)) AS rank
    FROM search_index
    WHERE search_vector @@ plainto_tsquery('french', $1)
    ${typeFilter}
    ORDER BY rank DESC
    LIMIT $2
  `, query, limit);

  return results;
}
```

### 3. `/recherche` page

**URL**: `/recherche?q=macron&type=depute`

**Layout**:
- Search input (pre-filled from URL param `q`)
- Entity type filter pills: Tous | Députés | Sénateurs | Lobbyistes | Scrutins | Communes | Partis
- Results list with entity icon, title, subtitle, link
- "Aucun résultat" empty state

**Pattern**: Same URL-driven approach as `/votes/mon-depute` — `SearchInput` updates `?q=`, server component re-renders.

### 4. Navbar search

Add a compact `SearchInput` to the navbar that redirects to `/recherche?q={input}` on submit. On mobile, this could be an icon that expands.

### Acceptance criteria

- [ ] Materialized view created with all 6 entity types
- [ ] GIN index enables sub-100ms search on 800K+ rows
- [ ] `/recherche` page renders results grouped by entity type
- [ ] Entity type filter works via URL param
- [ ] Navbar search input redirects to `/recherche`
- [ ] French-language stemming works (e.g., "écologique" matches "écologie")
- [ ] `REFRESH MATERIALIZED VIEW` added to ingest orchestrator
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 7C: `ConflictSignal` — Pre-computed Conflict Detection

**Goal**: Materialize all conflict-of-interest signals into a dedicated table so they can be surfaced instantly on homepage, dossier pages, territory dashboards, and deputy profiles without expensive joins.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Add `ConflictSignal` model to Prisma schema | `prisma/schema.prisma` | P0 |
| 2 | Run migration | `prisma/migrations/` | P0 |
| 3 | Create computation script | `scripts/compute-conflicts.ts` | P0 |
| 4 | Add to orchestrator (after `tag-scrutins`) | `scripts/ingest.ts` | P1 |
| 5 | Integrate into homepage (Alertes Transparence) | `src/app/page.tsx` | P1 |
| 6 | Integrate into dossier pages | `src/app/dossiers/*/page.tsx` | P2 |
| 7 | Replace live computation on Transparence tab | `src/app/representants/deputes/[id]/page.tsx` | P2 |

### 1. Model

```prisma
model ConflictSignal {
  id                    String   @id @default(cuid())
  // Who
  nom                   String
  prenom                String
  typeMandat            String   // "Député", "Sénateur"
  deputeId              Int?     // FK when available
  // What sector
  secteurDeclaration    String   // sector from ParticipationFinanciere
  participationCount    Int      // how many participations in this sector
  totalMontant          Float?   // estimated value if available
  // How they voted on related topics
  tag                   String   // ScrutinTag matching this sector
  voteCount             Int      // total votes on this tag's scrutins
  votePour              Int
  voteContre            Int
  voteAbstention        Int
  // Metadata
  lastScrutinDate       DateTime?
  computedAt            DateTime @default(now())

  @@unique([nom, prenom, typeMandat, secteurDeclaration, tag])
  @@index([typeMandat])
  @@index([tag])
  @@index([deputeId])
  @@index([participationCount(sort: Desc)])
}
```

### 2. Sector → Tag mapping

```typescript
// scripts/lib/sector-tag-map.ts

// Maps ParticipationFinanciere sector keywords to ScrutinTag tags
export const SECTOR_TO_TAGS: Record<string, string[]> = {
  // Financial sector
  "banque|bancaire|crédit|financ": ["budget", "fiscalite"],
  // Energy
  "énergie|énergétique|pétrole|gaz|nucléaire|électri": ["ecologie", "budget"],
  // Health / Pharma
  "santé|pharma|médic|hôpital|clinique|laboratoire": ["sante"],
  // Real estate
  "immobili|foncier|logement|construction|BTP": ["logement", "budget"],
  // Agriculture
  "agri|alimenta|agroalimentaire": ["agriculture"],
  // Insurance
  "assurance|mutuel|prévoyance": ["sante", "budget"],
  // Defense
  "défense|armement|militaire|sécurité": ["defense", "securite"],
  // Telecom / Tech
  "télécom|numérique|technolog|informatique": ["budget"],
  // Transport
  "transport|autoroute|aérien|ferroviaire|SNCF": ["ecologie", "budget"],
};

export function matchSectorToTags(sectorDescription: string): string[] {
  const lower = sectorDescription.toLowerCase();
  const matched: string[] = [];
  for (const [pattern, tags] of Object.entries(SECTOR_TO_TAGS)) {
    if (new RegExp(pattern, "i").test(lower)) {
      matched.push(...tags);
    }
  }
  return [...new Set(matched)];
}
```

### 3. Computation script

```typescript
// scripts/compute-conflicts.ts

// For each DeclarationInteret with participations:
//   1. Get all ParticipationFinanciere records
//   2. For each participation, extract sector → map to ScrutinTag tags
//   3. For each tag, count VoteRecord entries for this person
//   4. Upsert ConflictSignal

// Run after tag-scrutins in orchestrator
// Idempotent: uses upsert on unique constraint
```

**Algorithm pseudocode**:

```
declarations = findMany DeclarationInteret WHERE totalParticipations > 0
  INCLUDE participations

for each declaration:
  sectors = group participations by sector description
  for each sector:
    tags = matchSectorToTags(sector)
    for each tag:
      if typeMandat == "Député":
        votes = count VoteRecord WHERE depute.nom+prenom match
          AND scrutin.tags contains tag
        GROUP BY position (pour/contre/abstention)
      upsert ConflictSignal
```

### 4. Integration points

**Homepage** (`src/app/page.tsx` — "Alertes Transparence" section):
```typescript
const topConflicts = await prisma.conflictSignal.findMany({
  where: { voteCount: { gt: 0 }, participationCount: { gt: 0 } },
  orderBy: { participationCount: "desc" },
  take: 5,
});
// Render as amber ConflictAlert cards
```

**Dossier pages** (e.g., `/dossiers/sante`):
```typescript
const healthConflicts = await prisma.conflictSignal.findMany({
  where: { tag: "sante", voteCount: { gt: 0 } },
  orderBy: { participationCount: "desc" },
  take: 10,
});
```

**Deputy profile** (replace live computation):
```typescript
const conflicts = await prisma.conflictSignal.findMany({
  where: { deputeId: deputy.id },
});
```

### Acceptance criteria

- [ ] `ConflictSignal` model migrated and populated
- [ ] Script runs in < 60 seconds
- [ ] Homepage shows top 5 conflict signals
- [ ] At least one dossier page shows domain-filtered conflicts
- [ ] Deputy Transparence tab reads from `ConflictSignal` instead of live joins
- [ ] Script added to orchestrator (Wave 5d, after `tagScrutins`)
- [ ] `pnpm compute:conflicts` npm script added
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 7D: Comparison Mode

**Goal**: Side-by-side comparison of two territoires or two députés. Uses existing queries, new layout.

**Depends on**: 7A (reuses dashboard section patterns)

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Build `/comparer/territoires` page | `src/app/comparer/territoires/page.tsx` | P0 |
| 2 | Build `/comparer/deputes` page | `src/app/comparer/deputes/page.tsx` | P0 |
| 3 | Create `ComparisonLayout` helper component | `src/components/comparison-layout.tsx` | P0 |
| 4 | Create `DeltaBadge` component (↑↓ with %) | `src/components/delta-badge.tsx` | P1 |
| 5 | Add comparison links on existing pages | Various detail pages | P2 |

### 1. `/comparer/territoires?a=75&b=13`

**URL params**: `a` and `b` are département codes. If missing, show picker.

**Three states**:
1. **No params** — two département search inputs side by side
2. **One param** — one column populated, second input empty
3. **Both params** — full comparison

**Comparison sections** (parallel queries for each dept):

| Section | Data Source | Display |
|---------|-----------|---------|
| Identité | `Departement` + `Region` | Name, region, commune count |
| Population | `StatLocale` (POP_TOTAL) | Number + delta |
| Économie | `StatLocale` (MEDIAN_INCOME, POVERTY_RATE, UNEMPLOYMENT) | Side-by-side with highlighting |
| Budget | `BudgetLocal` (DEP) | Dépenses/hab, dette/hab, recettes |
| Santé | `DensiteMedicale` (MG) | GP density + delta |
| Sécurité | `StatCriminalite` | Crime rate + delta |
| Représentation | `Depute`, `Senateur`, `Elu` count | Counts + participation averages |
| Patrimoine | `Musee` count, `Monument` count | Counts |

**Delta highlighting**: When comparing, highlight the "better" value in teal and the "worse" in rose (for metrics where direction is clear, like poverty rate lower = better). Use `DeltaBadge` component.

### 2. `/comparer/deputes?a=PA123&b=PA456`

**URL params**: `a` and `b` are deputy IDs (or slugs).

**Comparison sections**:

| Section | Data Source | Display |
|---------|-----------|---------|
| Identité | `Depute` | Photo, name, party, département |
| Participation | `Depute.scoreParticipation` | Score + delta |
| Votes par thème | `VoteRecord` + `ScrutinTag` groupBy | Bar chart side-by-side per tag |
| Déclarations | `DeclarationInteret` | Participation count, total revenus |
| Conflits | `ConflictSignal` (if 7C done) | Conflict count + details |
| Déports | `Deport` count | Recusal count |
| Derniers votes | Last 10 `VoteRecord` | Position comparison on same scrutins |

**Shared votes highlight**: When both deputies voted on the same scrutin, show their positions side by side with agreement/disagreement indicator.

### 3. `ComparisonLayout` component

```typescript
// src/components/comparison-layout.tsx

interface ComparisonLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  label: string;
}

// Renders a section with label + two columns
// On mobile: stacked (left then right)
// On desktop: side-by-side with center divider
```

### 4. Entry points

Add "Comparer" buttons/links on:
- `/territoire/[dept]` → "Comparer avec un autre département"
- `/representants/deputes/[id]` → "Comparer avec un autre député"
- Homepage DeptLookup → option to enter two codes

### Acceptance criteria

- [ ] `/comparer/territoires` with two département codes shows full comparison
- [ ] `/comparer/deputes` with two deputy IDs shows full comparison
- [ ] Delta highlighting works (teal = better, rose = worse)
- [ ] Picker state works when 0 or 1 param provided
- [ ] Responsive: stacks on mobile
- [ ] Links from existing detail pages work
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 7E: Dynamic OG Image Templates

**Goal**: When someone shares a link on social media, the preview card shows compelling data from the page — not a generic site image.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Deputy OG image template | `src/app/representants/deputes/[id]/opengraph-image.tsx` | P0 |
| 2 | Département OG image template | `src/app/territoire/[departementCode]/opengraph-image.tsx` | P0 |
| 3 | Scrutin OG image template | `src/app/gouvernance/scrutins/[id]/opengraph-image.tsx` | P1 |
| 4 | Default site-wide OG image | `src/app/opengraph-image.tsx` | P2 |

### Template designs

**Deputy OG (1200×630)**:
```
┌──────────────────────────────────────────┐
│  bureau-950 background                    │
│  ┌──────┐                                │
│  │Photo │  Jean DUPONT                    │
│  │      │  Député · Groupe Politique       │
│  └──────┘  Loire-Atlantique (44)          │
│                                          │
│  Participation: 87%  │  Conflits: 3      │
│  Votes: 412          │  Déports: 1       │
│                                          │
│  L'OBSERVATOIRE CITOYEN ─── teal accent  │
└──────────────────────────────────────────┘
```

**Département OG (1200×630)**:
```
┌──────────────────────────────────────────┐
│  bureau-950 background                    │
│                                          │
│  SEINE-SAINT-DENIS (93)                  │
│  Île-de-France                           │
│                                          │
│  Revenu médian    Pauvreté    Chômage    │
│  18 450 €         27,9%       14,2%      │
│                                          │
│  12 députés · 6 sénateurs · 1 892 élus   │
│                                          │
│  L'OBSERVATOIRE CITOYEN ─── blue accent  │
└──────────────────────────────────────────┘
```

**Scrutin OG (1200×630)**:
```
┌──────────────────────────────────────────┐
│  bureau-950 background                    │
│                                          │
│  ╔═══════╗                               │
│  ║ADOPTÉ ║  Projet de loi de finances    │
│  ╚═══════╝  pour 2026                    │
│                                          │
│  Pour: 312  │  Contre: 245  │  Abst: 12 │
│  ████████████████░░░░░░░░░░░░            │
│                                          │
│  L'OBSERVATOIRE CITOYEN ─── teal accent  │
└──────────────────────────────────────────┘
```

### Implementation pattern (Next.js `ImageResponse`)

```typescript
// src/app/representants/deputes/[id]/opengraph-image.tsx

import { ImageResponse } from "next/og";
import prisma from "@/lib/db";

export const runtime = "nodejs"; // needed for Prisma
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: { id: string } }) {
  const deputy = await prisma.depute.findUnique({ where: { id: parseInt(params.id) } });
  if (!deputy) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", flexDirection: "column",
        backgroundColor: "#0a0f1a", // bureau-950
        color: "#e2e8f0",
        padding: "48px",
        fontFamily: "sans-serif",
      }}>
        {/* ... layout matching design above ... */}
      </div>
    ),
    { ...size }
  );
}
```

### Acceptance criteria

- [ ] Deputy profile shared on Twitter/Signal shows photo + stats
- [ ] Département shared shows key economic indicators
- [ ] Scrutin shared shows result + vote breakdown
- [ ] Images render at 1200×630 with bureau aesthetic
- [ ] Fallback works for missing data (no photo, empty stats)
- [ ] Build passes with zero TypeScript errors

---

## Sub-phase 7F: Party Alignment Matrix

**Goal**: A single visualization page showing how often each political group votes the same way as every other group — revealing structural alliances invisible from individual votes.

### Tasks

| # | Task | File | Priority |
|---|------|------|----------|
| 1 | Create alignment computation utility | `src/lib/alignment.ts` | P0 |
| 2 | Build `/votes/alignements` page | `src/app/votes/alignements/page.tsx` | P0 |
| 3 | Add link from `/votes` hub | `src/app/votes/page.tsx` | P1 |

### 1. Alignment computation

```typescript
// src/lib/alignment.ts

interface AlignmentPair {
  groupA: string;
  groupB: string;
  totalSharedScrutins: number;  // scrutins where both groups voted
  agreedCount: number;          // both pour or both contre
  disagreedCount: number;
  alignmentRate: number;        // agreedCount / totalSharedScrutins
}

// Query: For each pair of GroupeVote organeRef values,
// count scrutins where both groups had a position (pour > contre = "pour", etc.)
// and compare their positions.
//
// This can be computed with a self-join on GroupeVote:
//
// SELECT
//   gv1.organeRef AS groupA,
//   gv2.organeRef AS groupB,
//   COUNT(*) AS total_shared,
//   SUM(CASE WHEN dominant_position(gv1) = dominant_position(gv2) THEN 1 ELSE 0 END) AS agreed
// FROM GroupeVote gv1
// JOIN GroupeVote gv2 ON gv1.scrutinId = gv2.scrutinId AND gv1.organeRef < gv2.organeRef
// GROUP BY gv1.organeRef, gv2.organeRef
```

**Dominant position logic**: A group's position on a scrutin = whichever of `pour` / `contre` is higher. If `abstentions` is highest, skip.

### 2. Visualization

**Heat map** — groups on both axes, cells colored by alignment rate:
- 90-100%: deep teal (strong alignment)
- 70-89%: light teal
- 50-69%: neutral gray
- 30-49%: light rose
- 0-29%: deep rose (strong opposition)

Cell displays percentage on hover. Groups ordered by political spectrum (left → right).

**Implementation**: Server-side SVG or React component with Tailwind. No external charting lib needed — it's a colored grid.

### 3. Additional insights on the page

Below the matrix:
- **"Alliances les plus surprenantes"**: Pairs with high alignment but different political families
- **"Oppositions systématiques"**: Pairs with < 20% alignment
- **Per-topic matrices**: Optionally filter by ScrutinTag to see "on health votes, who aligns with whom?"

### Acceptance criteria

- [ ] `/votes/alignements` renders heat map for all active groups
- [ ] Alignment percentages are accurate (verified against sample scrutins)
- [ ] Color coding clearly shows allies vs. opponents
- [ ] Hover/click shows exact percentage + shared scrutin count
- [ ] Topic filter works (optional, P2)
- [ ] Link from `/votes` hub works
- [ ] Build passes with zero TypeScript errors

---

## Updated Orchestrator

After Phase 7, the ingestion orchestrator adds:

```
Wave 5c:  tagScrutins()                          // existing
Wave 5d:  computeConflicts()                     // NEW (7C) — after tags
...
Wave 10:  refreshSearchIndex()                   // NEW (7B) — final step
```

```typescript
// scripts/ingest.ts additions

// Wave 5d (after tag-scrutins)
await computeConflicts(); // scripts/compute-conflicts.ts

// Wave 10 (final)
await prisma.$executeRaw`REFRESH MATERIALIZED VIEW search_index`;
console.log("✓ Search index refreshed");
```

New npm scripts:
```json
{
  "compute:conflicts": "tsx scripts/compute-conflicts.ts",
  "refresh:search": "tsx -e \"const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.$executeRaw\\`REFRESH MATERIALIZED VIEW search_index\\`.then(() => console.log('Done')).finally(() => p.$disconnect())\""
}
```

---

## Summary — Session Planning

| Session | Sub-phase | What ships |
|---------|-----------|-----------|
| **14** ✅ | 7A | `/mon-territoire` — postal code → full civic dashboard |
| **15** | 7B | Global search — navbar search + `/recherche` page |
| **16** | 7C | `ConflictSignal` table + homepage/dossier integration |
| **17** | 7D | `/comparer/territoires` + `/comparer/deputes` |
| **18** | 7E + 7F | OG images (3 templates) + `/votes/alignements` matrix |

After Phase 7 completion:
- **Routes**: 53 → 57 (53 after 7A, +4 remaining)
- **Models**: 29 → 30 (`ConflictSignal`)
- **Components**: 24 → 27 (`ComparisonLayout`, `DeltaBadge`, alignment matrix)
- **New capabilities**: Search, personalization, comparison, social sharing, conflict alerts everywhere

---

## ZYKAY Integration Roadmap

Phase 7A (`/mon-territoire`) is the direct architectural precursor to ZK-personalized civic intelligence:

| Phase | Input method | Data access | PII stored |
|-------|-------------|-------------|-----------|
| **7A (now)** | User types postal code | Same for everyone | None |
| **ZYKAY v1 (later)** | ZK proof of `commune` scope | Filtered by verified commune | None |
| **ZYKAY v2 (future)** | ZK proof of `commune` + `age` + `nationality` | Filtered + prioritized by demographics | None |

The page component, data queries, and rendering logic are **identical across all three phases**. Only the authentication/input layer changes.