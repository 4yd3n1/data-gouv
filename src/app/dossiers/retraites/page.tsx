import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { fmt } from "@/lib/format";

export default async function RetraitesPage() {
  const dossier = getDossier("retraites");
  if (!dossier) notFound();

  const [
    scrutins,
    // Search for 49.3 related scrutins (reform was passed via 49-3)
    scrutins493,
    retraiteActionCount,
    retraiteLobbyCount,
    topOrgsRaw,
    deportCount,
  ] = await Promise.all([
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["retraites"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // Motions de censure and retraite-related votes by title
    prisma.scrutin.findMany({
      where: {
        AND: [
          {
            OR: [
              { titre: { contains: "retraite", mode: "insensitive" } },
              { titre: { contains: "pension", mode: "insensitive" } },
              { titre: { contains: "49", mode: "insensitive" } },
            ],
          },
        ],
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 5,
    }),
    // Lobbying in retraite / pension / assurance domains
    prisma.actionLobbyiste.count({
      where: {
        OR: [
          { domaine: { contains: "retraite", mode: "insensitive" } },
          { domaine: { contains: "pension", mode: "insensitive" } },
          { domaine: { contains: "social", mode: "insensitive" } },
          { domaine: { contains: "assurance", mode: "insensitive" } },
          { domaine: { contains: "prévoyance", mode: "insensitive" } },
          { domaine: { contains: "prevoyance", mode: "insensitive" } },
        ],
      },
    }),
    prisma.lobbyiste.count({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "retraite", mode: "insensitive" } },
              { domaine: { contains: "pension", mode: "insensitive" } },
              { domaine: { contains: "social", mode: "insensitive" } },
              { domaine: { contains: "assurance", mode: "insensitive" } },
              { domaine: { contains: "prévoyance", mode: "insensitive" } },
              { domaine: { contains: "prevoyance", mode: "insensitive" } },
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
              { domaine: { contains: "retraite", mode: "insensitive" } },
              { domaine: { contains: "pension", mode: "insensitive" } },
              { domaine: { contains: "social", mode: "insensitive" } },
              { domaine: { contains: "assurance", mode: "insensitive" } },
              { domaine: { contains: "prévoyance", mode: "insensitive" } },
              { domaine: { contains: "prevoyance", mode: "insensitive" } },
            ],
          },
        },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
    prisma.deport.count(),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  // Merge tagged + title-matched scrutins, deduplicate by id
  const allScrutinIds = new Set<string>();
  const mergedScrutins = [...scrutins, ...scrutins493].filter((s) => {
    if (allScrutinIds.has(s.id)) return false;
    allScrutinIds.add(s.id);
    return true;
  });

  const scrutinsForList = mergedScrutins.map((s) => ({
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
      <DossierNav currentSlug="retraites" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Context — the 49.3 and democratic legitimacy */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Recours à l&apos;article 49.3</p>
              <p className="mt-2 text-2xl font-bold text-rose">2023</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Réforme adoptée sans vote de l&apos;Assemblée
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Âge légal de départ</p>
              <p className="mt-2 text-2xl font-bold text-amber">64 ans</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Depuis la réforme de 2023 (contre 62 ans)
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Lobbying retraite &amp; social</p>
              <p className="mt-2 text-2xl font-bold text-bureau-200">{fmt(retraiteLobbyCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Organisations actives (registre HATVP)
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber/20 bg-amber/5 px-5 py-4">
            <p className="text-sm text-bureau-300">
              La réforme des retraites de 2023 est l&apos;une des plus contestées de la V&egrave; République.
              Adoptée via l&apos;article 49.3 sans vote de l&apos;Assemblée nationale, elle a déclenché
              une vague de manifestations et plusieurs motions de censure. Ce dossier retrace les votes
              parlementaires et les acteurs du lobbying liés à la protection sociale.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-5 py-4">
            <p className="text-sm text-bureau-400">
              <span className="font-medium text-bureau-200">{fmt(deportCount)}</span> déports enregistrés à l&apos;Assemblée nationale
              — dont plusieurs liés à des conflits d&apos;intérêts sur des textes de protection sociale.
            </p>
          </div>
        </section>

        {/* Section 1 — Votes retraites */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins parlementaires tagués retraites ou portant sur les pensions et l&apos;article 49
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 2 — Lobbying protection sociale */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying protection sociale
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Représentants d&apos;intérêts dans les domaines retraite, pension, assurance et prévoyance — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={retraiteActionCount}
            lobbyCount={retraiteLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Retraite / pension / assurance / protection sociale"
          />
        </section>

        {/* Ongoing data note */}
        <section>
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-5">
            <h3 className="text-sm font-medium text-bureau-300 mb-2">Données en cours d&apos;intégration</h3>
            <p className="text-sm text-bureau-500">
              Des données supplémentaires sont prévues : pensions moyennes par catégorie (DREES),
              taux de remplacement par régime, projections du Conseil d&apos;Orientation des Retraites (COR),
              et statistiques de recours au minimum vieillesse (ASPA).
              Ces indicateurs permettront d&apos;objectiver le débat sur la soutenabilité du système.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
