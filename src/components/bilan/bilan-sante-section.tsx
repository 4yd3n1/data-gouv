import type { BeforeAfter, SourcedFact } from "@/data/bilan-macron";
import {
  HEALTHCARE_DATA,
  SOCIAL_CUTS,
  EDUCATION_DATA,
  PUBLIC_SERVICES_DATA,
} from "@/data/bilan-macron";

const severityColor = {
  critique: "border-l-rose",
  notable: "border-l-amber",
  informatif: "border-l-bureau-500",
};

function BeforeAfterRows({ rows }: { rows: BeforeAfter[] }) {
  return (
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
                {row.before !== "—" && (
                  <>
                    <span className="text-bureau-500">
                      {row.beforeYear} :{" "}
                      <span className="text-bureau-300">{row.before}</span>
                    </span>
                    <span className="text-bureau-600">&rarr;</span>
                  </>
                )}
                <span className="text-bureau-500">
                  {row.afterYear} :{" "}
                  <span className="text-bureau-200">{row.after}</span>
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
              <p className="text-[10px] text-bureau-600 mt-0.5">
                {row.source}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FactBlock({
  facts,
  color = "rose",
}: {
  facts: SourcedFact[];
  color?: "rose" | "amber" | "blue";
}) {
  const borderColor =
    color === "rose"
      ? "border-l-rose"
      : color === "amber"
        ? "border-l-amber"
        : "border-l-blue";
  const valueColor =
    color === "rose"
      ? "text-rose"
      : color === "amber"
        ? "text-amber"
        : "text-blue";

  return (
    <div className="space-y-2">
      {facts.map((fact, i) => (
        <div
          key={i}
          className={`rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 border-l-2 ${borderColor}`}
        >
          <p className="text-sm text-bureau-300">{fact.text}</p>
          {fact.value && (
            <p className={`mt-1 text-sm font-semibold ${valueColor}`}>
              {fact.value}
            </p>
          )}
          <p className="mt-1 text-[10px] text-bureau-600">
            Source : {fact.source}
          </p>
        </div>
      ))}
    </div>
  );
}

export function BilanSanteSection() {
  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-bureau-100 mb-1">
          Sant&eacute;, protection sociale et services publics
        </h2>
        <p className="text-sm text-bureau-400">
          L&rsquo;h&ocirc;pital public, les aides sociales, l&rsquo;&eacute;ducation et les
          services publics de proximit&eacute;.
        </p>
      </div>

      {/* Healthcare */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Système hospitalier
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Lits, urgences, personnel, d&eacute;serts m&eacute;dicaux &mdash; sources : DREES,
          FHF, CNAM
        </p>
        <BeforeAfterRows rows={HEALTHCARE_DATA} />
      </div>

      {/* Social protection cuts */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Protection sociale : ce qui a &eacute;t&eacute; coup&eacute;
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Assurance ch&ocirc;mage, APL, RSA, retraites
        </p>
        <FactBlock facts={SOCIAL_CUTS} />
      </div>

      {/* Education */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Éducation
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Postes, résultats PISA, Parcoursup, salaires
        </p>
        <FactBlock facts={EDUCATION_DATA} color="amber" />
      </div>

      {/* Public services */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Services publics de proximite
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Poste, rail, d&eacute;mat&eacute;rialisation
        </p>
        <FactBlock facts={PUBLIC_SERVICES_DATA} color="blue" />
      </div>
    </section>
  );
}
