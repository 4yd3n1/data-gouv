import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export default async function SenateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.senateur.findUnique({
    where: { id },
    include: { mandats: { orderBy: { dateDebut: "desc" } }, commissions: { orderBy: { dateDebut: "desc" } } },
  });
  if (!s) notFound();

  return (
    <>
      <PageHeader
        title={`${s.civilite ?? ""} ${s.prenom} ${s.nom}`}
        subtitle={`${s.groupe ?? "—"} · ${s.departement ?? "—"}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/gouvernance" },
          { label: "Sénateurs", href: "/gouvernance/senateurs" },
          { label: `${s.prenom} ${s.nom}` },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <dl className="space-y-3 text-sm">
              {[
                ["Groupe", s.groupe],
                ["Département", s.departement],
                ["Profession", s.profession],
                ["Naissance", fmtDate(s.dateNaissance)],
                ["Prise de fonction", fmtDate(s.datePriseFonction)],
              ]
                .filter(([, v]) => v && v !== "—")
                .map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-4">
                    <dt className="text-bureau-500">{k}</dt>
                    <dd className="text-right text-bureau-200">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {s.mandats.length > 0 && (
              <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Mandats ({s.mandats.length})</h3>
                <div className="space-y-2">
                  {s.mandats.map((m) => (
                    <div key={m.id} className="rounded-lg bg-bureau-700/20 px-4 py-3">
                      <p className="text-sm text-bureau-200">{m.libelle}</p>
                      <p className="text-xs text-bureau-500">
                        {m.type} · {fmtDate(m.dateDebut)} → {m.dateFin ? fmtDate(m.dateFin) : "en cours"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {s.commissions.length > 0 && (
              <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Commissions ({s.commissions.length})</h3>
                <div className="space-y-2">
                  {s.commissions.map((c) => (
                    <div key={c.id} className="rounded-lg bg-bureau-700/20 px-4 py-3">
                      <p className="text-sm text-bureau-200">{c.nom}</p>
                      <p className="text-xs text-bureau-500">
                        {c.fonction ?? "Membre"} · {fmtDate(c.dateDebut)} → {c.dateFin ? fmtDate(c.dateFin) : "en cours"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
