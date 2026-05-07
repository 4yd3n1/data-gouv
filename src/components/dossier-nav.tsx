import Link from "next/link";

const DOSSIER_LINKS: Array<{ slug: string; label: string; href: string }> = [
  { slug: "bilan-macron", label: "Bilan Macron", href: "/dossiers/bilan-macron" },
  { slug: "medias", label: "Concentration des médias", href: "/dossiers/medias" },
  { slug: "financement-politique", label: "Financement politique", href: "/dossiers/financement-politique" },
  { slug: "souverainete", label: "Souveraineté économique", href: "/souverainete" },
];

interface DossierNavProps {
  currentSlug?: string;
}

export function DossierNav({ currentSlug }: DossierNavProps) {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center gap-1 py-3 overflow-x-auto">
          <Link
            href="/signaux"
            className="shrink-0 rounded-full px-4 py-1.5 text-sm text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200 transition-colors"
          >
            ← Signaux
          </Link>
          {DOSSIER_LINKS.map((d) => (
            <Link
              key={d.slug}
              href={d.href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                currentSlug === d.slug
                  ? "bg-bureau-700 text-bureau-100"
                  : "text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
