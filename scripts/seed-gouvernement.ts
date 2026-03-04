/**
 * Seed the current government (Gouvernement Bayrou, since January 13, 2025).
 * Idempotent: upserts on `slug`.
 *
 * Run: npx tsx scripts/seed-gouvernement.ts
 *
 * Data sourced from gouvernement.fr and Wikipedia.
 * TODO: Add remaining ~25 ministers (delegated ministers + secretaries of state).
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { TypeMandat } from "@prisma/client";

const GOUVERNEMENT = "Gouvernement François Bayrou";
const PRESIDENT = "Emmanuel Macron";
const PM = "François Bayrou";
const DATE_DEBUT = new Date("2025-01-13");

interface MemberSeed {
  nom: string;
  prenom: string;
  civilite: string;
  slug: string;
  rang: number;
  type: TypeMandat;
  titre: string;
  titreCourt: string;
  ministereCode?: string;
  portefeuille?: string;
  bioCourte?: string;
  photoUrl?: string;
}

const members: MemberSeed[] = [
  // ─── Président ───
  {
    nom: "Macron",
    prenom: "Emmanuel",
    civilite: "M.",
    slug: "emmanuel-macron",
    rang: 1,
    type: TypeMandat.PRESIDENT,
    titre: "Président de la République française",
    titreCourt: "Président de la République",
    ministereCode: "PRESIDENCE",
    bioCourte:
      "Emmanuel Macron est le 25e président de la République française, élu en 2017 et réélu en 2022.",
  },
  // ─── Premier ministre ───
  {
    nom: "Bayrou",
    prenom: "François",
    civilite: "M.",
    slug: "francois-bayrou",
    rang: 2,
    type: TypeMandat.PREMIER_MINISTRE,
    titre: "Premier ministre",
    titreCourt: "Premier ministre",
    ministereCode: "MATIGNON",
    bioCourte:
      "François Bayrou est Premier ministre depuis le 13 janvier 2025. Fondateur du MoDem, il est l'une des figures centrales du centre politique français.",
  },
  // ─── Ministres ───
  {
    nom: "Barrot",
    prenom: "Jean-Noël",
    civilite: "M.",
    slug: "jean-noel-barrot",
    rang: 3,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Europe et des Affaires étrangères",
    titreCourt: "Affaires étrangères",
    ministereCode: "AFFAIRES_ETRANGERES",
    portefeuille:
      "Relations diplomatiques, représentation de la France au sein de l'Union européenne, politique étrangère.",
  },
  {
    nom: "Lecornu",
    prenom: "Sébastien",
    civilite: "M.",
    slug: "sebastien-lecornu",
    rang: 4,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des Armées",
    titreCourt: "Armées",
    ministereCode: "ARMEES",
    portefeuille:
      "Défense nationale, forces armées, industrie de défense, anciens combattants.",
  },
  {
    nom: "Retailleau",
    prenom: "Bruno",
    civilite: "M.",
    slug: "bruno-retailleau",
    rang: 5,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Intérieur",
    titreCourt: "Intérieur",
    ministereCode: "INTERIEUR",
    portefeuille:
      "Sécurité intérieure, police nationale, gendarmerie nationale, immigration, libertés publiques.",
  },
  {
    nom: "Lombard",
    prenom: "Éric",
    civilite: "M.",
    slug: "eric-lombard",
    rang: 6,
    type: TypeMandat.MINISTRE,
    titre:
      "Ministre de l'Économie, des Finances et de la Souveraineté industrielle et numérique",
    titreCourt: "Économie et Finances",
    ministereCode: "ECONOMIE_FINANCES",
    portefeuille:
      "Politique économique, budget, fiscalité, industrie, numérique, commerce extérieur.",
  },
  {
    nom: "Darmanin",
    prenom: "Gérald",
    civilite: "M.",
    slug: "gerald-darmanin",
    rang: 7,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Justice, Garde des Sceaux",
    titreCourt: "Justice",
    ministereCode: "JUSTICE",
    portefeuille:
      "Organisation judiciaire, droit civil et pénal, administration pénitentiaire, protection judiciaire de la jeunesse.",
  },
  {
    nom: "Borne",
    prenom: "Élisabeth",
    civilite: "Mme",
    slug: "elisabeth-borne",
    rang: 8,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Éducation nationale, de l'Enseignement supérieur et de la Recherche",
    titreCourt: "Éducation nationale",
    ministereCode: "EDUCATION_NATIONALE",
    portefeuille:
      "Enseignement scolaire de la maternelle au lycée, enseignement supérieur, recherche scientifique.",
  },
  {
    nom: "Pannier-Runacher",
    prenom: "Agnès",
    civilite: "Mme",
    slug: "agnes-pannier-runacher",
    rang: 9,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Transition écologique, de l'Énergie, du Climat et de la Prévention des risques",
    titreCourt: "Transition écologique",
    ministereCode: "TRANSITION_ECOLOGIQUE",
    portefeuille:
      "Politique climatique, énergie, nucléaire, biodiversité, prévention des risques naturels et technologiques.",
  },
  {
    nom: "Vautrin",
    prenom: "Catherine",
    civilite: "Mme",
    slug: "catherine-vautrin",
    rang: 10,
    type: TypeMandat.MINISTRE,
    titre: "Ministre du Travail, de la Santé, des Solidarités et des Familles",
    titreCourt: "Travail et Santé",
    ministereCode: "TRAVAIL_SANTE",
    portefeuille:
      "Emploi, droit du travail, système de santé, politique sociale, solidarités, politique familiale.",
  },
  {
    nom: "Wauquiez",
    prenom: "Laurent",
    civilite: "M.",
    slug: "laurent-wauquiez",
    rang: 11,
    type: TypeMandat.MINISTRE,
    titre: "Ministre chargé de l'Europe",
    titreCourt: "Europe",
    ministereCode: "EUROPE",
    portefeuille:
      "Coordination des affaires européennes, représentation auprès des institutions de l'UE.",
  },
  {
    nom: "Guerini",
    prenom: "Marc",
    civilite: "M.",
    slug: "marc-guerini",
    rang: 12,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Transformation et de la Fonction publiques",
    titreCourt: "Fonction publique",
    ministereCode: "FONCTION_PUBLIQUE",
    portefeuille:
      "Réforme de l'État, modernisation de l'administration, ressources humaines de la fonction publique.",
  },
  // TODO: Add remaining secretaries of state and delegated ministers
  // Full list: https://www.gouvernement.fr/composition-du-gouvernement
];

async function main() {
  console.log(`Seeding ${GOUVERNEMENT}...`);

  let created = 0;
  let updated = 0;

  for (const member of members) {
    const personnalite = await prisma.personnalitePublique.upsert({
      where: { slug: member.slug },
      create: {
        nom: member.nom,
        prenom: member.prenom,
        civilite: member.civilite,
        slug: member.slug,
        photoUrl: member.photoUrl ?? null,
        bioCourte: member.bioCourte ?? null,
        sourceRecherche: "HATVP_ONLY",
      },
      update: {
        nom: member.nom,
        prenom: member.prenom,
        civilite: member.civilite,
        photoUrl: member.photoUrl ?? null,
        bioCourte: member.bioCourte ?? null,
      },
    });

    // Upsert the current mandate (match by personnaliteId + gouvernement + type)
    const existingMandat = await prisma.mandatGouvernemental.findFirst({
      where: {
        personnaliteId: personnalite.id,
        gouvernement: GOUVERNEMENT,
        type: member.type,
      },
    });

    if (existingMandat) {
      await prisma.mandatGouvernemental.update({
        where: { id: existingMandat.id },
        data: {
          titre: member.titre,
          titreCourt: member.titreCourt,
          premierMinistre: PM,
          president: PRESIDENT,
          rang: member.rang,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
        },
      });
      updated++;
    } else {
      await prisma.mandatGouvernemental.create({
        data: {
          personnaliteId: personnalite.id,
          titre: member.titre,
          titreCourt: member.titreCourt,
          gouvernement: GOUVERNEMENT,
          premierMinistre: PM,
          president: PRESIDENT,
          dateDebut: DATE_DEBUT,
          dateFin: null,
          rang: member.rang,
          type: member.type,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
        },
      });
      created++;
    }

    console.log(`  ${member.rang}. ${member.prenom} ${member.nom} — ${member.titreCourt}`);
  }

  console.log(`\nDone. Created: ${created}, updated: ${updated}.`);
  console.log(`Total members seeded: ${members.length}`);
  console.log(`\nNote: Add remaining secretaries of state at https://www.gouvernement.fr/composition-du-gouvernement`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
