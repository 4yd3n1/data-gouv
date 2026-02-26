import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {breadcrumbs && (
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-bureau-500">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-teal transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-bureau-300">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-bureau-100">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-bureau-400">{subtitle}</p>}
      </div>
    </div>
  );
}
