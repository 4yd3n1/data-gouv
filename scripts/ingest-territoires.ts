/**
 * Ingest territory reference data from INSEE COG (Code Officiel Géographique).
 * Sources: v_region_2026.csv, v_departement_2026.csv, v_commune_2026.csv
 * Must run before other ingestion scripts (other models FK into territories).
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

const COG_BASE = "https://www.insee.fr/fr/statistiques/fichier/8740222";
const YEAR = "2026";

interface CogRegion {
  REG: string;
  CHEFLIEU: string;
  TNCC: string;
  NCC: string;
  NCCENR: string;
  LIBELLE: string;
}

interface CogDepartement {
  DEP: string;
  REG: string;
  CHEFLIEU: string;
  TNCC: string;
  NCC: string;
  NCCENR: string;
  LIBELLE: string;
}

interface CogCommune {
  TYPECOM: string;
  COM: string;
  REG: string;
  DEP: string;
  CTCD: string;
  ARR: string;
  TNCC: string;
  NCC: string;
  NCCENR: string;
  LIBELLE: string;
  CAN: string;
  COMPARENT: string;
}

export async function ingestTerritoires() {
  await logIngestion("territoires", async () => {
    let total = 0;

    // 1. Regions
    console.log("  Fetching regions...");
    const regionCsv = await fetchText(`${COG_BASE}/v_region_${YEAR}.csv`);
    const regions = parseCsv<CogRegion>(regionCsv);

    for (const r of regions) {
      await prisma.region.upsert({
        where: { code: r.REG },
        update: {
          cheflieu: r.CHEFLIEU || null,
          tncc: parseIntSafe(r.TNCC),
          ncc: r.NCC,
          libelle: r.LIBELLE,
        },
        create: {
          code: r.REG,
          cheflieu: r.CHEFLIEU || null,
          tncc: parseIntSafe(r.TNCC),
          ncc: r.NCC,
          libelle: r.LIBELLE,
        },
      });
    }
    console.log(`  ${regions.length} regions upserted`);
    total += regions.length;

    // 2. Departements
    console.log("  Fetching departements...");
    const deptCsv = await fetchText(`${COG_BASE}/v_departement_${YEAR}.csv`);
    const depts = parseCsv<CogDepartement>(deptCsv);

    for (const d of depts) {
      await prisma.departement.upsert({
        where: { code: d.DEP },
        update: {
          regionCode: d.REG,
          cheflieu: d.CHEFLIEU || null,
          tncc: parseIntSafe(d.TNCC),
          ncc: d.NCC,
          libelle: d.LIBELLE,
        },
        create: {
          code: d.DEP,
          regionCode: d.REG,
          cheflieu: d.CHEFLIEU || null,
          tncc: parseIntSafe(d.TNCC),
          ncc: d.NCC,
          libelle: d.LIBELLE,
        },
      });
    }
    console.log(`  ${depts.length} departements upserted`);
    total += depts.length;

    // 3. Communes (batch upserts for performance — ~35,000 rows)
    // Some delegated communes (COMD/COMA) have empty DEP/REG — derive from parent or commune code
    console.log("  Fetching communes...");
    const communeCsv = await fetchText(`${COG_BASE}/v_commune_${YEAR}.csv`);
    const communes = parseCsv<CogCommune>(communeCsv);

    // Build a quick lookup for DEP/REG from communes that have them
    const comLookup = new Map<string, { dep: string; reg: string }>();
    for (const c of communes) {
      if (c.DEP && c.REG) {
        comLookup.set(c.COM, { dep: c.DEP, reg: c.REG });
      }
    }

    // Resolve DEP/REG for communes missing them
    const resolved = communes.map((c) => {
      let dep = c.DEP;
      let reg = c.REG;

      if (!dep || !reg) {
        // Try parent commune
        if (c.COMPARENT) {
          const parent = comLookup.get(c.COMPARENT);
          if (parent) {
            dep = dep || parent.dep;
            reg = reg || parent.reg;
          }
        }
        // Derive DEP from commune code as fallback
        if (!dep) {
          if (c.COM.startsWith("97")) dep = c.COM.substring(0, 3);
          else if (c.COM.startsWith("2A") || c.COM.startsWith("2B")) dep = c.COM.substring(0, 2);
          else dep = c.COM.substring(0, 2);
        }
      }

      return { ...c, DEP: dep, REG: reg };
    });

    // Filter to only communes with valid DEP (skip if still empty)
    const validCommunes = resolved.filter((c) => c.DEP);
    const skipped = resolved.length - validCommunes.length;
    if (skipped > 0) console.log(`  Skipping ${skipped} communes with unresolvable DEP`);

    // Also verify DEP exists in our departement table
    const validDepts = new Set(depts.map((d) => d.DEP));

    const BATCH = 500;
    let communeCount = 0;
    for (let i = 0; i < validCommunes.length; i += BATCH) {
      const batch = validCommunes.slice(i, i + BATCH);
      await Promise.all(
        batch
          .filter((c) => validDepts.has(c.DEP))
          .map((c) =>
            prisma.commune.upsert({
              where: { code: c.COM },
              update: {
                departementCode: c.DEP,
                regionCode: c.REG || "00",
                typecom: c.TYPECOM,
                tncc: parseIntSafe(c.TNCC),
                ncc: c.NCC,
                libelle: c.LIBELLE,
                can: c.CAN || null,
                arr: c.ARR || null,
                comparent: c.COMPARENT || null,
              },
              create: {
                code: c.COM,
                departementCode: c.DEP,
                regionCode: c.REG || "00",
                typecom: c.TYPECOM,
                tncc: parseIntSafe(c.TNCC),
                ncc: c.NCC,
                libelle: c.LIBELLE,
                can: c.CAN || null,
                arr: c.ARR || null,
                comparent: c.COMPARENT || null,
              },
            })
          )
      );
      communeCount = Math.min(i + BATCH, validCommunes.length);
      if (communeCount % 5000 === 0 || i + BATCH >= validCommunes.length) {
        console.log(`  ${communeCount}/${validCommunes.length} communes...`);
      }
    }
    console.log(`  ${validCommunes.length} communes upserted`);
    total += validCommunes.length;

    return { rowsIngested: total, rowsTotal: total };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestTerritoires()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
