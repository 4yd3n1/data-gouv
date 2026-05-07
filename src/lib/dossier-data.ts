import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize-name";
import {
  aggregateYearlyRevenues,
  type RemunerationsYear,
} from "@/lib/remunerations";

const HEAVY_THRESHOLD = 10;

export type DiPosition = {
  employeur: string | null;
  description: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  amounts: { year: number; montant: number }[];
};

export type DiData = {
  declarationRef: string; // dossierId
  typeDeclaration: string;
  dateDepot: Date | null;
  dateDebutMandat: Date | null;
  organe: string | null;
  positionsByType: Record<string, DiPosition[]>; // professionnel / consultant / dirigeant / mandat_electif
  conjoint: { contenu: string; organisation: string | null }[];
  benevole: { contenu: string; organisation: string | null }[];
  participations: {
    nomSociete: string;
    evaluation: number | null;
    capitalDetenu: string | null;
    nombreParts: string | null;
    remuneration: string | null;
  }[];
  hatvpPageUrl: string | null;
  sourcePdfUrl: string | null;
};

export type DspRowLite = {
  rubriqueNum: number;
  rubriqueTitre: string;
  ordre: number;
  isNeant: boolean;
  description: Record<string, unknown>;
  valeur: Record<string, unknown>;
};

export type DspData = {
  declarationRef: string;
  typeDeclaration: string;
  dateDepot: Date | null;
  organe: string | null;
  regimeMatrimonial: string | null;
  rowsByRubrique: Map<number, DspRowLite[]>;
  sourcePdfUrl: string | null;
};

export type DossierSynthesis = {
  // Rémunérations (DI)
  remuActuel: number | null; // most recent year total
  remuActuelAnnee: number | null;
  remuCumul: number;
  remuPeriode: { start: number; end: number } | null;
  // Patrimoine (DSP)
  actifs: number;
  passifs: number;
  patrimoineNet: number;
  // Counts for nav
  diSectionCounts: Record<number, number>; // num → row count
  dspSectionCounts: Record<number, number>;
};

export type DossierData = {
  identity: {
    prenom: string;
    nom: string;
    organe: string | null;
  };
  di: DiData | null;
  dsp: DspData | null;
  /** Aggregated per-year HATVP revenus across ALL DI declarations, deduped by
   *  (description, employeur, annee). Empty when fewer than 2 years of data. */
  yearlyRevenues: RemunerationsYear[];
  synthesis: DossierSynthesis;
};

const ASSET_KEYS = new Set([
  "Valeur vénale",
  "Solde",
  "Valeur de rachat",
  "Valeur vénale totale des parts détenues",
]);

const LIABILITY_KEYS = new Set(["Somme restant à rembourser"]);

function buildDiPositions(
  revenus: Array<{ type: string; description: string | null; employeur: string | null; annee: number | null; montant: number | null }>,
): Record<string, DiPosition[]> {
  const groups: Record<string, Map<string, DiPosition>> = {};
  for (const r of revenus) {
    if (!groups[r.type]) groups[r.type] = new Map();
    const key = `${r.employeur ?? ""}|${r.description ?? ""}`;
    let pos = groups[r.type].get(key);
    if (!pos) {
      pos = {
        employeur: r.employeur,
        description: r.description,
        yearStart: r.annee,
        yearEnd: r.annee,
        amounts: [],
      };
      groups[r.type].set(key, pos);
    }
    if (r.annee != null) {
      if (pos.yearStart == null || r.annee < pos.yearStart) pos.yearStart = r.annee;
      if (pos.yearEnd == null || r.annee > pos.yearEnd) pos.yearEnd = r.annee;
      pos.amounts.push({ year: r.annee, montant: r.montant ?? 0 });
    }
  }
  const result: Record<string, DiPosition[]> = {};
  for (const [type, m] of Object.entries(groups)) {
    result[type] = [...m.values()].sort((a, b) => (a.yearStart ?? 0) - (b.yearStart ?? 0));
  }
  return result;
}

export async function getDossierData({
  personnaliteId,
  prenom,
  nom,
  hatvpDossierId,
}: {
  personnaliteId: string;
  prenom: string;
  nom: string;
  hatvpDossierId: string | null;
}): Promise<DossierData> {
  const nn = normalizeName(nom);
  const pn = normalizeName(prenom);

  const [diDecl, allDiRevenus, conjointRows, benevoleRows, dspDecl] = await Promise.all([
    prisma.declarationInteret.findFirst({
      where: {
        nomNormalise: nn,
        prenomNormalise: pn,
        typeDeclaration: { in: ["DI", "DIA", "DIM", "DIAM"] },
      },
      include: {
        revenus: { orderBy: [{ type: "asc" }, { employeur: "asc" }, { annee: "asc" }] },
        participations: true,
      },
      orderBy: { dateDepot: "desc" },
    }),
    prisma.declarationInteret.findMany({
      where: {
        nomNormalise: nn,
        prenomNormalise: pn,
        typeDeclaration: { in: ["DI", "DIA", "DIM", "DIAM"] },
      },
      select: {
        revenus: {
          select: {
            type: true,
            description: true,
            employeur: true,
            annee: true,
            montant: true,
          },
        },
      },
      orderBy: { dateDepot: "desc" },
    }),
    prisma.interetDeclare.findMany({
      where: { personnaliteId, rubrique: "ACTIVITE_CONJOINT" },
      orderBy: { dateDeclaration: "desc" },
    }),
    prisma.interetDeclare.findMany({
      where: { personnaliteId, rubrique: "ACTIVITE_BENEVOLE" },
      orderBy: { dateDeclaration: "desc" },
    }),
    prisma.declarationPatrimoine.findFirst({
      where: {
        OR: [
          { personnaliteId },
          { nomNormalise: nn, prenomNormalise: pn },
        ],
        typeDeclaration: { in: ["DSP", "DSPM", "DSPFM"] },
      },
      include: { rows: { orderBy: [{ rubriqueNum: "asc" }, { ordre: "asc" }] } },
      orderBy: { dateDepot: "desc" },
    }),
  ]);

  const yearlyRevenues = aggregateYearlyRevenues(
    allDiRevenus.flatMap((d) => d.revenus),
  );

  const di: DiData | null = diDecl
    ? {
        declarationRef: diDecl.id,
        typeDeclaration: diDecl.typeDeclaration,
        dateDepot: diDecl.dateDepot,
        dateDebutMandat: diDecl.dateDebutMandat,
        organe: diDecl.organe,
        positionsByType: buildDiPositions(diDecl.revenus),
        conjoint: conjointRows.map((c) => ({ contenu: c.contenu, organisation: c.organisation })),
        benevole: benevoleRows.map((b) => ({ contenu: b.contenu, organisation: b.organisation })),
        participations: diDecl.participations.map((p) => ({
          nomSociete: p.nomSociete,
          evaluation: p.evaluation,
          capitalDetenu: p.capitalDetenu,
          nombreParts: p.nombreParts,
          remuneration: p.remuneration,
        })),
        hatvpPageUrl: hatvpDossierId ? `https://www.hatvp.fr${hatvpDossierId}` : null,
        sourcePdfUrl: null, // we don't store the DI PDF URL — could derive from filename if needed
      }
    : null;

  const dsp: DspData | null = dspDecl
    ? {
        declarationRef: dspDecl.id,
        typeDeclaration: dspDecl.typeDeclaration,
        dateDepot: dspDecl.dateDepot,
        organe: dspDecl.organe,
        regimeMatrimonial: dspDecl.regimeMatrimonial,
        rowsByRubrique: (() => {
          const map = new Map<number, DspRowLite[]>();
          for (const r of dspDecl.rows) {
            if (!map.has(r.rubriqueNum)) map.set(r.rubriqueNum, []);
            map.get(r.rubriqueNum)!.push({
              rubriqueNum: r.rubriqueNum,
              rubriqueTitre: r.rubriqueTitre,
              ordre: r.ordre,
              isNeant: r.isNeant,
              description: r.description as Record<string, unknown>,
              valeur: r.valeur as Record<string, unknown>,
            });
          }
          return map;
        })(),
        sourcePdfUrl: dspDecl.sourcePdfUrl,
      }
    : null;

  // ── Synthesis ─────────────────────────────────────────────────────
  let remuCumul = 0;
  let remuActuel: number | null = null;
  let remuActuelAnnee: number | null = null;
  let minYear: number | null = null;
  let maxYear: number | null = null;
  const yearTotals = new Map<number, number>();

  if (di) {
    for (const positions of Object.values(di.positionsByType)) {
      for (const pos of positions) {
        for (const a of pos.amounts) {
          remuCumul += a.montant;
          yearTotals.set(a.year, (yearTotals.get(a.year) ?? 0) + a.montant);
          if (minYear == null || a.year < minYear) minYear = a.year;
          if (maxYear == null || a.year > maxYear) maxYear = a.year;
        }
      }
    }
    if (maxYear != null) {
      remuActuel = yearTotals.get(maxYear) ?? 0;
      remuActuelAnnee = maxYear;
    }
  }

  let actifs = 0;
  let passifs = 0;
  if (dsp) {
    for (const rows of dsp.rowsByRubrique.values()) {
      for (const r of rows) {
        if (r.isNeant) continue;
        const v = r.valeur ?? {};
        if (r.rubriqueNum === 12) {
          for (const [k, vv] of Object.entries(v)) {
            if (LIABILITY_KEYS.has(k) && typeof vv === "number") passifs += vv;
          }
        } else {
          for (const [k, vv] of Object.entries(v)) {
            if (ASSET_KEYS.has(k) && typeof vv === "number") actifs += vv;
          }
        }
      }
    }
  }

  // Section counts for the nav
  const diSectionCounts: Record<number, number> = {};
  if (di) {
    diSectionCounts[1] = di.positionsByType.professionnel?.length ?? 0;
    diSectionCounts[2] = di.positionsByType.consultant?.length ?? 0;
    diSectionCounts[3] = di.positionsByType.dirigeant?.length ?? 0;
    diSectionCounts[4] = di.participations.length;
    diSectionCounts[5] = di.conjoint.length;
    diSectionCounts[6] = di.benevole.length;
    diSectionCounts[7] = di.positionsByType.mandat_electif?.length ?? 0;
  }

  const dspSectionCounts: Record<number, number> = {};
  if (dsp) {
    for (let n = 1; n <= 12; n++) {
      const rows = dsp.rowsByRubrique.get(n) ?? [];
      dspSectionCounts[n] = rows.filter((r) => !r.isNeant).length;
    }
  }

  return {
    identity: {
      prenom,
      nom,
      organe: di?.organe ?? dsp?.organe ?? null,
    },
    di,
    dsp,
    yearlyRevenues,
    synthesis: {
      remuActuel,
      remuActuelAnnee,
      remuCumul,
      remuPeriode: minYear != null && maxYear != null ? { start: minYear, end: maxYear } : null,
      actifs,
      passifs,
      patrimoineNet: actifs - passifs,
      diSectionCounts,
      dspSectionCounts,
    },
  };
}

export const HEAVY_SECTION_THRESHOLD = HEAVY_THRESHOLD;
