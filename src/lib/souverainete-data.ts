import { cache } from "react";
import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize-name";
import {
  CategorieAcquisition,
  MesureEtat,
  PaysAcquereur,
  SecteurStrategique,
} from "@prisma/client";

export interface SouveraineteRow {
  id: string;
  cibleNom: string;
  cibleSecteur: SecteurStrategique;
  cibleSousSecteur: string | null;
  cibleSiteHistorique: string | null;
  acquereurNom: string;
  acquereurPays: PaysAcquereur;
  acquereurType: string | null;
  dateAnnonce: Date | null;
  dateCloture: Date | null;
  valeurEur: bigint | null;
  categorie: CategorieAcquisition;
  mesureEtat: MesureEtat;
  ministreReferent: string | null;
  iefDeclenche: boolean | null;
  iefReference: string | null;
  contexte: string;
  enjeuxSouverainete: string;
  contextePolitique: string | null;
  sourcePrincipale: string;
  sourceUrl: string;
  sourceDate: Date;
  precedeMacron: boolean;
  parentDealId: string | null;
}

export interface SouveraineteOverview {
  rows: SouveraineteRow[];
  stats: {
    totalCas: number; // distinct parent deals
    totalPhases: number; // total rows
    cessionsEtrangeres: number;
    vetosFrancais: number;
    sauvetages: number;
    rachatsEtatiques: number;
    valeurCessionsEur: bigint;
    plusAncien: number; // year
    plusRecent: number; // year
    sincePrecedeMacron: number; // count where precedeMacron = false
  };
  byCountry: Array<{ pays: PaysAcquereur; count: number; valeurEur: bigint }>;
  bySector: Array<{ secteur: SecteurStrategique; count: number }>;
  byCategory: Array<{ categorie: CategorieAcquisition; count: number }>;
  byYear: Array<{ year: number; count: number }>;
  byMesure: Array<{ mesureEtat: MesureEtat; count: number }>;
}

export const CATEGORIE_LABELS: Record<CategorieAcquisition, string> = {
  CESSION_ETRANGERE: "Cession étrangère",
  VETO_IEF: "Veto IEF",
  RETRAIT_POLITIQUE: "Retrait sous signal politique",
  SAUVETAGE_DOMESTIQUE: "Sauvetage domestique",
  RACHAT_ETATIQUE: "Rachat par l'État",
  FUSION_DOMICILIATION: "Fusion avec domiciliation hors France",
  SCISSION_DOMICILIATION: "Scission avec cotation hors France",
  ANCRAGE_DOMESTIQUE: "Ancrage domestique partagé",
  VENTE_DETRESSE: "Vente en détresse",
  RESTRUCTURATION_DETTE: "Restructuration de dette",
};

export const MESURE_LABELS: Record<MesureEtat, string> = {
  AUCUNE: "Aucune mesure publique",
  VETO: "Veto formel",
  CONDITIONS: "Conditions imposées",
  ACTION_DE_PREFERENCE: "Action de préférence (PACTE)",
  ACTION_SPECIFIQUE: "Action spécifique (golden share)",
  BPIFRANCE_MINORITAIRE: "Bpifrance minoritaire",
  ANCRAGE_PARTAGE: "Ancrage partagé",
  RACHAT_ETAT: "Rachat par l'État",
  RECAPITALISATION_ETAT: "Recapitalisation publique",
  STANDSTILL: "Pacte standstill",
};

export const SECTEUR_LABELS: Record<SecteurStrategique, string> = {
  DEFENSE_AEROSPACE: "Défense / Aérospatial",
  DEFENSE_NUCLEAIRE: "Défense nucléaire / Dissuasion",
  ENERGIE: "Énergie",
  TELECOM: "Télécoms / Satellite",
  SEMICONDUCTEUR: "Semi-conducteurs",
  BIOMETRIE_IDENTITE: "Biométrie / Identité régalienne",
  CYBERSECURITE: "Cybersécurité",
  BIOTECH_PHARMA: "Biotech / Pharma",
  SANTE_OTC: "Santé / OTC",
  GRANDE_DISTRIBUTION: "Grande distribution",
  AGROALIMENTAIRE: "Agroalimentaire",
  MEDIA_AUDIOVISUEL: "Médias / Audiovisuel",
  AUTOMOBILE: "Automobile",
  AERONAUTIQUE_CIVIL: "Aéronautique civil / Ferroviaire",
  IT_SERVICES_HPC: "IT / Supercalcul / Cloud",
  CHIMIE_MATERIAUX: "Chimie / Matériaux",
  BTP_CIMENT: "BTP / Ciment",
  LOGISTIQUE_PORTUAIRE: "Logistique portuaire",
  MUSIQUE_DIVERTISSEMENT: "Musique / Divertissement",
  IOT_TELECOM: "IoT / Télécom industriel",
  AUTRE: "Autre",
};

export const PAYS_LABELS: Record<PaysAcquereur, string> = {
  ETATS_UNIS: "États-Unis",
  ROYAUME_UNI: "Royaume-Uni",
  ALLEMAGNE: "Allemagne",
  ITALIE: "Italie",
  SUISSE: "Suisse",
  PAYS_BAS: "Pays-Bas",
  CANADA: "Canada",
  CHINE: "Chine",
  SINGAPOUR: "Singapour",
  EMIRATS_ARABES_UNIS: "Émirats arabes unis",
  TURQUIE: "Turquie",
  INDE: "Inde",
  SUEDE: "Suède",
  JAPON: "Japon",
  COREE_DU_SUD: "Corée du Sud",
  LUXEMBOURG: "Luxembourg",
  FRANCE: "France",
  MULTIPLE: "Multi-pays",
  AUTRE: "Autre",
};

/**
 * Find all AcquisitionEtrangere rows where the given minister's name appears
 * in `ministreReferent`. The free-text field can include multiple ministers
 * ("Bruno Le Maire (avec Sébastien Lecornu)") and parenthetical portfolios
 * ("Emmanuel Macron (Économie)") — match by NFD-normalized substring
 * containment. The dataset is small (~30 rows with a referent), so post-fetch
 * filtering is cheap.
 */
export const getAcquisitionsByMinistre = cache(
  async (input: {
    nom: string;
    prenom: string;
  }): Promise<SouveraineteRow[]> => {
    const all = await prisma.acquisitionEtrangere.findMany({
      where: { ministreReferent: { not: null } },
      orderBy: [{ dateAnnonce: "desc" }, { dateCloture: "desc" }],
    });
    const target = normalizeName(`${input.prenom} ${input.nom}`);
    if (!target) return [];
    return (all as SouveraineteRow[]).filter(
      (r) =>
        r.ministreReferent !== null &&
        normalizeName(r.ministreReferent).includes(target),
    );
  },
);

export const getSouveraineteOverview = cache(
  async (): Promise<SouveraineteOverview> => {
    const rows = await prisma.acquisitionEtrangere.findMany({
      orderBy: [{ dateAnnonce: "desc" }, { cibleNom: "asc" }],
    });

    const totalCas = rows.filter((r) => !r.parentDealId).length;
    const totalPhases = rows.length;

    const cessionsEtrangeres = rows.filter(
      (r) => r.categorie === CategorieAcquisition.CESSION_ETRANGERE,
    ).length;

    // Only count French IEF vetos — exclude EU competition vetos (Alstom-Siemens 2019)
    const vetosFrancais = rows.filter(
      (r) =>
        r.categorie === CategorieAcquisition.VETO_IEF &&
        r.iefReference !== null &&
        !r.iefReference.toLowerCase().includes("commission européenne"),
    ).length;

    const sauvetages = rows.filter(
      (r) => r.categorie === CategorieAcquisition.SAUVETAGE_DOMESTIQUE,
    ).length;

    const rachatsEtatiques = rows.filter(
      (r) => r.categorie === CategorieAcquisition.RACHAT_ETATIQUE,
    ).length;

    const valeurCessionsEur = rows
      .filter((r) => r.categorie === CategorieAcquisition.CESSION_ETRANGERE)
      .reduce((sum, r) => sum + (r.valeurEur ?? BigInt(0)), BigInt(0));

    const years = rows
      .map((r) => r.dateAnnonce?.getFullYear() ?? r.dateCloture?.getFullYear())
      .filter((y): y is number => typeof y === "number");
    const plusAncien = years.length ? Math.min(...years) : new Date().getFullYear();
    const plusRecent = years.length ? Math.max(...years) : new Date().getFullYear();

    const sincePrecedeMacron = rows.filter((r) => !r.precedeMacron).length;

    // Group by acquirer country
    const countryMap = new Map<PaysAcquereur, { count: number; valeurEur: bigint }>();
    for (const r of rows) {
      const cur = countryMap.get(r.acquereurPays) ?? { count: 0, valeurEur: BigInt(0) };
      cur.count += 1;
      cur.valeurEur += r.valeurEur ?? BigInt(0);
      countryMap.set(r.acquereurPays, cur);
    }
    const byCountry = Array.from(countryMap.entries())
      .map(([pays, v]) => ({ pays, ...v }))
      .sort((a, b) => b.count - a.count);

    // By sector
    const sectorMap = new Map<SecteurStrategique, number>();
    for (const r of rows) {
      sectorMap.set(r.cibleSecteur, (sectorMap.get(r.cibleSecteur) ?? 0) + 1);
    }
    const bySector = Array.from(sectorMap.entries())
      .map(([secteur, count]) => ({ secteur, count }))
      .sort((a, b) => b.count - a.count);

    // By category
    const catMap = new Map<CategorieAcquisition, number>();
    for (const r of rows) {
      catMap.set(r.categorie, (catMap.get(r.categorie) ?? 0) + 1);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([categorie, count]) => ({ categorie, count }))
      .sort((a, b) => b.count - a.count);

    // By state measure
    const mesureMap = new Map<MesureEtat, number>();
    for (const r of rows) {
      mesureMap.set(r.mesureEtat, (mesureMap.get(r.mesureEtat) ?? 0) + 1);
    }
    const byMesure = Array.from(mesureMap.entries())
      .map(([mesureEtat, count]) => ({ mesureEtat, count }))
      .sort((a, b) => b.count - a.count);

    // By year
    const yearMap = new Map<number, number>();
    for (const r of rows) {
      const y = r.dateAnnonce?.getFullYear() ?? r.dateCloture?.getFullYear();
      if (typeof y !== "number") continue;
      yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
    }
    const byYear = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    return {
      rows: rows as SouveraineteRow[],
      stats: {
        totalCas,
        totalPhases,
        cessionsEtrangeres,
        vetosFrancais,
        sauvetages,
        rachatsEtatiques,
        valeurCessionsEur,
        plusAncien,
        plusRecent,
        sincePrecedeMacron,
      },
      byCountry,
      bySector,
      byCategory,
      byYear,
      byMesure,
    };
  },
);
