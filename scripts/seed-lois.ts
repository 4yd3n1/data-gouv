/**
 * seed-lois.ts — Seeds LoiParlementaire + ScrutinLoi records
 *
 * Groups the 4,691 flat scrutins into citizen-readable major laws.
 * Only covers legislature 17 (Oct 2024–present) — that's all we have.
 *
 * Run: npx tsx scripts/seed-lois.ts
 * Safe to re-run (upsert on slug).
 */

import { prisma } from "../src/lib/db";

interface LoiDef {
  slug: string;
  titre: string;
  titreCourt: string;
  resumeSimple: string;
  type: string;
  statut: string;
  legislature?: number;
  dateVote?: Date;
  referenceAN?: string;
  dossierUrl?: string;
  tags: string[];
  rang: number;
  // How to find the final vote and related scrutins
  voteFinalId?: string; // explicit scrutin ID for VOTE_FINAL
  relatedPattern?: string; // ILIKE pattern to find all related scrutins
  motionIds?: string[]; // for MOC clusters
}

const LOIS: LoiDef[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // MOTIONS DE CENSURE — constitutionally critical events
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "chute-gouvernement-barnier-2024",
    titre: "Chute du gouvernement Barnier — Motion de censure adoptée",
    titreCourt: "Censure Barnier",
    resumeSimple:
      "Le 4 décembre 2024, l'Assemblée nationale a renversé le gouvernement de Michel Barnier en adoptant une motion de censure à 331 voix, une majorité absolue de 288 voix étant requise. C'est la première censure adoptée depuis 1962. Le gouvernement Barnier a démissionné le lendemain.",
    type: "MOTION_CENSURE",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2024-12-04"),
    tags: ["budget", "fiscalite"],
    rang: 1,
    voteFinalId: "VTANR5L17V519",
    relatedPattern: "motion de censure%49, alinéa 3%",
  },
  {
    slug: "motions-censure-bayrou-2025",
    titre: "Motions de censure contre le gouvernement Bayrou",
    titreCourt: "Censures Bayrou",
    resumeSimple:
      "Depuis janvier 2025, six motions de censure ont été déposées contre le gouvernement Bayrou, notamment après l'utilisation de l'article 49 alinéa 3 pour passer le budget. Toutes ont été rejetées, le gouvernement ne disposant pas d'une majorité absolue mais survivant faute de coalition d'opposition suffisante.",
    type: "MOTION_CENSURE",
    statut: "rejete",
    legislature: 17,
    tags: ["budget"],
    rang: 2,
    motionIds: [
      "VTANR5L17V526",
      "VTANR5L17V693",
      "VTANR5L17V694",
      "VTANR5L17V739",
      "VTANR5L17V791",
      "VTANR5L17V842",
      "VTANR5L17V2222",
      "VTANR5L17V2876",
      "VTANR5L17V3058",
      "VTANR5L17V3059",
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // BUDGET — highest citizen impact
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "plf-2025-budget-etat",
    titre: "Projet de loi de finances pour 2025 — Rejet en première lecture",
    titreCourt: "Budget 2025",
    resumeSimple:
      "Le projet de budget 2025 présenté par le gouvernement Barnier a été rejeté dès sa première partie à l'Assemblée nationale le 12 novembre 2024, une première depuis 1979. Le gouvernement a ensuite été renversé par une motion de censure, forçant le vote d'une loi spéciale pour permettre à l'État de continuer à fonctionner.",
    type: "PLF",
    statut: "rejete",
    legislature: 17,
    dateVote: new Date("2024-11-12"),
    tags: ["budget", "fiscalite"],
    rang: 3,
    voteFinalId: "VTANR5L17V438",
    relatedPattern: "%finances pour 2025%",
  },
  {
    slug: "loi-speciale-budget-decembre-2024",
    titre: "Loi spéciale budgétaire de décembre 2024",
    titreCourt: "Loi spéciale budget",
    resumeSimple:
      "Après la chute du gouvernement Barnier et le rejet du PLF 2025, une loi spéciale a été votée le 16 décembre 2024 pour autoriser l'État à continuer à percevoir les impôts et à payer ses dépenses au-delà du 1er janvier 2025. C'est un dispositif d'urgence constitutionnelle sans précédent sous la Ve République.",
    type: "PROJET_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2024-12-16"),
    referenceAN: "2024-990",
    tags: ["budget"],
    rang: 4,
    voteFinalId: "VTANR5L17V525",
    relatedPattern: "%loi spéciale%article 45%loi organique%1er août 2001%",
  },
  {
    slug: "plf-2026-budget-etat",
    titre: "Projet de loi de finances pour 2026 — Rejet de la première partie",
    titreCourt: "Budget 2026",
    resumeSimple:
      "La première partie du budget 2026 a été rejetée en première lecture à l'Assemblée nationale le 21 novembre 2025, reflétant les difficultés persistantes à constituer une majorité stable autour des arbitrages budgétaires du gouvernement Bayrou. La procédure législative s'est poursuivie via l'article 49-3.",
    type: "PLF",
    statut: "rejete",
    legislature: 17,
    dateVote: new Date("2025-11-21"),
    tags: ["budget", "fiscalite"],
    rang: 5,
    voteFinalId: "VTANR5L17V4241",
    relatedPattern: "%finances pour 2026%",
  },
  {
    slug: "loi-fin-gestion-2025",
    titre: "Loi de fin de gestion 2025",
    titreCourt: "Fin de gestion 2025",
    resumeSimple:
      "Adoptée le 2 décembre 2025, la loi de fin de gestion règle les comptes de l'exercice budgétaire 2025 et autorise les derniers ajustements de crédits. Elle entérine les dépenses effectuées en 2025 dans le cadre de la loi spéciale puis de la loi de finances initiale.",
    type: "PLF",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-12-02"),
    tags: ["budget"],
    rang: 6,
    voteFinalId: "VTANR5L17V4442",
    relatedPattern: "%fin de gestion pour 2025%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // SOCIÉTÉ — major societal debates
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-aide-a-mourir-2025",
    titre: "Proposition de loi relative au droit à l'aide à mourir",
    titreCourt: "Aide à mourir",
    resumeSimple:
      "Adoptée en première lecture le 27 mai 2025 par 305 voix contre 204, cette loi crée pour la première fois en France un droit à l'aide à mourir pour les personnes majeures atteintes d'une maladie grave et incurable. Elle distingue l'aide à mourir de l'euthanasie et des soins palliatifs, qui font l'objet d'un texte complémentaire voté le même jour.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-05-27"),
    tags: ["sante"],
    rang: 7,
    voteFinalId: "VTANR5L17V2107",
    relatedPattern: "%aide à mourir%",
  },
  {
    slug: "loi-soins-palliatifs-2025",
    titre: "Proposition de loi sur les soins palliatifs et l'accompagnement",
    titreCourt: "Soins palliatifs",
    resumeSimple:
      "Adoptée le même jour que la loi sur l'aide à mourir, ce texte complémentaire renforce le droit d'accès aux soins palliatifs et à l'accompagnement de fin de vie pour tous les patients. Il prévoit un plan national pour développer les unités de soins palliatifs, encore insuffisantes dans de nombreux territoires.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-05-27"),
    tags: ["sante"],
    rang: 8,
    voteFinalId: "VTANR5L17V2106",
    relatedPattern: "%soins palliatifs%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // SÉCURITÉ / JUSTICE
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-narcotrafic-2025",
    titre: "Proposition de loi visant à sortir la France du piège du narcotrafic",
    titreCourt: "Loi narcotrafic",
    resumeSimple:
      "Adoptée définitivement le 29 avril 2025 après passage en commission mixte paritaire, cette loi crée un parquet national anti-criminalité organisée (PNACO), renforce les peines pour les trafiquants et instaure de nouveaux outils d'enquête (écoutes, géolocalisation, repentis). Elle répond à la montée en puissance des réseaux de drogue dans les grandes villes françaises.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-04-29"),
    referenceAN: "2025-1",
    tags: ["securite"],
    rang: 9,
    voteFinalId: "VTANR5L17V1473",
    relatedPattern: "%narcotrafic%",
  },
  {
    slug: "loi-securite-transports-2025",
    titre: "Proposition de loi sur la sûreté dans les transports",
    titreCourt: "Sûreté transports",
    resumeSimple:
      "Adoptée le 18 mars 2025 après commission mixte paritaire, cette loi renforce les pouvoirs des forces de sécurité dans les transports en commun : extension des fouilles, vidéoprotection, et sanctions accrues pour les infractions commises dans les réseaux de transport. Elle fait suite à une hausse significative des violences dans le métro et le RER.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-03-18"),
    tags: ["securite"],
    rang: 10,
    voteFinalId: "VTANR5L17V1041",
    relatedPattern: "%sûreté dans les transports%",
  },
  {
    slug: "loi-mineurs-delinquants-2025",
    titre: "Proposition de loi sur l'autorité de la justice à l'égard des mineurs délinquants",
    titreCourt: "Mineurs délinquants",
    resumeSimple:
      "Adoptée le 13 mai 2025, cette loi durcit les conditions de détention provisoire pour les mineurs récidivistes et renforce les obligations de suivi judiciaire. Elle intervient dans un contexte de débat public sur la délinquance des mineurs et les limites du Code de la justice pénale des mineurs entré en vigueur en 2021.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-05-13"),
    tags: ["securite"],
    rang: 11,
    voteFinalId: "VTANR5L17V1624",
    relatedPattern: "%mineurs délinquants%",
  },
  {
    slug: "loi-retention-condamnes-terrorisme-2025",
    titre: "Proposition de loi sur la rétention des personnes condamnées pour terrorisme",
    titreCourt: "Rétention terrorisme",
    resumeSimple:
      "Adoptée le 8 juillet 2025, cette loi facilite le maintien en centre de rétention administrative des personnes condamnées pour des faits terroristes à l'issue de leur peine. Elle vise à pallier les difficultés d'expulsion vers certains pays d'origine et a fait l'objet d'un débat sur l'équilibre entre sécurité et libertés fondamentales.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-07-08"),
    tags: ["securite", "immigration"],
    rang: 12,
    voteFinalId: "VTANR5L17V2958",
    relatedPattern: "%maintien en rétention%condamnées pour des faits%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // AGRICULTURE / ALIMENTATION
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-souverainete-alimentaire-2025",
    titre: "Projet de loi d'orientation pour la souveraineté alimentaire et agricole",
    titreCourt: "Souveraineté agricole",
    resumeSimple:
      "Adoptée le 19 février 2025, cette loi de programmation agricole fixe des objectifs de souveraineté alimentaire pour la France à horizon 2035. Elle prévoit des mesures pour faciliter l'installation de nouveaux agriculteurs, accélérer la transmission des exploitations, et mieux indemniser les agriculteurs face aux aléas climatiques et sanitaires.",
    type: "PROJET_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-02-19"),
    tags: ["agriculture"],
    rang: 13,
    voteFinalId: "VTANR5L17V844",
    relatedPattern: "%souveraineté alimentaire et agricole%",
  },
  {
    slug: "loi-simplification-agricole-2025",
    titre: "Proposition de loi levant les contraintes à l'exercice du métier d'agriculteur",
    titreCourt: "Simplification agricole",
    resumeSimple:
      "Adoptée le 8 juillet 2025 après commission mixte paritaire, cette proposition de loi simplifie les obligations administratives des agriculteurs, notamment en matière environnementale. Elle réduit les contrôles sur les haies, assouplit les règles d'épandage et crée une présomption de bonne foi pour les agriculteurs de bonne foi ayant commis des infractions mineures.",
    type: "PROPOSITION_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-07-08"),
    tags: ["agriculture"],
    rang: 14,
    voteFinalId: "VTANR5L17V2957",
    relatedPattern: "%contraintes à l'exercice du métier d'agriculteur%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // MAYOTTE / CATASTROPHE NATURELLE
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-urgence-mayotte-2025",
    titre: "Projet de loi d'urgence pour Mayotte",
    titreCourt: "Urgence Mayotte",
    resumeSimple:
      "Adoptée définitivement le 12 février 2025, cette loi d'urgence répond aux dégâts causés par le cyclone Chido (décembre 2024) qui a dévasté Mayotte. Elle prévoit un régime d'exception pour accélérer la reconstruction, des aides d'urgence pour les sinistrés et des dérogations au droit commun pour la reconstruction des habitats précaires.",
    type: "PROJET_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-02-12"),
    tags: ["logement"],
    rang: 15,
    voteFinalId: "VTANR5L17V790",
    relatedPattern: "%urgence pour Mayotte%",
  },
  {
    slug: "loi-reconstruction-mayotte-2025",
    titre: "Projet de loi de programmation pour la refondation de Mayotte",
    titreCourt: "Refondation Mayotte",
    resumeSimple:
      "Adoptée définitivement le 9 juillet 2025, cette loi de programmation fixe le cadre pluriannuel de la reconstruction de Mayotte sur 15 ans. Elle prévoit des investissements massifs dans les infrastructures, le logement, la santé et l'éducation, et instaure un statut spécial pour l'île tenant compte de ses particularités démographiques et économiques.",
    type: "PROJET_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-07-09"),
    tags: ["logement"],
    rang: 16,
    voteFinalId: "VTANR5L17V2975",
    relatedPattern: "%refondation de Mayotte%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ÉCOLOGIE / ÉNERGIE
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-energie-climat-rejetee-2025",
    titre: "Proposition de loi portant programmation nationale pour l'énergie et le climat",
    titreCourt: "Programmation énergie-climat",
    resumeSimple:
      "Rejetée en séance le 24 juin 2025, cette proposition de loi visait à fixer les objectifs énergétiques et climatiques de la France pour 2030-2050, en transposant les engagements européens. Elle a été rejetée par une alliance des groupes de gauche (qui la jugeaient insuffisante) et du RN (opposé aux contraintes climatiques), illustrant l'impasse politique sur la transition écologique.",
    type: "PROPOSITION_LOI",
    statut: "rejete",
    legislature: 17,
    dateVote: new Date("2025-06-24"),
    tags: ["ecologie"],
    rang: 17,
    voteFinalId: "VTANR5L17V2653",
    relatedPattern: "%programmation nationale pour l'énergie et le climat%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ÉCONOMIE / SIMPLIFICATION
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "loi-simplification-economique-2025",
    titre: "Projet de loi de simplification de la vie économique",
    titreCourt: "Simplification économique",
    resumeSimple:
      "Adoptée en première lecture le 17 juin 2025, cette loi supprime ou allège des centaines de formalités administratives pour les entreprises : délais de réponse, formalités d'immatriculation, obligations de reporting. Le gouvernement l'a présentée comme un « choc de simplification » destiné à améliorer la compétitivité française face à ses voisins européens.",
    type: "PROJET_LOI",
    statut: "adopte",
    legislature: 17,
    dateVote: new Date("2025-06-17"),
    tags: ["travail"],
    rang: 18,
    voteFinalId: "VTANR5L17V2458",
    relatedPattern: "%simplification de la vie économique%",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // POLITIQUE GÉNÉRALE
  // ────────────────────────────────────────────────────────────────────────────
  {
    slug: "declaration-politique-generale-bayrou-2025",
    titre: "Déclaration de politique générale de François Bayrou — Rejet (49-1)",
    titreCourt: "Confiance Bayrou",
    resumeSimple:
      "Le 8 septembre 2025, l'Assemblée nationale a refusé d'accorder sa confiance au gouvernement Bayrou lors d'un vote de confiance engagé par le Premier ministre en application de l'article 49 alinéa 1. Avec 200 voix pour et 317 contre, c'est une défaite cinglante mais sans effet contraignant immédiat, le gouvernement n'étant pas obligé de démissionner après un vote 49-1.",
    type: "PROJET_LOI",
    statut: "rejete",
    legislature: 17,
    dateVote: new Date("2025-09-08"),
    tags: ["budget"],
    rang: 19,
    voteFinalId: "VTANR5L17V3054",
    relatedPattern: "%déclaration de politique générale%Bayrou%",
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

async function findRelatedScrutinIds(
  pattern: string,
  excludeIds: string[] = []
): Promise<{ id: string; titre: string; codeTypeVote: string }[]> {
  return prisma.scrutin.findMany({
    where: {
      titre: { contains: pattern.replace(/%/g, ""), mode: "insensitive" },
      id: { notIn: excludeIds },
    },
    select: { id: true, titre: true, codeTypeVote: true },
    orderBy: { dateScrutin: "asc" },
  });
}

function roleForScrutin(s: { codeTypeVote: string; titre: string }, isVoteFinal: boolean): string {
  if (isVoteFinal) return "VOTE_FINAL";
  if (s.codeTypeVote === "MOC") return "MOTION";
  if (s.codeTypeVote === "SPS") return "VOTE_FINAL";
  // Heuristics for SPO
  const t = s.titre.toLowerCase();
  if (t.includes("amendement") || t.includes("sous-amendement")) return "AMENDEMENT";
  if (t.includes("article") && !t.includes("l'ensemble")) return "ARTICLE";
  if (t.includes("l'ensemble") || t.includes("le texte")) return "VOTE_FINAL";
  return "PROCEDURAL";
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding LoiParlementaire records…");
  let totalLois = 0;
  let totalLiens = 0;

  for (const def of LOIS) {
    // Upsert the LoiParlementaire
    const loi = await prisma.loiParlementaire.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        titre: def.titre,
        titreCourt: def.titreCourt,
        resumeSimple: def.resumeSimple,
        type: def.type,
        statut: def.statut,
        legislature: def.legislature ?? 17,
        dateVote: def.dateVote,
        referenceAN: def.referenceAN,
        dossierUrl: def.dossierUrl,
        tags: def.tags,
        rang: def.rang,
      },
      update: {
        titre: def.titre,
        titreCourt: def.titreCourt,
        resumeSimple: def.resumeSimple,
        type: def.type,
        statut: def.statut,
        dateVote: def.dateVote,
        referenceAN: def.referenceAN,
        tags: def.tags,
        rang: def.rang,
      },
    });
    totalLois++;

    // Collect scrutin IDs to link
    const toLink: { scrutinId: string; role: string; ordre: number }[] = [];

    if (def.motionIds) {
      // Motion de censure cluster — all are MOTION role
      def.motionIds.forEach((id, idx) => {
        toLink.push({ scrutinId: id, role: "MOTION", ordre: idx });
      });
    } else {
      // Single law: VOTE_FINAL + related scrutins from pattern
      if (def.voteFinalId) {
        toLink.push({ scrutinId: def.voteFinalId, role: "VOTE_FINAL", ordre: 0 });
      }

      if (def.relatedPattern) {
        // Extract the core search term from the pattern (strip leading/trailing %)
        const searchTerm = def.relatedPattern.replace(/%/g, "").trim();
        const related = await findRelatedScrutinIds(searchTerm, def.voteFinalId ? [def.voteFinalId] : []);
        related.forEach((s, idx) => {
          const role = roleForScrutin(s, false);
          toLink.push({ scrutinId: s.id, role, ordre: idx + 1 });
        });
      }
    }

    // Upsert all ScrutinLoi links
    for (const link of toLink) {
      await prisma.scrutinLoi.upsert({
        where: { loiId_scrutinId: { loiId: loi.id, scrutinId: link.scrutinId } },
        create: { loiId: loi.id, scrutinId: link.scrutinId, role: link.role, ordre: link.ordre },
        update: { role: link.role, ordre: link.ordre },
      });
      totalLiens++;
    }

    console.log(`  ✓ ${def.titreCourt} — ${toLink.length} scrutins liés`);
  }

  console.log(`\nDone: ${totalLois} lois, ${totalLiens} liens ScrutinLoi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
