import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Avatar } from "@/components/avatar";
import { VoteBadge } from "@/components/vote-badge";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";
import { TAG_LABELS } from "@/lib/vote-tags";

const POSITION_COLORS: Record<string, string> = {
  pour:      "text-teal",
  contre:    "text-rose",
  abstention: "text-amber",
  nonVotant: "text-bureau-500",
};

async function DeputeResults({ q, id }: { q: string; id?: string }) {
  // ── State 3: specific deputy selected ──
  if (id) {
    const [depute, recentVotes, tagBreakdown] = await Promise.all([
      prisma.depute.findUnique({ where: { id }, include: { departement: true } }),
      prisma.voteRecord.findMany({
        where: { deputeId: id },
        include: { scrutin: { include: { tags: { select: { tag: true } } } } },
        orderBy: { scrutin: { dateScrutin: "desc" } },
        take: 20,
      }),
      prisma.scrutinTag.groupBy({
        by: ["tag"],
        where: { scrutin: { votes: { some: { deputeId: id } } } },
        _count: { tag: true },
        orderBy: { _count: { tag: "desc" } },
      }),
    ]);

    if (!depute) {
      return <p className="py-8 text-center text-sm text-bureau-500 italic">Député introuvable.</p>;
    }

    const maxTagCount = tagBreakdown[0]?._count.tag ?? 1;

    // Position breakdown
    const positions = recentVotes.reduce<Record<string, number>>(
      (acc, v) => { acc[v.position] = (acc[v.position] ?? 0) + 1; return acc; },
      {}
    );

    return (
      <div className="space-y-8 fade-up">
        {/* Deputy card */}
        <div className="flex items-start gap-5 rounded-2xl border border-teal/20 bg-teal/5 px-6 py-5">
          <Avatar
            src={depute.photoUrl}
            initials={`${depute.prenom[0]}${depute.nom[0]}`}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-medium text-bureau-100">
              {depute.civilite} {depute.prenom} {depute.nom}
            </p>
            <p className="mt-0.5 text-sm text-bureau-400">
              {depute.groupe} &middot; {depute.departementNom} ({depute.departementCode})
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              {depute.scoreParticipation !== null && (
                <span className="text-bureau-400">
                  Participation&nbsp;
                  <span className="font-medium text-teal">{depute.scoreParticipation}%</span>
                </span>
              )}
              {depute.scoreLoyaute !== null && (
                <span className="text-bureau-400">
                  Loyauté&nbsp;
                  <span className="font-medium text-amber">{depute.scoreLoyaute}%</span>
                </span>
              )}
              <span className="text-bureau-400">
                {fmt(recentVotes.length)} votes récents analysés
              </span>
            </div>
          </div>
          <Link
            href={`/profils/deputes/${depute.id}?tab=transparence`}
            className="shrink-0 rounded-lg border border-bureau-600/30 px-3 py-1.5 text-xs text-bureau-400 transition-colors hover:border-teal/30 hover:text-teal"
          >
            Profil complet &rarr;
          </Link>
        </div>

        {/* Position summary */}
        {recentVotes.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Positions sur les {fmt(recentVotes.length)} derniers scrutins
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["pour", "contre", "abstention", "nonVotant"] as const).map((pos) => {
                const count = positions[pos] ?? 0;
                const pct = recentVotes.length > 0 ? Math.round((count / recentVotes.length) * 100) : 0;
                return (
                  <div key={pos} className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-4 py-3">
                    <VoteBadge position={pos} />
                    <p className={`mt-2 text-xl font-bold tabular-nums ${POSITION_COLORS[pos] ?? "text-bureau-200"}`}>
                      {fmt(count)}
                    </p>
                    <p className="text-[10px] text-bureau-500">{pct}% des votes</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tag breakdown */}
        {tagBreakdown.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Votes par thème législatif
            </h2>
            <div className="space-y-2 overflow-hidden rounded-xl border border-bureau-700/20">
              {tagBreakdown.map((t) => (
                <Link
                  key={t.tag}
                  href={`/votes/par-sujet/${t.tag}`}
                  className="flex items-center gap-4 bg-bureau-800/10 px-4 py-2.5 transition-colors hover:bg-bureau-800/30"
                >
                  <span className="w-44 shrink-0 text-sm text-bureau-300">
                    {TAG_LABELS[t.tag] ?? t.tag}
                  </span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-bureau-700/40">
                    <div
                      className="h-full rounded-full bg-teal/50"
                      style={{ width: `${Math.min(100, (t._count.tag / maxTagCount) * 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-bureau-400">
                    {fmt(t._count.tag)} scrutin{t._count.tag > 1 ? "s" : ""}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent votes */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Votes récents
          </h2>
          <div className="space-y-2">
            {recentVotes.map((v, i) => (
              <Link
                key={v.id}
                href={`/votes/scrutins/${v.scrutinId}`}
                className="group flex items-start gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-3.5 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <VoteBadge position={v.position} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-bureau-200 leading-snug line-clamp-2 group-hover:text-bureau-100 transition-colors">
                    {v.scrutin.titre}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-bureau-500">
                    <span>{fmtDate(v.scrutin.dateScrutin)}</span>
                    <ScrutinResultBadge sortCode={v.scrutin.sortCode} />
                    {v.scrutin.tags.slice(0, 2).map((t) => (
                      <span key={t.tag} className="rounded-full bg-bureau-700/30 px-1.5 py-0.5 uppercase tracking-wider">
                        {TAG_LABELS[t.tag] ?? t.tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── State 2: search results ──
  if (q.trim().length >= 2) {
    const deputes = await prisma.depute.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { prenom: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
      take: 20,
      include: { departement: true },
    });

    if (deputes.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-bureau-500 italic">
          Aucun député trouvé pour &laquo;&nbsp;{q}&nbsp;&raquo;.
        </p>
      );
    }

    return (
      <div className="fade-up">
        <p className="mb-4 text-xs text-bureau-500">
          {fmt(deputes.length)} résultat{deputes.length > 1 ? "s" : ""} pour &laquo;&nbsp;{q}&nbsp;&raquo;
        </p>
        <div className="space-y-2">
          {deputes.map((d) => (
            <Link
              key={d.id}
              href={`/votes/mon-depute?id=${d.id}`}
              className="group flex items-center gap-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-3.5 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
            >
              <Avatar
                src={d.photoUrl}
                initials={`${d.prenom[0]}${d.nom[0]}`}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-bureau-200 group-hover:text-bureau-100 transition-colors">
                  {d.civilite} {d.prenom} {d.nom}
                </p>
                <p className="text-xs text-bureau-500">
                  {d.groupe} &middot; {d.departementNom}
                </p>
              </div>
              {!d.actif && (
                <span className="shrink-0 rounded-full bg-bureau-700/40 px-2 py-0.5 text-[10px] text-bureau-500">
                  Ancien
                </span>
              )}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-bureau-600 group-hover:text-teal transition-colors"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── State 1: empty prompt ──
  return (
    <div className="py-12 text-center fade-up">
      <div className="mb-4 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-bureau-700/30 bg-bureau-800/30">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-bureau-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-bureau-400">
        Entrez le nom d&apos;un député pour voir ses votes récents.
      </p>
      <p className="mt-1 text-xs text-bureau-600">
        Ex&nbsp;: &laquo;&nbsp;Macron&nbsp;&raquo;, &laquo;&nbsp;Le Pen&nbsp;&raquo;, &laquo;&nbsp;Mélenchon&nbsp;&raquo;
      </p>
    </div>
  );
}

export default async function MonDeputePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { q = "", id } = await searchParams;

  return (
    <>
      <PageHeader
        title="Mon député"
        subtitle="Recherchez un député et consultez l'intégralité de ses votes par thème législatif"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Votes", href: "/votes" },
          { label: "Mon député" },
        ]}
      />

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">

        {!id && (
          <Suspense>
            <SearchInput placeholder="Nom ou prénom d'un député..." />
          </Suspense>
        )}

        {id && (
          <div className="flex items-center gap-3">
            <Link
              href="/votes/mon-depute"
              className="flex items-center gap-1.5 text-xs text-bureau-500 transition-colors hover:text-teal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Nouvelle recherche
            </Link>
          </div>
        )}

        <Suspense fallback={<div className="animate-pulse py-4 text-sm text-bureau-600">Chargement...</div>}>
          <DeputeResults q={q} id={id} />
        </Suspense>

      </div>
    </>
  );
}
