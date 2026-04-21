/**
 * Seed government members — supports multiple governments chronologically.
 * Idempotent: upserts on slug, mandates matched by personnaliteId + gouvernement + type.
 *
 * Run: npx tsx scripts/seed-gouvernement.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { TypeMandat } from "@prisma/client";
import { normalizeName } from "../src/lib/normalize-name";
import type { GovernmentConfig, MemberSeed } from "./data/types";
import { LECORNU_CONFIG, LECORNU_RESHUFFLE_DEPARTURES } from "./data/gouvernement-lecornu";
import { BORNE_CONFIG } from "./data/gouvernement-borne";
import { ATTAL_CONFIG } from "./data/gouvernement-attal";
import { BARNIER_CONFIG } from "./data/gouvernement-barnier";

// ─── Constants ───────────────────────────────────────────────────────────────

const MACRON: MemberSeed = {
  nom: "Macron",
  prenom: "Emmanuel",
  civilite: "M.",
  slug: "emmanuel-macron",
  rang: 1,
  type: TypeMandat.PRESIDENT,
  titre: "Pr\u00e9sident de la R\u00e9publique fran\u00e7aise",
  titreCourt: "Pr\u00e9sident de la R\u00e9publique",
  ministereCode: "PRESIDENCE",
  bioCourte:
    "Emmanuel Macron est le 25e pr\u00e9sident de la R\u00e9publique fran\u00e7aise, \u00e9lu en 2017 et r\u00e9\u00e9lu en 2022.",
  formation:
    "ENA (promotion L\u00e9opold S\u00e9dar Senghor, 2004), Sciences Po Paris, universit\u00e9 Paris-Nanterre (philosophie)",
};

const DATE_FIN_BAYROU = new Date("2025-10-11");
const GOUVERNEMENT_BAYROU = "Gouvernement Fran\u00e7ois Bayrou";
const DATE_FIN_RESHUFFLE = new Date("2026-02-25");

// ─── Seed a single government ────────────────────────────────────────────────

async function seedGovernment(config: GovernmentConfig) {
  const allMembers = [MACRON, ...config.members];
  console.log(`\nSeeding ${config.gouvernement} (${allMembers.length} members)...`);

  let created = 0;
  let updated = 0;

  for (const member of allMembers) {
    let deputeId: string | null = null;
    let senateurId: string | null = null;

    if (member.deputeNom && member.deputePrenom) {
      const depute = await prisma.depute.findFirst({
        where: { nom: member.deputeNom, prenom: member.deputePrenom, legislature: member.type === TypeMandat.PRESIDENT ? 15 : 17 },
      });
      if (depute) deputeId = depute.id;
    }

    if (member.senateurNom && member.senateurPrenom) {
      const senateur = await prisma.senateur.findFirst({
        where: { nom: member.senateurNom, prenom: member.senateurPrenom },
      });
      if (senateur) senateurId = senateur.id;
    }

    const nomNormalise = normalizeName(member.nom);
    const prenomNormalise = normalizeName(member.prenom);

    const personnalite = await prisma.personnalitePublique.upsert({
      where: { slug: member.slug },
      create: {
        nom: member.nom,
        prenom: member.prenom,
        nomNormalise,
        prenomNormalise,
        civilite: member.civilite,
        slug: member.slug,
        photoUrl: member.photoUrl ?? null,
        bioCourte: member.bioCourte ?? null,
        formation: member.formation ?? null,
        deputeId,
        senateurId,
        sourceRecherche: "HATVP_ONLY",
      },
      update: {
        nom: member.nom,
        prenom: member.prenom,
        nomNormalise,
        prenomNormalise,
        civilite: member.civilite,
        ...(member.photoUrl && { photoUrl: member.photoUrl }),
        ...(member.bioCourte && { bioCourte: member.bioCourte }),
        ...(member.formation && { formation: member.formation }),
        deputeId,
        senateurId,
      },
    });

    const existingMandat = await prisma.mandatGouvernemental.findFirst({
      where: {
        personnaliteId: personnalite.id,
        gouvernement: config.gouvernement,
        type: member.type,
      },
    });

    const dateDebut = member.dateDebut ?? config.dateDebut;

    if (existingMandat) {
      await prisma.mandatGouvernemental.update({
        where: { id: existingMandat.id },
        data: {
          titre: member.titre,
          titreCourt: member.titreCourt,
          premierMinistre: config.premierMinistre,
          president: config.president,
          rang: member.rang,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
          dateDebut,
          dateFin: config.dateFin,
        },
      });
      updated++;
    } else {
      await prisma.mandatGouvernemental.create({
        data: {
          personnaliteId: personnalite.id,
          titre: member.titre,
          titreCourt: member.titreCourt,
          gouvernement: config.gouvernement,
          premierMinistre: config.premierMinistre,
          president: config.president,
          dateDebut,
          dateFin: config.dateFin,
          rang: member.rang,
          type: member.type,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
        },
      });
      created++;
    }

    const tags = [deputeId ? "[dep]" : "", senateurId ? "[sen]" : ""].filter(Boolean).join(" ");
    console.log(`  ${member.rang}. ${member.prenom} ${member.nom} \u2014 ${member.titreCourt} ${tags}`);
  }

  console.log(`  Created: ${created}, Updated: ${updated}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Government Seed (multi-government) ===\n");

  // Close Bayrou mandates
  console.log("Closing Bayrou government mandates...");
  const closedBayrou = await prisma.mandatGouvernemental.updateMany({
    where: { gouvernement: GOUVERNEMENT_BAYROU, dateFin: null },
    data: { dateFin: DATE_FIN_BAYROU },
  });
  console.log(`  Closed ${closedBayrou.count} Bayrou mandates`);

  // Seed governments chronologically
  const governments = [
    BORNE_CONFIG,
    ATTAL_CONFIG,
    BARNIER_CONFIG,
    LECORNU_CONFIG,
  ].filter((g): g is GovernmentConfig => g !== null);

  for (const gov of governments) {
    await seedGovernment(gov);
  }

  // Handle Lecornu reshuffle departures
  console.log("\nClosing Lecornu reshuffle departures...");
  for (const slug of LECORNU_RESHUFFLE_DEPARTURES) {
    const person = await prisma.personnalitePublique.findUnique({ where: { slug } });
    if (!person) {
      console.log(`  ${slug} \u2014 not in DB, skipping`);
      continue;
    }
    const closed = await prisma.mandatGouvernemental.updateMany({
      where: {
        personnaliteId: person.id,
        gouvernement: LECORNU_CONFIG.gouvernement,
        dateFin: null,
      },
      data: { dateFin: DATE_FIN_RESHUFFLE },
    });
    console.log(`  ${slug} \u2014 closed ${closed.count} mandate(s)`);
  }

  console.log("\n=== Done ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
