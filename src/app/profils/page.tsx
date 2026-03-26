import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export const revalidate = 86400;

export const metadata = {
  title: "Profils — L'Observatoire Citoyen",
  description:
    "Députés, sénateurs, ministres, lobbyistes, élus locaux et partis politiques — tous les acteurs de la vie publique française.",
};

export default async function ProfilsPage() {
  const [
    deputes,
    deputesActifs,
    senateurs,
    senateursActifs,
    gouvernementActifs,
    lobbyistes,
    actions,
    elus,
    maires,
    partis,
  ] = await Promise.all([
    prisma.depute.count(),
    prisma.depute.count({ where: { actif: true } }),
    prisma.senateur.count(),
    prisma.senateur.count({ where: { actif: true } }),
    prisma.mandatGouvernemental.count({ where: { dateFin: null } }),
    prisma.lobbyiste.count(),
    prisma.actionLobbyiste.count(),
    prisma.elu.count(),
    prisma.elu.count({ where: { typeMandat: "maire" } }),
    prisma.partiPolitique.count({ where: { exercice: 2024 } }),
  ]);

  const sections = [
    {
      href: "/profils/ministres",
      title: "Gouvernement",
      stat: gouvernementActifs,
      sub: "membres en exercice",
      desc: "Parcours, déclarations HATVP, lobbying et activité parlementaire",
      accent: "rose" as const,
    },
    {
      href: "/profils/deputes",
      title: "Députés",
      stat: deputes,
      sub: `${deputesActifs} actifs`,
      desc: "Assemblée nationale — participation, loyauté, votes et déclarations",
      accent: "teal" as const,
    },
    {
      href: "/profils/senateurs",
      title: "Sénateurs",
      stat: senateurs,
      sub: `${senateursActifs} en mandat`,
      desc: "Sénat — mandats, commissions, groupes politiques",
      accent: "teal" as const,
    },
    {
      href: "/profils/lobbyistes",
      title: "Représentants d'intérêts",
      stat: lobbyistes,
      sub: `${fmt(actions)} actions`,
      desc: "Registre HATVP — organisations et actions de représentation",
      accent: "amber" as const,
    },
    {
      href: "/profils/elus",
      title: "Élus locaux",
      stat: elus,
      sub: `${fmt(maires)} maires`,
      desc: "Maires, conseillers départementaux et régionaux",
      accent: "blue" as const,
    },
    {
      href: "/profils/partis",
      title: "Partis politiques",
      stat: partis,
      sub: "comptes financiers 2024",
      desc: "CNCCFP — recettes, dépenses, aide publique, dons",
      accent: "amber" as const,
    },
  ];

  const accentColors = {
    teal: "text-teal",
    amber: "text-amber",
    blue: "text-blue",
    rose: "text-rose",
  };

  return (
    <>
      <PageHeader
        title="Profils"
        subtitle={`${fmt(gouvernementActifs)} ministres · ${fmt(deputes + senateurs)} parlementaires · ${fmt(elus)} élus locaux · ${fmt(lobbyistes)} lobbyistes`}
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Profils" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50"
            >
              <p className={`text-3xl font-bold ${accentColors[s.accent]}`}>
                {fmt(s.stat)}
              </p>
              <p className="text-xs text-bureau-500">{s.sub}</p>
              <h3 className="mt-3 text-lg font-medium text-bureau-100 group-hover:text-teal transition-colors">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-bureau-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
