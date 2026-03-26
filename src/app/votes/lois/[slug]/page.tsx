import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";
import { GroupExpander } from "@/components/group-expander";
import { ScrutinAccordion } from "@/components/scrutin-accordion";

export const revalidate = 3600;

const TYPE_LABELS: Record<string, string> = {
  PLF: "Projet de loi de finances",
  PLFSS: "Projet de loi de financement de la Sécurité sociale",
  PROJET_LOI: "Projet de loi",
  PROPOSITION_LOI: "Proposition de loi",
  MOTION_CENSURE: "Motion de censure",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loi = await prisma.loiParlementaire.findUnique({
    where: { slug },
    select: { titreCourt: true, resumeSimple: true },
  });
  if (!loi) return { title: "Texte introuvable — L'Observatoire Citoyen" };
  return {
    title: `${loi.titreCourt} · L'Observatoire Citoyen`,
    description: loi.resumeSimple,
  };
}

export default async function LoiDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch law + all linked scrutins (ordered)
  const loi = await prisma.loiParlementaire.findUnique({
    where: { slug },
    include: {
      scrutins: {
        orderBy: { ordre: "asc" },
        include: {
          scrutin: {
            select: {
              id: true,
              titre: true,
              dateScrutin: true,
              sortCode: true,
              pour: true,
              contre: true,
              abstentions: true,
              nonVotants: true,
              nombreVotants: true,
              codeTypeVote: true,
              libelleTypeVote: true,
              demandeur: true,
            },
          },
        },
      },
    },
  });

  if (!loi) notFound();

  // Find the VOTE_FINAL scrutin
  const voteFinalLink = loi.scrutins.find((sl) => sl.role === "VOTE_FINAL");
  const voteFinal = voteFinalLink?.scrutin ?? loi.scrutins[0]?.scrutin;

  // Fetch group votes + individual votes for the final scrutin
  const [groupVotes, individualVotes] = voteFinal
    ? await Promise.all([
        prisma.groupeVote.findMany({
          where: { scrutinId: voteFinal.id },
          include: { organe: { select: { id: true, libelle: true, libelleAbrege: true, couleur: true } } },
          orderBy: { nombreMembresGroupe: "desc" },
        }),
        prisma.voteRecord.findMany({
          where: { scrutinId: voteFinal.id },
          include: {
            depute: { select: { id: true, prenom: true, nom: true, groupeAbrev: true } },
          },
          orderBy: [{ groupeOrganeRef: "asc" }, { depute: { nom: "asc" } }],
        }),
      ])
    : [[], []];

  // Shape data for GroupExpander
  const groups = groupVotes
    .filter((gv) => gv.organe)
    .map((gv) => ({
      organeRef: gv.organeRef,
      libelle: gv.organe!.libelle,
      libelleAbrege: gv.organe!.libelleAbrege,
      couleur: gv.organe!.couleur,
      positionMajoritaire: gv.positionMajoritaire,
      pour: gv.pour,
      contre: gv.contre,
      abstentions: gv.abstentions,
      nonVotants: gv.nonVotants,
      nombreMembresGroupe: gv.nombreMembresGroupe,
    }));

  const deputies = individualVotes.map((vr) => ({
    id: vr.depute.id,
    prenom: vr.depute.prenom,
    nom: vr.depute.nom,
    groupeAbrev: vr.depute.groupeAbrev,
    position: vr.position,
  }));

  // Shape scrutins for accordion
  const scrutinRows = loi.scrutins.map((sl) => ({
    id: sl.scrutin.id,
    titre: sl.scrutin.titre,
    dateScrutin: sl.scrutin.dateScrutin,
    sortCode: sl.scrutin.sortCode,
    pour: sl.scrutin.pour,
    contre: sl.scrutin.contre,
    abstentions: sl.scrutin.abstentions,
    role: sl.role,
  }));

  // Count scrutin types
  const typeCounts = scrutinRows.reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] ?? 0) + 1;
    return acc;
  }, {});

  // Adoption rate on related scrutins
  const adoptedCount = scrutinRows.filter((s) => s.sortCode.toLowerCase().includes("adopt")).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-bureau-500">
        <Link href="/votes" className="hover:text-bureau-300">Votes</Link>
        <span>/</span>
        <Link href="/votes/lois" className="hover:text-bureau-300">Grandes lois</Link>
        <span>/</span>
        <span className="text-bureau-400">{loi.titreCourt}</span>
      </nav>

      {/* Hero */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <ScrutinResultBadge sortCode={loi.statut} />
          <span className="rounded bg-bureau-700/50 px-2 py-0.5 text-xs text-bureau-400">
            {TYPE_LABELS[loi.type] ?? loi.type}
          </span>
          {loi.dateVote && (
            <span className="text-xs text-bureau-500">{fmtDate(loi.dateVote)}</span>
          )}
          <span className="text-xs text-bureau-600">17e législature</span>
        </div>

        <h1 className="font-serif text-3xl text-bureau-100">{loi.titreCourt}</h1>

        <p className="text-base leading-relaxed text-bureau-300">{loi.resumeSimple}</p>

        {loi.dossierUrl && (
          <a
            href={loi.dossierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-teal hover:underline"
          >
            Dossier Assemblée nationale ↗
          </a>
        )}
      </div>

      {/* Global vote stats (from VOTE_FINAL) */}
      {voteFinal && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-4 text-center">
            <p className="text-xl font-semibold text-bureau-100">{fmt(voteFinal.nombreVotants)}</p>
            <p className="mt-1 text-xs text-bureau-500">Votants</p>
          </div>
          <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 text-center">
            <p className="text-xl font-semibold text-teal">{fmt(voteFinal.pour)}</p>
            <p className="mt-1 text-xs text-teal/70">Pour</p>
          </div>
          <div className="rounded-xl border border-rose/20 bg-rose/5 p-4 text-center">
            <p className="text-xl font-semibold text-rose">{fmt(voteFinal.contre)}</p>
            <p className="mt-1 text-xs text-rose/70">Contre</p>
          </div>
          <div className="rounded-xl border border-amber/20 bg-amber/5 p-4 text-center">
            <p className="text-xl font-semibold text-amber">{fmt(voteFinal.abstentions)}</p>
            <p className="mt-1 text-xs text-amber/70">Abstentions</p>
          </div>
        </div>
      )}

      {/* Vote final detail */}
      {voteFinal && (
        <section className="mb-8">
          <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.15em] text-bureau-500">
            Vote de la loi
          </h2>
          <p className="mb-4 text-sm text-bureau-400">
            {voteFinal.libelleTypeVote}
            {voteFinal.demandeur ? ` · Demandé par ${voteFinal.demandeur}` : ""}
            {" · "}
            <Link href={`/votes/scrutins/${voteFinal.id}`} className="text-teal hover:underline">
              Voir le scrutin complet
            </Link>
          </p>

          {groups.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-bureau-500">
                Cliquez sur un groupe pour voir le vote de chacun de ses membres.
              </p>
              <GroupExpander groups={groups} deputies={deputies} />
            </div>
          ) : (
            <p className="text-sm text-bureau-500">Détail par groupe non disponible pour ce texte.</p>
          )}
        </section>
      )}

      {/* Related scrutins */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-bureau-500">
            Tous les scrutins liés
          </h2>
          <div className="flex flex-wrap gap-2 text-xs text-bureau-500">
            <span>{scrutinRows.length} scrutins</span>
            {typeCounts.AMENDEMENT && <span>· {typeCounts.AMENDEMENT} amendements</span>}
            {typeCounts.ARTICLE && <span>· {typeCounts.ARTICLE} articles</span>}
            {typeCounts.MOTION && <span>· {typeCounts.MOTION} motions</span>}
            <span>· {adoptedCount} adoptés</span>
          </div>
        </div>
        <ScrutinAccordion scrutins={scrutinRows} voteFinalId={voteFinal?.id} />
      </section>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-bureau-700/30 pt-6">
        <Link href="/votes/lois" className="text-sm text-bureau-400 hover:text-bureau-200">
          ← Retour aux grandes lois
        </Link>
        <Link href="/votes" className="text-sm text-bureau-400 hover:text-bureau-200">
          Tous les scrutins
        </Link>
      </div>
    </main>
  );
}
