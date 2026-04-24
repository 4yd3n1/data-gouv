---
version: alpha
name: L'Observatoire
description: >
  French civic-intelligence platform. Dark editorial publication in the
  register of Le Monde / Bellingcat / ProPublica — "Bureau des données
  publiques". Tokens are dual-layered: a legacy slate/teal ramp (bureau-*)
  kept for backward compatibility, and a Session 50 oklch-based
  "investigative" ramp (ink-*, fg-*, signal/verified/warn) now load-bearing
  for the homepage, /signaux?type=lobby dashboard, lobbyist profiles, and
  the Session 53 ownership-and-government-ties layer (lobbyist dirigeants,
  carrière, positions, cross-referenced against PersonnalitePublique +
  freetext EntreeCarriere / InteretDeclare matches).

colors:
  # Investigative ramp (Session 50 — canonical going forward)
  ink-0:         "#0A0F1A"   # page background
  ink-1:         "#0F1624"   # card background (.obs-card)
  ink-2:         "#141C2E"   # raised / hover surface
  ink-3:         "#1B2438"   # deepest surface (inputs, wells)

  fg:            "#E8EAF0"   # primary text
  fg-mute:       "#8A93A8"   # secondary text, eyebrows
  fg-dim:        "#5A637A"   # tertiary, metadata
  fg-faint:      "#3F4860"   # dividers, rule-diamond glyphs

  signal:        "#E85B4A"   # editorial accent (oklch 0.70 0.17 27) — red
  signal-soft:   "#8A3B30"   # signal on dark (oklch 0.48 0.12 27)
  verified:      "#A9C5D5"   # slate-blue for "vérifié" tags (oklch 0.80 0.07 215)
  warn:          "#D8B573"   # amber for warnings (oklch 0.82 0.10 80)

  line:          "#C8D7F014" # 1px rules (rgba 200,215,240,0.08)
  line-2:        "#C8D7F024" # stronger rules (rgba 200,215,240,0.14)

  # Legacy slate ramp (still in use — do not remove until site-wide sweep)
  bureau-950:    "#080C14"
  bureau-900:    "#0C1018"
  bureau-800:    "#111827"
  bureau-700:    "#1A2236"
  bureau-600:    "#243049"
  bureau-500:    "#3B4F6E"
  bureau-400:    "#64748B"
  bureau-300:    "#94A3B8"
  bureau-200:    "#CBD5E1"
  bureau-100:    "#E2E8F0"

  # Legacy semantic accents
  teal:          "#2DD4BF"   # informatif / verified (legacy)
  amber:         "#F59E0B"   # notable / warning (legacy)
  rose:          "#F43F5E"   # critique / alert (legacy) — prefer {signal} in new work
  blue:          "#3B82F6"

typography:
  # Display — Source Serif 4 (weights 400/500/600 + italic)
  hd-xl:
    fontFamily: Source Serif 4
    fontSize: 58px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -0.012em
  hd-lg:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.01em
  hd-md:
    fontFamily: Source Serif 4
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.2
  hd-sm:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3

  # Body — Inter
  lede:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  body-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4

  # Mono — JetBrains Mono
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11.5px
    fontWeight: 500
    letterSpacing: 0.10em
    fontFeature: "'tnum' 1"
  mono-xs:
    fontFamily: JetBrains Mono
    fontSize: 10.5px
    fontWeight: 500
    letterSpacing: 0.14em
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 500
    letterSpacing: 0.02em
    fontVariation: "'tnum' 1, 'lnum' 1"

rounded:
  none: 0
  xs:   2px     # sig-tag, src-chip, classification-badge
  sm:   4px
  md:   8px
  lg:   10px    # mobile-menu, dossier-card
  xl:   14px    # obs-card large
  full: 9999px  # dots, pulses, avatars

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 72px

components:
  # Core surfaces
  page:
    backgroundColor: "{colors.ink-0}"
    textColor:       "{colors.fg}"
    typography:      "{typography.body-md}"
  obs-card:
    backgroundColor: "{colors.ink-1}"
    textColor:       "{colors.fg}"
    rounded:         "{rounded.none}"
    padding:         14px
  stat-card:
    backgroundColor: "{colors.ink-1}"
    textColor:       "{colors.fg}"
    rounded:         "{rounded.sm}"
    padding:         20px

  # Typography utilities
  headline:
    textColor:  "{colors.fg}"
    typography: "{typography.hd-xl}"
  lede:
    textColor:  "{colors.fg-mute}"
    typography: "{typography.lede}"
  eyebrow:
    textColor:  "{colors.fg-mute}"
    typography: "{typography.mono-xs}"
  eyebrow-red:
    textColor:  "{colors.signal}"
    typography: "{typography.mono-xs}"

  # Tags (Session 50 — replace .severity-* going forward; both coexist)
  sig-tag:
    backgroundColor: "#E85B4A38"    # signal at 22% (var --signal-bg)
    textColor:       "{colors.signal}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "3px 6px"
  sig-tag-verified:
    backgroundColor: "#A9C5D52E"    # verified at 18% (var --verified-bg)
    textColor:       "{colors.verified}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "3px 6px"
  sig-tag-amber:
    backgroundColor: "#D8B5732E"
    textColor:       "{colors.warn}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "3px 6px"
  sig-tag-neutral:
    backgroundColor: "transparent"
    textColor:       "{colors.fg-mute}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "3px 6px"

  # Legacy severity pills (still rendered; migrate opportunistically to sig-tag-*)
  severity-critique:
    backgroundColor: "#F43F5E14"
    textColor:       "{colors.rose}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "2px 8px"
  severity-notable:
    backgroundColor: "#F59E0B14"
    textColor:       "{colors.amber}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "2px 8px"
  severity-informatif:
    backgroundColor: "#2DD4BF0D"
    textColor:       "{colors.teal}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "2px 8px"

  # Source chip + inline link
  src-chip:
    backgroundColor: "transparent"
    textColor:       "{colors.fg-mute}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "5px 9px"
  lnk:
    backgroundColor: "transparent"
    textColor:       "{colors.fg}"
    typography:      "{typography.body-md}"
  lnk-arrow:
    backgroundColor: "transparent"
    textColor:       "{colors.fg}"
    typography:      "{typography.mono-sm}"
  lnk-arrow-hover:
    backgroundColor: "transparent"
    textColor:       "{colors.signal}"
    typography:      "{typography.mono-sm}"

  # Nav
  nav-link:
    backgroundColor: "transparent"
    textColor:       "{colors.fg-mute}"
    typography:      "{typography.mono-xs}"
  nav-link-active:
    backgroundColor: "transparent"
    textColor:       "{colors.fg}"
    typography:      "{typography.mono-xs}"

  # Buttons
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor:       "{colors.ink-0}"
    typography:      "{typography.mono-sm}"
    rounded:         "{rounded.sm}"
    padding:         "10px 16px"
    height:          40px
  button-primary-hover:
    backgroundColor: "#14B8A6"
    textColor:       "{colors.ink-0}"
    typography:      "{typography.mono-sm}"
    rounded:         "{rounded.sm}"
    padding:         "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor:       "{colors.fg}"
    typography:      "{typography.mono-sm}"
    rounded:         "{rounded.sm}"
    padding:         "10px 16px"

  # Inputs (NavSearch)
  input-search:
    backgroundColor: "{colors.ink-2}"
    textColor:       "{colors.fg}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.sm}"
    padding:         "8px 12px"
    height:          36px

  # Ownership layer (Session 53) — DirigeantsSection / GovTiesSection / PositionsSection
  dirigeant-card:
    backgroundColor: "{colors.ink-1}"
    textColor:       "{colors.fg}"
    rounded:         "{rounded.none}"
    padding:         "18px 20px"
  dirigeant-fonction-eyebrow:
    textColor:       "{colors.fg-dim}"
    typography:      "{typography.mono-xs}"
  dirigeant-name:
    textColor:       "{colors.fg}"
    typography:      "{typography.hd-sm}"
  dirigeant-badge-personnalite:
    # sig-tag when dirigeant matched to PersonnalitePublique
    backgroundColor: "#E85B4A38"
    textColor:       "{colors.signal}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.xs}"
    padding:         "3px 6px"
  dirigeant-badge-source-rne:
    # authoritative source = verified color
    backgroundColor: "transparent"
    textColor:       "{colors.verified}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.none}"
    padding:         "3px 7px"
  dirigeant-badge-source-research:
    # editorial source = muted, paired with À VÉRIFIER if verifie=false
    backgroundColor: "transparent"
    textColor:       "{colors.fg-mute}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.none}"
    padding:         "3px 7px"
  dirigeant-badge-unverified:
    backgroundColor: "transparent"
    textColor:       "{colors.warn}"
    typography:      "{typography.mono-xs}"
    rounded:         "{rounded.none}"
    padding:         "3px 7px"
  ownership-empty-state:
    backgroundColor: "{colors.ink-1}"
    textColor:       "{colors.fg-dim}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.none}"
    padding:         "22px 24px"
  position-article:
    backgroundColor: "{colors.ink-1}"
    textColor:       "{colors.fg}"
    rounded:         "{rounded.none}"
    padding:         "18px 22px"
  position-thematique:
    textColor:       "{colors.signal}"
    typography:      "{typography.mono-xs}"
  lobby-role-block:
    # red-accented "Dirigeant de lobby" reverse-view on /profils/[slug]
    backgroundColor: "#F43F5E1A"
    borderColor:     "#F43F5E4D"
    textColor:       "{colors.fg}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.xl}"
    padding:         "12px 16px"
---

## Overview

L'Observatoire is an investigative publication built on open government data
(data.gouv.fr, HATVP, AGORA, INSEE). The aesthetic is **"Intelligence Bureau"**:
dark canvas, high-contrast neutrals, one restrained accent colour per context
(signal red for live/critique, verified slate-blue for confirmed facts, warn
amber for partial data). Typography carries hierarchy — decoration does not.

**Register**: Le Monde Décodeurs / Bellingcat / ProPublica. French copy, direct
and natural, no editorial theatrics. Numbers in French format (`1 234,56 €`),
dates in French-long (`23 avril 2026`). No emojis in UI.

**LARP discipline is load-bearing.** The site is a real data publication, not a
cosplay of one. Do not introduce fake édition numbers, fake bylines
(`PAR LA RÉDACTION`), fake case-IDs (`DOS-12-2026`, `SIG-XXX`), fake read-times,
fake figure ratios (`FIG. 1/7` unless the count is real), or `EN DIRECT`
wording (the site revalidates every 3600 s, it is not streaming). Every
displayed timestamp must trace to `IngestionLog.createdAt` or equivalent.

## Colors

The palette has two layers. Both are valid — pick the one that fits the
section you're editing and don't mix within a single component.

### Investigative ramp (canonical, Session 50 onward)

- **ink-0 → ink-3**: dark surfaces. Page = `ink-0`, card = `ink-1`, hover /
  raised = `ink-2`, deepest = `ink-3`. Never put text directly on `ink-0` in a
  card — step up to `ink-1` for a readable surface.
- **fg / fg-mute / fg-dim / fg-faint**: text hierarchy. `fg` for primary
  content, `fg-mute` for secondary (metadata, eyebrows), `fg-dim` for tertiary,
  `fg-faint` only for separator glyphs (`.rule-diamond`).
- **signal**: the one editorial accent. Use for active "live" state, eyebrow
  red (`.eyebrow--red`), primary `.sig-tag`, critical footnote superscripts,
  pulsing dots. Do not use as a background for reading surfaces.
- **verified**: cool counterweight to `signal`. Use on tags that mark a claim
  as cross-referenced / court-documented / source-verified.
- **warn**: amber for "partial data" / "reviewing" — not for errors.

### Legacy ramp (still in use)

- **bureau-950 → 100**: slate ramp. Pages not yet migrated (most profile
  pages, territory, votes) still use this.
- **teal / amber / rose / blue**: legacy semantic accents. `rose` ≈ `signal`
  editorially, `teal` ≈ `verified`. Migration is per-file and opt-in — a PR
  that migrates one page is fine; a PR that migrates the whole site is not
  currently scoped.

### Contrast targets (WCAG AA 4.5:1)

- `fg` on `ink-0`: ✓ ~14.1:1
- `fg` on `ink-1`: ✓ ~13.5:1
- `fg-mute` on `ink-0`: ✓ ~6.3:1
- `fg-dim` on `ink-0`: ✗ ~3.2:1 — **metadata only, never body copy**
- `fg-faint` on `ink-0`: ✗ ~1.9:1 — **decorative glyphs only**
- `signal` on `ink-0`: ✓ ~5.4:1
- `verified` on `ink-0`: ✓ ~8.7:1

## Typography

**Three families**, loaded via `next/font` in `src/app/layout.tsx`:

- **Inter** (`--font-body`): UI text, body copy, metadata.
- **Source Serif 4** (`--font-display`, weights 400/500/600 + italic):
  headlines, ledes, editorial pull-quotes. Use `.hd` or `.obs-serif`.
- **JetBrains Mono** (`--font-mono`): eyebrows, nav labels, tags, source
  chips, numeric data values (tabular figures).

**Hierarchy rules**:

1. A page has one `hd-xl` — the lead story headline. Secondary stories use
   `hd-md`. Section headers use `hd-sm`.
2. `.hd em { font-style: italic }` — italics in headlines are load-bearing
   typographic rhythm, not emphasis. `HeroLead` on the homepage uses an italic
   third line on the h1 intentionally.
3. All caps belongs to `mono-xs` / `mono-sm` (eyebrows, nav, tags). Never
   all-caps a serif or Inter string.
4. Numeric data must use `mono` with `tabular-nums` (class `.data-value` or
   `font-variant-numeric: tabular-nums`) so columns align.

## Layout

**Container widths**:

- List / hub pages: `max-w-7xl` (1280px).
- Profile pages: `max-w-4xl` (896px) — `ProfileHero` + `ProfileTabs`.
- Homepage hero/secondary: edge-hugging with `px-6` gutters, inner grids
  responsive (see below).

**Homepage Variant A grids** (defined in [globals.css](src/app/globals.css),
canonical reference [src/app/page.tsx](src/app/page.tsx)):

- `.hero-grid` — 1-col below `lg:`, `minmax(0,1.15fr) 340px` at `lg:`.
- `.secondary-grid` — 1-col / 2-col / 3+rail (`repeat(3, 1fr) 340px`).
- `.interactive-strip` — 1-col below `md:`, `1fr auto` at `md:`.
- `.methodology-notes` — 1-col below `md:`, `180px 1fr` at `md:`.
- `.footer-grid` — 1-col / 2-col at `sm:` / `1.3fr 1fr 1fr 1fr` at `lg:`.

**Breakpoints** (Tailwind defaults — do not override): `sm` 640 · `md` 768 ·
`lg` 1024 · `xl` 1280 · `2xl` 1536.

**Spacing rhythm**: multiples of 4. Use the `spacing` tokens (`{spacing.md}` =
16px, `{spacing.xl}` = 32px) rather than arbitrary values.

## Elevation & Depth

This is a dark editorial surface — **elevation is communicated by surface
colour, not by shadow**.

- Base → Card: `ink-0` → `ink-1` (single step up).
- Card → Raised / hover: `ink-1` → `ink-2` (hover state for `.media-card`,
  `.stat-card`, table rows).
- Deepest (input wells, selected menu items): `ink-3`.

**Allowed shadows** (sparingly, only on interactive cards):

- `.dossier-card:hover`: `0 20px 40px -15px rgba(0,0,0,.5)` + faint teal ring.
- `.stat-card:hover`: `0 12px 32px -12px rgba(0,0,0,.4)`.

**Disallowed**: soft drop shadows under static cards; neon glows; multiple
stacked shadows. Borders (`var(--line)` or `var(--line-2)`) are preferred
over shadows for static separation.

**Animated effects** — keep under 400 ms, `cubic-bezier(0.4, 0, 0.2, 1)`:

- `.pulse` (2.2 s infinite ring — signal dots on `Dateline`, `.live-dot`).
- `.sigint-section::after` (CRT scan line, 8 s linear) — reserved for
  `/signaux`, minister hero, `/dossiers/medias`.
- `.fade-up` (600 ms, one-shot) — hero entrances only.

All animations must respect `@media (prefers-reduced-motion: reduce)`
(already handled for `.pulse`; extend if adding new keyframes).

## Shapes

**Corner radius**: intentionally restrained. Most surfaces use `{rounded.none}`
or `{rounded.xs}` (2px). Reserve `{rounded.md}` (8px) for editorial cards
(`.dossier-card`) and `{rounded.lg}` (10px) for mobile-menu controls. Avoid
`{rounded.xl}` in new work.

**1 px rules** are the primary divider everywhere. Use:

- `.hair` — `border-top: 1px solid var(--line)` (faint).
- `.hair-2` — `border-top: 1px solid var(--line-2)` (stronger, for column
  gutters, section endings).
- `.rule-diamond` — horizontal rule with a 5 px rotated-square glyph in the
  middle. Reserved for chapter breaks in long-form content.

**Iconography**: inline SVG only. `lucide-react` is **intentionally not
installed** — the bundle cost is not justified for the ~20 icons we render.
Match the existing stroke weight (1.5 px) and 16 × 16 or 20 × 20 frames.

## Components

### Primitives

The investigative primitives live in [src/components/investigative/](src/components/investigative/)
and are **server components** unless they wrap a client one:

- `Dateline`, `HeroLead`, `HeroVisualisation`, `SecondaryArticle`,
  `SignalsRail`, `SignalCardC`, `InteractiveStrip`, `MethodologyNotes`,
  `SrcChip`, `ReadLink`, `Spark`, `Eyebrow`, `Footnote` — used by the
  homepage.
- `ClassificationBar`, `BriefingRow`, `LeadDossier`, `SecondaryDossierCard`,
  `BarRows`, `TimelineDots`, `IndicesPanel`, `DataHealthStrip`,
  `ChoroplethFigure` — built for Variant C, currently unused on the
  homepage but kept for reuse on briefings, `/signaux/[id]`, dashboards.

New sections under `/profils/[slug]` must be their own component
(`<InteretsSection />`, `<LobbySection />`, `<DeportSection />`,
`<CareerSection />`). **Never inline section logic in `page.tsx`.**

### Tokens in components

When the value is in the `colors` or `typography` frontmatter, reference it
as `{colors.x}` / `{typography.y}`. This mirrors the Stitch spec and lets
the `tailwind` / `dtcg` exporters resolve it.

### Signal states

- **Live / critique**: `{colors.signal}` foreground on `ink-1`, paired with
  `.pulse` dot if currently tracking a condition.
- **Verified**: `{colors.verified}` foreground, slate-blue sig-tag.
- **Partial / under review**: `{colors.warn}`.
- **Informatif / default**: `{colors.fg-mute}`, neutral chip.

### Forms

- `NavSearch` is a client component. Never wrap it in `<form>` or `next/form`
  — browser automation + React 19 both break native submit; use `useRef` +
  `onKeyDown` + `onClick`.
- Always render `NavSearch` with `flex` (never `hidden md:flex`).

## Ownership & government-ties layer (Session 53 — top-10 pilot)

The transparency loop "who lobbies" → "who they target" → **"who's behind them"**
is implemented as three additive layers. The pilot covers the top 10 AGORA
representants; the same pipeline scales to all 2 747 when the RNE API is
unblocked.

### Models (Prisma, migration `20260423112256_add_lobbyiste_dirigeant_layer`)

- **`LobbyisteDirigeant`** — one row per officer of a `Lobbyiste`. Fields
  worth naming: `fonction`, `dateNaissanceAnnee` (year only, privacy
  minimisation — never store full DOB), `nationalite` (stored but never
  rendered per-person), `source` enum (`RECHERCHE_ENTREPRISES` |
  `RNE_INPI` | `RESEARCH` | `HATVP`), `personnaliteId` soft-FK to
  `PersonnalitePublique`, `verifie` boolean.
- **`LobbyisteDirigeantCarriere`** — carrière timeline per dirigeant.
  `categorie` enum: `FORMATION | FONCTION_PUBLIQUE | CABINET_MINISTERIEL |
  MANDAT_ELECTIF | MANDAT_GOUVERNEMENTAL | ENTREPRISE_PRIVEE | LOBBY |
  ASSOCIATION | MEDIA | AUTRE`. `verifie` defaults to `false`.
- **`LobbyistePosition`** — editorial stances ("ce que X défend"). Per-row
  `verifie` flag; **only `verifie=true` rows render on the profile**.
- `Lobbyiste` gains reverse relations `dirigeants[]` and `positions[]`.
- `PersonnalitePublique` gains `dirigeantRoles[]` for the reverse view.

### Ingestion

- **Structural** — `scripts/ingest-rne-dirigeants.ts` hits
  `recherche-entreprises.api.gouv.fr/search` (free, unauthenticated, 7 req/s
  soft limit, IP rate-limited if bursty). Serial `CONCURRENCY = 1` with
  500 ms pacing + exponential retry up to 5×5 s. Auto-matches each
  dirigeant to `PersonnalitePublique` / `Depute` / `Senateur` via
  `nomNormalise + prenomNormalise` compound index. Fallback `?q=<nom>`
  for `Lobbyiste` rows without a SIREN (HATVP-only ids like PLEAD's
  `H771956256`). Sets `source = RECHERCHE_ENTREPRISES`, `verifie = true`.
- **Editorial** — `data/research-output/lobbyistes/<lobbyisteId>.json`
  files, seeded with agent-researched content, all `verifie = false`
  pending manual review. Extended `scripts/ingest-research-output.ts`
  with `--lobbyistes` and `--lobbyiste <id>` flags.

### Data flow (read)

- `getLobbyisteOwnership(lobbyisteId)` in
  [src/lib/lobby-overview.ts](src/lib/lobby-overview.ts) — `React.cache`-
  wrapped. Returns `{ dirigeants, positions, govTies, counts }`. `govTies`
  are **computed at query time** by matching `Lobbyiste.nom` against
  `EntreeCarriere.organisation` (categorie ∈ `CARRIERE_PRIVEE | ORGANISME`)
  and `InteretDeclare.organisation` (rubrique ∈ `ACTIVITE_ANTERIEURE |
  ACTIVITE_CONJOINT | PARTICIPATION`). No pre-computed table.
- Matching uses **`matchLobbyOrg(lobbyCore, orgUpper)`** — word-boundary
  regex in both directions. Catches acronym-in-expansion
  ("MEDEF" inside "MOUVEMENT DES ENTREPRISES DE FRANCE" etc.) while
  rejecting substring false-positives ("ORANGE" ↔ "ORANGERIE").

### Signals

New unified signal type **`lobby-owner`** in
[src/lib/signals.ts](src/lib/signals.ts) — collector
`collectLobbyOwnerLinks()` emits one signal per
`(personnaliteId, lobbyisteId)` pair. `linkKind` enum:
`dirigeant_direct` | `ancien_dirigeant` | `carriere_prive` |
`interet_declare`. Severity via `lobbyOwnerLinkSeverity()`:
**CRITIQUE** when direct dirigeant × ≥ 1 000 AGORA declarations,
**NOTABLE** for weaker tie or ≥ 100 AGORA, else INFORMATIF.

### UI surface

`/profils/lobbyistes/[id]` — 3 new sections rendered
unconditionally (even when the AGORA match is null):

- **FIG. 3 "Qui dirige X"** — grid of dirigeant cards. Each card shows
  nom/prénom, fonction, `dateNaissanceAnnee` as "né(e) YYYY", source
  badge (`RECHERCHE ÉDITORIALE` | `RNE/API.GOUV`), "À VÉRIFIER" amber
  badge when `verifie = false`, collapsible `<details>` with the full
  carrière timeline (titre + organisation + category color + source
  link per row). Empty state: "Aucun dirigeant recensé…".
- **FIG. 5 "Liens avec le gouvernement"** — table of gov-ties
  surfaced by `matchLobbyOrg`. Columns: Personnalité (link to
  `/profils/<slug>`), Mandat actuel, Lien déclaré (kind badge +
  organisation), Période. Empty state: "Aucun lien direct identifié…".
- **"Ce que X défend"** — editorial positions, `verifie = true` only.
  Pending positions surface a counter ("N positions en cours de
  vérification éditoriale — non affichées"). Empty state: "Couverture
  éditoriale en cours."

FIG. label numbering is conditional: when `agora` exists, labels run
1→6 (ministères · domaines · **dirigeants** · timeline · **liens gov**
· samples). When `agora` is null, the 3 new sections drop their FIG.
prefix and show just the count.

### Reverse view on minister profiles

`LobbySection` on `/profils/[slug]` gets a red-accented
**"Dirigeant de lobby"** block rendered at the top when any
`LobbyisteDirigeant.personnaliteId = this person`. "En fonction" badge
for `dateFin IS NULL`, "Ancien" otherwise. Links back to
`/profils/lobbyistes/[id]`.

### Editorial & privacy rules

- **Source of truth priority**: `RECHERCHE_ENTREPRISES` (authoritative)
  > `HATVP` > `RESEARCH`. When structural and editorial disagree on a
  dirigeant record, the structural record wins.
- **Privacy minimisation**: year-of-birth only (no full DOB). No
  per-person nationality display. No personal addresses — only the
  lobbyist's registered office from HATVP.
- **Defamation guard**: `verifie = false` carrière and positions are
  NEVER rendered on public surfaces without an explicit "À VÉRIFIER"
  or "en cours de vérification" visual disclosure. Mirror the
  `EvenementJudiciaire.verifie` convention.
- **Auto-match ambiguity**: when a normalized `(nomNormalise,
  prenomNormalise)` pair matches 2+ `PersonnalitePublique`, leave
  `personnaliteId = null`. Never commit a guess.
- **Bénéficiaires effectifs (RBE)**: deliberately **not modeled**.
  Public access is locked by the 2022 ECJ ruling (Luxembourg case);
  French RBE open-data bulk download was withdrawn. Revisit only
  after legitimate-interest petition granted via INPI.

### Pilot status (April 23, 2026)

- **Editorial data ingested** (`verifie = false` throughout):
  - Lysios → Archambault (6 carrière), Stefanini (4)
  - Anthenor → Lamarque (6)
  - FNMF → Chenut (4), Beaudet incl. CESE (4)
  - Com'Publics → Teyssier d'Orfeuil (3, with "à vérifier" flag on
    the Conseil de Paris claim — our `Depute` table has no match)
- **RNE ingestion not yet run** — `recherche-entreprises.api.gouv.fr`
  IP-rate-limited the host during pilot attempts. The script is
  correct; needs ~1 h IP cooldown or a network switch. 6/10 pilot
  lobbies (Boury Tallon, Google France, MEDEF, CNB,
  Communication & Institutions, Plead) therefore currently show an
  empty dirigeants section.
- **`lobby-owner` signals surface today** — the freetext collector
  returns ~40 unique signals on existing DB data without any new
  ingestion, including Clara Chappaz ↔ Google France, Roland Lescure
  ↔ Natixis, Jean-Pierre Farandou ↔ SNCF, Monique Barbut ↔ Air
  Liquide, Laurent Panifous ↔ Danone.
- **Timeline chart** updated to flag the AGORA filing-lag (HATVP
  art. 18-5: 3 months post-clôture) with a diagonal-stripe "EN COURS
  DE DÉPÔT" overlay and amber cutoff marker on the last two years.

### Known limitations + next steps

- **Acronym ↔ expansion matching** (MEDEF vs "MOUVEMENT DES
  ENTREPRISES DE FRANCE") — `matchLobbyOrg` only handles whole-word
  containment, not acronym expansion. A sigle map
  (`Lobbyiste.sigle` or an alias lookup) would plug this gap.
- **Fuzzy matching** (Levenshtein / Jaro-Winkler) for filiale-level
  divergences — deferred.
- **Clients / mandants layer** — HATVP registre carries partial
  client declarations we haven't modeled yet. For
  cabinets-de-conseil this is arguably more load-bearing than
  ownership, since the client is who actually drives the agenda.
- **Flip `verifie = true`** on reviewed editorial entries + re-run
  `pnpm exec tsx scripts/ingest-research-output.ts --lobbyistes`.
- **Scale RNE ingestion** from the top 10 pilot to all 2 747
  representants once the IP is unblocked. Re-run command:
  `pnpm exec tsx scripts/ingest-rne-dirigeants.ts --verbose`.

## Do's and Don'ts

### ✅ Do

- **Do** derive all displayed timestamps from `IngestionLog.createdAt` or
  another queryable source.
- **Do** use French number / currency formatting — always via
  [src/lib/format.ts](src/lib/format.ts), never inline `toLocaleString`.
- **Do** use the canonical name-normalization helper
  [src/lib/normalize-name.ts](src/lib/normalize-name.ts) for any HATVP /
  AGORA / Assemblée cross-dataset join. Never `{ mode: "insensitive" }` — it
  handles case but not accents.
- **Do** cite sources explicitly (`SrcChip`, `sourceUrl`, `sourceDate`,
  `sourcePrincipale`) on every judicial or editorial claim.
- **Do** guard `EvenementJudiciaire` displays with
  `where: { verifie: true }` on public surfaces.
- **Do** prefer editing existing files; create new files only when a new
  component / route is required.
- **Do** keep Prisma queries at the page level (server components) — there
  is zero client-side fetching across this app.

### ❌ Don't

- **Don't** add emojis to UI copy, commit messages, or code comments.
- **Don't** introduce `lucide-react` or any icon library — inline SVG only.
- **Don't** use default exports (TypeScript strict + named-exports only).
- **Don't** write docstrings or comments on code you didn't change.
- **Don't** fake editorial chrome: no `ÉDITION 247`, no `PAR LA RÉDACTION`,
  no `DOS-12-2026`, no `47 SOURCES` unless `sources.length === 47`, no
  `LECTURE 18 MIN`, no `EN DIRECT`, no `MISE À JOUR AUTO`.
- **Don't** imply guilt in judicial sections. `mise en examen` ≠
  `condamnation`. Every claim needs `sourceUrl` + `sourceDate`.
- **Don't** mix the investigative ramp (`ink-*`, `fg-*`) and the legacy ramp
  (`bureau-*`, `slate-*`) within a single component.
- **Don't** hardcode min/max or legend labels on `FranceMap` /
  `HeroVisualisation` — the component derives them from the data and flips
  the palette direction for `!higherIsBetter` indicators (poverty,
  unemployment, debt). Darker = worse, always.
- **Don't** inline severity-pill styles — use `.sig-tag*` or `.severity-*`
  utility classes exclusively.
- **Don't** commit a dirigeant / gov-tie match based on a single normalized
  name when 2+ `PersonnalitePublique` share it. Leave `personnaliteId = null`
  and flag for manual resolution.
- **Don't** display `verifie = false` carrière entries or lobbyist positions
  on public surfaces (except under an explicit "À VÉRIFIER" badge).
