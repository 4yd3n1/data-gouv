/**
 * Vote Topic Classification — tags Scrutin records with policy domain keywords.
 *
 * For each Scrutin, matches the titre (case-insensitive) against 13 tag keyword sets.
 * Multi-word phrase match → confidence 1.0
 * Single keyword match → confidence 0.7
 *
 * Upserts ScrutinTag records. Safe to re-run (idempotent).
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

// ─── Tag Rules ───

interface TagRule {
  phrases: string[]; // multi-word → confidence 1.0
  keywords: string[]; // single-word → confidence 0.7
}

const TAG_RULES: Record<string, TagRule> = {
  budget: {
    phrases: ["loi de finances", "finances publiques", "projet de loi de finances", "loi de programmation des finances"],
    keywords: ["budget", "PLF", "PLFSS", "PLFRSS"],
  },
  fiscalite: {
    phrases: ["prélèvement obligatoire", "niche fiscale", "crédit d'impôt", "taxe sur"],
    keywords: ["impôt", "taxe", "fiscal", "TVA", "CSG", "CRDS", "prélèvement"],
  },
  sante: {
    phrases: ["sécurité sociale", "assurance maladie", "système de santé", "désert médical"],
    keywords: ["santé", "hôpital", "médecin", "PLFSS", "médical", "pharmaceut", "hospita"],
  },
  logement: {
    phrases: ["parc social", "droit au logement", "politique du logement"],
    keywords: ["logement", "habitat", "HLM", "loyer", "hébergement", "immobilier", "locatif", "habitation"],
  },
  retraites: {
    phrases: ["régime de retraite", "régime spécial", "cotisation vieillesse", "réforme des retraites"],
    keywords: ["retraite", "pension", "cotisation", "vieillesse", "retraité"],
  },
  education: {
    phrases: ["éducation nationale", "enseignement supérieur", "formation professionnelle", "apprentissage professionnel"],
    keywords: ["éducation", "enseignement", "école", "université", "scolaire", "lycée", "collège"],
  },
  securite: {
    phrases: ["forces de l'ordre", "code pénal", "justice pénale", "sécurité publique"],
    keywords: ["sécurité", "police", "gendarmerie", "justice", "pénal", "criminalité", "délinquance", "prison"],
  },
  immigration: {
    phrases: ["droit d'asile", "titre de séjour", "contrôle des frontières", "intégration des étrangers"],
    keywords: ["immigration", "étranger", "asile", "séjour", "frontière", "migrant", "naturalisation"],
  },
  ecologie: {
    phrases: ["transition énergétique", "changement climatique", "biodiversité", "développement durable"],
    keywords: ["climat", "environnement", "énergie", "carbone", "écologie", "renouvelable", "émission", "pollut"],
  },
  travail: {
    phrases: ["code du travail", "marché du travail", "formation professionnelle", "contrat de travail"],
    keywords: ["emploi", "travail", "chômage", "syndicat", "salarié", "apprentissage", "SMIC", "licenciement"],
  },
  defense: {
    phrases: ["loi de programmation militaire", "forces armées", "opération extérieure", "budget de la défense"],
    keywords: ["défense", "armée", "militaire", "OPEX", "NATO", "OTAN", "renseignement"],
  },
  agriculture: {
    phrases: ["politique agricole commune", "revenu agricole", "aides agricoles"],
    keywords: ["agriculture", "agricole", "PAC", "rural", "alimentaire", "agriculteur", "pêche", "élevage"],
  },
  culture: {
    phrases: ["patrimoine culturel", "service public de l'audiovisuel", "liberté de la presse"],
    keywords: ["culture", "patrimoine", "musée", "spectacle", "audiovisuel", "cinéma", "presse", "médias"],
  },
};

// ─── Matching Logic ───

interface TagMatch {
  tag: string;
  confidence: number;
}

function classifyScrutin(titre: string): TagMatch[] {
  const text = titre.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents for matching
    .replace(/['']/g, "'");

  const matches: TagMatch[] = [];

  for (const [tag, rule] of Object.entries(TAG_RULES)) {
    let matched = false;

    // Check multi-word phrases first (confidence 1.0)
    for (const phrase of rule.phrases) {
      const normalizedPhrase = phrase.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (text.includes(normalizedPhrase)) {
        matches.push({ tag, confidence: 1.0 });
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check single keywords (confidence 0.7)
      for (const keyword of rule.keywords) {
        const normalizedKeyword = keyword.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (text.includes(normalizedKeyword)) {
          matches.push({ tag, confidence: 0.7 });
          break;
        }
      }
    }
  }

  return matches;
}

// ─── Main ───

export async function tagScrutins() {
  await logIngestion("scrutin-tags", async () => {
    const scrutins = await prisma.scrutin.findMany({
      select: { id: true, titre: true },
    });

    console.log(`  [ScrutinTags] Processing ${scrutins.length} scrutins...`);

    let totalTags = 0;
    const tagCounts: Record<string, number> = {};

    for (const scrutin of scrutins) {
      const matches = classifyScrutin(scrutin.titre);

      for (const match of matches) {
        await prisma.scrutinTag.upsert({
          where: { scrutinId_tag: { scrutinId: scrutin.id, tag: match.tag } },
          update: { confidence: match.confidence },
          create: {
            scrutinId: scrutin.id,
            tag: match.tag,
            confidence: match.confidence,
          },
        });
        totalTags++;
        tagCounts[match.tag] = (tagCounts[match.tag] ?? 0) + 1;
      }
    }

    console.log(`  [ScrutinTags] ${totalTags} tags applied across ${scrutins.length} scrutins`);
    console.log("  Tag distribution:");
    for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${tag.padEnd(20)} ${count}`);
    }

    return {
      rowsIngested: totalTags,
      metadata: { scrutinsProcessed: scrutins.length, tagCounts },
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  tagScrutins()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
