/**
 * Ingest economy indicators:
 * 1. GDP — from data.gouv.fr CSV (resource cd2ac200-...)
 * 2. Unemployment — from INSEE BDM SDMX (dataflow CHOMAGE-TRIM-NATIONAL)
 * 3. Enterprise creation — from INSEE BDM SDMX (dataflow CREA-ENT)
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseFloatSafe } from "./lib/csv-parser";
import { parseSdmxResponse, periodToDate } from "./lib/sdmx-parser";
import { logIngestion } from "./lib/ingestion-log";

const BDM_BASE = "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM";

// GDP CSV from data.gouv.fr
const GDP_URL =
  "https://www.data.gouv.fr/fr/datasets/r/cd2ac200-0130-459e-809f-843f46e20d28";

// ─── GDP ───

async function ingestGdp(): Promise<number> {
  console.log("  [GDP] Fetching CSV...");
  const csv = await fetchText(GDP_URL);
  const rows = parseCsv<{ annee: string; pib: string }>(csv);
  console.log(`  [GDP] ${rows.length} rows`);

  // Ensure indicator exists
  const indicator = await prisma.indicateur.upsert({
    where: { code: "PIB_ANNUEL" },
    update: {
      nom: "PIB annuel de la France",
      domaine: "pib",
      unite: "millions_eur",
      frequence: "annuel",
      source: "data.gouv.fr",
      sourceUrl: "https://www.data.gouv.fr/datasets/produit-interieur-brut-pib-de-la-france",
    },
    create: {
      code: "PIB_ANNUEL",
      nom: "PIB annuel de la France",
      description: "Produit intérieur brut en millions d'euros courants, depuis 1949",
      domaine: "pib",
      unite: "millions_eur",
      frequence: "annuel",
      source: "data.gouv.fr",
      sourceUrl: "https://www.data.gouv.fr/datasets/produit-interieur-brut-pib-de-la-france",
    },
  });

  let count = 0;
  for (const row of rows) {
    const valeur = parseFloatSafe(row.pib);
    if (valeur === null) continue;

    await prisma.observation.upsert({
      where: {
        indicateurId_periode: {
          indicateurId: indicator.id,
          periode: row.annee,
        },
      },
      update: { valeur, periodeDebut: new Date(parseInt(row.annee), 0, 1) },
      create: {
        indicateurId: indicator.id,
        periode: row.annee,
        periodeDebut: new Date(parseInt(row.annee), 0, 1),
        valeur,
      },
    });
    count++;
  }
  console.log(`  [GDP] ${count} observations upserted`);
  return count;
}

// ─── BDM Series ───

interface BdmSeriesConfig {
  code: string;
  idBanks: string; // +-separated list
  nom: string;
  description: string;
  domaine: string;
  unite: string;
  frequence: string;
  correction?: string;
  lastNObs?: number;
  /** Filter: only keep series where these dimension keys match these values */
  filter?: Record<string, string>;
}

const BDM_SERIES: BdmSeriesConfig[] = [
  // ─── Existing series ───
  {
    code: "CHOMAGE_TAUX_TRIM",
    idBanks: "001688527", // Taux de chômage France entière, ensemble, CVS
    nom: "Taux de chômage trimestriel (France)",
    description: "Taux de chômage au sens du BIT, France entière, ensemble, CVS",
    domaine: "emploi",
    unite: "pourcent",
    frequence: "trimestriel",
    correction: "CVS",
    lastNObs: 80,
  },
  {
    code: "CHOMAGE_NB_TRIM",
    idBanks: "001688526", // Nombre de chômeurs France entière, ensemble, CVS (milliers)
    nom: "Nombre de chômeurs trimestriel (France)",
    description: "Nombre de chômeurs au sens du BIT, France entière, ensemble, CVS, milliers",
    domaine: "emploi",
    unite: "milliers",
    frequence: "trimestriel",
    correction: "CVS",
    lastNObs: 80,
  },
  {
    code: "CREA_ENT_MENSUEL",
    idBanks: "001564303", // Créations d'entreprises ensemble, CVS
    nom: "Créations d'entreprises mensuelles (France)",
    description: "Nombre total de créations d'entreprises, ensemble, CVS",
    domaine: "entreprises",
    unite: "nombre",
    frequence: "mensuel",
    correction: "CVS",
    lastNObs: 120,
  },

  // ─── New series: Prix / Pouvoir d'achat ───
  {
    code: "IPC_MENSUEL",
    idBanks: "001763852",
    nom: "Inflation mensuelle (IPC)",
    description: "Indice des prix à la consommation, ensemble des ménages, France, variation annuelle",
    domaine: "prix",
    unite: "pourcent",
    frequence: "mensuel",
    lastNObs: 120,
  },
  {
    code: "IPC_ALIMENTAIRE",
    idBanks: "001768682",
    nom: "Inflation alimentaire mensuelle",
    description: "IPC pour les produits alimentaires, variation annuelle",
    domaine: "prix",
    unite: "pourcent",
    frequence: "mensuel",
    lastNObs: 120,
  },
  {
    code: "IPC_ENERGIE",
    idBanks: "001769682",
    nom: "Inflation énergie mensuelle",
    description: "IPC pour l'énergie, variation annuelle",
    domaine: "prix",
    unite: "pourcent",
    frequence: "mensuel",
    lastNObs: 120,
  },

  // ─── New series: Salaires ───
  {
    code: "SMIC_HORAIRE",
    idBanks: "010605027",
    nom: "SMIC horaire brut",
    description: "Salaire minimum interprofessionnel de croissance, valeur horaire brute en euros",
    domaine: "salaires",
    unite: "eur",
    frequence: "annuel",
    lastNObs: 40,
  },
  {
    code: "SALAIRE_MOYEN",
    idBanks: "001587885",
    nom: "Salaire moyen par tête (SMPT)",
    description: "Salaire moyen par tête, ensemble des branches, brut, euros courants",
    domaine: "salaires",
    unite: "eur",
    frequence: "trimestriel",
    lastNObs: 60,
  },

  // ─── New series: Construction / Logement ───
  {
    code: "LOGEMENTS_AUTORISES",
    idBanks: "001656956",
    nom: "Logements autorisés (permis de construire)",
    description: "Nombre de logements autorisés à la construction, ensemble, France métropolitaine",
    domaine: "construction",
    unite: "nombre",
    frequence: "mensuel",
    lastNObs: 120,
  },
  {
    code: "LOGEMENTS_COMMENCES",
    idBanks: "001656957",
    nom: "Logements commencés (mises en chantier)",
    description: "Nombre de logements dont la construction a démarré, ensemble, France métropolitaine",
    domaine: "construction",
    unite: "nombre",
    frequence: "mensuel",
    lastNObs: 120,
  },

  // ─── New series: Finances publiques / Dette ───
  {
    code: "DETTE_PIB",
    idBanks: "001694258",
    nom: "Dette publique (% du PIB)",
    description: "Dette des administrations publiques au sens de Maastricht, en % du PIB",
    domaine: "finances",
    unite: "pourcent",
    frequence: "annuel",
    lastNObs: 40,
  },
  {
    code: "INTERETS_DETTE",
    idBanks: "001694274",
    nom: "Charge d'intérêts de la dette publique",
    description: "Intérêts payés par les administrations publiques, en milliards d'euros",
    domaine: "finances",
    unite: "milliards_eur",
    frequence: "annuel",
    lastNObs: 40,
  },
  {
    code: "DEPENSES_PUBLIQUES_PIB",
    idBanks: "001710399",
    nom: "Dépenses publiques (% du PIB)",
    description: "Dépenses des administrations publiques en % du PIB",
    domaine: "finances",
    unite: "pourcent",
    frequence: "annuel",
    lastNObs: 40,
  },

  // ─── New series: Emploi ───
  {
    code: "EMPLOI_SALARIE",
    idBanks: "001587878",
    nom: "Emploi salarié total",
    description: "Emploi salarié dans les secteurs marchands et non-marchands, en milliers",
    domaine: "emploi",
    unite: "milliers",
    frequence: "trimestriel",
    lastNObs: 60,
  },
  {
    code: "EMPLOI_INTERIMAIRE",
    idBanks: "001587791",
    nom: "Emploi intérimaire",
    description: "Nombre d'intérimaires en équivalent-emplois à temps plein, en milliers",
    domaine: "emploi",
    unite: "milliers",
    frequence: "trimestriel",
    lastNObs: 60,
  },
];

async function ingestBdmSeries(config: BdmSeriesConfig): Promise<number> {
  const url = `${BDM_BASE}/${config.idBanks}?lastNObservations=${config.lastNObs ?? 60}&detail=dataonly`;
  console.log(`  [BDM:${config.code}] Fetching ${url}...`);
  const xml = await fetchText(url);
  const dataset = parseSdmxResponse(xml);

  if (dataset.series.length === 0) {
    console.warn(`  [BDM:${config.code}] No series returned`);
    return 0;
  }

  // Take the first series (since we're fetching a single idBank)
  const series = dataset.series[0]!;

  const indicator = await prisma.indicateur.upsert({
    where: { code: config.code },
    update: {
      idBank: config.idBanks,
      nom: config.nom,
      domaine: config.domaine,
      unite: config.unite,
      frequence: config.frequence,
      source: "INSEE BDM",
      correction: config.correction ?? null,
    },
    create: {
      code: config.code,
      idBank: config.idBanks,
      nom: config.nom,
      description: config.description,
      domaine: config.domaine,
      unite: config.unite,
      frequence: config.frequence,
      source: "INSEE BDM",
      correction: config.correction ?? null,
    },
  });

  let count = 0;
  for (const obs of series.observations) {
    if (obs.obsValue === null) continue;

    await prisma.observation.upsert({
      where: {
        indicateurId_periode: {
          indicateurId: indicator.id,
          periode: obs.timePeriod,
        },
      },
      update: {
        valeur: obs.obsValue,
        periodeDebut: periodToDate(obs.timePeriod),
        statut: obs.obsStatus ?? null,
      },
      create: {
        indicateurId: indicator.id,
        periode: obs.timePeriod,
        periodeDebut: periodToDate(obs.timePeriod),
        valeur: obs.obsValue,
        statut: obs.obsStatus ?? null,
      },
    });
    count++;
  }

  // Update dernierePeriode
  const lastObs = series.observations[series.observations.length - 1];
  if (lastObs) {
    await prisma.indicateur.update({
      where: { id: indicator.id },
      data: { dernierePeriode: lastObs.timePeriod },
    });
  }

  console.log(`  [BDM:${config.code}] ${count} observations upserted`);
  return count;
}

// ─── Orchestrator ───

export async function ingestEconomie() {
  await logIngestion("economie", async () => {
    let total = 0;

    total += await ingestGdp();

    // Small delay between BDM requests (30 req/min limit)
    for (const config of BDM_SERIES) {
      total += await ingestBdmSeries(config);
      await new Promise((r) => setTimeout(r, 2100)); // ~28 req/min
    }

    return {
      rowsIngested: total,
      metadata: { indicators: 1 + BDM_SERIES.length },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestEconomie()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
