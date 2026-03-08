/**
 * Ingest AGORA lobby actions targeting government ministries.
 *
 * Strategy:
 * 1. Download the AGORA consolidated JSON (same source as ingest-lobbyistes.ts).
 * 2. For each lobbying org, traverse exercices → activites → actionsRepresentationInteret.
 * 3. Normalize reponsablesPublics strings and keyword-match to a ministereCode.
 * 4. Batch-create ActionLobby records linking org-actions to a ministry.
 *
 * Idempotency: deletes all ActionLobby before re-inserting (no stable IDs in source).
 *
 * Run: npx tsx scripts/ingest-agora.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const HATVP_URL =
  "https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json";

// ─── Types (mirrors ingest-lobbyistes.ts) ─────────────────────────────────────

interface HatvpPublication {
  identifiantNational?: string;
  denomination?: string;
  categorieOrganisation?: {
    code?: string;
    label?: string;
    categorie?: string;
  };
  exercices?: Array<{
    publicationCourante?: {
      dateDebut?: string;
      montantDepense?: string;
      activites?: Array<{
        publicationCourante?: {
          domainesIntervention?: string[];
          actionsRepresentationInteret?: Array<{
            reponsablesPublics?: string[];
            actionsMenees?: string[];
          }>;
        };
      }>;
    };
  }>;
}

// ─── Ministry keyword mapping ─────────────────────────────────────────────────

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Ordered most-specific → least-specific to avoid false matches.
// Each entry: [ministereCode, keywords_any_of_which_triggers_match]
// Updated for Gouvernement Lecornu II (Oct 2025 – present, reshuffled Feb 2026).
const MINISTERECODE_KEYWORDS: Array<[string, string[]]> = [
  ["PRESIDENCE",              ["presidence de la republique", "president de la republique", "elysee"]],
  ["MATIGNON",                ["premier ministre", "matignon", "services du premier"]],
  ["AFFAIRES_ETRANGERES",     ["affaires etrangeres", "diplomati", "consulaire", "francophonie"]],
  ["ARMEES",                  ["armee", "defense nationale", "militaire", "anciens combattants"]],
  ["INTERIEUR",               ["interieur", "police nationale", "gendarmerie nationale", "immigration", "securite interieure"]],
  ["ECONOMIE_FINANCES",       ["economie", "finance", "budget", "tresor", "souverainete industrielle", "commerce exterieur"]],
  ["JUSTICE",                 ["justice", "garde des sceaux", "judiciaire", "penitentiaire", "probation"]],
  ["EDUCATION_NATIONALE",     ["education nationale", "enseignement scolaire"]],
  ["ENSEIGNEMENT_SUPERIEUR",  ["enseignement superieur", "universite", "recherche scientifique", "recherche", "espace"]],
  ["TRANSITION_ECOLOGIQUE",   ["transition ecologique", "ecologi", "energie", "climat", "nucleaire", "biodiversite", "environnement", "prevention des risques"]],
  ["TRAVAIL_SOLIDARITES",     ["travail", "emploi", "droit du travail", "solidarite", "protection sociale"]],
  ["SANTE_FAMILLE",           ["sante publique", "sante", "famille", "autonomie", "handicap", "personnes agees"]],
  ["AGRICULTURE",             ["agriculture", "agroalimentaire", "souverainete alimentaire", "peche", "alimentation"]],
  ["PME_COMMERCE",            ["pme", "commerce", "artisanat", "tourisme", "pouvoir d'achat"]],
  ["CULTURE",                 ["culture", "patrimoine", "creation artistique", "audiovisuel", "livre"]],
  ["OUTREMER",                ["outre-mer", "outremer", "ultramarins", "territoires d'outre"]],
  ["AMENAGEMENT_TERRITOIRE",  ["amenagement du territoire", "decentralisation", "collectivites territoriales"]],
  ["SPORTS_JEUNESSE",         ["sport", "jeunesse", "vie associative", "jeux olympiques"]],
  ["TRANSPORTS",              ["transport", "mobilite", "rail", "infrastructure de transport", "aeroport"]],
  ["VILLE_LOGEMENT",          ["logement", "ville", "politique de la ville", "habitat"]],
  ["INDUSTRIE_NUMERIQUE",     ["industrie", "numerique", "intelligence artificielle"]],
];

function matchMinistereCodes(reponsable: string): string[] {
  const normalized = normalizeStr(reponsable);
  const matched: string[] = [];
  for (const [code, keywords] of MINISTERECODE_KEYWORDS) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        matched.push(code);
        break; // Only add each code once per reponsable
      }
    }
  }
  return matched;
}

function extractYear(dateStr?: string): string | null {
  if (!dateStr) return null;
  const m = dateStr.match(/(\d{4})/);
  return m ? m[1]! : null;
}

// ─── Main ingestion ───────────────────────────────────────────────────────────

export async function ingestAgora() {
  await logIngestion("agora-lobby", async () => {
    const stats = {
      publications: 0,
      reponsablesProcessed: 0,
      actionsCreated: 0,
      matched: 0,
      unmatched: 0,
    };

    console.log("  Fetching AGORA registry JSON (~80MB, may take a moment)...");
    const res = await fetch(HATVP_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HATVP HTTP ${res.status} ${res.statusText}`);
    const json = (await res.json()) as { publications: HatvpPublication[] };
    const publications = json.publications;
    console.log(`  ${publications.length} lobbying organizations found`);

    // Clear existing ActionLobby — no stable composite IDs for upsert
    const deleted = await prisma.actionLobby.deleteMany({});
    console.log(`  Cleared ${deleted.count} existing ActionLobby records`);

    // Accumulate inserts and batch-create in chunks of 500
    const CHUNK = 500;
    const batch: Array<{
      representantNom: string;
      representantCategorie: string | null;
      ministereCode: string;
      domaine: string | null;
      typeAction: string | null;
      exercice: string | null;
      depensesTranche: string | null;
      sourceUrl: string | null;
    }> = [];

    async function flushBatch(force = false) {
      while (batch.length >= CHUNK || (force && batch.length > 0)) {
        const chunk = batch.splice(0, CHUNK);
        await prisma.actionLobby.createMany({ data: chunk });
      }
    }

    for (const pub of publications) {
      if (!pub.denomination) continue;
      stats.publications++;

      if (stats.publications % 1000 === 0) {
        await flushBatch();
        console.log(
          `  ${stats.publications} organizations processed, ` +
          `${stats.actionsCreated} actions created...`
        );
      }

      const representantNom = pub.denomination;
      const representantCategorie =
        pub.categorieOrganisation?.label ??
        pub.categorieOrganisation?.categorie ??
        null;

      for (const exerciceEntry of pub.exercices ?? []) {
        const pc = exerciceEntry.publicationCourante;
        if (!pc?.activites) continue;

        const exercice = extractYear(pc.dateDebut);
        const depensesTranche = pc.montantDepense ?? null;

        for (const activite of pc.activites) {
          const act = activite.publicationCourante;
          if (!act) continue;

          const domaine = act.domainesIntervention?.join(", ") ?? null;

          for (const action of act.actionsRepresentationInteret ?? []) {
            const actionsMenees = action.actionsMenees ?? [];
            const typeAction =
              actionsMenees.length > 0
                ? actionsMenees.slice(0, 3).join("; ")
                : null;

            for (const reponsable of action.reponsablesPublics ?? []) {
              stats.reponsablesProcessed++;
              const codes = matchMinistereCodes(reponsable);

              if (codes.length === 0) {
                stats.unmatched++;
                continue;
              }

              stats.matched++;
              for (const ministereCode of codes) {
                batch.push({
                  representantNom,
                  representantCategorie,
                  ministereCode,
                  domaine,
                  typeAction,
                  exercice,
                  depensesTranche,
                  sourceUrl: null,
                });
                stats.actionsCreated++;
              }
            }
          }
        }
      }
    }

    await flushBatch(true);

    console.log(`\n  AGORA ingestion complete.`);
    console.log(`  Organizations processed : ${stats.publications}`);
    console.log(`  Reponsables processed   : ${stats.reponsablesProcessed}`);
    console.log(`  Matched to ministereCode: ${stats.matched}`);
    console.log(`  Unmatched               : ${stats.unmatched}`);
    console.log(`  ActionLobby records     : ${stats.actionsCreated}`);

    return {
      rowsIngested: stats.actionsCreated,
      rowsTotal: stats.publications,
      metadata: stats as Record<string, unknown>,
    };
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

ingestAgora()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
