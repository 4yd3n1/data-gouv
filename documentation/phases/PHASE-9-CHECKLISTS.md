# Phase 9 — Acceptance Checklists

> Run with `/phase-check 9A` (etc.) — each item must pass before moving to the next sub-phase.

---

## 9A: Data Model + Government Seed ✅ COMPLETE (Sessions 22–23, March 3–4, 2026)

### Schema
- [x] `PersonnalitePublique` model exists with all fields (id, nom, prenom, civilite, dateNaissance, lieuNaissance, slug, photoUrl, bioCourte, formation, deputeId, senateurId, hatvpDossierId, derniereMaj, sourceRecherche)
- [x] `MandatGouvernemental` model exists with all fields (personnaliteId, titre, titreCourt, gouvernement, premierMinistre, president, dateDebut, dateFin, rang, type, portefeuille, ministereCode)
- [x] `EntreeCarriere` model exists with all fields (personnaliteId, dateDebut, dateFin, categorie, titre, organisation, description, source, sourceUrl, sourceDate, ordre)
- [x] `InteretDeclare` model exists with all fields (personnaliteId, declarationRef, dateDeclaration, rubrique, contenu, organisation, montant, dateDebut, dateFin, alerteConflit, commentaireConflit)
- [x] `EvenementJudiciaire` model exists with all fields (personnaliteId, date, type, nature, juridiction, statut, resume, sourcePrincipale, sourceUrl, sourceDate, verifie)
- [x] `ActionLobby` model exists with all fields (representantNom, representantCategorie, ministereCode, domaine, typeAction, exercice, depensesTranche, sourceUrl)
- [x] All enums defined: `TypeMandat`, `CategorieCarriere`, `SourceCarriere`, `RubriqueInteret`, `TypeEvenement`, `StatutEvenement`, `SourceRecherche`
- [x] Indexes on `personnaliteId` (all child tables), `slug` (unique on PersonnalitePublique), `ministereCode`
- [x] `pnpm db:migrate` creates migration without error
- [x] `pnpm db:generate` regenerates client without error

### Seed
- [x] Seed script populates current government (~35 members)
- [x] President record exists with `type = PRESIDENT`
- [x] PM record exists with `type = PREMIER_MINISTRE`
- [x] All ministers have: `nom`, `prenom`, `slug`, `titreCourt`, `dateDebut`, `rang`
- [x] Députés cross-referenced: 7 `PersonnalitePublique` records have `deputeId` set via SQL name-match (Bayrou PA410, Barrot PA721836, Borne PA717161, Darmanin PA607846, Pannier-Runacher PA759832, Vautrin PA267797, Wauquiez PA267285). `Depute.actif` corrected to `false` for the 3 incorrectly marked active (Borne, Wauquiez, Pannier-Runacher — they resigned seats on joining government). Session 30.
- [x] Re-running seed doesn't create duplicates (upsert on `slug`)

### Pages
- [x] `/gouvernement` renders a grid of all current government members
- [x] `/gouvernement/[slug]` renders basic profile: photo, name, title, dates, empty section placeholders
- [x] Members sorted by `rang` (protocol order)
- [x] Click navigates to individual profile
- [x] Bureau aesthetic: bureau-950 bg, teal accents, DM Sans + Instrument Serif

### Integration
- [x] `pnpm build` passes (zero TypeScript errors)
- [x] No existing routes broken (check `/representants`, `/votes`, `/territoire`)
- [x] No existing seed data affected
- [x] `revalidate = 3600` set on both new pages

---

## 9B: HATVP Interest Declarations

### Ingestion
- [ ] Script downloads and parses HATVP CSV index
- [ ] Filters to government officials only (Ministre, Secrétaire d'État, Premier ministre, Président)
- [ ] Parses XML declarations into `InteretDeclare` records
- [ ] Maps all 8 rubrique types correctly (see gouvernement.md mapping table)
- [ ] Matches declarations to `PersonnalitePublique` by normalized name
- [ ] Stores `declarationRef` and `dateDeclaration`
- [ ] Re-run is idempotent (upsert on declarationRef + personnaliteId)
- [ ] Logs: X processed, Y inserted, Z matched, W unmatched

### Display
- [ ] Profile page shows "Intérêts déclarés" section
- [ ] Grouped by rubrique with collapsible sections
- [ ] Each item shows: contenu, organisation (if any), dates (if any)
- [ ] Link to original HATVP declaration
- [ ] "Aucune déclaration référencée" when empty (not blank section)
- [ ] Multiple declarations: most recent shown by default, dropdown for historical

### Integration
- [ ] `pnpm build` passes
- [ ] Profile page handles ministers with 0 declarations (no error, empty state)
- [ ] Profile page handles ministers with 30+ items gracefully (collapsible)

---

## 9C: AGORA Lobby Registry ✅ COMPLETE (Session 28, March 4, 2026)

### Ingestion
- [x] Script downloads AGORA consolidated JSON (~80MB — fetched via `res.json()`, same pattern as `ingest-lobbyistes.ts`)
- [x] Parses lobby actions targeting ministerial cabinets
- [x] `ministereCode` mapping table exists (free-text ministry names → normalized codes)
- [x] `ActionLobby` records created with all required fields
- [x] Re-run is idempotent (delete-all then recreate — no stable IDs for upsert)

### Display
- [x] Profile page shows "Lobbying déclaré ciblant ce ministère" section
- [x] Summary: total action count + top 5 organizations by count
- [x] Breakdown by domain (top 6 domains with counts)
- [x] Footer links to AGORA registry source (agora-lobbying.fr)
- [x] Neutral framing — "ciblant ce ministère"
- [x] Empty state handled ("Aucune action déclarée ciblant ce ministère.")

### Integration
- [x] `pnpm build` passes
- [x] AGORA data capped at 500 rows per query (no 50K row page loads)
- [x] 94,924 ActionLobby records created across 12 ministereCode values

---

## 9D: Career Timeline ✅ COMPLETE (Session 28–29, March 4, 2026)

### Data Generation
- [x] Script auto-generates `EntreeCarriere` from `MandatGouvernemental` records (source: HATVP)
- [x] Script auto-generates `EntreeCarriere` from linked `Depute`/`Senateur` records (source: ASSEMBLEE)
- [x] ~~Script extracts career entries from `InteretDeclare` where `rubrique = ACTIVITE_ANTERIEURE`~~ **REMOVED** — HATVP financial disclosure fields produce noise (\"Élevage chevaux\", \"Publications\") and duplicate mandate entries. Source 4 removed from `generate-carriere.ts`. Career sources are now: MandatGouvernemental only + Depute/Senateur via FK. 12 clean entries (was 17 with garbage). Session 29.
- [x] Deduplication: same role from 2 sources → 1 entry (keyed on `categorie|titre|organisation`)
- [x] Each entry has `source` field (`HATVP` / `ASSEMBLEE` / `MANUELLE`)

### Display
- [x] `<CareerSection personnaliteId={id} />` component in `src/components/gouvernement/`
- [x] Vertical timeline, present (top) to past (bottom)
- [x] Visual differentiation by `categorie`: colored dot (teal=gouvernemental, blue=électif, amber=fonction publique, purple=formation, gray=autres)
- [x] Date ranges displayed ("en cours" for ongoing)
- [x] Source label on each entry (HATVP / Assemblée nationale / Presse)
- [x] Sparse timelines show indicator: "Parcours partiel — sources structurées uniquement"

### Integration
- [x] `pnpm build` passes
- [x] Component is self-contained (not inlined in page.tsx)
- [x] No layout shift on load (server component, no hydration)

---

## 9E: Full Profile UI ✅ COMPLETE (Session 29–30, March 4, 2026)

### Layout
- [x] Profile header: `ProfileHero` — photo (initials fallback), name, current title, "En exercice" / "Ancien membre" status badge
- [x] **4-tab structure** (Session 29 redesign): **Parcours** (default, `CareerSection`) / **Déclarations HATVP** (`InteretsSection` + conflict alert banner) / **Mandats & Lobbying** (`MandatsSection` + `LobbySection` + `JudiciaireSection`) / **Activité parlementaire** (conditional — `ParliamentarySection`, only shown if `deputeId` or `senateurId` set)
- [x] `JudiciaireSection` renders `null` when no verified events (not a blank section)
- [x] Parliamentary data embedded via `ParliamentarySection` (deputy scores + 8 recent votes, or senator commissions)
- [x] Responsive: `ProfileHero` + `ProfileTabs` pattern consistent with all other profile pages

### Unified Profiles (Session 29–30 — new, supersedes "cross-link" approach)
- [x] `/representants/deputes/[id]` redirects to `/gouvernement/[slug]` when `PersonnalitePublique.deputeId` matches — 7 active redirects
- [x] `/representants/senateurs/[id]` redirects to `/gouvernement/[slug]` when `PersonnalitePublique.senateurId` matches
- [x] `/representants` hub has Gouvernement card (12 membres en exercice, rose accent)
- [x] Bayrou `Depute.groupe` corrected from NI → DEM (Mouvement Démocrate)
- [x] `Depute.actif` corrected to `false` for 3 ministers (Borne, Wauquiez, Pannier-Runacher)

### Government Index
- [x] Members grouped by type: Président → PM → Ministres → Ministres délégués → Secrétaires d'État
- [x] Government name and formation date displayed
- [ ] Search/filter by name or portfolio keyword — pending

### Navigation
- [ ] "Gouvernement" not yet added to main navbar — pending
- [x] SEO: `generateMetadata` with title + description on profile pages
- [ ] Schema.org `Person` structured data — pending
- [ ] `@media print` stylesheet — pending

### Integration
- [x] `pnpm build` passes with zero TypeScript errors
- [x] All 12 profile pages render without error
- [x] All section components are self-contained (no logic inlined in page.tsx)

---

## 9F: Research Agent

### Agent Script
- [ ] `scripts/research-agent.ts` — takes minister slug as CLI argument
- [ ] Reads `PersonnalitePublique` + existing data from DB
- [ ] Calls Anthropic API with web search enabled
- [ ] Career enrichment pass: extracts milestones from press with source URLs
- [ ] Judicial history pass: searches for mise en examen, CJR, enquête préliminaire
- [ ] Every claim has: `sourceUrl`, `sourceDate`, `sourcePrincipale`
- [ ] Output: JSON file at `data/research-output/[slug].json`
- [ ] Only uses Tier 1–3 press sources (AFP, France Info, Le Monde, Mediapart, Libération, Le Figaro)

### Review Workflow
- [ ] CLI or simple review interface for agent output
- [ ] Accept / reject / edit per item
- [ ] Accepted career entries ingested with `source = PRESSE` and `verifie = true`
- [ ] Accepted judicial events ingested with `verifie = true`
- [ ] Rejected items logged but not displayed

### Safety
- [ ] No `EvenementJudiciaire` displayed without `verifie = true`
- [ ] No editorializing in `resume` fields
- [ ] Source URLs are accessible and from approved outlet list

---

## 9G: President + Historical Governments

- [ ] President profile has expanded sections: election results, governments formed, constitutional powers exercised
- [ ] Historical government list: at least current + 2 previous governments
- [ ] Each historical government shows full member list
- [ ] `/gouvernement?mandat=X` filter works (query param → filter by `gouvernement` field)
- [ ] Cross-links from minister `EntreeCarriere` timelines to government pages
- [ ] `/president` route links to or embeds the PersonnalitePublique profile for the current president
- [ ] `pnpm build` passes
