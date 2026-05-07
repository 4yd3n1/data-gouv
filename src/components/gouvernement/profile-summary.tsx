import Link from "next/link";

interface SummaryStat {
  label: string;
  value: number | null;
  /** Tab to deep-link to. Pre-includes the `?tab=` prefix. */
  tabHref: string | null;
}

interface ProfileSummaryProps {
  /** Current mandate title (long form) — shown as the first line. */
  currentRole: string;
  /** Optional secondary line — e.g. portefeuille text. */
  portefeuille?: string | null;
  /** Government context — e.g. "Gouvernement Élisabeth Borne". */
  gouvernement?: string | null;
  /** Whether the person is currently in office. */
  active: boolean;
  /** Slug used to build deep-links into other tabs of the same profile. */
  slug: string;
  /** Counts surfaced as quick-jump tiles. */
  counts: {
    mandats: number;
    carriere: number;
    interets: number;
    deports: number;
    judiciaire: number;
  };
}

/**
 * Top "Résumé" panel for a profile — current role, status, and quick-jump tiles
 * to each major surface. Sits inside the new "resume" tab (default tab on the
 * 5-section frame: Résumé / Signaux / Chronologie / Relations / Documents).
 */
export function ProfileSummary({
  currentRole,
  portefeuille,
  gouvernement,
  active,
  slug,
  counts,
}: ProfileSummaryProps) {
  const stats: SummaryStat[] = [
    {
      label: "Mandats",
      value: counts.mandats || null,
      tabHref: counts.mandats ? `/profils/${slug}?tab=relations` : null,
    },
    {
      label: "Étapes de carrière",
      value: counts.carriere || null,
      tabHref: counts.carriere ? `/profils/${slug}?tab=chronologie` : null,
    },
    {
      label: "Intérêts HATVP",
      value: counts.interets || null,
      tabHref: counts.interets ? `/profils/${slug}?tab=documents` : null,
    },
    {
      label: "Déports actifs",
      value: counts.deports || null,
      tabHref: counts.deports
        ? `/profils/${slug}?tab=signaux#deports`
        : null,
    },
    {
      label: "Affaires judiciaires",
      value: counts.judiciaire || null,
      tabHref: counts.judiciaire ? `/profils/${slug}?tab=signaux` : null,
    },
  ];
  const visibleStats = stats.filter((s) => s.value !== null);

  return (
    <section className="space-y-6 fade-up">
      <header className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Résumé
        </h2>
        <div className="space-y-1">
          <p className="text-lg leading-snug text-bureau-100">{currentRole}</p>
          {portefeuille ? (
            <p className="text-sm leading-snug text-bureau-300">{portefeuille}</p>
          ) : null}
          {gouvernement ? (
            <p className="text-xs uppercase tracking-[0.1em] text-bureau-500">
              {gouvernement}
            </p>
          ) : null}
          <p className="text-xs">
            <span
              className={`inline-flex items-center gap-1.5 ${
                active ? "text-teal-300" : "text-bureau-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-teal" : "bg-bureau-600"
                }`}
              />
              {active ? "En exercice" : "Ancien membre du gouvernement"}
            </span>
          </p>
        </div>
      </header>

      {visibleStats.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {visibleStats.map((stat) => {
            const inner = (
              <>
                <span className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-bureau-100">
                  {stat.value}
                </span>
                <span className="text-[11px] uppercase tracking-[0.1em] text-bureau-500">
                  {stat.label}
                </span>
              </>
            );
            return (
              <li key={stat.label}>
                {stat.tabHref ? (
                  <Link
                    href={stat.tabHref}
                    className="flex flex-col gap-1 rounded border border-bureau-700/30 bg-bureau-800/15 p-3 transition-colors hover:border-bureau-600/40 hover:bg-bureau-800/30"
                  >
                    {inner}
                  </Link>
                ) : (
                  <span className="flex flex-col gap-1 rounded border border-bureau-700/20 bg-bureau-800/10 p-3 opacity-60">
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="text-xs text-bureau-500">
        Cette fiche réunit les signaux croisés, la trajectoire, les liens et les documents source.
        Les onglets ci-dessus suivent toujours le même ordre, quelle que soit la personnalité.
      </p>
    </section>
  );
}
