import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

function MiniChart({ data, color = "teal" }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;

  const colors: Record<string, string> = { teal: "#2dd4bf", amber: "#f59e0b", blue: "#3b82f6", rose: "#f43f5e" };
  const stroke = colors[color] ?? colors.teal;

  const w = 600;
  const h = 200;
  const padding = 30;
  const plotW = w - padding * 2;
  const plotH = h - padding * 2;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * plotW,
    y: padding + plotH - ((d.value - min) / range) * plotH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.15" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="2" />
      {points.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0 || i === data.length - 1).map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3" fill={stroke} />
          <text x={p.x} y={h - 8} textAnchor="middle" fill="#64748b" fontSize="10">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default async function EconomiePage() {
  const indicateurs = await prisma.indicateur.findMany({
    include: { observations: { orderBy: { periodeDebut: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Économie"
        subtitle="Indicateurs macroéconomiques — INSEE, data.gouv.fr"
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Économie" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6">
          {indicateurs.map((ind) => {
            const latest = ind.observations[ind.observations.length - 1];
            const chartData = ind.observations.map((o) => ({
              label: o.periode,
              value: o.valeur,
            }));

            const colorMap: Record<string, string> = {
              pib: "amber",
              emploi: "rose",
              entreprises: "teal",
            };

            return (
              <div key={ind.id} className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-bureau-100">{ind.nom}</h3>
                    <p className="text-xs text-bureau-500">
                      {ind.source} · {ind.frequence} · {ind.correction ?? "brut"}
                    </p>
                  </div>
                  {latest && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-bureau-100">
                        {ind.unite === "pourcent" ? `${latest.valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : fmt(Math.round(latest.valeur))}
                      </p>
                      <p className="text-xs text-bureau-500">{latest.periode}</p>
                    </div>
                  )}
                </div>
                <MiniChart data={chartData} color={colorMap[ind.domaine] ?? "teal"} />
                {ind.description && <p className="mt-3 text-xs text-bureau-500">{ind.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
