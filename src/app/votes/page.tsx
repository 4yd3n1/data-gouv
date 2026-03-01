import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ScrutinResultBadge } from "@/components/scrutin-result-badge";

export const revalidate = 3600; // Revalidate every hour — new scrutins ingested periodically

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

const TAG_ORDER = [
  "budget", "fiscalite", "travail", "sante", "logement",
  "retraites", "ecologie", "education", "securite",
  "immigration", "agriculture", "defense", "culture",
];

// Accent colors cycling through teal / amber / rose / blue
const TAG_COLORS: Record<string, string> = {
  budget:     "border-amber/20  bg-amber/5  text-amber",
  fiscalite:  "border-amber/20  bg-amber/5  text-amber",
  sante:      "border-rose/20   bg-rose/5   text-rose",
  logement:   "border-teal/20   bg-teal/5   text-teal",
  retraites:  "border-amber/20  bg-amber/5  text-amber",
  education:  "border-blue-400/20 bg-blue-400/5 text-blue-400",
  securite:   "border-rose/20   bg-rose/5   text-rose",
  immigration: "border-bureau-600/30 bg-bureau-800/20 text-bureau-300",
  ecologie:   "border-teal/20   bg-teal/5   text-teal",
  travail:    "border-blue-400/20 bg-blue-400/5 text-blue-400",
  defense:    "border-bureau-600/30 bg-bureau-800/20 text-bureau-300",
  agriculture: "border-teal/20  bg-teal/5   text-teal",
  culture:    "border-rose/20   bg-rose/5   text-rose",
};

export default async function VotesPage() {
  const [tagCounts, totalScrutins, adoptedCount, recentScrutins] = await Promise.all([
    prisma.scrutinTag.groupBy({
      by: ["tag"],
      _count: { tag: true },
      orderBy: { _count: { tag: "desc" } },
    }),
    prisma.scrutin.count(),
    prisma.scrutin.count({
      where: { sortCode: { contains: "adopt", mode: "insensitive" } },
    }),
    prisma.scrutin.findMany({
      orderBy: { dateScrutin: "desc" },
      take: 8,
      include: { tags: { select: { tag: true } } },
    }),
  ]);

  const tagMap = Object.fromEntries(tagCounts.map((t) => [t.tag, t._count.tag]));
  const adoptionRate = totalScrutins > 0 ? Math.round((adoptedCount / totalScrutins) * 100) : 0;
  const taggedScrutins = tagCounts.reduce((s, t) => s + t._count.tag, 0);

  return (
    <>
      <PageHeader
        title="Votes parlementaires"
        subtitle="Scrutins de l'Assemblée nationale classés par thème — transparence des positions politiques"
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: "Votes" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6 py-10 space-y-12">

        {/* ── Overview stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Scrutins enregistrés", value: fmt(totalScrutins), color: "text-bureau-100" },
            { label: "Taux d'adoption", value: `${adoptionRate} %`, color: "text-teal" },
            { label: "Scrutins classifiés", value: fmt(taggedScrutins), color: "text-blue-400" },
            { label: "Thèmes couverts", value: fmt(tagCounts.length), color: "text-amber" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4"
            >
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.label}</p>
              <p className={`mt-1.5 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tag grid ── */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Par thème législatif
            </h2>
            <Link
              href="/votes/mon-depute"
              className="rounded-lg border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs text-teal transition-colors hover:bg-teal/10"
            >
              Trouver mon député &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TAG_ORDER.map((key) => {
              const count = tagMap[key] ?? 0;
              const colorClasses = TAG_COLORS[key] ?? "border-bureau-700/20 bg-bureau-800/20 text-bureau-300";
              return (
                <Link
                  key={key}
                  href={`/votes/par-sujet/${key}`}
                  className={`group rounded-xl border px-5 py-4 transition-all hover:scale-[1.01] ${colorClasses}`}
                >
                  <p className="text-sm font-medium">{TAG_LABELS[key]}</p>
                  <p className="mt-1.5 text-[11px] text-bureau-400">
                    {fmt(count)} scrutin{count > 1 ? "s" : ""}
                  </p>
                  <p className="mt-3 text-[10px] text-bureau-500 group-hover:text-bureau-400 transition-colors">
                    Voir les votes &rarr;
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Recent scrutins ── */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Scrutins récents
            </h2>
            <Link
              href="/gouvernance/scrutins"
              className="text-xs text-teal/70 transition-colors hover:text-teal"
            >
              Tous les scrutins &rarr;
            </Link>
          </div>

          <div className="grid gap-2">
            {recentScrutins.map((s, i) => (
              <Link
                key={s.id}
                href={`/gouvernance/scrutins/${s.id}`}
                className="card-accent group flex items-start gap-4 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-bureau-500">n°{s.numero}</span>
                    <span className="text-[10px] text-bureau-600">{fmtDate(s.dateScrutin)}</span>
                    <ScrutinResultBadge sortCode={s.sortCode} />
                    {s.tags.slice(0, 2).map((t) => (
                      <span
                        key={t.tag}
                        className="rounded-full bg-bureau-700/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-bureau-400"
                      >
                        {TAG_LABELS[t.tag] ?? t.tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-bureau-200 line-clamp-2 group-hover:text-bureau-100 transition-colors leading-relaxed">
                    {s.titre}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-medium text-teal">{s.pour}</p>
                  <p className="text-[10px] text-bureau-500">Pour</p>
                  <p className="mt-1 text-sm font-medium text-rose">{s.contre}</p>
                  <p className="text-[10px] text-bureau-500">Contre</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Mon député CTA ── */}
        <section className="rounded-2xl border border-teal/20 bg-teal/5 px-8 py-8">
          <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl text-bureau-100">
            Comment vote votre député&nbsp;?
          </h2>
          <p className="mb-6 text-sm text-bureau-400 max-w-xl">
            Recherchez votre député par nom et consultez l'ensemble de ses votes récents,
            répartis par thème législatif.
          </p>
          <Link
            href="/votes/mon-depute"
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-bureau-950 transition-opacity hover:opacity-90"
          >
            Trouver mon député
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </section>

      </div>
    </>
  );
}
