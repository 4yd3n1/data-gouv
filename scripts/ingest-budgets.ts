/**
 * Ingest local government finances — BudgetLocal.
 *
 * Source: OFGL (Observatoire des Finances et de la Gestion publique Locale)
 *   Communes:    data.ofgl.fr — ofgl-base-communes-consolidee
 *   Départements: data.ofgl.fr — ofgl-base-departements-consolidee
 *
 * Data format: long (one row per entity/year/aggregate), semicolon CSV.
 * We select only the 4 aggregates the UI actually renders, pivot to wide,
 * and compute derived per-habitant fields before upsert.
 *
 * Aggregates used:
 *   "Dépenses totales"       → totalDepenses
 *   "Recettes totales"       → totalRecettes
 *   "Frais de personnel"     → chargesPersonnel
 *   "Encours de dette"       → encoursDette
 *
 * Years: 2020–2023 for depts (trend chart needs 3-4 pts); 2022-2023 for communes.
 *
 * Run: pnpm ingest:budgets
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseFloatSafe, parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

// ─── OFGL Opendatasoft API ───

const OFGL = "https://data.ofgl.fr/api/explore/v2.1/catalog/datasets";

// The 4 aggregates we actually render in the UI
const NEEDED = [
  "Dépenses totales",
  "Recettes totales",
  "Frais de personnel",
  "Encours de dette",
];

// Fallback names for the same concepts (used by some years/entities)
const DEPENSES_FALLBACK = "Dépenses totales hors remb";
const RECETTES_FALLBACK = "Recettes totales hors emprunts";

function buildUrl(dataset: string, extraWhere: string): string {
  const agregats = [...NEEDED, DEPENSES_FALLBACK, RECETTES_FALLBACK]
    .map((a) => `"${a}"`)
    .join(",");
  const where = encodeURIComponent(`${extraWhere} and agregat in (${agregats})`);
  return `${OFGL}/${dataset}/exports/csv?select=exer,dep_code,dep_name,agregat,montant,ptot&where=${where}&delimiter=%3B`;
}

function buildCommuneUrl(extraWhere: string): string {
  const agregats = [...NEEDED, DEPENSES_FALLBACK, RECETTES_FALLBACK]
    .map((a) => `"${a}"`)
    .join(",");
  const where = encodeURIComponent(`${extraWhere} and agregat in (${agregats})`);
  return `${OFGL}/ofgl-base-communes-consolidee/exports/csv?select=exer,insee,com_name,agregat,montant,ptot&where=${where}&delimiter=%3B`;
}

// ─── Pivot helper ───

interface WideRecord {
  geoCode: string;
  geoLibelle: string;
  annee: number;
  population: number | null;
  totalDepenses: number | null;
  totalRecettes: number | null;
  chargesPersonnel: number | null;
  encoursDette: number | null;
  // fallback accumulators
  totalDepensesHorsRemb: number | null;
  totalRecettesHorsEmprunts: number | null;
}

function newWide(code: string, libelle: string, annee: number): WideRecord {
  return {
    geoCode: code,
    geoLibelle: libelle,
    annee,
    population: null,
    totalDepenses: null,
    totalRecettes: null,
    chargesPersonnel: null,
    encoursDette: null,
    totalDepensesHorsRemb: null,
    totalRecettesHorsEmprunts: null,
  };
}

function applyAgregat(rec: WideRecord, agregat: string, montant: number) {
  switch (agregat) {
    case "Dépenses totales":
      rec.totalDepenses = (rec.totalDepenses ?? 0) + montant;
      break;
    case DEPENSES_FALLBACK:
      rec.totalDepensesHorsRemb = (rec.totalDepensesHorsRemb ?? 0) + montant;
      break;
    case "Recettes totales":
      rec.totalRecettes = (rec.totalRecettes ?? 0) + montant;
      break;
    case RECETTES_FALLBACK:
      rec.totalRecettesHorsEmprunts = (rec.totalRecettesHorsEmprunts ?? 0) + montant;
      break;
    case "Frais de personnel":
      rec.chargesPersonnel = (rec.chargesPersonnel ?? 0) + montant;
      break;
    case "Encours de dette":
      rec.encoursDette = (rec.encoursDette ?? 0) + montant;
      break;
  }
}

function finalise(rec: WideRecord) {
  // Use fallback if primary aggregate not present
  const depenses = rec.totalDepenses ?? rec.totalDepensesHorsRemb;
  const recettes = rec.totalRecettes ?? rec.totalRecettesHorsEmprunts;
  const pop = rec.population;

  const depenseParHab = depenses && pop ? Math.round((depenses / pop) * 100) / 100 : null;
  const detteParHab = rec.encoursDette && pop
    ? Math.round((rec.encoursDette / pop) * 100) / 100
    : null;
  const resultatComptable =
    depenses !== null && recettes !== null ? recettes - depenses : null;

  return {
    geoLibelle: rec.geoLibelle,
    population: pop,
    totalDepenses: depenses,
    totalRecettes: recettes,
    chargesPersonnel: rec.chargesPersonnel,
    encoursDette: rec.encoursDette,
    depenseParHab,
    detteParHab,
    resultatComptable,
    // Unused by UI but in schema — leave null
    recettesFonct: null,
    recettesInvest: null,
    depensesFonct: null,
    depensesInvest: null,
    impotsTaxes: null,
    dotationsSubv: null,
    annuiteDette: null,
  };
}

// ─── Département ingestion ───

async function ingestDeptBudgets(): Promise<number> {
  console.log("  [BudgetDept] Fetching from OFGL API (2020–2023)...");

  const yearFilter =
    "exer >= date'2020' and exer <= date'2023'";
  const url = buildUrl("ofgl-base-departements-consolidee", yearFilter);

  let csvText: string;
  try {
    csvText = await fetchText(url);
  } catch (err) {
    console.error("  [BudgetDept] Fetch failed:", err);
    return 0;
  }

  // The dept dataset uses different column names; remap for parseCsv
  // select=exer,dep_code,dep_name,agregat,montant,ptot
  // The consolidated dept dataset doesn't have dep_code in select — use dep_code from field list
  const rows = parseCsv<Record<string, string>>(csvText, { delimiter: ";" });
  console.log(`  [BudgetDept] ${rows.length} rows parsed`);

  if (rows.length === 0) return 0;

  // Load valid dept codes
  const validDepts = new Set(
    (await prisma.departement.findMany({ select: { code: true } })).map((d) => d.code)
  );

  // Group by (dep_code, year)
  const map = new Map<string, WideRecord>();

  for (const row of rows) {
    const depCode = row["dep_code"];
    const exerStr = row["exer"];
    const agregat = row["agregat"];
    const montantStr = row["montant"];
    const ptotStr = row["ptot"];
    const libelle = row["dep_name"] ?? "";

    if (!depCode || !exerStr || !agregat) continue;
    const annee = parseInt(exerStr);
    if (isNaN(annee)) continue;
    if (!validDepts.has(depCode)) continue;

    const montant = parseFloatSafe(montantStr);
    if (montant === null) continue;

    const key = `${depCode}_${annee}`;
    if (!map.has(key)) map.set(key, newWide(depCode, libelle, annee));
    const rec = map.get(key)!;

    // Population: take first non-null
    if (rec.population === null) {
      const pop = parseIntSafe(ptotStr);
      if (pop) rec.population = pop;
    }

    applyAgregat(rec, agregat, montant);
  }

  console.log(`  [BudgetDept] ${map.size} unique (dept × year) records to upsert`);

  let count = 0;
  for (const [, rec] of map) {
    const fields = finalise(rec);
    await prisma.budgetLocal.upsert({
      where: { geoType_geoCode_annee: { geoType: "DEP", geoCode: rec.geoCode, annee: rec.annee } },
      update: fields,
      create: { geoType: "DEP", geoCode: rec.geoCode, annee: rec.annee, ...fields },
    });
    count++;
  }

  console.log(`  [BudgetDept] ${count} upserted`);
  return count;
}

// ─── Commune ingestion ───

async function ingestCommuneBudgets(): Promise<number> {
  console.log("  [BudgetCommune] Fetching from OFGL API (2022–2023)...");

  const yearFilter = "exer >= date'2022' and exer <= date'2023'";
  const url = buildCommuneUrl(yearFilter);

  let csvText: string;
  try {
    csvText = await fetchText(url);
  } catch (err) {
    console.error("  [BudgetCommune] Fetch failed:", err);
    return 0;
  }

  const rows = parseCsv<Record<string, string>>(csvText, { delimiter: ";" });
  console.log(`  [BudgetCommune] ${rows.length} rows parsed`);

  if (rows.length === 0) return 0;

  // Load valid commune codes (COM type only)
  const validCodes = new Set(
    (
      await prisma.commune.findMany({
        select: { code: true },
        where: { typecom: "COM" },
      })
    ).map((c) => c.code)
  );

  const map = new Map<string, WideRecord>();

  for (const row of rows) {
    const insee = row["insee"];
    const exerStr = row["exer"];
    const agregat = row["agregat"];
    const montantStr = row["montant"];
    const ptotStr = row["ptot"];
    const libelle = row["com_name"] ?? "";

    if (!insee || !exerStr || !agregat) continue;
    const annee = parseInt(exerStr);
    if (isNaN(annee)) continue;
    if (!validCodes.has(insee)) continue;

    const montant = parseFloatSafe(montantStr);
    if (montant === null) continue;

    const key = `${insee}_${annee}`;
    if (!map.has(key)) map.set(key, newWide(insee, libelle, annee));
    const rec = map.get(key)!;

    if (rec.population === null) {
      const pop = parseIntSafe(ptotStr);
      if (pop) rec.population = pop;
    }

    applyAgregat(rec, agregat, montant);
  }

  console.log(`  [BudgetCommune] ${map.size} unique (commune × year) records to upsert`);

  let count = 0;
  // Batch upserts in chunks of 500
  const entries = [...map.values()];
  for (let i = 0; i < entries.length; i += 500) {
    const chunk = entries.slice(i, i + 500);
    await Promise.all(
      chunk.map((rec) => {
        const fields = finalise(rec);
        return prisma.budgetLocal.upsert({
          where: { geoType_geoCode_annee: { geoType: "COM", geoCode: rec.geoCode, annee: rec.annee } },
          update: fields,
          create: { geoType: "COM", geoCode: rec.geoCode, annee: rec.annee, ...fields },
        });
      })
    );
    count += chunk.length;
    if (i % 10000 === 0 && i > 0) {
      console.log(`  [BudgetCommune] ${count} upserted...`);
    }
  }

  console.log(`  [BudgetCommune] ${count} upserted`);
  return count;
}

// ─── Orchestrator ───

export async function ingestBudgets() {
  await logIngestion("budgets", async () => {
    let total = 0;
    total += await ingestDeptBudgets();
    total += await ingestCommuneBudgets();
    return {
      rowsIngested: total,
      metadata: { types: ["DEP", "COM"], source: "OFGL" },
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
