import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt } from "@/lib/format";
import { PageHeader } from "@/components/page-header";

export const revalidate = 86400; // Revalidate every 24h — representative data changes on ingestion only

export default async function GouvernancePage() {
  const [deputes, senateurs, lobbyistes, declarations, actions, scrutins, voteRecords, elus, partis] = await Promise.all([
    prisma.depute.count(),
    prisma.senateur.count(),
    prisma.lobbyiste.count(),
    prisma.declarationInteret.count(),
    prisma.actionLobbyiste.count(),
    prisma.scrutin.count(),
    prisma.voteRecord.count(),
    prisma.elu.count(),
    prisma.partiPolitique.count({ where: { exercice: 2024 } }),
  ]);

  const deputesActifs = await prisma.depute.count({ where: { actif: true } });
  const senateursActifs = await prisma.senateur.count({ where: { actif: true } });
  const maires = await prisma.elu.count({ where: { typeMandat: "maire" } });

  const sections = [
    {
      href: "/president",
      title: "Président de la République",
      stat: null as number | null,
      sub: "Emmanuel Macron · en fonction depuis 2017",
      desc: "Promesses vs réalité, bilan économique, lobbying, déclarations HATVP — le dossier phare",
      accent: "amber" as const,
    },
    {
      href: "/representants/deputes",
      title: "Députés",
      stat: deputes,
      sub: `${deputesActifs} actifs`,
      desc: "Assemblée nationale — scores de participation, loyauté et spécialisation",
      accent: "teal" as const,
    },
    {
      href: "/representants/senateurs",
      title: "Sénateurs",
      stat: senateurs,
      sub: `${senateursActifs} en mandat`,
      desc: "Sénat — mandats, commissions, groupes politiques",
      accent: "teal" as const,
    },
    {
      href: "/representants/elus",
      title: "Élus locaux",
      stat: elus,
      sub: `${fmt(maires)} maires`,
      desc: "Répertoire national — maires, conseillers départementaux, régionaux",
      accent: "blue" as const,
    },
    {
      href: "/representants/lobbyistes",
      title: "Représentants d'intérêts",
      stat: lobbyistes,
      sub: `${fmt(actions)} actions`,
      desc: "Registre HATVP — organisations, actions de représentation",
      accent: "amber" as const,
    },
    {
      href: "/gouvernance/scrutins",
      title: "Scrutins",
      stat: scrutins,
      sub: `${fmt(voteRecords)} votes individuels`,
      desc: "Votes parlementaires — comment chaque député a voté sur chaque texte",
      accent: "teal" as const,
    },
    {
      href: "/representants/partis",
      title: "Partis politiques",
      stat: partis,
      sub: "comptes financiers",
      desc: "CNCCFP — recettes, dépenses, aide publique, dons, emprunts",
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
        title="Gouvernance"
        subtitle={`${fmt(deputes + senateurs)} parlementaires · ${fmt(elus)} élus locaux · ${fmt(lobbyistes)} représentants d'intérêts · ${fmt(declarations)} déclarations`}
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Gouvernance" }]}
      />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card-accent group rounded-xl border border-bureau-700/30 bg-bureau-800/30 p-6 transition-all hover:border-bureau-600/50 hover:bg-bureau-800/50"
            >
              <p className={`text-3xl font-bold ${accentColors[s.accent]}`}>{s.stat !== null ? fmt(s.stat) : "2017–"}</p>
              <p className="text-xs text-bureau-500">{s.sub}</p>
              <h3 className="mt-3 text-lg font-medium text-bureau-100 group-hover:text-teal transition-colors">{s.title}</h3>
              <p className="mt-1 text-sm text-bureau-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
