import Link from "next/link";
import {
  CATEGORIE_LABELS,
  MESURE_LABELS,
  PAYS_LABELS,
  SECTEUR_LABELS,
  getAcquisitionsByMinistre,
  type SouveraineteRow,
} from "@/lib/souverainete-data";
import { CategorieAcquisition } from "@prisma/client";
import { SourceChip } from "@/components/source-chip";

const CATEGORY_BADGE: Record<
  CategorieAcquisition,
  { label: string; className: string }
> = {
  CESSION_ETRANGERE: {
    label: "Cession",
    className: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  },
  FUSION_DOMICILIATION: {
    label: "Fusion-domic.",
    className: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  },
  SCISSION_DOMICILIATION: {
    label: "Scission-domic.",
    className: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  },
  VENTE_DETRESSE: {
    label: "Détresse",
    className: "border-rose-800/40 bg-rose-900/10 text-rose-300",
  },
  RESTRUCTURATION_DETTE: {
    label: "Dette",
    className: "border-amber-800/40 bg-amber-900/10 text-amber-300",
  },
  VETO_IEF: {
    label: "Veto IEF",
    className: "border-teal-800/40 bg-teal-900/10 text-teal-300",
  },
  RETRAIT_POLITIQUE: {
    label: "Retrait politique",
    className: "border-teal-800/40 bg-teal-900/10 text-teal-300",
  },
  SAUVETAGE_DOMESTIQUE: {
    label: "Sauvetage",
    className: "border-teal-800/40 bg-teal-900/10 text-teal-300",
  },
  RACHAT_ETATIQUE: {
    label: "Rachat État",
    className: "border-teal-800/40 bg-teal-900/10 text-teal-300",
  },
  ANCRAGE_DOMESTIQUE: {
    label: "Ancrage",
    className: "border-amber-800/40 bg-amber-900/10 text-amber-300",
  },
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatValueEur(eur: bigint | null): string {
  if (!eur) return "—";
  const num = Number(eur);
  const fr = (v: number, digits: number) =>
    v.toLocaleString("fr-FR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  if (num >= 1_000_000_000)
    return `${fr(num / 1_000_000_000, num >= 10_000_000_000 ? 0 : 1)} Md€`;
  if (num >= 1_000_000) return `${fr(num / 1_000_000, 0)} M€`;
  return `${fr(num, 0)} €`;
}

export async function SouveraineteSection({
  nom,
  prenom,
}: {
  nom: string;
  prenom: string;
}) {
  const rows = await getAcquisitionsByMinistre({ nom, prenom });
  if (rows.length === 0) return null;

  const cessions = rows.filter(
    (r) =>
      r.categorie === CategorieAcquisition.CESSION_ETRANGERE ||
      r.categorie === CategorieAcquisition.FUSION_DOMICILIATION ||
      r.categorie === CategorieAcquisition.VENTE_DETRESSE,
  ).length;
  const vetos = rows.filter(
    (r) => r.categorie === CategorieAcquisition.VETO_IEF,
  ).length;
  const sauvetages = rows.filter(
    (r) =>
      r.categorie === CategorieAcquisition.SAUVETAGE_DOMESTIQUE ||
      r.categorie === CategorieAcquisition.RACHAT_ETATIQUE,
  ).length;

  return (
    <section id="souverainete">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400">
          Souveraineté économique
        </h2>
        <span className="rounded border border-amber-800/40 bg-amber-900/10 px-1.5 py-px text-[10px] text-amber-400">
          {rows.length}
        </span>
        <div className="h-px flex-1 bg-bureau-700/30" />
        <Link
          href="/souverainete"
          className="text-[10px] uppercase tracking-[0.12em] text-bureau-500 hover:text-bureau-300"
        >
          Dossier complet →
        </Link>
      </div>

      <p className="mb-4 text-xs text-bureau-500">
        Dossiers d&apos;acquisitions étrangères, vétos IEF et sauvetages dans
        lesquels {prenom} {nom} apparaît comme ministre référent. Cessions :{" "}
        <span className="text-bureau-300">{cessions}</span> · Vétos IEF :{" "}
        <span className="text-bureau-300">{vetos}</span> · Sauvetages / rachats
        État : <span className="text-bureau-300">{sauvetages}</span>.
      </p>

      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}

function Card({ row }: { row: SouveraineteRow }) {
  const badge = CATEGORY_BADGE[row.categorie];
  const dateRef = row.dateAnnonce ?? row.dateCloture;
  return (
    <article className="rounded-xl border border-bureau-800/40 bg-bureau-950/30 p-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span
          className={`rounded border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="text-sm font-medium text-bureau-100">
          {row.cibleNom}
        </span>
        <span className="text-xs text-bureau-500">·</span>
        <span className="text-xs text-bureau-400">
          {SECTEUR_LABELS[row.cibleSecteur]}
        </span>
        {dateRef && (
          <>
            <span className="text-xs text-bureau-600">·</span>
            <span className="text-xs tabular-nums text-bureau-500">
              {formatDate(dateRef)}
            </span>
          </>
        )}
      </header>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs text-bureau-500">
            <span className="text-bureau-400">vers</span>{" "}
            <span className="text-bureau-200">{row.acquereurNom}</span>{" "}
            <span className="text-bureau-500">
              ({PAYS_LABELS[row.acquereurPays]})
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bureau-300">
            {row.contexte}
          </p>
          {row.iefReference && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.1em] text-bureau-600">
              IEF · {row.iefReference}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-lg font-semibold tabular-nums text-bureau-100">
            {formatValueEur(row.valeurEur)}
          </span>
          <span className="text-[10px] uppercase tracking-[0.12em] text-bureau-500">
            {MESURE_LABELS[row.mesureEtat]}
          </span>
          <div className="mt-1">
            <SourceChip
              outlet={row.sourcePrincipale}
              url={row.sourceUrl}
              date={dateRef}
              type="presse"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
