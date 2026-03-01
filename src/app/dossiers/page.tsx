import Link from "next/link";
import { DOSSIERS } from "@/lib/dossier-config";
import { PageHeader } from "@/components/page-header";

export const revalidate = 86400; // Dossiers are mostly static — revalidate daily

const colorAccent = {
  amber: "text-amber",
  teal: "text-teal",
  blue: "text-blue",
  rose: "text-rose",
};

const colorBorder = {
  amber: "group-hover:border-amber/30",
  teal: "group-hover:border-teal/30",
  blue: "group-hover:border-blue/30",
  rose: "group-hover:border-rose/30",
};

export default function DossiersPage() {
  return (
    <>
      <PageHeader
        title="Dossiers thématiques"
        subtitle="8 grandes questions citoyennes — recoupées avec les votes, le lobbying et les déclarations d'intérêts"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Dossiers" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Priority 1 — full-width cards */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-bureau-600 mb-4">Priorité citoyenne n°1</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {DOSSIERS.filter((d) => d.priority === 1).map((d) => (
              <Link
                key={d.slug}
                href={`/dossiers/${d.slug}`}
                className={`card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-8 transition-all hover:bg-bureau-800/50 ${colorBorder[d.color]}`}
              >
                <p className={`text-xs uppercase tracking-widest mb-3 ${colorAccent[d.color]}`}>
                  Dossier
                </p>
                <h2 className="text-2xl font-medium text-bureau-100 group-hover:text-bureau-50">
                  {d.label}
                </h2>
                <p className="mt-2 text-sm text-bureau-400">{d.subtitle}</p>
                <blockquote className="mt-4 text-sm italic text-bureau-500 border-l-2 border-bureau-700/50 pl-3">
                  {d.stat}
                </blockquote>
                <div className="mt-6 flex items-center gap-1">
                  <span className={`text-xs uppercase tracking-widest ${colorAccent[d.color]}`}>
                    Consulter →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority 2 */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-bureau-600 mb-4">Enjeux structurels</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {DOSSIERS.filter((d) => d.priority === 2).map((d) => (
              <Link
                key={d.slug}
                href={`/dossiers/${d.slug}`}
                className={`card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:bg-bureau-800/50 ${colorBorder[d.color]}`}
              >
                <p className={`text-xs uppercase tracking-widest mb-2 ${colorAccent[d.color]}`}>Dossier</p>
                <h2 className="text-xl font-medium text-bureau-100 group-hover:text-bureau-50">{d.label}</h2>
                <p className="mt-1.5 text-sm text-bureau-400">{d.subtitle}</p>
                <p className="mt-4 text-xs uppercase tracking-widest text-bureau-600 group-hover:text-bureau-400 transition-colors">
                  Consulter →
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Priority 3 */}
        <div>
          <p className="text-xs uppercase tracking-widest text-bureau-600 mb-4">Autres dossiers</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOSSIERS.filter((d) => d.priority === 3).map((d) => (
              <Link
                key={d.slug}
                href={`/dossiers/${d.slug}`}
                className={`card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5 transition-all hover:bg-bureau-800/50 ${colorBorder[d.color]}`}
              >
                <p className={`text-xs uppercase tracking-widest mb-2 ${colorAccent[d.color]}`}>Dossier</p>
                <h2 className="text-base font-medium text-bureau-100 group-hover:text-bureau-50">{d.label}</h2>
                <p className="mt-1 text-xs text-bureau-500">{d.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
