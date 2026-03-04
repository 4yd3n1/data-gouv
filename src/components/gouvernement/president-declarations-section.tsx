import { prisma } from "@/lib/db";
import { fmtEuro } from "@/lib/format";
import { DeclarationSection } from "@/components/declaration-section";
import { ConflictAlert } from "@/components/conflict-alert";

export async function PresidentDeclarationsSection() {
  const declarations = await prisma.declarationInteret.findMany({
    where: {
      OR: [
        { nom: { contains: "Macron", mode: "insensitive" } },
        { nom: { contains: "MACRON", mode: "insensitive" } },
      ],
    },
    include: { participations: true, revenus: true },
    orderBy: { dateDepot: "desc" },
  });

  const conflictDeclarations = declarations.filter(
    (d) => (d.totalParticipations ?? 0) > 0,
  );

  if (declarations.length === 0) {
    return (
      <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-8 text-center">
        <p className="text-bureau-400">
          Aucune déclaration trouvée sous le nom « Macron » dans la base HATVP.
        </p>
        <p className="mt-2 text-xs text-bureau-600">
          Les déclarations de la Présidence sont normalement publiées sur{" "}
          <a
            href="https://www.hatvp.fr/consulter-les-declarations/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline"
          >
            hatvp.fr
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-up">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
          <p className="text-[10px] uppercase tracking-widest text-bureau-500">
            Déclarations
          </p>
          <p className="mt-1 text-2xl font-bold text-teal">
            {declarations.length}
          </p>
        </div>
        <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
          <p className="text-[10px] uppercase tracking-widest text-bureau-500">
            Total participations
          </p>
          <p className="mt-1 text-2xl font-bold text-amber">
            {fmtEuro(
              declarations.reduce(
                (s, d) => s + (d.totalParticipations ?? 0),
                0,
              ),
            )}
          </p>
        </div>
        <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-4">
          <p className="text-[10px] uppercase tracking-widest text-bureau-500">
            Total revenus déclarés
          </p>
          <p className="mt-1 text-2xl font-bold text-blue">
            {fmtEuro(
              declarations.reduce(
                (s, d) => s + (d.totalRevenus ?? 0),
                0,
              ),
            )}
          </p>
        </div>
      </div>

      {/* Conflict alerts */}
      {conflictDeclarations.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
            Participations financières déclarées
          </h2>
          <div className="space-y-3">
            {conflictDeclarations.map((decl) => {
              const sector =
                decl.participations
                  .slice(0, 2)
                  .map((p) => p.nomSociete)
                  .join(", ") ||
                decl.organe ||
                decl.typeMandat;
              return (
                <ConflictAlert
                  key={decl.id}
                  deputyName="Emmanuel Macron"
                  sector={sector}
                  participationTotal={decl.totalParticipations ?? 0}
                  relatedVoteCount={0}
                  declarationId={decl.id}
                  typeMandat={decl.typeMandat}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Full declarations */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
          Toutes les déclarations
        </h2>
        <DeclarationSection declarations={declarations} />
      </section>
    </div>
  );
}
