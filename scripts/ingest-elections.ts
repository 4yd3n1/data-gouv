/**
 * Ingest 2024 French legislative election results (both tours).
 * Sources: data.gouv.fr static CSV exports — constituency-level results.
 * - 1er tour: 577 constituencies, up to 19 candidates per row (wide format)
 * - 2nd tour: 501 constituencies, up to 4 candidates per row (wide format)
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { fetchText } from "./lib/api-client";
import { parseCsv, parseIntSafe } from "./lib/csv-parser";
import { logIngestion } from "./lib/ingestion-log";

const TOUR1_URL =
  "https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-1er-tour/20240710-171413/resultats-definitifs-par-circonscriptions-legislatives.csv";

const TOUR2_URL =
  "https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-2nd-tour/20240710-170728/resultats-definitifs-par-circonscription.csv";

const ANNEE = 2024;

// ─── Helpers ───

/**
 * Parse percentage strings like "71,20%" → 71.20
 * Handles French decimal separator and trailing %.
 */
function parsePct(val: unknown): number | null {
  if (!val || val === "") return null;
  const s = String(val).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Normalize department code:
 * - Single digit → pad: "1" → "01"
 * - Keep others as-is, uppercase for Corsica (2a → 2A)
 */
function normalizeDeptCode(raw: string): string {
  const s = raw.trim();
  if (/^\d$/.test(s)) return `0${s}`;
  return s.toUpperCase();
}

/**
 * Extract the 2-digit circo number from the full circo code.
 * fullCode = "0101" or "101", deptCode = "01" or "1"
 * Returns "01", "02", etc.
 */
function extractCircoNumber(fullCode: string, deptCode: string): string {
  // The full code is deptCode + circoNumber, but lengths vary.
  // Strip the raw (un-normalized) dept prefix to get the circo portion.
  return fullCode.slice(deptCode.length).padStart(2, "0");
}

// ─── Main ingestion ───

export async function ingestElections() {
  await logIngestion("elections", async () => {
    // Build set of valid department codes from DB
    const depts = await prisma.departement.findMany({ select: { code: true } });
    const validDeptCodes = new Set(depts.map((d) => d.code));

    let totalElections = 0;
    let totalCandidats = 0;

    const tours: { tour: number; url: string; maxCandidats: number }[] = [
      { tour: 1, url: TOUR1_URL, maxCandidats: 19 },
      { tour: 2, url: TOUR2_URL, maxCandidats: 4 },
    ];

    for (const { tour, url, maxCandidats } of tours) {
      console.log(`  Fetching tour ${tour}...`);
      const text = await fetchText(url);
      const rows = parseCsv<Record<string, string>>(text, { delimiter: ";" });
      console.log(`  ${rows.length} constituencies found for tour ${tour}`);

      // Delete existing records for this tour (cascade deletes candidats)
      await prisma.electionLegislative.deleteMany({
        where: { annee: ANNEE, tour },
      });

      for (const row of rows) {
        const rawDeptCode = row["Code département"] ?? "";
        const codeDepartement = normalizeDeptCode(rawDeptCode);
        const fullCircoCode = row["Code circonscription législative"] ?? "";
        const codeCirconscription = extractCircoNumber(fullCircoCode, rawDeptCode.trim());

        const election = await prisma.electionLegislative.create({
          data: {
            annee: ANNEE,
            tour,
            codeDepartement,
            libelleDepartement: row["Libellé département"] ?? "",
            codeCirconscription,
            libelleCirconscription: row["Libellé circonscription législative"] ?? "",
            inscrits: parseIntSafe(row["Inscrits"]) ?? 0,
            votants: parseIntSafe(row["Votants"]) ?? 0,
            abstentions: parseIntSafe(row["Abstentions"]) ?? 0,
            exprimes: parseIntSafe(row["Exprimés"]) ?? 0,
            blancs: parseIntSafe(row["Blancs"]) ?? 0,
            nuls: parseIntSafe(row["Nuls"]) ?? 0,
          },
        });

        totalElections++;

        // Parse candidates from wide-format columns
        for (let n = 1; n <= maxCandidats; n++) {
          const nom = (row[`Nom candidat ${n}`] ?? "").trim();
          if (!nom) break; // No more candidates in this row

          const eluRaw = (row[`Elu ${n}`] ?? "").trim().toLowerCase();

          await prisma.candidatLegislatif.create({
            data: {
              electionId: election.id,
              numeroPanneau: parseIntSafe(row[`Numéro de panneau ${n}`]) ?? n,
              nuance: (row[`Nuance candidat ${n}`] ?? "").trim(),
              nom,
              prenom: (row[`Prénom candidat ${n}`] ?? "").trim(),
              sexe: (row[`Sexe candidat ${n}`] ?? "").trim(),
              voix: parseIntSafe(row[`Voix ${n}`]) ?? 0,
              pctInscrits: parsePct(row[`% Voix/inscrits ${n}`]),
              pctExprimes: parsePct(row[`% Voix/exprimés ${n}`]),
              elu: eluRaw === "élu" || eluRaw === "elu",
            },
          });

          totalCandidats++;
        }
      }

      console.log(
        `  Tour ${tour}: ${rows.length} elections, candidates inserted`
      );
    }

    console.log(
      `  Total: ${totalElections} elections, ${totalCandidats} candidates`
    );

    return {
      rowsIngested: totalElections + totalCandidats,
      rowsTotal: totalElections + totalCandidats,
      metadata: {
        elections: totalElections,
        candidats: totalCandidats,
        annee: ANNEE,
      },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestElections()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
