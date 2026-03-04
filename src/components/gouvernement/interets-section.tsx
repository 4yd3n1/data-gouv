import Link from "next/link";
import { prisma } from "@/lib/db";

const RUBRIQUE_LABEL: Record<string, string> = {
  ACTIVITE_ANTERIEURE: "Activités professionnelles antérieures",
  MANDAT_ELECTIF: "Mandats électifs",
  PARTICIPATION: "Participations financières",
  ACTIVITE_CONJOINT: "Activités du conjoint",
  ACTIVITE_BENEVOLE: "Fonctions bénévoles",
  REVENU: "Revenus",
  DON_AVANTAGE: "Dons et avantages",
};

const RUBRIQUE_ORDER = [
  "MANDAT_ELECTIF",
  "ACTIVITE_ANTERIEURE",
  "PARTICIPATION",
  "ACTIVITE_CONJOINT",
  "ACTIVITE_BENEVOLE",
  "REVENU",
  "DON_AVANTAGE",
];

// Items above this threshold collapse behind a <details> expander
const INLINE_THRESHOLD = 5;

export async function InteretsSection({
  personnaliteId,
  hatvpDossierId,
}: {
  personnaliteId: string;
  hatvpDossierId?: string | null;
}) {
  const interets = await prisma.interetDeclare.findMany({
    where: { personnaliteId },
    orderBy: [{ dateDeclaration: "desc" }, { rubrique: "asc" }],
  });

  const hatvpUrl = hatvpDossierId
    ? `https://www.hatvp.fr${hatvpDossierId}`
    : null;

  return (
    <section>
      <SectionHeader title="Intérêts déclarés (HATVP)" hatvpUrl={hatvpUrl} />

      {interets.length === 0 ? (
        <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-4 py-3 text-xs text-bureau-500">
          Aucune déclaration d&apos;intérêts publiée sur le registre HATVP.
        </div>
      ) : (
        <DeclarationsView interets={interets} />
      )}
    </section>
  );
}

type Interet = Awaited<
  ReturnType<typeof prisma.interetDeclare.findMany>
>[number];

function DeclarationsView({ interets }: { interets: Interet[] }) {
  // Group by declarationRef
  const declarations = new Map<
    string,
    { date: Date | null; items: Interet[] }
  >();
  for (const item of interets) {
    const key = item.declarationRef;
    if (!declarations.has(key)) {
      declarations.set(key, { date: item.dateDeclaration, items: [] });
    }
    declarations.get(key)!.items.push(item);
  }

  // Sort declarations by date desc, take most recent
  const sorted = [...declarations.entries()].sort((a, b) => {
    const da = a[1].date?.getTime() ?? 0;
    const db = b[1].date?.getTime() ?? 0;
    return db - da;
  });

  const [, mostRecent] = sorted[0];

  return (
    <div className="space-y-4">
      {/* Declaration selector if multiple */}
      {sorted.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-bureau-400">Déclaration :</span>
          {sorted.map(([ref, { date }], i) => (
            <span
              key={ref}
              className={`rounded-md px-2 py-0.5 ${
                i === 0
                  ? "bg-teal/10 text-teal"
                  : "text-bureau-400"
              }`}
            >
              {date
                ? date.toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })
                : `Déclaration ${i + 1}`}
            </span>
          ))}
        </div>
      )}

      {/* Most recent declaration date */}
      {mostRecent.date && (
        <p className="text-xs text-bureau-400">
          Déclaration du{" "}
          {mostRecent.date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          · {mostRecent.items.length} entrée
          {mostRecent.items.length > 1 ? "s" : ""}
        </p>
      )}

      {/* Items grouped by rubrique */}
      <div className="space-y-5">
        {RUBRIQUE_ORDER.filter((r) =>
          mostRecent.items.some((i) => i.rubrique === r)
        ).map((rubrique) => {
          const items = mostRecent.items.filter((i) => i.rubrique === rubrique);
          const visible = items.slice(0, INLINE_THRESHOLD);
          const hidden = items.slice(INLINE_THRESHOLD);
          return (
            <div key={rubrique}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
                {RUBRIQUE_LABEL[rubrique] ?? rubrique}
                <span className="ml-1.5 font-normal text-bureau-600">
                  ({items.length})
                </span>
              </h3>
              <ul className="space-y-2">
                {visible.map((item) => (
                  <InteretItem key={item.id} item={item} />
                ))}
              </ul>
              {hidden.length > 0 && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer list-none text-xs text-bureau-400 hover:text-bureau-300 select-none">
                    <span className="group-open:hidden">
                      + {hidden.length} autre{hidden.length > 1 ? "s" : ""} →
                    </span>
                    <span className="hidden group-open:inline">
                      Réduire ↑
                    </span>
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {hidden.map((item) => (
                      <InteretItem key={item.id} item={item} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InteretItem({ item }: { item: Interet }) {
  return (
    <li
      className={`rounded-xl border px-4 py-3 text-sm ${
        item.alerteConflit
          ? "border-amber-700/30 bg-amber-950/20"
          : "border-bureau-700/20 bg-bureau-800/20"
      }`}
    >
      <p className="text-bureau-200 leading-snug">{item.contenu}</p>
      {item.organisation && (
        <p className="mt-0.5 text-xs text-bureau-400">
          {item.organisation}
        </p>
      )}
      {(item.dateDebut || item.dateFin) && (
        <p className="mt-0.5 text-xs text-bureau-500">
          {item.dateDebut?.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          }) ?? ""}
          {item.dateFin
            ? ` — ${item.dateFin.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              })}`
            : item.dateDebut
            ? " — en cours"
            : ""}
        </p>
      )}
      {item.montant !== null && item.montant !== undefined && (
        <p className="mt-0.5 text-xs text-bureau-500">
          {item.montant.toLocaleString("fr-FR", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
          })}
        </p>
      )}
      {item.alerteConflit && item.commentaireConflit && (
        <p className="mt-1 text-xs text-amber-400">
          {item.commentaireConflit}
        </p>
      )}
    </li>
  );
}

function SectionHeader({
  title,
  hatvpUrl,
}: {
  title: string;
  hatvpUrl: string | null;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
        {title}
      </h2>
      {hatvpUrl && (
        <Link
          href={hatvpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-bureau-500 hover:text-teal"
        >
          Source HATVP ↗
        </Link>
      )}
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}
