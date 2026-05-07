import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Corrections & changelog — L'Observatoire Citoyen",
  description:
    "Journal public des mises à jour de données, corrections d'erreurs signalées et changements éditoriaux.",
};

interface IngestionEntry {
  id: string;
  source: string;
  status: string;
  rowsIngested: number;
  createdAt: Date;
}

interface CorrectionEntry {
  id: string;
  url: string;
  type: string;
  description: string;
  resolutionNote: string | null;
  resolvedAt: Date;
}

const SOURCE_LABELS: Record<string, string> = {
  declarations: "HATVP — déclarations",
  "agora-lobby": "AGORA — registre lobbying",
  scrutins: "Assemblée nationale — scrutins",
  organes: "Assemblée nationale — organes",
  deputes: "Assemblée nationale — députés",
  senateurs: "Sénat — sénateurs",
  lobbyistes: "HATVP — lobbyistes",
  "decrets-deport": "Premier ministre — décrets de déport",
  "insee-local": "INSEE — Mélodi local",
  budgets: "OFGL — finances locales",
  criminalite: "SSMSI — criminalité",
  medecins: "DREES — densité médicale",
  partis: "CNCCFP — comptes des partis",
  elus: "RNE — élus",
  elections: "Min. Intérieur — élections",
  monuments: "data.gouv.fr — monuments",
  musees: "data.gouv.fr — musées",
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  FACTUEL: "Erreur factuelle",
  SOURCE: "Source",
  TYPO: "Coquille",
  AUTRE: "Autre",
};

/**
 * The url field on `ErrorReport` is user-submitted via the public form. Sanitize
 * before render: allow only same-origin paths starting with `/` (no `//` to
 * block protocol-relative URLs) or absolute http(s) URLs. Reject `javascript:`,
 * `data:`, mailto:, fragment-only, etc. Returns null when unsafe.
 */
function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "https:" || u.protocol === "http:") {
      return u.toString();
    }
  } catch {}
  return null;
}

async function getRecentChanges(): Promise<{
  ingestions: IngestionEntry[];
  corrections: CorrectionEntry[];
}> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const [ingestions, corrections] = await Promise.all([
    prisma.ingestionLog.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: ["success", "partial"] },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        source: true,
        status: true,
        rowsIngested: true,
        createdAt: true,
      },
    }),
    prisma.errorReport.findMany({
      where: { status: "RESOLVED" },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        url: true,
        type: true,
        description: true,
        resolutionNote: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    ingestions,
    corrections: corrections.map((c) => ({
      id: c.id,
      url: c.url,
      type: c.type,
      description: c.description,
      resolutionNote: c.resolutionNote,
      resolvedAt: c.updatedAt,
    })),
  };
}

export default async function CorrectionsPage() {
  const { ingestions, corrections } = await getRecentChanges();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="obs-mono text-[11px] uppercase tracking-[0.14em] text-fg-mute">
          Trust layer
        </p>
        <h1
          className="hd mt-2"
          style={{
            fontSize: "clamp(32px, 3.5vw, 52px)",
            lineHeight: 1.04,
            letterSpacing: "-0.018em",
            margin: 0,
          }}
        >
          Corrections & journal d&apos;ingestion
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fg-mute">
          Toute mise à jour de données et toute erreur résolue sont consignées
          ici. Les déclarations et fiches ne sont jamais réécrites silencieusement
          — chaque correction apparaît avec sa date et sa note de résolution.
        </p>
        <p className="mt-2 text-xs text-fg-faint">
          Vous avez repéré une erreur ?{" "}
          <Link
            href="/signaler-une-erreur"
            className="underline decoration-fg-faint/40 underline-offset-2 hover:text-fg"
          >
            Signaler une erreur
          </Link>
          .
        </p>
      </header>

      <section className="mb-12">
        <h2 className="obs-mono mb-4 text-[11px] uppercase tracking-[0.14em] text-fg-mute">
          Corrections résolues ({corrections.length})
        </h2>
        {corrections.length === 0 ? (
          <p className="rounded border border-fg-faint/15 bg-ink-1/30 px-4 py-6 text-sm italic text-fg-faint">
            Aucune correction publiée pour le moment.
          </p>
        ) : (
          <ul className="space-y-3">
            {corrections.map((c) => (
              <li
                key={c.id}
                className="rounded border border-fg-faint/20 bg-ink-1/30 p-4"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-fg-mute">
                    {ERROR_TYPE_LABELS[c.type] ?? c.type}
                  </span>
                  <span className="text-[11px] tabular-nums text-fg-faint">
                    {fmtDate(c.resolvedAt)}
                  </span>
                </header>
                <p className="mt-2 text-sm leading-relaxed text-fg">
                  {c.description}
                </p>
                {c.resolutionNote ? (
                  <p className="mt-2 border-l-2 border-fg-faint/30 pl-3 text-sm text-fg-mute">
                    {c.resolutionNote}
                  </p>
                ) : null}
                {(() => {
                  const safe = safeUrl(c.url);
                  if (!safe) {
                    return (
                      <p className="mt-2 text-[11px] text-fg-faint">
                        Page concernée : <span className="italic">non renseignée</span>
                      </p>
                    );
                  }
                  return (
                    <p className="mt-2 text-[11px] text-fg-faint">
                      Page concernée :{" "}
                      <Link
                        href={safe}
                        className="underline decoration-fg-faint/40 underline-offset-2 hover:text-fg"
                      >
                        {safe}
                      </Link>
                    </p>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="obs-mono mb-4 text-[11px] uppercase tracking-[0.14em] text-fg-mute">
          Mises à jour récentes des données ({ingestions.length})
        </h2>
        <p className="mb-4 text-xs italic text-fg-faint">
          Sur les 60 derniers jours. Source : table IngestionLog.
        </p>
        {ingestions.length === 0 ? (
          <p className="rounded border border-fg-faint/15 bg-ink-1/30 px-4 py-6 text-sm italic text-fg-faint">
            Aucune ingestion enregistrée sur la période.
          </p>
        ) : (
          <ul className="divide-y divide-fg-faint/15 rounded border border-fg-faint/20 bg-ink-1/30">
            {ingestions.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">
                    {SOURCE_LABELS[i.source] ?? i.source}
                  </p>
                  <p className="text-[11px] text-fg-faint">
                    {fmt(i.rowsIngested)} lignes&nbsp;·&nbsp;{i.status}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-fg-mute">
                  {fmtDate(i.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
