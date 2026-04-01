import type { BeforeAfter, SourcedFact } from "@/data/bilan-macron";
import {
  POVERTY_DATA,
  PURCHASING_POWER_DATA,
  DEBT_FISCAL_DATA,
  FISCAL_GIFTS,
  EMPLOYMENT_DATA,
} from "@/data/bilan-macron";

const severityColor = {
  critique: "border-l-rose",
  notable: "border-l-amber",
  informatif: "border-l-bureau-500",
};

function BeforeAfterTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: BeforeAfter[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
        {title}
      </h3>
      <p className="text-xs text-bureau-500 mb-4">{subtitle}</p>
      <div className="space-y-2">
        {rows.map((row) => (
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
                    {row.beforeYear} : <span className="text-bureau-300">{row.before}</span>
                  </span>
                  <span className="text-bureau-600">&rarr;</span>
                  <span className="text-bureau-500">
                    {row.afterYear} : <span className="text-bureau-200">{row.after}</span>
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-semibold ${
                    row.severity === "critique"
                      ? "text-rose"
                      : row.severity === "notable"
                        ? "text-amber"
                        : "text-bureau-300"
                  }`}
                >
                  {row.delta}
                </span>
                <p className="text-[10px] text-bureau-600 mt-0.5">{row.source}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FactList({
  title,
  subtitle,
  facts,
}: {
  title: string;
  subtitle: string;
  facts: SourcedFact[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
        {title}
      </h3>
      <p className="text-xs text-bureau-500 mb-4">{subtitle}</p>
      <div className="space-y-2">
        {facts.map((fact, i) => (
          <div
            key={i}
            className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 border-l-2 border-l-rose"
          >
            <p className="text-sm text-bureau-300">{fact.text}</p>
            {fact.value && (
              <p className="mt-1 text-sm font-semibold text-rose">
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
  );
}

export function BilanEconomieSection() {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-bureau-100 mb-1">
          &Eacute;conomie, pauvret&eacute; et in&eacute;galit&eacute;s
        </h2>
        <p className="text-sm text-bureau-400">
          L&rsquo;&eacute;volution des indicateurs &eacute;conomiques et sociaux entre
          l&rsquo;arriv&eacute;e au pouvoir de Macron et aujourd&rsquo;hui.
        </p>
      </div>

      <BeforeAfterTable
        title="Pauvrete et inegalites"
        subtitle="Seuil a 60 % du revenu median — sources : INSEE, Eurostat, Fondation Abbe Pierre"
        rows={POVERTY_DATA}
      />

      <BeforeAfterTable
        title="Pouvoir d'achat"
        subtitle="Inflation, prix de l'energie, alimentation — sources : INSEE, CRE"
        rows={PURCHASING_POWER_DATA}
      />

      <BeforeAfterTable
        title="Dette publique et politique fiscale"
        subtitle="A qui a profite la politique budgetaire ? — sources : INSEE, DGFiP, France Strategie"
        rows={DEBT_FISCAL_DATA}
      />

      <FactList
        title="Cadeaux fiscaux aux plus riches"
        subtitle="Cout total pour les finances publiques vs resultats mesures"
        facts={FISCAL_GIFTS}
      />

      <BeforeAfterTable
        title="Emploi"
        subtitle="Taux de chomage en baisse, mais qualite de l'emploi en question"
        rows={EMPLOYMENT_DATA}
      />
    </section>
  );
}
