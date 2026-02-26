import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ScoreBar } from "@/components/score-bar";

export default async function DeputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.depute.findUnique({ where: { id }, include: { departement: true } });
  if (!d) notFound();

  return (
    <>
      <PageHeader
        title={`${d.civilite} ${d.prenom} ${d.nom}`}
        subtitle={`${d.groupe} · ${d.departementNom} (${d.departementCode})`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/gouvernance" },
          { label: "Députés", href: "/gouvernance/deputes" },
          { label: `${d.prenom} ${d.nom}` },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Info */}
          <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 lg:col-span-1">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bureau-700/40 text-lg font-medium text-bureau-200">
                {d.prenom[0]}{d.nom[0]}
              </div>
              <div>
                <h2 className="text-lg font-medium text-bureau-100">{d.prenom} {d.nom}</h2>
                <p className="text-xs text-bureau-500">{d.actif ? "En mandat" : "Ancien député"}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Groupe", `${d.groupe} (${d.groupeAbrev})`],
                ["Département", `${d.departementNom} (${d.departementCode})`],
                ["Circonscription", `${d.circonscription}e`],
                ["Législature", `${d.legislature}e`],
                ["Naissance", d.dateNaissance ? `${fmtDate(d.dateNaissance)}${d.villeNaissance ? `, ${d.villeNaissance}` : ""}` : null],
                ["Profession", d.profession],
                ["Mandats", d.nombreMandats ? `${d.nombreMandats}` : null],
                ["Expérience", d.experienceDepute],
                ["Prise de fonction", fmtDate(d.datePriseFonction)],
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

          {/* Scores */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
              <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-bureau-400">Scores d&apos;activité</h3>
              <div className="space-y-4">
                <ScoreBar value={d.scoreParticipation} label="Participation" color="teal" />
                <ScoreBar value={d.scoreSpecialite} label="Spécialité" color="blue" />
                <ScoreBar value={d.scoreLoyaute} label="Loyauté" color="amber" />
                <ScoreBar value={d.scoreMajorite} label="Majorité" color="rose" />
              </div>
            </div>

            {/* Contact */}
            {(d.email || d.twitter || d.website) && (
              <div className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
                <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-bureau-400">Contact</h3>
                <div className="space-y-2 text-sm">
                  {d.email && (
                    <a href={`mailto:${d.email}`} className="block text-teal hover:underline">{d.email}</a>
                  )}
                  {d.twitter && (
                    <a href={`https://twitter.com/${d.twitter}`} target="_blank" rel="noopener" className="block text-bureau-300 hover:text-teal">@{d.twitter}</a>
                  )}
                  {d.website && (
                    <a href={d.website} target="_blank" rel="noopener" className="block text-bureau-300 hover:text-teal truncate">{d.website}</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
