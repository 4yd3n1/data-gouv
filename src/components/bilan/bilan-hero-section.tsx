import { HERO_STATS } from "@/data/bilan-macron";

const colorMap = {
  rose: "border-rose/20 bg-rose/5 text-rose",
  amber: "border-amber/20 bg-amber/5 text-amber",
  teal: "border-teal/20 bg-teal/5 text-teal",
  blue: "border-blue/20 bg-blue/5 text-blue",
};

const valueColorMap = {
  rose: "text-rose",
  amber: "text-amber",
  teal: "text-teal",
  blue: "text-blue",
};

export function BilanHeroSection() {
  return (
    <section className="grid-bg relative overflow-hidden border-b border-bureau-700/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="fade-up mb-3">
          <span className="inline-block rounded-full border border-rose/20 bg-rose/5 px-3 py-0.5 text-xs uppercase tracking-widest text-rose">
            Dossier d&rsquo;investigation
          </span>
        </div>

        <h1 className="fade-up delay-1 font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
          Bilan de la pr&eacute;sidence{" "}
          <span className="italic text-rose">Macron</span>
        </h1>

        <p className="fade-up delay-2 mt-3 max-w-2xl text-bureau-400">
          Deux mandats, neuf ans de donn&eacute;es. Ce que les chiffres officiels
          r&eacute;v&egrave;lent sur l&rsquo;&eacute;tat de la France &mdash; et ceux qui en ont
          profit&eacute;.
        </p>

        <div className="fade-up delay-3 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border px-5 py-4 ${colorMap[stat.color]}`}
            >
              <p className={`text-2xl font-semibold ${valueColorMap[stat.color]}`}>
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-bureau-200">{stat.label}</p>
              <p className="mt-0.5 text-xs text-bureau-500">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="fade-up delay-3 mt-8 max-w-2xl rounded-xl border border-rose/20 bg-bureau-800/40 px-6 py-4">
          <blockquote className="text-lg font-medium text-bureau-100">
            &laquo;&nbsp;Ce n&rsquo;est pas du ruissellement, c&rsquo;est de
            l&rsquo;&eacute;vaporation.&nbsp;&raquo;
          </blockquote>
          <cite className="mt-1 block text-xs text-bureau-500 not-italic">
            &mdash; Senateur Eric Bocquet, a propos de la suppression de
            l&rsquo;ISF et du PFU (France Strategie, rapport final 2023)
          </cite>
        </div>
      </div>
    </section>
  );
}
