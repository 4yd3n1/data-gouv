/**
 * Ingest parliamentary votes (scrutins) from AN open data.
 * Source: 4,691 JSON files at documentation/hatvp-old-context/scrutins/json/
 *
 * Each file contains one scrutin with per-group breakdowns and individual vote records.
 * Creates: Scrutin + GroupeVote + VoteRecord rows.
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";

const SCRUTIN_DIR = path.resolve(__dirname, "../documentation/hatvp-old-context/scrutins/json");

function parseDateSafe(s?: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function safeInt(s?: string | number | null): number {
  if (s == null) return 0;
  const n = typeof s === "number" ? s : parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

/** Normalize AN JSON single-item-or-array to always be an array */
function toArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

interface Votant {
  acteurRef: string;
  mandatRef?: string;
  parDelegation?: string;
  numPlace?: string;
  causePositionVote?: string;
}

export async function ingestScrutins() {
  await logIngestion("scrutins", async () => {
    const files = fs.readdirSync(SCRUTIN_DIR).filter((f) => f.endsWith(".json"));
    console.log(`  Found ${files.length} scrutin JSON files`);

    // Pre-load valid deputy IDs for FK validation
    const allDeputes = await prisma.depute.findMany({ select: { id: true } });
    const validDeputeIds = new Set(allDeputes.map((d) => d.id));
    console.log(`  ${validDeputeIds.size} valid deputy IDs loaded`);

    // Pre-load valid organe IDs
    const allOrganes = await prisma.organe.findMany({ select: { id: true } });
    const validOrganeIds = new Set(allOrganes.map((o) => o.id));

    let scrutinCount = 0;
    let groupeVoteCount = 0;
    let voteRecordCount = 0;
    let skippedVotes = 0;

    // Process files in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      for (const file of batch) {
        const raw = fs.readFileSync(path.join(SCRUTIN_DIR, file), "utf-8");
        const json = JSON.parse(raw);
        const s = json.scrutin;
        if (!s?.uid) continue;

        const scrutinId = s.uid;
        const dateScrutin = parseDateSafe(s.dateScrutin);
        if (!dateScrutin) continue;

        // Upsert scrutin
        await prisma.scrutin.upsert({
          where: { id: scrutinId },
          update: {
            numero: safeInt(s.numero),
            legislature: safeInt(s.legislature),
            dateScrutin,
            organeRef: s.organeRef ?? "PO838901",
            codeTypeVote: s.typeVote?.codeTypeVote ?? "",
            libelleTypeVote: s.typeVote?.libelleTypeVote ?? "",
            typeMajorite: s.typeVote?.typeMajorite ?? null,
            sortCode: s.sort?.code ?? "",
            titre: s.titre ?? s.objet?.libelle ?? "",
            demandeur: s.demandeur?.texte ?? null,
            nombreVotants: safeInt(s.syntheseVote?.nombreVotants),
            suffragesExprimes: safeInt(s.syntheseVote?.suffragesExprimes),
            nbrSuffragesRequis: safeInt(s.syntheseVote?.nbrSuffragesRequis) || null,
            pour: safeInt(s.syntheseVote?.decompte?.pour),
            contre: safeInt(s.syntheseVote?.decompte?.contre),
            abstentions: safeInt(s.syntheseVote?.decompte?.abstentions),
            nonVotants: safeInt(s.syntheseVote?.decompte?.nonVotants) || null,
          },
          create: {
            id: scrutinId,
            numero: safeInt(s.numero),
            legislature: safeInt(s.legislature),
            dateScrutin,
            organeRef: s.organeRef ?? "PO838901",
            codeTypeVote: s.typeVote?.codeTypeVote ?? "",
            libelleTypeVote: s.typeVote?.libelleTypeVote ?? "",
            typeMajorite: s.typeVote?.typeMajorite ?? null,
            sortCode: s.sort?.code ?? "",
            titre: s.titre ?? s.objet?.libelle ?? "",
            demandeur: s.demandeur?.texte ?? null,
            nombreVotants: safeInt(s.syntheseVote?.nombreVotants),
            suffragesExprimes: safeInt(s.syntheseVote?.suffragesExprimes),
            nbrSuffragesRequis: safeInt(s.syntheseVote?.nbrSuffragesRequis) || null,
            pour: safeInt(s.syntheseVote?.decompte?.pour),
            contre: safeInt(s.syntheseVote?.decompte?.contre),
            abstentions: safeInt(s.syntheseVote?.decompte?.abstentions),
            nonVotants: safeInt(s.syntheseVote?.decompte?.nonVotants) || null,
          },
        });
        scrutinCount++;

        // Delete existing sub-records for idempotent re-runs
        await prisma.voteRecord.deleteMany({ where: { scrutinId } });
        await prisma.groupeVote.deleteMany({ where: { scrutinId } });

        // Process per-group votes
        const groupes = toArray(s.ventilationVotes?.organe?.groupes?.groupe);
        const voteRecordsToCreate: Array<{
          scrutinId: string;
          deputeId: string;
          position: string;
          parDelegation: boolean;
          groupeOrganeRef: string | null;
          causePositionVote: string | null;
        }> = [];

        for (const g of groupes) {
          const orgRef = g.organeRef;
          if (!orgRef) continue;

          // Create GroupeVote (skip if organe doesn't exist)
          if (validOrganeIds.has(orgRef)) {
            await prisma.groupeVote.create({
              data: {
                scrutinId,
                organeRef: orgRef,
                nombreMembresGroupe: safeInt(g.nombreMembresGroupe),
                positionMajoritaire: g.vote?.positionMajoritaire ?? "",
                pour: safeInt(g.vote?.decompteVoix?.pour),
                contre: safeInt(g.vote?.decompteVoix?.contre),
                abstentions: safeInt(g.vote?.decompteVoix?.abstentions),
                nonVotants: safeInt(g.vote?.decompteVoix?.nonVotants),
              },
            });
            groupeVoteCount++;
          }

          // Extract individual votes
          const nominatif = g.vote?.decompteNominatif;
          if (!nominatif) continue;

          const categories: Array<{ key: string; position: string }> = [
            { key: "pours", position: "pour" },
            { key: "contres", position: "contre" },
            { key: "abstentions", position: "abstention" },
            { key: "nonVotants", position: "nonVotant" },
          ];

          for (const cat of categories) {
            const votants = toArray<Votant>(nominatif[cat.key]?.votant);
            for (const v of votants) {
              if (!v.acteurRef) continue;
              if (!validDeputeIds.has(v.acteurRef)) {
                skippedVotes++;
                continue;
              }

              voteRecordsToCreate.push({
                scrutinId,
                deputeId: v.acteurRef,
                position: cat.position,
                parDelegation: v.parDelegation === "true",
                groupeOrganeRef: validOrganeIds.has(orgRef) ? orgRef : null,
                causePositionVote: v.causePositionVote ?? null,
              });
            }
          }
        }

        // Batch insert vote records
        if (voteRecordsToCreate.length > 0) {
          await prisma.voteRecord.createMany({
            data: voteRecordsToCreate,
            skipDuplicates: true,
          });
          voteRecordCount += voteRecordsToCreate.length;
        }
      }

      console.log(`  ${i + batch.length}/${files.length} files processed (${voteRecordCount} votes so far)...`);
    }

    console.log(`  ${scrutinCount} scrutins, ${groupeVoteCount} groupe votes, ${voteRecordCount} vote records`);
    console.log(`  ${skippedVotes} votes skipped (deputy not in DB)`);

    return {
      rowsIngested: scrutinCount + groupeVoteCount + voteRecordCount,
      rowsTotal: files.length,
      metadata: { scrutins: scrutinCount, groupeVotes: groupeVoteCount, voteRecords: voteRecordCount, skipped: skippedVotes },
    };
  });
}

// Run standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestScrutins()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
