import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { DeptLookup } from "@/components/dept-lookup";
import { SignalCard } from "@/components/signaux/signal-card";
import {
  getSignals,
  SIGNAL_TYPE_LABELS,
  type SignalType,
  type UnifiedSignal,
} from "@/lib/signals";

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

async function getHomeData() {
  const [recentScrutins, depts, signals] = await Promise.all([
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
        tags: { select: { tag: true }, take: 2 },
        lois: {
          take: 1,
          select: { loi: { select: { titreCourt: true, slug: true } } },
        },
      },
    }),
    prisma.departement.findMany({
      select: { code: true, libelle: true },
      orderBy: { code: "asc" },
    }),
    getSignals(),
  ]);

  return {
    recentScrutins,
    depts,
    leadSignal: signals[0] ?? null,
    topSignals: signals.slice(1, 7),
    totalSignals: signals.length,
    critiqueCount: signals.filter((s) => s.severity === "CRITIQUE").length,
    notableCount: signals.filter((s) => s.severity === "NOTABLE").length,
  };
}

/* ------------------------------------------------------------------ */
/*  Type styling                                                        */
/* ------------------------------------------------------------------ */

const TYPE_BADGE_STYLE: Record<SignalType, string> = {
  conflit: "border-rose/30 text-rose bg-rose/10",
  porte: "border-amber/30 text-amber bg-amber/10",
  lobby: "border-amber/30 text-amber bg-amber/10",
  media: "border-rose/30 text-rose bg-rose/10",
  ecart: "border-amber/30 text-amber bg-amber/10",
  dissidence: "border-teal/30 text-teal bg-teal/10",
};

/* ------------------------------------------------------------------ */
/*  Signal-du-jour hero                                                 */
/* ------------------------------------------------------------------ */

function SignalHero({ signal }: { signal: UnifiedSignal }) {
  const initials = `${signal.prenom[0] ?? ""}${signal.nom[0] ?? ""}`.toUpperCase();
  const lead = signal.narratives[0];
  const extras = signal.narratives.slice(1, 3);

  return (
    <section className="relative overflow-hidden border-b border-rose/20 bg-gradient-to-b from-rose/5 via-bureau-950 to-bureau-950">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.10),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose/40 bg-rose/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose animate-pulse" />
            Signal du jour
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-bureau-500">
            {fmtDate(new Date())}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          {/* Avatar tile */}
          <div className="flex shrink-0 items-start">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-rose/30 bg-rose/5 font-[family-name:var(--font-display)] text-3xl text-rose/90 sm:h-28 sm:w-28 sm:text-4xl">
              {initials}
            </div>
          </div>

          {/* Headline column */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight text-bureau-100 sm:text-4xl md:text-5xl">
                {signal.prenom} {signal.nom}
              </h1>
              <span className="text-sm text-bureau-400">· {signal.subtitle}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {signal.types.map((t) => (
                <span
                  key={t}
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${TYPE_BADGE_STYLE[t]}`}
                >
                  {SIGNAL_TYPE_LABELS[t]}
                </span>
              ))}
            </div>

            {lead && (
              <p className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-xl leading-snug text-bureau-100 sm:text-2xl">
                {lead.headline}
              </p>
            )}
            {lead?.detail && (
              <p className="mt-2 max-w-3xl text-sm text-bureau-400">{lead.detail}</p>
            )}

            {extras.length > 0 && (
              <ul className="mt-5 space-y-1.5 text-sm text-bureau-300">
                {extras.map((n, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-bureau-500" />
                    <span>
                      {n.headline}
                      {n.detail && (
                        <span className="text-bureau-500"> · {n.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={signal.href}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose/90 px-5 py-2 text-sm font-medium text-bureau-950 transition-colors hover:bg-rose"
              >
                Voir la fiche complète
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/signaux"
                className="text-xs uppercase tracking-widest text-bureau-400 transition-colors hover:text-bureau-200"
              >
                Tous les signaux →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Compact signal card (grid)                                          */
/* ------------------------------------------------------------------ */

function HomeSignalCard({ signal }: { signal: UnifiedSignal }) {
  const first = signal.narratives[0];
  return (
    <SignalCard severity={signal.severity}>
      <Link href={signal.href} className="group block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-bureau-100 group-hover:text-teal transition-colors">
              {signal.prenom} {signal.nom}
            </p>
            <p className="mt-0.5 text-xs text-bureau-500">{signal.subtitle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-1">
            {signal.types.slice(0, 2).map((t) => (
              <span
                key={t}
                className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${TYPE_BADGE_STYLE[t]}`}
              >
                {SIGNAL_TYPE_LABELS[t]}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-bureau-300 line-clamp-2">
          {first.headline}
        </p>
        {first.detail && (
          <p className="mt-1 text-[11px] text-bureau-500 line-clamp-1">
            {first.detail}
          </p>
        )}
      </Link>
    </SignalCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Entity rail                                                         */
/* ------------------------------------------------------------------ */

const ENTITY_RAIL = [
  { href: "/profils/deputes", label: "Députés", count: "2 101" },
  { href: "/profils/senateurs", label: "Sénateurs", count: "348" },
  { href: "/profils/ministres", label: "Ministres", count: "37" },
  { href: "/profils/lobbyistes", label: "Lobbyistes", count: "2 900+" },
  { href: "/votes", label: "Votes", count: "5 831" },
  { href: "/dossiers/bilan-macron", label: "Bilan Macron", count: "Dossier" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const {
    recentScrutins,
    depts,
    leadSignal,
    topSignals,
    totalSignals,
    critiqueCount,
    notableCount,
  } = await getHomeData();

  return (
    <>
      {/* ── Lead: Signal du jour (fallback to brand hero if no signal) ── */}
      {leadSignal ? (
        <SignalHero signal={leadSignal} />
      ) : (
        <section className="relative overflow-hidden border-b border-bureau-700/30">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <span className="inline-block rounded-full border border-teal/20 bg-teal/5 px-3 py-0.5 text-xs uppercase tracking-widest text-teal">
              Intelligence civique
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-bureau-100 sm:text-5xl">
              L&apos;Observatoire <span className="italic text-teal">Citoyen</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-bureau-400">
              Qui vous représente, comment votent-ils, qui les influence.
              Données publiques croisées, transparence mesurée.
            </p>
          </div>
        </section>
      )}

      {/* ── Entity rail ── */}
      <section className="border-b border-bureau-700/30 bg-bureau-900/30">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-sm">
          <span className="text-[10px] uppercase tracking-[0.18em] text-bureau-600">
            Explorer
          </span>
          {ENTITY_RAIL.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="group inline-flex items-baseline gap-1.5 text-bureau-400 transition-colors hover:text-bureau-100"
            >
              <span>{e.label}</span>
              <span className="text-[10px] tabular-nums text-bureau-600 group-hover:text-teal">
                {e.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Signaux croisés (secondary grid) ── */}
      {topSignals.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Autres signaux croisés
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                {fmt(totalSignals)} personnalités où les données publiques divergent ·{" "}
                <span className="text-rose">{critiqueCount} critique{critiqueCount > 1 ? "s" : ""}</span>
                {" · "}
                <span className="text-amber">{notableCount} notable{notableCount > 1 ? "s" : ""}</span>
              </p>
            </div>
            <Link
              href="/signaux"
              className="shrink-0 text-xs uppercase tracking-widest text-rose hover:underline"
            >
              Tous les signaux →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topSignals.map((s) => (
              <HomeSignalCard key={s.personKey} signal={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Derniers votes ── */}
      <section className="border-t border-bureau-700/30 bg-bureau-900/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Derniers votes
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Scrutins de l&apos;Assemblée nationale, classés par thème et par loi rattachée.
              </p>
            </div>
            <Link
              href="/votes"
              className="shrink-0 text-xs uppercase tracking-widest text-teal hover:underline"
            >
              Tous les votes →
            </Link>
          </div>

          <div className="divide-y divide-bureau-700/30 rounded-xl border border-bureau-700/30 overflow-hidden bg-bureau-800/10">
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
              const loi = s.lois[0]?.loi;

              return (
                <Link
                  key={s.id}
                  href={`/votes/scrutins/${s.id}`}
                  className="flex items-start gap-4 px-5 py-3.5 transition-colors hover:bg-bureau-800/40"
                >
                  <div className="min-w-0 flex-1">
                    {loi && (
                      <p className="mb-0.5 text-[10px] uppercase tracking-[0.15em] text-teal/80">
                        Loi · {loi.titreCourt}
                      </p>
                    )}
                    <p className="text-sm text-bureau-200 line-clamp-2">
                      {s.titre}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-1.5 w-40 overflow-hidden rounded-full bg-bureau-700/40">
                        <div className="bg-teal/70" style={{ width: `${pPct}%` }} />
                        <div className="bg-rose/70" style={{ width: `${cPct}%` }} />
                      </div>
                      <span className="text-[11px] tabular-nums text-bureau-500">
                        {fmt(s.pour)} pour · {fmt(s.contre)} contre
                      </span>
                      {s.tags.length > 0 && (
                        <span className="text-[10px] text-bureau-600">
                          {s.tags.map((t) => t.tag).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 pt-0.5">
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
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Votre territoire
            </h2>
            <p className="mt-1 text-sm text-bureau-400">
              Explorez les données de votre département — revenus, emploi, démographie.
            </p>
          </div>
          <Link
            href="/territoire"
            className="shrink-0 text-xs uppercase tracking-widest text-teal hover:underline"
          >
            Carte complète →
          </Link>
        </div>
        <div className="mt-6 max-w-md">
          <DeptLookup depts={depts} placeholder="Rechercher un département..." />
        </div>
      </section>
    </>
  );
}
