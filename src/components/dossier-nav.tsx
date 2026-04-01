import Link from "next/link";

const DOSSIER_LINKS = [
  { slug: "bilan-macron", label: "Bilan Macron" },
  { slug: "medias", label: "Concentration des m\u00e9dias" },
  { slug: "financement-politique", label: "Financement politique" },
];

interface DossierNavProps {
  currentSlug?: string;
}

export function DossierNav({ currentSlug }: DossierNavProps) {
  return (
    <div className="border-b border-bureau-700/30 bg-bureau-900/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center gap-1 py-3">
          <Link
            href="/signaux"
            className="shrink-0 rounded-full px-4 py-1.5 text-sm text-bureau-400 hover:bg-bureau-800 hover:text-bureau-200 transition-colors"
          >
            ← Signaux
          </Link>
          {DOSSIER_LINKS.map((d) => (
            <Link
              key={d.slug}
              href={`/dossiers/${d.slug}`}
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
