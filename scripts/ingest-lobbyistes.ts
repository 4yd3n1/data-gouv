/**
 * Ingest lobbyists from HATVP (Haute Autorité pour la Transparence de la Vie Publique).
 * Source: https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json
 *
 * Structure: { publications: [ { denomination, exercices: [{ publicationCourante: { activites: [...] }}] } ] }
 * Actions are nested 3 levels deep within the JSON.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const HATVP_URL = "https://www.hatvp.fr/agora/opendata/agora_repertoire_opendata.json";

interface HatvpPublication {
  identifiantNational?: string;
  typeIdentifiantNational?: string;
  denomination?: string;
  categorieOrganisation?: {
    code?: string;
    label?: string;
    categorie?: string;
  };
  adresse?: string;
  codePostal?: string;
  ville?: string;
  pays?: string;
  lienSiteWeb?: string;
  dirigeants?: Array<{
    civilite?: string;
    nom?: string;
    prenom?: string;
    fonction?: string;
  }>;
  exercices?: Array<{
    publicationCourante?: {
      dateDebut?: string;
      dateFin?: string;
      montantDepense?: string;
      nombreSalaries?: number;
      activites?: Array<{
        publicationCourante?: {
          identifiantFiche?: string;
          objet?: string;
          domainesIntervention?: string[];
          actionsRepresentationInteret?: Array<{
            reponsablesPublics?: string[];
            decisionsConcernees?: string[];
            actionsMenees?: string[];
          }>;
        };
      }>;
    };
  }>;
}

function generateId(denomination: string): string {
  return createHash("sha256").update(denomination).digest("hex").substring(0, 16);
}

function parseDateHatvp(dateStr?: string): Date | null {
  if (!dateStr) return null;
  // Format: DD-MM-YYYY or DD/MM/YYYY
  const m = dateStr.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (!m) return null;
  const d = new Date(parseInt(m[3]!), parseInt(m[2]!) - 1, parseInt(m[1]!));
  return isNaN(d.getTime()) ? null : d;
}

export async function ingestLobbyistes() {
  await logIngestion("lobbyistes", async () => {
    console.log("  Fetching HATVP registry JSON (large file)...");
    const res = await fetch(HATVP_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HATVP HTTP ${res.status}`);
    const json = (await res.json()) as { publications: HatvpPublication[] };
    const publications = json.publications;
    console.log(`  ${publications.length} lobbyist entries found`);

    // Clear existing actions (no stable IDs for upsert)
    await prisma.actionLobbyiste.deleteMany({});

    let lobbyCount = 0;
    let actionCount = 0;

    for (const pub of publications) {
      if (!pub.denomination) continue;

      const id = pub.identifiantNational || generateId(pub.denomination);

      // Determine activity category from categorieOrganisation
      const categorie = pub.categorieOrganisation?.label ?? pub.categorieOrganisation?.categorie ?? null;

      // Get latest exercice for staff/revenue
      const latestExercice = pub.exercices?.[pub.exercices.length - 1]?.publicationCourante;
      const effectif = latestExercice?.nombreSalaries != null
        ? String(latestExercice.nombreSalaries)
        : null;
      const chiffreAffaires = latestExercice?.montantDepense ?? null;

      // Find earliest date across exercices
      const dates = (pub.exercices ?? [])
        .map((e) => parseDateHatvp(e.publicationCourante?.dateDebut))
        .filter((d): d is Date => d !== null);
      const dateInscription = dates.length > 0
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null;

      await prisma.lobbyiste.upsert({
        where: { id },
        update: {
          nom: pub.denomination,
          type: pub.typeIdentifiantNational ?? null,
          categorieActivite: categorie,
          adresse: [pub.adresse, pub.codePostal, pub.ville].filter(Boolean).join(", ") || null,
          siren: pub.typeIdentifiantNational === "SIREN" ? pub.identifiantNational : null,
          effectif,
          chiffreAffaires,
          dateInscription,
        },
        create: {
          id,
          nom: pub.denomination,
          type: pub.typeIdentifiantNational ?? null,
          categorieActivite: categorie,
          adresse: [pub.adresse, pub.codePostal, pub.ville].filter(Boolean).join(", ") || null,
          siren: pub.typeIdentifiantNational === "SIREN" ? pub.identifiantNational : null,
          effectif,
          chiffreAffaires,
          dateInscription,
        },
      });
      lobbyCount++;

      // Extract actions from all exercices
      for (const exercice of pub.exercices ?? []) {
        const pc = exercice.publicationCourante;
        if (!pc?.activites) continue;

        const periode = [pc.dateDebut, pc.dateFin].filter(Boolean).join(" - ");

        for (const activite of pc.activites) {
          const act = activite.publicationCourante;
          if (!act) continue;

          const domaines = act.domainesIntervention?.join(", ") ?? null;
          const description = act.objet ?? null;

          // Summarize action types from actionsRepresentationInteret
          const actionTypes = (act.actionsRepresentationInteret ?? [])
            .flatMap((a) => a.actionsMenees ?? []);
          const typeStr = actionTypes.length > 0
            ? actionTypes.slice(0, 3).join("; ")
            : null;

          await prisma.actionLobbyiste.create({
            data: {
              lobbyisteId: id,
              type: typeStr,
              description,
              domaine: domaines,
              periode,
            },
          });
          actionCount++;
        }
      }

      if (lobbyCount % 500 === 0) {
        console.log(`  ${lobbyCount} lobbyists processed...`);
      }
    }

    console.log(`  ${lobbyCount} lobbyists, ${actionCount} actions upserted`);

    return {
      rowsIngested: lobbyCount + actionCount,
      rowsTotal: publications.length,
      metadata: { lobbyists: lobbyCount, actions: actionCount },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestLobbyistes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
