import Link from "next/link";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { SrcChip } from "@/components/investigative/src-chip";
import { fmtEuro, fmtDate, fmtShortDate } from "@/lib/format";
import type { BaremeOfficiel } from "@/lib/baremes-officiels";
import {
  getRemunerations,
  type RemunerationsPosition,
} from "@/lib/remunerations";
import { YearlyChart } from "./yearly-revenue-chart";

type Props = {
  nomNormalise: string;
  prenomNormalise: string;
  personnaliteId?: string | null;
  hatvpDossierId?: string | null;
  /** Pre-resolved official indemnity (gov: décret 2002-562/2012-983;
   *  parliamentary: ordonnance 58-1210). When set, replaces the "Postes" tile
   *  with an "Indemnité officielle" tile and adds a methodology citation. */
  bareme?: BaremeOfficiel | null;
};

export async function RemunerationsPanel({
  nomNormalise,
  prenomNormalise,
  personnaliteId,
  hatvpDossierId,
  bareme,
}: Props) {
  const data = await getRemunerations({ nomNormalise, prenomNormalise, personnaliteId });

  // Empty across all three potential sources -> don't render at all.
  if (
    data.currentPositions.length === 0 &&
    data.pastPositions.length === 0 &&
    data.yearlyBreakdown.length === 0 &&
    data.participations.length === 0
  ) {
    return null;
  }

  const hatvpUrl = hatvpDossierId ? `https://www.hatvp.fr${hatvpDossierId}` : null;
  const totalPostsCount = data.totalsFromYearly
    ? data.distinctActivitiesCount
    : data.currentPositions.length + data.pastPositions.length;
  const inPostsCount = data.currentPositions.length;
  const periodLabel =
    data.firstYear && data.lastYear
      ? data.firstYear === data.lastYear
        ? String(data.firstYear)
        : `${data.firstYear} — ${data.lastYear}`
      : fallbackPeriod(data.currentPositions, data.pastPositions);
  const firstDepot = [...data.declarations]
    .map((d) => d.dateDepot)
    .filter((x): x is Date => x !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const lastDepot = data.latestDepotDate;
  const actuelSubLabel = data.totalsFromYearly
    ? data.currentAnnualYear
      ? `dernier exercice ${data.currentAnnualYear}`
      : "dernier exercice"
    : "par an (déclaré)";
  const postesSubLabel = data.totalsFromYearly
    ? totalPostsCount > 0
      ? "activités déclarées (agrégées)"
      : "—"
    : inPostsCount > 0
      ? `dont ${inPostsCount} en fonction`
      : "aucun en fonction";

  return (
    <section className="space-y-6">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="red" size="sm">
          ◆ Données HATVP · Rémunérations publiques
        </Eyebrow>
        {hatvpUrl ? (
          <Link href={hatvpUrl} target="_blank" rel="noopener noreferrer">
            <SrcChip items={["HATVP"]} />
          </Link>
        ) : (
          <SrcChip items={["HATVP"]} />
        )}
      </div>

      {/* ── Hero stat strip (4 tiles) ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Actuel"
          value={fmtEuro(data.currentAnnualTotal)}
          sub={actuelSubLabel}
          emphasis={data.currentAnnualTotal > 0}
        />
        <StatTile
          label="Cumul carrière publique"
          value={fmtEuro(data.lifetimeTotal)}
          sub="toutes déclarations HATVP"
          emphasis
        />
        {bareme ? (
          <StatTile
            label="Indemnité officielle"
            value={fmtEuro(bareme.brutAnnuel)}
            sub={`brut annuel · ${bareme.label} · ${bareme.references[0]}`}
          />
        ) : (
          <StatTile
            label={data.totalsFromYearly ? "Activités" : "Postes"}
            value={totalPostsCount > 0 ? String(totalPostsCount) : "—"}
            sub={postesSubLabel}
          />
        )}
        <StatTile
          label="Période couverte"
          value={periodLabel}
          sub={lastDepot ? `dernier dépôt ${fmtShortDate(lastDepot)}` : undefined}
        />
      </div>

      {/* ── FIG. 1 · En poste aujourd'hui (only when per-post data exists) ── */}
      {!data.totalsFromYearly && (
        <FigureBlock
          number={1}
          title="En poste aujourd'hui"
          subtitle="Rôles rémunérés déclarés actifs au dernier dépôt HATVP"
        >
          {data.currentPositions.length === 0 ? (
            <EmptyNote>
              Aucun poste rémunéré déclaré au{" "}
              {lastDepot ? fmtDate(lastDepot) : "dernier dépôt"}.
            </EmptyNote>
          ) : (
            <ul className="space-y-2">
              {data.currentPositions.map((p) => (
                <PositionCard key={p.key} position={p} highlight />
              ))}
            </ul>
          )}
        </FigureBlock>
      )}

      {/* ── FIG. 2 · Postes passés ─────────────────────────────────────── */}
      {data.pastPositions.length > 0 && (
        <FigureBlock
          number={2}
          title="Postes passés"
          subtitle="Mandats et fonctions antérieures, dernier montant déclaré retenu"
        >
          <PastPositionsTable positions={data.pastPositions} />
        </FigureBlock>
      )}

      {/* ── FIG. 3 · Revenus par exercice ──────────────────────────────── */}
      {data.yearlyBreakdown.length >= 2 && (
        <FigureBlock
          number={data.totalsFromYearly ? 1 : 3}
          title="Revenus déclarés par exercice"
          subtitle="Agrégation annuelle HATVP par nature de revenu"
        >
          <YearlyChart years={data.yearlyBreakdown} />
        </FigureBlock>
      )}

      {/* ── Participations financières ─────────────────────────────────── */}
      {data.participations.length > 0 && (
        <div className="space-y-3">
          <Eyebrow>Participations financières</Eyebrow>
          <ul className="obs-card divide-y divide-[color:var(--line)] p-0">
            {data.participations.map((p, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm"
                style={{ color: "var(--color-fg)" }}
              >
                <span>{p.nomSociete}</span>
                <span className="obs-mono tabular-nums" style={{ color: "var(--color-fg-mute)" }}>
                  {p.evaluation !== null && p.evaluation > 0 ? fmtEuro(p.evaluation) : "—"}
                </span>
              </li>
            ))}
          </ul>
          <p className="obs-mono" style={{ fontSize: "10px", color: "var(--color-fg-dim)" }}>
            Capital déclaré, non assimilable à un revenu.
          </p>
        </div>
      )}

      {/* ── Data-quality notes ─────────────────────────────────────────── */}
      {data.dataQualityNotes.length > 0 && (
        <ul
          className="space-y-1 text-xs"
          style={{ color: "var(--color-fg-dim)" }}
        >
          {data.dataQualityNotes.map((note, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: "var(--color-warn)" }} aria-hidden>
                ◇
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="space-y-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
        <SrcChip
          items={[
            "HATVP",
            firstDepot && lastDepot
              ? `${data.declarations.length} dépôt${data.declarations.length > 1 ? "s" : ""} · ${fmtShortDate(firstDepot)} — ${fmtShortDate(lastDepot)}`
              : `${data.declarations.length} dépôt${data.declarations.length > 1 ? "s" : ""}`,
          ]}
        />
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-fg-dim)" }}>
          Les montants et périodes correspondent strictement aux déclarations HATVP.
          Un exercice partiel en cours de mandat peut apparaître sous-estimé. Les
          participations financières figurent ici à titre indicatif et ne sont pas
          agrégées au cumul.
          {bareme && (
            <>
              {" "}L&apos;indemnité officielle ({fmtEuro(bareme.brutAnnuel)} brut
              annuel pour {baremeArticle(bareme.label)}) est fixée par {bareme.references.join(" + ")}
              , indexée sur le point d&apos;indice de la fonction publique.
            </>
          )}
        </p>
      </footer>
    </section>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function fallbackPeriod(
  current: RemunerationsPosition[],
  past: RemunerationsPosition[],
): string {
  const all = [...current, ...past];
  const starts = all.map((p) => p.dateDebut?.getUTCFullYear()).filter((n): n is number => !!n);
  const ends = all.map((p) => p.dateFin?.getUTCFullYear()).filter((n): n is number => !!n);
  if (starts.length === 0) return "—";
  const first = Math.min(...starts);
  const last = ends.length ? Math.max(...ends) : new Date().getUTCFullYear();
  return first === last ? String(first) : `${first} — ${last}`;
}

/* ── Hero stat tile ─────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="obs-card flex flex-col justify-between gap-2"
      style={{
        minHeight: 92,
        background: emphasis ? "var(--color-ink-1)" : "var(--color-ink-0)",
      }}
    >
      <span className="obs-mono" style={{ fontSize: "10px", letterSpacing: "0.14em", color: "var(--color-fg-mute)" }}>
        {label}
      </span>
      <span
        className="hd tabular-nums"
        style={{ fontSize: "clamp(20px, 2.6vw, 28px)", lineHeight: 1.1 }}
      >
        {value}
      </span>
      {sub && (
        <span className="obs-mono" style={{ fontSize: "9.5px", color: "var(--color-fg-dim)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Figure wrapper ─────────────────────────────────────────────────── */

function FigureBlock({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Eyebrow tone="red">FIG. {number}</Eyebrow>
        <h3 className="obs-serif" style={{ fontSize: "17px", color: "var(--color-fg)" }}>
          {title}
        </h3>
        {subtitle && (
          <span className="text-xs" style={{ color: "var(--color-fg-dim)" }}>
            · {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="obs-card text-xs"
      style={{ color: "var(--color-fg-dim)" }}
    >
      {children}
    </p>
  );
}

/* ── Current position card ──────────────────────────────────────────── */

function PositionCard({
  position,
  highlight = false,
}: {
  position: RemunerationsPosition;
  highlight?: boolean;
}) {
  const period = fmtPeriod(position.dateDebut, position.dateFin);
  return (
    <li
      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border px-4 py-3"
      style={{
        borderColor: highlight ? "oklch(0.55 0.12 27 / 0.3)" : "var(--line)",
        background: highlight ? "var(--signal-bg)" : "var(--color-ink-1)",
      }}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="obs-serif text-[15px] font-medium" style={{ color: "var(--color-fg)" }}>
          {position.title}
        </p>
        {position.organisation && (
          <p className="text-xs" style={{ color: "var(--color-fg-mute)" }}>
            {position.organisation}
          </p>
        )}
        <p className="obs-mono" style={{ fontSize: "10px", color: "var(--color-fg-dim)" }}>
          {period}
          {position.dateDepot && (
            <>
              {" · "}Dépôt HATVP {fmtShortDate(position.dateDepot)}
            </>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className="hd tabular-nums"
          style={{ fontSize: "20px", color: "var(--color-fg)" }}
        >
          {position.montant !== null ? fmtEuro(position.montant) : "—"}
        </p>
        <p className="obs-mono" style={{ fontSize: "9px", color: "var(--color-fg-dim)" }}>
          {position.montant !== null ? "déclaré sur la période" : "non déclaré"}
        </p>
      </div>
    </li>
  );
}

/* ── Past positions table ───────────────────────────────────────────── */

const PAST_COLLAPSE_LIMIT = 8;

function PastPositionsTable({ positions }: { positions: RemunerationsPosition[] }) {
  const visible = positions.slice(0, PAST_COLLAPSE_LIMIT);
  const hidden = positions.slice(PAST_COLLAPSE_LIMIT);
  return (
    <>
      <div className="obs-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="obs-mono"
              style={{
                fontSize: "10px",
                color: "var(--color-fg-mute)",
                letterSpacing: "0.14em",
              }}
            >
              <th className="px-4 py-2.5 text-left font-normal">Période</th>
              <th className="px-4 py-2.5 text-left font-normal">Poste</th>
              <th className="px-4 py-2.5 text-left font-normal">Organisation</th>
              <th className="px-4 py-2.5 text-right font-normal">Montant</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <PastRow key={p.key} position={p} />
            ))}
          </tbody>
        </table>
        {hidden.length > 0 && (
          <details>
            <summary
              className="cursor-pointer select-none border-t px-4 py-2.5 text-xs"
              style={{
                borderColor: "var(--line)",
                color: "var(--color-fg-mute)",
              }}
            >
              Voir tous les postes ({positions.length})
            </summary>
            <table className="w-full text-sm">
              <tbody>
                {hidden.map((p) => (
                  <PastRow key={p.key} position={p} />
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </>
  );
}

function PastRow({ position }: { position: RemunerationsPosition }) {
  const period = fmtPeriod(position.dateDebut, position.dateFin);
  return (
    <tr className="border-t" style={{ borderColor: "var(--line)" }}>
      <td className="px-4 py-2.5 align-top obs-mono" style={{ fontSize: "11px", color: "var(--color-fg-mute)" }}>
        {period}
      </td>
      <td className="px-4 py-2.5 align-top" style={{ color: "var(--color-fg)" }}>
        {position.title}
      </td>
      <td className="px-4 py-2.5 align-top text-xs" style={{ color: "var(--color-fg-mute)" }}>
        {position.organisation ?? "—"}
      </td>
      <td
        className="px-4 py-2.5 text-right align-top tabular-nums"
        style={{ color: "var(--color-fg)" }}
      >
        {position.montant !== null ? fmtEuro(position.montant) : "—"}
      </td>
    </tr>
  );
}

/* ── Bareme article helper ──────────────────────────────────────────── */

function baremeArticle(label: string): string {
  // "Premier ministre" → "le Premier ministre"; "Secrétaire d'État" → "un secrétaire d'État"
  if (label.startsWith("Président") || label.startsWith("Premier")) {
    return `le ${label}`;
  }
  return `un ${label.toLowerCase()}`;
}

/* ── Period formatter ───────────────────────────────────────────────── */

function fmtPeriod(start: Date | null, end: Date | null): string {
  if (!start && !end) return "Période non précisée";
  if (start && !end) return `${fmtShortDate(start)} — en cours`;
  if (!start && end) return `jusqu'à ${fmtShortDate(end)}`;
  if (start && end) {
    return `${fmtShortDate(start)} — ${fmtShortDate(end)}`;
  }
  return "—";
}
