import { prisma } from "@/lib/db";
import { mergeCareerEntries } from "@/lib/career-merge";
import { LaneTimeline, detectReconduit } from "./career-section";

/**
 * Lifts the career swim-lane out of the Parcours tab into a hero strip
 * visible on every tab of /profils/[slug]. The full year-grouped detail
 * still lives inside the Parcours tab — the hero is the *arc*, the tab is
 * the *transcript*.
 *
 * Returns null when there are no dated entries (sparse profiles fall back
 * to the existing tab-only experience).
 */
export async function TrajectoireHero({
  personnaliteId,
}: {
  personnaliteId: string;
}) {
  const rawEntries = await prisma.entreeCarriere.findMany({
    where: { personnaliteId },
    orderBy: [{ dateDebut: "desc" }, { ordre: "asc" }],
  });

  if (rawEntries.length === 0) return null;

  const entries = mergeCareerEntries(rawEntries);
  const withDates = entries.filter((e) => e.dateDebut);
  if (withDates.length === 0) return null;

  const now = new Date();
  const minYear = Math.min(
    ...withDates.map((e) => (e.dateDebut as Date).getFullYear()),
  );
  const maxYear = Math.max(
    ...withDates.map((e) =>
      e.dateFin ? (e.dateFin as Date).getFullYear() : now.getFullYear(),
    ),
  );
  const span = maxYear - minYear;
  if (span <= 0) return null;

  const reconduit = detectReconduit(entries);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-6">
      <div className="rounded-sm border border-bureau-800/40 bg-bureau-900/30 px-5 py-5">
        <LaneTimeline
          entries={withDates}
          minYear={minYear}
          maxYear={maxYear}
          span={span}
          reconduit={reconduit}
        />
      </div>
    </div>
  );
}
