import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";

export default async function MonumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const monument = await prisma.monument.findUnique({
    where: { id },
    include: {
      departement: true,
      commune: true,
    },
  });

  if (!monument) notFound();

  const title = monument.denomination || monument.id;

  const infoFields = [
    { label: "Commune", value: monument.communeNom },
    { label: "Département", value: monument.departementNom },
    { label: "Région", value: monument.region },
    { label: "Adresse", value: monument.adresse },
    { label: "Siècle principal", value: monument.sieclePrincipal },
    { label: "Siècle secondaire", value: monument.siecleSecondaire },
    { label: "Protection", value: monument.protectionType },
    { label: "Date de protection", value: monument.protectionDate },
    { label: "Domaine", value: monument.domaine },
    { label: "Statut juridique", value: monument.statutJuridique },
    { label: "Coordonnées", value: monument.latitude && monument.longitude ? `${monument.latitude.toFixed(5)}, ${monument.longitude.toFixed(5)}` : null },
    { label: "Dernière mise à jour", value: monument.dateMaj },
    { label: "Référence", value: monument.id },
  ].filter((f) => f.value);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={[monument.communeNom, monument.departementNom, monument.region].filter(Boolean).join(" · ")}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Patrimoine", href: "/patrimoine" },
          { label: "Monuments", href: "/patrimoine/monuments" },
          { label: title },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Status badges */}
        <div className="mb-8 flex flex-wrap gap-3">
          {monument.protectionType && (
            <span className={`rounded-lg border px-4 py-2 text-sm font-medium ${
              monument.protectionType.includes("classé")
                ? "border-rose/30 bg-rose/10 text-rose"
                : "border-amber/30 bg-amber/10 text-amber"
            }`}>
              {monument.protectionType}
            </span>
          )}
          {monument.sieclePrincipal && (
            <span className="rounded-lg border border-bureau-700/30 bg-bureau-800/30 px-4 py-2 text-sm text-bureau-300">
              {monument.sieclePrincipal}
            </span>
          )}
          {monument.domaine && (
            <span className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-2 text-sm text-teal">
              {monument.domaine}
            </span>
          )}
        </div>

        {/* Territory links */}
        <div className="mb-8 flex flex-wrap gap-3">
          {monument.departement && (
            <Link
              href={`/territoire/${monument.departement.code}`}
              className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-2 text-sm text-teal transition-colors hover:bg-teal/10"
            >
              {monument.departement.libelle} ({monument.departement.code})
            </Link>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Info panel */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Informations</h2>
              <dl className="space-y-3">
                {infoFields.map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs text-bureau-500">{f.label}</dt>
                    <dd className="mt-0.5 text-sm text-bureau-200">{f.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Map link if coordinates exist */}
              {monument.latitude && monument.longitude && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${monument.latitude}&mlon=${monument.longitude}#map=16/${monument.latitude}/${monument.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm text-teal transition-colors hover:bg-teal/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Voir sur la carte
                </a>
              )}
            </div>
          </div>

          {/* Description + historique */}
          <div className="lg:col-span-2 space-y-8">
            {monument.description && (
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-bureau-100">Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-bureau-300">{monument.description}</p>
              </div>
            )}

            {monument.historique && (
              <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-6">
                <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl text-bureau-100">Historique</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-bureau-300">{monument.historique}</p>
              </div>
            )}

            {!monument.description && !monument.historique && (
              <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 p-6">
                <p className="text-sm text-bureau-500">Aucune description disponible pour ce monument.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
