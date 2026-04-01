import {
  POLICE_VIOLENCE_STATS,
  DEMOCRATIC_EROSION,
  LABOR_RIGHTS,
  ENVIRONMENT_DATA,
  SOCIAL_FABRIC,
} from "@/data/bilan-macron";
import type { SourcedFact } from "@/data/bilan-macron";

const severityColor = {
  critique: "border-l-rose",
  notable: "border-l-amber",
  informatif: "border-l-bureau-500",
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-bureau-700/10 py-2">
      <span className="text-xs text-bureau-400">{label}</span>
      <span className="text-sm font-semibold text-rose">{value}</span>
    </div>
  );
}

function FactBlock({
  facts,
  color = "rose",
}: {
  facts: SourcedFact[];
  color?: "rose" | "amber" | "teal";
}) {
  const borderColor =
    color === "rose"
      ? "border-l-rose"
      : color === "amber"
        ? "border-l-amber"
        : "border-l-teal";
  const valueColor =
    color === "rose"
      ? "text-rose"
      : color === "amber"
        ? "text-amber"
        : "text-teal";

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

export function BilanDroitsSection() {
  const pv = POLICE_VIOLENCE_STATS;

  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-bureau-100 mb-1">
          Droits humains, d&eacute;mocratie et environnement
        </h2>
        <p className="text-sm text-bureau-400">
          Violences polici&egrave;res, libert&eacute;s publiques, droit du travail, climat.
        </p>
      </div>

      {/* Police violence */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Violences polici&egrave;res
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Gilets Jaunes, retraites, Sainte-Soline &mdash; sources : Amnesty
          International, IGPN, Defenseur des droits
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* GJ stats */}
          <div className="rounded-xl border border-rose/20 bg-bureau-800/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose mb-3">
              Gilets Jaunes (2018-2019)
            </p>
            <StatRow label="Manifestants blesses" value={pv.giletsJaunes.blesses} />
            <StatRow label="Yeux perdus (eborgnements)" value={pv.giletsJaunes.yeux} />
            <StatRow label="Mains arrachees (grenades)" value={pv.giletsJaunes.mains} />
            <StatRow label="Blessures a la tete" value={pv.giletsJaunes.blessuresTete} />
            <StatRow label="Blessures par LBD-40" value={pv.giletsJaunes.blessuresLBD} />
            <StatRow label="Gardes a vue" value={pv.giletsJaunes.gardesAVue} />
          </div>

          {/* Deaths */}
          <div className="rounded-xl border border-rose/20 bg-bureau-800/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-rose mb-3">
              Morts lors d&rsquo;interventions policieres
            </p>
            <StatRow
              label={`Sous Macron (${pv.mortsInterventions.macron.periode})`}
              value={`${pv.mortsInterventions.macron.total} (${pv.mortsInterventions.macron.parAn}/an)`}
            />
            <StatRow
              label={`Sous Hollande (${pv.mortsInterventions.hollande.periode})`}
              value={`${pv.mortsInterventions.hollande.total} (${pv.mortsInterventions.hollande.parAn}/an)`}
            />
            <StatRow label="Annee 2024 seule" value={pv.mortsInterventions.annee2024} />
            <div className="mt-3 rounded-lg bg-rose/5 border border-rose/10 px-3 py-2">
              <p className="text-xs text-rose">{pv.impunite}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-4 py-3 border-l-2 border-l-rose">
          <p className="text-sm font-medium text-bureau-200">
            {pv.contexteEuropeen}
          </p>
          <p className="mt-1 text-xs text-bureau-400">
            Condamnations internationales :{" "}
            {pv.condamnationsInternationales.join(", ")}
          </p>
        </div>
      </div>

      {/* Democratic erosion */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          &Eacute;rosion d&eacute;mocratique
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          49.3, dissolutions, confiance, liberte de la presse
        </p>
        <div className="space-y-2">
          {DEMOCRATIC_EROSION.map((row) => (
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
      </div>

      {/* Labor rights */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Droit du travail
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Ordonnances 2017, plafonnement des indemnites, fusion CSE
        </p>
        <FactBlock facts={LABOR_RIGHTS} color="amber" />
      </div>

      {/* Environment */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Environnement
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Climat, renouvelables, glyphosate, eau
        </p>
        <FactBlock facts={ENVIRONMENT_DATA} color="teal" />
      </div>

      {/* Social fabric */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-1">
          Tissu social
        </h3>
        <p className="text-xs text-bureau-500 mb-4">
          Confiance, mouvements sociaux, sante mentale, abstention
        </p>
        <FactBlock facts={SOCIAL_FABRIC} />
      </div>
    </section>
  );
}
