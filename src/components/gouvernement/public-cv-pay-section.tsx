import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { fmtEuro, fmtShortDate } from "@/lib/format";
import { normalizeName } from "@/lib/normalize-name";
import { SourceChip } from "@/components/source-chip";
import { mergeCareerEntries, formatSources, type MergedCareerEntry } from "@/lib/career-merge";
import {
  getRemunerations,
  type RemunerationsPosition,
} from "@/lib/remunerations";
import type { BaremeOfficiel } from "@/lib/baremes-officiels";
import { YearlyChart } from "./yearly-revenue-chart";
import { InteretsSection } from "./interets-section";
import { HatvpDossier } from "./hatvp-dossier";

type Props = {
  personnaliteId: string;
  prenom: string;
  nom: string;
  nomNormalise: string | null;
  prenomNormalise: string | null;
  hatvpDossierId: string | null;
  bareme: BaremeOfficiel | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  MANDAT_GOUVERNEMENTAL: "Gouvernement",
  MANDAT_ELECTIF: "Mandat électif",
  FONCTION_PUBLIQUE: "Fonction publique",
  CARRIERE_PRIVEE: "Secteur privé",
  ORGANISME: "Organisme",
  FORMATION: "Formation",
  AUTRE: "Autre",
};

const PUBLIC_ROLE_RE =
  /\b(ministre|premier ministre|secretaire d'etat|garde des sceaux|depute|senateur|maire|adjoint|conseiller|president|vice president|assemblee nationale|senat|gouvernement)\b/;
const PRIVATE_INCOME_RE = /\b(droits? d'auteurs?|auteurs?|ouvrage|livre|avance)\b/;

function plain(text: string): string {
  return normalizeName(text).replace(/\s+/g, " ").trim();
}

function cleanLabel(text: string): string {
  return text.replace(/\s*\[Données non publiées\]\s*/gi, "").replace(/\s+/g, " ").trim();
}

function isPublicCompensation(position: RemunerationsPosition): boolean {
  if (position.rubrique === "MANDAT_ELECTIF") return true;
  const title = plain(position.title);
  if (PRIVATE_INCOME_RE.test(title)) return false;
  return PUBLIC_ROLE_RE.test(title);
}

function sumMontants(positions: RemunerationsPosition[]): number {
  return positions.reduce((sum, p) => sum + (p.montant ?? 0), 0);
}

function periodLabel(start: Date | null, end: Date | null): string {
  if (!start && !end) return "Période non renseignée";
  const startLabel = start ? fmtShortDate(start) : "début inconnu";
  const endLabel = end ? fmtShortDate(end) : "en cours";
  return `${startLabel} – ${endLabel}`;
}

function careerDate(entry: MergedCareerEntry): string {
  return periodLabel(entry.dateDebut, entry.dateFin);
}

export async function PublicCvPaySection({
  personnaliteId,
  prenom,
  nom,
  nomNormalise,
  prenomNormalise,
  hatvpDossierId,
  bareme,
}: Props) {
  const resolvedNom = nomNormalise || normalizeName(nom);
  const resolvedPrenom = prenomNormalise || normalizeName(prenom);
  const hatvpUrl = hatvpDossierId ? `https://www.hatvp.fr${hatvpDossierId}` : null;

  const [rawCareer, remuneration] = await Promise.all([
    prisma.entreeCarriere.findMany({
      where: { personnaliteId },
      orderBy: [{ dateDebut: "desc" }, { ordre: "asc" }],
    }),
    getRemunerations({
      nomNormalise: resolvedNom,
      prenomNormalise: resolvedPrenom,
      personnaliteId,
    }),
  ]);

  const career = mergeCareerEntries(rawCareer);
  const compensationRows = [
    ...remuneration.currentPositions,
    ...remuneration.pastPositions,
  ];
  const publicCompensations = compensationRows.filter(isPublicCompensation);
  const otherCompensations = compensationRows.filter(
    (p) => !isPublicCompensation(p) && p.montant !== null,
  );
  const currentPublicTotal = sumMontants(
    remuneration.currentPositions.filter(isPublicCompensation),
  );
  const documentedPublicTotal = sumMontants(publicCompensations);
  const electedTotal = sumMontants(
    compensationRows.filter((p) => p.rubrique === "MANDAT_ELECTIF"),
  );
  const paidPublicRows = publicCompensations.filter((p) => p.montant !== null);
  const hiddenPayRows = paidPublicRows.slice(8);
  const visiblePayRows = paidPublicRows.slice(0, 8);
  const visibleCareer = career.slice(0, 9);
  const hiddenCareer = career.slice(9);

  return (
    <section className="space-y-8 fade-up">
      <header className="border-y border-bureau-800/50 py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase text-bureau-500">
              CV public et rémunérations
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-bureau-50 sm:text-3xl">
              Ce qu&apos;il a exercé, et les montants publics déclarés
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bureau-400">
              Lecture synthétique des mandats, fonctions publiques et montants
              HATVP. Les montants ci-dessous sont des rémunérations ou
              indemnités déclarées : ce n&apos;est pas une paie certifiée ni le
              coût complet employeur.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SourceChip
              outlet="HATVP"
              url={hatvpUrl}
              date={remuneration.latestDepotDate}
              type="officiel"
            />
            {bareme ? (
              <SourceChip
                outlet="Barème officiel"
                url={bareme.sourceUrl}
                type="officiel"
                basis={bareme.references.join(" + ")}
              />
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Indemnité actuelle"
          value={
            bareme
              ? fmtEuro(bareme.brutAnnuel)
              : currentPublicTotal > 0
                ? fmtEuro(currentPublicTotal)
                : "—"
          }
          sub={
            bareme
              ? `${bareme.label}, brut annuel`
              : currentPublicTotal > 0
                ? "HATVP, période déclarée"
                : "non renseigné"
          }
        />
        <StatTile
          label="Coût public documenté"
          value={documentedPublicTotal > 0 ? fmtEuro(documentedPublicTotal) : "—"}
          sub={`${paidPublicRows.length} ligne${paidPublicRows.length > 1 ? "s" : ""} HATVP`}
        />
        <StatTile
          label="Mandats électifs"
          value={electedTotal > 0 ? fmtEuro(electedTotal) : "—"}
          sub="indemnités déclarées"
        />
        <StatTile
          label="Dépôt source"
          value={fmtShortDate(remuneration.latestDepotDate)}
          sub={`${remuneration.declarations.length} déclaration${remuneration.declarations.length > 1 ? "s" : ""}`}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-4">
          <SectionTitle
            title="CV vérifiable"
            meta={`${career.length} étape${career.length > 1 ? "s" : ""}`}
          />
          {career.length === 0 ? (
            <EmptyState>Parcours public en cours de collecte.</EmptyState>
          ) : (
            <ol className="divide-y divide-bureau-800/50 border-y border-bureau-800/50">
              {visibleCareer.map((entry) => (
                <CareerRow key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
          {hiddenCareer.length > 0 ? (
            <details className="group rounded-lg border border-bureau-800/50 bg-bureau-950/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300">
                <span>Voir {hiddenCareer.length} autre{hiddenCareer.length > 1 ? "s" : ""} étape{hiddenCareer.length > 1 ? "s" : ""}</span>
                <span className="text-bureau-600 group-open:rotate-180">▾</span>
              </summary>
              <ol className="divide-y divide-bureau-800/50 border-t border-bureau-800/50">
                {hiddenCareer.map((entry) => (
                  <CareerRow key={entry.id} entry={entry} />
                ))}
              </ol>
            </details>
          ) : null}
        </section>

        <section className="space-y-4">
          <SectionTitle
            title="Rémunérations publiques"
            meta={`${paidPublicRows.length} ligne${paidPublicRows.length > 1 ? "s" : ""}`}
          />
          {paidPublicRows.length === 0 ? (
            <EmptyState>Aucun montant public détaillé dans le dépôt HATVP.</EmptyState>
          ) : (
            <div className="rounded-lg border border-bureau-800/50 bg-bureau-950/30">
              <ul className="divide-y divide-bureau-800/50">
                {visiblePayRows.map((position) => (
                  <PayRow key={position.key} position={position} />
                ))}
              </ul>
              {hiddenPayRows.length > 0 ? (
                <details className="group border-t border-bureau-800/50">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300">
                    <span>Voir {hiddenPayRows.length} autre{hiddenPayRows.length > 1 ? "s" : ""} montant{hiddenPayRows.length > 1 ? "s" : ""}</span>
                    <span className="text-bureau-600 group-open:rotate-180">▾</span>
                  </summary>
                  <ul className="divide-y divide-bureau-800/50 border-t border-bureau-800/50">
                    {hiddenPayRows.map((position) => (
                      <PayRow key={position.key} position={position} />
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          )}
          <p className="text-xs leading-relaxed text-bureau-500">
            Les lignes peuvent couvrir des périodes partielles ou plusieurs
            années selon la déclaration HATVP. Les montants sans valeur publiée
            sont exclus du cumul.
          </p>
        </section>
      </div>

      {remuneration.yearlyBreakdown.length >= 2 ? (
        <section className="space-y-4">
          <SectionTitle title="Évolution annuelle déclarée" meta="HATVP" />
          <div className="rounded-lg border border-bureau-800/50 bg-bureau-950/30 px-4 py-4">
            <YearlyChart years={remuneration.yearlyBreakdown} />
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {otherCompensations.length > 0 ? (
          <details className="group rounded-lg border border-bureau-800/50 bg-bureau-950/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300">
              <span>Autres revenus déclarés, non assimilés au coût public</span>
              <span className="text-bureau-600 group-open:rotate-180">▾</span>
            </summary>
            <ul className="divide-y divide-bureau-800/50 border-t border-bureau-800/50">
              {otherCompensations.map((position) => (
                <PayRow key={position.key} position={position} />
              ))}
            </ul>
          </details>
        ) : null}

        <details className="group rounded-lg border border-bureau-800/50 bg-bureau-950/30">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300">
            <span>Déclarations d&apos;intérêts HATVP détaillées</span>
            <span className="text-bureau-600 group-open:rotate-180">▾</span>
          </summary>
          <div className="border-t border-bureau-800/50 p-4">
            <InteretsSection
              personnaliteId={personnaliteId}
              hatvpDossierId={hatvpDossierId}
            />
          </div>
        </details>
      </div>

      <details className="group rounded-lg border border-bureau-800/50 bg-bureau-950/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300">
          <span>Dossier patrimonial HATVP complet</span>
          <span className="text-bureau-600 group-open:rotate-180">▾</span>
        </summary>
        <div className="border-t border-bureau-800/50 p-4">
          <HatvpDossier
            personnaliteId={personnaliteId}
            prenom={prenom}
            nom={nom}
            hatvpDossierId={hatvpDossierId}
          />
        </div>
      </details>

      {remuneration.dataQualityNotes.length > 0 ? (
        <ul className="space-y-1 text-xs text-bureau-500">
          {remuneration.dataQualityNotes.map((note) => (
            <li key={note}>◇ {note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function SectionTitle({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-semibold uppercase text-bureau-500">{title}</h3>
      {meta ? <span className="text-xs text-bureau-600">{meta}</span> : null}
      <div className="h-px flex-1 bg-bureau-800/60" />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-bureau-800/60 bg-bureau-950/30 px-4 py-3">
      <p className="text-[11px] uppercase text-bureau-500">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums text-bureau-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-bureau-500">{sub}</p>
    </div>
  );
}

function CareerRow({ entry }: { entry: MergedCareerEntry }) {
  const source = formatSources(entry);
  const primarySource = entry.sources.find((s) => s.sourceUrl);

  return (
    <li className="grid gap-3 px-1 py-4 sm:grid-cols-[132px_minmax(0,1fr)]">
      <p className="text-xs tabular-nums text-bureau-500">{careerDate(entry)}</p>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-sm font-medium text-bureau-100">{entry.titre}</p>
          <span className="rounded border border-bureau-700/50 px-1.5 py-px text-[10px] uppercase text-bureau-500">
            {CATEGORY_LABEL[entry.categorie] ?? entry.categorie}
          </span>
        </div>
        {entry.organisation ? (
          <p className="mt-1 text-sm text-bureau-400">{entry.organisation}</p>
        ) : null}
        {entry.description ? (
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-bureau-500">
            {entry.description}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-bureau-600">
          Source :{" "}
          {primarySource?.sourceUrl ? (
            <a
              href={primarySource.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal"
            >
              {source}
            </a>
          ) : (
            source
          )}
        </p>
      </div>
    </li>
  );
}

function PayRow({ position }: { position: RemunerationsPosition }) {
  return (
    <li className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_128px]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-bureau-100">
          {cleanLabel(position.title)}
        </p>
        {position.organisation ? (
          <p className="mt-0.5 text-xs text-bureau-400">{position.organisation}</p>
        ) : null}
        <p className="mt-1 text-xs text-bureau-500">
          {periodLabel(position.dateDebut, position.dateFin)}
          {position.dateDepot ? ` · dépôt ${fmtShortDate(position.dateDepot)}` : ""}
        </p>
      </div>
      <p className="text-right font-mono text-sm tabular-nums text-bureau-100">
        {fmtEuro(position.montant)}
      </p>
    </li>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-bureau-800/50 bg-bureau-950/30 px-4 py-3 text-sm text-bureau-500">
      {children}
    </div>
  );
}
