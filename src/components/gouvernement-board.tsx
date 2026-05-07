import Link from "next/link";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/avatar";
import { fmt } from "@/lib/format";

interface BoardEntry {
  slug: string;
  prenom: string;
  nom: string;
  photoUrl: string | null;
  titreCourt: string;
  type: string;
  rang: number;
  ministereCode: string | null;
  deportCount: number;
  lobbyCount: number;
}

async function getBoard(): Promise<BoardEntry[]> {
  const mandats = await prisma.mandatGouvernemental.findMany({
    where: { dateFin: null },
    orderBy: { rang: "asc" },
    take: 8,
    include: {
      personnalite: {
        select: {
          slug: true,
          nom: true,
          prenom: true,
          photoUrl: true,
          _count: { select: { deports: true } },
        },
      },
    },
  });

  const codes = mandats
    .map((m) => m.ministereCode)
    .filter((c): c is string => Boolean(c));
  const lobbyCounts =
    codes.length > 0
      ? await prisma.actionLobby.groupBy({
          by: ["ministereCode"],
          where: { ministereCode: { in: codes } },
          _count: { id: true },
        })
      : [];
  const lobbyByCode = new Map(
    lobbyCounts.map((r) => [r.ministereCode, r._count.id]),
  );

  return mandats.map((m) => ({
    slug: m.personnalite.slug,
    prenom: m.personnalite.prenom,
    nom: m.personnalite.nom,
    photoUrl: m.personnalite.photoUrl,
    titreCourt: m.titreCourt,
    type: m.type,
    rang: m.rang,
    ministereCode: m.ministereCode,
    deportCount: m.personnalite._count.deports,
    lobbyCount: m.ministereCode
      ? (lobbyByCode.get(m.ministereCode) ?? 0)
      : 0,
  }));
}

function lobbyLabel(count: number): string | null {
  if (count === 0) return null;
  if (count > 5_000) return "Très ciblé";
  if (count > 1_500) return "Ciblé";
  if (count > 300) return "Modéré";
  return "Faible";
}

/**
 * Homepage "Gouvernement en fonction" board. Président + Premier ministre +
 * top ministers ranked by `MandatGouvernemental.rang`. Each card surfaces
 * active déports + lobby exposure level — the two transparency dimensions a
 * reader needs first.
 */
export async function GouvernementBoard() {
  const board = await getBoard();
  if (board.length === 0) {
    return null;
  }

  return (
    <section style={{ padding: "0 40px 32px" }} aria-labelledby="gouvernement-en-fonction">
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2
          id="gouvernement-en-fonction"
          className="obs-mono text-[11px] uppercase tracking-[0.14em] text-fg-mute"
        >
          Gouvernement en fonction
        </h2>
        <Link
          href="/profils/ministres"
          className="text-[11px] text-fg-mute hover:text-fg"
        >
          Voir tous les ministres →
        </Link>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {board.map((m) => {
          const lobby = lobbyLabel(m.lobbyCount);
          const initials = `${m.prenom[0] ?? ""}${m.nom[0] ?? ""}`.toUpperCase();
          return (
            <li key={m.slug}>
              <Link
                href={`/profils/${m.slug}`}
                className="group flex h-full flex-col gap-3 rounded border border-fg-faint/20 bg-ink-1/30 p-4 transition-colors hover:border-fg-mute/40 hover:bg-ink-1/60"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={m.photoUrl} initials={initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.prenom} {m.nom}
                    </p>
                    <p className="truncate text-[11px] text-fg-mute">
                      {m.titreCourt}
                    </p>
                  </div>
                </div>

                <dl className="flex items-end justify-between gap-2 border-t border-fg-faint/15 pt-3 text-[11px]">
                  <div className="flex flex-col">
                    <dt className="uppercase tracking-[0.08em] text-fg-faint">
                      Déports
                    </dt>
                    <dd
                      className={`font-[family-name:var(--font-display)] text-base tabular-nums ${
                        m.deportCount > 0 ? "text-rose-300" : "text-fg-mute"
                      }`}
                    >
                      {m.deportCount}
                    </dd>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <dt className="uppercase tracking-[0.08em] text-fg-faint">
                      Lobby
                    </dt>
                    <dd className="text-fg-mute">
                      {lobby ?? "—"}
                      {m.lobbyCount > 0 ? (
                        <span className="ml-1 text-fg-faint">
                          ({fmt(m.lobbyCount)})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
