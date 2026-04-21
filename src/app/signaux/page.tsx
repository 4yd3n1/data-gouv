import Link from "next/link";
import { fmt, fmtDate } from "@/lib/format";
import { SignalCard } from "@/components/signaux/signal-card";
import {
  getSignals,
  summarizeSignals,
  SIGNAL_TYPE_LABELS,
  SIGNAL_TYPE_DESCRIPTIONS,
  type SignalType,
  type UnifiedSignal,
} from "@/lib/signals";
import type { SignalSeverity } from "@/lib/signal-types";

export const revalidate = 3600;

export const metadata = {
  title: "Signaux croisés — L'Observatoire Citoyen",
  description:
    "Signaux croisés : conflits d'intérêts, portes tournantes, concentration du lobbying et anomalies détectés par croisement automatique des données publiques.",
};

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 30;

const TYPE_ORDER: SignalType[] = [
  "conflit",
  "porte",
  "lobby",
  "media",
  "ecart",
  "dissidence",
];

const SEVERITY_FILTERS: Array<{
  key: SignalSeverity;
  label: string;
  color: string;
}> = [
  { key: "CRITIQUE", label: "Critique", color: "border-rose/30 text-rose bg-rose/5" },
  { key: "NOTABLE", label: "Notable", color: "border-amber/30 text-amber bg-amber/5" },
  { key: "INFORMATIF", label: "Informatif", color: "border-teal/30 text-teal bg-teal/5" },
];

const TYPE_BADGE_STYLE: Record<SignalType, string> = {
  conflit: "border-rose/30 text-rose bg-rose/5",
  porte: "border-amber/30 text-amber bg-amber/5",
  lobby: "border-amber/30 text-amber bg-amber/5",
  media: "border-rose/30 text-rose bg-rose/5",
  ecart: "border-amber/30 text-amber bg-amber/5",
  dissidence: "border-teal/30 text-teal bg-teal/5",
};

const NARRATIVE_ACCENT: Record<SignalType, string> = {
  conflit: "border-l-rose/40",
  porte: "border-l-amber/40",
  lobby: "border-l-amber/40",
  media: "border-l-rose/40",
  ecart: "border-l-amber/40",
  dissidence: "border-l-teal/40",
};

/* ------------------------------------------------------------------ */
/*  Filter bar pill                                                     */
/* ------------------------------------------------------------------ */

function FilterPill({
  href,
  label,
  active,
  activeClass,
}: {
  href: string;
  label: string;
  active: boolean;
  activeClass?: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs transition-all ${
        active
          ? activeClass ?? "border-teal/40 bg-teal/10 text-teal"
          : "border-bureau-700/40 bg-bureau-800/40 text-bureau-400 hover:border-bureau-600/50 hover:text-bureau-300"
      }`}
    >
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Signal card content                                                */
/* ------------------------------------------------------------------ */

function UnifiedSignalCard({ signal }: { signal: UnifiedSignal }) {
  return (
    <SignalCard severity={signal.severity}>
      <Link href={signal.href} className="group block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
              {signal.prenom} {signal.nom}
            </p>
            <p className="mt-0.5 text-xs text-bureau-500">{signal.subtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {signal.types.map((t) => (
              <span
                key={t}
                className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${TYPE_BADGE_STYLE[t]}`}
              >
                {SIGNAL_TYPE_LABELS[t]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {signal.narratives.map((n, i) => (
            <div
              key={`${n.type}-${i}`}
              className={`border-l-2 ${NARRATIVE_ACCENT[n.type]} pl-3`}
            >
              <p className="text-xs leading-relaxed text-bureau-300">
                {n.headline}
              </p>
              {n.detail && (
                <p className="mt-0.5 text-[11px] text-bureau-500">{n.detail}</p>
              )}
              {n.chips && n.chips.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {n.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-sm border border-bureau-700/30 bg-bureau-800/40 px-1.5 py-0.5 text-[10px] text-bureau-400"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-teal/70 group-hover:text-teal transition-colors">
          Voir le profil →
        </p>
      </Link>
    </SignalCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function SignauxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filterType = (sp.type ?? null) as SignalType | null;
  const filterSeverity = (sp.severity ?? null) as SignalSeverity | null;
  const offset = Math.max(0, parseInt(sp.offset ?? "0", 10) || 0);

  const allSignals = await getSignals();
  const summary = summarizeSignals(allSignals);

  // Apply filters
  const filtered = allSignals.filter((s) => {
    if (filterType && !s.types.includes(filterType)) return false;
    if (filterSeverity && s.severity !== filterSeverity) return false;
    return true;
  });

  // Paginate
  const pageSignals = filtered.slice(0, offset + PAGE_SIZE);
  const hasMore = filtered.length > pageSignals.length;

  // Filter URL builder
  function filterUrl(
    param: "type" | "severity",
    value: string | null,
  ): string {
    const params = new URLSearchParams();
    if (param === "type") {
      if (value) params.set("type", value);
      if (filterSeverity) params.set("severity", filterSeverity);
    } else {
      if (filterType) params.set("type", filterType);
      if (value) params.set("severity", value);
    }
    const qs = params.toString();
    return qs ? `/signaux?${qs}` : "/signaux";
  }

  function moreUrl(): string {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterSeverity) params.set("severity", filterSeverity);
    params.set("offset", String(offset + PAGE_SIZE));
    return `/signaux?${params.toString()}`;
  }

  const hasFilter = filterType || filterSeverity;
  const activeTypeDescription = filterType
    ? SIGNAL_TYPE_DESCRIPTIONS[filterType]
    : null;

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-bureau-700/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-3">
            <span className="inline-block rounded-full border border-rose/20 bg-rose/5 px-3 py-0.5 text-xs uppercase tracking-widest text-rose">
              Enquêtes croisées
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
            Signaux <span className="italic text-rose">croisés</span>
          </h1>
          <p className="mt-3 max-w-2xl text-bureau-400">
            Ce qu&apos;on ne peut pas réconcilier entre deux registres officiels —
            HATVP, Assemblée, AGORA, ARCOM. Une même personne apparaît une seule
            fois, avec tous les signaux qui la concernent.
          </p>
        </div>
      </section>

      {/* ── Live metrics bar ── */}
      <section className="border-b border-bureau-700/20 bg-bureau-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-rose animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-bureau-500">
              {fmt(summary.total)} personnalités où les données publiques divergent
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-bureau-500">
            <span className="text-rose">
              {summary.bySeverity.CRITIQUE} critique{summary.bySeverity.CRITIQUE > 1 ? "s" : ""}
            </span>
            <span className="text-bureau-700">|</span>
            <span className="text-amber">
              {summary.bySeverity.NOTABLE} notable{summary.bySeverity.NOTABLE > 1 ? "s" : ""}
            </span>
            <span className="text-bureau-700">|</span>
            <span className="text-teal">
              {summary.bySeverity.INFORMATIF} informatif{summary.bySeverity.INFORMATIF > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <section className="border-b border-bureau-700/20 bg-bureau-900/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3">
          <span className="mr-2 text-[10px] uppercase tracking-[0.15em] text-bureau-600">
            Filtrer
          </span>
          <FilterPill
            href={filterUrl("type", null)}
            label="Tous"
            active={!filterType}
          />
          {TYPE_ORDER.map((t) => (
            <FilterPill
              key={t}
              href={filterUrl("type", filterType === t ? null : t)}
              label={`${SIGNAL_TYPE_LABELS[t]} (${summary.byType[t]})`}
              active={filterType === t}
            />
          ))}
          <span className="mx-2 h-4 w-px bg-bureau-700/30" />
          {SEVERITY_FILTERS.map((s) => (
            <FilterPill
              key={s.key}
              href={filterUrl("severity", filterSeverity === s.key ? null : s.key)}
              label={s.label}
              active={filterSeverity === s.key}
              activeClass={`border ${s.color}`}
            />
          ))}
        </div>
      </section>

      {/* ── Feed ── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {activeTypeDescription && (
          <p className="mb-6 max-w-2xl text-sm text-bureau-500 italic">
            {activeTypeDescription}
          </p>
        )}

        {pageSignals.length === 0 ? (
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-6 py-16 text-center">
            <p className="text-sm text-bureau-500">
              Aucun signal ne correspond à ces filtres.
            </p>
            {hasFilter && (
              <Link
                href="/signaux"
                className="mt-3 inline-block text-xs text-teal hover:underline"
              >
                Réinitialiser les filtres →
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Lead critical signals: 2-col emphasized */}
            {!hasFilter && offset === 0 && pageSignals.length > 4 && (
              <div className="mb-8">
                <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose">
                  À surveiller en priorité
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {pageSignals.slice(0, 2).map((s) => (
                    <UnifiedSignalCard key={s.personKey} signal={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Rest: dense grid */}
            {!hasFilter && offset === 0 && pageSignals.length > 4 && (
              <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-bureau-500">
                Autres signaux
              </h2>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(!hasFilter && offset === 0 && pageSignals.length > 4
                ? pageSignals.slice(2)
                : pageSignals
              ).map((s) => (
                <UnifiedSignalCard key={s.personKey} signal={s} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <Link
                  href={moreUrl()}
                  className="inline-block rounded-full border border-bureau-700/40 bg-bureau-800/40 px-6 py-2 text-xs uppercase tracking-widest text-bureau-300 transition-all hover:border-teal/40 hover:text-teal"
                >
                  Voir plus ({filtered.length - pageSignals.length} restant{filtered.length - pageSignals.length > 1 ? "s" : ""})
                </Link>
              </div>
            )}
          </>
        )}

        {/* ── Deep-dive enquêtes ── */}
        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dossiers/medias"
            className="group rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-6 transition-all hover:border-rose/30 hover:bg-bureau-800/40"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-rose">
              Dossier
            </span>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 transition-colors group-hover:text-teal">
              Concentration des médias
            </h3>
            <p className="mt-1 text-sm text-bureau-500">
              9 milliardaires, 72 titres — propriété, influence et connexions politiques des grands groupes médiatiques.
            </p>
          </Link>
          <Link
            href="/dossiers/financement-politique"
            className="group rounded-xl border border-bureau-700/20 bg-bureau-800/20 p-6 transition-all hover:border-amber/30 hover:bg-bureau-800/40"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber">
              Dossier
            </span>
            <h3 className="mt-2 text-lg font-medium text-bureau-100 transition-colors group-hover:text-teal">
              Financement politique
            </h3>
            <p className="mt-1 text-sm text-bureau-500">
              66 M€ d&apos;aide publique, dons privés et coût électoral — les comptes des partis passés au crible.
            </p>
          </Link>
        </section>

        {/* ── Methodology note ── */}
        <section className="mt-16 border-t border-bureau-700/20 pt-8">
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-bureau-600">
            Les signaux sont générés automatiquement par croisement de données publiques
            (HATVP, Assemblée nationale, Sénat, registre AGORA, ARCOM). Un signal ne constitue
            pas une accusation : il identifie une corrélation mesurable entre deux jeux de données.
            Dernière analyse : {fmtDate(new Date())}.
          </p>
        </section>
      </div>
    </>
  );
}
