/**
 * Ingest deputies from Datan via data.gouv.fr Tabular API.
 * - Active deputies: resource 092bd7bb-1543-405b-b53c-932ebb49bb8e (577 rows)
 * - Historic deputies: resource 817fda38-d616-43e9-852f-790510f4d157 (~2101 rows)
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchAllRows } from "./lib/api-client";
import { parseDateSafe, parseIntSafe, parseFloatSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

const ACTIVE_RESOURCE = "092bd7bb-1543-405b-b53c-932ebb49bb8e";
const HISTORIC_RESOURCE = "817fda38-d616-43e9-852f-790510f4d157";

/**
 * Normalize department code:
 * - Uppercase (2a → 2A, 2b → 2B)
 * - Keep as-is for overseas (971, 975, etc.) and abroad (099)
 */
function normalizeDeptCode(raw: string): string {
  return raw.toUpperCase();
}

function mapRow(row: Record<string, unknown>, actif: boolean) {
  return {
    id: String(row.id ?? row.__id),
    legislature: parseIntSafe(row.legislature) ?? 0,
    civilite: String(row.civ ?? ""),
    nom: String(row.nom ?? ""),
    prenom: String(row.prenom ?? ""),
    villeNaissance: row.villeNaissance ? String(row.villeNaissance) : null,
    dateNaissance: parseDateSafe(row.naissance),
    age: parseIntSafe(row.age),
    groupe: String(row.groupe ?? ""),
    groupeAbrev: String(row.groupeAbrev ?? ""),
    departementNom: String(row.departementNom ?? ""),
    departementCode: normalizeDeptCode(String(row.departementCode ?? "")),
    circonscription: parseIntSafe(row.circo) ?? 0,
    datePriseFonction: parseDateSafe(row.datePriseFonction),
    profession: row.job ? String(row.job) : null,
    email: row.mail ? String(row.mail) : null,
    twitter: row.twitter ? String(row.twitter) : null,
    facebook: row.facebook ? String(row.facebook) : null,
    website: row.website ? String(row.website) : null,
    nombreMandats: parseIntSafe(row.nombreMandats),
    experienceDepute: row.experienceDepute ? String(row.experienceDepute) : null,
    scoreParticipation: parseFloatSafe(row.scoreParticipation),
    scoreSpecialite: parseFloatSafe(row.scoreParticipationSpecialite),
    scoreLoyaute: parseFloatSafe(row.scoreLoyaute),
    scoreMajorite: parseFloatSafe(row.scoreMajorite),
    actif,
    dateMaj: parseDateSafe(row.dateMaj),
  };
}

export async function ingestDeputes() {
  await logIngestion("deputes", async () => {
    let total = 0;

    // Build set of valid department codes from DB
    const depts = await prisma.departement.findMany({ select: { code: true } });
    const validDeptCodes = new Set(depts.map((d) => d.code));

    // 1. Active deputies
    console.log("  Fetching active deputies...");
    const activeRows = await fetchAllRows(ACTIVE_RESOURCE);
    console.log(`  ${activeRows.length} active deputies fetched`);

    // Collect active IDs to avoid overwriting actif=true with historic actif=false
    const activeIds = new Set<string>();

    for (const row of activeRows) {
      const data = mapRow(row, true);
      activeIds.add(data.id);
      // Set departementRefCode only when the code exists in our table
      const refCode = validDeptCodes.has(data.departementCode) ? data.departementCode : null;
      await prisma.depute.upsert({
        where: { id: data.id },
        update: { ...data, departementRefCode: refCode },
        create: { ...data, departementRefCode: refCode },
      });
    }
    total += activeRows.length;

    // 2. Historic deputies (only upsert those NOT in active set)
    console.log("  Fetching historic deputies...");
    const historicRows = await fetchAllRows(HISTORIC_RESOURCE);
    console.log(`  ${historicRows.length} historic deputies fetched`);

    let historicNew = 0;
    for (const row of historicRows) {
      const data = mapRow(row, false);
      if (activeIds.has(data.id)) continue; // Don't overwrite active deputy
      const refCode = validDeptCodes.has(data.departementCode) ? data.departementCode : null;
      await prisma.depute.upsert({
        where: { id: data.id },
        update: { ...data, departementRefCode: refCode },
        create: { ...data, departementRefCode: refCode },
      });
      historicNew++;
    }
    console.log(`  ${historicNew} historic-only deputies upserted (${historicRows.length - historicNew} skipped as active)`);
    total += historicNew;

    return {
      rowsIngested: total,
      rowsTotal: activeRows.length + historicRows.length,
      metadata: { active: activeRows.length, historic: historicRows.length },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestDeputes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
