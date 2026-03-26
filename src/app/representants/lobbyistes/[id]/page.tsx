import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const l = await prisma.lobbyiste.findUnique({
    where: { id },
    select: { nom: true, categorieActivite: true },
  });
  if (!l) return { title: "Lobbyiste introuvable — L'Observatoire Citoyen" };
  return {
    title: `${l.nom} — Registre des lobbyistes · L'Observatoire Citoyen`,
    description: `Activités de lobbying déclarées à la HATVP par ${l.nom}${l.categorieActivite ? ` (${l.categorieActivite})` : ""}.`,
  };
}

export default async function LobbyisteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await prisma.lobbyiste.findUnique({
    where: { id },
    include: { actions: { take: 50 } },
  });
  if (!l) notFound();

  return (
    <>
      <PageHeader
        title={l.nom}
        subtitle={l.categorieActivite ?? "Représentant d'intérêts"}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Représentants", href: "/representants" },
          { label: "Lobbyistes", href: "/representants/lobbyistes" },
          { label: l.nom },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <dl className="space-y-3 text-sm">
              {[
                ["Type", l.type],
                ["Catégorie", l.categorieActivite],
                ["SIREN", l.siren],
                ["Effectif", l.effectif],
                ["Chiffre d'affaires", l.chiffreAffaires],
                ["Adresse", l.adresse],
                ["Inscription", fmtDate(l.dateInscription)],
              ]
                .filter(([, v]) => v && v !== "—")
                .map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-bureau-500 text-xs">{k}</dt>
                    <dd className="text-bureau-200">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="lg:col-span-2">
            <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
              <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">
                Actions de représentation ({l.actions.length}{l.actions.length === 50 ? "+" : ""})
              </h3>
              {l.actions.length === 0 ? (
                <p className="text-sm text-bureau-500">Aucune action enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {l.actions.map((a) => (
                    <div key={a.id} className="rounded-lg bg-bureau-700/20 px-4 py-3">
                      <p className="text-sm text-bureau-200">{a.description || a.type || "Action non détaillée"}</p>
                      <p className="mt-0.5 text-xs text-bureau-500">
                        {[a.domaine, a.type, a.periode].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
