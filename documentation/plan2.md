# Civic Intelligence Platform — Expansion Plan

## Context

The project started with 7 Prisma models (Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste, IngestionLog), zero ingestion scripts, and a placeholder homepage.

The expansion added three new data layers — Territory, Economy, Culture — transforming this from a directory of officials into a cross-referencing civic platform.

---

## Phase 2 Status: COMPLETE

### Schema Expansion — DONE
- 8 new models added, 3 existing models modified
- 2 migrations applied: `expand_civic_platform` + `fix_depute_optional_dept_fk`
- 15 models total + IngestionLog

### Ingestion Scripts — DONE
All 8 scripts built and verified:

| Script | Source | Actual Rows | Time |
|--------|--------|-------------|------|
| `ingest-territoires.ts` | INSEE COG CSVs | 37,031 (18 regions, 101 depts, 36,912 communes) | 10.4s |
| `ingest-deputes.ts` | data.gouv.fr Tabular API | 2,101 (577 active + 1,524 historic) | 11.4s |
| `ingest-senateurs.ts` | data.senat.fr CSVs (ISO-8859-1) | 5,907 (1,943 senators + 3,348 mandates + 616 commissions) | 5.5s |
| `ingest-lobbyistes.ts` | HATVP JSON (hatvp.fr) | 98,529 (3,883 lobbyists + 94,646 actions) | 99.8s |
| `ingest-economie.ts` | GDP CSV + INSEE BDM SDMX XML | 358 (4 indicators + 354 observations) | 8.7s |
| `ingest-musees.ts` | data.gouv.fr Tabular API | 13,496 (1,226 museums + 12,270 attendance) | 53.4s |
| `ingest-monuments.ts` | data.gouv.fr Tabular API | 46,697 monuments | 274.8s |
| **Total** | | **~204,000 rows** | **~7.5 min** |

### Shared Libraries — DONE
| File | Purpose |
|------|---------|
| `scripts/lib/api-client.ts` | Tabular API paginator (`fetchAllPages`) + `fetchText` (encoding support) + `fetchJson` + `fetchGzip` |
| `scripts/lib/csv-parser.ts` | papaparse wrapper with BOM handling, `parseDateSafe`, `parseIntSafe`, `parseFloatSafe` |
| `scripts/lib/sdmx-parser.ts` | INSEE BDM SDMX XML → typed objects (fast-xml-parser) |
| `scripts/lib/ingestion-log.ts` | `logIngestion(source, fn)` — timing + IngestionLog write |
| `scripts/lib/departement-lookup.ts` | Name→code fuzzy matching (accent/hyphen normalization) |

### Dependencies Added — DONE
- `fast-xml-parser`, `papaparse`, `@prisma/adapter-pg`, `pg`
- `@types/papaparse`, `@types/pg` (dev)

### Issues Resolved During Implementation
1. **Prisma 7 breaking change**: `datasourceUrl` removed from constructor — switched to `@prisma/adapter-pg` with `pg.Pool`
2. **Delegated communes**: 2,576 COMD/COMA communes had empty DEP — resolved from parent commune code
3. **Deputy FK violations**: Overseas codes (099, 975, 977, 986–988) not in COG — added `departementRefCode` as nullable FK separate from raw `departementCode`
4. **Senator CSV encoding**: ISO-8859-1 + SQL comment headers (%) — added encoding param to `fetchText` + comment stripping
5. **Node version**: Prisma 7 requires Node 20.19+ — using 20.19.2 via nvm

---

## Phase 3 Status: COMPLETE

17 routes (6 static, 11 dynamic), 5 shared components. Production build passing.

Full frontend documentation: **[frontend.md](frontend.md)**

### Summary
- "Intelligence Bureau" dark theme: deep navy base, teal/amber/rose accents
- Instrument Serif + DM Sans typography (next/font/google)
- All Server Components with direct Prisma queries — no API layer
- Inline SVG charts (no chart library), French formatting, URL-based search + pagination
- HATVP declarations data (6,586 entries) displayed on homepage with patrimoine amounts
- 3 additional Prisma models: DeclarationInteret, ParticipationFinanciere, RevenuDeclaration

---

## Schema Reference (15 models)

### Territory Layer
```
Region        → code (PK), cheflieu?, tncc?, ncc, libelle
Departement   → code (PK), regionCode (FK→Region), cheflieu?, tncc?, ncc, libelle
Commune       → code (PK), departementCode (FK→Dept), regionCode, typecom, tncc?, ncc, libelle, can?, arr?, comparent?
```

### Governance Layer
```
Depute              → id (PK), legislature, civilite, nom, prenom, groupe, groupeAbrev,
                      departementCode (raw), departementRefCode? (FK→Dept),
                      scores (participation, specialite, loyaute, majorite), actif, ...
Senateur            → id (PK), civilite, nom, prenom, groupe?, departement? (name),
                      departementCode? (FK→Dept), actif, ...
MandatSenateur      → senateurId (FK), type, libelle, dateDebut?, dateFin?
CommissionSenateur  → senateurId (FK), nom, fonction?, dateDebut?, dateFin?
Lobbyiste           → id (PK, HATVP ID), nom, type?, categorieActivite?, siren?, effectif?, ...
ActionLobbyiste     → lobbyisteId (FK), type?, description?, domaine?, periode?
```

### Economy Layer
```
Indicateur  → id (PK), code (unique), idBank?, nom, domaine, unite, frequence, source, ...
Observation → indicateurId (FK), periode, periodeDebut (DateTime), valeur (Float), statut?
              Unique: [indicateurId, periode]
```

### Culture Layer
```
Musee              → id (PK, IDMuseofile), nom, ville?, communeCode? (FK), departementCode? (FK), ...
FrequentationMusee → museeId (FK), annee, payant?, gratuit?, total?, ...
                     Unique: [museeId, annee]
Monument           → id (PK, ref code), denomination?, domaine?, communeCode? (FK),
                     departementCode? (FK), protectionType?, latitude?, longitude?, ...
```

---

## Ingestion Architecture

### Orchestrator (`scripts/ingest.ts`)
```
1. await ingestTerritoires()                                    // must be first (FK targets)
2. await Promise.all([ingestDeputes(), ingestSenateurs(), ingestLobbyistes()])
3. await ingestEconomie()
4. await Promise.all([ingestMusees(), ingestMonuments()])
```

### Data Sources
| Source | URL | Format | Auth |
|--------|-----|--------|------|
| Deputies | `tabular-api.data.gouv.fr/api/resources/092bd7bb-.../data/` | Paginated JSON | None |
| Historic Deputies | `tabular-api.data.gouv.fr/api/resources/817fda38-.../data/` | Paginated JSON | None |
| Senators | `data.senat.fr/data/senateurs/ODSEN_*.csv` | CSV (ISO-8859-1) | None |
| HATVP Lobbyists | `hatvp.fr/agora/opendata/agora_repertoire_opendata.json` | JSON (nested) | None |
| GDP | `tabular-api.data.gouv.fr/api/resources/...` | CSV | None |
| Unemployment + Enterprises | `bdm.insee.fr/series/sdmx/data/SERIES_BDM/{idbanks}` | SDMX XML | None (30 req/min) |
| Museums | `tabular-api.data.gouv.fr/api/resources/7708e380-.../data/` | Paginated JSON | None |
| Monuments | `tabular-api.data.gouv.fr/api/resources/3a52af4a-.../data/` | Paginated JSON | None |
| Territories (COG) | `insee.fr/fr/statistiques/fichier/7766585/v_*.csv` | CSV | None |

---

## Commands

```bash
pnpm ingest              # Full ingestion (~7.5 min)
pnpm ingest:territoires  # COG regions/depts/communes
pnpm ingest:deputes      # Deputies (active + historic)
pnpm ingest:senateurs    # Senators + mandates + commissions
pnpm ingest:lobbies      # HATVP lobbyists + actions
pnpm ingest:economie     # GDP + unemployment + enterprises
pnpm ingest:musees       # Museums + attendance
pnpm ingest:monuments    # Historical monuments
```

All scripts are idempotent (upsert). Safe to re-run anytime.
