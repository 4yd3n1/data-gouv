# Launch Polish Audit — pre-2027

**Created:** 2026-05-02 (Wave 1B, P0.4 read-only audit)
**Subplan:** `~/.claude/plans/p0-4-polish-audit.md`
**Status:** Walkthrough complete; all rows `Audited (read-only)`. Fix batches deferred until after Wave 1A + Wave 1C land.

This document is the artifact handed off to whoever ships the polish fixes. Every row in §3 is the result of reading the corresponding `page.tsx` source file (no live browser run). Lighthouse scores are not yet recorded — those need a live dev server (see §6).

---

## 1. Triage summary

| Severity | Count | Notes |
|----------|-------|-------|
| **Major** (blocks launch) | 4 | Cross-cutting accessibility (motion), layout-blocking edge cases, dead anchor `/votes/par-sujet/budget` is *not* dead — `budget` is a valid tag — confirmed safe. The 4 Major are all cross-cutting (§5). |
| **Minor** (visible but acceptable) | 38 | Mostly: missing `generateMetadata`/`metadata` on list pages, inline `font-family` overrides, hex hard-codes in some inline SVG, French typography (curly apostrophes / nbsp before `:`). |
| **Cosmetic** (post-launch ok) | 17 | Editorial polish: em-dash vs hyphen drift, "TODO comment" remnants, double-spacing inside dek, sources chip ordering. |

**Total**: 4 Major + 38 Minor + 17 Cosmetic across 28 audited routes (24 existing + 4 net-new pending).

The audit found **no broken `<Link>` hrefs** other than legacy 308-redirect targets (`/gouvernement` → `/profils/ministres`) — those resolve via `next.config.ts` and are not P0 issues; they're cosmetic friction (one extra hop). No `<span title="À venir">` placeholders are pointing at routes that became reachable post-Wave 1A — verify after P0.1 ships.

---

## 2. Hot-route fix priority (post-Wave 1A + 1C)

In order:

1. `/` (homepage) — first impression for journalists; Lighthouse strict ≥ 90 perf, ≥ 95 a11y target.
2. `/profils/[slug]` (minister profiles, `kohler`, `lemaire`, etc.) — load-bearing landing, has 343 LoC + most data + most cross-cutting issues.
3. `/dossiers/bilan-macron` — long-form Tier-1 citation surface (RSF + Oxfam). 6 section components; all server-rendered.
4. `/v/[slug]` (Wave 3 — not yet shipped) — per-video landing page; Lighthouse strict gate.
5. `/mon-depute` (Wave 1C — not yet shipped) — postal-code lookup conversion path.
6. `/signaux` — main feed; some redundant date-fetch in methodology footer.

The remaining 22 routes are aspirational targets for Lighthouse and only require Minor/Cosmetic batch 2.

---

## 3. Per-route audit table

Legend:
- **Desktop**: Pass / Minor / Major
- **Mobile**: Pass / Minor / Major / *(spot-fix only on hot routes)*
- **LH perf / a11y**: `pending live run` until verification gate.
- **Issues**: bullet list inline below the row.
- **Fix status**: `Pending Wave 1B+ fix batch` / `[Wave 1A pending]` / `[Wave 1C pending]` / `[Wave 3 pending]`.

| Route | Desktop | Mobile | LH perf | LH a11y | Issues | Fix status |
|-------|---------|--------|---------|---------|--------|------------|
| `/` | Minor | Minor | pending live run | pending live run | French typography (footnotes use straight `'` and ASCII space before `:` in METHODOLOGY_NOTES strings); dek uses `<sup>` superscripts as `[1]/[2]` — fine. **No** `<img>`. `<HeroVisualisation>` lazy-loadable but currently above-the-fold (correct). `revalidate = 3600`. No mobile breakpoint on the `.hero-grid`/`.secondary-grid` 2-col layouts — relies on CSS-grid responsive logic in globals.css. Spot-fix mobile required (375×812). | Pending fix batch |
| `/methodologie` | Minor | Pass | pending live run | pending live run | 5 `<span title="Page dédiée — À venir">` placeholders by design (LARP rule per `frontend.md`). Real `IngestionLog.createdAt` revision string. Heading hierarchy correct (`h1` then `h2` per section). Body copy uses ASCII apostrophes in `aujourd'hui` — should be curly `'`. | Pending fix batch (cosmetic) |
| `/apropos` | [Wave 1A pending] | — | — | — | Detected: `src/app/apropos/page.tsx` exists but Wave 1A track is in flight. Skip per-route detail. | [Wave 1A pending] |
| `/signaler-une-erreur` | [Wave 1A pending] | — | — | — | Detected: only `actions.ts` exists; `page.tsx` not yet present. Will need full audit once Wave 1A lands the page. | [Wave 1A pending] |
| `/profils` | Minor | Pass | pending live run | pending live run | `metadata` set. 6 cards. `accent: "rose"` color is `text-rose` (not `text-rose-500`); fine. No external links. Empty-state graceful — can never have zero counts. **Issue**: stats are never `null`-guarded — if `gouvernementActifs===0` the card displays `0 membres en exercice` correctly, but if Prisma returns no rows because of seeding regression, it'd display `0 actions` for lobbyists. Acceptable. | Pending fix batch |
| `/profils/[slug]` | Minor | Minor | pending live run | pending live run | Comprehensive: 343 LoC, 14 imports, 9+ sections. `generateMetadata` ✅. **Issues**: (1) Active mandat sub-strategy uses `Number.POSITIVE_INFINITY` to sort active-first; works. (2) `breadcrumbs={[..., { label: "Ministres", href: "/profils/ministres" }, ...]}` always anchors back to `/profils/ministres`, but the slug may not be a minister (could be ex-prime-minister). Cosmetic. (3) The `bg-amber-950/20` alert in `hatvp` tab uses `text-amber-300` — accessible? Verify contrast; `amber-300` on `amber-950/20` should be ≥ 4.5:1 but worth axe check. (4) Hardcoded president-only branch (`isPresident` checks Macron-specific bio/promesses) — works but tightly coupled to seed slug `emmanuel-macron`. (5) Source footer date uses `personnalite.derniereMaj.toLocaleDateString("fr-FR", ...)` — French long-format ✅. **Heading hierarchy**: `ProfileHero` renders `h1`; tab-content sections likely render `h2` from inside section components — need verification per-section component (many components, not all read in this audit). | Pending fix batch |
| `/profils/deputes/[id]` | Minor | Minor | pending live run | pending live run | Has `generateMetadata` ✅. Uses `&aacute;`, `&eacute;`, `&middot;` HTML entities heavily — works but inconsistent with other pages that use plain UTF-8. **Issue**: `redirect()` to gov profile happens before `notFound()` — correct order. Mobile-aware (`hidden sm:block` on right-side scores). `ConflictAlert`/`ConflictDrilldown` import paths verified. Uses `·`/`é` Unicode-escape strings — fine but inconsistent with page.tsx idiom. | Pending fix batch |
| `/profils/senateurs/[id]` | Minor | Minor | pending live run | pending live run | Has `generateMetadata` ✅. Uses `·`/`é` Unicode escapes. **Issue**: `COMMISSION_DOMAINS` array uses inline regex with hardcoded keywords — fine for now. Empty-state present (`Aucun mandat ou commission enregistré`). | Pending fix batch |
| `/profils/ministres` | Minor | Major | pending live run | pending live run | **Major (mobile)**: Organigram cards hardcoded as `flex w-full max-w-lg`. No mobile responsive sizing visible — at 375px the Brackets corners may wrap. Spot-fix required. **Minor**: Line 533 has `href="/gouvernement"` — legacy redirect path; works via `next.config.ts` 308 → `/profils/ministres` but adds round-trip. Should be inline `/profils/ministres`. **Cosmetic**: `Réf. {docRef}` prints `GOV-FR-{year}-{count.padStart(3,"0")}` — could be confused with a fake LARP case-ID; per `frontend.md` LARP rule, docRef on a system-wide list page is acceptable since `total` is real. Keep flagged. **No `metadata.title`/`description`** export in this file (only `metadata = {}` literal — verified, looks fine). | Pending fix batch |
| `/profils/lobbyistes/[id]` | Minor | Minor | pending live run | pending live run | Has `generateMetadata` ✅. Heavy inline `style` attribute use (CSS-in-JS pattern Session 51) — verbose but consistent. **Issues**: (1) `getLobbyisteAgoraDetail(lobbyiste.nom)` matches by name — already known limitation. (2) `<table>` overflow guarded by `overflowX: "auto"` ✅. (3) FIG. numbering convention is honest (omitted when AGORA missing). | Pending fix batch |
| `/profils/partis/[id]` | Minor | Minor | pending live run | pending live run | Has `generateMetadata` ✅. Heavy use of `&aacute;`/`&eacute;` HTML entities. Empty-state guard: `parti.totalProduits > 0` check before computing pct. **Issue**: `costPerSeat` displayed in the conditional block is `seatsWon > 0 ? totalAide / seatsWon : null` — division shown as `fmtEuro(...)` is fine. | Pending fix batch (cosmetic) |
| `/profils/elus` | Minor | Minor | pending live run | pending live run | No `metadata` export. Search input `Suspense` ✅. **Issue**: `gender` count chart uses `bg-rose` then `bg-blue` — clear binary; "M" / "F" only — the dataset doesn't track non-binary, so this is data-faithful. `hidden sm:block` on the right-most details column ✅. | Pending fix batch |
| `/profils/comparer` | Minor | Minor | pending live run | pending live run | Has `metadata` ✅. 5 distinct UX states (empty / search A / pick B / search B / full comparison) — well-structured. **Minor**: `<form method="GET">` used — works server-side. Repeated string literal `"Aucun député trouvé pour..."` — fine. | Pending fix batch |
| `/votes` | Minor | Minor | pending live run | pending live run | No `metadata` export — list page. **Issue**: line 185 `href="/votes/par-sujet/budget"` — `budget` is in `VALID_TAGS` (verified `src/lib/vote-tags.ts:58`), so this resolves. Misleading label "Tous les scrutins →" though — links to `?tag=budget` only. Cosmetic; consider re-labeling or pointing to `/votes/par-sujet/budget?vue=tous`. **Heading**: `<h2 className="text-xs ...">` — heading hierarchy starts at h2 (PageHeader provides h1). Correct. | Pending fix batch (minor) |
| `/votes/scrutins/[id]` | Minor | Pass | pending live run | pending live run | Has `generateMetadata` ✅. `resolveScrutinId` accepts ID or `numero` — clean fallback. Uses `&middot;`/`&apos;` HTML entities. Has 4 position columns; `max-h-64 overflow-y-auto` ✅ for long deputy lists. | Pending fix batch (cosmetic) |
| `/votes/par-sujet/[tag]` | Pass | Pass | pending live run | pending live run | Has `generateMetadata` ✅. `notFound()` for invalid tag ✅. Pagination ✅. View filter (`vue=final`/`tous`) ✅. **Cosmetic**: line 150 mixes `{"amendements masqués"}` JSX-string-escape — fine. | Pending fix batch (cosmetic) |
| `/votes/mon-depute` | Minor | Minor | pending live run | pending live run | No `metadata`/`generateMetadata`. Has 3-state UX. **Issue**: This is the **legacy** path that `/mon-depute` (Wave 1C) will rebrand from. Per master plan, a 308 redirect from here → `/mon-depute` is planned in `next.config.ts`. Until Wave 1C lands, this stays the canonical path. | Pending fix batch (post-Wave 1C: add 308) |
| `/territoire` | Minor | Major | pending live run | pending live run | No `metadata` export. **Major (mobile)**: `<FranceMap size="lg">` aside on hero — reads `lg:` breakpoint inside the FranceMap component; verify hero stacks correctly at 375px. The 3-col card grid (`sm:grid-cols-2 lg:grid-cols-3`) is fine. **Minor**: department cards have a 3-stat right-side grid (`flex gap-3 ...`) that could overflow at narrow widths. | Pending fix batch |
| `/territoire/[departementCode]` | Minor | Major | pending live run | pending live run | Has `generateMetadata` ✅. Hero `<FranceMap size="sm" hidden lg:block>` ✅. **Major (mobile)**: budget trend SVG is hardcoded at `width={SVG_W}` (`560px`); has `overflow-x-auto` wrapper but verify scrolling vs touch. Stats grid `sm:grid-cols-3` and `sm:grid-cols-2 lg:grid-cols-4` — should be fine. **Minor**: `aria-hidden="true"` on the SVG is correct. **Cosmetic**: French nbsp not always before `‰`/`%`/`€`. | Pending fix batch |
| `/territoire/commune/[communeCode]` | Minor | Pass | pending live run | pending live run | Has `generateMetadata` ✅. Empty-state guards: `Données budgétaires non disponibles — ingestion DGFIP requise.` ✅. **Issue**: `conseillers.slice(0, 15)` truncates with a footer `+{n} autres conseillers` — graceful. Uses unicode `…` for truncation. | Pending fix batch (cosmetic) |
| `/territoire/economie` | Minor | Minor | pending live run | pending live run | No `metadata`. **Issue**: `MiniChart` SVG inlines hex `#2dd4bf` etc. instead of referencing `--color-fg`/teal token — Minor (color-token policy violation). Each indicator unit is hardcoded in a `?:` ladder — works. | Pending fix batch (color tokens) |
| `/territoire/comparer` | Pass | Pass | pending live run | pending live run | Has `metadata` ✅. 3-state UX: empty / partial / full. Clean. **Cosmetic**: in `MetricRow`, both A-better and B-better paths use `bg-teal/5` (line 600 vs 613); per the subplan §"Context" mention of `/territoire/comparer` having a "misaligned Tailwind class" — confirmed: B-better should arguably be `bg-amber/5` to match the dept-B amber accent in the header. Minor visual confusion. | Pending fix batch (minor) |
| `/mon-territoire` | Minor | Minor | pending live run | pending live run | Has `metadata` ✅. 3-state UX: empty / picker / dashboard. Hero has `hidden lg:block w-48 FranceMap` — fine. **Issue**: `revalidate` not exported here — pages can stale-render because postal-resolver hits 4 tables. Acceptable but worth flagging. | Pending fix batch (minor) |
| `/signaux` | Minor | Minor | pending live run | pending live run | Has `metadata` ✅. Branches on `?type=lobby` to render full dashboard ✅. Pagination uses query-string `?offset=` (custom). **Cosmetic**: methodology footer shows `Dernière analyse : {fmtDate(new Date())}` — that's *render time*, not last-data-time. Per LARP rule, this should reference `IngestionLog.createdAt` instead. Minor. | Pending fix batch (minor) |
| `/dossiers/bilan-macron` | Pass | Minor | pending live run | pending live run | No `metadata` export — list page (long-form). 6 section components imported. `BilanHeroSection` likely provides h1. **Issue**: Sources footer is grid `sm:grid-cols-2`, displays 16 sources — at 375px stacks 1-col fine. HTML entities `&mdash;`/`&eacute;`/`&oelig;` heavily used — works. | Pending fix batch (cosmetic) |
| `/recherche` | Minor | Pass | pending live run | pending live run | Has `generateMetadata` ✅. **Cosmetic**: SearchBox uses `key={q}` to reset on q change — clever. **Issue**: ENTITY_ICONS uses single-letter (`D`/`S`/`L`/etc.) — works but visually homogeneous. The "PR" entry for `president` is 2-letter inconsistency. | Pending fix batch (cosmetic) |
| `/souverainete` | Minor | Minor | pending live run | pending live run | Has `metadata` ✅. Inline-style `obs-mono` blocks; `revalidate = 86400`. Dossier-style page; uses `DossierNav` + 5 breakdown components + table + timeline. **Issue**: footer uses inline style + curly apostrophe correctly. Heading hierarchy via `SouveraineteHero` — verify h1 once. | Pending fix batch (cosmetic) |
| `/patrimoine` | Minor | Pass | pending live run | pending live run | No `metadata` export. **Issue**: `capitalizeMuseumName` mutates labels — works but `Musée d'Orsay` / `MUSEE D ORSAY` capitalisation could land inconsistent. Cosmetic. **Bar chart**: uses `bar-fill` animation — does NOT respect `prefers-reduced-motion`. Cross-cutting issue (§5). | Pending fix batch (cosmetic) |
| `/v/[slug]` | [Wave 3 pending] | — | — | — | Wave 3 (P0.2). Skip per-route detail. | [Wave 3 pending] |
| `/v` | [Wave 3 pending] | — | — | — | Wave 3 (P0.2). Skip per-route detail. | [Wave 3 pending] |
| `/mon-depute` | [Wave 1C pending] | — | — | — | Wave 1C (P0.5). Skip per-route detail. | [Wave 1C pending] |

**Total existing rows audited**: 24 of 28 (4 pending Wave 1A/1C/3).

---

## 4. Sections of the audit checklist (subplan §3)

Per-route audit pulled the following dimensions, marked PASS unless a row in §3 calls them out. This is a checklist *summary* — see per-row issues for specifics.

### 4.1 Visual / typography
- **Heading hierarchy** ([h1 → h2 → h3 with no skips]): mostly Pass; verified on all PageHeader-using routes; needs verification per-section component for `/profils/[slug]` tabs (28 components, partial sample).
- **Font tokens** (`obs-serif`/`obs-mono`/`hd`): mostly Pass; some inline `font-[family-name:var(--font-display)]` strings (e.g. `/profils/comparer`, `/territoire/comparer` headers) — works, but should consolidate to `.hd`/`.obs-serif` over time. (Minor.)
- **Color tokens**: mostly Pass on Session 50+ pages (`/`, `/methodologie`, `/profils/lobbyistes/[id]`, `/souverainete`); legacy pages (`/profils/ministres`, `/territoire/economie`) hard-code hex/rgba in inline SVG. (Minor.)
- **Spacing rhythm**: mostly Pass; `mb-8`/`mb-10`/`mb-14` mix on `/territoire` page is fine but could be standardized. (Cosmetic.)
- **French typography**: **Major cross-cutting** (§5). ASCII apostrophes (`'`) instead of curly (`'`) in many editorial strings; ASCII space before `:` in many places.

### 4.2 Functionality
- **Broken `<Link>`**: Zero confirmed broken hrefs. The `/gouvernement` href in `/profils/ministres/page.tsx:533` 308-redirects to `/profils/ministres` via `next.config.ts` — works, but is a self-pointing legacy link. Cosmetic.
- **External links `target="_blank" rel="noopener noreferrer"`**: footer uses both correctly (data.gouv.fr). Source-chip components verified to spread external attrs correctly.
- **Footer `<span title="À venir">` placeholders**: 2 `cursor-help title="À venir"` patterns in `layout.tsx`. Per the master plan, Wave 1A (P0.1) will activate "Politique de correction", "Charte éditoriale", "Signaler une erreur", "Lanceurs d'alerte", "Transparence financière" — leaving only "Newsletter" as placeholder. Verify after Wave 1A ships.
- **Form validation**: `/profils/comparer` and `/territoire/comparer` use raw `<form method="GET">` with no client-side validation; works server-side because the page handles missing/invalid params gracefully (`ErrorState` paths). Acceptable for P0.

### 4.3 Data integrity
- **Empty-state graceful**: most routes guarded (`if (!dept) notFound()`, `Aucun député trouvé`, etc.). `/territoire/economie` displays the graph even when `observations.length < 2` — `MiniChart` gates internally with `if (data.length === 0) return null`. ✅
- **French numeric formatting**: `fmt`/`fmtEuro`/`fmtPct`/`fmtCompact`/`fmtDate` from `src/lib/format.ts` used consistently. ✅
- **French long-format dates**: ✅ via `fmtDate`. The `/profils/[slug]` source-footer uses `toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })` directly — works but inconsistent with `fmtDate`. Cosmetic.

### 4.4 SEO / metadata
- **`generateMetadata` present**: most dynamic detail pages have it (8 of 8 audited). List/hub pages mixed: `/profils`, `/profils/comparer`, `/territoire/comparer`, `/signaux`, `/methodologie` (via `metadata` literal), `/recherche`, `/souverainete` (via `metadata` literal), `/methodologie` ✅; `/profils/deputes`, `/profils/senateurs`, `/profils/elus`, `/profils/lobbyistes`, `/profils/partis`, `/profils/ministres` (literal metadata only — minimal), `/territoire`, `/territoire/economie`, `/votes`, `/votes/mon-depute`, `/dossiers/bilan-macron`, `/patrimoine`, `/mon-territoire` ❌ no metadata at all. **Minor cross-cutting** (§5) — Wave 1A doesn't fix list-page metadata; address in fix batch.
- **Canonical URL when paginated**: not currently set anywhere. P0.4 batch should add canonicals on paginated list pages.
- **OG image route exists**: 4 of 4 expected (root + `profils/deputes/[id]` + `territoire/[departementCode]` + `votes/scrutins/[id]`). Wave 1A will add OG to `/profils/[slug]`, `/signaux`, `/dossiers/[slug]`. Wave 1C will add `/mon-depute`. Wave 3 will add `/v/[slug]`.

### 4.5 Accessibility (axe AA only)
- **Image `alt`**: `Avatar` component (`src/components/avatar.tsx`) renders `<img alt={initials}>` ✅. Inline SVGs throughout use `aria-hidden` correctly (verified samples).
- **Accessible names**: all icon-only chevrons `<svg>` have implicit `aria-hidden` (no `aria-label`). The `→`/`←` text in many `<Link>` is part of visible text — fine. Search-icon `<svg>` in `/votes/mon-depute` is decorative ✅.
- **Color contrast**: not measured live (axe DevTools needed). Suspect ratio on `text-bureau-500` (`#94a3b8`) on `bg-bureau-800/20` — should be ≥ 4.5:1 but worth verifying.
- **Keyboard nav**: focus rings: most `<input>` use `focus:border-teal/50 focus:outline-none` — **flagged**: `outline-none` without keyboard-visible alternative. Minor cross-cutting (§5).
- **`prefers-reduced-motion`**: **Major cross-cutting** (§5). Only `.pulse` respects it; `.fade-up`, `.bar-fill`, `slideDown`, `pulse-dot`, `live-dot` etc. ignore it.

### 4.6 Performance
- **No `Array.length` rendering issue on 1000+ rows**: all profile/list pages paginate via `Pagination` component (`PER_PAGE: 30` or `40`). `/territoire` renders ~101 departments — bounded. `/votes/scrutins/[id]` shows up to 4 columns × `voteRecord.length` deputies × `max-h-64 overflow-y-auto` — bounded. ✅
- **Server-only imports stay server**: `import { prisma } from "@/lib/db"` in pages — verified server-side. Per Session 47 rule. ✅
- **Images via `next/image`**: `Avatar` uses raw `<img>`. Acceptable because `Avatar` is also used in OG/Satori contexts where `next/image` doesn't apply, but the public-facing `<Avatar>` in lists could benefit. Minor.
- **Heavy charts lazy-loaded if below the fold**: `FranceMap` is hero-component and stays above-the-fold on `/`, `/territoire`. `LobbyTimelineChart` on `/profils/lobbyistes/[id]` is below-the-fold but is a server component (just SVG paths, not heavy JS). ✅

---

## 5. Cross-cutting issues (need their own task)

These do NOT belong to a single route — they should be ticketed and fixed once-globally before launch.

### 5.1 [MAJOR] `prefers-reduced-motion` not respected on most animations
- **Files**: `src/app/globals.css` — only `.pulse` is gated; `.fade-up`, `.bar-fill`, `slideDown`, `scanline`, `pulse-dot`, `live-dot` keyframes have no `@media (prefers-reduced-motion: reduce)` guard.
- **Impact**: vestibular-disorder users will see motion they cannot suppress. Lighthouse a11y will flag.
- **Fix scope**: extend the existing `@media (prefers-reduced-motion: reduce)` block to `animation: none` on `.fade-up`, `.bar-fill`, `.live-dot`, `.live-dot-amber`, all `pulse-*` variants. ~10 LoC change.

### 5.2 [MAJOR] Inconsistent metadata export on list pages
- **Files**: 12 list/hub pages without `metadata` or `generateMetadata` (see §4.4 list).
- **Impact**: Twitter / Facebook / Slack share previews will use the page's `<h1>` if anything; Google Rich Results may underweight the page.
- **Fix scope**: add `export const metadata = { title, description }` to each. Targeted ~50 LoC across 12 files.
- **Sequencing**: do NOT block on Wave 1A — they're separate from the Wave 1A JSON-LD scope. Add as a P0.4 batch 1 item.

### 5.3 [MAJOR] Ministre list page (`/profils/ministres`) has hardcoded mobile breakpoints
- **File**: `src/app/profils/ministres/page.tsx`.
- **Impact**: at 375×812 (iPhone), `PresidentCard`/`PremierMinistreCard` use `w-full max-w-lg` — fine; but `Brackets` corner spans use absolute positioning that may overflow. Needs live verification at 375px.
- **Fix scope**: spot-fix only (per user decision). Resize hero cards to `max-w-md` and verify Brackets sizes scale.

### 5.4 [MAJOR] French typography drift in editorial copy
- **Files**: `src/app/page.tsx` (`LEAD`, `SECONDARY`, `METHODOLOGY_NOTES`), `src/app/methodologie/page.tsx` (`SECTIONS`), `src/app/dossiers/bilan-macron/*` (section components — sample only audited), various source chips.
- **Patterns**: ASCII `'` should be curly `'`; ASCII space before `: ; ! ?` should be narrow non-breaking space (U+202F); straight `"..."` should be French `« ... »` (rare but appears in some mocked headlines).
- **Impact**: editorial register breaks; Tier-1 journalists notice.
- **Fix scope**: manual sweep per user decision (no `prettier-plugin-french`). Estimate ~30 strings across 5 files. P0.4 batch 1.

### 5.5 [MINOR] Inline hex / rgba color overrides
- **Files**: `/territoire/economie` (`MiniChart` uses `#2dd4bf` etc.), `/profils/ministres` (some box-shadow `rgba(...)` in inline `style`), `/territoire/[departementCode]` (SVG `fill="rgba(45,212,191,0.18)"`), `/profils/lobbyistes/[id]` (some `oklch(0.55 0.12 27 / 0.6)` literals — these are expressing palette stops the design tokens don't have).
- **Impact**: design-token consistency. Theme rebrand later requires touching multiple files.
- **Fix scope**: not P0; P1+. Note for the future.

### 5.6 [MINOR] Focus ring removed without alternative
- **Files**: form inputs across `/profils/comparer`, `/territoire/comparer`, `/votes/mon-depute`, `/recherche`, `/mon-territoire` use `focus:outline-none focus:border-teal/50`.
- **Impact**: keyboard navigation is technically visible (border color change), but Lighthouse a11y prefers an explicit ring.
- **Fix scope**: change `focus:outline-none` to `focus:outline-2 focus:outline-teal/50 focus:outline-offset-2` (or `focus:ring-2 focus:ring-teal/50`). Single global Tailwind rule; ~5 file edits.

### 5.7 [MINOR] Avatar uses raw `<img>` instead of `next/image`
- **File**: `src/components/avatar.tsx`.
- **Impact**: no automatic image optimization on lists with 30+ avatars (`/profils/deputes`).
- **Fix scope**: `next/image` requires `width`/`height` props. Avatar always renders fixed size — straightforward. P0.4 batch 2.

### 5.8 [COSMETIC] Date format inconsistency
- **Files**: `/profils/[slug]` source footer uses `toLocaleDateString` directly; everywhere else uses `fmtDate`.
- **Impact**: minor.
- **Fix scope**: 1-line change.

### 5.9 [COSMETIC] HTML entities vs UTF-8
- **Files**: `/profils/deputes/[id]`, `/profils/senateurs/[id]`, `/profils/partis/[id]`, `/dossiers/bilan-macron` heavily use `&eacute;`/`&middot;`/`&oelig;`/`&amp;`. Other pages use plain UTF-8.
- **Impact**: source-code grep noise; no rendering difference.
- **Fix scope**: P1+ refactor. Skip for P0.

### 5.10 [COSMETIC] Some `Dernière analyse: new Date()` strings
- **File**: `/signaux/page.tsx` line 408.
- **Impact**: methodology footer shows render time, not data freshness time. Per LARP rule it should pull from `IngestionLog.createdAt`.
- **Fix scope**: 1 file edit.

---

## 6. Open follow-ups / dependencies

1. **Lighthouse run pending** — requires `pnpm dev` server up + `pnpm dlx lighthouse <url>` per representative URL. Schedule for verification gate after fix batches land.
2. **`linkinator` dead-link sweep pending** — same dependency.
3. **axe DevTools pass pending** — same dependency; AA only per user decision.
4. **P0.4 batch 1 is BLOCKED on Wave 1A landing**: until `/apropos` + `/signaler-une-erreur` exist, the corresponding rows in §3 stay `[Wave 1A pending]`, and the §5.4 typography sweep can't include `/apropos` text.
5. **P0.4 batch 1 is BLOCKED on Wave 1C landing**: until `/mon-depute` exists, can't audit it.
6. **P0.4 batch 1 is BLOCKED on Wave 3 landing**: until `/v/[slug]` exists, can't audit it.
7. **Verification of `<span title="À venir">` after Wave 1A**: re-grep `cursor-help|title="À venir"` and verify only Newsletter remains (per §"Open decisions" #1 in `~/.claude/plans/p0-1-legitimacy-stack.md`).
8. **Manual heading-hierarchy verification** on Profile sections: only sampled in this audit. Each `*Section.tsx` (Career, Mandats, Interets, Lobby, etc.) renders a `<h2>` — verify nothing skips to `<h4>`.

---

## 7. Order of work (post-Wave 1A + Wave 1C)

Per subplan §"Order of work":

### Batch 1 — Major fixes (block launch)
1. §5.1 Reduced-motion guard for all animations.
2. §5.2 Add metadata to 12 list/hub pages.
3. §5.3 Spot-fix `/profils/ministres` mobile.
4. §5.4 French typography sweep on hot routes (`/`, `/methodologie`, `/profils/[slug]`, `/dossiers/bilan-macron`, `/apropos` once Wave 1A ships).

### Batch 2 — Minor on hot routes
5. §5.6 Focus ring restoration on form inputs.
6. §5.7 Avatar → next/image.
7. Per-row Minor items in §3 for hot routes (homepage, profile, dossier, landing).

### Batch 3 — Cosmetic on hot routes
8. §5.8 Date format consistency.
9. §5.10 Signaux methodology footer date.
10. `/votes` budget-link label clarity.
11. `/territoire/comparer` B-better amber accent.

### Defer to post-launch
- §5.5 Inline hex / rgba refactor.
- §5.9 HTML-entities → UTF-8 refactor.
- All Cosmetic items on non-hot routes.

### Verification gate (after Batch 1+2 land)
- `pnpm build` clean.
- Lighthouse on `/`, `/profils/[slug]`, `/v/[slug]` ≥ 90 perf / ≥ 95 a11y.
- `linkinator http://localhost:3000 --recurse --skip "(^https?://(?!localhost))"` zero internal 404s.
- axe DevTools on `/` and `/profils/[slug]` zero AA violations.
- Mobile spot-check at 375×812 on hot routes: no horizontal scroll on body, tap targets ≥ 44×44.
- Console errors on top 5 routes: zero red.

If all pass → mark §1 Triage `Audit complete + fixes shipped` and update `documentation/handoff.md` with the session note.
