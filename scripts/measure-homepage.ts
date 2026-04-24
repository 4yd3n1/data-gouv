/* eslint-disable no-console */
import { prisma } from "@/lib/db";
import { normalizeLobbyisteName, matchLobbyOrg } from "@/lib/lobby-overview";

async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t = Date.now();
  const v = await fn();
  console.log(`  ${String(Date.now() - t).padStart(6, " ")}ms  ${label}`);
  return v;
}

async function collectConflicts() {
  return prisma.conflictSignal.findMany({
    where: { voteCount: { gt: 0 } },
    orderBy: [{ participationCount: "desc" }, { voteCount: "desc" }],
  });
}

async function collectRevolvingDoors() {
  return prisma.personnalitePublique.findMany({
    where: {
      mandats: { some: { dateFin: null } },
      carriere: { some: { categorie: "CARRIERE_PRIVEE" } },
    },
    select: {
      slug: true,
      nom: true,
      prenom: true,
      mandats: {
        where: { dateFin: null },
        select: { titreCourt: true, portefeuille: true, ministereCode: true },
        take: 1,
      },
      carriere: {
        where: { categorie: "CARRIERE_PRIVEE" },
        select: { organisation: true, titre: true },
      },
    },
  });
}

async function collectLobbyConcentration() {
  const topMinistries = await prisma.actionLobby.groupBy({
    by: ["ministereCode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });
  for (const tm of topMinistries) {
    await Promise.all([
      prisma.mandatGouvernemental.findFirst({
        where: { ministereCode: tm.ministereCode, dateFin: null },
        include: {
          personnalite: { select: { nom: true, prenom: true, slug: true } },
        },
      }),
      prisma.actionLobby.groupBy({
        by: ["representantNom"],
        where: { ministereCode: tm.ministereCode },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),
    ]);
  }
}

async function collectMediaNexus() {
  return prisma.mediaProprietaire.findMany({
    where: { contextePolitique: { not: null } },
    select: {
      nom: true,
      prenom: true,
      contextePolitique: true,
      personnaliteId: true,
      personnalite: { select: { slug: true } },
      participations: { select: { groupe: { select: { nomCourt: true } } } },
    },
  });
}

async function collectDeclarationGaps() {
  const currentMandats = await prisma.mandatGouvernemental.findMany({
    where: { dateFin: null, ministereCode: { not: null } },
    select: {
      ministereCode: true,
      titreCourt: true,
      personnalite: {
        select: {
          nom: true,
          prenom: true,
          slug: true,
          _count: { select: { interets: true } },
        },
      },
    },
  });
  for (const m of currentMandats) {
    if (!m.ministereCode) continue;
    await prisma.actionLobby.count({
      where: { ministereCode: m.ministereCode },
    });
  }
}

async function collectPartyDiscipline() {
  const finalScrutins = await prisma.scrutinLoi.findMany({
    where: { role: "VOTE_FINAL" },
    select: { scrutinId: true },
  });
  const finalIds = finalScrutins.map((s) => s.scrutinId);
  const [gv, votes] = await Promise.all([
    prisma.groupeVote.findMany({
      where: { scrutinId: { in: finalIds } },
      select: {
        scrutinId: true,
        organeRef: true,
        positionMajoritaire: true,
      },
    }),
    prisma.voteRecord.findMany({
      where: {
        scrutinId: { in: finalIds },
        groupeOrganeRef: { not: null },
        position: { not: "nonVotant" },
      },
      select: {
        scrutinId: true,
        deputeId: true,
        position: true,
        groupeOrganeRef: true,
        depute: {
          select: {
            nom: true,
            prenom: true,
            groupe: true,
            groupeAbrev: true,
          },
        },
      },
    }),
  ]);
  return { gv: gv.length, votes: votes.length };
}

async function collectLobbyOwnerLinks() {
  const lobbies = await prisma.lobbyiste.findMany({
    select: { id: true, nom: true },
  });
  const agoraRows = await prisma.actionLobby.groupBy({
    by: ["representantNom", "ministereCode"],
    where: { representantNom: { in: lobbies.map((l) => l.nom) } },
    _count: { id: true },
  });
  const pps = await prisma.personnalitePublique.findMany({
    select: {
      slug: true,
      nom: true,
      prenom: true,
      mandats: {
        where: { dateFin: null },
        select: { titreCourt: true, portefeuille: true, ministereCode: true },
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
            in: ["ACTIVITE_ANTERIEURE", "ACTIVITE_CONJOINT", "PARTICIPATION"],
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
  });
  const structural = await prisma.lobbyisteDirigeant.findMany({
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
  });

  // --- NEW optimized inner loop (mirrors the fix in src/lib/signals.ts) ---
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lobbyCompiled = lobbies
    .map((l) => {
      const core = normalizeLobbyisteName(l.nom).toUpperCase();
      return { id: l.id, nom: l.nom, core, reLobby: new RegExp(`\\b${escapeRe(core)}\\b`) };
    })
    .filter((l) => l.core.length >= 4);

  let matches = 0;
  for (const p of pps) {
    const seenLobbyIds = new Set<string>();
    const processOrg = (orgUpper: string) => {
      if (orgUpper.length < 4) return;
      const reOrg = new RegExp(`\\b${escapeRe(orgUpper)}\\b`);
      for (const lobby of lobbyCompiled) {
        if (seenLobbyIds.has(lobby.id)) continue;
        if (
          orgUpper.indexOf(lobby.core) === -1 &&
          lobby.core.indexOf(orgUpper) === -1
        )
          continue;
        if (lobby.reLobby.test(orgUpper) || reOrg.test(lobby.core)) {
          matches++;
          seenLobbyIds.add(lobby.id);
        }
      }
    };
    for (const c of p.carriere) processOrg((c.organisation ?? "").toUpperCase());
    for (const i of p.interets) processOrg((i.organisation ?? "").toUpperCase());
  }

  return {
    lobbies: lobbies.length,
    pps: pps.length,
    agoraRows: agoraRows.length,
    structural: structural.length,
    matches,
  };
}

async function main() {
  console.log("=== row counts ===");
  const [vrCount, alCount, ppCount, lobCount, decCount] = await Promise.all([
    prisma.voteRecord.count(),
    prisma.actionLobby.count(),
    prisma.personnalitePublique.count(),
    prisma.lobbyiste.count(),
    prisma.declarationInteret.count(),
  ]);
  console.log(`  VoteRecord:           ${vrCount.toLocaleString()}`);
  console.log(`  ActionLobby:          ${alCount.toLocaleString()}`);
  console.log(`  PersonnalitePublique: ${ppCount.toLocaleString()}`);
  console.log(`  Lobbyiste:            ${lobCount.toLocaleString()}`);
  console.log(`  DeclarationInteret:   ${decCount.toLocaleString()}`);

  console.log("\n=== cold, serial (to isolate each) ===");
  await time("collectConflicts()            ", collectConflicts);
  await time("collectRevolvingDoors()       ", collectRevolvingDoors);
  await time("collectLobbyConcentration()   ", collectLobbyConcentration);
  await time("collectMediaNexus()           ", collectMediaNexus);
  await time("collectDeclarationGaps()      ", collectDeclarationGaps);
  const pd = await time(
    "collectPartyDiscipline()      ",
    collectPartyDiscipline,
  );
  console.log(`        → ${pd.votes.toLocaleString()} votes, ${pd.gv.toLocaleString()} groupe votes`);
  const lo = await time("collectLobbyOwnerLinks()      ", collectLobbyOwnerLinks);
  console.log(
    `        → ${lo.lobbies} lobbies · ${lo.pps} pps · ${lo.agoraRows} agora groups · ${lo.structural} structural · ${lo.matches} matches`,
  );

  console.log("\n=== cold, parallel (as in prod) ===");
  const t0 = Date.now();
  await Promise.all([
    collectConflicts(),
    collectRevolvingDoors(),
    collectLobbyConcentration(),
    collectMediaNexus(),
    collectDeclarationGaps(),
    collectPartyDiscipline(),
    collectLobbyOwnerLinks(),
  ]);
  console.log(`  TOTAL (all 7 parallel): ${Date.now() - t0}ms`);

  console.log("\n=== warm, parallel ===");
  const t1 = Date.now();
  await Promise.all([
    collectConflicts(),
    collectRevolvingDoors(),
    collectLobbyConcentration(),
    collectMediaNexus(),
    collectDeclarationGaps(),
    collectPartyDiscipline(),
    collectLobbyOwnerLinks(),
  ]);
  console.log(`  TOTAL (all 7 parallel, warm): ${Date.now() - t1}ms`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
