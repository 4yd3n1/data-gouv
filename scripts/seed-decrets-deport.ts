/**
 * Seed ministerial déport decrees (JORF recusal orders for Lecornu II government).
 *
 * Source of truth: https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets
 *
 * The registre de prévention des conflits d'intérêts is maintained by the services
 * du Premier ministre and lists all décrets taken under art. 2 / 2-1 / 2-2 du décret
 * n° 59-178 du 22 janvier 1959. As of 2026-04-21, 11 ministers appear on the registre.
 * (HATVP's 20 April 2026 press release mentions 14 déports; the gap may be due to
 * décrets filed but not yet published to the registry.)
 *
 * Idempotent: upserts on (personnaliteId, perimetre).
 *
 * Run: pnpm tsx scripts/seed-decrets-deport.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { BasisDeport } from "@prisma/client";
import { logIngestion } from "./lib/ingestion-log";

interface DeportSeed {
  slug: string;
  perimetre: string;
  basis: BasisDeport;
  basisDetail: string;
  dateDecret: Date;
  jorfRef: string; // Décret number (e.g. "2025-1027")
  sourceUrl: string;
  sourceOutlet: string;
  verifie: boolean;
}

const REGISTRE_URL =
  "https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets";

const DEPORTS: DeportSeed[] = [
  {
    slug: "sebastien-lecornu",
    perimetre:
      "Carrière, statut et nomination des magistrats (procédures concernant le Premier ministre ; PNF)",
    basis: BasisDeport.PROCEDURE_JUDICIAIRE,
    basisDetail:
      "Ne connaît pas des actes relatifs aux magistrats ayant participé aux procédures le concernant, aux magistrats du parquet national financier, et à leurs nominations. Attributions exercées par le ministre du Travail et des Solidarités.",
    dateDecret: new Date("2025-10-31"),
    jorfRef: "2025-1027",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "gerald-darmanin",
    perimetre:
      "Magistrats mis en cause ou le mettant en cause ; parties ayant engagé des actions contre lui ; rapports art. 35 CPP",
    basis: BasisDeport.PROCEDURE_JUDICIAIRE,
    basisDetail:
      "Ne connaît pas des actes relatifs à la mise en cause d'un magistrat à raison d'affaires dans lesquelles il est ou a été impliqué, à la carrière ou au statut d'un tel magistrat, aux personnes morales ou physiques ayant engagé des actions judiciaires contre lui, et aux rapports particuliers art. 35 CPP. Attributions exercées par le Premier ministre.",
    dateDecret: new Date("2025-10-31"),
    jorfRef: "2025-1034",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "serge-papin",
    perimetre:
      "Sociétés du groupe Auchan ; clients de son activité de conseil en stratégie durant les 5 dernières années",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail:
      "Ancien président non exécutif du groupe Auchan ; activité de conseil en stratégie d'entreprise durant les 5 années précédant sa nomination.",
    dateDecret: new Date("2025-12-05"),
    jorfRef: "2025-1160",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "jean-noel-barrot",
    perimetre: "Groupe Uber ; société eXplain",
    basis: BasisDeport.FAMILLE_CONJOINT,
    basisDetail:
      "Sœur Hélène Barrot, directrice de la communication d'Uber Europe. Intérêts familiaux dans la société eXplain.",
    dateDecret: new Date("2025-10-31"),
    jorfRef: "2025-1039",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "stephanie-rist",
    perimetre: "Centre hospitalier universitaire d'Orléans",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail:
      "Médecin rhumatologue au CHU d'Orléans avant sa nomination au gouvernement.",
    dateDecret: new Date("2025-12-26"),
    jorfRef: "2025-1337",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "david-amiel",
    perimetre: "Sociétés du groupe La Poste",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail: "Ancien directeur de la stratégie du groupe La Poste.",
    dateDecret: new Date("2026-03-10"),
    jorfRef: "2026-173",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "philippe-baptiste",
    perimetre: "Société CNES Participations",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail:
      "Ancien président du CNES, exerçant une tutelle indirecte sur CNES Participations.",
    dateDecret: new Date("2025-10-31"),
    jorfRef: "2025-1042",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "philippe-tabarot",
    perimetre: "Association « Avenir Transports »",
    basis: BasisDeport.ACTIVITE_BENEVOLE,
    basisDetail: "Mandat associatif au sein de l'association Avenir Transports.",
    dateDecret: new Date("2026-03-04"),
    jorfRef: "2026-165",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "aurore-berge",
    perimetre: "Société Victory",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail: "Intérêts personnels dans la société Victory.",
    dateDecret: new Date("2025-10-31"),
    jorfRef: "2025-1028",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "catherine-chabaud",
    perimetre: "Yacht Club de France ; Institut français de la mer ; Académie de marine",
    basis: BasisDeport.ACTIVITE_BENEVOLE,
    basisDetail:
      "Mandats associatifs et académiques au sein de ces trois structures. Attributions exercées par la ministre de la Transition écologique.",
    dateDecret: new Date("2025-11-21"),
    jorfRef: "2025-1104",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
  {
    slug: "nicolas-forissier",
    perimetre: "Société Cap Coreli",
    basis: BasisDeport.ANCIEN_EMPLOYEUR,
    basisDetail: "Intérêts dans la société Cap Coreli.",
    dateDecret: new Date("2026-04-14"),
    jorfRef: "2026-279",
    sourceUrl: REGISTRE_URL,
    sourceOutlet: "info.gouv.fr",
    verifie: true,
  },
];

async function seed() {
  await logIngestion("decrets-deport", async () => {
    let upserted = 0;
    let missingPersonnalite = 0;

    for (const d of DEPORTS) {
      const personnalite = await prisma.personnalitePublique.findUnique({
        where: { slug: d.slug },
        select: { id: true },
      });

      if (!personnalite) {
        console.warn(`  [skip] No PersonnalitePublique found for slug=${d.slug}`);
        missingPersonnalite++;
        continue;
      }

      await prisma.decretDeport.upsert({
        where: {
          personnaliteId_perimetre: {
            personnaliteId: personnalite.id,
            perimetre: d.perimetre,
          },
        },
        update: {
          dateDecret: d.dateDecret,
          jorfRef: d.jorfRef,
          basis: d.basis,
          basisDetail: d.basisDetail,
          sourceUrl: d.sourceUrl,
          sourceOutlet: d.sourceOutlet,
          verifie: d.verifie,
        },
        create: {
          personnaliteId: personnalite.id,
          dateDecret: d.dateDecret,
          jorfRef: d.jorfRef,
          basis: d.basis,
          basisDetail: d.basisDetail,
          perimetre: d.perimetre,
          sourceUrl: d.sourceUrl,
          sourceOutlet: d.sourceOutlet,
          verifie: d.verifie,
        },
      });
      upserted++;
    }

    console.log(
      `  ${upserted} décrets de déport seeded from registre info.gouv.fr (${DEPORTS.length - upserted} skipped). HATVP press release cites 14; registre lists ${DEPORTS.length}.`
    );

    return {
      rowsIngested: upserted,
      rowsTotal: DEPORTS.length,
      metadata: {
        hatvpTotalAnnounced: 14,
        publiclyRegistered: DEPORTS.length,
        missingPersonnalite,
      },
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
