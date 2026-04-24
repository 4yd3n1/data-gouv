/* eslint-disable no-console */
import { prisma } from "@/lib/db";
import { normalizeLobbyisteName, matchLobbyOrg } from "@/lib/lobby-overview";

async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t = Date.now();
  const v = await fn();
  console.log(`  ${String(Date.now() - t).padStart(6, " ")}ms  ${label}`);
  return v;
}

async function main() {
  console.log("=== collectLobbyOwnerLinks — per-step cold ===");
  const lobbies = await time("1. Lobbyiste.findMany (all)", () =>
    prisma.lobbyiste.findMany({ select: { id: true, nom: true } }),
  );

  const agoraRows = await time(
    "2. ActionLobby.groupBy by [rep,min] WHERE rep IN (all lobbies)",
    () =>
      prisma.actionLobby.groupBy({
        by: ["representantNom", "ministereCode"],
        where: { representantNom: { in: lobbies.map((l) => l.nom) } },
        _count: { id: true },
      }),
  );

  const structural = await time(
    "3. LobbyisteDirigeant (with lobbyiste+personnalite)",
    () =>
      prisma.lobbyisteDirigeant.findMany({
        where: { personnaliteId: { not: null } },
        include: {
          lobbyiste: { select: { id: true, nom: true } },
          personnalite: {
            select: {
              slug: true,
              nom: true,
              prenom: true,
              mandats: {
                where: { dateFin: null },
                select: { titreCourt: true },
                take: 1,
              },
            },
          },
        },
      }),
  );

  const pps = await time("4. PersonnalitePublique.findMany(carriere+interets)", () =>
    prisma.personnalitePublique.findMany({
      select: {
        slug: true,
        nom: true,
        prenom: true,
        mandats: {
          where: { dateFin: null },
          select: {
            titreCourt: true,
            portefeuille: true,
            ministereCode: true,
          },
          take: 1,
        },
        carriere: {
          where: {
            categorie: { in: ["CARRIERE_PRIVEE", "ORGANISME"] },
            organisation: { not: null },
          },
          select: {
            organisation: true,
            titre: true,
            dateDebut: true,
            dateFin: true,
          },
        },
        interets: {
          where: {
            rubrique: {
              in: [
                "ACTIVITE_ANTERIEURE",
                "ACTIVITE_CONJOINT",
                "PARTICIPATION",
              ],
            },
            organisation: { not: null },
          },
          select: {
            rubrique: true,
            contenu: true,
            organisation: true,
            montant: true,
          },
        },
      },
    }),
  );

  await time("5. CPU-bound regex nested match loop", async () => {
    const lobbyCores = lobbies
      .map((l) => ({
        id: l.id,
        nom: l.nom,
        core: normalizeLobbyisteName(l.nom).toUpperCase(),
      }))
      .filter((l) => l.core.length >= 4);
    let matches = 0;
    let carriereItems = 0;
    let interetsItems = 0;
    for (const p of pps) {
      for (const c of p.carriere) {
        carriereItems++;
        const orgUpper = (c.organisation ?? "").toUpperCase();
        if (orgUpper.length < 4) continue;
        for (const lobby of lobbyCores) {
          if (matchLobbyOrg(lobby.core, orgUpper)) matches++;
        }
      }
      for (const i of p.interets) {
        interetsItems++;
        const orgUpper = (i.organisation ?? "").toUpperCase();
        if (orgUpper.length < 4) continue;
        for (const lobby of lobbyCores) {
          if (matchLobbyOrg(lobby.core, orgUpper)) matches++;
        }
      }
    }
    console.log(
      `      ${lobbyCores.length} lobbies · ${pps.length} pps · ${carriereItems} carriere · ${interetsItems} interets → ${matches} matches`,
    );
  });

  console.log(
    `\n  returned rows summary: lobbies=${lobbies.length} agoraGroups=${agoraRows.length} structural=${structural.length} pps=${pps.length}`,
  );

  console.log("\n=== alternative approaches ===");
  // Alt A: count matching rows only (no groupBy by pair)
  await time(
    "A. ActionLobby.groupBy by [representantNom] only WHERE in lobbies",
    () =>
      prisma.actionLobby.groupBy({
        by: ["representantNom"],
        where: { representantNom: { in: lobbies.map((l) => l.nom) } },
        _count: { id: true },
      }),
  );

  // Alt B: raw SQL with one roundtrip
  await time("B. Raw SQL: one groupBy with no IN filter", () =>
    prisma.$queryRaw`
      SELECT "representantNom", "ministereCode", COUNT(*)::bigint AS c
      FROM "ActionLobby"
      GROUP BY "representantNom", "ministereCode"
    `,
  );

  // Alt C: raw SQL count per rep, no pair
  await time("C. Raw SQL: COUNT per representantNom only", () =>
    prisma.$queryRaw`
      SELECT "representantNom", COUNT(*)::bigint AS c
      FROM "ActionLobby"
      GROUP BY "representantNom"
    `,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
