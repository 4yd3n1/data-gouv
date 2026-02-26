/**
 * Ingest historical monuments from Ministère de la Culture.
 * Source: Tabular API resource 3a52af4a-f9da-4dcc-8110-b07774dfb3bc (46,697 rows)
 * ~234 pages at 200/page.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchAllPages } from "./lib/api-client";
import { parseFloatSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

const RESOURCE_ID = "3a52af4a-f9da-4dcc-8110-b07774dfb3bc";

/**
 * Parse GPS coordinates from "lat, lon" format.
 * Handles variations: "48.8566, 2.3522", "48.8566,2.3522", empty.
 */
function parseCoords(val: unknown): { latitude: number | null; longitude: number | null } {
  if (!val || typeof val !== "string") return { latitude: null, longitude: null };
  const parts = val.split(",").map((s) => s.trim());
  if (parts.length !== 2) return { latitude: null, longitude: null };
  const lat = parseFloat(parts[0]!);
  const lon = parseFloat(parts[1]!);
  if (isNaN(lat) || isNaN(lon)) return { latitude: null, longitude: null };
  // Sanity check: France is roughly 41-51°N, -5-10°E
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return { latitude: null, longitude: null };
  return { latitude: lat, longitude: lon };
}

export async function ingestMonuments() {
  await logIngestion("monuments", async () => {
    console.log("  Fetching historical monuments data (this may take a few minutes)...");

    let rowCount = 0;
    let upserted = 0;

    for await (const batch of fetchAllPages(RESOURCE_ID, { delayMs: 150 })) {
      const upserts = batch.map(async (row) => {
        rowCount++;
        const ref = String(row.Reference ?? "").trim();
        if (!ref) return;

        const coordStr = row.coordonnees_au_format_WGS84
          ? String(row.coordonnees_au_format_WGS84)
          : null;
        const { latitude, longitude } = parseCoords(coordStr);

        // Resolve department code
        const deptNum = row.Departement_format_numerique
          ? String(row.Departement_format_numerique).trim()
          : null;

        // Resolve commune code
        const cogInsee = row.COG_Insee_lors_de_la_protection
          ? String(row.COG_Insee_lors_de_la_protection).trim()
          : null;

        // Validate FKs exist before setting them
        let validDept = false;
        if (deptNum) {
          const dept = await prisma.departement.findUnique({
            where: { code: deptNum },
            select: { code: true },
          });
          validDept = !!dept;
        }

        let validCommune = false;
        if (cogInsee) {
          const commune = await prisma.commune.findUnique({
            where: { code: cogInsee },
            select: { code: true },
          });
          validCommune = !!commune;
        }

        const data = {
          denomination: row.Denomination_de_l_edifice ? String(row.Denomination_de_l_edifice) : null,
          domaine: row.Domaine ? String(row.Domaine) : null,
          communeNom: row.Commune_forme_index ? String(row.Commune_forme_index) : null,
          communeCode: validCommune ? cogInsee : null,
          departementCode: validDept ? deptNum : null,
          departementNom: row.Departement_en_lettres ? String(row.Departement_en_lettres) : null,
          region: row.Region ? String(row.Region) : null,
          adresse: row.Adresse_forme_index ? String(row.Adresse_forme_index) : null,
          sieclePrincipal: row.Siecle_de_la_campagne_principale_de_construction
            ? String(row.Siecle_de_la_campagne_principale_de_construction) : null,
          siecleSecondaire: row.Siecle_de_campagne_secondaire_de_construction
            ? String(row.Siecle_de_campagne_secondaire_de_construction) : null,
          protectionType: row.Typologie_de_la_protection ? String(row.Typologie_de_la_protection) : null,
          protectionDate: row.Date_et_typologie_de_la_protection
            ? String(row.Date_et_typologie_de_la_protection) : null,
          statutJuridique: row.Statut_juridique_de_l_edifice
            ? String(row.Statut_juridique_de_l_edifice) : null,
          description: row.Description_de_l_edifice ? String(row.Description_de_l_edifice) : null,
          historique: row.Historique ? String(row.Historique) : null,
          coordonnees: coordStr,
          latitude,
          longitude,
          dateMaj: row.Date_de_la_derniere_mise_a_jour
            ? String(row.Date_de_la_derniere_mise_a_jour) : null,
        };

        await prisma.monument.upsert({
          where: { id: ref },
          update: data,
          create: { id: ref, ...data },
        });
        upserted++;
      });

      // Process batch with controlled concurrency
      await Promise.all(upserts);

      if (rowCount % 5000 === 0) {
        console.log(`  ${rowCount} rows processed, ${upserted} monuments upserted...`);
      }
    }

    console.log(`  Done: ${upserted} monuments upserted from ${rowCount} rows`);
    return {
      rowsIngested: upserted,
      rowsTotal: rowCount,
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestMonuments()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
