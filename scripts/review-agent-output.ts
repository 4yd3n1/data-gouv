/**
 * Interactive review CLI for research agent output.
 * Reads data/research-output/[slug].json, shows each item, ingests accepted ones.
 *
 * Usage: npx tsx scripts/review-agent-output.ts <slug>
 * Example: npx tsx scripts/review-agent-output.ts francois-bayrou
 *
 * For each item:
 *   (a) Accept  — ingests immediately
 *   (r) Reject  — skips
 *   (s) Skip    — defers (leaves JSON unchanged for next review)
 *
 * Safety: EvenementJudiciaire records are always created with verifie = true
 * (the human review step IS the verification gate).
 */

import "dotenv/config";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/db";
import type {
  CategorieCarriere,
  TypeEvenement,
  StatutEvenement,
} from "@prisma/client";

// ─── Types matching the JSON schema ──────────────────────────────────────────

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
  confidence: "high" | "medium" | "low";
  _reviewed?: boolean;
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
  _reviewed?: boolean;
}

interface ResearchOutput {
  slug: string;
  nom: string;
  prenom: string;
  researched_at: string;
  notes?: string;
  career_entries: CareerEntry[];
  judicial_events: JudicialEvent[];
  conflict_flags: Array<{ rubrique: string; organisation: string; commentaire: string }>;
}

// ─── Readline helper ──────────────────────────────────────────────────────────

function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY,
  });

  async function ask(question: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(question);
      rl.once("line", (line) => resolve(line.trim().toLowerCase()));
    });
  }

  return { rl, ask };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";

function printSep() {
  console.log("\n" + "─".repeat(70));
}

function printCareerEntry(entry: CareerEntry, i: number, total: number) {
  printSep();
  console.log(`${BOLD}${CYAN}[CARRIÈRE ${i}/${total}]${RESET}`);
  console.log(`  ${BOLD}Titre      :${RESET} ${entry.titre}`);
  if (entry.organisation) console.log(`  ${BOLD}Org        :${RESET} ${entry.organisation}`);
  console.log(`  ${BOLD}Catégorie  :${RESET} ${entry.categorie}`);
  console.log(
    `  ${BOLD}Période    :${RESET} ${entry.dateDebut ?? "?"} → ${entry.dateFin ?? "en cours"}`
  );
  if (entry.description) console.log(`  ${BOLD}Description:${RESET} ${DIM}${entry.description}${RESET}`);
  console.log(
    `  ${BOLD}Source     :${RESET} ${entry.sourcePrincipale} (${entry.sourceDate})`
  );
  console.log(`  ${BOLD}URL        :${RESET} ${DIM}${entry.sourceUrl}${RESET}`);
  console.log(`  ${BOLD}Confiance  :${RESET} ${entry.confidence}`);
  console.log();
}

function printJudicialEvent(ev: JudicialEvent, i: number, total: number) {
  printSep();
  console.log(`${BOLD}${YELLOW}[JUDICIAIRE ${i}/${total}]${RESET}`);
  console.log(`  ${BOLD}Type       :${RESET} ${RED}${ev.type}${RESET}`);
  console.log(`  ${BOLD}Nature     :${RESET} ${ev.nature}`);
  console.log(`  ${BOLD}Date       :${RESET} ${ev.date ?? "?"}`);
  console.log(`  ${BOLD}Juridiction:${RESET} ${ev.juridiction}`);
  console.log(`  ${BOLD}Statut     :${RESET} ${ev.statut}`);
  console.log(`  ${BOLD}Résumé     :${RESET} ${DIM}${ev.resume}${RESET}`);
  console.log(
    `  ${BOLD}Source     :${RESET} ${ev.sourcePrincipale} (${ev.sourceDate})`
  );
  console.log(`  ${BOLD}URL        :${RESET} ${DIM}${ev.sourceUrl}${RESET}`);
  if (ev.corroborated_by?.length) {
    console.log(`  ${BOLD}Corroboré  :${RESET} ${ev.corroborated_by.join(", ")}`);
  }
  console.log();
}

// ─── Ingestion helpers ────────────────────────────────────────────────────────

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function ingestCareerEntry(
  personnaliteId: string,
  entry: CareerEntry
): Promise<void> {
  await prisma.entreeCarriere.create({
    data: {
      personnaliteId,
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
}

async function ingestJudicialEvent(
  personnaliteId: string,
  ev: JudicialEvent
): Promise<void> {
  await prisma.evenementJudiciaire.create({
    data: {
      personnaliteId,
      date: parseDate(ev.date),
      type: ev.type,
      nature: ev.nature,
      juridiction: ev.juridiction,
      statut: ev.statut,
      resume: ev.resume,
      sourcePrincipale: ev.sourcePrincipale,
      sourceUrl: ev.sourceUrl,
      sourceDate: parseDate(ev.sourceDate),
      verifie: true, // human review IS the verification gate
    },
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/review-agent-output.ts <slug>");
    process.exit(1);
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "research-output",
    `${slug}.json`
  );

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const output: ResearchOutput = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Find the personnalite
  const personnalite = await prisma.personnalitePublique.findUnique({
    where: { slug },
    select: { id: true, nom: true, prenom: true, sourceRecherche: true },
  });

  if (!personnalite) {
    console.error(`PersonnalitePublique not found for slug: ${slug}`);
    process.exit(1);
  }

  console.log(
    `\n${BOLD}${BLUE}═══ Review: ${personnalite.prenom} ${personnalite.nom} (${slug}) ═══${RESET}`
  );
  console.log(
    `${DIM}Recherché le ${output.researched_at} · Sources: ${(output as ResearchOutput & { sources_used?: string[] }).sources_used?.join(", ") ?? "non spécifiées"}${RESET}`
  );
  if (output.notes) console.log(`${DIM}Note: ${output.notes}${RESET}`);
  console.log(
    `\n${BOLD}${output.career_entries.length} entrées carrière · ${output.judicial_events.length} événements judiciaires${RESET}`
  );

  const unreviewed_careers = output.career_entries.filter((e) => !e._reviewed);
  const unreviewed_judicial = output.judicial_events.filter((e) => !e._reviewed);

  if (unreviewed_careers.length === 0 && unreviewed_judicial.length === 0) {
    console.log(`\n${GREEN}Tout a déjà été examiné pour ce slug.${RESET}`);
    await prisma.$disconnect();
    return;
  }

  const { rl, ask } = createPrompt();

  let careerAccepted = 0;
  let careerRejected = 0;
  let judicialAccepted = 0;
  let judicialRejected = 0;

  // ── Review career entries ──
  if (unreviewed_careers.length > 0) {
    console.log(`\n${BOLD}${CYAN}── Entrées de carrière ──${RESET}`);

    for (let i = 0; i < output.career_entries.length; i++) {
      const entry = output.career_entries[i];
      if (entry._reviewed) continue;

      printCareerEntry(entry, i + 1, output.career_entries.length);

      let answer = "";
      while (!["a", "r", "s"].includes(answer)) {
        answer = await ask(
          `${BOLD}(a) Accepter  (r) Rejeter  (s) Passer${RESET} → `
        );
      }

      if (answer === "a") {
        await ingestCareerEntry(personnalite.id, entry);
        entry._reviewed = true;
        careerAccepted++;
        console.log(`  ${GREEN}✓ Ingéré${RESET}`);
      } else if (answer === "r") {
        entry._reviewed = true;
        careerRejected++;
        console.log(`  ${RED}✗ Rejeté${RESET}`);
      } else {
        console.log(`  ${DIM}→ Passé (sera reposé lors de la prochaine revue)${RESET}`);
      }
    }
  }

  // ── Review judicial events ──
  if (unreviewed_judicial.length > 0) {
    console.log(`\n${BOLD}${YELLOW}── Événements judiciaires ──${RESET}`);
    console.log(
      `${RED}ATTENTION : Vérifiez l'URL source avant d'accepter. Toute acceptation publie l'entrée avec verifie=true.${RESET}`
    );

    for (let i = 0; i < output.judicial_events.length; i++) {
      const ev = output.judicial_events[i];
      if (ev._reviewed) continue;

      printJudicialEvent(ev, i + 1, output.judicial_events.length);

      let answer = "";
      while (!["a", "r", "s"].includes(answer)) {
        answer = await ask(
          `${BOLD}(a) Accepter  (r) Rejeter  (s) Passer${RESET} → `
        );
      }

      if (answer === "a") {
        await ingestJudicialEvent(personnalite.id, ev);
        ev._reviewed = true;
        judicialAccepted++;
        console.log(`  ${GREEN}✓ Ingéré (verifie=true)${RESET}`);
      } else if (answer === "r") {
        ev._reviewed = true;
        judicialRejected++;
        console.log(`  ${RED}✗ Rejeté${RESET}`);
      } else {
        console.log(`  ${DIM}→ Passé${RESET}`);
      }
    }
  }

  // ── Update sourceRecherche if anything was accepted ──
  if (careerAccepted > 0 || judicialAccepted > 0) {
    const newSource =
      judicialAccepted > 0 ? "VERIFIE_MANUELLEMENT" : "HATVP_PLUS_PRESSE";
    await prisma.personnalitePublique.update({
      where: { id: personnalite.id },
      data: { sourceRecherche: newSource },
    });
  }

  // ── Save review state back to JSON ──
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");

  // ── Summary ──
  printSep();
  console.log(
    `\n${BOLD}${BLUE}═══ Résumé ═══${RESET}`
  );
  console.log(
    `  Carrière  : ${GREEN}${careerAccepted} acceptées${RESET} · ${RED}${careerRejected} rejetées${RESET}`
  );
  console.log(
    `  Judiciaire: ${GREEN}${judicialAccepted} acceptés${RESET} · ${RED}${judicialRejected} rejetés${RESET}`
  );
  if (careerAccepted > 0 || judicialAccepted > 0) {
    console.log(
      `  sourceRecherche mis à jour sur le profil.`
    );
  }
  console.log();

  rl.close();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
