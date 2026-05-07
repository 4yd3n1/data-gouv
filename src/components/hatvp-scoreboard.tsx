import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";

interface ScoreboardData {
  totalDeclarations: number;
  totalPersonnalites: number;
  conflitsAlertes: number;
  modifsRecentes: number;
}

async function getScoreboard(): Promise<ScoreboardData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalDeclarations, totalPersonnalites, conflitsAlertes, modifsRecentes] =
    await Promise.all([
      prisma.declarationInteret.count(),
      prisma.personnalitePublique.count({
        where: { hatvpDossierId: { not: null } },
      }),
      prisma.interetDeclare.count({ where: { alerteConflit: true } }),
      prisma.interetDeclare.count({
        where: { dateDeclaration: { gte: thirtyDaysAgo } },
      }),
    ]);
  return { totalDeclarations, totalPersonnalites, conflitsAlertes, modifsRecentes };
}

/**
 * Below-fold HATVP transparency scoreboard — totals filed, personnalités
 * tracked, recent activity, and potential conflicts. Below-fold by design
 * (homepage above-fold is reserved for the 4 control-room sections).
 */
export async function HatvpScoreboard() {
  const data = await getScoreboard();

  const tiles = [
    {
      label: "Déclarations en ligne",
      value: data.totalDeclarations,
      hint: "Source : registre public HATVP.",
    },
    {
      label: "Personnalités tracées",
      value: data.totalPersonnalites,
      hint: "Avec dossier HATVP référencé.",
    },
    {
      label: "Modifications récentes",
      value: data.modifsRecentes,
      hint: "Sur les 30 derniers jours.",
    },
    {
      label: "Conflits potentiels",
      value: data.conflitsAlertes,
      hint: "Alertes croisées HATVP × votes.",
    },
  ];

  return (
    <section
      style={{ padding: "0 40px 32px" }}
      aria-labelledby="transparence-hatvp"
    >
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2
          id="transparence-hatvp"
          className="obs-mono text-[11px] uppercase tracking-[0.14em] text-fg-mute"
        >
          Transparence HATVP
        </h2>
        <Link
          href="/methodologie"
          className="text-[11px] text-fg-mute hover:text-fg"
        >
          Méthodologie →
        </Link>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <li
            key={t.label}
            className="rounded border border-fg-faint/20 bg-ink-1/30 p-4"
          >
            <p className="font-[family-name:var(--font-display)] text-3xl tabular-nums text-fg">
              {fmt(t.value)}
            </p>
            <p className="mt-1 text-[12px] text-fg-mute">{t.label}</p>
            <p className="mt-1 text-[11px] italic text-fg-faint">{t.hint}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
