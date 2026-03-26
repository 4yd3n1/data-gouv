import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro } from "@/lib/format";
import { DeptLookup } from "@/components/dept-lookup";
import { SignalCard } from "@/components/signaux/signal-card";
import { conflictSeverity, type SignalSeverity } from "@/lib/signal-types";

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

interface HomeSignal {
  severity: SignalSeverity;
  type: string;
  title: string;
  subtitle: string;
  detail: string;
  href: string;
}

async function getHomeData() {
  const [recentScrutins, topConflicts, mediaNexus, depts, signalCounts] =
    await Promise.all([
      prisma.scrutin.findMany({
        orderBy: { dateScrutin: "desc" },
        take: 5,
        select: {
          id: true,
          titre: true,
          dateScrutin: true,
          sortCode: true,
          pour: true,
          contre: true,
          abstentions: true,
        },
      }),
      prisma.conflictSignal.findMany({
        where: { voteCount: { gt: 0 } },
        orderBy: [{ participationCount: "desc" }, { voteCount: "desc" }],
        take: 4,
      }),
      prisma.mediaProprietaire.findMany({
        where: { contextePolitique: { not: null } },
        select: {
          id: true,
          nom: true,
          prenom: true,
          contextePolitique: true,
          participations: {
            select: { groupe: { select: { nomCourt: true } } },
          },
        },
        take: 2,
      }),
      prisma.departement.findMany({
        select: { code: true, libelle: true },
        orderBy: { code: "asc" },
      }),
      // Quick counts for the signal bar
      Promise.all([
        prisma.conflictSignal.count({ where: { voteCount: { gt: 0 } } }),
        prisma.mediaProprietaire.count({
          where: { contextePolitique: { not: null } },
        }),
      ]),
    ]);

  // Build inline signal cards
  const signals: HomeSignal[] = [];

  for (const c of topConflicts) {
    const sev = conflictSeverity(c.totalMontant, c.voteCount);
    signals.push({
      severity: sev,
      type: "Conflit d'intérêts",
      title: `${c.prenom} ${c.nom}`,
      subtitle: `${c.typeMandat} · ${c.tag}`,
      detail:
        c.totalMontant && c.totalMontant > 0
          ? `${c.participationCount} participation${c.participationCount > 1 ? "s" : ""} · ${fmtEuro(c.totalMontant)} · ${c.voteCount} vote${c.voteCount > 1 ? "s" : ""}`
          : `${c.participationCount} participation${c.participationCount > 1 ? "s" : ""} · ${c.voteCount} vote${c.voteCount > 1 ? "s" : ""}`,
      href: c.deputeId
        ? `/representants/deputes/${c.deputeId}?tab=transparence`
        : `/representants/deputes`,
    });
  }

  for (const m of mediaNexus) {
    const groups = m.participations
      .map((p) => p.groupe.nomCourt)
      .slice(0, 3)
      .join(", ");
    signals.push({
      severity: "NOTABLE" as SignalSeverity,
      type: "Nexus médias-politique",
      title: `${m.prenom ?? ""} ${m.nom}`.trim(),
      subtitle: groups,
      detail: m.contextePolitique ?? "",
      href: "/dossiers/medias",
    });
  }

  return {
    recentScrutins,
    signals: signals.slice(0, 6),
    depts,
    totalSignals: signalCounts[0] + signalCounts[1],
  };
}

/* ------------------------------------------------------------------ */
/*  Entity pills                                                        */
/* ------------------------------------------------------------------ */

const ENTITY_PILLS = [
  { href: "/representants/deputes", label: "Députés" },
  { href: "/representants/senateurs", label: "Sénateurs" },
  { href: "/gouvernement", label: "Ministres" },
  { href: "/representants/lobbyistes", label: "Lobbyistes" },
  { href: "/votes", label: "Votes" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const { recentScrutins, signals, depts, totalSignals } =
    await getHomeData();

  return (
    <>
      {/* ── Search-first hero ── */}
      <section className="grid-bg sigint-section relative overflow-hidden border-b border-bureau-700/30">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="fade-up mb-3">
            <span className="classification-badge">Intelligence civique</span>
          </div>

          <h1 className="fade-up delay-1 font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
            L&apos;Observatoire <span className="italic text-teal">Citoyen</span>
          </h1>

          <p className="fade-up delay-2 mx-auto mt-4 max-w-lg text-bureau-400">
            Qui vous représente, comment votent-ils, qui les influence.
            Données publiques croisées, transparence mesurée.
          </p>

          {/* Giant search */}
          <div className="fade-up delay-2 mx-auto mt-8 max-w-xl">
            <form action="/recherche" method="get" className="relative">
              <svg
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bureau-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                name="q"
                placeholder="Chercher un élu, un vote, un territoire..."
                className="w-full rounded-xl border border-bureau-700/50 bg-bureau-800/60 py-4 pl-12 pr-4 text-base text-bureau-100 placeholder-bureau-500 focus:outline-none focus:border-teal/40 search-glow transition-colors"
              />
            </form>
          </div>

          {/* Entity pills */}
          <div className="fade-up delay-3 mt-5 flex flex-wrap items-center justify-center gap-2">
            {ENTITY_PILLS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-full border border-bureau-700/40 bg-bureau-800/40 px-4 py-1.5 text-xs text-bureau-400 transition-all hover:border-teal/20 hover:text-bureau-200"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signaux d'alerte ── */}
      {signals.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="live-dot" />
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                  Signaux d&apos;alerte
                </h2>
                <p className="mt-0.5 text-sm text-bureau-500">
                  {fmt(totalSignals)} anomalies détectées par croisement des données publiques
                </p>
              </div>
            </div>
            <Link
              href="/signaux"
              className="text-xs uppercase tracking-widest text-rose hover:underline shrink-0"
            >
              Tous les signaux →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map((s, i) => (
              <SignalCard key={i} severity={s.severity} label={s.type}>
                <Link href={s.href} className="group block">
                  <p className="text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-xs text-bureau-500">{s.subtitle}</p>
                  <p className="mt-2 text-xs text-bureau-400 line-clamp-2">
                    {s.detail}
                  </p>
                </Link>
              </SignalCard>
            ))}
          </div>
        </section>
      )}

      {/* ── Derniers votes ── */}
      <section className="border-t border-bureau-700/30 bg-bureau-900/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Derniers votes
            </h2>
            <Link
              href="/votes"
              className="text-xs uppercase tracking-widest text-teal hover:underline shrink-0"
            >
              Tous les votes →
            </Link>
          </div>

          <div className="divide-y divide-bureau-700/30 rounded-xl border border-bureau-700/30 overflow-hidden">
            {recentScrutins.map((s) => {
              const sortColor =
                s.sortCode.toLowerCase() === "adopté"
                  ? "text-teal border-teal/30 bg-teal/10"
                  : s.sortCode.toLowerCase() === "rejeté"
                    ? "text-rose border-rose/30 bg-rose/10"
                    : "text-bureau-400 border-bureau-600/30 bg-bureau-700/30";
              const date = new Date(s.dateScrutin).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              });
              const total = s.pour + s.contre + s.abstentions;
              const pPct = total > 0 ? (s.pour / total) * 100 : 0;
              const cPct = total > 0 ? (s.contre / total) * 100 : 0;

              return (
                <Link
                  key={s.id}
                  href={`/representants/scrutins/${s.id}`}
                  className="flex items-center gap-4 bg-bureau-800/20 px-5 py-3.5 transition-colors hover:bg-bureau-800/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bureau-200 truncate">
                      {s.titre}
                    </p>
                    <div className="mt-1.5 flex h-1.5 w-40 overflow-hidden rounded-full bg-bureau-700/40">
                      <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
                      <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-xs text-bureau-500">{date}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${sortColor}`}
                    >
                      {s.sortCode}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Votre territoire ── */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100 mb-2">
          Votre territoire
        </h2>
        <p className="text-sm text-bureau-400 mb-6">
          Explorez les données de votre département — revenus, emploi, démographie.
        </p>
        <div className="max-w-sm">
          <DeptLookup depts={depts} placeholder="Rechercher un département..." />
        </div>
      </section>
    </>
  );
}
