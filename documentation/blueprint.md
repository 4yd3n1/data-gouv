# Blueprint — data-gouv civic intelligence platform

Index of the current state of the platform. Canonical architectural plan: [`../ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md). This file is a pointer map, not a substitute — update it when models, routes, or section components change.

## Stack snapshot

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- PostgreSQL 14, Prisma 7 with `@prisma/adapter-pg`
- pnpm, Node 20.19.2+
- **46 Prisma models** + `IngestionLog`, ~1M rows (Session 47 added `DecretDeport`; Session 53 added `LobbyisteDirigeant` + `LobbyisteDirigeantCarriere` + `LobbyistePosition`)
- Server-rendered everywhere — no client-side data fetching

## Documentation map

| Doc | Scope |
|-----|-------|
| [`schema.md`](schema.md) | All Prisma models, enums, row counts, field names |
| [`frontend.md`](frontend.md) | Routes, profile page tabs, section components, search, OG images |
| [`DESIGN.md`](DESIGN.md) | Design tokens (YAML frontmatter) + prose on colors / typography / layout / components / ownership layer |
| [`data-ingestion.md`](data-ingestion.md) | 10-wave ingestion pipeline, source URLs, idempotency rules |
| [`handoff.md`](handoff.md) | Session history, decisions, outstanding work |
| [`../ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md) | Long-form architectural vision |
| [`../CLAUDE.md`](../CLAUDE.md) | Agent-facing project rules |

## Phase status

| Phase | Status |
|-------|--------|
| 1–8 — foundation, ingestion, search, territory, FranceMap | ✅ complete |
| 9 — Government profiles (PersonnalitePublique, MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire, ActionLobby) | ✅ 9A–9H complete |
| 9G historical — Borne / Attal / Barnier seed files prepared | ⏳ not yet seeded |
| Session 46 — HATVP normalization + re-ingestion (1,988 InteretDeclare / 67 personnalites) | ✅ committed |
| Session 47 — **Décrets de déport** — `DecretDeport` model + `DeportBanner` + `DeportSection`, 11 seeded from `info.gouv.fr` registre | ✅ implemented, uncommitted |
| Session 48 — **Investigative front-page redesign** — masthead eye-glyph, lead/secondary/ticker layout | ✅ implemented, uncommitted |
| Session 49 — **Homepage polish + Bilan Macron re-verification + Macron-era reframing** — ~30 fact corrections, all baselines → 2017 | ✅ implemented, uncommitted |
| Session 50 — **Claude Design "Variant A" adoption** (pivot from C). Full design-system foundation: oklch palette, Source Serif 4 + Inter + JetBrains Mono, 21 investigative primitives, `/methodologie` placeholder. `/dossiers/medias` full redesign (8 sections unified via `SectionHeader`, `MediaBoard` rewritten with new tokens) | ✅ implemented, uncommitted |
| Session 51 — **FranceMap palette direction fix + DOM poverty fallback + `/signaux?type=lobby` full dashboard rewrite** (5-section: stats / ministries / representants / domaines / timeline / methodology) + homepage InteractiveStrip reframe + Bilan Macron final corrections | ✅ implemented, uncommitted |
| Session 52 — **`/profils/lobbyistes/[id]` investigative profile upgrade** — Variant A register, hero metadata `<dl>`, 4-cell stat strip, FIG. 1-4 sections (ministries · domains · timeline · samples), `getLobbyisteAgoraDetail(name)` aggregator | ✅ implemented, uncommitted |
| Session 53 — **Lobbyist ownership + government-ties layer (top-10 pilot)** — 3 new Prisma models (`LobbyisteDirigeant`, `LobbyisteDirigeantCarriere`, `LobbyistePosition`), new `lobby-owner` signal type + collector, `matchLobbyOrg` word-boundary helper, `getLobbyisteOwnership` aggregator, 3 new sections on `/profils/lobbyistes/[id]` (FIG. 3 dirigeants / FIG. 5 gov-ties / positions) + reverse view on ministre `LobbySection`, 4 editorial JSON seeds (Lysios/Anthenor/FNMF/Com'Publics), timeline chart filing-lag overlay | ✅ implemented, uncommitted; ⏳ RNE ingestion pending (API IP-rate-limited) |
| Phase 5 (site-wide token sweep — profiles/signaux/territoire to ink-*/fg-*, delete `bureau-*` + DM Sans + Instrument Serif) | ⏳ deferred |

## Session 47 — at a glance

- **New model** `DecretDeport` with `BasisDeport` enum (7 categories). Migration `20260421165309_add_decret_deport`.
- **Source of truth** `https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets` — not HATVP. HATVP issues private recommendations; the PM signs + publishes the décret to JORF.
- **11 décrets seeded** (Lecornu, Darmanin, Papin, Barrot, Rist, Amiel, Baptiste, Tabarot, Bergé, Chabaud, Forissier). HATVP press release cited 14; 3 décrets signed but not yet in the registre.
- **UI surfaced** on `/profils/[slug]`: `DeportBanner` (cross-tab red strip below `ProfileHero`) + `DeportSection` (full cards in Déclarations HATVP tab, `#deports` anchor).
- **Scripts**: `scripts/seed-decrets-deport.ts` (idempotent upsert on `(personnaliteId, perimetre)`).

## Session 50 — at a glance

- **Mockup source**: Claude Design tool output at [`/design-ref/`](../design-ref) — user exported `variant-a.jsx` + `variant-c.jsx` + `chrome.jsx` + `signals.jsx` + `viz.jsx` + `tokens.css`. Chose Variant C first, then pivoted to Variant A mid-session for lower clutter.
- **Token foundation** (kept across the C→A pivot — palette-level, not layout-specific): `--color-ink-0..3` + `--color-fg*` + `--color-signal`/`--color-verified`/`--color-warn` oklch tokens; type tokens `--fs-mono-xs/sm/body/lede`; hairlines `--line`/`--line-2`. Legacy `bureau-*`/teal/amber/rose kept for backward-compat (progressive migration).
- **Fonts**: Inter (body) + Source Serif 4 (display, w. italic) + JetBrains Mono (new, was absent). Utilities `.obs-mono`, `.obs-serif`, `.hd`, `.eyebrow`, `.sig-tag` × 4, `.src-chip`, `.hair`, `.lnk-arrow`, `.pulse`, `.obs-card`, `.obs-footnote`.
- **Homepage**: `src/app/page.tsx` rebuilt as Variant A — Dateline → `.hero-grid` (HeroLead + HeroVisualisation) → `.secondary-grid` (3× SecondaryArticle + SignalsRail) → InteractiveStrip (real 12 819 PRESIDENCE lobby count from `getTopLobbyTargets`) → MethodologyNotes. New aggregator `src/lib/homepage-data.ts::getHomepageData()` — React.cache-wrapped, 6 parallel queries. **AGORA `ministereCode` is UPPERCASE_UNDERSCORE** (`ECONOMIE_FINANCES`, `MATIGNON`, `PRESIDENCE`, …) — label map in `homepage-data.ts`.
- **21 investigative primitives** in [`src/components/investigative/`](../src/components/investigative). Variant A uses: `Dateline`, `HeroLead`, `HeroVisualisation`, `SecondaryArticle`, `InteractiveStrip`, `MethodologyNotes`, plus shared (`SrcChip`, `Footnote`, `ReadLink`, `Spark`, `Eyebrow`, `SignalsRail`, `SignalCardC`). Variant C primitives (`ClassificationBar`, `BriefingRow`, `LeadDossier`, `SecondaryDossierCard`, `BarRows`, `TimelineDots`, `IndicesPanel`, `DataHealthStrip`, `ChoroplethFigure`) built but not rendered on homepage — retained for reuse on `/signaux/[id]`, briefings, dashboards. `/methodologie` already reuses `ClassificationBar` + `Eyebrow`.
- **Chrome refresh** (`src/app/layout.tsx`): `ObservatoireLogo` concentric-circles crosshair replaces eye-glyph; 5th nav item **Méthode**; 4-col footer via `.footer-grid` with added Contribuer column. Body/nav/footer migrated to `ink-*`/`fg-*` tokens (pattern reference for Phase 5 sweep).
- **`/methodologie`** (`src/app/methodologie/page.tsx`): placeholder page with 5 sections (Sources / Signaux / Mise à jour / Correction / Charte éditoriale) — each uses `Eyebrow` + `.hd` title + body + "Page dédiée — À venir" tag. First cross-route reuse of `ClassificationBar`.
- **`/dossiers/medias` full redesign** (`src/app/dossiers/medias/page.tsx`): local `SectionHeader` helper unifies all 8 sections with `◆ KICKER` + `FIG. N` + `.hd` title + serif subtitle + optional `SrcChip` meta. New investigative hero inline (replaces `DossierHero`) with 4-col stat strip. LARP badges stripped from every section header ("Confidentiel", "Incidents régulatoires", "Liens croisés", "AGORA", "Analyse structurelle", "Surveillance active"). PowerMap center label polished (serif 28px total + JetBrains Mono "MÉDIAS RECENSÉS" + dashed red outer ring). New responsive grid classes: `.medias-hero-stats` / `.lobby-culture-grid` / `.powermap-layout` / `.media-board-grid` / `.media-card` / `.media-card-expanded`.
- **`MediaBoard` rewrite** (`src/components/media-board.tsx`): legacy `dossier-card` rounded-xl + teal/bureau-* palette → rectangular `.media-card` on `--color-ink-1` + `--line` borders. Type colors remapped to oklch CSS vars (TELEVISION/PRESSE_QUOTIDIENNE=verified, RADIO=warn, NUMERIQUE=signal, etc.). Square outlined avatars, mono rectangular filter pills with "FILTRER" label, `.sig-tag`/`.sig-tag--amber` ARCOM/GOV badges. **Republique alignment fix**: added `minHeight: 22` fortune-row slot so the orphan Republique card shows `SERVICE PUBLIC · 100% controle` placeholder instead of a shorter collapsed row. Expanded panel: 2-col `minmax(240px,300px) 1fr` — owner dossier `<dl>` grid + subsidiaries with per-type outlined filiale pills.
- **Bug fixes**: (a) `arcom-section.tsx` hydration — `getFullYear` → `getUTCFullYear` (server UTC vs. client Paris timezone drift); (b) mini-map 404 — `HeroVisualisation` and `ChoroplethFigure` `linkBase="/territoire/"` (trailing slash required, `FranceMap.handlePathClick` builds `${linkBase}${code}` with no separator); (c) CSS comment parse bug — `bureau-*/teal` inside `/* */` prematurely closed the block, renamed to "bureau and teal"; (d) MINISTRY_LABELS kebab-case → UPPERCASE_UNDERSCORE.
- **LARP discipline** (Session 48 rule retained): Dateline shows real `IngestionLog.createdAt`; InteractiveStrip shows real AGORA count not mockup's decorative 1 289; no fake édition numbers / bylines / case-IDs / read times / source counts / figure ratios / `EN DIRECT` / `MISE À JOUR AUTO`.
- **Verification**: `pnpm build` + `pnpm exec tsc --noEmit` both clean. 7 routes 200. 25 Variant A sentinels present, 11 LARP strings absent. Chrome extension flaky on continuous screenshots — final verification via DOM queries.

## Session 53 — at a glance

- **3 new Prisma models** (migration `20260423112256_add_lobbyiste_dirigeant_layer`):
  - `LobbyisteDirigeant` — officers of a lobby. `source` enum: `RECHERCHE_ENTREPRISES | RNE_INPI | RESEARCH | HATVP`. Soft FK `personnaliteId` to `PersonnalitePublique` via `(nomNormalise, prenomNormalise)` compound index. Privacy: `dateNaissanceAnnee` year-only, `nationalite` stored but never displayed per-person.
  - `LobbyisteDirigeantCarriere` — carrière timeline per dirigeant. `categorie` enum: `FORMATION | FONCTION_PUBLIQUE | CABINET_MINISTERIEL | MANDAT_ELECTIF | MANDAT_GOUVERNEMENTAL | ENTREPRISE_PRIVEE | LOBBY | ASSOCIATION | MEDIA | AUTRE`. Per-row `verifie` flag defaults to `false`.
  - `LobbyistePosition` — editorial stances ("ce que X défend"). Only `verifie = true` rows render on the UI; pending rows surface a counter.
  - Reverse relations added to `Lobbyiste` (`dirigeants`, `positions`) and `PersonnalitePublique` (`dirigeantRoles`).
- **Ingestion**:
  - Structural: [`scripts/ingest-rne-dirigeants.ts`](../scripts/ingest-rne-dirigeants.ts) — `recherche-entreprises.api.gouv.fr/search` (free, unauthenticated, 7 req/s). Serial `CONCURRENCY = 1` + 500 ms pacing + exponential backoff (5× up to 5 s). Auto-matches dirigeants to `PersonnalitePublique` / `Depute` / `Senateur` via normalized-name compound index. Fallback `?q=<nom>` for HATVP-only ids (e.g. Plead `H771956256`). ⏳ **Not yet run — IP was rate-limit-blocked during pilot attempts; retry in a later session**.
  - Editorial: `data/research-output/lobbyistes/<lobbyisteId>.json` files, all `verifie = false` pending manual review. [`scripts/ingest-research-output.ts`](../scripts/ingest-research-output.ts) extended with `--lobbyistes` / `--lobbyiste <id>` flags. 4 seeded (Lysios + Anthenor + FNMF + Com'Publics, 27 carrière + 6 positions).
- **New signal type `lobby-owner`** ([`src/lib/signals.ts::collectLobbyOwnerLinks()`](../src/lib/signals.ts), severity helper in [`src/lib/signal-types.ts::lobbyOwnerLinkSeverity()`](../src/lib/signal-types.ts)): detects 4 link kinds — `dirigeant_direct` (current) / `ancien_dirigeant` / `carriere_prive` / `interet_declare`. Freetext-matched against `EntreeCarriere.organisation` + `InteretDeclare.organisation`. Severity CRITIQUE when `direct × ≥ 1 000` AGORA declarations. Surfaces ~40 unique signals on existing DB data with zero new ingestion (Clara Chappaz ↔ Google France, Roland Lescure ↔ Natixis, Jean-Pierre Farandou ↔ SNCF, Monique Barbut ↔ Air Liquide, Laurent Panifous ↔ Danone, Éléonore Caroit ↔ Business France, etc.).
- **`matchLobbyOrg(lobbyCore, orgUpper)`** ([`src/lib/lobby-overview.ts`](../src/lib/lobby-overview.ts)): word-boundary regex match in both directions. Catches acronym-in-expansion (`MEDEF` inside `MOUVEMENT DES ENTREPRISES DE FRANCE`); rejects substring false-positives (`ORANGE ↔ ORANGERIE`). **Known limitation**: does NOT handle acronym ↔ expansion pairs where the acronym isn't a substring of the expansion (e.g. a minister's `EntreeCarriere.organisation = "MEDEF"` vs `Lobbyiste.nom = "MOUVEMENT DES ENTREPRISES DE FRANCE"` doesn't match). Planned: add `Lobbyiste.sigle` alias column.
- **New aggregator `getLobbyisteOwnership(lobbyisteId)`** ([`src/lib/lobby-overview.ts`](../src/lib/lobby-overview.ts)): `React.cache`-wrapped. Returns `{ dirigeants, positions, govTies, counts }`. `govTies` computed at query time — no pre-computed table.
- **UI surface** on [`src/app/profils/lobbyistes/[id]/page.tsx`](../src/app/profils/lobbyistes/[id]/page.tsx) — 3 new sections rendered unconditionally (even when AGORA match is null):
  - **FIG. 3 "Qui dirige X"** — grid of dirigeant cards, collapsible `<details>` with carrière timeline, source badges (RECHERCHE ÉDITORIALE / RNE API.GOUV), À VÉRIFIER warning for unverified entries.
  - **FIG. 5 "Liens avec le gouvernement"** — table of gov-ties, kind badges, links to minister profiles.
  - **"Ce que X défend"** — editorial positions, `verifie = true` filtered.
  - Component: [`src/components/signaux/lobbyiste-ownership.tsx`](../src/components/signaux/lobbyiste-ownership.tsx) — 3 exported subcomponents (`DirigeantsSection`, `GovTiesSection`, `PositionsSection`).
  - FIG. label numbering is conditional: when `agora` exists, labels run 1 → 6 (ministries · domains · **dirigeants** · timeline · **gov-ties** · samples). When `agora` is null, the 3 new sections drop their FIG. prefix.
- **Reverse view on `/profils/[slug]`** ([`src/components/gouvernement/lobby-section.tsx`](../src/components/gouvernement/lobby-section.tsx)): new red-accented "Dirigeant de lobby" block at the top of `LobbySection` when `LobbyisteDirigeant.personnaliteId = this person`. "En fonction" vs "Ancien" badges. Currently empty for all ministers (0 RNE matches yet); will populate once RNE ingestion runs.
- **`/signaux?type=lobby-owner`** — filter wired in [`src/app/signaux/page.tsx`](../src/app/signaux/page.tsx). "Liens lobby (40)" pill appears in the filter bar.
- **Timeline chart filing-lag visual** ([`src/components/signaux/lobby-timeline-chart.tsx`](../src/components/signaux/lobby-timeline-chart.tsx)): diagonal-stripe "EN COURS DE DÉPÔT" overlay + amber dashed cutoff line on years `> (currentYear - 2)`. `computeLastCompleteYear()` helper keys off HATVP art. 18-5 (3 months post-exercice-close filing deadline). Subtitle rewritten on both call-sites to cite the regulation explicitly (raw data: 2024 peak 26 050 → 2025 partial 3 614 → 2026 barely started 101).
- **DESIGN.md extensively updated**: new frontmatter description; 12 new YAML `components:` entries for dirigeant/position/empty-state/lobby-role tokens; new prose section "Ownership & government-ties layer (Session 53 — top-10 pilot)" with models, ingestion, data flow, signals, UI surface, reverse view, editorial/privacy rules, pilot status, known limitations. File grew 509 → 732 lines.
- **Editorial & privacy rules**:
  - Source of truth priority: `RECHERCHE_ENTREPRISES` > `HATVP` > `RESEARCH`. Structural record wins if structural and editorial disagree.
  - Year-of-birth only, never full DOB. No per-person nationality display.
  - Defamation guard: `verifie = false` carrière/positions never render on public surfaces without explicit "À VÉRIFIER" disclosure (mirrors `EvenementJudiciaire.verifie`).
  - Auto-match ambiguity: when normalized name matches 2+ PersonnalitePublique, `personnaliteId = null`. Never commit a guess.
- **RBE (bénéficiaires effectifs)**: deliberately NOT modeled. Public access locked by 2022 ECJ ruling (Luxembourg case); French open-data RBE bulk download withdrawn. Revisit only if legitimate-interest INPI petition granted.
- **Verification**: `pnpm exec tsc --noEmit` clean; `pnpm build` clean (33 routes); Chrome-extension DOM inspection across 9 URLs confirmed FIG. 1-6 numbering + dirigeant cards + À VÉRIFIER badges + gov-tie Clara Chappaz / Google France match + reverse view empty-state on clara-chappaz profile.

## Outstanding work

- Seed historical governments (Borne / Attal / Barnier).
- Link remaining `deputeId` values on Lecornu II ministers.
- Consider adding `deport` signal type to `src/lib/signals.ts` so `/signaux` surfaces the 11 déports.
- Re-check `info.gouv.fr` registre weekly for the 3 missing Lecornu II déports.
- **Run RNE dirigeants ingestion** for the top 10 SIRENs once the API IP is unblocked: `pnpm exec tsx scripts/ingest-rne-dirigeants.ts --siren 502999626 450089107 398995142 447525452 304426240 443061841 784668618 391576964 340388479 H771956256 --verbose`. Then scale to all 2 747 representants (run without `--siren`).
- **Flip `verifie = true`** on reviewed editorial JSON entries (Archambault / Stefanini / Chenut / Beaudet / Lamarque / Teyssier d'Orfeuil — the last pending DB verification of the Conseil de Paris claim) then re-run `pnpm exec tsx scripts/ingest-research-output.ts --lobbyistes`.
- **Add `Lobbyiste.sigle` column** (or alias side-table) to unlock acronym ↔ expansion matching (MEDEF, FNMF, CNB, UIMM, etc.).
- **Clients / mandants layer** — model HATVP partial client declarations per `Lobbyiste`. For cabinets-de-conseil (Boury / Anthenor / Lysios / Com'Publics) this is arguably more load-bearing than ownership.
- Phase 5 token sweep — migrate profiles/signaux/territoire/votes pages from `bureau-*` to `ink-*`/`fg-*` tokens; once zero callsites remain, delete `bureau-*` ramp + Instrument Serif + DM Sans imports from `globals.css` + `layout.tsx`.
- Commit Sessions 44–53 (all currently uncommitted).
