import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const m = await prisma.musee.findUnique({
    where: { id },
    select: { nom: true, ville: true, region: true },
  });
  if (!m) return { title: "Musée introuvable — L'Observatoire Citoyen" };
  return {
    title: `${m.nom}${m.ville ? ` — ${m.ville}` : ""} · L'Observatoire Citoyen`,
    description: `Musée ${m.nom}${m.ville ? ` à ${m.ville}` : ""}${m.region ? `, ${m.region}` : ""}. Données de fréquentation et informations patrimoniales.`,
  };
}

export default async function MuseeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const musee = await prisma.musee.findUnique({
    where: { id },
    include: {
      frequentations: { orderBy: { annee: "asc" } },
      departement: true,
      commune: true,
    },
  });

  if (!musee) notFound();

  const maxTotal = Math.max(...musee.frequentations.map((f) => f.total ?? 0), 1);
  const latest = musee.frequentations[musee.frequentations.length - 1];

  return (
    <>
      <PageHeader
        title={musee.nom}
        subtitle={[musee.ville, musee.region].filter(Boolean).join(" · ")}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Patrimoine", href: "/patrimoine" },
          { label: "Musées", href: "/patrimoine/musees" },
          { label: musee.nom },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Info grid */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
            <p className="text-xs uppercase tracking-wider text-bureau-500">Dernière fréquentation</p>
            <p className="mt-2 text-2xl font-bold text-amber">{latest?.total != null ? fmt(latest.total) : "—"}</p>
            <p className="text-sm text-bureau-400">{latest ? `en ${latest.annee}` : ""}</p>
          </div>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
            <p className="text-xs uppercase tracking-wider text-bureau-500">Localisation</p>
            <p className="mt-2 text-lg font-medium text-bureau-100">{musee.ville ?? "—"}</p>
            <p className="text-sm text-bureau-400">{musee.region ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
            <p className="text-xs uppercase tracking-wider text-bureau-500">Identifiant</p>
            <p className="mt-2 font-mono text-sm text-bureau-300">{musee.id}</p>
            {musee.idPatrimostat && <p className="mt-1 font-mono text-xs text-bureau-500">Patrimostat : {musee.idPatrimostat}</p>}
            {musee.dateAppellation && <p className="mt-1 text-xs text-bureau-400">Appellation : {musee.dateAppellation}</p>}
          </div>
        </div>

        {/* Links to territory */}
        <div className="mb-10 flex flex-wrap gap-3">
          {musee.departement && (
            <Link
              href={`/territoire/${musee.departement.code}`}
              className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-2 text-sm text-teal transition-colors hover:bg-teal/10"
            >
              {musee.departement.libelle} ({musee.departement.code})
            </Link>
          )}
          {musee.ferme === "oui" && (
            <span className="rounded-lg border border-rose/20 bg-rose/5 px-4 py-2 text-sm text-rose">
              Fermé{musee.anneeFermeture ? ` en ${musee.anneeFermeture}` : ""}
            </span>
          )}
        </div>

        {/* Attendance chart */}
        {musee.frequentations.length > 0 && (
          <>
            <h2 className="mb-6 font-[family-name:var(--font-display)] text-xl text-bureau-100">Fréquentation annuelle</h2>

            {/* SVG bar chart */}
            <div className="mb-10 overflow-x-auto rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
              <svg viewBox={`0 0 ${Math.max(musee.frequentations.length * 52, 400)} 220`} className="w-full" style={{ minWidth: `${musee.frequentations.length * 52}px` }}>
                {musee.frequentations.map((f, i) => {
                  const total = f.total ?? 0;
                  const h = (total / maxTotal) * 160;
                  const x = i * 52 + 20;
                  return (
                    <g key={f.annee}>
                      <rect x={x} y={180 - h} width="32" height={h} rx="3" fill="var(--color-amber)" opacity="0.6" className="transition-all hover:opacity-1" />
                      <text x={x + 16} y={195} textAnchor="middle" className="fill-bureau-400 text-[10px]">
                        {f.annee}
                      </text>
                      <text x={x + 16} y={175 - h} textAnchor="middle" className="fill-bureau-300 text-[9px]">
                        {fmt(total)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Detail table */}
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-bureau-100">Détail par année</h2>
            <div className="overflow-x-auto rounded-xl border border-bureau-700/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bureau-700/30 bg-bureau-800/40">
                    <th className="px-4 py-3 text-left font-medium text-bureau-400">Année</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">Total</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">Payant</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">Gratuit</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">Scolaires</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">&lt;18 ans</th>
                    <th className="px-4 py-3 text-right font-medium text-bureau-400">18-25 ans</th>
                  </tr>
                </thead>
                <tbody>
                  {[...musee.frequentations].reverse().map((f) => (
                    <tr key={f.annee} className="border-b border-bureau-700/10 transition-colors hover:bg-bureau-800/30">
                      <td className="px-4 py-2.5 font-medium text-bureau-100">{f.annee}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-amber">{fmt(f.total)}</td>
                      <td className="px-4 py-2.5 text-right text-bureau-300">{fmt(f.payant)}</td>
                      <td className="px-4 py-2.5 text-right text-bureau-300">{fmt(f.gratuit)}</td>
                      <td className="px-4 py-2.5 text-right text-bureau-300">{fmt(f.scolaires)}</td>
                      <td className="px-4 py-2.5 text-right text-bureau-300">{fmt(f.moins18AnsHorsScolaires)}</td>
                      <td className="px-4 py-2.5 text-right text-bureau-300">{fmt(f.de18a25Ans)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {musee.frequentations.length === 0 && (
          <p className="text-sm text-bureau-500">Aucune donnée de fréquentation disponible.</p>
        )}
      </div>
    </>
  );
}
