import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDossier } from "@/lib/dossier-config";
import { DossierHero } from "@/components/dossier-hero";
import { DossierNav } from "@/components/dossier-nav";
import { TopicVoteList } from "@/components/topic-vote-list";
import { LobbyingDensity } from "@/components/lobbying-density";
import { DeptMap } from "@/components/dept-map";
import { fmt } from "@/lib/format";

export const revalidate = 86400;

export default async function SantePage() {
  const dossier = getDossier("sante");
  if (!dossier) notFound();

  const [
    scrutins,
    pharmaActionCount,
    pharmaLobbyCount,
    topOrgsRaw,
    declarationsCount,
    mgDensiteRaw,
  ] = await Promise.all([
    prisma.scrutin.findMany({
      where: {
        tags: { some: { tag: { in: ["sante"] } } },
      },
      include: { groupeVotes: true },
      orderBy: { dateScrutin: "desc" },
      take: 10,
    }),
    // Lobbying in pharma / santé / médical domains
    prisma.actionLobbyiste.count({
      where: {
        OR: [
          { domaine: { contains: "pharma", mode: "insensitive" } },
          { domaine: { contains: "santé", mode: "insensitive" } },
          { domaine: { contains: "sante", mode: "insensitive" } },
          { domaine: { contains: "médical", mode: "insensitive" } },
          { domaine: { contains: "medical", mode: "insensitive" } },
          { domaine: { contains: "hospital", mode: "insensitive" } },
        ],
      },
    }),
    prisma.lobbyiste.count({
      where: {
        actions: {
          some: {
            OR: [
              { domaine: { contains: "pharma", mode: "insensitive" } },
              { domaine: { contains: "santé", mode: "insensitive" } },
              { domaine: { contains: "sante", mode: "insensitive" } },
              { domaine: { contains: "médical", mode: "insensitive" } },
              { domaine: { contains: "medical", mode: "insensitive" } },
              { domaine: { contains: "hospital", mode: "insensitive" } },
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
              { domaine: { contains: "pharma", mode: "insensitive" } },
              { domaine: { contains: "santé", mode: "insensitive" } },
              { domaine: { contains: "sante", mode: "insensitive" } },
              { domaine: { contains: "médical", mode: "insensitive" } },
              { domaine: { contains: "medical", mode: "insensitive" } },
              { domaine: { contains: "hospital", mode: "insensitive" } },
            ],
          },
        },
      },
      select: { nom: true, _count: { select: { actions: true } } },
      orderBy: { actions: { _count: "desc" } },
      take: 5,
    }),
    // Declarations from medical/health sector (search organe or typeMandat)
    prisma.declarationInteret.count({
      where: {
        typeMandat: { in: ["Député", "Sénateur"] },
        totalParticipations: { gt: 0 },
      },
    }),
    // Medical density — MG per dept, latest available year
    prisma.densiteMedicale.findMany({
      where: { specialite: "MG" },
      orderBy: [{ annee: "desc" }, { pour10k: "asc" }],
      include: { departement: { select: { libelle: true } } },
      take: 200, // All depts, all years — we'll keep only latest per dept
    }),
  ]);

  const topOrgs = topOrgsRaw.map((o) => ({
    nom: o.nom,
    actions: o._count.actions,
  }));

  // Keep only the latest year per département and build DeptMap data
  const latestMgByDept = new Map<string, { pour10k: number; nombreMedecins: number }>();
  for (const r of mgDensiteRaw) {
    if (!latestMgByDept.has(r.departementCode) && r.pour10k !== null) {
      latestMgByDept.set(r.departementCode, { pour10k: r.pour10k, nombreMedecins: r.nombreMedecins });
    }
  }
  const mgDensiteMap = Array.from(latestMgByDept.entries()).map(([code, d]) => {
    const row = mgDensiteRaw.find((r) => r.departementCode === code)!;
    return { code, libelle: row.departement.libelle, value: d.pour10k };
  });

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
      <DossierNav currentSlug="sante" />

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">
        {/* Context */}
        <section>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Sans médecin traitant</p>
              <p className="mt-2 text-2xl font-bold text-rose">6 millions</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Français — CNAM 2024
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Déserts médicaux</p>
              <p className="mt-2 text-2xl font-bold text-amber">87 %</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Du territoire en sous-densité médicale
              </p>
            </div>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5">
              <p className="text-xs uppercase tracking-widest text-bureau-500">Lobbying santé</p>
              <p className="mt-2 text-2xl font-bold text-bureau-200">{fmt(pharmaLobbyCount)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-bureau-600">
                Organisations actives (registre HATVP)
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-rose/20 bg-rose/5 px-5 py-4">
            <p className="text-sm text-bureau-300">
              Le système de santé français est sous tension : déficit de l&apos;assurance maladie, déserts médicaux,
              saturation des urgences. Les données de lobbying révèlent une forte présence de l&apos;industrie
              pharmaceutique dans les processus législatifs.
            </p>
          </div>
        </section>

        {/* Section 1 — Votes santé */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votes au Parlement
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Scrutins parlementaires tagués santé — 10 votes les plus récents
            </p>
          </div>

          <TopicVoteList scrutins={scrutinsForList} />
        </section>

        {/* Section 2 — Lobbying santé */}
        <section>
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Lobbying pharmaceutique &amp; médical
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              Représentants d&apos;intérêts dans les domaines pharma, santé et médical — registre HATVP
            </p>
          </div>

          <LobbyingDensity
            actionCount={pharmaActionCount}
            lobbyCount={pharmaLobbyCount}
            topOrgs={topOrgs}
            domainLabel="Pharma / santé / médical / hôpitaux"
          />
        </section>

        {/* Section 3 — Densité médicale */}
        {mgDensiteMap.length > 0 ? (
          <section>
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Densité de médecins généralistes
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Médecins généralistes pour 10 000 habitants par département — source DREES
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-bureau-700/20">
              <DeptMap
                data={mgDensiteMap}
                color="teal"
                unit="/ 10 000 hab"
                limit={30}
                linkBase="/territoire/"
              />
            </div>
            <p className="mt-3 text-right text-xs text-bureau-600">
              <Link href="/territoire" className="hover:text-teal transition-colors">
                Explorer par département &rarr;
              </Link>
            </p>
          </section>
        ) : (
          <section>
            <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 px-6 py-5">
              <h3 className="text-sm font-medium text-bureau-300 mb-2">Densité médicale</h3>
              <p className="text-sm text-bureau-500">
                Données DREES non encore ingérées. Exécutez{" "}
                <code className="rounded bg-bureau-700/40 px-1 text-bureau-300">pnpm ingest:medecins</code>{" "}
                pour charger les données de démographie médicale par département.
              </p>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
