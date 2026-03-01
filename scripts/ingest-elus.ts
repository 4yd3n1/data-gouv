/**
 * Ingest elected officials from the Répertoire National des Élus (RNE).
 * Source: 10 CSV files from data.gouv.fr (semicolon-delimited, UTF-8).
 * Skips deputies and senators (already ingested from dedicated sources).
 *
 * ~640K rows across 10 mandate types:
 *   maires, conseillers municipaux, communautaires, départementaux,
 *   régionaux, d'arrondissement, membres d'assemblée, députés européens,
 *   conseillers français de l'étranger, assemblée français de l'étranger.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseDateSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

// ─── CSV source definitions ───

interface CsvSource {
  url: string;
  typeMandat: string;
  label: string;
}

const CSV_SOURCES: CsvSource[] = [
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-104211/elus-maires-mai.csv",
    typeMandat: "maire",
    label: "Maires",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103336/elus-conseillers-municipaux-cm.csv",
    typeMandat: "conseiller_municipal",
    label: "Conseillers municipaux",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103622/elus-conseillers-communautaires-epci.csv",
    typeMandat: "conseiller_communautaire",
    label: "Conseillers communautaires (EPCI)",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103735/elus-conseillers-departementaux-cd.csv",
    typeMandat: "conseiller_departemental",
    label: "Conseillers départementaux",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103814/elus-conseillers-regionaux-cr.csv",
    typeMandat: "conseiller_regional",
    label: "Conseillers régionaux",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103208/elus-conseillers-darrondissements-ca.csv",
    typeMandat: "conseiller_arrondissement",
    label: "Conseillers d'arrondissement",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103847/elus-membres-dune-assemblee-ma.csv",
    typeMandat: "membre_assemblee",
    label: "Membres d'une assemblée",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-103935/elus-representants-parlement-europeen-rpe.csv",
    typeMandat: "depute_europeen",
    label: "Représentants au Parlement européen",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-105715/elus-conseillers-des-francais-de-letranger-cons.csv",
    typeMandat: "conseiller_francais_etranger",
    label: "Conseillers des Français de l'étranger",
  },
  {
    url: "https://static.data.gouv.fr/resources/repertoire-national-des-elus-1/20251223-105746/elus-assemblee-des-francais-de-letranger-afe.csv",
    typeMandat: "assemblee_francais_etranger",
    label: "Assemblée des Français de l'étranger",
  },
];

const BATCH_SIZE = 500;

// ─── Column name extraction helpers ───
// Column names vary across files. These helpers try known column name variants.

function col(row: Record<string, string>, ...keys: string[]): string | null {
  for (const k of keys) {
    const val = row[k];
    if (val !== undefined && val !== null && val !== "") return val.trim();
  }
  return null;
}

/**
 * Map a CSV row to an Elu record.
 * Handles column name variations between different RNE files.
 */
function mapRow(
  row: Record<string, string>,
  typeMandat: string,
  validDeptCodes: Set<string>,
  validCommuneCodes: Set<string>,
): {
  typeMandat: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: Date | null;
  codeCSP: string | null;
  libelleCSP: string | null;
  codeDepartement: string | null;
  libelleDepartement: string | null;
  codeCommune: string | null;
  libelleCommune: string | null;
  codeCanton: string | null;
  libelleCanton: string | null;
  codeCollParticuliere: string | null;
  libelleCollParticuliere: string | null;
  fonction: string | null;
  dateDebutMandat: Date | null;
  dateDebutFonction: Date | null;
} {
  const nom = col(row, "Nom de l'élu") ?? "";
  const prenom = col(row, "Prénom de l'élu") ?? "";
  const sexe = col(row, "Code sexe") ?? "M";
  const dateNaissance = parseDateSafe(col(row, "Date de naissance"));

  const codeCSP = col(row,
    "Code de la catégorie socio-professionnelle",
    "Code de la catégorie socioprofessionnelle",
  );
  const libelleCSP = col(row,
    "Libellé de la catégorie socio-professionnelle",
    "Libellé de la catégorie socioprofessionnelle",
  );

  // Department code
  const rawDeptCode = col(row,
    "Code du département",
    "Code département",
  );
  const codeDepartement = rawDeptCode && validDeptCodes.has(rawDeptCode) ? rawDeptCode : null;
  const libelleDepartement = col(row,
    "Libellé du département",
    "Libellé département",
  );

  // Commune code (5-char INSEE code)
  const rawCommuneCode = col(row,
    "Code de la commune",
    "Code commune",
  );
  const codeCommune = rawCommuneCode && validCommuneCodes.has(rawCommuneCode) ? rawCommuneCode : null;
  const libelleCommune = col(row,
    "Libellé de la commune",
    "Libellé commune",
  );

  // Canton (conseillers départementaux)
  const codeCanton = col(row,
    "Code du canton",
    "Code canton",
  );
  const libelleCanton = col(row,
    "Libellé du canton",
    "Libellé canton",
  );

  // Collectivité à statut particulier
  const codeCollParticuliere = col(row,
    "Code de la collectivité à statut particulier",
    "Code collectivité à statut particulier",
  );
  const libelleCollParticuliere = col(row,
    "Libellé de la collectivité à statut particulier",
    "Libellé collectivité à statut particulier",
  );

  // Fonction (role label)
  const fonction = col(row,
    "Libellé de la fonction",
    "Libellé de fonction",
    "Libellé fonction",
  );

  const dateDebutMandat = parseDateSafe(col(row,
    "Date de début du mandat",
    "Date de début de mandat",
  ));
  const dateDebutFonction = parseDateSafe(col(row,
    "Date de début de la fonction",
    "Date de début de fonction",
  ));

  return {
    typeMandat,
    nom,
    prenom,
    sexe,
    dateNaissance,
    codeCSP,
    libelleCSP,
    codeDepartement,
    libelleDepartement,
    codeCommune,
    libelleCommune,
    codeCanton,
    libelleCanton,
    codeCollParticuliere,
    libelleCollParticuliere,
    fonction,
    dateDebutMandat,
    dateDebutFonction,
  };
}

export async function ingestElus() {
  await logIngestion("elus", async () => {
    // Build reference sets of valid FK codes from DB
    const depts = await prisma.departement.findMany({ select: { code: true } });
    const validDeptCodes = new Set(depts.map((d) => d.code));
    console.log(`  ${validDeptCodes.size} valid department codes loaded`);

    const communes = await prisma.commune.findMany({ select: { code: true } });
    const validCommuneCodes = new Set(communes.map((c) => c.code));
    console.log(`  ${validCommuneCodes.size} valid commune codes loaded`);

    let totalIngested = 0;
    let totalRows = 0;
    const metadata: Record<string, number> = {};

    for (const source of CSV_SOURCES) {
      console.log(`\n  [${source.label}] Downloading ${source.typeMandat}...`);
      const text = await fetchText(source.url);
      const rows = parseCsv<Record<string, string>>(text, { delimiter: ";" });
      console.log(`  [${source.label}] ${rows.length} rows parsed`);
      totalRows += rows.length;

      // Delete all existing records for this mandate type (full replace)
      const deleted = await prisma.elu.deleteMany({
        where: { typeMandat: source.typeMandat },
      });
      console.log(`  [${source.label}] ${deleted.count} existing records deleted`);

      // Map all rows
      const mapped = rows
        .filter((row) => col(row, "Nom de l'élu"))
        .map((row) => mapRow(row, source.typeMandat, validDeptCodes, validCommuneCodes));

      // Batch insert with createMany in chunks
      let inserted = 0;
      for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
        const chunk = mapped.slice(i, i + BATCH_SIZE);
        await prisma.elu.createMany({ data: chunk });
        inserted += chunk.length;

        if (inserted % 10000 === 0 || i + BATCH_SIZE >= mapped.length) {
          console.log(`  [${source.label}] ${inserted}/${mapped.length} inserted...`);
        }
      }

      totalIngested += inserted;
      metadata[source.typeMandat] = inserted;
      console.log(`  [${source.label}] Done: ${inserted} records ingested`);
    }

    console.log(`\n  Total: ${totalIngested} élus ingested across ${CSV_SOURCES.length} files`);

    return {
      rowsIngested: totalIngested,
      rowsTotal: totalRows,
      metadata,
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestElus()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
