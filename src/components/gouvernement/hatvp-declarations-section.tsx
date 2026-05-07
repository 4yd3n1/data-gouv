import type { ReactNode } from "react";
import { SourceChip } from "@/components/source-chip";
import {
  getDossierData,
  type DiData,
  type DiPosition,
  type DspData,
  type DspRowLite,
} from "@/lib/dossier-data";
import { DSP_SECTIONS, dspLong, dspShort } from "@/lib/dossier-titles";
import { fmtEuro, fmtShortDate } from "@/lib/format";
import { normalizeName } from "@/lib/normalize-name";

type Props = {
  personnaliteId: string;
  prenom: string;
  nom: string;
  hatvpDossierId: string | null;
};

type IncomeSection = "professionnel" | "consultant" | "mandat_electif";

type IncomePosition = DiPosition & {
  section: IncomeSection;
  key: string;
};

const PUBLIC_ROLE_RE =
  /\b(ministre|premier ministre|secretaire d'etat|garde des sceaux|depute|senateur|maire|adjoint|conseiller|president|vice president|assemblee nationale|senat|gouvernement|ministere|collectivite|region|departement|commune|fonction publique)\b/;

const NON_PUBLIC_INCOME_RE =
  /\b(droits? d'auteurs?|auteurs?|ouvrage|livre|avance|edition|editeur|humensis|consultant|conseil|cabinet|sarl|sas|societe|entreprise|avocat|banque)\b/;

const ASSET_KEYS = [
  "Valeur vénale",
  "Solde",
  "Valeur de rachat",
  "Valeur vénale totale des parts détenues",
];

const LIABILITY_KEYS = [
  "Somme restant à rembourser",
  "Montant total de l'emprunt",
  "Montant des mensualités",
];

export async function HatvpDeclarationsSection({
  personnaliteId,
  prenom,
  nom,
  hatvpDossierId,
}: Props) {
  const dossier = await getDossierData({
    personnaliteId,
    prenom,
    nom,
    hatvpDossierId,
  });
  const { di, dsp, synthesis } = dossier;
  const hatvpUrl = hatvpDossierId ? `https://www.hatvp.fr${hatvpDossierId}` : null;

  const income = di ? getIncomePositions(di) : [];
  const publicIncome = income.filter((p) => isPublicIncome(p) && positionTotal(p) > 0);
  const nonPublicIncome = income.filter(
    (p) => !isPublicIncome(p) && positionTotal(p) > 0,
  );
  const electedIncome = income.filter(
    (p) => p.section === "mandat_electif" && positionTotal(p) > 0,
  );
  const publicTotal = sumPositions(publicIncome);
  const nonPublicTotal = sumPositions(nonPublicIncome);
  const electedTotal = sumPositions(electedIncome);

  return (
    <section className="space-y-8 fade-up">
      <header className="border-y border-bureau-800/50 py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bureau-500">
              Déclarations HATVP
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-bureau-50 sm:text-3xl">
              DI et DSP, lisibles au même endroit
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bureau-400">
              La DI recense les intérêts, activités et revenus déclarés. La DSP
              recense le patrimoine et le passif déclarés. Les revenus non
              publics sont séparés des rémunérations publiques.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SourceChip
              outlet="HATVP"
              url={di?.hatvpPageUrl ?? hatvpUrl}
              date={di?.dateDepot}
              type="officiel"
              basis="DI"
            />
            <SourceChip
              outlet="HATVP"
              url={dsp?.sourcePdfUrl ?? hatvpUrl}
              date={dsp?.dateDepot}
              type="officiel"
              basis="DSP"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <DeclarationSummaryCard
          kind="DI"
          title="Déclaration d'intérêts"
          date={di?.dateDepot ?? null}
          missing={!di}
          rows={[
            { label: "Revenus publics déclarés", value: publicTotal > 0 ? fmtEuro(publicTotal) : "—" },
            { label: "Revenus non publics", value: nonPublicTotal > 0 ? fmtEuro(nonPublicTotal) : "—" },
            { label: "Mandats électifs", value: electedTotal > 0 ? fmtEuro(electedTotal) : "—" },
            {
              label: "Participations financières",
              value: di ? (di.participations.length > 0 ? String(di.participations.length) : "Néant") : "—",
            },
          ]}
        />
        <DeclarationSummaryCard
          kind="DSP"
          title="Déclaration de situation patrimoniale"
          date={dsp?.dateDepot ?? null}
          missing={!dsp}
          rows={[
            { label: "Actifs déclarés", value: dsp ? fmtEuro(synthesis.actifs) : "—" },
            { label: "Passif déclaré", value: dsp ? fmtEuro(synthesis.passifs) : "—" },
            { label: "Patrimoine net", value: dsp ? fmtEuro(synthesis.patrimoineNet) : "—" },
            {
              label: "Sections renseignées",
              value: dsp ? String(nonEmptyDspSections(dsp).length) : "—",
            },
          ]}
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
        <DiPanel
          di={di}
          publicIncome={publicIncome}
          nonPublicIncome={nonPublicIncome}
          electedIncome={electedIncome}
        />
        <DspPanel dsp={dsp} actifs={synthesis.actifs} passifs={synthesis.passifs} />
      </div>

      <p className="rounded-lg border border-bureau-800/50 bg-bureau-950/30 px-4 py-3 text-xs leading-relaxed text-bureau-500">
        Source officielle HATVP pour {prenom} {nom}. Les
        montants sont ceux déclarés par l'intéressé, parfois sur des périodes
        partielles ou pluriannuelles ; ils ne constituent pas une paie certifiée
        ni un coût employeur complet.
      </p>
    </section>
  );
}

function DiPanel({
  di,
  publicIncome,
  nonPublicIncome,
  electedIncome,
}: {
  di: DiData | null;
  publicIncome: IncomePosition[];
  nonPublicIncome: IncomePosition[];
  electedIncome: IncomePosition[];
}) {
  if (!di) {
    return (
      <Panel title="DI — Déclaration d'intérêts" meta="Non synchronisée">
        <EmptyState>
          Aucune déclaration d'intérêts n'est synchronisée pour ce profil.
        </EmptyState>
      </Panel>
    );
  }

  const dirigeants = di.positionsByType.dirigeant ?? [];
  const publicOfficeIncome = publicIncome.filter(
    (position) => position.section !== "mandat_electif",
  );

  return (
    <Panel
      title="DI — Déclaration d'intérêts"
      meta={depositLabel(di.dateDepot)}
    >
      <IncomeList
        title="Fonctions publiques et gouvernementales"
        description="Rémunérations et indemnités publiques déclarées hors mandats électifs."
        rows={publicOfficeIncome}
        empty="Aucun montant public détaillé dans cette DI."
      />

      <IncomeList
        title="Revenus non publics déclarés"
        description="Revenus privés ou autres revenus non financés comme une rémunération publique."
        rows={nonPublicIncome}
        empty="Aucun revenu non public déclaré dans cette DI."
        badge="Non public"
      />

      {electedIncome.length > 0 ? (
        <IncomeList
          title="Mandats électifs"
          description="Indemnités de mandats électifs déclarées séparément dans la DI."
          rows={electedIncome}
          empty=""
        />
      ) : null}

      <InterestOverview
        dirigeants={dirigeants}
        participations={di.participations}
        conjoint={di.conjoint}
        benevole={di.benevole}
      />
    </Panel>
  );
}

function DspPanel({
  dsp,
  actifs,
  passifs,
}: {
  dsp: DspData | null;
  actifs: number;
  passifs: number;
}) {
  if (!dsp) {
    return (
      <Panel title="DSP — Situation patrimoniale" meta="Non synchronisée">
        <EmptyState>
          Aucune déclaration de situation patrimoniale n'est synchronisée pour
          ce profil.
        </EmptyState>
      </Panel>
    );
  }

  const sections = nonEmptyDspSections(dsp);
  const priority = sections.filter((s) => [1, 5, 6, 12].includes(s.num));
  const other = sections.filter((s) => ![1, 5, 6, 12].includes(s.num));

  return (
    <Panel
      title="DSP — Situation patrimoniale"
      meta={depositLabel(dsp.dateDepot)}
    >
      <dl className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <SimpleMetric label="Actifs" value={fmtEuro(actifs)} />
        <SimpleMetric label="Passif" value={fmtEuro(passifs)} tone="amber" />
        <SimpleMetric label="Net" value={fmtEuro(actifs - passifs)} tone="teal" />
      </dl>

      <div className="space-y-3">
        {priority.map((section) => (
          <DspSection key={section.num} num={section.num} rows={section.rows} open />
        ))}
        {other.map((section) => (
          <DspSection key={section.num} num={section.num} rows={section.rows} />
        ))}
      </div>

      {sections.length === 0 ? (
        <EmptyState>Toutes les rubriques de la DSP sont déclarées néant.</EmptyState>
      ) : null}
    </Panel>
  );
}

function DeclarationSummaryCard({
  kind,
  title,
  date,
  missing,
  rows,
}: {
  kind: "DI" | "DSP";
  title: string;
  date: Date | null;
  missing: boolean;
  rows: { label: string; value: string }[];
}) {
  return (
    <article className="rounded-lg border border-bureau-800/60 bg-bureau-950/30">
      <div className="flex items-start justify-between gap-3 border-b border-bureau-800/60 px-4 py-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-teal/90">
            {kind}
          </p>
          <h3 className="mt-1 text-base font-semibold text-bureau-100">{title}</h3>
        </div>
        <span
          className={`rounded border px-2 py-1 text-[10px] uppercase tracking-[0.1em] ${
            missing
              ? "border-amber-700/40 text-amber-300"
              : "border-bureau-700/50 text-bureau-400"
          }`}
        >
          {missing ? "Manquante" : date ? fmtShortDate(date) : "Non datée"}
        </span>
      </div>
      <dl className="grid gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-bureau-500">
              {row.label}
            </dt>
            <dd className="mt-1 font-display text-xl tabular-nums text-bureau-50">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Panel({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-bureau-500">
          {title}
        </h3>
        <span className="text-xs text-bureau-600">{meta}</span>
        <div className="h-px flex-1 bg-bureau-800/60" />
      </div>
      {children}
    </section>
  );
}

function IncomeList({
  title,
  description,
  rows,
  empty,
  badge,
}: {
  title: string;
  description: string;
  rows: IncomePosition[];
  empty: string;
  badge?: string;
}) {
  const visible = rows.slice(0, 6);
  const hidden = rows.slice(6);

  return (
    <section className="rounded-lg border border-bureau-800/60 bg-bureau-950/30">
      <header className="border-b border-bureau-800/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-bureau-100">{title}</h4>
          <span className="font-mono text-xs tabular-nums text-bureau-400">
            {rows.length > 0 ? fmtEuro(sumPositions(rows)) : "—"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-bureau-500">
          {description}
        </p>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-3 text-sm text-bureau-500">{empty}</div>
      ) : (
        <>
          <ul className="divide-y divide-bureau-800/60">
            {visible.map((position) => (
              <IncomeRow key={position.key} position={position} badge={badge} />
            ))}
          </ul>
          {hidden.length > 0 ? (
            <details className="group border-t border-bureau-800/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-300 hover:text-bureau-100">
                <span>
                  Voir {hidden.length} autre{hidden.length > 1 ? "s" : ""} ligne
                  {hidden.length > 1 ? "s" : ""}
                </span>
                <span className="text-bureau-600 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <ul className="divide-y divide-bureau-800/60 border-t border-bureau-800/60">
                {hidden.map((position) => (
                  <IncomeRow key={position.key} position={position} badge={badge} />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}

function IncomeRow({
  position,
  badge,
}: {
  position: IncomePosition;
  badge?: string;
}) {
  const total = positionTotal(position);
  const sortedAmounts = [...position.amounts].sort((a, b) => a.year - b.year);
  const title = displayText(
    cleanText(position.employeur) || cleanText(position.description) || "Activité déclarée",
  );
  const subtitle =
    position.description && displayText(cleanText(position.description)) !== title
      ? displayText(cleanText(position.description))
      : null;

  return (
    <li className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-bureau-100">{title}</p>
          {badge ? (
            <span className="rounded border border-amber-700/40 px-1.5 py-px text-[10px] uppercase tracking-[0.08em] text-amber-300">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-bureau-400">
            {subtitle}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-bureau-500">{positionPeriod(position)}</p>
      </div>
      <div className="font-mono text-sm tabular-nums text-bureau-100 sm:text-right">
        {sortedAmounts.length <= 1 ? (
          <>
            <p>{fmtEuro(total)}</p>
            {sortedAmounts[0]?.year ? (
              <p className="mt-0.5 text-[11px] text-bureau-500">
                {sortedAmounts[0].year}
              </p>
            ) : null}
          </>
        ) : (
          <details className="group">
            <summary className="cursor-pointer list-none text-bureau-100 hover:text-teal">
              <span>{fmtEuro(total)}</span>
              <span className="ml-1 text-[11px] text-bureau-500">
                {sortedAmounts.length} ans
              </span>
            </summary>
            <ul className="mt-1 space-y-0.5 text-[11px] text-bureau-400">
              {sortedAmounts.map((amount) => (
                <li key={amount.year} className="flex justify-between gap-4">
                  <span>{amount.year}</span>
                  <span>{fmtEuro(amount.montant)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  );
}

function InterestOverview({
  dirigeants,
  participations,
  conjoint,
  benevole,
}: {
  dirigeants: DiPosition[];
  participations: DiData["participations"];
  conjoint: DiData["conjoint"];
  benevole: DiData["benevole"];
}) {
  return (
    <section className="rounded-lg border border-bureau-800/60 bg-bureau-950/30">
      <header className="border-b border-bureau-800/60 px-4 py-3">
        <h4 className="text-sm font-semibold text-bureau-100">
          Autres intérêts déclarés
        </h4>
      </header>
      <div className="divide-y divide-bureau-800/60">
        <InterestDetails
          label="Organes dirigeants et organismes"
          count={dirigeants.length}
        >
          <DiPositionMiniList rows={dirigeants} empty="Aucun organe dirigeant déclaré." />
        </InterestDetails>
        <InterestDetails
          label="Participations financières directes"
          count={participations.length}
          neantLabel="Néant"
        >
          {participations.length === 0 ? (
            <EmptyState>Aucune participation financière directe déclarée.</EmptyState>
          ) : (
            <ul className="divide-y divide-bureau-800/60">
              {participations.map((p) => (
                <li key={p.nomSociete} className="grid gap-3 py-2 sm:grid-cols-[minmax(0,1fr)_130px]">
                  <div>
                    <p className="text-sm text-bureau-100">{p.nomSociete}</p>
                    <p className="mt-0.5 text-xs text-bureau-500">
                      {[p.capitalDetenu && `capital ${p.capitalDetenu}`, p.nombreParts && `${p.nombreParts} parts`]
                        .filter(Boolean)
                        .join(" · ") || "Détail non renseigné"}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-bureau-100 sm:text-right">
                    {fmtEuro(p.evaluation)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </InterestDetails>
        <InterestDetails label="Activités du conjoint" count={conjoint.length}>
          <TextMiniList
            rows={conjoint.map((c) => ({
              title: c.organisation ?? c.contenu,
              description: c.organisation ? c.contenu : null,
            }))}
            empty="Aucune activité du conjoint déclarée."
          />
        </InterestDetails>
        <InterestDetails label="Fonctions bénévoles" count={benevole.length}>
          <TextMiniList
            rows={benevole.map((b) => ({
              title: b.organisation ?? b.contenu,
              description: b.organisation ? b.contenu : null,
            }))}
            empty="Aucune fonction bénévole déclarée."
          />
        </InterestDetails>
      </div>
    </section>
  );
}

function InterestDetails({
  label,
  count,
  neantLabel,
  children,
}: {
  label: string;
  count: number;
  neantLabel?: string;
  children: ReactNode;
}) {
  return (
    <details className="group" open={count > 0 && count <= 4}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-bureau-200 hover:text-bureau-50">
        <span>{label}</span>
        <span className="flex items-center gap-2 text-xs text-bureau-500">
          {count > 0 ? `${count} ligne${count > 1 ? "s" : ""}` : (neantLabel ?? "0")}
          <span className="transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="border-t border-bureau-800/60 px-4 py-3">{children}</div>
    </details>
  );
}

function DspSection({
  num,
  rows,
  open = false,
}: {
  num: number;
  rows: DspRowLite[];
  open?: boolean;
}) {
  return (
    <details
      className="group rounded-lg border border-bureau-800/60 bg-bureau-950/30"
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-bureau-900/30">
        <span>
          <span className="mr-2 font-mono text-[11px] text-teal/80">{num}°</span>
          <span className="text-sm font-medium text-bureau-100" title={dspLong(num)}>
            {dspShort(num)}
          </span>
        </span>
        <span className="flex items-center gap-2 text-xs text-bureau-500">
          {rows.length} ligne{rows.length > 1 ? "s" : ""}
          <span className="transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="divide-y divide-bureau-800/60 border-t border-bureau-800/60">
        {rows.map((row, index) => (
          <DspRow key={`${row.rubriqueNum}-${row.ordre}-${index}`} row={row} />
        ))}
      </div>
    </details>
  );
}

function DspRow({ row }: { row: DspRowLite }) {
  const title = dspRowTitle(row);
  const detail = dspRowDetail(row);
  const values = dspValueEntries(row);

  return (
    <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_180px]">
      <div className="min-w-0">
        <p className="font-medium text-bureau-100">{title}</p>
        {detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-bureau-500">
            {detail}
          </p>
        ) : null}
      </div>
      <div className="space-y-0.5 font-mono text-xs tabular-nums text-bureau-200 sm:text-right">
        {values.length === 0 ? (
          <span className="text-bureau-500">—</span>
        ) : (
          values.map(([label, value]) => (
            <p key={label}>
              <span className="mr-2 text-bureau-500">{shortValueLabel(label)}</span>
              <span className={row.rubriqueNum === 12 ? "text-amber-300" : "text-bureau-100"}>
                {formatValue(value)}
              </span>
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function DiPositionMiniList({
  rows,
  empty,
}: {
  rows: DiPosition[];
  empty: string;
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-bureau-800/60">
      {rows.map((row, index) => (
        <li key={`${row.employeur ?? ""}-${row.description ?? ""}-${index}`} className="py-2">
          <p className="text-sm text-bureau-100">
            {displayText(cleanText(row.employeur) || cleanText(row.description) || "Activité déclarée")}
          </p>
          {row.description && cleanText(row.description) !== cleanText(row.employeur) ? (
            <p className="mt-0.5 text-xs text-bureau-500">
              {displayText(cleanText(row.description))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function TextMiniList({
  rows,
  empty,
}: {
  rows: { title: string; description: string | null }[];
  empty: string;
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-bureau-800/60">
      {rows.map((row, index) => (
        <li key={`${row.title}-${index}`} className="py-2">
          <p className="text-sm text-bureau-100">{displayText(cleanText(row.title))}</p>
          {row.description ? (
            <p className="mt-0.5 text-xs text-bureau-500">
              {displayText(cleanText(row.description))}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SimpleMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "teal";
}) {
  const valueClass =
    tone === "amber"
      ? "text-amber-300"
      : tone === "teal"
        ? "text-teal"
        : "text-bureau-50";

  return (
    <div className="rounded-lg border border-bureau-800/60 bg-bureau-950/30 px-4 py-3">
      <dt className="text-[11px] uppercase tracking-[0.08em] text-bureau-500">
        {label}
      </dt>
      <dd className={`mt-1 font-display text-2xl tabular-nums ${valueClass}`}>
        {value}
      </dd>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-bureau-800/50 bg-bureau-950/30 px-4 py-3 text-sm text-bureau-500">
      {children}
    </div>
  );
}

function getIncomePositions(di: DiData): IncomePosition[] {
  const entries: Array<[IncomeSection, DiPosition[]]> = [
    ["professionnel", di.positionsByType.professionnel ?? []],
    ["consultant", di.positionsByType.consultant ?? []],
    ["mandat_electif", di.positionsByType.mandat_electif ?? []],
  ];

  return entries
    .flatMap(([section, positions]) =>
      positions.map((position, index) => ({
        ...position,
        section,
        key: `${section}-${position.employeur ?? ""}-${position.description ?? ""}-${index}`,
      })),
    )
    .sort((a, b) => (b.yearEnd ?? 0) - (a.yearEnd ?? 0));
}

function isPublicIncome(position: IncomePosition): boolean {
  if (position.section === "mandat_electif") return true;
  const text = plain(`${position.employeur ?? ""} ${position.description ?? ""}`);
  if (NON_PUBLIC_INCOME_RE.test(text)) return false;
  return PUBLIC_ROLE_RE.test(text);
}

function positionTotal(position: DiPosition): number {
  return position.amounts.reduce((sum, amount) => sum + amount.montant, 0);
}

function sumPositions(positions: DiPosition[]): number {
  return positions.reduce((sum, position) => sum + positionTotal(position), 0);
}

function positionPeriod(position: DiPosition): string {
  if (position.yearStart == null && position.yearEnd == null) {
    return "Période non renseignée";
  }
  if (position.yearStart === position.yearEnd) return String(position.yearStart);
  return `${position.yearStart ?? "?"} – ${position.yearEnd ?? "?"}`;
}

function nonEmptyDspSections(dsp: DspData): { num: number; rows: DspRowLite[] }[] {
  return DSP_SECTIONS.map((section) => ({
    num: section.num,
    rows: (dsp.rowsByRubrique.get(section.num) ?? []).filter((row) => !row.isNeant),
  })).filter((section) => section.rows.length > 0);
}

function dspRowTitle(row: DspRowLite): string {
  const description = row.description ?? {};
  const raw = stringValue(description["_raw"]);

  if (row.rubriqueNum === 1) {
    return displayText(cleanText(stringValue(description["Type"]) || "Bien immobilier"));
  }
  if (row.rubriqueNum === 5) {
    return displayText(cleanText(stringValue(description["Etablissement"]) || "Assurance vie"));
  }
  if (row.rubriqueNum === 6) {
    return displayText(cleanText(stringValue(description["Description"]) || raw || "Compte ou épargne"));
  }
  if (row.rubriqueNum === 12) {
    return displayText(cleanText(stringValue(description["Créancier"]) || "Passif"));
  }

  return displayText(cleanText(
    stringValue(description["Dénomination"]) ||
      stringValue(description["Description"]) ||
      raw ||
      row.rubriqueTitre,
  ));
}

function dspRowDetail(row: DspRowLite): string {
  const description = row.description ?? {};
  const pairs =
    row.rubriqueNum === 1
      ? [
          stringValue(description["Superficie bâtie"]),
          stringValue(description["Département"]) && `Dpt ${description["Département"]}`,
          stringValue(description["Date d'acquisition"]) && `acquis ${description["Date d'acquisition"]}`,
          stringValue(description["Quote-part détenue"]),
        ]
      : row.rubriqueNum === 5
        ? [
            stringValue(description["Date de souscription"]) &&
              `souscrit ${description["Date de souscription"]}`,
            stringValue(description["Souscripteur"]),
          ]
        : row.rubriqueNum === 12
          ? [
              stringValue(description["Nature"]),
              stringValue(description["Date"]) && `signé ${description["Date"]}`,
              stringValue(description["Objet"]),
            ]
          : Object.entries(description)
              .filter(([key]) => key !== "_raw" && key !== "Description")
              .slice(0, 4)
              .map(([key, value]) => `${key} : ${formatValue(value)}`);

  return pairs.filter(Boolean).map((p) => cleanText(String(p))).join(" · ");
}

function dspValueEntries(row: DspRowLite): [string, unknown][] {
  const values = Object.entries(row.valeur ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
  const priority = row.rubriqueNum === 12 ? LIABILITY_KEYS : ASSET_KEYS;
  const priorityEntries = priority
    .map((key) => values.find(([label]) => label === key))
    .filter((entry): entry is [string, unknown] => Boolean(entry));
  const rest = values.filter(([label]) => !priority.includes(label)).slice(0, 2);
  return [...priorityEntries, ...rest];
}

function shortValueLabel(label: string): string {
  if (label === "Valeur vénale") return "Valeur";
  if (label === "Prix d'acquisition") return "Acquis.";
  if (label === "Valeur de rachat") return "Rachat";
  if (label === "Somme restant à rembourser") return "Restant";
  if (label === "Montant total de l'emprunt") return "Emprunt";
  if (label === "Montant des mensualités") return "Mensualité";
  return label.length > 12 ? `${label.slice(0, 12)}.` : label;
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return fmtEuro(value);
  if (typeof value === "string") return cleanText(value);
  if (value == null) return "—";
  return JSON.stringify(value);
}

function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value
    .replace(/\s*\[Données non publiées\]\s*/gi, " ")
    .replace(/m\s*2\b/g, "m²")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned && /\[Données non publiées\]/i.test(value)) {
    return "Donnée non publiée";
  }
  return cleaned;
}

function displayText(value: string): string {
  if (!value) return "";
  if (value === value.toLowerCase()) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
}

function depositLabel(date: Date | null): string {
  return date ? `Dépôt ${fmtShortDate(date)}` : "Dépôt non daté";
}

function plain(value: string): string {
  return normalizeName(cleanText(value)).replace(/\s+/g, " ").trim();
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
