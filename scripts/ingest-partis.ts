/**
 * Ingest political party accounts from CNCCFP (Commission nationale des comptes de campagne
 * et des financements politiques).
 * Source: data.gouv.fr static CSVs — 4 years of detailed accounting (2021–2024).
 *
 * Each CSV has ~160 columns of accounting detail; we extract the key financial indicators
 * (revenues, expenses, result, loans, cash) per party per year.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseFloatSafe, parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

// ─── Data sources: CNCCFP party accounts by exercise year ───

const SOURCES: { year: number; url: string }[] = [
  {
    year: 2024,
    url: "https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-110641/comptes-partis-exercice-2024.csv",
  },
  {
    year: 2023,
    url: "https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-120352/comptes-partis-exercice-2023.csv",
  },
  {
    year: 2022,
    url: "https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-121141/comptes-partis-exercice-2022.csv",
  },
  {
    year: 2021,
    url: "https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-151846/comptes-partis-exercice-2021.csv",
  },
];

// ─── CSV column name mapping ───
// The CSV uses verbose French column names with special characters (+, ', etc.)

type PartiRow = Record<string, string>;

function extractPartyData(row: PartiRow, fallbackYear: number) {
  const codeCNCC = parseIntSafe(row["Code_CNCCFP"]);
  const nom = (row["Nom_du_parti"] ?? "").trim();
  const exercice = parseIntSafe(row["Exercice"]) ?? fallbackYear;

  if (codeCNCC === null || !nom) return null;

  // Revenue columns
  const cotisationsAdherents = parseFloatSafe(row["Cotisations_des_adherents"]) ?? 0;
  const cotisationsElus = parseFloatSafe(row["Cotisations_des_elus"]) ?? 0;
  const aidePublique1 = parseFloatSafe(row["Aide_publique_1ere_fraction"]) ?? 0;
  const aidePublique2 = parseFloatSafe(row["Aide_publique_2nde_fraction"]) ?? 0;
  const donsPersonnes = parseFloatSafe(row["Dons_de_personne_physique"]) ?? 0;
  const contributionsPartis = parseFloatSafe(row["Contributions_financieres_de_partis_ou_groupements_politiques"]) ?? 0;

  // Expense columns
  const contributionsCandidats = parseFloatSafe(row["Contributions_versees_aux_candidats"]) ?? 0;
  const salaires = parseFloatSafe(row["Salaires_et_traitements"]) ?? 0;
  const chargesSociales = parseFloatSafe(row["Charges_sociales"]) ?? 0;
  const communication = parseFloatSafe(row["Communication_presse_publications_televisions_publicite_sites_internet_reseaux_sociaux"]) ?? 0;

  // Totals
  const totalProduits = parseFloatSafe(row["Total_des_produits_I_+_III_+_V"]) ?? 0;
  const totalCharges = parseFloatSafe(row["Total_des_charges_II_+_IV_+VI_+_VII_+_VIII_+_IX"]) ?? 0;
  const resultat = parseFloatSafe(row["EXCEDENT_OU_DEFICIT_D_ENSEMBLE"]) ?? 0;

  // Balance sheet: sum all 4 loan columns for total emprunts
  const empruntsCredit = parseFloatSafe(row["Emprunts_et_dettes_aupres_d_etablissement_de_credit"]) ?? 0;
  const empruntsPhysiquesPref = parseFloatSafe(row["Emprunts_et_dettes_aupres_de_personnes_physiques_a_taux_preferentiel"]) ?? 0;
  const empruntsPhysiquesAutres = parseFloatSafe(row["Autres_emprunts_et_dettes_aupres_de_personnes_physiques"]) ?? 0;
  const empruntsPartis = parseFloatSafe(row["Emprunts_et_dettes_aupres_de_partis_ou_groupements_politiques"]) ?? 0;
  const emprunts = empruntsCredit + empruntsPhysiquesPref + empruntsPhysiquesAutres + empruntsPartis;

  const disponibilites = parseFloatSafe(row["Disponibilites_net"]) ?? 0;

  return {
    codeCNCC,
    nom,
    exercice,
    cotisationsAdherents,
    cotisationsElus,
    aidePublique1,
    aidePublique2,
    donsPersonnes,
    contributionsPartis,
    contributionsCandidats,
    salaires,
    chargesSociales,
    communication,
    totalProduits,
    totalCharges,
    resultat,
    emprunts,
    disponibilites,
  };
}

// ─── Main ingestion ───

export async function ingestPartis() {
  await logIngestion("partis", async () => {
    let totalIngested = 0;
    let totalRows = 0;

    for (const source of SOURCES) {
      console.log(`  [${source.year}] Fetching CSV...`);
      const text = await fetchText(source.url);
      const rows = parseCsv<PartiRow>(text, { delimiter: ";" });
      console.log(`  [${source.year}] ${rows.length} rows parsed`);
      totalRows += rows.length;

      let yearCount = 0;
      for (const row of rows) {
        const data = extractPartyData(row, source.year);
        if (!data) continue;

        const { codeCNCC, exercice, ...fields } = data;

        await prisma.partiPolitique.upsert({
          where: {
            codeCNCC_exercice: { codeCNCC, exercice },
          },
          update: fields,
          create: { codeCNCC, exercice, ...fields },
        });
        yearCount++;
      }

      console.log(`  [${source.year}] ${yearCount} parties upserted`);
      totalIngested += yearCount;
    }

    return {
      rowsIngested: totalIngested,
      rowsTotal: totalRows,
      metadata: { years: SOURCES.map((s) => s.year) },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestPartis()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
