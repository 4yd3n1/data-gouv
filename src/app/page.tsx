import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtPct } from "@/lib/format";
import { DOSSIERS } from "@/lib/dossier-config";
import { DeptLookup } from "@/components/dept-lookup";
import { ConflictAlert } from "@/components/conflict-alert";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";

export const revalidate = 3600; // Homepage shows latest votes + conflict alerts — revalidate hourly

async function getHomeData() {
  const [
    deputes, elus, scrutins, monuments,
    recentScrutins, topConflicts,
    latestIpcObs, latestChomageObs,
    depts,
    deportCount, declarationWithPartCount,
  ] = await Promise.all([
    prisma.depute.count(),
    prisma.elu.count(),
    prisma.scrutin.count(),
    prisma.monument.count(),
    // 5 most recent votes with group breakdown
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
    // Top 3 conflict signals — pre-computed cross-reference of financial interests × votes
    // Empty array if compute-conflicts hasn't been run yet (falls back to empty section)
    prisma.conflictSignal.findMany({
      where: { voteCount: { gt: 0 } },
      orderBy: { participationCount: "desc" },
      take: 3,
    }),
    // Latest inflation index (13 months for YoY computation)
    prisma.indicateur.findFirst({
      where: { code: "IPC_MENSUEL" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 13 } },
    }),
    // Latest unemployment
    prisma.indicateur.findFirst({
      where: { code: "CHOMAGE_TAUX_TRIM" },
      include: { observations: { orderBy: { periodeDebut: "desc" }, take: 1 } },
    }),
    // Dept list for lookup
    prisma.departement.findMany({
      select: { code: true, libelle: true },
      orderBy: { code: "asc" },
    }),
    // Transparency metrics
    prisma.deport.count(),
    prisma.declarationInteret.count({
      where: { totalParticipations: { gt: 0 } },
    }),
  ]);

  return {
    deputes, elus, scrutins, monuments,
    recentScrutins, topConflicts,
    chomageVal: latestChomageObs?.observations[0]?.valeur ?? null,
    // Compute IPC year-over-year from index (13 months apart)
    ipcYoY: (() => {
      const obs = latestIpcObs?.observations ?? [];
      const current = obs[0]?.valeur;
      const lastYear = obs[12]?.valeur;
      if (current != null && lastYear != null && lastYear > 0) {
        return ((current / lastYear) - 1) * 100;
      }
      return null;
    })(),
    depts,
    deportCount,
    declarationWithPartCount,
  };
}

const colorAccent = {
  amber: "text-amber group-hover:border-amber/30",
  teal: "text-teal group-hover:border-teal/30",
  blue: "text-blue group-hover:border-blue/30",
  rose: "text-rose group-hover:border-rose/30",
};

export default async function HomePage() {
  const data = await getHomeData();
  const { chomageVal, ipcYoY } = data;

  const slides: HeroSlide[] = [
    // Emploi (DB)
    ...(chomageVal != null ? [{
      before: "Le taux de chômage atteint",
      value: fmtPct(chomageVal),
      after: "des actifs en France",
      color: "text-amber" as const,
    }] : []),
    // Pouvoir d'achat — IPC YoY computed from index (DB)
    ...(ipcYoY != null ? [{
      before: "L'inflation est à",
      value: `+${fmtPct(ipcYoY)}`,
      after: "sur un an",
      color: "text-rose" as const,
    }] : []),
    // SMIC — valeur légale fixée par décret (jan. 2025)
    {
      before: "Le SMIC brut est à",
      value: "11,88 €",
      after: "de l'heure",
      color: "text-teal",
    },
    // Dette — Banque de France, 2024
    {
      before: "La dette publique dépasse",
      value: "3 300 Md €",
      after: "soit plus de 113 % du PIB",
      color: "text-amber",
    },
    // Santé — source: Assurance Maladie / CNAM
    {
      before: "",
      value: "6 millions",
      after: "de Français n'ont pas de médecin traitant",
      color: "text-rose",
    },
    // Logement — source: Fondation Abbé Pierre 2024
    {
      before: "",
      value: "4 millions",
      after: "de mal-logés en France",
      color: "text-rose",
    },
    // Retraites
    {
      before: "Retraite légale repoussée à",
      value: "64 ans",
      after: "depuis la réforme Borne de 2023",
      color: "text-amber",
    },
    // Confiance démocratique
    ...(data.declarationWithPartCount > 0 ? [{
      before: "",
      value: fmt(data.declarationWithPartCount),
      after: "élus déclarent des participations financières à la HATVP",
      color: "text-amber" as const,
    }] : []),
    ...(data.deportCount > 0 ? [{
      before: "",
      value: fmt(data.deportCount),
      after: "déports parlementaires enregistrés à l'Assemblée",
      color: "text-teal" as const,
    }] : []),
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="grid-bg relative overflow-hidden border-b border-bureau-700/30">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="fade-up mb-4 inline-block rounded-full border border-teal/20 bg-teal/5 px-4 py-1 text-xs uppercase tracking-widest text-teal">
            Intelligence civique
          </div>

          <div className="fade-up delay-1">
            <HeroSlider slides={slides} />
          </div>

          <p className="fade-up delay-2 mx-auto mt-4 max-w-xl text-bureau-400">
            Données publiques croisées — gouvernance, économie, territoire. La transparence, c&apos;est maintenant.
          </p>

          <div className="fade-up delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dossiers"
              className="rounded-lg bg-teal/10 border border-teal/20 px-5 py-2.5 text-sm font-medium text-teal transition-all hover:bg-teal/20"
            >
              Dossiers thématiques →
            </Link>
            <Link
              href="/president"
              className="rounded-lg border border-amber/20 bg-amber/5 px-5 py-2.5 text-sm font-medium text-amber transition-all hover:bg-amber/10"
            >
              Profil Macron — Exemple →
            </Link>
            <Link
              href="/representants"
              className="rounded-lg border border-bureau-700/40 bg-bureau-800/40 px-5 py-2.5 text-sm text-bureau-300 transition-all hover:border-bureau-600/50 hover:text-bureau-100"
            >
              Représentants
            </Link>
          </div>

          {/* Quick KPIs */}
          <div className="fade-up delay-3 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {[
              { v: data.deputes, l: "Députés", c: "text-teal border-teal/20" },
              { v: data.elus, l: "Élus locaux", c: "text-blue border-blue/20" },
              { v: data.scrutins, l: "Scrutins parl.", c: "text-amber border-amber/20" },
              { v: data.monuments, l: "Monuments", c: "text-rose border-rose/20" },
            ].map((s) => (
              <div key={s.l} className={`rounded-xl border bg-bureau-800/40 px-4 py-4 ${s.c}`}>
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{fmt(s.v)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-bureau-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dossiers thématiques ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
              Dossiers thématiques
            </h2>
            <p className="mt-1 text-sm text-bureau-500">
              8 grandes questions citoyennes croisées avec les données publiques
            </p>
          </div>
          <Link href="/dossiers" className="text-xs uppercase tracking-widest text-teal hover:underline shrink-0">
            Voir tout →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DOSSIERS.map((d) => (
            <Link
              key={d.slug}
              href={`/dossiers/${d.slug}`}
              className={`card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5 transition-all hover:bg-bureau-800/50 ${colorAccent[d.color].split(" ")[1]}`}
            >
              <p className={`text-xs uppercase tracking-widest mb-2 ${colorAccent[d.color].split(" ")[0]}`}>
                Dossier
              </p>
              <h3 className="text-base font-medium text-bureau-100 group-hover:text-bureau-50">
                {d.label}
              </h3>
              <p className="mt-1 text-xs text-bureau-500 line-clamp-2">{d.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Derniers scrutins ── */}
      <section className="border-t border-bureau-700/30 bg-bureau-900/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Derniers votes au Parlement
              </h2>
              <p className="mt-1 text-sm text-bureau-500">Scrutins les plus récents à l&apos;Assemblée nationale</p>
            </div>
            <Link href="/gouvernance/scrutins" className="text-xs uppercase tracking-widest text-teal hover:underline shrink-0">
              Tous les votes →
            </Link>
          </div>

          <div className="divide-y divide-bureau-700/30 rounded-xl border border-bureau-700/30 overflow-hidden">
            {data.recentScrutins.map((s) => {
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
                  href={`/gouvernance/scrutins/${s.id}`}
                  className="flex items-center gap-4 bg-bureau-800/20 px-5 py-3.5 transition-colors hover:bg-bureau-800/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bureau-200 truncate">{s.titre}</p>
                    <div className="mt-1.5 flex h-1.5 w-40 overflow-hidden rounded-full bg-bureau-700/40">
                      <div className="bg-teal/60" style={{ width: `${pPct}%` }} />
                      <div className="bg-rose/60" style={{ width: `${cPct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-xs text-bureau-500">{date}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${sortColor}`}>
                      {s.sortCode}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Alertes transparence ── */}
      {data.topConflicts.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Alertes transparence
              </h2>
              <p className="mt-1 text-sm text-bureau-500">
                Élus ayant voté sur des textes dans des domaines où ils ont des participations financières déclarées
              </p>
            </div>
            <Link href="/dossiers/confiance-democratique" className="text-xs uppercase tracking-widest text-amber hover:underline shrink-0">
              Dossier confiance →
            </Link>
          </div>

          <div className="space-y-3">
            {data.topConflicts.map((signal) => (
              <ConflictAlert
                key={signal.id}
                deputyName={`${signal.prenom} ${signal.nom}`}
                sector={signal.secteurDeclaration}
                participationTotal={signal.totalMontant ?? 0}
                relatedVoteCount={signal.voteCount}
                votePour={signal.votePour}
                voteContre={signal.voteContre}
                typeMandat={signal.typeMandat}
                href={signal.deputeId ? `/representants/deputes/${signal.deputeId}?tab=transparence` : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Votre territoire ── */}
      <section className="border-t border-bureau-700/30 bg-bureau-900/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                Votre territoire
              </h2>
              <p className="mt-2 text-sm text-bureau-400">
                Élus locaux, budget communal, statistiques locales — explorez les données de votre département.
              </p>
              <div className="mt-6 max-w-sm space-y-3">
                <DeptLookup
                  depts={data.depts}
                  placeholder="Rechercher un département..."
                />
                <Link
                  href="/mon-territoire"
                  className="flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm text-teal transition-all hover:bg-teal/10"
                >
                  <span className="flex-1">Tableau de bord par code postal</span>
                  <span className="text-teal/60">→</span>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/territoire", label: "Régions & Départements", stat: "101", sub: "départements" },
                { href: "/representants/elus", label: "Élus locaux", stat: fmt(data.elus), sub: "élus recensés" },
                { href: "/patrimoine/monuments", label: "Monuments historiques", stat: fmt(data.monuments), sub: "monuments" },
                { href: "/territoire", label: "Communes", stat: "36K+", sub: "communes" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4 transition-all hover:bg-bureau-800/40"
                >
                  <p className="text-xl font-bold text-bureau-100">{item.stat}</p>
                  <p className="text-[10px] uppercase tracking-widest text-bureau-500">{item.sub}</p>
                  <p className="mt-2 text-xs text-bureau-400 group-hover:text-bureau-300 transition-colors">
                    {item.label} →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
