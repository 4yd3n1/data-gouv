/**
 * Ingest all items from data/research-output/[slug].json directly.
 * Equivalent to accepting every item in the interactive review CLI.
 *
 * Usage: npx tsx scripts/ingest-research-output.ts <slug>
 *        npx tsx scripts/ingest-research-output.ts --all
 *        npx tsx scripts/ingest-research-output.ts --lobbyistes     # ingest data/research-output/lobbyistes/*.json
 *        npx tsx scripts/ingest-research-output.ts --lobbyiste <id> # ingest one lobbyiste file
 *
 * EvenementJudiciaire records are created with verifie = true.
 * LobbyisteDirigeantCarriere + LobbyistePosition inherit the per-entry `verifie` flag
 * (default false) — editorial review required before display on public surfaces.
 * Idempotent: skips items already marked _ingested in the JSON.
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../src/lib/db";
import { normalizeName } from "../src/lib/normalize-name";
import type {
  CategorieCarriere,
  CategorieCarriereLobby,
  TypeEvenement,
  StatutEvenement,
} from "@prisma/client";

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

interface LobbyCareerEntry {
  titre: string;
  organisation?: string | null;
  categorie: CategorieCarriereLobby;
  dateDebut?: string | null;
  dateFin?: string | null;
  source: string;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  verifie?: boolean;
  _ingested?: boolean;
}

interface LobbyDirigeantSeed {
  nomNormalise: string;
  prenomNormalise?: string | null;
  fonction?: string | null;
  carriere?: LobbyCareerEntry[];
}

interface LobbyPositionEntry {
  thematique: string;
  positionDeclaree: string;
  source: string;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  verifie?: boolean;
  _ingested?: boolean;
}

interface LobbyResearchOutput {
  lobbyisteId: string;
  nom: string;
  researched_at?: string;
  notes?: string;
  dirigeants?: LobbyDirigeantSeed[];
  positions?: LobbyPositionEntry[];
}

async function ingestLobbyFile(filePath: string) {
  const output: LobbyResearchOutput = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { lobbyisteId, nom } = output;

  const lobby = await prisma.lobbyiste.findUnique({
    where: { id: lobbyisteId },
    select: { id: true, nom: true },
  });
  if (!lobby) {
    console.log(`  ✗ Lobbyiste not found for id: ${lobbyisteId} (${nom})`);
    return;
  }

  console.log(`\n── ${lobby.nom} (${lobbyisteId}) ──`);

  let carriereAdded = 0;
  let positionsAdded = 0;

  for (const d of output.dirigeants ?? []) {
    const nomNormalise = normalizeName(d.nomNormalise ?? "");
    const prenomNormalise = d.prenomNormalise ? normalizeName(d.prenomNormalise) : null;
    if (!nomNormalise) continue;

    // Find or create the LobbyisteDirigeant row (editorial additions may pre-date RNE ingestion)
    let dirigeant = await prisma.lobbyisteDirigeant.findFirst({
      where: {
        lobbyisteId,
        nomNormalise,
        prenomNormalise: prenomNormalise ?? "",
      },
    });

    if (!dirigeant) {
      dirigeant = await prisma.lobbyisteDirigeant.create({
        data: {
          lobbyisteId,
          nom: (d.nomNormalise ?? "").toUpperCase(),
          prenom: d.prenomNormalise ?? null,
          nomNormalise,
          prenomNormalise,
          fonction: d.fonction ?? null,
          source: "RESEARCH",
          sourceUrl: null,
          sourceDate: new Date(),
          verifie: false,
        },
      });
      console.log(`  + Dirigeant placeholder : ${d.nomNormalise} ${d.prenomNormalise ?? ""}`);
    } else if (d.fonction && !dirigeant.fonction) {
      // Backfill fonction if research JSON has it and DB doesn't
      await prisma.lobbyisteDirigeant.update({
        where: { id: dirigeant.id },
        data: { fonction: d.fonction },
      });
    }

    for (const c of d.carriere ?? []) {
      if (c._ingested) continue;
      await prisma.lobbyisteDirigeantCarriere.create({
        data: {
          dirigeantId: dirigeant.id,
          titre: c.titre,
          organisation: c.organisation ?? null,
          categorie: c.categorie,
          dateDebut: parseDate(c.dateDebut),
          dateFin: parseDate(c.dateFin),
          source: c.source,
          sourceUrl: c.sourceUrl ?? null,
          sourceDate: parseDate(c.sourceDate),
          verifie: c.verifie === true,
        },
      });
      c._ingested = true;
      carriereAdded++;
      console.log(`    + Carrière : ${c.titre} — ${c.organisation ?? ""}`);
    }
  }

  for (const p of output.positions ?? []) {
    if (p._ingested) continue;
    await prisma.lobbyistePosition.create({
      data: {
        lobbyisteId,
        thematique: p.thematique,
        positionDeclaree: p.positionDeclaree,
        source: p.source,
        sourceUrl: p.sourceUrl ?? null,
        sourceDate: parseDate(p.sourceDate),
        verifie: p.verifie === true,
      },
    });
    p._ingested = true;
    positionsAdded++;
    console.log(`  + Position : ${p.thematique}`);
  }

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`  ✓ ${carriereAdded} carrière(s) dirigeant · ${positionsAdded} position(s) ingéré(es)`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage: npx tsx scripts/ingest-research-output.ts <slug|--all|--lobbyistes|--lobbyiste <id>>",
    );
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "data", "research-output");
  const lobbyDir = path.join(dir, "lobbyistes");

  if (arg === "--all") {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    console.log(`Ingesting ${files.length} personnalité file(s)...`);
    for (const file of files) {
      await ingestFile(path.join(dir, file));
    }
    if (fs.existsSync(lobbyDir)) {
      const lobbyFiles = fs.readdirSync(lobbyDir).filter((f) => f.endsWith(".json"));
      console.log(`Ingesting ${lobbyFiles.length} lobbyiste file(s)...`);
      for (const file of lobbyFiles) {
        await ingestLobbyFile(path.join(lobbyDir, file));
      }
    }
  } else if (arg === "--lobbyistes") {
    if (!fs.existsSync(lobbyDir)) {
      console.error(`Directory not found: ${lobbyDir}`);
      process.exit(1);
    }
    const files = fs.readdirSync(lobbyDir).filter((f) => f.endsWith(".json"));
    console.log(`Ingesting ${files.length} lobbyiste file(s)...`);
    for (const file of files) {
      await ingestLobbyFile(path.join(lobbyDir, file));
    }
  } else if (arg === "--lobbyiste") {
    const id = process.argv[3];
    if (!id) {
      console.error("Usage: --lobbyiste <lobbyisteId>");
      process.exit(1);
    }
    const filePath = path.join(lobbyDir, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    await ingestLobbyFile(filePath);
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
