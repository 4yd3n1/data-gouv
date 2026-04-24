import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Public-office income aggregator — unified across ministers, deputies and
 * senators. Strict HATVP source: no reference salaries, no monthly
 * extrapolation, no invented values.
 *
 * Two tables carry HATVP income at different granularities:
 *  - InteretDeclare (per personnalite) — per-activity montant over a date range.
 *    Source of truth for per-post amounts.
 *  - DeclarationInteret + RevenuDeclaration (per declaration) — per-year
 *    granularity. Used only for the yearly chart — summing it into the
 *    lifetime total would double-count activities already in InteretDeclare.
 */

export type RemunerationsPosition = {
  key: string;
  title: string;
  organisation: string | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  montant: number | null;
  declarationRef: string;
  dateDepot: Date | null;
};

export type RemunerationsYear = {
  annee: number;
  total: number;
  byType: Record<string, number>;
};

export type RemunerationsParticipation = {
  nomSociete: string;
  evaluation: number | null;
};

export type RemunerationsDeclarationMeta = {
  id: string;
  dateDepot: Date | null;
  typeDeclaration: string;
  typeMandat: string;
  organe: string | null;
  qualiteDeclarant: string | null;
};

export type RemunerationsData = {
  currentPositions: RemunerationsPosition[];
  pastPositions: RemunerationsPosition[];
  yearlyBreakdown: RemunerationsYear[];
  lifetimeTotal: number;
  currentAnnualTotal: number;
  /** When true, totals come from RevenuDeclaration (per-year granularity)
   *  instead of InteretDeclare positions. Triggered for profiles without a
   *  PersonnalitePublique row (most deputies/senators). */
  totalsFromYearly: boolean;
  /** Non-null only in totalsFromYearly mode: the exercise year used for
   *  currentAnnualTotal (= latest declared fiscal year). */
  currentAnnualYear: number | null;
  /** Distinct (description, employeur) pairs from RevenuDeclaration — used to
   *  derive a "postes" count when positions are unavailable. */
  distinctActivitiesCount: number;
  participations: RemunerationsParticipation[];
  declarations: RemunerationsDeclarationMeta[];
  dataQualityNotes: string[];
  latestDepotDate: Date | null;
  firstYear: number | null;
  lastYear: number | null;
};

function monthKey(d: Date | null): string {
  if (!d) return "nodate";
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildPositionKey(
  contenu: string | null,
  organisation: string | null,
  dateDebut: Date | null,
): string {
  return `${(contenu ?? "").trim().toLowerCase()}|${(organisation ?? "").trim().toLowerCase()}|${monthKey(dateDebut)}`;
}

export const getRemunerations = cache(
  async ({
    nomNormalise,
    prenomNormalise,
    personnaliteId,
  }: {
    nomNormalise: string;
    prenomNormalise: string;
    personnaliteId?: string | null;
  }): Promise<RemunerationsData> => {
    const empty: RemunerationsData = {
      currentPositions: [],
      pastPositions: [],
      yearlyBreakdown: [],
      lifetimeTotal: 0,
      currentAnnualTotal: 0,
      totalsFromYearly: false,
      currentAnnualYear: null,
      distinctActivitiesCount: 0,
      participations: [],
      declarations: [],
      dataQualityNotes: [],
      latestDepotDate: null,
      firstYear: null,
      lastYear: null,
    };

    if (!nomNormalise) return empty;

    const [declarations, interets] = await Promise.all([
      prisma.declarationInteret.findMany({
        where: { nomNormalise, prenomNormalise },
        include: { participations: true, revenus: true },
        orderBy: { dateDepot: "desc" },
      }),
      personnaliteId
        ? prisma.interetDeclare.findMany({
            where: {
              personnaliteId,
              rubrique: { in: ["ACTIVITE_ANTERIEURE", "MANDAT_ELECTIF", "REVENU"] },
            },
            orderBy: { dateDeclaration: "desc" },
          })
        : Promise.resolve([]),
    ]);

    if (declarations.length === 0 && interets.length === 0) return empty;

    // ─── latestDepotDate: max across both tables ─────────────────────────────
    const depotDates: number[] = [];
    for (const d of declarations) if (d.dateDepot) depotDates.push(d.dateDepot.getTime());
    for (const i of interets) if (i.dateDeclaration) depotDates.push(i.dateDeclaration.getTime());
    const latestDepotDate = depotDates.length ? new Date(Math.max(...depotDates)) : null;

    // ─── Positions from InteretDeclare (rubriques MANDAT_ELECTIF + ACTIVITE_ANTERIEURE) ───
    // Dedupe by (contenu, organisation, month-of-dateDebut): keep the row from
    // the LATEST dateDeclaration. Under orderBy desc, first-seen wins.
    const positionsMap = new Map<string, RemunerationsPosition & { dateDeclaration: Date | null }>();
    for (const item of interets) {
      if (item.rubrique === "REVENU") continue; // treated only via RevenuDeclaration / yearly
      if (item.rubrique !== "MANDAT_ELECTIF" && item.rubrique !== "ACTIVITE_ANTERIEURE") continue;
      const key = buildPositionKey(item.contenu, item.organisation, item.dateDebut);
      if (positionsMap.has(key)) continue; // latest-depot already captured
      positionsMap.set(key, {
        key,
        title: item.contenu,
        organisation: item.organisation,
        dateDebut: item.dateDebut,
        dateFin: item.dateFin,
        montant: item.montant,
        declarationRef: item.declarationRef,
        dateDepot: item.dateDeclaration,
        dateDeclaration: item.dateDeclaration,
      });
    }
    const positions = [...positionsMap.values()];

    // ─── Current vs past split ───
    // A position is CURRENT when:
    //   1. dateFin IS NULL — explicitly ongoing
    //   2. dateFin >= today — end date is in the future
    //   3. |dateDeclaration - dateFin| <= 90 days — HATVP reporting-period
    //      convention: "activité antérieure" carries the reporting period end,
    //      not the real activity end. When Lecornu files his 2026-02-27 DI as
    //      Premier ministre, the PM row shows dateFin=2026-02-01 even though
    //      he is still PM. A sub-90-day gap between dateFin and dateDeclaration
    //      is the HATVP tell for "active at filing".
    const todayMs = Date.now();
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const currentPositions: RemunerationsPosition[] = [];
    const pastPositions: RemunerationsPosition[] = [];
    for (const p of positions) {
      let isCurrent = false;
      if (p.dateFin === null) {
        isCurrent = true;
      } else if (p.dateFin.getTime() >= todayMs) {
        isCurrent = true;
      } else if (p.dateDeclaration) {
        const gap = Math.abs(p.dateDeclaration.getTime() - p.dateFin.getTime());
        if (gap <= NINETY_DAYS_MS) isCurrent = true;
      }
      const stripped: RemunerationsPosition = {
        key: p.key,
        title: p.title,
        organisation: p.organisation,
        dateDebut: p.dateDebut,
        dateFin: p.dateFin,
        montant: p.montant,
        declarationRef: p.declarationRef,
        dateDepot: p.dateDepot,
      };
      if (isCurrent) currentPositions.push(stripped);
      else pastPositions.push(stripped);
    }
    // Sort: current by dateDebut desc, past by dateDebut desc
    currentPositions.sort((a, b) => (b.dateDebut?.getTime() ?? 0) - (a.dateDebut?.getTime() ?? 0));
    pastPositions.sort((a, b) => (b.dateDebut?.getTime() ?? 0) - (a.dateDebut?.getTime() ?? 0));

    // ─── Lifetime total ──────────────────────────────────────────────────
    // Preferred source: positions (InteretDeclare) — per-activity montants
    // with date ranges. When that path is empty (deputies/senators without
    // a PersonnalitePublique row) we fall back to RevenuDeclaration, which
    // has per-year granularity. The two sources never mix: mixing would
    // double-count a minister whose PM role is in both tables. Fallback
    // happens further down once yearlyBreakdown is computed.
    const sumMontant = (ps: RemunerationsPosition[]) =>
      ps.reduce((s, p) => s + (p.montant ?? 0), 0);
    let lifetimeTotal = sumMontant(currentPositions) + sumMontant(pastPositions);
    let currentAnnualTotal = sumMontant(currentPositions);

    // ─── Yearly breakdown (from RevenuDeclaration across ALL declarations) ───
    // Dedupe by (description, employeur, annee) — first seen wins (latest depot
    // under dateDepot desc). Then group by annee, sum per type.
    const revenuMap = new Map<string, { annee: number; type: string; montant: number }>();
    for (const d of declarations) {
      for (const r of d.revenus) {
        if (r.annee === null || r.montant === null) continue;
        const rKey = `${(r.description ?? "").toLowerCase().trim()}|${(r.employeur ?? "").toLowerCase().trim()}|${r.annee}`;
        if (revenuMap.has(rKey)) continue;
        revenuMap.set(rKey, { annee: r.annee, type: r.type, montant: r.montant });
      }
    }
    const byYear = new Map<number, RemunerationsYear>();
    for (const r of revenuMap.values()) {
      let y = byYear.get(r.annee);
      if (!y) {
        y = { annee: r.annee, total: 0, byType: {} };
        byYear.set(r.annee, y);
      }
      y.total += r.montant;
      y.byType[r.type] = (y.byType[r.type] ?? 0) + r.montant;
    }
    const yearlyBreakdown = [...byYear.values()].sort((a, b) => a.annee - b.annee);

    const firstYear = yearlyBreakdown.length ? yearlyBreakdown[0].annee : null;
    const lastYear = yearlyBreakdown.length ? yearlyBreakdown[yearlyBreakdown.length - 1].annee : null;

    // ─── Fallback totals from RevenuDeclaration when positions path empty ───
    const positionsEmpty = currentPositions.length === 0 && pastPositions.length === 0;
    let totalsFromYearly = false;
    let currentAnnualYear: number | null = null;
    if (positionsEmpty && yearlyBreakdown.length > 0) {
      lifetimeTotal = yearlyBreakdown.reduce((s, y) => s + y.total, 0);
      const lastYearRow = yearlyBreakdown[yearlyBreakdown.length - 1];
      currentAnnualTotal = lastYearRow.total;
      currentAnnualYear = lastYearRow.annee;
      totalsFromYearly = true;
    }

    // ─── Distinct activities count (from RevenuDeclaration) ───
    const distinctActivitiesSet = new Set<string>();
    for (const d of declarations) {
      for (const r of d.revenus) {
        const key = `${(r.description ?? "").toLowerCase().trim()}|${(r.employeur ?? "").toLowerCase().trim()}`;
        if (key !== "|") distinctActivitiesSet.add(key);
      }
    }
    const distinctActivitiesCount = distinctActivitiesSet.size;

    // ─── Participations: dedupe by nomSociete, latest evaluation wins ───
    const partMap = new Map<string, RemunerationsParticipation>();
    for (const d of declarations) {
      for (const p of d.participations) {
        const key = p.nomSociete.trim().toLowerCase();
        if (partMap.has(key)) continue;
        partMap.set(key, { nomSociete: p.nomSociete, evaluation: p.evaluation });
      }
    }
    const participations = [...partMap.values()];

    // ─── Declaration metadata for source citations ───
    const declarationsMeta: RemunerationsDeclarationMeta[] = declarations.map((d) => ({
      id: d.id,
      dateDepot: d.dateDepot,
      typeDeclaration: d.typeDeclaration,
      typeMandat: d.typeMandat,
      organe: d.organe,
      qualiteDeclarant: d.qualiteDeclarant,
    }));

    // ─── Data-quality notes ───
    const notes: string[] = [];
    const currentYear = new Date().getUTCFullYear();
    const partialCurrent = currentPositions.find((p) => {
      if (!p.dateDebut) return false;
      return p.dateDebut.getUTCFullYear() === currentYear;
    });
    if (partialCurrent && partialCurrent.dateDebut) {
      const m = partialCurrent.dateDebut.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      notes.push(`Exercice ${currentYear} partiel : ${partialCurrent.title} depuis le ${m}.`);
    }
    const nullMontantCount = [...currentPositions, ...pastPositions].filter((p) => p.montant === null).length;
    if (nullMontantCount > 0) {
      notes.push(
        `${nullMontantCount} poste${nullMontantCount > 1 ? "s" : ""} sans montant déclaré (exclu${nullMontantCount > 1 ? "s" : ""} du cumul).`,
      );
    }

    if (totalsFromYearly) {
      notes.push(
        "Détail par poste indisponible pour ce profil — totaux agrégés à partir des revenus annuels HATVP.",
      );
    }

    return {
      currentPositions,
      pastPositions,
      yearlyBreakdown,
      lifetimeTotal,
      currentAnnualTotal,
      totalsFromYearly,
      currentAnnualYear,
      distinctActivitiesCount,
      participations,
      declarations: declarationsMeta,
      dataQualityNotes: notes,
      latestDepotDate,
      firstYear,
      lastYear,
    };
  },
);
