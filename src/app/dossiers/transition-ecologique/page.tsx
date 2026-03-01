import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { fmt } from "@/lib/format";

export default async function TransitionEcologiquePage() {
  const dossier = getDossier("transition-ecologique");
  if (!dossier) notFound();

  const [
    scrutins,
    energieActionCount,
    energieLobbyCount,
    topOrgsRaw,
  ] = await Promise.all([
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["ecologie"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // Lobbying in énergie, pétrole, gaz, automobile, aérien domains
    prisma.actionLobbyiste.count({
      where: {
        OR: [
          { domaine: { contains: "énergi", mode: "insensitive" } },
          { domaine: { contains: "energi", mode: "insensitive" } },
          { domaine: { contains: "pétrole", mode: "insensitive" } },
          { domaine: { contains: "petrole", mode: "insensitive" } },
          { domaine: { contains: "gaz", mode: "insensitive" } },
          { domaine: { contains: "automobil", mode: "insensitive" } },
          { domaine: { contains: "aéri", mode: "insensitive" } },
          { domaine: { contains: "aeri", mode: "insensitive" } },
          { domaine: { contains: "climat", mode: "insensitive" } },
          { domaine: { contains: "environnement", mode: "insensitive" } },
        ],
      },
    }),
    prisma.lobbyiste.count({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "énergi", mode: "insensitive" } },
              { domaine: { contains: "energi", mode: "insensitive" } },
              { domaine: { contains: "pétrole", mode: "insensitive" } },
              { domaine: { contains: "petrole", mode: "insensitive" } },
              { domaine: { contains: "gaz", mode: "insensitive" } },
              { domaine: { contains: "automobil", mode: "insensitive" } },
              { domaine: { contains: "aéri", mode: "insensitive" } },
              { domaine: { contains: "aeri", mode: "insensitive" } },
              { domaine: { contains: "climat", mode: "insensitive" } },
              { domaine: { contains: "environnement", mode: "insensitive" } },
            ],
          },
        },
      },
    }),
    prisma.lobbyiste.findMany({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "énergi", mode: "insensitive" } },
              { domaine: { contains: "energi", mode: "insensitive" } },
              { domaine: { contains: "pétrole", mode: "insensitive" } },
              { domaine: { contains: "petrole", mode: "insensitive" } },
              { domaine: { contains: "gaz", mode: "insensitive" } },
              { domaine: { contains: "automobil", mode: "insensitive" } },
              { domaine: { contains: "aéri", mode: "insensitive" } },
              { domaine: { contains: "aeri", mode: "insensitive" } },
              { domaine: { contains: "climat", mode: "insensitive" } },
              { domaine: { contains: "environnement", mode: "insensitive" } },
            ],
          },
        },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  const scrutinsForList = scrutins.map((s) => ({
    id: s.id,
    titre: s.titre,
    dateScrutin: s.dateScrutin,
    sortCode: s.sortCode,
    groupeVotes: s.groupeVotes.map((g) => ({
      nomOrgane: g.organeRef,
      pour: g.pour,
      contre: g.contre,
      abstentions: g.abstentions,
    })),
  }));

  return (
    <>
      <DossierHero dossier={dossier} />
      <DossierNav currentSlug="transition-ecologique" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Context cards */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Objectif climatique 2030</p>
              <p className="mt-2 text-2xl font-bold text-rose">À risque</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Haut Conseil pour le Climat 2024
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Lobbying énergie & climat</p>
              <p className="mt-2 text-2xl font-bold text-teal">{fmt(energieLobbyCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Organisations actives (registre HATVP)
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Actions de lobbying</p>
              <p className="mt-2 text-2xl font-bold text-bureau-200">{fmt(energieActionCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Énergie / pétrole / gaz / automobile
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 px-5 py-4">
            <p className="text-sm text-bureau-300">
              Les industries pétrolières, gazières et automobiles figurent parmi les secteurs les plus actifs
              du registre HATVP. Cette densité de lobbying contraste avec l&apos;urgence climatique et les objectifs
              de neutralité carbone fixés par la loi Energie-Climat.
            </p>
          </div>
        </section>

        {/* Section 1 — Votes écologie */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins parlementaires tagués écologie — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 2 — Lobbying énergie */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying énergie &amp; industries fossiles
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Représentants d&apos;intérêts dans les domaines énergie, pétrole, gaz, automobile et aérien — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={energieActionCount}
            lobbyCount={energieLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Énergie / pétrole / gaz / automobile / aérien"
          />
        </section>

        {/* Ongoing data note */}
        <section>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-5">
            <h3 className="text-sm font-medium text-bureau-300 mb-2">Données en cours d&apos;intégration</h3>
            <p className="text-sm text-bureau-500">
              Des indicateurs supplémentaires sont prévus : émissions de GES par secteur (CITEPA),
              part des énergies renouvelables dans le mix (RTE), artificialisation des sols par commune (Cerema),
              et qualité de l&apos;air par département (Atmo France).
              L&apos;ingestion est planifiée dans les phases suivantes du déploiement.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
