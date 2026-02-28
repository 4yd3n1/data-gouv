import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";
import { VoteBadge } from "@/components/vote-badge";

export default async function ScrutinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const scrutin = await prisma.scrutin.findUnique({
    where: { id },
    include: {
      groupeVotes: {
        include: { organe: true },
        orderBy: { nombreMembresGroupe: "desc" },
      },
    },
  });
  if (!scrutin) notFound();

  // Fetch individual votes grouped by position
  const votes = await prisma.voteRecord.findMany({
    where: { scrutinId: id },
    include: { depute: { select: { id: true, prenom: true, nom: true, groupeAbrev: true } } },
    orderBy: [{ position: "asc" }, { depute: { nom: "asc" } }],
  });

  const votesByPosition = {
    pour: votes.filter((v) => v.position === "pour"),
    contre: votes.filter((v) => v.position === "contre"),
    abstention: votes.filter((v) => v.position === "abstention"),
    nonVotant: votes.filter((v) => v.position === "nonVotant"),
  };

  return (
    <>
      <PageHeader
        title={`Scrutin n°${scrutin.numero}`}
        subtitle={`${fmtDate(scrutin.dateScrutin)} · ${scrutin.libelleTypeVote}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Gouvernance", href: "/gouvernance" },
          { label: "Scrutins", href: "/gouvernance/scrutins" },
          { label: `n°${scrutin.numero}` },
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Title + Result */}
        <div className="mb-8">
          <div className="flex items-start gap-3">
            <ScrutinResultBadge sortCode={scrutin.sortCode} />
            <p className="text-bureau-200">{scrutin.titre}</p>
          </div>
          {scrutin.demandeur && (
            <p className="mt-2 text-sm text-bureau-500">Demandeur : {scrutin.demandeur}</p>
          )}
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { v: scrutin.nombreVotants, l: "Votants", c: "text-bureau-100" },
            { v: scrutin.pour, l: "Pour", c: "text-teal" },
            { v: scrutin.contre, l: "Contre", c: "text-rose" },
            { v: scrutin.abstentions, l: "Abstentions", c: "text-amber" },
            { v: scrutin.nonVotants ?? 0, l: "Non-votants", c: "text-bureau-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 px-4 py-4">
              <p className={`text-2xl font-bold ${s.c}`}>{fmt(s.v)}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-bureau-500">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Group breakdown */}
        {scrutin.groupeVotes.length > 0 && (
          <div className="mb-8 card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
            <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-bureau-400">Par groupe politique</h3>
            <div className="space-y-3">
              {scrutin.groupeVotes.map((gv) => {
                const total = gv.pour + gv.contre + gv.abstentions + gv.nonVotants;
                const pourPct = total > 0 ? (gv.pour / total) * 100 : 0;
                const contrePct = total > 0 ? (gv.contre / total) * 100 : 0;
                const abstPct = total > 0 ? (gv.abstentions / total) * 100 : 0;
                return (
                  <div key={gv.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {gv.organe?.couleur && (
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: gv.organe.couleur }} />
                        )}
                        <span className="text-bureau-200">{gv.organe?.libelleAbrege ?? gv.organe?.libelle ?? gv.organeRef}</span>
                        <span className="text-xs text-bureau-500">({gv.nombreMembresGroupe})</span>
                      </div>
                      <VoteBadge position={gv.positionMajoritaire} />
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-bureau-700/30">
                      {pourPct > 0 && <div className="bg-teal" style={{ width: `${pourPct}%` }} />}
                      {contrePct > 0 && <div className="bg-rose" style={{ width: `${contrePct}%` }} />}
                      {abstPct > 0 && <div className="bg-amber" style={{ width: `${abstPct}%` }} />}
                    </div>
                    <div className="mt-1 flex gap-4 text-[10px] text-bureau-500">
                      <span>Pour: {gv.pour}</span>
                      <span>Contre: {gv.contre}</span>
                      <span>Abst: {gv.abstentions}</span>
                      <span>NV: {gv.nonVotants}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual votes by position */}
        <div className="grid gap-6 lg:grid-cols-2">
          {(["pour", "contre", "abstention", "nonVotant"] as const).map((pos) => {
            const posVotes = votesByPosition[pos];
            if (posVotes.length === 0) return null;
            return (
              <div key={pos} className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <VoteBadge position={pos} />
                  <span className="text-sm text-bureau-400">({posVotes.length})</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {posVotes.map((v) => (
                    <Link
                      key={v.id}
                      href={`/gouvernance/deputes/${v.deputeId}`}
                      className="flex items-center justify-between rounded px-2 py-1 text-sm text-bureau-300 hover:bg-bureau-700/20 hover:text-teal transition-colors"
                    >
                      <span>{v.depute.prenom} {v.depute.nom}</span>
                      <span className="text-xs text-bureau-500">{v.depute.groupeAbrev}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
