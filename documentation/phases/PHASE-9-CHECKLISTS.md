# Phase 9 — Acceptance Checklists

> Run with `/phase-check 9A` (etc.) — each item must pass before moving to the next sub-phase.

---

## 9A: Data Model + Government Seed

### Schema
- [ ] `PersonnalitePublique` model exists with all fields (id, nom, prenom, civilite, dateNaissance, lieuNaissance, slug, photoUrl, bioCourte, formation, deputeId, senateurId, hatvpDossierId, derniereMaj, sourceRecherche)
- [ ] `MandatGouvernemental` model exists with all fields (personnaliteId, titre, titreCourt, gouvernement, premierMinistre, president, dateDebut, dateFin, rang, type, portefeuille, ministereCode)
- [ ] `EntreeCarriere` model exists with all fields (personnaliteId, dateDebut, dateFin, categorie, titre, organisation, description, source, sourceUrl, sourceDate, ordre)
- [ ] `InteretDeclare` model exists with all fields (personnaliteId, declarationRef, dateDeclaration, rubrique, contenu, organisation, montant, dateDebut, dateFin, alerteConflit, commentaireConflit)
- [ ] `EvenementJudiciaire` model exists with all fields (personnaliteId, date, type, nature, juridiction, statut, resume, sourcePrincipale, sourceUrl, sourceDate, verifie)
- [ ] `ActionLobby` model exists with all fields (representantNom, representantCategorie, ministereCode, domaine, typeAction, exercice, depensesTranche, sourceUrl)
- [ ] All enums defined: `TypeMandat`, `CategorieCarriere`, `SourceCarriere`, `RubriqueInteret`, `TypeEvenement`, `StatutEvenement`, `SourceRecherche`
- [ ] Indexes on `personnaliteId` (all child tables), `slug` (unique on PersonnalitePublique), `ministereCode`
- [ ] `pnpm db:migrate` creates migration without error
- [ ] `pnpm db:generate` regenerates client without error

### Seed
- [ ] Seed script populates current government (~35 members)
- [ ] President record exists with `type = PRESIDENT`
- [ ] PM record exists with `type = PREMIER_MINISTRE`
- [ ] All ministers have: `nom`, `prenom`, `slug`, `titreCourt`, `dateDebut`, `rang`
- [ ] Députés cross-referenced: where name matches `Depute` table, `deputeId` is set
- [ ] Re-running seed doesn't create duplicates (upsert on `slug`)

### Pages
- [ ] `/gouvernement` renders a grid of all current government members
- [ ] `/gouvernement/[slug]` renders basic profile: photo, name, title, dates, empty section placeholders
- [ ] Members sorted by `rang` (protocol order)
- [ ] Click navigates to individual profile
- [ ] Bureau aesthetic: bureau-950 bg, teal accents, DM Sans + Instrument Serif

### Integration
- [ ] `pnpm build` passes (zero TypeScript errors)
- [ ] No existing routes broken (check `/representants`, `/votes`, `/territoire`)
- [ ] No existing seed data affected
- [ ] `revalidate = 3600` set on both new pages

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

## 9C: AGORA Lobby Registry

### Ingestion
- [ ] Script downloads AGORA consolidated JSON (~80MB — streamed, not `JSON.parse` whole file)
- [ ] Parses lobby actions targeting ministerial cabinets
- [ ] `ministereCode` mapping table exists (free-text ministry names → normalized codes)
- [ ] `ActionLobby` records created with all required fields
- [ ] Deduplication on `representantNom + ministereCode + exercice`
- [ ] Re-run is idempotent

### Display
- [ ] Profile page shows "Lobbying déclaré ciblant ce ministère" section
- [ ] Summary: total actions this year, top organizations by count
- [ ] Breakdown by domain (domaine field)
- [ ] Each entry links to AGORA registry source
- [ ] Neutral framing — "ciblant ce ministère" not "influençant"
- [ ] Empty state handled ("Aucune action déclarée")

### Integration
- [ ] `pnpm build` passes
- [ ] AGORA data paginated or limited (no 50K row page loads)

---

## 9D: Career Timeline

### Data Generation
- [ ] Script auto-generates `EntreeCarriere` from `MandatGouvernemental` records
- [ ] Script auto-generates `EntreeCarriere` from linked `Depute`/`Senateur` records
- [ ] Script extracts career entries from `InteretDeclare` where `rubrique = ACTIVITE_ANTERIEURE`
- [ ] Deduplication: same role from 2 sources → 1 entry
- [ ] Each entry has `source` field (`HATVP` / `ASSEMBLEE` / `MANUELLE`)

### Display
- [ ] `<CareerTimeline personnaliteId={id} />` component in `src/components/`
- [ ] Vertical timeline, present (top) to past (bottom)
- [ ] Visual differentiation by `categorie`: government = filled bar, elected = open circle, other = diamond
- [ ] Date ranges displayed (`"depuis"` for ongoing)
- [ ] Source badge on each entry (clicking opens original document)
- [ ] Sparse timelines show indicator: "Parcours partiel — sources structurées uniquement"

### Integration
- [ ] `pnpm build` passes
- [ ] Component is self-contained (not inlined in page.tsx)
- [ ] No layout shift on load

---

## 9E: Full Profile UI

### Layout
- [ ] Profile header: photo, name, current title, age, education summary, party (if applicable)
- [ ] Tabbed or scrollable sections: Parcours / Intérêts / Affaires judiciaires / Lobbying
- [ ] "Affaires judiciaires": shows "Aucune affaire référencée" (not blank) when `EvenementJudiciaire` empty
- [ ] Cross-link to parliamentary profile if `deputeId` exists ("Voir le profil parlementaire →")
- [ ] Responsive: mobile (375px), tablet (768px), desktop (1280px)

### Government Index
- [ ] Members grouped by type: Président → PM → Ministres → Délégués → Secrétaires
- [ ] Government name and formation date displayed
- [ ] Search/filter by name or portfolio keyword

### Navigation
- [ ] "Gouvernement" added to main navbar (`src/app/layout.tsx`)
- [ ] SEO: `generateMetadata` with title + description + OG tags on profile pages
- [ ] Schema.org `Person` structured data in `<script type="application/ld+json">`
- [ ] `@media print` stylesheet for clean CV output

### Integration
- [ ] `pnpm build` passes
- [ ] All ~35+ profile pages render without error
- [ ] All section components are self-contained (no logic inlined in page.tsx)

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
