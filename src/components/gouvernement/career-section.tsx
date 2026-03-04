import { prisma } from "@/lib/db";

export async function CareerSection({
  personnaliteId,
}: {
  personnaliteId: string;
}) {
  const count = await prisma.entreeCarriere.count({ where: { personnaliteId } });

  return (
    <section>
      <SectionHeader title="Parcours" />
      {count === 0 ? (
        <Placeholder text="Données de parcours en cours de collecte." />
      ) : (
        <p className="text-sm text-bureau-400">
          {count} entrée{count > 1 ? "s" : ""} de parcours — détail disponible prochainement.
        </p>
      )}
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

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-4 py-3 text-xs text-bureau-500">
      {text}
    </div>
  );
}
