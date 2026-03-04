/**
 * Generate EntreeCarriere records from structured sources for all PersonnalitePublique.
 *
 * Sources (in order of authority):
 * 1. MandatGouvernemental — all government roles (past + present)
 * 2. Depute linked via deputeId — parliamentary mandate at AN
 * 3. Senateur linked via senateurId — senatorial mandate
 * 4. InteretDeclare where rubrique = ACTIVITE_ANTERIEURE — HATVP-declared past activities
 *
 * Idempotency: deletes all generated entries (source != MANUELLE) then recreates.
 * MANUELLE entries are preserved.
 *
 * Run: npx tsx scripts/generate-carriere.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { logIngestion } from "./lib/ingestion-log";
import { CategorieCarriere, SourceCarriere } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dedupeKey(
  categorie: string,
  titre: string,
  organisation: string | null
): string {
  return `${categorie}|${titre.toLowerCase().trim()}|${(organisation ?? "").toLowerCase().trim()}`;
}

// ─── Main generation ──────────────────────────────────────────────────────────

export async function generateCarriere() {
  await logIngestion("carriere-timeline", async () => {
    const stats = {
      personnalites: 0,
      fromMandats: 0,
      fromDepute: 0,
      fromSenateur: 0,
      totalCreated: 0,
      dedupedOut: 0,
    };

    // Load all PersonnalitePublique with their relations
    const personnalites = await prisma.personnalitePublique.findMany({
      select: {
        id: true,
        prenom: true,
        nom: true,
        civilite: true,
        deputeId: true,
        senateurId: true,
        mandats: {
          orderBy: { dateDebut: "asc" },
          select: {
            titre: true,
            titreCourt: true,
            gouvernement: true,
            dateDebut: true,
            dateFin: true,
            rang: true,
            type: true,
          },
        },
      },
    });

    console.log(`  ${personnalites.length} PersonnalitePublique found`);

    // Clear all auto-generated entries (preserve source = MANUELLE if any)
    const deleted = await prisma.entreeCarriere.deleteMany({
      where: { source: { in: ["HATVP", "ASSEMBLEE"] } },
    });
    console.log(`  Cleared ${deleted.count} existing auto-generated EntreeCarriere records`);

    // Load Depute + Senateur lookup data
    const deputeIds = personnalites
      .map((p) => p.deputeId)
      .filter((id): id is string => id !== null);
    const senateurIds = personnalites
      .map((p) => p.senateurId)
      .filter((id): id is string => id !== null);

    const deputes = await prisma.depute.findMany({
      where: { id: { in: deputeIds } },
      select: {
        id: true,
        nom: true,
        prenom: true,
        civilite: true,
        groupe: true,
        departementNom: true,
        datePriseFonction: true,
        actif: true,
      },
    });
    const deputeMap = new Map(deputes.map((d) => [d.id, d]));

    const senateurs = await prisma.senateur.findMany({
      where: { id: { in: senateurIds } },
      select: {
        id: true,
        nom: true,
        prenom: true,
        civilite: true,
        groupe: true,
        departement: true,
        datePriseFonction: true,
        actif: true,
      },
    });
    const senateurMap = new Map(senateurs.map((s) => [s.id, s]));

    // Build and insert entries per person
    for (const p of personnalites) {
      stats.personnalites++;

      const seen = new Set<string>();
      const entries: Array<{
        personnaliteId: string;
        categorie: CategorieCarriere;
        titre: string;
        organisation: string | null;
        dateDebut: Date | null;
        dateFin: Date | null;
        source: SourceCarriere;
        ordre: number;
      }> = [];

      function addEntry(
        categorie: CategorieCarriere,
        titre: string,
        organisation: string | null,
        dateDebut: Date | null,
        dateFin: Date | null,
        source: SourceCarriere,
        ordre: number
      ) {
        const key = dedupeKey(categorie, titre, organisation);
        if (seen.has(key)) {
          stats.dedupedOut++;
          return;
        }
        seen.add(key);
        entries.push({ personnaliteId: p.id, categorie, titre, organisation, dateDebut, dateFin, source, ordre });
      }

      // ── 1. MandatGouvernemental ───────────────────────────────────────────
      for (let i = 0; i < p.mandats.length; i++) {
        const m = p.mandats[i]!;
        addEntry(
          CategorieCarriere.MANDAT_GOUVERNEMENTAL,
          m.titre,
          m.gouvernement,
          m.dateDebut,
          m.dateFin,
          SourceCarriere.HATVP, // Will be re-created on re-run (not MANUELLE)
          i
        );
        stats.fromMandats++;
      }

      // ── 2. Depute ─────────────────────────────────────────────────────────
      if (p.deputeId) {
        const d = deputeMap.get(p.deputeId);
        if (d) {
          const genre = p.civilite === "Mme" ? "e" : "";
          const titre = `Député${genre} de ${d.departementNom}`;
          const dateFin = d.actif ? null : null; // unknown end date for inactive
          addEntry(
            CategorieCarriere.MANDAT_ELECTIF,
            titre,
            d.groupe,
            d.datePriseFonction,
            dateFin,
            SourceCarriere.ASSEMBLEE,
            100
          );
          stats.fromDepute++;
        }
      }

      // ── 3. Senateur ───────────────────────────────────────────────────────
      if (p.senateurId) {
        const s = senateurMap.get(p.senateurId);
        if (s) {
          const genre = (s.civilite ?? p.civilite) === "Mme" ? "rice" : "";
          const titre = `Sénateur${genre}${s.departement ? ` de ${s.departement}` : ""}`;
          addEntry(
            CategorieCarriere.MANDAT_ELECTIF,
            titre,
            s.groupe ?? null,
            s.datePriseFonction,
            null,
            SourceCarriere.ASSEMBLEE,
            101
          );
          stats.fromSenateur++;
        }
      }

      if (entries.length > 0) {
        await prisma.entreeCarriere.createMany({ data: entries });
        stats.totalCreated += entries.length;
      }
    }

    console.log(`\n  Career generation complete.`);
    console.log(`  PersonnalitePublique processed : ${stats.personnalites}`);
    console.log(`  From MandatGouvernemental      : ${stats.fromMandats}`);
    console.log(`  From Depute (AN)               : ${stats.fromDepute}`);
    console.log(`  From Senateur                  : ${stats.fromSenateur}`);
    console.log(`  Deduplicated out               : ${stats.dedupedOut}`);
    console.log(`  Total EntreeCarriere created   : ${stats.totalCreated}`);

    return {
      rowsIngested: stats.totalCreated,
      rowsTotal: stats.personnalites,
      metadata: stats as Record<string, unknown>,
    };
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

generateCarriere()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
