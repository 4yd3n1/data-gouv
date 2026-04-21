import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ScoreGauge } from "@/components/score-gauge";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface Stat {
  label: string;
  value: number | string | null;
}

interface ProfileHeroProps {
  avatar: { src?: string | null; initials: string };
  name: string;
  subtitle: string;
  status: { active: boolean; label: string };
  breadcrumbs: Breadcrumb[];
  badge?: string;
  stats?: Stat[];
  scores?: Array<{
    value: number | null;
    label: string;
    color: "teal" | "amber" | "blue" | "rose";
  }>;
  contact?: {
    email?: string | null;
    twitter?: string | null;
    website?: string | null;
  };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function ProfileHero({
  avatar,
  name,
  subtitle,
  status,
  breadcrumbs,
  badge,
  stats,
  scores,
  contact,
  actions,
  children,
}: ProfileHeroProps) {
  const hasContact =
    contact && (contact.email || contact.twitter || contact.website);
  const hasScores = scores && scores.some((s) => s.value != null);
  const visibleStats = (stats ?? []).filter(
    (s) => s.value != null && s.value !== 0 && s.value !== "",
  );

  return (
    <div className="border-b border-bureau-800/60 bg-gradient-to-b from-bureau-900/70 to-bureau-950">
      <div className="mx-auto max-w-6xl px-6 pt-7">
        {/* Breadcrumb + top-right actions on one line */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <nav className="flex min-w-0 items-center gap-1.5 text-[11px] text-bureau-500">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-bureau-700">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-bureau-300"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate text-bureau-400">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {/* Identity row */}
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar src={avatar.src} initials={avatar.initials} size="lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
              <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-tight text-bureau-50 sm:text-5xl">
                {name}
              </h1>
              {badge && (
                <span className="rounded-sm border border-teal/30 bg-teal/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal">
                  {badge}
                </span>
              )}
            </div>

            <p className="mt-2 text-[15px] leading-snug text-bureau-300">{subtitle}</p>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status.active
                    ? "bg-teal shadow-[0_0_6px_rgba(45,212,191,0.5)]"
                    : "bg-bureau-600"
                }`}
              />
              <span className={status.active ? "text-teal" : "text-bureau-500"}>
                {status.label}
              </span>
            </div>

            {hasContact && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-bureau-500">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="transition-colors hover:text-bureau-200"
                  >
                    Email
                  </a>
                )}
                {contact.twitter && (
                  <a
                    href={`https://twitter.com/${contact.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-bureau-200"
                  >
                    @{contact.twitter}
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-bureau-200"
                  >
                    Site web
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats strip — tabular, minimal */}
        {visibleStats.length > 0 && (
          <div className="mt-7 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-bureau-800/50 pt-5">
            {visibleStats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-xl tabular-nums text-bureau-100">
                  {stat.value}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-bureau-500">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scores row (deputies / president) */}
        {hasScores && (
          <div className="mt-6 flex flex-wrap items-center justify-start rounded-xl border border-bureau-700/20 bg-bureau-800/15 sm:inline-flex sm:flex-nowrap sm:divide-x sm:divide-bureau-700/20">
            {scores.map((s) => (
              <ScoreGauge
                key={s.label}
                value={s.value}
                label={s.label}
                color={s.color}
                showContext
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-7">{children}</div>
    </div>
  );
}
