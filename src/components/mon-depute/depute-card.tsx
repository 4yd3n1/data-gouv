import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmt, fmtDate } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { ShareButtons } from "./share-buttons";
import { TAG_LABELS, TAG_COLORS } from "@/lib/vote-tags";

const RUBRIQUE_LABELS: Record<string, string> = {
  ACTIVITE_ANTERIEURE: "Activité antérieure",
  MANDAT_ELECTIF: "Mandat électif",
  PARTICIPATION: "Participation financière",
  ACTIVITE_CONJOINT: "Activité du conjoint",
  ACTIVITE_BENEVOLE: "Activité bénévole",
  REVENU: "Revenus",
  DON_AVANTAGE: "Don ou avantage",
};

const POSITION_LABELS: Record<string, string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
  nonVotant: "Non-votant",
};

const POSITION_COLORS: Record<string, string> = {
  pour: "text-teal",
  contre: "text-rose",
  abstention: "text-amber",
  nonVotant: "text-bureau-500",
};

interface DeputeCardProps {
  deputeId: string;
  postalCode?: string;
  communeName?: string;
  siteUrl: string;
}

export async function DeputeCard({
  deputeId,
  postalCode,
  communeName,
  siteUrl,
}: DeputeCardProps) {
  const depute = await prisma.depute.findUnique({
    where: { id: deputeId },
    select: {
      id: true,
      prenom: true,
      nom: true,
      civilite: true,
      groupe: true,
      groupeAbrev: true,
      departementNom: true,
      departementCode: true,
      circonscription: true,
      scoreParticipation: true,
      photoUrl: true,
      actif: true,
      personnalites: {
        select: {
          id: true,
          slug: true,
        },
        take: 1,
      },
    },
  });

  if (!depute) return null;

  const personnaliteId = depute.personnalites[0]?.id ?? null;
  const personnaliteSlug = depute.personnalites[0]?.slug ?? null;

  const [voteCount, conflictCount, mandatCount, hatvpHighlights, notableVotes, conflictSignals] =
    await Promise.all([
      prisma.voteRecord.count({ where: { deputeId } }),
      // ConflictSignal does not have verifie — it's pre-computed, use deputeId match
      prisma.conflictSignal.count({ where: { deputeId } }),
      personnaliteId
        ? prisma.entreeCarriere.count({
            where: {
              personnaliteId,
              categorie: "MANDAT_ELECTIF",
            },
          })
        : Promise.resolve(0),
      personnaliteId
        ? prisma.interetDeclare.findMany({
            where: { personnaliteId },
            orderBy: { dateDeclaration: "desc" },
            take: 3,
            select: {
              id: true,
              rubrique: true,
              contenu: true,
              organisation: true,
              dateDeclaration: true,
              declarationRef: true,
            },
          })
        : Promise.resolve([]),
      // Top 3 most recent votes with tags
      prisma.voteRecord.findMany({
        where: { deputeId },
        include: {
          scrutin: {
            include: {
              tags: { select: { tag: true }, take: 2 },
            },
          },
        },
        orderBy: { scrutin: { dateScrutin: "desc" } },
        take: 3,
      }),
      // ConflictSignal entries for this deputy
      prisma.conflictSignal.findMany({
        where: { deputeId },
        orderBy: { lastScrutinDate: "desc" },
        take: 3,
        select: {
          id: true,
          secteurDeclaration: true,
          tag: true,
          voteCount: true,
          votePour: true,
          voteContre: true,
          lastScrutinDate: true,
        },
      }),
    ]);

  const shareUrl = postalCode
    ? `${siteUrl}/mon-depute?cp=${postalCode}`
    : `${siteUrl}/profils/deputes/${deputeId}`;

  const headerLabel = postalCode
    ? `VOTRE DÉPUTÉ · ${postalCode}`
    : communeName
    ? `VOTRE DÉPUTÉ · ${communeName}`
    : "VOTRE DÉPUTÉ";

  return (
    <article className="overflow-hidden rounded-md border border-bureau-800 bg-bureau-900">
      {/* Header strip */}
      <div className="border-b border-bureau-800 bg-bureau-800/50 px-5 py-2.5">
        <p className="obs-mono text-[10px] uppercase tracking-[0.2em] text-bureau-400">
          {headerLabel}
        </p>
      </div>

      <div className="px-5 py-6 space-y-8">
        {/* Identity block */}
        <div className="flex items-start gap-5">
          <Avatar
            src={depute.photoUrl}
            initials={`${depute.prenom[0]}${depute.nom[0]}`}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="hd text-2xl font-semibold text-bureau-100">
              {depute.civilite} {depute.prenom} {depute.nom}
            </h1>
            <p className="obs-mono mt-1 text-xs uppercase tracking-[0.12em] text-bureau-400">
              {depute.groupeAbrev}
              {depute.groupe && depute.groupe !== depute.groupeAbrev && (
                <span className="normal-case tracking-normal text-bureau-500">
                  {" — "}{depute.groupe}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-bureau-500">
              {depute.departementNom}&nbsp;·&nbsp;
              {depute.circonscription}
              <sup>e</sup>&nbsp;circonscription
            </p>
            {!depute.actif && (
              <span className="mt-2 inline-block rounded-md bg-bureau-700/40 px-2 py-0.5 text-[10px] text-bureau-500">
                Ancien député
              </span>
            )}
          </div>
        </div>

        {/* 4 stat cards */}
        <section>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
            Indicateurs clés
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-bureau-800 bg-bureau-800/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-bureau-500">Participation</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-teal">
                {depute.scoreParticipation != null
                  ? `${Math.round(depute.scoreParticipation)} %`
                  : "—"}
              </p>
              {depute.scoreParticipation == null && (
                <p className="mt-1 text-[10px] text-bureau-600">Données indisponibles</p>
              )}
            </div>

            <div className="rounded-md border border-bureau-800 bg-bureau-800/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-bureau-500">Votes enregistrés</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-bureau-200">
                {fmt(voteCount)}
              </p>
            </div>

            <div className={`rounded-md border p-4 ${conflictCount > 0 ? "border-rose/30 bg-rose/5" : "border-bureau-800 bg-bureau-800/30"}`}>
              <p className="text-[10px] uppercase tracking-wider text-bureau-500">Conflits détectés</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${conflictCount > 0 ? "text-rose" : "text-bureau-200"}`}>
                {fmt(conflictCount)}
              </p>
              {conflictCount > 0 && (
                <p className="mt-1 text-[10px] text-rose/70">Vote vs déclaration</p>
              )}
            </div>

            <div className="rounded-md border border-bureau-800 bg-bureau-800/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-bureau-500">Mandats antérieurs</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-bureau-200">
                {personnaliteId ? fmt(mandatCount) : "—"}
              </p>
              {!personnaliteId && (
                <p className="mt-1 text-[10px] text-bureau-600">Non lié HATVP</p>
              )}
            </div>
          </div>
        </section>

        {/* HATVP highlights */}
        {hatvpHighlights.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
                Déclarations HATVP
              </h2>
              {personnaliteSlug && (
                <Link
                  href={`/profils/${personnaliteSlug}?tab=hatvp#interets`}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >
                  Toutes les déclarations →
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {hatvpHighlights.map((h) => (
                <div
                  key={h.id}
                  className="rounded-md border border-bureau-800 bg-bureau-800/20 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="obs-mono text-[9px] uppercase tracking-wider text-bureau-500">
                        {RUBRIQUE_LABELS[h.rubrique] ?? h.rubrique}
                      </span>
                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-bureau-300">
                        {h.contenu}
                        {h.organisation && (
                          <span className="text-bureau-500"> — {h.organisation}</span>
                        )}
                      </p>
                    </div>
                    {h.dateDeclaration && (
                      <p className="shrink-0 text-[10px] text-bureau-600">
                        {fmtDate(h.dateDeclaration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Votes notables */}
        {notableVotes.length > 0 && (
          <section>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
              Votes récents
            </h2>
            <div className="space-y-2">
              {notableVotes.map((v) => {
                const firstTag = v.scrutin.tags[0]?.tag;
                const tagStyle = firstTag ? TAG_COLORS[firstTag] : undefined;
                return (
                  <Link
                    key={v.id}
                    href={`/votes/scrutins/${v.scrutinId}`}
                    className="group flex items-start gap-3 rounded-md border border-bureau-800 bg-bureau-800/20 px-4 py-3 transition-all hover:border-bureau-700/50 hover:bg-bureau-800/40"
                  >
                    <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                      <span className={`text-xs font-semibold ${POSITION_COLORS[v.position] ?? "text-bureau-400"}`}>
                        {POSITION_LABELS[v.position] ?? v.position}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-snug text-bureau-300 transition-colors group-hover:text-bureau-100">
                        {v.scrutin.titre}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {firstTag && tagStyle && (
                          <span className={`rounded-full border px-1.5 py-px text-[9px] uppercase tracking-wider ${tagStyle}`}>
                            {TAG_LABELS[firstTag] ?? firstTag}
                          </span>
                        )}
                        <span className="text-[10px] text-bureau-600">
                          {fmtDate(v.scrutin.dateScrutin)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Contradictions */}
        <section>
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
            Contradictions détectées
          </h2>
          {conflictSignals.length > 0 ? (
            <div className="space-y-2">
              {conflictSignals.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-md border border-rose/20 bg-rose/5 px-4 py-3"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-bureau-300">
                      Vote{c.voteCount > 1 ? "s" : ""} sur{" "}
                      <span className="font-medium text-bureau-100">{c.secteurDeclaration}</span>
                      {" — "}
                      {c.votePour > 0 && `${c.votePour} pour, `}
                      {c.voteContre > 0 && `${c.voteContre} contre`}
                    </p>
                    {c.lastScrutinDate && (
                      <p className="mt-0.5 text-[10px] text-bureau-600">
                        Dernier scrutin&nbsp;: {fmtDate(c.lastScrutinDate)}
                      </p>
                    )}
                  </div>
                  {c.tag && TAG_LABELS[c.tag] && (
                    <span className={`shrink-0 rounded-full border px-1.5 py-px text-[9px] uppercase tracking-wider ${TAG_COLORS[c.tag] ?? "border-bureau-700/30 text-bureau-400"}`}>
                      {TAG_LABELS[c.tag]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-bureau-600 italic">
              Aucune contradiction détectée à ce jour.
            </p>
          )}
        </section>

        {/* Share strip */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-bureau-500">
            Partagez ce profil
          </p>
          <ShareButtons
            deputyName={`${depute.prenom} ${depute.nom}`}
            party={depute.groupeAbrev}
            url={shareUrl}
          />
        </section>

        {/* CTA footer */}
        <div className="border-t border-bureau-800 pt-5">
          <Link
            href={
              personnaliteSlug
                ? `/profils/${personnaliteSlug}`
                : `/profils/deputes/${depute.id}`
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300"
          >
            Voir le profil complet
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
