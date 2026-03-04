import Link from "next/link";
import { prisma } from "@/lib/db";
import { VoteBadge } from "@/components/vote-badge";
import { fmtDate } from "@/lib/format";

export async function ParliamentarySection({
  deputeId,
  senateurId,
}: {
  deputeId?: string | null;
  senateurId?: string | null;
}) {
  if (!deputeId && !senateurId) return null;

  if (deputeId) {
    return <DeputeSection deputeId={deputeId} />;
  }
  return <SenateurSection senateurId={senateurId!} />;
}

async function DeputeSection({ deputeId }: { deputeId: string }) {
  const [depute, recentVotes] = await Promise.all([
    prisma.depute.findUnique({
      where: { id: deputeId },
      select: {
        groupe: true,
        groupeAbrev: true,
        departementNom: true,
        departementCode: true,
        actif: true,
        datePriseFonction: true,
        scoreParticipation: true,
        scoreSpecialite: true,
        scoreLoyaute: true,
        scoreMajorite: true,
        email: true,
        twitter: true,
        website: true,
      },
    }),
    prisma.voteRecord.findMany({
      where: { deputeId },
      include: { scrutin: true },
      orderBy: { scrutin: { dateScrutin: "desc" } },
      take: 8,
    }),
  ]);

  if (!depute) return null;

  const scores = [
    { value: depute.scoreParticipation, label: "Participation", color: "teal" as const },
    { value: depute.scoreSpecialite, label: "Spécialité", color: "blue" as const },
    { value: depute.scoreLoyaute, label: "Loyauté", color: "amber" as const },
    { value: depute.scoreMajorite, label: "Majorité", color: "rose" as const },
  ];

  const hasScores = scores.some((s) => s.value !== null);

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader title="Activité parlementaire — Assemblée nationale" />

        <div className="space-y-6">
          {/* Identity */}
          <div className="flex flex-wrap items-center gap-2">
            {depute.groupeAbrev && (
              <span className="rounded-md border border-bureau-700/30 bg-bureau-800/30 px-2 py-0.5 text-xs font-semibold text-bureau-300">
                {depute.groupeAbrev}
              </span>
            )}
            <span className="text-sm text-bureau-400">
              {depute.groupe}
            </span>
            {depute.departementNom && (
              <>
                <span className="text-bureau-700">·</span>
                <span className="text-sm text-bureau-400">
                  {depute.departementNom}
                  {depute.departementCode ? ` (${depute.departementCode})` : ""}
                </span>
              </>
            )}
            <span
              className={`ml-auto rounded-md px-2 py-0.5 text-xs font-medium ${
                depute.actif
                  ? "bg-teal/10 text-teal"
                  : "bg-bureau-800/40 text-bureau-500"
              }`}
            >
              {depute.actif ? "Mandat en cours" : "Mandat terminé"}
            </span>
          </div>

          {/* Date of office */}
          {depute.datePriseFonction && (
            <p className="text-xs text-bureau-500">
              En mandat depuis le {fmtDate(depute.datePriseFonction)}
            </p>
          )}

          {/* Scores */}
          {hasScores && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {scores.map((score) => (
                <ScoreBar key={score.label} {...score} />
              ))}
            </div>
          )}

          {/* Contact */}
          {(depute.email || depute.twitter || depute.website) && (
            <div className="flex flex-wrap gap-2">
              {depute.email && (
                <a
                  href={`mailto:${depute.email}`}
                  className="rounded-md border border-bureau-700/30 bg-bureau-800/30 px-2 py-1 text-xs text-bureau-400 hover:text-bureau-200"
                >
                  E-mail
                </a>
              )}
              {depute.twitter && (
                <a
                  href={`https://twitter.com/${depute.twitter.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-bureau-700/30 bg-bureau-800/30 px-2 py-1 text-xs text-bureau-400 hover:text-bureau-200"
                >
                  Twitter/X
                </a>
              )}
              {depute.website && (
                <a
                  href={depute.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-bureau-700/30 bg-bureau-800/30 px-2 py-1 text-xs text-bureau-400 hover:text-bureau-200"
                >
                  Site web
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recent votes */}
      {recentVotes.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500">
              Votes récents
            </h2>
            <Link
              href="/gouvernance/scrutins"
              className="text-xs text-teal/70 transition-colors hover:text-teal"
            >
              Tous les scrutins →
            </Link>
          </div>
          <div className="space-y-2">
            {recentVotes.map((v) => (
              <Link
                key={v.id}
                href={`/gouvernance/scrutins/${v.scrutinId}`}
                className="group flex items-start gap-3 rounded-xl border border-bureau-700/20 bg-bureau-800/20 px-5 py-4 transition-all hover:border-bureau-600/40 hover:bg-bureau-800/40"
              >
                <VoteBadge position={v.position} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-relaxed text-bureau-200 group-hover:text-bureau-100">
                    {v.scrutin.titre}
                  </p>
                  <p className="mt-1 text-xs text-bureau-500">
                    {fmtDate(v.scrutin.dateScrutin)} · Scrutin n°{v.scrutin.numero}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-bureau-600">
            Source : Assemblée nationale · Données issues du registre des votes
          </p>
        </section>
      )}

      {recentVotes.length === 0 && (
        <section>
          <SectionHeader title="Votes récents" />
          <Placeholder text="Aucun vote enregistré pour ce mandat." />
        </section>
      )}
    </div>
  );
}

async function SenateurSection({ senateurId }: { senateurId: string }) {
  const senateur = await prisma.senateur.findUnique({
    where: { id: senateurId },
    select: {
      groupe: true,
      departement: true,
      actif: true,
      datePriseFonction: true,
      commissions: {
        where: { dateFin: null },
        orderBy: { dateDebut: "desc" },
        take: 3,
        select: { nom: true, fonction: true },
      },
    },
  });

  if (!senateur) return null;

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Activité parlementaire — Sénat" />

        <div className="space-y-4">
          {/* Identity */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-bureau-400">{senateur.groupe}</span>
            {senateur.departement && (
              <>
                <span className="text-bureau-700">·</span>
                <span className="text-sm text-bureau-400">{senateur.departement}</span>
              </>
            )}
            <span
              className={`ml-auto rounded-md px-2 py-0.5 text-xs font-medium ${
                senateur.actif
                  ? "bg-teal/10 text-teal"
                  : "bg-bureau-800/40 text-bureau-500"
              }`}
            >
              {senateur.actif ? "Mandat en cours" : "Mandat terminé"}
            </span>
          </div>

          {senateur.datePriseFonction && (
            <p className="text-xs text-bureau-500">
              En mandat depuis le {fmtDate(senateur.datePriseFonction)}
            </p>
          )}

          {/* Commissions */}
          {senateur.commissions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-bureau-500">
                Commissions en cours
              </p>
              <ul className="space-y-1.5">
                {senateur.commissions.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-3 py-2 text-xs"
                  >
                    <span className="text-bureau-300">{c.nom}</span>
                    {c.fonction && (
                      <span className="ml-2 text-bureau-500">· {c.fonction}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}

const SCORE_COLORS = {
  teal: "bg-teal",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
} as const;

function ScoreBar({
  value,
  label,
  color,
}: {
  value: number | null;
  label: string;
  color: keyof typeof SCORE_COLORS;
}) {
  const pct = value ?? 0;
  return (
    <div className="rounded-lg border border-bureau-700/20 bg-bureau-800/20 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] text-bureau-500">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-bureau-300">
          {value !== null ? `${Math.round(pct)}` : "—"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bureau-700/40">
        <div
          className={`h-full rounded-full ${SCORE_COLORS[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
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
