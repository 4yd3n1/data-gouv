# Blueprint — data-gouv civic intelligence platform

Index of the current state of the platform. Canonical architectural plan: [`../ARCHITECTURAL-PLAN.md`](../ARCHITECTURAL-PLAN.md). This file is a pointer map, not a substitute — update it when models, routes, or section components change.

## Stack snapshot

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- PostgreSQL 14, Prisma 7 with `@prisma/adapter-pg`
- pnpm, Node 20.19.2+
- **43 Prisma models** + `IngestionLog`, ~800K rows
- Server-rendered everywhere — no client-side data fetching

## Documentation map

| Doc | Scope |
|-----|-------|
| [`schema.md`](schema.md) | All 43 Prisma models, enums, row counts, field names |
| [`frontend.md`](frontend.md) | Routes, profile page tabs, section components, search, OG images |
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

## Outstanding work

- Seed historical governments (Borne / Attal / Barnier).
- Link remaining `deputeId` values on Lecornu II ministers.
- Consider adding `deport` signal type to `src/lib/signals.ts` so `/signaux` surfaces the 11 déports.
- Re-check `info.gouv.fr` registre weekly for the 3 missing Lecornu II déports.
- Phase 5 token sweep — migrate profiles/signaux/territoire/votes pages from `bureau-*` to `ink-*`/`fg-*` tokens; once zero callsites remain, delete `bureau-*` ramp + Instrument Serif + DM Sans imports from `globals.css` + `layout.tsx`.
- Commit Sessions 44–50 (all currently uncommitted).
