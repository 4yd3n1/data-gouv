import Link from "next/link";
import { prisma } from "@/lib/db";

export async function MediaTutelleSection({ ministereCode }: { ministereCode: string }) {
  if (ministereCode !== "CULTURE") return null;

  const stateMedia = await prisma.groupeMedia.findMany({
    where: {
      participations: { some: { typeControle: "ETAT" } },
    },
    select: {
      slug: true,
      nomCourt: true,
      nom: true,
      description: true,
      filiales: { select: { id: true }, take: 100 },
    },
    orderBy: { rang: "asc" },
  });

  if (stateMedia.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        M&eacute;dias sous tutelle
      </h2>
      <p className="mb-4 text-xs text-bureau-500">
        Groupes m&eacute;diatiques dont l&apos;&Eacute;tat est actionnaire
      </p>
      <div className="space-y-2">
        {stateMedia.map((g) => (
          <Link
            key={g.slug}
            href="/dossiers/medias"
            className="group flex items-center justify-between rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-colors hover:border-bureau-600/40 hover:bg-bureau-800/40"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-bureau-200 group-hover:text-bureau-100">{g.nomCourt}</p>
              <p className="mt-0.5 text-xs text-bureau-500 line-clamp-1">{g.nom}</p>
            </div>
            <div className="shrink-0 ml-4 text-right">
              <p className="text-sm font-bold text-teal">{g.filiales.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-bureau-500">m&eacute;dias</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
