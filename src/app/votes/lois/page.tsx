import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { LoiCard } from "@/components/loi-card";

export const metadata: Metadata = {
  title: "Grandes lois · L'Observatoire Citoyen",
  description:
    "Les textes législatifs majeurs de l'Assemblée nationale depuis 2024 — résumés en clair, positions des partis, liste des scrutins liés.",
};

export const revalidate = 3600;

const TAG_LABELS: Record<string, string> = {
  budget: "Budget",
  fiscalite: "Fiscalité",
  sante: "Santé",
  logement: "Logement",
  securite: "Sécurité",
  immigration: "Immigration",
  ecologie: "Écologie",
  travail: "Emploi",
  agriculture: "Agriculture",
};

const TYPE_FILTER_LABELS: Record<string, string> = {
  all: "Tous",
  PLF: "Budget",
  PROJET_LOI: "Projets de loi",
  PROPOSITION_LOI: "Propositions de loi",
  MOTION_CENSURE: "Motions de censure",
};

export default async function LoisPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; tag?: string; type?: string }>;
}) {
  const { statut, tag, type } = await searchParams;

  const where: Record<string, unknown> = {};
  if (statut === "adopte") where.statut = "adopte";
  if (statut === "rejete") where.statut = "rejete";
  if (tag) where.tags = { has: tag };
  if (type && type !== "all") where.type = type;

  const lois = await prisma.loiParlementaire.findMany({
    where,
    orderBy: { rang: "asc" },
    include: {
      scrutins: {
        include: {
          scrutin: {
            select: { pour: true, contre: true, abstentions: true },
          },
        },
      },
    },
  });

  // Stat counts (unfiltered for summary cards)
  const [total, adoptes, rejetes] = await Promise.all([
    prisma.loiParlementaire.count(),
    prisma.loiParlementaire.count({ where: { statut: "adopte" } }),
    prisma.loiParlementaire.count({ where: { statut: "rejete" } }),
  ]);

  const activeTag = tag ?? "";
  const activeStatut = statut ?? "";
  const activeType = type ?? "all";

  function filterLink(params: { statut?: string; tag?: string; type?: string }) {
    const p = new URLSearchParams();
    if (params.statut) p.set("statut", params.statut);
    if (params.tag) p.set("tag", params.tag);
    if (params.type && params.type !== "all") p.set("type", params.type);
    const s = p.toString();
    return `/votes/lois${s ? `?${s}` : ""}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        title="Grandes lois"
        subtitle="Les textes législatifs majeurs adoptés ou rejetés par l'Assemblée nationale depuis octobre 2024 — résumés en clair, avec les positions des groupes politiques et les scrutins détaillés."
      />

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-4 text-center">
          <p className="text-2xl font-semibold text-bureau-100">{total}</p>
          <p className="mt-1 text-xs text-bureau-500">Textes référencés</p>
        </div>
        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 text-center">
          <p className="text-2xl font-semibold text-teal">{adoptes}</p>
          <p className="mt-1 text-xs text-teal/70">Adoptés</p>
        </div>
        <div className="rounded-xl border border-rose/20 bg-rose/5 p-4 text-center">
          <p className="text-2xl font-semibold text-rose">{rejetes}</p>
          <p className="mt-1 text-xs text-rose/70">Rejetés</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="mb-6 space-y-3">
        {/* Statut */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Tous", href: filterLink({ tag: activeTag || undefined, type: activeType }) },
            { label: "Adoptés", href: filterLink({ statut: "adopte", tag: activeTag || undefined, type: activeType }) },
            { label: "Rejetés", href: filterLink({ statut: "rejete", tag: activeTag || undefined, type: activeType }) },
          ].map(({ label, href }) => {
            const isActive =
              (label === "Tous" && !activeStatut) ||
              (label === "Adoptés" && activeStatut === "adopte") ||
              (label === "Rejetés" && activeStatut === "rejete");
            return (
              <Link
                key={label}
                href={href}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-teal text-bureau-950"
                    : "border border-bureau-700/40 text-bureau-400 hover:border-bureau-600/60 hover:text-bureau-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Type */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_FILTER_LABELS).map(([key, label]) => {
            const isActive = activeType === key;
            return (
              <Link
                key={key}
                href={filterLink({ statut: activeStatut || undefined, tag: activeTag || undefined, type: key })}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-bureau-700 text-bureau-100"
                    : "border border-bureau-700/40 text-bureau-500 hover:border-bureau-600/60 hover:text-bureau-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterLink({ statut: activeStatut || undefined, type: activeType })}
            className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
              !activeTag
                ? "bg-bureau-700 text-bureau-100"
                : "border border-bureau-700/40 text-bureau-500 hover:border-bureau-600/60 hover:text-bureau-300"
            }`}
          >
            Tous thèmes
          </Link>
          {Object.entries(TAG_LABELS).map(([key, label]) => {
            const isActive = activeTag === key;
            return (
              <Link
                key={key}
                href={filterLink({ statut: activeStatut || undefined, tag: key, type: activeType })}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-bureau-700 text-bureau-100"
                    : "border border-bureau-700/40 text-bureau-500 hover:border-bureau-600/60 hover:text-bureau-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Law cards */}
      {lois.length === 0 ? (
        <div className="rounded-xl border border-bureau-700/30 py-16 text-center">
          <p className="text-bureau-400">Aucun texte ne correspond à ces filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lois.map((loi) => {
            const voteFinalLink = loi.scrutins.find((sl) => sl.role === "VOTE_FINAL");
            const voteFinalScrutin = voteFinalLink?.scrutin;
            const roleCounts: Record<string, number> = {};
            for (const sl of loi.scrutins) {
              roleCounts[sl.role] = (roleCounts[sl.role] ?? 0) + 1;
            }
            return (
              <LoiCard
                key={loi.id}
                slug={loi.slug}
                titreCourt={loi.titreCourt}
                resumeSimple={loi.resumeSimple}
                type={loi.type}
                statut={loi.statut}
                dateVote={loi.dateVote}
                scrutinsCount={loi.scrutins.length}
                voteFinal={voteFinalScrutin ?? null}
                roleCounts={roleCounts}
              />
            );
          })}
        </div>
      )}

      {/* Note */}
      <p className="mt-10 text-center text-xs text-bureau-600">
        Données issues de l'Assemblée nationale · 17e législature (depuis octobre 2024) · Mise à jour périodique
      </p>
    </main>
  );
}
