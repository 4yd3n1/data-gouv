import { prisma } from "@/lib/db";

export async function JudiciaireSection({
  personnaliteId,
}: {
  personnaliteId: string;
}) {
  // CRITICAL: only count verified events
  const count = await prisma.evenementJudiciaire.count({
    where: { personnaliteId, verifie: true },
  });

  if (count === 0) {
    // No verified judicial events — show nothing (not a placeholder, just omit)
    return null;
  }

  return (
    <section>
      <SectionHeader title="Affaires judiciaires" />
      <p className="text-sm text-bureau-400">
        {count} procédure{count > 1 ? "s" : ""} judiciaire{count > 1 ? "s" : ""} référencée{count > 1 ? "s" : ""} — détail disponible prochainement.
      </p>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        {title}
      </h2>
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}
