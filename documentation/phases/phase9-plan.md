# Phase 9 — Government Official Profiles: "Les Fiches du Pouvoir"

> For: L'Observatoire Citoyen data-gouv platform
> Created: March 3, 2026
> Depends on: Phase 8 complete (map, dossiers, territory dashboards)
> Estimated effort: 6–8 sessions
> Scope: President, Prime Minister, all ministers & secretaries of state, expandable to all senior public officials

---

## Vision

Every person who exercises executive power in France gets a definitive, sourceable, public "fiche" — a living CV that traces their journey from education through private career through political life, cross-referenced with their declared interests, judicial history, and the lobby ecosystem around their portfolio.

This is not a Wikipedia summary. It's a structured, data-driven transparency tool. Each claim links to its source. Each interest declaration links to the HATVP original. Each judicial event cites the reporting outlet. Citizens can look up any minister and immediately understand: who is this person, where did they come from, what interests do they carry, and what controversies surround them?

This feature positions L'Observatoire Citoyen as the authoritative French civic intelligence platform — not by editorializing, but by aggregating and structuring what is already public record.

---

## Why This Architecture

Before diving into tasks, it's worth understanding why minister profiles are architecturally different from the député/sénateur data you already have.

**Députés and sénateurs are database-native.** The Assemblée Nationale and Sénat publish structured, machine-readable datasets. You ingest them, store them, query them. The data is authoritative, complete, and updated by the institutions themselves.

**Ministers are not.** There is no single API that gives you a minister's full career, judicial history, and controversy timeline. The data lives across multiple sources of wildly different quality and structure:

- **HATVP** gives you declared interests and patrimoine in structured XML — but only what the minister chose to declare, and only for the period they hold office.
- **data.assemblee-nationale.fr** gives you parliamentary history — but only if the minister was previously a député (many are, but not all — technocratic ministers appointed from civil service or private sector have no parliamentary record).
- **Gouvernement.fr** gives you the current composition with photos and portfolio descriptions — but no historical data, and it resets completely with each reshuffle.
- **Career history** lives in press profiles, Wikipedia, LinkedIn, Who's Who — unstructured, sometimes contradictory, never in a single canonical source.
- **Judicial proceedings** live exclusively in press coverage — Le Monde, Mediapart, Libération, France Info — and require careful sourcing to avoid defamation.
- **Lobby interactions** are in the HATVP AGORA registry — structured JSON, but indexed by lobbying organization, not by minister, requiring reverse lookups.

This means the architecture has two distinct layers: a **structured ingestion layer** (deterministic scripts, like your existing INSEE pipeline) and a **research layer** (AI-assisted, requiring sourcing discipline and human review). The plan is designed so Layer 1 ships independently and delivers immediate value, while Layer 2 adds depth progressively.

---

## Data Sources Deep Dive

Understanding what each source provides — and what it doesn't — is critical for scoping the work correctly.

### Source 1: HATVP Open Data (declarations)

**What it is:** The Haute Autorité pour la Transparence de la Vie Publique collects and publishes interest and patrimony declarations from ~18,000 senior public officials including every government minister.

**What you get:**
- `liste.csv` — Master list of all declarations: name, role ("Ministre de l'Économie"), declaration type (intérêts / patrimoine / modification), department number, and filename linking to the full XML.
- `declarations.xml` — A single massive XML file containing every published declaration, structured into sections: previous activities (5 years), board memberships, consulting/advisory roles, professional activities of spouse, financial participations, income from previous roles, and gifts/travel received.
- Each declaration also includes the HATVP's formal assessment ("appréciation") of potential conflicts.

**What you don't get:**
- No unique person identifier across declarations — the same person may have 3–4 declarations (initial, modified, end-of-mandate) with slightly different name spellings. You'll need fuzzy matching or manual mapping.
- No career history beyond the 5-year lookback window in the interest declaration.
- No judicial or controversy data.
- The patrimony declarations (real estate, bank accounts, securities) are published for ministers but the level of detail varies.

**Format:** CSV index + XML content. Licence Ouverte Etalab (fully reusable). No API — you download the files. They update periodically (not real-time, typically within weeks of a declaration being published).

**Ingestion approach:** Download CSV + XML, parse with a Node.js script (use `fast-xml-parser`), map to your data model. Run on each government reshuffle + monthly for updates.

### Source 2: HATVP AGORA Registry (lobbying)

**What it is:** Since 2017, lobbyists must register and declare their interactions with public officials, including which ministries they targeted, on what topics, and how much they spent.

**What you get:**
- A single consolidated JSON file (~80MB) with every registered lobbyist, their declared activities, target ministries/agencies, topics, spending ranges, and action types (meetings, written communications, events).
- Updated nightly.

**What you don't get:**
- The registry is indexed by lobbying organization, not by minister. To build a "who lobbied this minister?" view, you need to filter all activities where the target ministry matches the minister's portfolio. This is a reverse lookup, not a direct join.
- The granularity varies — some lobbying organizations declare specific officials they met, others only declare the ministry. So the link to a specific minister is sometimes indirect (they lobbied "Ministère de l'Économie" but you can't prove they met the minister personally vs. a staffer).
- Spending is declared in ranges (e.g., "between €100K and €200K"), not exact amounts.

**Format:** JSON. Licence Ouverte Etalab. Direct download.

**Ingestion approach:** Download JSON, parse, and build a `LobbyAction` table. Then create a `ministere → actions` index. The matching between minister portfolio and lobby targets will need a manually maintained mapping table (because lobby declarations use free-text ministry names that don't always match official titles exactly).

### Source 3: data.assemblee-nationale.fr (parliamentary history)

**What it is:** You already ingest this for député profiles. For ministers who were previously députés, this gives you their full parliamentary record.

**What you get:** Vote records, group memberships, committee assignments, amendments filed, questions asked, and speaking time in the hemicycle. Your existing `Depute` model already captures most of this.

**What you don't get:** Nothing for ministers appointed from outside parliament (technocrats, civil servants, private sector figures). Also nothing for senators — you'd need `data.senat.fr` for that, which has a similar but separately structured open data portal.

**Ingestion approach:** No new ingestion needed. Just build a cross-reference: when a `Ministre` record matches a `Depute` record (by name or by the AN's internal actor ID), link them. The minister profile page then pulls the parliamentary history from the existing data.

### Source 4: Gouvernement.fr (current composition)

**What it is:** The official government website lists the current cabinet with photos, portfolio descriptions, and biographies.

**What you get:** Current minister names, titles, portfolio descriptions, and official photos. A basic biography paragraph (education, career highlights).

**What you don't get:** No historical data — previous governments are not archived in a structured way. No API — you'd need to scrape the HTML or find a structured mirror. The data disappears with each reshuffle.

**Ingestion approach:** This is best treated as a seed source for the initial minister list, not as an ongoing data feed. Scrape or manually enter the current government composition once, then maintain it through press coverage of reshuffles. Alternatively, the Assemblée Nationale's open data includes a `Gouvernement` dataset with minister names and dates for the current legislature — check `data.assemblee-nationale.fr` for a structured alternative.

### Source 5: Press sources (judicial, career, controversies)

**What it is:** Major French press outlets are the only source for judicial proceedings, detailed career histories, and political controversies.

**Key outlets by reliability tier:**
- **Tier 1 (institutional):** AFP, France Info, Public Sénat — wire service / public broadcaster, highest factual reliability, least editorial slant.
- **Tier 2 (investigative):** Mediapart, Le Monde, Le Canard Enchaîné — strong investigative track record, primary source for breaking judicial stories.
- **Tier 3 (mainstream):** Libération, Le Figaro, Les Échos, L'Opinion — reliable for facts, stronger editorial slant, good for career/background profiles.

**What you can extract:**
- Judicial proceedings: mise en examen, garde à vue, enquête préliminaire, renvoi en correctionnelle, condamnation. These have specific legal terminology that makes them searchable.
- Career milestones: previous employers, board seats, advisory roles, academic positions.
- Controversies: political scandals, policy failures, public statements that generated significant backlash.

**What you must be careful about:**
- Defamation law in France is strict. You cannot publish "Minister X is corrupt" — you can publish "Minister X was placed under formal investigation for corruption charges on [date], as reported by Le Monde." The distinction is between stating facts about legal proceedings (which are public) and making editorial judgments.
- Always cite the source outlet and date. Never synthesize from multiple sources into a single unsourced claim.
- Distinguish between: confirmed legal proceedings (public record), alleged wrongdoing (press reporting), and editorial criticism (opinion). Only the first two belong on L'Observatoire.

**Ingestion approach:** This is where the research agent comes in. No automated ingestion possible — each minister requires targeted web searches, result evaluation, fact extraction, and source citation. This is fundamentally an AI-assisted research workflow, not a data pipeline.

---

## Data Model

The data model needs to handle the full lifecycle of a public official: their identity, their career path, their government roles, their declared interests, their judicial history, and the lobby ecosystem around their portfolio.

### Core Entities

**`PersonnalitePublique`** — The central entity. One record per person, regardless of how many roles they've held.

Why a new table instead of extending `Depute`? Because not all ministers are députés. A technocratic minister (e.g., a career diplomat appointed as Foreign Affairs minister) has no parliamentary record. And a person can be a député, then a minister, then a député again — the identity is the person, not the role. The `PersonnalitePublique` table is the person; `Depute`, `Senateur`, and the new `MandatGouvernemental` are their roles.

Fields:
- `id` — UUID primary key
- `nom`, `prenom`, `civilite` — identity
- `dateNaissance`, `lieuNaissance` — demographics (from HATVP declarations)
- `slug` — URL-friendly identifier (e.g., `bruno-le-maire`)
- `photoUrl` — official portrait (from gouvernement.fr or AN)
- `bioCourte` — 2–3 sentence summary (editable, for display)
- `formation` — education summary (e.g., "ENA, Promotion Averroès · ENS Ulm")
- `deputeId` — nullable FK to existing `Depute` table (if they were/are a député)
- `senateurId` — nullable FK to existing `Senateur` table
- `hatvpDossierId` — HATVP unique dossier URL (for linking back to source)
- `derniereMaj` — last updated timestamp
- `sourceRecherche` — enum: `HATVP_ONLY` | `HATVP_PLUS_PRESSE` | `VERIFIE_MANUELLEMENT` — transparency on data completeness

**`MandatGouvernemental`** — Each time a person serves in government. A minister who served in 3 different governments gets 3 records.

Fields:
- `id` — UUID
- `personnaliteId` — FK to `PersonnalitePublique`
- `titre` — "Ministre de l'Économie, des Finances et de la Souveraineté industrielle et numérique"
- `titreCourt` — "Ministre de l'Économie" (for display)
- `gouvernement` — "Gouvernement Élisabeth Borne" (or Attal, Barnier, etc.)
- `premierMinistre` — name of the PM (redundant but useful for queries)
- `president` — name of the President
- `dateDebut`, `dateFin` — nullable end date = currently in office
- `rang` — protocol order (PM = 1, Ministre d'État = 2, etc.)
- `type` — enum: `PRESIDENT` | `PREMIER_MINISTRE` | `MINISTRE` | `MINISTRE_DELEGUE` | `SECRETAIRE_ETAT`
- `portefeuille` — text description of responsibilities
- `ministereCode` — normalized code for matching with AGORA lobby data

**`EntreeCarriere`** — The timeline. Every significant career milestone, in reverse chronological order.

Fields:
- `id` — UUID
- `personnaliteId` — FK
- `dateDebut`, `dateFin` — nullable
- `categorie` — enum: `FORMATION` | `CARRIERE_PRIVEE` | `FONCTION_PUBLIQUE` | `MANDAT_ELECTIF` | `MANDAT_GOUVERNEMENTAL` | `ORGANISME` | `AUTRE`
- `titre` — "Directeur de cabinet du Premier ministre"
- `organisation` — "Matignon" / "McKinsey" / "ENA"
- `description` — optional longer description
- `source` — where this info comes from: `HATVP` | `ASSEMBLEE` | `PRESSE` | `MANUELLE`
- `sourceUrl` — link to the original source
- `sourceDate` — when the source was published/accessed
- `ordre` — manual sort order for display

Why separate from `MandatGouvernemental`? Because a career entry can be "Partner at law firm X" or "Student at ENA" — things that aren't government mandates. The `MandatGouvernemental` table is for structured government roles with exact dates and portfolio assignments. The `EntreeCarriere` table is the visual timeline that includes everything.

When a person has a `MandatGouvernemental`, you'd auto-generate corresponding `EntreeCarriere` rows with `categorie = MANDAT_GOUVERNEMENTAL` and `source = ASSEMBLEE`. This avoids duplication while keeping the timeline complete.

**`InteretDeclare`** — Structured data from HATVP interest declarations.

Fields:
- `id` — UUID
- `personnaliteId` — FK
- `declarationRef` — HATVP declaration identifier
- `dateDeclaration` — when filed
- `rubrique` — which section of the declaration: `ACTIVITE_ANTERIEURE` | `MANDAT_ELECTIF` | `PARTICIPATION` | `ACTIVITE_CONJOINT` | `ACTIVITE_BENEVOLE` | `REVENU` | `DON_AVANTAGE`
- `contenu` — the declared item text
- `organisation` — if applicable (company name, association, etc.)
- `montant` — if applicable (declared revenue)
- `dateDebut`, `dateFin` — if applicable
- `alerteConflit` — boolean, flagged by research agent if portfolio overlap detected
- `commentaireConflit` — explanation of the potential conflict

**`EvenementJudiciaire`** — Judicial proceedings and legal events.

Fields:
- `id` — UUID
- `personnaliteId` — FK
- `date` — when it happened
- `type` — enum: `ENQUETE_PRELIMINAIRE` | `MISE_EN_EXAMEN` | `RENVOI_CORRECTIONNELLE` | `CONDAMNATION` | `RELAXE` | `CLASSEMENT_SANS_SUITE` | `NON_LIEU` | `APPEL` | `GARDE_A_VUE` | `COUR_JUSTICE_REPUBLIQUE`
- `nature` — free text: "abus de confiance", "prise illégale d'intérêts", etc.
- `juridiction` — "PNF" / "CJR" / "Tribunal correctionnel de Paris"
- `statut` — enum: `EN_COURS` | `CLOS` | `APPEL_EN_COURS`
- `resume` — 1–2 sentence factual summary
- `sourcePrincipale` — outlet name: "Le Monde" / "Mediapart"
- `sourceUrl` — direct link to the article
- `sourceDate` — publication date of the cited article
- `verifie` — boolean: has a human reviewed this entry?

Why is `verifie` critical? Because this is the one section where an error has legal consequences. A false claim about a judicial proceeding is defamation under French law. The workflow must be: AI agent produces a draft entry with source, human reviews and sets `verifie = true`, only then does it display on the profile. Unverified entries can be held in a review queue visible only to editors.

**`ActionLobby`** — From AGORA registry, linked to minister portfolios.

Fields:
- `id` — UUID
- `representantNom` — lobby organization name
- `representantCategorie` — "Entreprise" / "Syndicat" / "ONG" / etc.
- `ministereCode` — target ministry code (matched to `MandatGouvernemental.ministereCode`)
- `domaine` — policy domain of the lobby action
- `typeAction` — "Rendez-vous" / "Communication écrite" / "Événement"
- `exercice` — year
- `depensesTranche` — spending bracket
- `sourceUrl` — link to AGORA registry entry

No direct FK to `PersonnalitePublique` — the link is indirect via `ministereCode`. This is intentional: the lobby registry declares interactions with a ministry, not necessarily with the minister personally. The profile page joins through the minister's current portfolio.

### Relationships

```
PersonnalitePublique
  ├── has many MandatGouvernemental (their government roles)
  ├── has many EntreeCarriere (their full timeline)
  ├── has many InteretDeclare (HATVP declarations)
  ├── has many EvenementJudiciaire (legal proceedings)
  ├── belongs to? Depute (if they were a député)
  ├── belongs to? Senateur (if they were a senator)
  └── linked via ministereCode → ActionLobby (lobby activity targeting their ministry)
```

---

## Implementation Phases

### Sub-phase 9A: Data Model + Government Composition Seed (1 session)

**Goal:** Create the Prisma schema, seed the current government composition, and build the basic profile page shell.

**Reasoning:** You need the skeleton before you can fill it. The current government has ~35 members (PM + ministers + delegate ministers + secretaries of state). Manually entering their basic info (name, title, dates, photo) takes less time than trying to automate it from an unstructured source. This gives you something to show immediately.

**Tasks:**

1. **Add Prisma models** — `PersonnalitePublique`, `MandatGouvernemental`, `EntreeCarriere`, `InteretDeclare`, `EvenementJudiciaire`, `ActionLobby`. Run migration.

2. **Create seed script for current government** — A TypeScript file that upserts the current ~35 government members with their basic info. Source this from gouvernement.fr manually. Include: name, title, short title, government name, start date, type (ministre/délégué/secrétaire), and photo URL. This is a one-time manual effort — the same approach you used for initial département data.

3. **Create the President's record** — Special case: the President isn't part of the "Gouvernement" in the constitutional sense. Create their `PersonnalitePublique` with `MandatGouvernemental` of type `PRESIDENT`. Include previous presidential mandates if re-elected.

4. **Build basic profile page** — `/gouvernement/[slug]/page.tsx`. Server component that fetches the `PersonnalitePublique` with their mandates. At this point, just render: photo, name, current title, dates in office, and empty placeholders for the sections that will come later (career, interests, judicial, lobby). Use the bureau aesthetic — dark cards, teal accents, same typography as the rest of the platform.

5. **Build government index page** — `/gouvernement/page.tsx`. Grid of all current government members, sorted by protocol order. Photo + name + short title. Click to navigate to individual profile.

6. **Cross-reference députés** — For each government member, check if they exist in your `Depute` table (match by name). If so, set the `deputeId` FK. Their profile page can then show a "Voir le profil parlementaire →" link.

**What ships:** A `/gouvernement` page listing all current ministers, and a `/gouvernement/[slug]` profile page with basic identity info and empty section placeholders. Not impressive yet, but structurally complete.

### Sub-phase 9B: HATVP Ingestion — Declared Interests (1–2 sessions)

**Goal:** Ingest all HATVP interest declarations for government members and display them on profile pages.

**Reasoning:** This is the highest-value structured data source. Interest declarations are the foundation of transparency — they tell you what financial interests, professional relationships, and potential conflicts each minister carries. And it's fully open data, machine-readable, and legally unambiguous. This is also the section that no other French platform presents well — HATVP's own website requires navigating PDF scans.

**Tasks:**

1. **Download and parse HATVP data**

   - Fetch `liste.csv` from hatvp.fr/open-data — this is the index of all published declarations.
   - Filter to declarations where `qualite` contains "Ministre" or "Secrétaire d'État" or "Premier ministre" or "Président de la République" — this gives you the ~100–200 declarations relevant to government officials (multiple declarations per person across governments).
   - For each relevant declaration, fetch the XML content from the declarations file.

2. **Parse XML declarations into structured data**

   The HATVP XML follows a schema with numbered sections. Map each section to your `InteretDeclare` model:
   - Section 1: Mandats électifs (past and present) → `rubrique = MANDAT_ELECTIF`
   - Section 2: Activités professionnelles des 5 dernières années → `rubrique = ACTIVITE_ANTERIEURE`
   - Section 3: Activités de consultant → `rubrique = ACTIVITE_ANTERIEURE`
   - Section 4: Participations financières → `rubrique = PARTICIPATION`
   - Section 5: Activités professionnelles du conjoint → `rubrique = ACTIVITE_CONJOINT`
   - Section 6: Fonctions bénévoles → `rubrique = ACTIVITE_BENEVOLE`
   - Section 7: Revenus → `rubrique = REVENU`
   - Section 8: Dons et avantages → `rubrique = DON_AVANTAGE`

   The tricky part is matching declarations to your `PersonnalitePublique` records. HATVP uses full names with accents and titles — you'll need normalization (lowercase, remove accents, trim particles like "de") and potentially manual override for edge cases.

3. **Build the interests section on the profile page**

   Display declared interests grouped by rubrique, with the declaration date and a link to the HATVP original. Use collapsible sections — some ministers have 30+ declared items across all rubriques, and you don't want to overwhelm the page.

   The "Points d'attention" sub-section is where it gets interesting. For each declared activity/participation, check if it overlaps with the minister's current portfolio. Example: minister declared shares in pharmaceutical company + their portfolio includes health policy → flag it. This can start as a manual annotation and later be assisted by the research agent.

4. **Handle multiple declarations per person**

   A minister typically has: one declaration at appointment, possibly a modification during their tenure, and one at end of mandate. Display the most recent one by default, with a dropdown to see historical declarations. Always show the HATVP's formal assessment ("appréciation") if published.

**What ships:** The interests section on every minister profile, populated with structured data from HATVP. Link back to original HATVP declaration for full transparency.

### Sub-phase 9C: AGORA Lobby Registry Integration (1 session)

**Goal:** Show which lobbying organizations have declared interactions targeting each minister's portfolio.

**Reasoning:** The lobby registry is the most underused transparency tool in France. The data exists, is published nightly, but is nearly impossible for a citizen to navigate — the AGORA website is organized by lobbying organization, not by target. Inverting this index so citizens can look up "who lobbied the Minister of Agriculture?" is a genuinely novel feature.

**Tasks:**

1. **Download and parse AGORA JSON**

   The consolidated JSON is ~80MB. Parse it once and extract the fields you need: organization name, category, declared activities (with target ministry, domain, action type, spending bracket, and exercise year).

2. **Build ministry matching table**

   This is the non-trivial part. Lobby declarations use free-text fields for target ministries: "Ministère de la Transition écologique et de la Cohésion des territoires" vs. your `MandatGouvernemental.ministereCode`. Create a manual mapping table that normalizes these to your internal codes. This needs maintenance on each government reshuffle (because ministry names change).

3. **Ingest into `ActionLobby` table**

   Filter to actions targeting ministerial cabinets (not all lobby activity targets the executive — some targets parliament or independent agencies). Upsert with deduplication on organization + ministry + exercise year.

4. **Build the lobby section on the profile page**

   Show: total number of declared lobby actions targeting this ministry in the current year, top organizations by action count, breakdown by domain (fiscal policy, environment, digital, etc.), and spending bracket distribution. Each entry links back to the AGORA registry for the full declaration.

   Important UX note: frame this neutrally. Lobbying is legal and declared. The section title should be "Lobbying déclaré ciblant ce ministère" (not "Lobby influences on this minister"). The purpose is transparency, not accusation.

**What ships:** The lobby section on every minister profile. Citizens can see which organizations declared interactions with the ministry, on what topics, and at what spending levels.

### Sub-phase 9D: Career Timeline — Structured Sources (1 session)

**Goal:** Build the vertical career timeline using data already available in structured form (HATVP + Assemblée Nationale + government composition).

**Reasoning:** You can construct a surprisingly complete career timeline without any press research, just by combining three structured sources: HATVP declarations (which include 5 years of previous activities), your existing Assemblée Nationale data (parliamentary history), and your own `MandatGouvernemental` records (government roles). This gets you maybe 60–70% of the timeline with zero AI involvement.

**Tasks:**

1. **Auto-generate `EntreeCarriere` from existing data**

   Write a script that, for each `PersonnalitePublique`:
   - Creates timeline entries from all their `MandatGouvernemental` records (government roles)
   - Creates timeline entries from their `Depute` or `Senateur` records (parliamentary mandates)
   - Creates timeline entries from their `InteretDeclare` records where `rubrique = ACTIVITE_ANTERIEURE` (previous professional activities declared to HATVP — these include job titles, organizations, and date ranges)
   - Deduplicates where the same role appears in multiple sources

2. **Build the timeline UI component**

   A vertical timeline, reading from present (top) to past (bottom). Three visual styles by category:
   - Government roles: filled accent bar with duration visualization (like the mockup above)
   - Elected mandates: open circle marker
   - Private career / civil service / education: diamond marker, slightly muted

   Each entry shows: date range, title, organization, and a small source badge (HATVP / AN / Manual). Clicking the source badge opens the original document.

3. **Handle the education section**

   HATVP declarations include education in the "activités antérieures" section, but inconsistently. For the most prominent ministers (President, PM, key ministers), manually add education entries: école, university, grandes écoles, agrégation, etc. These are easily verifiable facts and don't require press research.

4. **Surface data gaps**

   For ministers with thin timelines (few HATVP entries, no parliamentary history), display a visual indicator: "Parcours partiel — sources structurées uniquement." This signals to users (and to your future research agent) that this profile would benefit from enrichment.

**What ships:** A visual career timeline on every minister profile, auto-populated from structured sources. Some timelines will be rich (former députés with long political careers), others will be sparse (recently appointed technocrats). That's fine — the research agent fills the gaps in 9F.

### Sub-phase 9E: Profile Page — Full UI Build (1 session)

**Goal:** Build the complete profile page with all sections, responsive layout, and proper bureau aesthetic.

**Reasoning:** At this point you have data for 4 of the 5 profile sections (identity, career, interests, lobby). Before tackling the research agent for judicial/career enrichment, build the full UI so the team can see the product vision end-to-end and identify what's missing.

**Tasks:**

1. **Profile page layout**

   Top section: photo + identity card (name, title, age, education summary, party, constituency if applicable). This is the "at a glance" view.

   Below, tabbed or scrollable sections:
   - **Parcours** — the career timeline from 9D
   - **Intérêts déclarés** — HATVP interests from 9B, with conflict flags
   - **Affaires judiciaires** — empty or populated from 9F (show "Aucune affaire référencée" when empty, not an empty section)
   - **Lobbying** — AGORA data from 9C
   - **Profil parlementaire** — if they were a député/sénateur, link to or embed key stats (voting record, loyalty score, participation). This cross-references your existing data.

2. **Government index page refinement**

   The `/gouvernement` page needs more than a grid. Consider:
   - Group by type: President → PM → Ministres → Ministres délégués → Secrétaires d'État
   - Show current government name and date of formation
   - Historical governments as a dropdown or secondary tab (every government since start of current presidency)
   - Search/filter by portfolio keyword

3. **Navigation integration**

   Add "Gouvernement" to the main navbar. On dossier pages (e.g., `/dossiers/sante`), add a "Ministre en charge" card linking to the relevant minister profile. On territory pages, if the local député became a minister, show a badge.

4. **SEO and meta**

   Each minister profile should have proper OpenGraph tags, structured data (Schema.org Person), and a canonical URL. These pages will be highly searchable — "Bruno Le Maire parcours" is a real query people make.

5. **Print layout**

   These profiles are the kind of content journalists and researchers print. Add a `@media print` stylesheet that renders the profile as a clean, single-page CV. This is a small effort with high professional impact.

**What ships:** The complete, polished minister profile page with all sections except judicial (which awaits the research agent). The `/gouvernement` index page as a new major section of the platform.

### Sub-phase 9F: Research Agent — Career Enrichment + Judicial History (2 sessions)

**Goal:** Build an AI-assisted research workflow that enriches minister profiles with career details and judicial history from press sources.

**Reasoning:** This is the hardest and most sensitive part. It's also what makes L'Observatoire truly unique. No one else cross-references HATVP declarations with press-sourced judicial timelines in a structured, citable format. But the stakes are high — every claim must have a verifiable source, and judicial claims need human review before publication.

**Architecture decisions:**

The research agent is NOT a live, real-time feature. It's a batch process that runs per minister, produces a structured JSON output, and feeds into a review queue. Here's why:

- **Accuracy over speed.** A judicial claim that's wrong is worse than no claim at all. The agent should take its time, cross-reference multiple sources, and flag uncertainty.
- **Cost control.** Running web search + Claude API for 35+ ministers, each requiring 5–10 searches, adds up. Batch processing lets you control spend.
- **Review workflow.** A human (you, initially) reviews each output before it goes live. This is non-negotiable for judicial content.

**The agent workflow, step by step:**

1. **Input:** A `PersonnalitePublique` record with whatever data already exists (HATVP, career timeline, government mandates).

2. **Career enrichment pass:**
   - Search for "[name] parcours biographie carrière" on reputable outlets.
   - Extract career milestones not already in the timeline: education details, private sector roles, advisory positions, political party roles.
   - For each extracted item, record: what (title), where (organization), when (dates), and source (URL + date).
   - Output format: array of candidate `EntreeCarriere` objects, each marked with confidence level and source.

3. **Judicial history pass:**
   - Search for "[name] mise en examen enquête judiciaire condamnation" on Tier 1–2 sources.
   - Search for "[name] conflit d'intérêts HATVP" for ethics issues.
   - Search for "[name] CJR" (Cour de Justice de la République — the court that tries ministers for crimes committed in office).
   - For each result, extract: date, type of proceeding, nature (charges), jurisdiction, current status, and full source citation.
   - Cross-reference: if multiple outlets report the same proceeding, note corroboration. If only one source reports it, flag for extra scrutiny.
   - Output format: array of candidate `EvenementJudiciaire` objects, each with `verifie = false`.

4. **Conflict detection pass:**
   - Compare HATVP declared interests (from 9B) against the minister's current portfolio.
   - Flag entries where there's domain overlap: e.g., declared shares in energy company + portfolio includes energy transition.
   - This is deliberately conservative — flag for human review, don't auto-publish conflict allegations.
   - Output format: annotations on existing `InteretDeclare` records with `alerteConflit = true` and `commentaireConflit` explaining the potential overlap.

5. **Output:** A JSON file per minister with three arrays: enriched career entries, judicial events, and conflict flags. This feeds into the review queue.

**The review queue:**

Build a simple admin interface (could be a basic Next.js page behind authentication, or even a Google Sheet for v1) where you can:
- See all pending research agent outputs
- For each item: accept (publishes to the live profile), reject (discards), or edit (correct details before publishing)
- Track: who reviewed, when, and any notes

For v1, this can be as simple as a CLI script that reads the agent output JSON, shows you each item, and asks accept/reject/edit. Don't over-engineer the admin UI until you know the volume and review cadence.

**Implementation:**

The agent itself is a Node.js script that calls the Claude API with web search enabled. For each minister:

```
System prompt: You are a French political researcher. Given a public official's profile data,
search for and extract factual career milestones and judicial proceedings from reputable French
press sources. Every claim must include: the exact source URL, publication date, and outlet name.
Never synthesize claims from memory — only extract from search results. If you find no
judicial proceedings, explicitly state that none were found. Distinguish between confirmed
legal proceedings (public record) and allegations (press reporting).

User prompt: [minister's existing profile data as JSON]
Research this person. Return structured JSON with career_entries[] and judicial_events[].
```

Run this for each minister, save outputs, review, and ingest accepted items.

**What ships:** Enriched career timelines and judicial history sections on minister profiles. A review workflow ensuring accuracy. The foundation for ongoing profile maintenance as new events occur.

### Sub-phase 9G: President Special Profile + Historical Governments (1 session)

**Goal:** Build an expanded profile for the President and an archive of past governments within the current and previous presidencies.

**Reasoning:** The President's profile deserves special treatment — they're not just another minister. And having historical government compositions lets users trace political trajectories (who served under which PM, how long, in what portfolio).

**Tasks:**

1. **President's expanded profile**

   Same structure as minister profiles, plus:
   - **Election results:** vote shares for each round, opponent name, date. Structured data from data.gouv.fr (election results are published as open data).
   - **Government appointments:** list of all governments formed under this president, with PM names and dates. Each links to the `/gouvernement?mandat=X` filtered view.
   - **Constitutional powers exercised:** Article 49.3 invocations (count + dates), dissolution (if any), referendums, state of emergency declarations. These are factual, verifiable events.
   - **International representation:** G7/G20 presidencies, EU Council presidency, major treaties signed. Sourced from institutional records.

2. **Historical governments archive**

   Extend the `/gouvernement` page to show past governments within the current presidency (and ideally the previous one — Hollande era as historical reference). For each past government: PM name, formation date, dissolution date, full member list.

   The Assemblée Nationale's open data includes historical government compositions — check their "Gouvernement" dataset. Alternatively, Wikipedia's structured data (via Wikidata API) has this information in machine-readable form.

3. **"Parcours politique" cross-links**

   For ministers who served in multiple governments, their career timeline should show the progression: "Secrétaire d'État aux Transports (Gvt Borne)" → "Ministre délégué aux Transports (Gvt Attal)" → "Ministre des Transports (Gvt Bayrou)". Each links to the government composition page for that period.

**What ships:** An authoritative President profile page, and a historical governments archive that lets users explore who held power, when, and in what configuration.

---

## Route Structure

```
/gouvernement                          → Government index (current + historical)
/gouvernement/[slug]                   → Individual profile (minister/PM)
/president                             → President's expanded profile (redirect or standalone)
/gouvernement?mandat=borne             → Filter by specific government
/gouvernement?type=ministre            → Filter by role type
```

This adds ~40 new dynamic routes (one per government member) plus 2 index pages. Total platform routes after Phase 9: ~100.

---

## Data Volume Assessment

Sanity check on whether this strains the existing stack:

| Table | Estimated rows | Growth rate |
|-------|---------------|-------------|
| PersonnalitePublique | ~50 (current gov + president + recent PMs) | +30–40 per reshuffle |
| MandatGouvernemental | ~150 (across 3–4 recent governments) | +30–40 per reshuffle |
| EntreeCarriere | ~500 (avg 10 entries × 50 people) | Grows with research agent |
| InteretDeclare | ~1,500 (avg 30 items × 50 people) | Grows with HATVP updates |
| EvenementJudiciaire | ~30–50 (most ministers have 0, some have 2–3) | Slow growth |
| ActionLobby | ~50,000 (full AGORA registry) | ~10K/year |

This is tiny. PostgreSQL won't notice. The AGORA lobby data is the largest at 50K rows, which is still trivial. No architectural changes needed.

---

## Quality and Legal Considerations

### Sourcing Standards

Every piece of information on a minister profile must trace to one of:

1. **Institutional source** (HATVP, Assemblée Nationale, gouvernement.fr, Journal Officiel) — highest authority, no review needed
2. **Tier 1 press source** (AFP, France Info, Public Sénat) — high trust, standard review
3. **Tier 2 press source** (Le Monde, Mediapart, Le Canard Enchaîné) — high trust for investigative content, standard review
4. **Tier 3 press source** (Libération, Le Figaro, Les Échos) — acceptable for career facts, extra scrutiny for judicial claims
5. **Manual entry** — clearly marked, with editor attribution

Never use: social media, blogs, partisan websites, anonymous sources, or AI-generated content without source backing.

### Legal Framework

French defamation law (Loi du 29 juillet 1881) is strict but protects factual reporting of judicial proceedings. Key principles:

- **Public proceedings are public.** Reporting that someone was mise en examen is factual and protected. Editorializing that they're "guilty" or "corrupt" is not.
- **Right of reply.** Any person mentioned on the platform has a legal right to request a correction. Build a contact mechanism and a process for handling these requests.
- **Presumption of innocence.** Always frame ongoing proceedings as "en cours" and never imply guilt. Use the exact legal terminology (mise en examen ≠ condamnation).
- **Statute of limitations.** For defamation in France, the prescription is 3 months from publication online. This is short but real — if someone challenges a claim, you need to be able to produce the source quickly.

### Editorial Stance

L'Observatoire is not a media outlet. It doesn't investigate, editorialize, or accuse. It aggregates and structures public record. The tone should be:

- Factual: "Mise en examen pour abus de confiance le 15 octobre 2024 (source : Le Monde)"
- Not: "Impliqué dans un scandale d'abus de confiance"
- Neutral: "12 actions de lobbying déclarées ciblant ce ministère en 2024"
- Not: "Sous forte pression des lobbies"

This editorial discipline is what makes the platform trustworthy. Let the data speak.

---

## Session Planning

| Session | Sub-phase | What shipped |
|---------|-----------|-------------|
| **22** | 9A | ✅ Data model (6 Prisma models + 7 enums), government seed (~35 members), basic profile shell, government index |
| **23** | 9B | ✅ HATVP interest declarations ingested (184 items for Bayrou), displayed grouped by rubrique with collapsible `<details>` |
| **24** | 9C | ✅ AGORA lobby data ingested (94,924 ActionLobby across 12 ministereCode values), lobby section on profiles |
| **25** | 9D | ✅ Career timeline auto-generated from MandatGouvernemental + Depute/Senateur sources |
| **26** | 9E (partial) | ✅ Initial profile UI |
| **27–28** | 9B/9D fix | ✅ `generate-carriere.ts` fixed: HATVP ACTIVITE_ANTERIEURE removed as career source (produced garbage entries); 12 clean EntreeCarriere records |
| **29** | 9E (final) | ✅ 4-tab redesign (Parcours default / Déclarations HATVP / Mandats & Lobbying / Activité parlementaire conditional), `ParliamentarySection` component, unified profiles (deputy/senator pages redirect to govt profile) |
| **30** | 9A cross-ref | ✅ `PersonnalitePublique.deputeId` populated for 7 ministers via SQL name-match; Gouvernement card on /representants; Bayrou groupe + Depute.actif corrections |
| **next** | 9F | Research agent — career enrichment + judicial history (Claude API + web search, review workflow) |
| **next** | 9G | President expanded profile, historical governments archive, navbar "Gouvernement" link |

---

## Updated Platform Architecture After Phase 9

| Metric | After Phase 8 | After Phase 9 |
|--------|--------------|--------------|
| Routes | ~60 | ~100 (40 minister profiles + government index + president) |
| Prisma models | ~30 | ~36 (6 new tables) |
| Data sources | INSEE, data.gouv, AN, Sénat | + HATVP, AGORA, gouvernement.fr, press (via agent) |
| Total DB rows | ~10K | ~60K (mostly AGORA lobby data) |
| Client components | ~8 | ~10 (career timeline, interest accordion, lobby chart) |
| AI-assisted features | 0 | 1 (research agent for career + judicial enrichment) |

---

## What This Unlocks for Phase 10+

Once minister profiles exist with structured career + interest + judicial data, several powerful features become possible:

- **Vote alignment overlay:** When parliamentary vote data lands (Phase 10), cross-reference minister's policy positions with how their former party group voted. "As député, this minister voted against 3 of the 5 bills they now champion as minister."

- **Revolving door tracker:** Career timeline data lets you identify patterns — ministers who came from industries they now regulate, or who leave office to join companies they previously oversaw.

- **Government stability index:** With historical government data, compute average tenure by portfolio, frequency of reshuffles, and identify the most stable vs. most volatile ministerial positions.

- **Lobby concentration analysis:** AGORA data lets you see not just who lobbied which ministry, but which organizations lobby across multiple ministries simultaneously — mapping influence networks.

- **Conflict of interest dashboard:** A platform-wide view of all flagged conflicts across all current ministers, updated as HATVP declarations are published.

None of these require new data sources — they're analytical features built on the Phase 9 foundation.