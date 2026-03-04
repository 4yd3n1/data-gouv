/**
 * Ingest all items from data/research-output/[slug].json directly.
 * Equivalent to accepting every item in the interactive review CLI.
 *
 * Usage: npx tsx scripts/ingest-research-output.ts <slug>
 *        npx tsx scripts/ingest-research-output.ts --all
 *
 * All EvenementJudiciaire records are created with verifie = true.
 * Idempotent: skips items already marked _ingested in the JSON.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/db";
import type { CategorieCarriere, TypeEvenement, StatutEvenement } from "@prisma/client";

interface CareerEntry {
  dateDebut: string | null;
  dateFin: string | null;
  categorie: CategorieCarriere;
  titre: string;
  organisation?: string;
  description?: string;
  sourceUrl: string;
  sourcePrincipale: string;
  sourceDate: string;
  confidence: string;
  _ingested?: boolean;
}

interface JudicialEvent {
  date: string | null;
  type: TypeEvenement;
  nature: string;
  juridiction: string;
  statut: StatutEvenement;
  resume: string;
  sourcePrincipale: string;
  sourceUrl: string;
  sourceDate: string;
  corroborated_by?: string[];
  _ingested?: boolean;
}

interface ResearchOutput {
  slug: string;
  nom: string;
  prenom: string;
  researched_at: string;
  career_entries: CareerEntry[];
  judicial_events: JudicialEvent[];
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function ingestFile(filePath: string) {
  const output: ResearchOutput = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { slug } = output;

  const personnalite = await prisma.personnalitePublique.findUnique({
    where: { slug },
    select: { id: true, nom: true, prenom: true },
  });

  if (!personnalite) {
    console.log(`  ✗ PersonnalitePublique not found for slug: ${slug}`);
    return;
  }

  console.log(`\n── ${personnalite.prenom} ${personnalite.nom} (${slug}) ──`);

  let careerAdded = 0;
  let judicialAdded = 0;

  // ── Career entries ──
  for (const entry of output.career_entries) {
    if (entry._ingested) continue;
    await prisma.entreeCarriere.create({
      data: {
        personnaliteId: personnalite.id,
        dateDebut: parseDate(entry.dateDebut),
        dateFin: parseDate(entry.dateFin),
        categorie: entry.categorie,
        titre: entry.titre,
        organisation: entry.organisation ?? null,
        description: entry.description ?? null,
        source: "PRESSE",
        sourceUrl: entry.sourceUrl,
        sourceDate: parseDate(entry.sourceDate),
        ordre: 0,
      },
    });
    entry._ingested = true;
    careerAdded++;
    console.log(`  + Carrière : ${entry.titre}`);
  }

  // ── Judicial events ──
  for (const ev of output.judicial_events) {
    if (ev._ingested) continue;
    await prisma.evenementJudiciaire.create({
      data: {
        personnaliteId: personnalite.id,
        date: parseDate(ev.date),
        type: ev.type,
        nature: ev.nature,
        juridiction: ev.juridiction,
        statut: ev.statut,
        resume: ev.resume,
        sourcePrincipale: ev.sourcePrincipale,
        sourceUrl: ev.sourceUrl,
        sourceDate: parseDate(ev.sourceDate),
        verifie: true,
      },
    });
    ev._ingested = true;
    judicialAdded++;
    console.log(`  + Judiciaire : ${ev.type} — ${ev.nature}`);
  }

  // ── Update sourceRecherche ──
  if (careerAdded > 0 || judicialAdded > 0) {
    const newSource = judicialAdded > 0 ? "VERIFIE_MANUELLEMENT" : "HATVP_PLUS_PRESSE";
    await prisma.personnalitePublique.update({
      where: { id: personnalite.id },
      data: { sourceRecherche: newSource },
    });
    console.log(`  → sourceRecherche = ${newSource}`);
  }

  // ── Save ingestion state ──
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`  ✓ ${careerAdded} carrière(s) · ${judicialAdded} judiciaire(s) ingérés`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/ingest-research-output.ts <slug|--all>");
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "data", "research-output");

  if (arg === "--all") {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    console.log(`Ingesting ${files.length} file(s)...`);
    for (const file of files) {
      await ingestFile(path.join(dir, file));
    }
  } else {
    const filePath = path.join(dir, `${arg}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    await ingestFile(filePath);
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
