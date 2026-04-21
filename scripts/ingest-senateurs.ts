/**
 * Ingest senators from official Sénat open data.
 * Sources:
 * - ODSEN_GENERAL.csv — Senator identity + biographical info
 * - ODSEN_ELUSEN.csv — Senatorial mandates
 * - ODSEN_CUR_COMS.csv — Current commission memberships
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseDateSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";
import {
  buildDepartementLookup,
  resolveDepartementCode,
} from "./lib/departement-lookup";
import { normalizeName } from "../src/lib/normalize-name";

const BASE = "https://data.senat.fr/data/senateurs";

/**
 * Fetch a Sénat CSV: ISO-8859-1 encoded, may have SQL comment lines (starting with %).
 */
async function fetchSenatCsv(filename: string): Promise<string> {
  const raw = await fetchText(`${BASE}/${filename}`, "iso-8859-1");
  // Strip SQL comment lines at the top (start with %)
  const lines = raw.split("\n");
  const dataLines = lines.filter((line) => !line.startsWith("%"));
  return dataLines.join("\n");
}

interface SenGeneral {
  Matricule: string;
  "Qualité": string;
  "Nom usuel": string;
  "Prénom usuel": string;
  "État": string;
  "Date naissance": string;
  "Date de décès": string;
  "Groupe politique": string;
  "Type d'app au grp politique": string;
  "Commission permanente": string;
  Circonscription: string;
  "Fonction au Bureau du Sénat": string;
  "Courrier électronique": string;
  "PCS INSEE": string;
  "Catégorie professionnelle": string;
  "Description de la profession": string;
}

interface SenMandat {
  Matricule: string;
  "État Sénateur": string;
  "Date de début de mandat": string;
  "Motif début de mandat": string;
  "Date de fin de mandat": string;
  "Motif fin de mandat": string;
}

interface SenCommission {
  Matricule: string;
  "État Sénateur": string;
  "Nom commission": string;
  "Type commission": string;
  "Début d'appartenance": string;
  "Fin d'appartenance": string;
  Fonction: string;
}

export async function ingestSenateurs() {
  await logIngestion("senateurs", async () => {
    // Try to build department lookup (may be empty if territories not yet ingested)
    let deptLookup: Map<string, string>;
    try {
      deptLookup = await buildDepartementLookup();
    } catch {
      deptLookup = new Map();
    }

    // 1. General info
    console.log("  Fetching ODSEN_GENERAL.csv...");
    const generalCsv = await fetchSenatCsv("ODSEN_GENERAL.csv");
    const generals = parseCsv<SenGeneral>(generalCsv);
    console.log(`  ${generals.length} senators found`);

    for (const s of generals) {
      const isActif = s["État"] === "ACTIF";
      const deptCode = resolveDepartementCode(deptLookup, s.Circonscription);
      const nom = s["Nom usuel"];
      const prenom = s["Prénom usuel"];

      await prisma.senateur.upsert({
        where: { id: s.Matricule },
        update: {
          civilite: s["Qualité"] || null,
          nom,
          prenom,
          nomNormalise: normalizeName(nom),
          prenomNormalise: normalizeName(prenom),
          dateNaissance: parseDateSafe(s["Date naissance"]),
          groupe: s["Groupe politique"] || null,
          departement: s.Circonscription || null,
          departementCode: deptCode,
          profession: s["Description de la profession"] || null,
          actif: isActif,
        },
        create: {
          id: s.Matricule,
          civilite: s["Qualité"] || null,
          nom,
          prenom,
          nomNormalise: normalizeName(nom),
          prenomNormalise: normalizeName(prenom),
          dateNaissance: parseDateSafe(s["Date naissance"]),
          groupe: s["Groupe politique"] || null,
          departement: s.Circonscription || null,
          departementCode: deptCode,
          profession: s["Description de la profession"] || null,
          actif: isActif,
        },
      });
    }

    // 2. Senatorial mandates
    console.log("  Fetching ODSEN_ELUSEN.csv...");
    const mandatCsv = await fetchSenatCsv("ODSEN_ELUSEN.csv");
    const mandats = parseCsv<SenMandat>(mandatCsv);
    console.log(`  ${mandats.length} mandates found`);

    // Clear existing mandates then insert (simpler than upserting child records)
    await prisma.mandatSenateur.deleteMany({});

    let mandatCount = 0;
    for (const m of mandats) {
      // Check the senator exists
      const exists = await prisma.senateur.findUnique({
        where: { id: m.Matricule },
        select: { id: true },
      });
      if (!exists) continue;

      await prisma.mandatSenateur.create({
        data: {
          senateurId: m.Matricule,
          type: "senatorial",
          libelle: m["Motif début de mandat"] || "Mandat sénatorial",
          dateDebut: parseDateSafe(m["Date de début de mandat"]),
          dateFin: parseDateSafe(m["Date de fin de mandat"]),
        },
      });
      mandatCount++;
    }
    console.log(`  ${mandatCount} mandates upserted`);

    // 3. Current commissions
    console.log("  Fetching ODSEN_CUR_COMS.csv...");
    const comCsv = await fetchSenatCsv("ODSEN_CUR_COMS.csv");
    const commissions = parseCsv<SenCommission>(comCsv);
    console.log(`  ${commissions.length} commission memberships found`);

    // Clear existing commissions then insert
    await prisma.commissionSenateur.deleteMany({});

    let comCount = 0;
    for (const c of commissions) {
      const exists = await prisma.senateur.findUnique({
        where: { id: c.Matricule },
        select: { id: true },
      });
      if (!exists) continue;

      await prisma.commissionSenateur.create({
        data: {
          senateurId: c.Matricule,
          nom: c["Nom commission"],
          fonction: c.Fonction || null,
          dateDebut: parseDateSafe(c["Début d'appartenance"]),
          dateFin: parseDateSafe(c["Fin d'appartenance"]),
        },
      });
      comCount++;
    }
    console.log(`  ${comCount} commissions upserted`);

    return {
      rowsIngested: generals.length + mandatCount + comCount,
      rowsTotal: generals.length + mandats.length + commissions.length,
      metadata: {
        senators: generals.length,
        mandates: mandatCount,
        commissions: comCount,
      },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestSenateurs()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
