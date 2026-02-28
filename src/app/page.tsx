import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro } from "@/lib/format";

async function getStats() {
  const [deputes, senateurs, lobbyistes, declarations, musees, monuments, communes, departements, indicateurs, scrutins] = await Promise.all([
    prisma.depute.count(),
    prisma.senateur.count(),
    prisma.lobbyiste.count(),
    prisma.declarationInteret.count(),
    prisma.musee.count(),
    prisma.monument.count(),
    prisma.commune.count({ where: { typecom: "COM" } }),
    prisma.departement.count(),
    prisma.indicateur.count(),
    prisma.scrutin.count(),
  ]);

  const recentDeclarations = await prisma.declarationInteret.findMany({
    where: { typeMandat: { in: ["Député", "Sénateur"] }, totalParticipations: { gt: 0 } },
    orderBy: { totalParticipations: "desc" },
    take: 6,
  });

  return { deputes, senateurs, lobbyistes, declarations, musees, monuments, communes, departements, indicateurs, scrutins, recentDeclarations };
}

const SECTIONS = [
  {
    href: "/gouvernance",
    title: "Gouvernance",
    desc: "Députés, sénateurs, lobbyistes et déclarations d'intérêts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
    ),
    accent: "teal",
  },
  {
    href: "/economie",
    title: "Économie",
    desc: "PIB, chômage, créations d'entreprises — séries temporelles",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
    ),
    accent: "amber",
  },
  {
    href: "/territoire",
    title: "Territoire",
    desc: "Régions, départements, communes — maillage administratif",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="10" r="3" /><path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.3 11.8a1 1 0 0 0 1.4 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8z" /></svg>
    ),
    accent: "blue",
  },
  {
    href: "/patrimoine",
    title: "Patrimoine",
    desc: "Musées, monuments historiques — héritage culturel français",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" /></svg>
    ),
    accent: "rose",
  },
];

export default async function HomePage() {
  const stats = await getStats();

  return (
    <>
      {/* Hero */}
      <section className="grid-bg relative overflow-hidden border-b border-bureau-700/30">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="fade-up mb-4 inline-block rounded-full border border-teal/20 bg-teal/5 px-4 py-1 text-xs uppercase tracking-widest text-teal">
            Intelligence civique
          </div>
          <h1 className="fade-up delay-1 font-[family-name:var(--font-display)] text-5xl leading-tight text-bureau-100 sm:text-6xl">
            L&apos;Observatoire{" "}
            <span className="italic text-teal">Citoyen</span>
          </h1>
          <p className="fade-up delay-2 mx-auto mt-4 max-w-xl text-bureau-400">
            Explorez les données publiques françaises. Transparence, accessibilité, citoyenneté.
          </p>

          {/* Key stats */}
          <div className="fade-up delay-3 mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {[
              { v: stats.deputes, l: "Députés", c: "text-teal border-teal/20" },
              { v: stats.senateurs, l: "Sénateurs", c: "text-teal border-teal/20" },
              { v: stats.scrutins, l: "Scrutins", c: "text-blue border-blue/20" },
              { v: stats.monuments, l: "Monuments", c: "text-rose border-rose/20" },
            ].map((s) => (
              <div key={s.l} className={`rounded-xl border bg-bureau-800/40 px-4 py-4 ${s.c}`}>
                <p className="text-2xl font-bold tracking-tight sm:text-3xl">{fmt(s.v)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-bureau-400">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section cards */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
          Explorer les données
        </h2>
        <p className="mt-1 text-sm text-bureau-500">Quatre axes d&apos;analyse pour comprendre la France.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((s) => {
            const accentClass =
              s.accent === "teal" ? "group-hover:text-teal group-hover:bg-teal/10" :
              s.accent === "amber" ? "group-hover:text-amber group-hover:bg-amber/10" :
              s.accent === "blue" ? "group-hover:text-blue group-hover:bg-blue/10" :
              "group-hover:text-rose group-hover:bg-rose/10";
            return (
              <Link
                key={s.href}
                href={s.href}
                className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50"
              >
                <div className={`mb-4 inline-flex rounded-lg bg-bureau-700/30 p-2.5 text-bureau-400 transition-all ${accentClass}`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-medium text-bureau-100">{s.title}</h3>
                <p className="mt-1 text-sm text-bureau-500">{s.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent declarations with highest patrimoine */}
      {stats.recentDeclarations.length > 0 && (
        <section className="border-t border-bureau-700/30 bg-bureau-900/30">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
                  Déclarations d&apos;intérêts
                </h2>
                <p className="mt-1 text-sm text-bureau-500">Participations financières les plus élevées</p>
              </div>
              <Link href="/gouvernance" className="text-xs uppercase tracking-widest text-teal hover:underline">
                Voir tout &rarr;
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats.recentDeclarations.map((d) => (
                <div
                  key={d.id}
                  className="card-accent rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bureau-700/50 text-xs font-medium text-bureau-300">
                          {d.prenom[0]}{d.nom[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-bureau-100">
                            {d.civilite} {d.prenom} {d.nom}
                          </p>
                          <p className="text-xs text-bureau-500">{d.typeMandat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {d.totalParticipations != null && d.totalParticipations > 0 && (
                    <div className="mt-4 rounded-lg bg-amber/5 px-3 py-2">
                      <p className="text-xs text-bureau-500">Participations financières</p>
                      <p className="text-lg font-bold text-amber">{fmtEuro(d.totalParticipations)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vue d'ensemble */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-bureau-100">
          Vue d&apos;ensemble
        </h2>
        <p className="mt-1 text-sm text-bureau-500">Données agrégées sur l&apos;ensemble des sources publiques françaises.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {[
            { v: stats.deputes, l: "Députés" },
            { v: stats.senateurs, l: "Sénateurs" },
            { v: stats.lobbyistes, l: "Lobbyistes" },
            { v: stats.declarations, l: "Déclarations" },
            { v: stats.musees, l: "Musées" },
            { v: stats.monuments, l: "Monuments" },
            { v: stats.departements, l: "Départements" },
            { v: stats.communes, l: "Communes" },
            { v: stats.scrutins, l: "Scrutins" },
            { v: stats.indicateurs, l: "Indicateurs éco." },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 p-4">
              <p className="text-xl font-bold text-bureau-100">{fmt(s.v)}</p>
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
