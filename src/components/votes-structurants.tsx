import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtShortDate } from "@/lib/format";

interface VoteEntry {
  scrutinId: string;
  titre: string;
  dateScrutin: Date;
  sortCode: string;
  pour: number;
  contre: number;
  abstentions: number;
  totalExprimes: number;
}

async function getStructurants(limit: number): Promise<VoteEntry[]> {
  const lois = await prisma.scrutinLoi.findMany({
    where: { role: "VOTE_FINAL" },
    take: limit,
    orderBy: { scrutin: { dateScrutin: "desc" } },
    select: {
      scrutin: {
        select: {
          id: true,
          titre: true,
          dateScrutin: true,
          sortCode: true,
          pour: true,
          contre: true,
          abstentions: true,
          suffragesExprimes: true,
        },
      },
    },
  });

  return lois.map((sl) => ({
    scrutinId: sl.scrutin.id,
    titre: sl.scrutin.titre,
    dateScrutin: sl.scrutin.dateScrutin,
    sortCode: sl.scrutin.sortCode,
    pour: sl.scrutin.pour,
    contre: sl.scrutin.contre,
    abstentions: sl.scrutin.abstentions,
    totalExprimes: Math.max(sl.scrutin.suffragesExprimes, 1),
  }));
}

function adoptedClass(sort: string): string {
  if (sort.toLowerCase().includes("adopt")) return "text-teal-300";
  if (sort.toLowerCase().includes("rejet")) return "text-rose-300";
  return "text-fg-mute";
}

/**
 * Homepage "Votes structurants" panel. Three most recent final scrutins with a
 * thin pour/contre/abstention bar — links into the scrutin detail page for
 * group-level breakdown.
 */
export async function VotesStructurants() {
  const votes = await getStructurants(3);
  if (votes.length === 0) return null;

  return (
    <section style={{ padding: "0 40px 32px" }} aria-labelledby="votes-structurants">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2
          id="votes-structurants"
          className="obs-mono text-[11px] uppercase tracking-[0.14em] text-fg-mute"
        >
          Votes structurants
        </h2>
        <Link
          href="/votes"
          className="text-[11px] text-fg-mute hover:text-fg"
        >
          Tous les scrutins →
        </Link>
      </header>

      <ul className="grid gap-3 sm:grid-cols-3">
        {votes.map((v) => {
          const pourPct = (v.pour / v.totalExprimes) * 100;
          const contrePct = (v.contre / v.totalExprimes) * 100;
          const absPct = Math.max(0, 100 - pourPct - contrePct);
          return (
            <li key={v.scrutinId}>
              <Link
                href={`/votes/scrutins/${v.scrutinId}`}
                className="flex h-full flex-col gap-3 rounded border border-fg-faint/20 bg-ink-1/30 p-4 transition-colors hover:border-fg-mute/40 hover:bg-ink-1/60"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-fg-faint">
                    {fmtShortDate(v.dateScrutin)}
                  </span>
                  <span className={`text-[11px] uppercase tracking-[0.08em] ${adoptedClass(v.sortCode)}`}>
                    {v.sortCode}
                  </span>
                </div>
                <p className="text-sm leading-snug text-fg line-clamp-3">
                  {v.titre}
                </p>
                <div className="space-y-1.5">
                  <div
                    className="flex h-1.5 overflow-hidden rounded-sm border border-fg-faint/15"
                    aria-hidden
                  >
                    <span
                      className="bg-teal-700/70"
                      style={{ width: `${pourPct}%` }}
                    />
                    <span
                      className="bg-rose-700/70"
                      style={{ width: `${contrePct}%` }}
                    />
                    <span
                      className="bg-fg-faint/30"
                      style={{ width: `${absPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] tabular-nums text-fg-mute">
                    <span>Pour {fmt(v.pour)}</span>
                    <span>Contre {fmt(v.contre)}</span>
                    <span>Abst. {fmt(v.abstentions)}</span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
