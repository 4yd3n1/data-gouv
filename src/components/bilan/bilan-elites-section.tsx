import {
  BILLIONAIRE_DATA,
  ELITE_FACTS,
  REVOLVING_DOOR_CASES,
} from "@/data/bilan-macron";

const severityColor = {
  critique: "border-l-rose",
  notable: "border-l-amber",
  informatif: "border-l-bureau-500",
};

export function BilanElitesSection() {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-bureau-100 mb-1">
          Enrichissement des &eacute;lites
        </h2>
        <p className="text-sm text-bureau-400">
          Milliardaires, cadeaux fiscaux, McKinsey, pantouflage &mdash; ceux
          qui ont profit&eacute; de la politique macroniste.
        </p>
      </div>

      {/* Billionaires */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Ultra-riches et milliardaires
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Sources : Forbes, Challenges, Oxfam France
        </p>
        <div className="space-y-2">
          {BILLIONAIRE_DATA.map((row) => (
            <div
              key={row.label}
              className={`rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 border-l-2 ${severityColor[row.severity]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-bureau-200">
                    {row.label}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-bureau-500">
                      {row.beforeYear} :{" "}
                      <span className="text-bureau-300">{row.before}</span>
                    </span>
                    <span className="text-bureau-600">&rarr;</span>
                    <span className="text-bureau-500">
                      {row.afterYear} :{" "}
                      <span className="text-bureau-200">{row.after}</span>
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-rose">
                    {row.delta}
                  </span>
                  <p className="text-[10px] text-bureau-600 mt-0.5">
                    {row.source}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-rose/20 bg-rose/5 px-5 py-4">
          <p className="text-sm font-medium text-rose">
            53 milliardaires possedent plus que les 32 millions de Francais les
            plus pauvres
          </p>
          <p className="mt-1 text-xs text-bureau-400">
            Croissance du patrimoine des milliardaires depuis 2019 : 13 M EUR
            par jour &mdash; Oxfam France
          </p>
        </div>
      </div>

      {/* Key facts */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Faits saillants
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          McKinsey Gate, pantouflage, patrimoine des ministres
        </p>
        <div className="space-y-2">
          {ELITE_FACTS.map((fact, i) => (
            <div
              key={i}
              className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 border-l-2 border-l-amber"
            >
              <p className="text-sm text-bureau-300">{fact.text}</p>
              {fact.value && (
                <p className="mt-1 text-sm font-semibold text-amber">
                  {fact.value}
                </p>
              )}
              <p className="mt-1 text-[10px] text-bureau-600">
                Source : {fact.source}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revolving door */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Pantouflage : du public au prive
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          51 % des ministres du premier mandat sont partis vers le secteur prive
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-bureau-700/20">
                <th className="pb-2 text-left text-bureau-500 font-normal">
                  Nom
                </th>
                <th className="pb-2 text-left text-bureau-500 font-normal">
                  Fonction publique
                </th>
                <th className="pb-2 text-left text-bureau-500 font-normal">
                  Destination privee
                </th>
              </tr>
            </thead>
            <tbody>
              {REVOLVING_DOOR_CASES.map((c) => (
                <tr key={c.name} className="border-b border-bureau-700/10">
                  <td className="py-2 text-bureau-200 font-medium">
                    {c.name}
                  </td>
                  <td className="py-2 text-bureau-400">{c.from}</td>
                  <td className="py-2 text-amber">{c.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
