import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { TypeMandat } from "@prisma/client";

export const revalidate = 3600;

export const metadata = {
  title: "Gouvernement — Intelligence Bureau",
  description:
    "Composition du gouvernement français : fiches individuelles, déclarations d'intérêts, carrières et lobbying.",
};

const TYPE_ORDER: TypeMandat[] = [
  TypeMandat.PRESIDENT,
  TypeMandat.PREMIER_MINISTRE,
  TypeMandat.MINISTRE,
  TypeMandat.MINISTRE_DELEGUE,
  TypeMandat.SECRETAIRE_ETAT,
];

const TYPE_LABEL: Record<TypeMandat, string> = {
  PRESIDENT: "Président de la République",
  PREMIER_MINISTRE: "Premier ministre",
  MINISTRE: "Ministre",
  MINISTRE_DELEGUE: "Ministre délégué",
  SECRETAIRE_ETAT: "Secrétaire d'État",
};

export default async function GouvernementPage() {
  // Fetch all personnalités with their current mandate (dateFin = null)
  const personnalites = await prisma.personnalitePublique.findMany({
    include: {
      mandats: {
        where: { dateFin: null },
        orderBy: { rang: "asc" },
        take: 1,
      },
    },
    orderBy: { nom: "asc" },
  });

  // Sort by rang of current mandate
  const sorted = personnalites
    .filter((p) => p.mandats.length > 0)
    .sort((a, b) => (a.mandats[0].rang ?? 999) - (b.mandats[0].rang ?? 999));

  // Group by type
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABEL[type],
    members: sorted.filter((p) => p.mandats[0]?.type === type),
  })).filter((g) => g.members.length > 0);

  const total = sorted.length;
  const gouvernement = sorted[0]?.mandats[0]?.gouvernement ?? "Gouvernement";

  return (
    <div className="min-h-screen bg-bureau-950 text-bureau-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          title="Gouvernement"
          subtitle={`${gouvernement} — ${total} membre${total > 1 ? "s" : ""}`}
        />

        <div className="mt-10 space-y-12">
          {grouped.map(({ type, label, members }) => (
            <section key={type}>
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-bureau-500">
                {label}
                <span className="ml-2 text-bureau-600">({members.length})</span>
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((p) => {
                  const mandat = p.mandats[0];
                  const initials = `${p.prenom[0] ?? ""}${p.nom[0] ?? ""}`.toUpperCase();
                  return (
                    <Link
                      key={p.id}
                      href={`/gouvernement/${p.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-bureau-800 bg-bureau-900/60 p-4 transition-colors hover:border-teal/40 hover:bg-bureau-800/60"
                    >
                      <Avatar src={p.photoUrl} initials={initials} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-bureau-100 group-hover:text-teal">
                          {p.prenom} {p.nom}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-bureau-400">
                          {mandat.titreCourt}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Membres sans mandat actif (safety net) */}
        {personnalites.filter((p) => p.mandats.length === 0).length > 0 && (
          <p className="mt-8 text-xs text-bureau-600">
            {personnalites.filter((p) => p.mandats.length === 0).length} fiche(s) sans mandat actif référencé.
          </p>
        )}
      </div>
    </div>
  );
}
