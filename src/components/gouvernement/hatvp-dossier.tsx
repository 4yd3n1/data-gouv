import Link from "next/link";
import { fmtEuro } from "@/lib/format";
import {
  getDossierData,
  HEAVY_SECTION_THRESHOLD,
  type DiPosition,
  type DiData,
  type DspData,
  type DspRowLite,
  type DossierSynthesis,
} from "@/lib/dossier-data";
import {
  DI_SECTIONS,
  DSP_SECTIONS,
  diShort,
  diLong,
  dspShort,
  dspLong,
} from "@/lib/dossier-titles";
import type { RemunerationsYear } from "@/lib/remunerations";
import { YearlyChart } from "./yearly-revenue-chart";

export async function HatvpDossier({
  personnaliteId,
  prenom,
  nom,
  hatvpDossierId,
}: {
  personnaliteId: string;
  prenom: string;
  nom: string;
  hatvpDossierId: string | null;
}) {
  const data = await getDossierData({ personnaliteId, prenom, nom, hatvpDossierId });
  const { di, dsp, synthesis, identity, yearlyRevenues } = data;

  if (!di && !dsp) {
    return (
      <div className="rounded-xl border border-bureau-700/20 bg-bureau-800/10 px-4 py-3 text-xs text-bureau-500">
        Aucune déclaration HATVP synchronisée.
      </div>
    );
  }

  return (
    <article className="space-y-5">
      <IdentityStrip identity={identity} di={di} dsp={dsp} />
      <SynthesisHero synthesis={synthesis} hasDi={!!di} hasDsp={!!dsp} />
      {yearlyRevenues.length >= 2 && <ChronologyBlock years={yearlyRevenues} />}
      <SectionNav synthesis={synthesis} hasDi={!!di} hasDsp={!!dsp} />

      {di && <DiBody di={di} />}
      {dsp && <DspBody dsp={dsp} />}

      <AttestationFooter prenom={prenom} nom={nom} di={di} dsp={dsp} />
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Chronologie des revenus déclarés — stacked bars across DI exercices    */
/* ─────────────────────────────────────────────────────────────────────── */

function ChronologyBlock({ years }: { years: RemunerationsYear[] }) {
  return (
    <section
      aria-labelledby="dossier-chronologie"
      className="rounded-xl border border-bureau-700/30 bg-bureau-900/30 px-5 py-4 space-y-4"
    >
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-teal/90">
          Chronologie des revenus déclarés
        </p>
        <h3
          id="dossier-chronologie"
          className="text-base font-semibold text-bureau-100"
        >
          Agrégation HATVP par exercice, ventilée par nature
        </h3>
      </div>
      <YearlyChart years={years} />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Identity strip                                                          */
/* ─────────────────────────────────────────────────────────────────────── */

function IdentityStrip({
  identity,
  di,
  dsp,
}: {
  identity: { prenom: string; nom: string; organe: string | null };
  di: DiData | null;
  dsp: DspData | null;
}) {
  return (
    <header className="rounded-xl border border-bureau-700/30 bg-bureau-900/40 overflow-hidden">
      <div className="bg-bureau-950/80 border-b border-bureau-700/30 px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-teal/90">
          Dossier HATVP
        </span>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-bureau-400 font-mono">
          {di && <span>DI · {di.declarationRef.slice(0, 8)}</span>}
          {di && dsp && <span className="text-bureau-700">·</span>}
          {dsp && <span>{dsp.typeDeclaration} · {dsp.declarationRef}</span>}
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-base font-semibold text-bureau-100">
            {identity.nom.toUpperCase()} {identity.prenom}
          </p>
          {identity.organe && (
            <p className="text-xs text-bureau-400 mt-0.5">{identity.organe}</p>
          )}
          <p className="text-[11px] text-bureau-500 mt-1">
            {di?.dateDepot && (
              <>
                Intérêts déposés le{" "}
                <time>
                  {di.dateDepot.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
            {di?.dateDepot && dsp?.dateDepot && " · "}
            {dsp?.dateDepot && (
              <>
                Patrimoine déposé le{" "}
                <time>
                  {dsp.dateDepot.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </time>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {di?.hatvpPageUrl && (
            <Link
              href={di.hatvpPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bureau-400 hover:text-teal"
            >
              Page HATVP ↗
            </Link>
          )}
          {dsp?.sourcePdfUrl && (
            <Link
              href={dsp.sourcePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline"
            >
              PDF officiel (DSP) ↗
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Synthesis hero — 6 numbers (3 DI + 3 DSP)                              */
/* ─────────────────────────────────────────────────────────────────────── */

function SynthesisHero({
  synthesis,
  hasDi,
  hasDsp,
}: {
  synthesis: DossierSynthesis;
  hasDi: boolean;
  hasDsp: boolean;
}) {
  return (
    <div className="rounded-xl border border-bureau-700/30 bg-bureau-900/30 px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:divide-x md:divide-bureau-700/30">
        {hasDi && (
          <div className="md:pr-5">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-bureau-500 mb-3">
              Rémunérations
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label={
                  synthesis.remuActuelAnnee
                    ? `Année ${synthesis.remuActuelAnnee}`
                    : "Actuel"
                }
                value={fmtEuro(synthesis.remuActuel)}
              />
              <Stat
                label="Cumul déclaré"
                value={fmtEuro(synthesis.remuCumul)}
                tone="muted"
              />
              <Stat
                label="Période"
                value={
                  synthesis.remuPeriode
                    ? `${synthesis.remuPeriode.start}–${synthesis.remuPeriode.end}`
                    : "—"
                }
                tone="muted"
              />
            </div>
          </div>
        )}
        {hasDsp && (
          <div className="md:pl-5">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-bureau-500 mb-3">
              Patrimoine
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Actifs" value={fmtEuro(synthesis.actifs)} />
              <Stat
                label="Passifs"
                value={`-${fmtEuro(synthesis.passifs).replace("-", "")}`}
                tone="warn"
              />
              <Stat
                label="Patrimoine net"
                value={fmtEuro(synthesis.patrimoineNet)}
                tone={synthesis.patrimoineNet >= 0 ? "good" : "warn"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "good" | "warn";
}) {
  const colorClass =
    tone === "warn"
      ? "text-amber-400"
      : tone === "good"
        ? "text-teal"
        : tone === "muted"
          ? "text-bureau-300"
          : "text-bureau-100";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-bureau-500">{label}</p>
      <p className={`mt-1 text-base md:text-lg font-semibold tabular-nums ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Section nav — chip strip with anchor links                              */
/* ─────────────────────────────────────────────────────────────────────── */

function SectionNav({
  synthesis,
  hasDi,
  hasDsp,
}: {
  synthesis: DossierSynthesis;
  hasDi: boolean;
  hasDsp: boolean;
}) {
  return (
    <nav
      aria-label="Sections du dossier"
      className="sticky top-0 z-10 -mx-5 px-5 py-2 bg-bureau-950/90 backdrop-blur border-y border-bureau-700/30"
    >
      <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap text-[11px] text-bureau-400">
        {hasDi && (
          <>
            <span className="font-semibold uppercase tracking-wider text-bureau-500">DI</span>
            {DI_SECTIONS.map((s) => {
              const count = synthesis.diSectionCounts[s.num] ?? 0;
              return <NavChip key={`di-${s.num}`} href={`#di-${s.num}`} num={s.num} count={count} />;
            })}
          </>
        )}
        {hasDi && hasDsp && <span className="text-bureau-700">|</span>}
        {hasDsp && (
          <>
            <span className="font-semibold uppercase tracking-wider text-bureau-500">DSP</span>
            {DSP_SECTIONS.map((s) => {
              const count = synthesis.dspSectionCounts[s.num] ?? 0;
              return <NavChip key={`dsp-${s.num}`} href={`#dsp-${s.num}`} num={s.num} count={count} />;
            })}
          </>
        )}
      </div>
    </nav>
  );
}

function NavChip({ href, num, count }: { href: string; num: number; count: number }) {
  const isEmpty = count === 0;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 font-mono ${
        isEmpty ? "text-bureau-700" : "text-bureau-300 hover:text-teal"
      }`}
    >
      <span>§{num}°</span>
      {!isEmpty && <span className="text-[10px] text-bureau-500">{count}</span>}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* DI body                                                                 */
/* ─────────────────────────────────────────────────────────────────────── */

function DiBody({ di }: { di: DiData }) {
  const sec1 = di.positionsByType.professionnel ?? [];
  const sec2 = di.positionsByType.consultant ?? [];
  const sec3 = di.positionsByType.dirigeant ?? [];
  const sec7 = di.positionsByType.mandat_electif ?? [];

  // Rule per section: Néant if no data; heavy if >threshold; else inline
  const sectionsWithData: { num: number; node: React.ReactNode }[] = [];
  const emptyNums: number[] = [];

  // §1°
  if (sec1.length > 0) {
    sectionsWithData.push({
      num: 1,
      node: (
        <DiPositionsSection
          num={1}
          positions={sec1}
          rightHeader="Rémunération ou gratification"
          synthesisLabel="Cumul"
        />
      ),
    });
  } else emptyNums.push(1);

  // §2°
  if (sec2.length > 0) {
    sectionsWithData.push({
      num: 2,
      node: (
        <DiPositionsSection
          num={2}
          positions={sec2}
          rightHeader="Rémunération ou gratification"
          synthesisLabel="Cumul"
        />
      ),
    });
  } else emptyNums.push(2);

  // §3° (heavy)
  if (sec3.length > 0) {
    sectionsWithData.push({ num: 3, node: <DiDirigeantSection positions={sec3} /> });
  } else emptyNums.push(3);

  // §4°
  if (di.participations.length > 0) {
    sectionsWithData.push({
      num: 4,
      node: <DiParticipationsSection participations={di.participations} />,
    });
  } else emptyNums.push(4);

  // §5°
  if (di.conjoint.length > 0) {
    sectionsWithData.push({ num: 5, node: <DiConjointSection conjoint={di.conjoint} /> });
  } else emptyNums.push(5);

  // §6°
  if (di.benevole.length > 0) {
    sectionsWithData.push({ num: 6, node: <DiBenevoleSection benevole={di.benevole} /> });
  } else emptyNums.push(6);

  // §7°
  if (sec7.length > 0) {
    sectionsWithData.push({
      num: 7,
      node: (
        <DiPositionsSection
          num={7}
          positions={sec7}
          rightHeader="Rémunération, indemnité ou gratification"
          synthesisLabel="Cumul"
        />
      ),
    });
  } else emptyNums.push(7);

  return (
    <section className="space-y-3">
      <DeclHeader kind="DI" titre="Déclaration d'intérêts" />
      {sectionsWithData.map(({ num, node }) => (
        <div key={num}>{node}</div>
      ))}
      {emptyNums.length > 0 && <NeantStrip kind="di" nums={emptyNums} />}
    </section>
  );
}

/* DI section types ─────────────────────────────────────────────────────── */

function DiPositionsSection({
  num,
  positions,
  rightHeader,
  synthesisLabel,
}: {
  num: number;
  positions: DiPosition[];
  rightHeader: string;
  synthesisLabel: string;
}) {
  const totalNet = positions.reduce(
    (s, p) => s + p.amounts.reduce((sx, a) => sx + a.montant, 0),
    0,
  );

  return (
    <SectionShell
      id={`di-${num}`}
      num={num}
      kind="di"
      rightHeader={rightHeader}
      synthesis={
        positions.length > 0
          ? `${synthesisLabel} · ${fmtEuro(totalNet)} sur la période`
          : null
      }
    >
      <div className="divide-y divide-bureau-700/20">
        {positions.map((p, i) => (
          <DiPositionRow key={i} pos={p} />
        ))}
      </div>
    </SectionShell>
  );
}

function DiPositionRow({ pos }: { pos: DiPosition }) {
  const sortedAmounts = [...pos.amounts].sort((a, b) => a.year - b.year);
  const total = sortedAmounts.reduce((s, a) => s + a.montant, 0);
  const periodLabel =
    pos.yearStart != null && pos.yearEnd != null
      ? pos.yearStart === pos.yearEnd
        ? `${pos.yearStart}`
        : `${pos.yearStart} – ${pos.yearEnd}`
      : "";

  return (
    <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 text-sm">
      <div className="text-bureau-200 leading-snug">
        {pos.employeur && (
          <p className="text-bureau-100">{pos.employeur}</p>
        )}
        {pos.description && (
          <p className="text-xs text-bureau-300">{pos.description}</p>
        )}
        {periodLabel && (
          <p className="text-[11px] text-bureau-500 mt-0.5">{periodLabel}</p>
        )}
      </div>
      <div className="font-mono text-xs text-bureau-200">
        {sortedAmounts.length === 0 ? (
          <span className="text-bureau-500">—</span>
        ) : sortedAmounts.length === 1 ? (
          <p className="text-right">
            <span className={sortedAmounts[0].montant === 0 ? "text-bureau-500" : "text-bureau-100"}>
              {fmtEuro(sortedAmounts[0].montant)}
            </span>{" "}
            <span className="text-bureau-500 ml-1">{sortedAmounts[0].year}</span>
          </p>
        ) : (
          <details className="group">
            <summary className="cursor-pointer list-none flex items-center justify-between text-bureau-100">
              <span className="text-bureau-500 text-[10px] uppercase tracking-wider">Total {sortedAmounts.length} ans</span>
              <span className="font-semibold">{fmtEuro(total)}</span>
            </summary>
            <ul className="mt-1.5 space-y-0.5 text-[11px]">
              {sortedAmounts.map((a) => (
                <li key={a.year} className="flex justify-between gap-3">
                  <span className="text-bureau-500">{a.year}</span>
                  <span className={a.montant === 0 ? "text-bureau-500" : "text-bureau-200"}>
                    {a.montant === 0 ? "0 €" : fmtEuro(a.montant)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function DiDirigeantSection({ positions }: { positions: DiPosition[] }) {
  const total = positions.reduce(
    (s, p) => s + p.amounts.reduce((sx, a) => sx + a.montant, 0),
    0,
  );
  const summary =
    total === 0
      ? `${positions.length} mandats déclarés — aucun rémunéré`
      : `${positions.length} mandats déclarés · ${fmtEuro(total)} cumulés`;

  return (
    <SectionShell
      id="di-3"
      num={3}
      kind="di"
      rightHeader="Rémunération"
      synthesis={null}
      collapsibleSummary={summary}
      defaultOpen={positions.length <= HEAVY_SECTION_THRESHOLD}
    >
      <div className="divide-y divide-bureau-700/20">
        {positions.map((p, i) => (
          <DiPositionRow key={i} pos={p} />
        ))}
      </div>
    </SectionShell>
  );
}

function DiParticipationsSection({
  participations,
}: {
  participations: DiData["participations"];
}) {
  return (
    <SectionShell id="di-4" num={4} kind="di" rightHeader="Évaluation" synthesis={null}>
      <div className="divide-y divide-bureau-700/20">
        {participations.map((p, i) => (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 text-sm"
          >
            <div>
              <p className="text-bureau-100">{p.nomSociete}</p>
              <ul className="mt-0.5 text-[11px] text-bureau-400 space-y-0.5">
                {p.capitalDetenu && (
                  <li>
                    <span className="text-bureau-500">Capital détenu : </span>
                    {p.capitalDetenu}
                  </li>
                )}
                {p.nombreParts && (
                  <li>
                    <span className="text-bureau-500">Nombre de parts : </span>
                    {p.nombreParts}
                  </li>
                )}
                {p.remuneration && (
                  <li>
                    <span className="text-bureau-500">Rémunération : </span>
                    {p.remuneration}
                  </li>
                )}
              </ul>
            </div>
            <p className="font-mono text-xs text-bureau-100 text-right">
              {p.evaluation != null ? fmtEuro(p.evaluation) : "—"}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function DiConjointSection({
  conjoint,
}: {
  conjoint: { contenu: string; organisation: string | null }[];
}) {
  return (
    <SectionShell
      id="di-5"
      num={5}
      kind="di"
      rightHeader="Activité professionnelle"
      synthesis={null}
    >
      <div className="divide-y divide-bureau-700/20">
        {conjoint.map((c, i) => (
          <div
            key={i}
            className="px-4 py-3 text-sm text-bureau-200"
          >
            <p>{c.contenu}</p>
            {c.organisation && c.organisation !== c.contenu && (
              <p className="text-[11px] text-bureau-500 mt-0.5">
                <span className="text-bureau-500">Employeur : </span>
                {c.organisation}
              </p>
            )}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function DiBenevoleSection({
  benevole,
}: {
  benevole: { contenu: string; organisation: string | null }[];
}) {
  return (
    <SectionShell
      id="di-6"
      num={6}
      kind="di"
      rightHeader="Description des activités"
      synthesis={null}
    >
      <div className="divide-y divide-bureau-700/20">
        {benevole.map((b, i) => (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3 text-sm"
          >
            <p className="text-bureau-100">{b.organisation ?? "—"}</p>
            <p className="text-bureau-300">{b.contenu}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* DSP body                                                                */
/* ─────────────────────────────────────────────────────────────────────── */

function DspBody({ dsp }: { dsp: DspData }) {
  const sectionsWithData: { num: number; node: React.ReactNode }[] = [];
  const emptyNums: number[] = [];

  for (let n = 1; n <= 12; n++) {
    const rows = (dsp.rowsByRubrique.get(n) ?? []).filter((r) => !r.isNeant);
    if (rows.length === 0) {
      emptyNums.push(n);
      continue;
    }
    sectionsWithData.push({
      num: n,
      node: <DspSectionView num={n} rows={rows} />,
    });
  }

  return (
    <section className="space-y-3">
      <DeclHeader kind="DSP" titre="Déclaration de situation patrimoniale" />
      {sectionsWithData.map(({ num, node }) => (
        <div key={num}>{node}</div>
      ))}
      {emptyNums.length > 0 && <NeantStrip kind="dsp" nums={emptyNums} />}
    </section>
  );
}

function DspSectionView({ num, rows }: { num: number; rows: DspRowLite[] }) {
  // Per-section row renderer
  let body: React.ReactNode;
  let synthesis: string | null = null;
  let rightHeader = "Valeur";

  if (num === 1) {
    rightHeader = "Valeurs";
    body = <DspImmeublesRows rows={rows} />;
  } else if (num === 5) {
    rightHeader = "Valeur de rachat";
    body = <DspAssurancesRows rows={rows} />;
  } else if (num === 6) {
    rightHeader = "Solde";
    const totals = rows.reduce((s, r) => {
      const v = r.valeur as Record<string, unknown>;
      const x = v?.["Solde"];
      return s + (typeof x === "number" ? x : 0);
    }, 0);
    synthesis = `Total liquidités · ${fmtEuro(totals)}`;
    body = <DspComptesRows rows={rows} />;
  } else if (num === 12) {
    rightHeader = "Montants";
    body = <DspPassifRows rows={rows} />;
  } else {
    body = <DspGenericRows rows={rows} />;
  }

  return (
    <SectionShell id={`dsp-${num}`} num={num} kind="dsp" rightHeader={rightHeader} synthesis={synthesis}>
      {body}
    </SectionShell>
  );
}

function DspImmeublesRows({ rows }: { rows: DspRowLite[] }) {
  // pdftotext emits "95 m 2" for "95 m²" — fix display
  const fixUnits = (s: string) => s.replace(/m\s*2\b/g, "m²").replace(/\s+/g, " ").trim();

  return (
    <div className="divide-y divide-bureau-700/20">
      {rows.map((r, i) => {
        const d = r.description as Record<string, string>;
        const v = r.valeur as Record<string, number>;
        const summary = [
          d["Type"],
          d["Superficie bâtie"] && fixUnits(d["Superficie bâtie"]),
          d["Département"] && `Dpt ${d["Département"]}`,
          d["Date d'acquisition"] && `acquis ${d["Date d'acquisition"]}`,
          d["Régime juridique"],
          d["Quote-part détenue"],
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 text-sm"
          >
            <div className="text-bureau-200 leading-snug">
              <p className="text-bureau-100 font-medium">{d["Type"] ?? "Bien immobilier"}</p>
              <p className="text-[11px] text-bureau-400 mt-0.5">{summary.replace(`${d["Type"]} · `, "")}</p>
            </div>
            <div className="font-mono text-xs text-bureau-200 space-y-0.5 text-right">
              {v["Valeur vénale"] != null && (
                <p>
                  <span className="text-bureau-500 text-[10px] mr-2">Valeur</span>
                  <span className="text-bureau-100 font-semibold">{fmtEuro(v["Valeur vénale"])}</span>
                </p>
              )}
              {v["Prix d'acquisition"] != null &&
                v["Prix d'acquisition"] !== v["Valeur vénale"] && (
                  <p className="text-[11px]">
                    <span className="text-bureau-500 mr-2">Acquis.</span>
                    {fmtEuro(v["Prix d'acquisition"])}
                  </p>
                )}
              {v["Montant des travaux"] != null && v["Montant des travaux"] > 0 && (
                <p className="text-[11px]">
                  <span className="text-bureau-500 mr-2">Travaux</span>
                  {fmtEuro(v["Montant des travaux"])}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DspAssurancesRows({ rows }: { rows: DspRowLite[] }) {
  return (
    <div className="divide-y divide-bureau-700/20">
      {rows.map((r, i) => {
        const d = r.description as Record<string, string>;
        const v = r.valeur as Record<string, number>;
        const summary = [d["Etablissement"], d["Date de souscription"] && `souscrit ${d["Date de souscription"]}`, d["Souscripteur"]]
          .filter(Boolean)
          .join(" · ");
        return (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 text-sm"
          >
            <p className="text-bureau-200">{summary || "—"}</p>
            <p className="font-mono text-xs text-bureau-100 text-right">
              {v["Valeur de rachat"] != null ? fmtEuro(v["Valeur de rachat"]) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DspComptesRows({ rows }: { rows: DspRowLite[] }) {
  return (
    <div className="divide-y divide-bureau-700/20">
      {rows.map((r, i) => {
        const d = r.description as Record<string, string>;
        const v = r.valeur as Record<string, number>;
        const desc = (d["Description"] ?? "").replace(/,$/, "").trim();
        return (
          <div
            key={i}
            className="px-4 py-2.5 grid grid-cols-[1fr_140px] gap-3 text-sm"
          >
            <p className="text-bureau-200">{desc || "—"}</p>
            <p className="font-mono text-xs text-bureau-100 text-right">
              {v["Solde"] != null ? fmtEuro(v["Solde"]) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DspPassifRows({ rows }: { rows: DspRowLite[] }) {
  return (
    <div className="divide-y divide-bureau-700/20">
      {rows.map((r, i) => {
        const d = r.description as Record<string, string>;
        const v = r.valeur as Record<string, number>;
        const totalEmprunt = v["Montant total de l'emprunt"];
        const restant = v["Somme restant à rembourser"];
        const mensualite = v["Montant des mensualités"];
        return (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3 text-sm"
          >
            <div className="text-bureau-200">
              <p className="text-bureau-100">{d["Créancier"] ?? "Créancier"}</p>
              <p className="text-[11px] text-bureau-400 mt-0.5">
                {[d["Nature"], d["Date"] && `signé ${d["Date"]}`, d["Objet"]].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="font-mono text-xs text-bureau-200 space-y-0.5 text-right">
              {totalEmprunt != null && (
                <p>
                  <span className="text-bureau-500 mr-2">Emprunt</span>
                  {fmtEuro(totalEmprunt)}
                </p>
              )}
              {restant != null && (
                <p>
                  <span className="text-bureau-500 mr-2">Restant</span>
                  <span className="text-amber-400 font-semibold">{fmtEuro(restant)}</span>
                </p>
              )}
              {mensualite != null && (
                <p className="text-[11px]">
                  <span className="text-bureau-500 mr-2">Mensualité</span>
                  {fmtEuro(mensualite)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DspGenericRows({ rows }: { rows: DspRowLite[] }) {
  return (
    <div className="divide-y divide-bureau-700/20">
      {rows.map((r, i) => {
        const d = r.description as Record<string, unknown>;
        const v = r.valeur as Record<string, unknown>;
        const rawDesc = d["_raw"];
        const summary =
          typeof rawDesc === "string"
            ? rawDesc
            : [d["Description"], d["Titulaire"], d["Dénomination"]]
                .filter(Boolean)
                .join(" · ");
        const valEntries = Object.entries(v ?? {});
        return (
          <div
            key={i}
            className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 text-sm"
          >
            <p className="text-bureau-200 whitespace-pre-line">{summary || "—"}</p>
            <div className="font-mono text-xs text-bureau-100 text-right space-y-0.5">
              {valEntries.length === 0 ? (
                <span className="text-bureau-500">—</span>
              ) : (
                valEntries.map(([k, vv]) => (
                  <p key={k}>
                    <span className="text-bureau-500 mr-2">{k}</span>
                    {typeof vv === "number" ? fmtEuro(vv) : String(vv)}
                  </p>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Section shell                                                           */
/* ─────────────────────────────────────────────────────────────────────── */

function SectionShell({
  id,
  num,
  kind,
  rightHeader,
  synthesis,
  children,
  collapsibleSummary,
  defaultOpen = true,
}: {
  id: string;
  num: number;
  kind: "di" | "dsp";
  rightHeader: string;
  synthesis: string | null;
  children: React.ReactNode;
  collapsibleSummary?: string;
  defaultOpen?: boolean;
}) {
  const short = kind === "di" ? diShort(num) : dspShort(num);
  const long = kind === "di" ? diLong(num) : dspLong(num);

  return (
    <section
      id={id}
      className="rounded-xl border border-bureau-700/30 bg-bureau-900/30 overflow-hidden scroll-mt-20"
    >
      <header className="bg-bureau-950/80 border-b border-bureau-700/30 px-4 py-2.5 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-bureau-100">
          <span className="text-teal mr-2 font-mono">{num}°</span>
          <span title={long}>{short}</span>
        </p>
        <span className="text-[10px] uppercase tracking-wider text-bureau-500">
          {rightHeader}
        </span>
      </header>
      {collapsibleSummary ? (
        <details {...(defaultOpen ? { open: true } : {})} className="group">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-xs text-bureau-300 hover:text-bureau-100 flex items-center justify-between gap-3 border-b border-bureau-700/30">
            <span>
              <span className="text-teal/70 font-mono mr-2">⌐</span>
              {collapsibleSummary}
            </span>
            <span className="text-bureau-500 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          {children}
        </details>
      ) : (
        children
      )}
      {synthesis && (
        <div className="border-t border-bureau-700/30 bg-bureau-950/50 px-4 py-1.5 text-[11px] text-bureau-300">
          <span className="text-teal/80 font-mono mr-2">⌐</span>
          {synthesis}
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Néant strip + decl header                                               */
/* ─────────────────────────────────────────────────────────────────────── */

function NeantStrip({ kind, nums }: { kind: "di" | "dsp"; nums: number[] }) {
  return (
    <div className="rounded-lg border border-bureau-700/20 bg-bureau-900/20 px-4 py-2.5 text-xs text-bureau-500 flex items-center gap-3 flex-wrap">
      <span className="uppercase tracking-wider text-[10px] font-semibold">Néant</span>
      <span className="text-bureau-700">·</span>
      {nums.map((n, i) => {
        const short = kind === "di" ? diShort(n) : dspShort(n);
        return (
          <span key={n} className="font-mono">
            <span className="text-bureau-400">§{n}°</span>
            <span className="text-bureau-600 ml-1">{short}</span>
            {i < nums.length - 1 && <span className="text-bureau-700 ml-3">·</span>}
          </span>
        );
      })}
    </div>
  );
}

function DeclHeader({ kind, titre }: { kind: "DI" | "DSP"; titre: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] font-semibold text-teal/80">
        {kind}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-bureau-400">{titre}</span>
      <div className="h-px flex-1 bg-bureau-700/30" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
/* Footer                                                                  */
/* ─────────────────────────────────────────────────────────────────────── */

function AttestationFooter({
  prenom,
  nom,
  di,
  dsp,
}: {
  prenom: string;
  nom: string;
  di: DiData | null;
  dsp: DspData | null;
}) {
  return (
    <footer className="rounded-xl border border-bureau-700/30 bg-bureau-950/40 px-5 py-4 text-xs text-bureau-400 italic">
      <p>
        « Je soussigné(e) {prenom} {nom} certifie sur l&apos;honneur l&apos;exactitude des
        renseignements indiqués dans la présente déclaration. »
      </p>
      <p className="mt-2 not-italic text-[11px] text-bureau-500">
        Texte d&apos;attestation reproduit depuis les documents HATVP officiels
        {di?.dateDepot &&
          ` (DI déposée le ${di.dateDepot.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })})`}
        {dsp?.dateDepot &&
          ` (DSP déposée le ${dsp.dateDepot.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })})`}
        . Signature électronique HATVP.
      </p>
    </footer>
  );
}
