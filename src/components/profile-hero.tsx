import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ScoreGauge } from "@/components/score-gauge";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ProfileHeroProps {
  avatar: { src?: string | null; initials: string };
  name: string;
  subtitle: string;
  status: { active: boolean; label: string };
  breadcrumbs: Breadcrumb[];
  badge?: string;
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
  children?: React.ReactNode;
}

export function ProfileHero({
  avatar,
  name,
  subtitle,
  status,
  breadcrumbs,
  badge,
  scores,
  contact,
  children,
}: ProfileHeroProps) {
  const hasContact =
    contact && (contact.email || contact.twitter || contact.website);
  const hasScores = scores && scores.some((s) => s.value != null);

  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/60">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <nav className="flex items-center gap-1.5 text-xs text-bureau-500">
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
                <span className="text-bureau-400">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Hero content */}
      <div className="mx-auto max-w-6xl px-6 pb-0 pt-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Large avatar */}
          <Avatar src={avatar.src} initials={avatar.initials} size="lg" />

          {/* Identity block */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-bureau-100">
                {name}
              </h1>
              {badge && (
                <span className="rounded-full bg-teal/10 px-3 py-0.5 text-xs font-semibold tracking-wide text-teal">
                  {badge}
                </span>
              )}
            </div>

            <p className="mt-1.5 text-sm text-bureau-400">{subtitle}</p>

            <div className="mt-1.5 flex items-center justify-center gap-1.5 sm:justify-start">
              <span
                className={`h-2 w-2 rounded-full ${
                  status.active ? "bg-teal shadow-[0_0_6px_rgba(45,212,191,0.4)]" : "bg-bureau-600"
                }`}
              />
              <span className="text-xs text-bureau-500">{status.label}</span>
            </div>

            {/* Contact pills */}
            {hasContact && (
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-bureau-700/40 bg-bureau-800/40 px-3 py-1 text-xs text-bureau-400 transition-all hover:border-teal/30 hover:text-teal"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    Email
                  </a>
                )}
                {contact.twitter && (
                  <a
                    href={`https://twitter.com/${contact.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-bureau-700/40 bg-bureau-800/40 px-3 py-1 text-xs text-bureau-400 transition-all hover:border-teal/30 hover:text-teal"
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    @{contact.twitter}
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-bureau-700/40 bg-bureau-800/40 px-3 py-1 text-xs text-bureau-400 transition-all hover:border-teal/30 hover:text-teal"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                    Site web
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scores row (deputies only) */}
        {hasScores && (
          <div className="mt-6 flex flex-wrap items-center justify-center rounded-xl border border-bureau-700/20 bg-bureau-800/15 sm:inline-flex sm:flex-nowrap sm:divide-x sm:divide-bureau-700/20">
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

      {/* Tab bar (children slot) */}
      <div className="mt-6">{children}</div>
    </div>
  );
}
