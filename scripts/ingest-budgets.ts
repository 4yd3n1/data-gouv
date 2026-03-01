/**
 * Ingest DGFIP Finances Locales — BudgetLocal.
 *
 * Sources:
 *   Communes: data.gouv.fr — "Comptes individuels des communes et des groupements"
 *   Départements: data.gouv.fr — "Comptes individuels des départements"
 *
 * Data format: CSV, semicolon-separated
 * Coverage: Commune budgets (annual), latest 3 years
 *
 * Key columns (commune):
 *   INSEE_COM, LBUDG, EXERCICE, POP,
 *   TOTAL_PROD, TOTAL_CHARGES, FONCT_PROD, FONCT_CHARGES, INVEST_PROD, INVEST_CHARGES,
 *   IMPOTS_TAXES, DOTATIONS_SUBVENTIONS, CHARGES_PERSONNEL, ENCOURS_DETTE, ANNUITE_DETTE
 *
 * Run: pnpm ingest:budgets
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseFloatSafe, parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

// ─── DGFIP resource URLs (data.gouv.fr Tabular API) ───
// Communes — annual accounts, latest year available
const COMMUNES_CSV_URL =
  "https://data.collectivites-locales.gouv.fr/api/explore/v2.1/catalog/datasets/balances-comptables-des-communes/exports/csv?select=insee_code%2Cnombloc%2Cexercice%2Cpop%2Ctotal_prod%2Ctotal_charges%2Cfonct_prod%2Cfonct_charges%2Cinvest_prod%2Cinvest_charges%2Cimpots_taxes%2Cdotations_subventions%2Ccharges_personnel%2Cencours_dette%2Cannuite_dette&where=exercice%20in%20(2022%2C2021%2C2020)&limit=500000&offset=0&lang=fr&delimiter=%3B";

// Fallback: data.gouv.fr static export
const COMMUNES_FALLBACK_URL =
  "https://www.data.gouv.fr/fr/datasets/r/f517e2c4-b1b7-47b7-8afe-a8b3e2a4f0b1";

// Départements CSV
const DEPTS_CSV_URL =
  "https://data.collectivites-locales.gouv.fr/api/explore/v2.1/catalog/datasets/balances-comptables-des-departements/exports/csv?select=dep_code%2Cnombloc%2Cexercice%2Cpop%2Ctotal_prod%2Ctotal_charges%2Cfonct_prod%2Cfonct_charges%2Cinvest_prod%2Cinvest_charges%2Cimpots_taxes%2Cdotations_subventions%2Ccharges_personnel%2Cencours_dette%2Cannuite_dette&where=exercice%20in%20(2022%2C2021%2C2020)&limit=1000&delimiter=%3B";

// ─── Column name mapping (CSV columns vary by export year) ───

interface CommuneRow {
  insee_code?: string;
  INSEE_COM?: string;
  CINSEE?: string;
  nombloc?: string;
  LBUDG?: string;
  exercice?: string;
  EXERCICE?: string;
  pop?: string;
  POP?: string;
  total_prod?: string;
  TOTAL_PROD?: string;
  PROD_TOT_BP?: string;
  total_charges?: string;
  TOTAL_CHARGES?: string;
  CHARGES_TOT_BP?: string;
  fonct_prod?: string;
  FONCT_PROD?: string;
  fonct_charges?: string;
  FONCT_CHARGES?: string;
  invest_prod?: string;
  INVEST_PROD?: string;
  invest_charges?: string;
  INVEST_CHARGES?: string;
  impots_taxes?: string;
  IMPOTS_TAXES?: string;
  dotations_subventions?: string;
  DOTATIONS_SUBVENTIONS?: string;
  charges_personnel?: string;
  CHARGES_PERSONNEL?: string;
  encours_dette?: string;
  ENCOURS_DETTE?: string;
  annuite_dette?: string;
  ANNUITE_DETTE?: string;
  [key: string]: string | undefined;
}

function col(row: CommuneRow, ...names: string[]): string | undefined {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== "") return row[name];
  }
  return undefined;
}

// ─── Commune ingestion ───

async function ingestCommuneBudgets(): Promise<number> {
  console.log("  [BudgetCommune] Fetching CSV...");

  let csvText: string;
  try {
    csvText = await fetchText(COMMUNES_CSV_URL);
  } catch {
    console.warn("  [BudgetCommune] Primary URL failed, trying fallback...");
    try {
      csvText = await fetchText(COMMUNES_FALLBACK_URL);
    } catch (err) {
      console.error("  [BudgetCommune] Both URLs failed:", err);
      console.warn("  [BudgetCommune] Skipping commune budget ingestion.");
      return 0;
    }
  }

  const rows = parseCsv<CommuneRow>(csvText, { delimiter: ";" });
  console.log(`  [BudgetCommune] ${rows.length} rows parsed`);

  if (rows.length === 0) {
    console.warn("  [BudgetCommune] No rows — CSV may be empty or wrong format");
    return 0;
  }

  // Load valid commune codes for FK validation
  const validCodes = new Set(
    (await prisma.commune.findMany({ select: { code: true }, where: { typecom: "COM" } }))
      .map((c) => c.code)
  );

  let count = 0;
  let skipped = 0;

  for (const row of rows) {
    const geoCode = col(row, "insee_code", "INSEE_COM", "CINSEE");
    const exerciceStr = col(row, "exercice", "EXERCICE");
    const libelle = col(row, "nombloc", "LBUDG") ?? "";

    if (!geoCode || !exerciceStr) { skipped++; continue; }

    const annee = parseInt(exerciceStr);
    if (isNaN(annee) || annee < 2000 || annee > 2030) { skipped++; continue; }

    // Only ingest known communes
    if (!validCodes.has(geoCode)) { skipped++; continue; }

    const population = parseIntSafe(col(row, "pop", "POP"));
    const totalRecettes = parseFloatSafe(col(row, "total_prod", "TOTAL_PROD", "PROD_TOT_BP"));
    const totalDepenses = parseFloatSafe(col(row, "total_charges", "TOTAL_CHARGES", "CHARGES_TOT_BP"));
    const recettesFonct = parseFloatSafe(col(row, "fonct_prod", "FONCT_PROD"));
    const recettesInvest = parseFloatSafe(col(row, "invest_prod", "INVEST_PROD"));
    const depensesFonct = parseFloatSafe(col(row, "fonct_charges", "FONCT_CHARGES"));
    const depensesInvest = parseFloatSafe(col(row, "invest_charges", "INVEST_CHARGES"));
    const impotsTaxes = parseFloatSafe(col(row, "impots_taxes", "IMPOTS_TAXES"));
    const dotationsSubv = parseFloatSafe(col(row, "dotations_subventions", "DOTATIONS_SUBVENTIONS"));
    const chargesPersonnel = parseFloatSafe(col(row, "charges_personnel", "CHARGES_PERSONNEL"));
    const encoursDette = parseFloatSafe(col(row, "encours_dette", "ENCOURS_DETTE"));
    const annuiteDette = parseFloatSafe(col(row, "annuite_dette", "ANNUITE_DETTE"));

    // Derived per-habitant metrics
    const depenseParHab =
      population && totalDepenses ? Math.round((totalDepenses / population) * 100) / 100 : null;
    const detteParHab =
      population && encoursDette ? Math.round((encoursDette / population) * 100) / 100 : null;
    const resultatComptable =
      totalRecettes !== null && totalDepenses !== null
        ? totalRecettes - totalDepenses
        : null;

    await prisma.budgetLocal.upsert({
      where: { geoType_geoCode_annee: { geoType: "COM", geoCode, annee } },
      update: {
        geoLibelle: libelle,
        population,
        totalRecettes,
        totalDepenses,
        recettesFonct,
        recettesInvest,
        depensesFonct,
        depensesInvest,
        impotsTaxes,
        dotationsSubv,
        chargesPersonnel,
        encoursDette,
        annuiteDette,
        resultatComptable,
        depenseParHab,
        detteParHab,
      },
      create: {
        geoType: "COM",
        geoCode,
        geoLibelle: libelle,
        annee,
        population,
        totalRecettes,
        totalDepenses,
        recettesFonct,
        recettesInvest,
        depensesFonct,
        depensesInvest,
        impotsTaxes,
        dotationsSubv,
        chargesPersonnel,
        encoursDette,
        annuiteDette,
        resultatComptable,
        depenseParHab,
        detteParHab,
      },
    });
    count++;
  }

  console.log(`  [BudgetCommune] ${count} upserted, ${skipped} skipped`);
  return count;
}

// ─── Département ingestion ───

async function ingestDeptBudgets(): Promise<number> {
  console.log("  [BudgetDept] Fetching CSV...");

  let csvText: string;
  try {
    csvText = await fetchText(DEPTS_CSV_URL);
  } catch (err) {
    console.warn(`  [BudgetDept] Fetch failed: ${err}. Skipping.`);
    return 0;
  }

  const rows = parseCsv<Record<string, string>>(csvText, { delimiter: ";" });
  console.log(`  [BudgetDept] ${rows.length} rows parsed`);

  const validDepts = new Set(
    (await prisma.departement.findMany({ select: { code: true } })).map((d) => d.code)
  );

  let count = 0;

  for (const row of rows) {
    const geoCode = row["dep_code"] ?? row["DEP_CODE"] ?? row["CINSEE"];
    const exerciceStr = row["exercice"] ?? row["EXERCICE"];
    const libelle = row["nombloc"] ?? row["LBUDG"] ?? "";

    if (!geoCode || !exerciceStr) continue;
    const annee = parseInt(exerciceStr);
    if (isNaN(annee)) continue;
    if (!validDepts.has(geoCode)) continue;

    const population = parseIntSafe(row["pop"] ?? row["POP"]);
    const totalRecettes = parseFloatSafe(row["total_prod"] ?? row["TOTAL_PROD"]);
    const totalDepenses = parseFloatSafe(row["total_charges"] ?? row["TOTAL_CHARGES"]);
    const recettesFonct = parseFloatSafe(row["fonct_prod"] ?? row["FONCT_PROD"]);
    const recettesInvest = parseFloatSafe(row["invest_prod"] ?? row["INVEST_PROD"]);
    const depensesFonct = parseFloatSafe(row["fonct_charges"] ?? row["FONCT_CHARGES"]);
    const depensesInvest = parseFloatSafe(row["invest_charges"] ?? row["INVEST_CHARGES"]);
    const impotsTaxes = parseFloatSafe(row["impots_taxes"] ?? row["IMPOTS_TAXES"]);
    const dotationsSubv = parseFloatSafe(row["dotations_subventions"] ?? row["DOTATIONS_SUBVENTIONS"]);
    const chargesPersonnel = parseFloatSafe(row["charges_personnel"] ?? row["CHARGES_PERSONNEL"]);
    const encoursDette = parseFloatSafe(row["encours_dette"] ?? row["ENCOURS_DETTE"]);
    const annuiteDette = parseFloatSafe(row["annuite_dette"] ?? row["ANNUITE_DETTE"]);

    const depenseParHab =
      population && totalDepenses ? Math.round((totalDepenses / population) * 100) / 100 : null;
    const detteParHab =
      population && encoursDette ? Math.round((encoursDette / population) * 100) / 100 : null;
    const resultatComptable =
      totalRecettes !== null && totalDepenses !== null ? totalRecettes - totalDepenses : null;

    await prisma.budgetLocal.upsert({
      where: { geoType_geoCode_annee: { geoType: "DEP", geoCode, annee } },
      update: {
        geoLibelle: libelle,
        population,
        totalRecettes,
        totalDepenses,
        recettesFonct,
        recettesInvest,
        depensesFonct,
        depensesInvest,
        impotsTaxes,
        dotationsSubv,
        chargesPersonnel,
        encoursDette,
        annuiteDette,
        resultatComptable,
        depenseParHab,
        detteParHab,
      },
      create: {
        geoType: "DEP",
        geoCode,
        geoLibelle: libelle,
        annee,
        population,
        totalRecettes,
        totalDepenses,
        recettesFonct,
        recettesInvest,
        depensesFonct,
        depensesInvest,
        impotsTaxes,
        dotationsSubv,
        chargesPersonnel,
        encoursDette,
        annuiteDette,
        resultatComptable,
        depenseParHab,
        detteParHab,
      },
    });
    count++;
  }

  console.log(`  [BudgetDept] ${count} upserted`);
  return count;
}

// ─── Orchestrator ───

export async function ingestBudgets() {
  await logIngestion("budgets", async () => {
    let total = 0;
    total += await ingestCommuneBudgets();
    total += await ingestDeptBudgets();
    return {
      rowsIngested: total,
      metadata: { types: ["COM", "DEP"] },
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestBudgets()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
