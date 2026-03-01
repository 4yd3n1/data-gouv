import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";

const TAG_LABELS: Record<string, string> = {
  budget:     "Budget & Finances",
  fiscalite:  "Fiscalité",
  sante:      "Santé",
  logement:   "Logement",
  retraites:  "Retraites",
  education:  "Éducation",
  securite:   "Sécurité & Justice",
  immigration: "Immigration",
  ecologie:   "Écologie",
  travail:    "Emploi & Travail",
  defense:    "Défense",
  agriculture: "Agriculture",
  culture:    "Culture",
};

const VALID_TAGS = Object.keys(TAG_LABELS);
const PER_PAGE = 25;
export const revalidate = 3600; // Revalidate hourly — scrutins added periodically

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const label = TAG_LABELS[tag];
  if (!label) return { title: "Thème introuvable — L'Observatoire Citoyen" };
  return {
    title: `Votes — ${label} · L'Observatoire Citoyen`,
    description: `Scrutins parlementaires de l'Assemblée nationale sur le thème "${label}". Résultats, positions des groupes, transparence des votes.`,
  };
}

function GroupBar({ pour, contre, abstentions }: { pour: number; contre: number; abstentions: number }) {
  const total = pour + contre + abstentions;
  if (total === 0) return null;
  const pPct = (pour / total) * 100;
  const cPct = (contre / total) * 100;
  const aPct = (abstentions / total) * 100;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-bureau-700/40">
      <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
      <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
      <div className="bg-amber/40" style={{ width: `${aPct}%` }} />
    </div>
  );
}

export default async function VotesByTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { tag } = await params;
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10));

  if (!VALID_TAGS.includes(tag)) notFound();

  const label = TAG_LABELS[tag];

  const [total, adoptedCount, rejectedCount, scrutins] = await Promise.all([
    prisma.scrutin.count({ where: { tags: { some: { tag } } } }),
    prisma.scrutin.count({
      where: {
        tags: { some: { tag } },
        sortCode: { contains: "adopt", mode: "insensitive" },
      },
    }),
    prisma.scrutin.count({
      where: {
        tags: { some: { tag } },
        sortCode: { contains: "rejet", mode: "insensitive" },
      },
    }),
    prisma.scrutin.findMany({
      where: { tags: { some: { tag } } },
      orderBy: { dateScrutin: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        groupeVotes: { select: { pour: true, contre: true, abstentions: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <>
      <PageHeader
        title={label}
        subtitle={`Scrutins parlementaires — thème : ${label.toLowerCase()}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Votes", href: "/votes" },
          { label: label },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Scrutins</p>
            <p className="mt-1.5 text-2xl font-bold text-bureau-100">{fmt(total)}</p>
          </div>
          <div className="rounded-xl border border-teal/20 bg-teal/5 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Adoptés</p>
            <p className="mt-1.5 text-2xl font-bold text-teal">{fmt(adoptedCount)}</p>
          </div>
          <div className="rounded-xl border border-rose/20 bg-rose/5 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Rejetés</p>
            <p className="mt-1.5 text-2xl font-bold text-rose">{fmt(rejectedCount)}</p>
          </div>
          <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-bureau-500">Taux d&apos;adoption</p>
            <p className="mt-1.5 text-2xl font-bold text-amber">
              {total > 0 ? `${Math.round((adoptedCount / total) * 100)} %` : "—"}
            </p>
          </div>
        </div>

        {/* Scrutin list */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              {fmt(total)} scrutin{total > 1 ? "s" : ""}
              {total > PER_PAGE && ` · page ${page} / ${totalPages}`}
            </h2>
            <Link href="/votes" className="text-xs text-bureau-500 hover:text-teal transition-colors">
              &larr; Tous les thèmes
            </Link>
          </div>

          <div className="space-y-2">
            {scrutins.map((s, i) => {
              const totalPour = s.groupeVotes.reduce((a, g) => a + g.pour, 0);
              const totalContre = s.groupeVotes.reduce((a, g) => a + g.contre, 0);
              const totalAbst = s.groupeVotes.reduce((a, g) => a + g.abstentions, 0);

              return (
                <Link
                  key={s.id}
                  href={`/gouvernance/scrutins/${s.id}`}
                  className="card-accent group block rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-bureau-500">n°{s.numero}</span>
                        <span className="text-[10px] text-bureau-600">{fmtDate(s.dateScrutin)}</span>
                        <ScrutinResultBadge sortCode={s.sortCode} />
                      </div>
                      <p className="text-sm text-bureau-200 line-clamp-2 group-hover:text-bureau-100 transition-colors leading-relaxed">
                        {s.titre}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-sm font-medium text-teal">{fmt(totalPour)}</p>
                      <p className="text-[10px] text-bureau-500">Pour</p>
                      <p className="mt-1 text-sm font-medium text-rose">{fmt(totalContre)}</p>
                      <p className="text-[10px] text-bureau-500">Contre</p>
                    </div>
                  </div>
                  {(totalPour + totalContre + totalAbst) > 0 && (
                    <div className="mt-3">
                      <GroupBar pour={totalPour} contre={totalContre} abstentions={totalAbst} />
                      <div className="mt-1.5 flex gap-3 text-[10px] text-bureau-500">
                        <span className="text-teal">{fmt(totalPour)} pour</span>
                        <span className="text-rose">{fmt(totalContre)} contre</span>
                        <span>{fmt(totalAbst)} abstentions</span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl={`/votes/par-sujet/${tag}`}
              searchParams={{}}
            />
          )}
        </section>

        {/* Related tags */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Autres thèmes
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TAG_LABELS)
              .filter(([k]) => k !== tag)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/votes/par-sujet/${k}`}
                  className="rounded-full border border-bureau-700/30 bg-bureau-800/30 px-3 py-1 text-xs text-bureau-400 transition-colors hover:border-bureau-600/50 hover:text-bureau-200"
                >
                  {v}
                </Link>
              ))}
          </div>
        </section>

      </div>
    </>
  );
}
