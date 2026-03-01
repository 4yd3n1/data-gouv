import type { Dossier } from "@/lib/dossier-config";

interface DossierHeroProps {
  dossier: Dossier;
}

const colorMap = {
  amber: { badge: "border-amber/20 bg-amber/5 text-amber", title: "text-amber", block: "border-amber/20 bg-bureau-800/40" },
  teal:  { badge: "border-teal/20 bg-teal/5 text-teal",   title: "text-teal",  block: "border-teal/20 bg-bureau-800/40" },
  blue:  { badge: "border-blue/20 bg-blue/5 text-blue",   title: "text-blue",  block: "border-blue/20 bg-bureau-800/40" },
  rose:  { badge: "border-rose/20 bg-rose/5 text-rose",   title: "text-rose",  block: "border-rose/20 bg-bureau-800/40" },
};

export function DossierHero({ dossier }: DossierHeroProps) {
  const c = colorMap[dossier.color];
  const words = dossier.label.split(" ");
  const lastWord = words.slice(-1)[0];
  const restWords = words.slice(0, -1).join(" ");

  return (
    <section className="grid-bg relative overflow-hidden border-b border-bureau-700/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="fade-up mb-3">
          <span className={`inline-block rounded-full border px-3 py-0.5 text-xs uppercase tracking-widest ${c.badge}`}>
            Dossier thématique
          </span>
        </div>

        <h1 className="fade-up delay-1 font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
          {restWords}{restWords ? " " : ""}
          <span className={`italic ${c.title}`}>{lastWord}</span>
        </h1>

        <p className="fade-up delay-2 mt-3 max-w-2xl text-bureau-400">
          {dossier.subtitle}
        </p>

        {/* Citizen concern stat */}
        <div className={`fade-up delay-3 mt-8 max-w-2xl rounded-xl border px-6 py-4 ${c.block}`}>
          <blockquote className="text-lg font-medium text-bureau-100">
            &ldquo;{dossier.stat}&rdquo;
          </blockquote>
          <cite className="mt-1 block text-xs text-bureau-500 not-italic">
            — {dossier.statSource}
          </cite>
        </div>
      </div>
    </section>
  );
}
