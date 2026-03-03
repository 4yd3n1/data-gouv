import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { computeAlignment, type AlignmentPair, type GroupInfo } from "@/lib/alignment";

export const metadata: Metadata = {
  title: "Matrice d'alignement politique — L'Observatoire Citoyen",
  description:
    "Visualisation des alliances et oppositions entre groupes parlementaires, calculée sur l'ensemble des scrutins enregistrés.",
};

export const revalidate = 86400; // Once per day — alignment data doesn't change often

// ─── Color helpers ──────────────────────────────────────────────────────────

function alignmentBg(rate: number): string {
  if (rate >= 88) return "rgba(45,212,191,0.18)";
  if (rate >= 74) return "rgba(45,212,191,0.09)";
  if (rate >= 56) return "rgba(100,116,139,0.10)";
  if (rate >= 38) return "rgba(244,63,94,0.09)";
  return "rgba(244,63,94,0.18)";
}

function alignmentTextColor(rate: number): string {
  if (rate >= 74) return "#2dd4bf";
  if (rate >= 52) return "#94a3b8";
  return "#f43f5e";
}

// ─── Build the lookup map ────────────────────────────────────────────────────

/** Returns a key valid for both (a,b) and (b,a) orderings */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildMatrix(
  pairs: AlignmentPair[],
  groups: GroupInfo[]
): Map<string, AlignmentPair> {
  const map = new Map<string, AlignmentPair>();
  pairs.forEach((p) => map.set(pairKey(p.groupA, p.groupB), p));
  return map;
}

// ─── Sub-components (server) ─────────────────────────────────────────────────

function DiagonalCell({ abrev }: { abrev: string }) {
  return (
    <td
      style={{ backgroundColor: "rgba(45,212,191,0.05)" }}
      className="border border-bureau-700/20 px-2 py-2 text-center"
    >
      <span className="text-[11px] font-semibold text-teal">100 %</span>
    </td>
  );
}

function EmptyCell() {
  return (
    <td className="border border-bureau-700/20 bg-bureau-800/10 px-2 py-2 text-center">
      <span className="text-[11px] text-bureau-600">—</span>
    </td>
  );
}

function DataCell({ pair }: { pair: AlignmentPair }) {
  const rate = pair.alignmentRate;
  return (
    <td
      style={{ backgroundColor: alignmentBg(rate) }}
      className="border border-bureau-700/20 px-2 py-2 text-center"
      title={`${pair.agreed} accords / ${pair.totalShared} scrutins communs`}
    >
      <span
        className="text-[12px] font-semibold tabular-nums"
        style={{ color: alignmentTextColor(rate) }}
      >
        {rate.toFixed(0)} %
      </span>
    </td>
  );
}

function GroupLabel({ group }: { group: GroupInfo }) {
  const abrev = group.libelleAbrege ?? group.libelle.slice(0, 6);
  return (
    <span title={group.libelle}>
      {abrev}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AlignmentsPage() {
  const { pairs, groups } = await computeAlignment(5);

  if (pairs.length === 0) {
    return (
      <>
        <PageHeader
          title="Matrice d'alignement politique"
          subtitle="Alliances et oppositions entre groupes parlementaires"
          breadcrumbs={[
            { label: "Accueil", href: "/" },
            { label: "Votes", href: "/votes" },
            { label: "Alignements" },
          ]}
        />
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="text-bureau-400">
            Données insuffisantes. Lancez d'abord{" "}
            <code className="rounded bg-bureau-800 px-1.5 py-0.5 text-[13px]">
              pnpm ingest:scrutins &amp;&amp; pnpm tag:scrutins
            </code>
            .
          </p>
        </div>
      </>
    );
  }

  const matrix = buildMatrix(pairs, groups);

  // Top allies (highest rate, min 20 shared scrutins)
  const significantPairs = pairs.filter((p) => p.totalShared >= 20);
  const topAllies    = [...significantPairs].sort((a, b) => b.alignmentRate - a.alignmentRate).slice(0, 5);
  const topOpponents = [...significantPairs].sort((a, b) => a.alignmentRate - b.alignmentRate).slice(0, 5);

  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const totalScrutins = pairs.length > 0 ? Math.max(...pairs.map((p) => p.totalShared)) : 0;

  // Stats
  const avgAlignment =
    pairs.length > 0
      ? Math.round(pairs.reduce((s, p) => s + p.alignmentRate, 0) / pairs.length)
      : 0;

  return (
    <>
      <PageHeader
        title="Matrice d'alignement politique"
        subtitle="Taux d'accord entre groupes parlementaires sur l'ensemble des scrutins enregistrés"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Votes", href: "/votes" },
          { label: "Alignements" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">

        {/* ── Overview stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Groupes analysés",         value: groups.length,      color: "text-bureau-100" },
            { label: "Paires comparées",          value: pairs.length,       color: "text-blue-400" },
            { label: "Alignement moyen",          value: `${avgAlignment} %`, color: "text-amber" },
            { label: "Scrutins communs (max)",    value: totalScrutins,      color: "text-teal" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.label}</p>
              <p className={`mt-1.5 text-2xl font-bold tabular-nums ${s.color}`}>
                {typeof s.value === "number" ? s.value.toLocaleString("fr-FR") : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Legend ── */}
        <div className="flex flex-wrap items-center gap-6 text-[11px]">
          <span className="text-bureau-500 uppercase tracking-widest">Légende</span>
          {[
            { bg: "rgba(45,212,191,0.18)",  text: "#2dd4bf", label: "≥ 88 % — forte alliance" },
            { bg: "rgba(45,212,191,0.09)",  text: "#2dd4bf", label: "74–87 %" },
            { bg: "rgba(100,116,139,0.10)", text: "#94a3b8", label: "56–73 % — neutre" },
            { bg: "rgba(244,63,94,0.09)",   text: "#f43f5e", label: "38–55 %" },
            { bg: "rgba(244,63,94,0.18)",   text: "#f43f5e", label: "< 38 % — forte opposition" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-8 rounded"
                style={{ backgroundColor: l.bg, border: "1px solid rgba(255,255,255,0.06)" }}
              />
              <span style={{ color: l.text }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* ── Heat map matrix ── */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Matrice de votes croisés
          </h2>
          <p className="mb-4 text-[12px] text-bureau-500">
            Chaque cellule indique le pourcentage de scrutins où les deux groupes ont voté dans le
            même sens (pour ou contre). Survolez une cellule pour voir le détail.
          </p>

          <div className="overflow-x-auto rounded-xl border border-bureau-700/20">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {/* Top-left empty corner */}
                  <th className="border border-bureau-700/20 bg-bureau-900/50 px-3 py-2" />
                  {groups.map((g) => (
                    <th
                      key={g.id}
                      className="border border-bureau-700/20 bg-bureau-900/50 px-2 py-2 text-center"
                    >
                      <span
                        className="text-[11px] font-semibold text-bureau-300"
                        title={g.libelle}
                      >
                        {g.libelleAbrege ?? g.libelle.slice(0, 6)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((rowGroup) => (
                  <tr key={rowGroup.id}>
                    {/* Row header */}
                    <th className="border border-bureau-700/20 bg-bureau-900/50 px-4 py-2 text-left font-semibold text-[11px] text-bureau-300 whitespace-nowrap">
                      <GroupLabel group={rowGroup} />
                    </th>
                    {/* Cells */}
                    {groups.map((colGroup) => {
                      if (rowGroup.id === colGroup.id) {
                        return <DiagonalCell key={colGroup.id} abrev={rowGroup.libelleAbrege ?? "—"} />;
                      }
                      const pair = matrix.get(pairKey(rowGroup.id, colGroup.id));
                      if (!pair) return <EmptyCell key={colGroup.id} />;
                      return <DataCell key={colGroup.id} pair={pair} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-bureau-600">
            — : moins de 5 scrutins communs avec résultat clair (pour/contre) pour les deux groupes.
          </p>
        </section>

        {/* ── Allies & opponents ── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Top allies */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-teal">
              Alliances les plus fortes
            </h2>
            <div className="space-y-2">
              {topAllies.map((p, i) => {
                const gA = groupMap.get(p.groupA);
                const gB = groupMap.get(p.groupB);
                if (!gA || !gB) return null;
                return (
                  <div
                    key={`${p.groupA}|${p.groupB}`}
                    className="flex items-center justify-between rounded-xl border border-teal/10 bg-teal/5 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bureau-200">
                        {gA.libelleAbrege ?? gA.libelle} × {gB.libelleAbrege ?? gB.libelle}
                      </p>
                      <p className="mt-0.5 text-[11px] text-bureau-500">
                        {p.totalShared.toLocaleString("fr-FR")} scrutins communs ·{" "}
                        {p.agreed.toLocaleString("fr-FR")} accords
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 text-lg font-bold tabular-nums text-teal">
                      {p.alignmentRate.toFixed(0)} %
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Top opponents */}
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-rose">
              Oppositions les plus marquées
            </h2>
            <div className="space-y-2">
              {topOpponents.map((p) => {
                const gA = groupMap.get(p.groupA);
                const gB = groupMap.get(p.groupB);
                if (!gA || !gB) return null;
                return (
                  <div
                    key={`${p.groupA}|${p.groupB}`}
                    className="flex items-center justify-between rounded-xl border border-rose/10 bg-rose/5 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bureau-200">
                        {gA.libelleAbrege ?? gA.libelle} × {gB.libelleAbrege ?? gB.libelle}
                      </p>
                      <p className="mt-0.5 text-[11px] text-bureau-500">
                        {p.totalShared.toLocaleString("fr-FR")} scrutins communs ·{" "}
                        {(p.totalShared - p.agreed).toLocaleString("fr-FR")} désaccords
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 text-lg font-bold tabular-nums text-rose">
                      {p.alignmentRate.toFixed(0)} %
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ── Methodology note ── */}
        <section className="rounded-xl border border-bureau-700/20 bg-bureau-900/30 px-6 py-5">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Méthodologie
          </h2>
          <p className="text-[13px] text-bureau-400 leading-relaxed max-w-3xl">
            Le taux d'alignement est calculé sur l'ensemble des scrutins publics de l'Assemblée
            nationale disponibles dans la base. Pour chaque scrutin, la position d'un groupe est
            déterminée par la majorité de ses membres : si le groupe vote davantage pour que
            contre, sa position est "pour" et inversement. Les scrutins où l'abstention est
            majoritaire pour l'un des deux groupes sont exclus du calcul. Seules les paires ayant
            au moins 5 scrutins communs sont représentées.
          </p>
          <div className="mt-4 flex gap-4">
            <Link
              href="/votes"
              className="text-[12px] text-teal/70 transition-colors hover:text-teal"
            >
              ← Retour aux votes
            </Link>
            <Link
              href="/votes/mon-depute"
              className="text-[12px] text-bureau-500 transition-colors hover:text-bureau-300"
            >
              Voir les votes par député →
            </Link>
          </div>
        </section>

      </div>
    </>
  );
}
