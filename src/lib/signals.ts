import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { fmt, fmtEuro, fmtPct } from "@/lib/format";
import {
  matchRevolvingDoor,
  conflictSeverity,
  lobbySeverity,
  gapSeverity,
  disciplineSeverity,
  lobbyOwnerLinkSeverity,
  SEVERITY_ORDER,
  type SignalSeverity,
} from "@/lib/signal-types";
import { normalizeLobbyisteName, matchLobbyOrg } from "@/lib/lobby-overview";

/* ------------------------------------------------------------------ */
/*  Unified signal types                                               */
/* ------------------------------------------------------------------ */

export type SignalType =
  | "conflit"
  | "porte"
  | "lobby"
  | "lobby-owner"
  | "media"
  | "ecart"
  | "dissidence";

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  conflit: "Conflits",
  porte: "Portes tournantes",
  lobby: "Lobbying",
  "lobby-owner": "Liens lobby",
  media: "Nexus médias",
  ecart: "Écarts HATVP",
  dissidence: "Dissidences",
};

export const SIGNAL_TYPE_DESCRIPTIONS: Record<SignalType, string> = {
  conflit:
    "Déclarations HATVP mentionnant des participations dans des secteurs sur lesquels la personne vote.",
  porte:
    "Carrière privée recoupant le portefeuille occupé actuellement — ancien employeur, ancien administrateur.",
  lobby:
    "Ministère figurant parmi les cibles les plus fréquentes des représentants d'intérêts enregistrés à l'HATVP.",
  "lobby-owner":
    "Personnalité publique liée à un lobby : dirigeant actuel ou ancien, ou ayant mentionné cette organisation dans sa déclaration HATVP.",
  media:
    "Propriétaire de médias dont les liens politiques sont documentés par des sources publiques.",
  ecart:
    "Activité de lobby intense ciblant ce ministère sans déclaration d'intérêts correspondante sur le registre HATVP.",
  dissidence:
    "Vote contre la position majoritaire du groupe politique sur les scrutins finaux — indicateur de rupture de discipline.",
};

export interface UnifiedSignalNarrative {
  type: SignalType;
  headline: string;
  detail?: string;
  /** Extra tags / sectors / keywords rendered as chips under the headline. */
  chips?: string[];
}

export type UnifiedEntityType = "depute" | "ministre" | "mediaOwner";

export interface UnifiedSignal {
  /** Stable dedup key: `${entityType}:${id}`. */
  personKey: string;
  entityType: UnifiedEntityType;
  /** Profile href. */
  href: string;
  nom: string;
  prenom: string;
  /** e.g. "Député", "Ministre de l'Économie", "Propriétaire de médias". */
  subtitle: string;
  /** Worst severity across all contributing signals for this person. */
  severity: SignalSeverity;
  /** Which signal types flagged this person. */
  types: SignalType[];
  /** One narrative per signal type, in priority order. */
  narratives: UnifiedSignalNarrative[];
  /** Internal sort key: higher = shown first within a severity bucket. */
  totalExposure: number;
}

/* ------------------------------------------------------------------ */
/*  Severity merging                                                    */
/* ------------------------------------------------------------------ */

function worstSeverity(severities: SignalSeverity[]): SignalSeverity {
  return severities.reduce<SignalSeverity>(
    (worst, s) => (SEVERITY_ORDER[s] < SEVERITY_ORDER[worst] ? s : worst),
    "INFORMATIF",
  );
}

type UpsertInput = {
  personKey: string;
  entityType: UnifiedEntityType;
  href: string;
  nom: string;
  prenom: string;
  subtitle: string;
  type: SignalType;
  severity: SignalSeverity;
  headline: string;
  detail?: string;
  chips?: string[];
  exposure: number;
};

function upsert(map: Map<string, UnifiedSignal>, input: UpsertInput): void {
  const existing = map.get(input.personKey);
  if (existing) {
    if (!existing.types.includes(input.type)) {
      existing.types.push(input.type);
    }
    existing.narratives.push({
      type: input.type,
      headline: input.headline,
      detail: input.detail,
      chips: input.chips,
    });
    existing.severity = worstSeverity([existing.severity, input.severity]);
    existing.totalExposure += input.exposure;
    return;
  }
  map.set(input.personKey, {
    personKey: input.personKey,
    entityType: input.entityType,
    href: input.href,
    nom: input.nom,
    prenom: input.prenom,
    subtitle: input.subtitle,
    severity: input.severity,
    types: [input.type],
    narratives: [
      {
        type: input.type,
        headline: input.headline,
        detail: input.detail,
        chips: input.chips,
      },
    ],
    totalExposure: input.exposure,
  });
}

/* ------------------------------------------------------------------ */
/*  Per-type collectors                                                 */
/* ------------------------------------------------------------------ */

async function collectConflicts(map: Map<string, UnifiedSignal>): Promise<void> {
  const rows = await prisma.conflictSignal.findMany({
    where: { voteCount: { gt: 0 } },
    orderBy: [{ participationCount: "desc" }, { voteCount: "desc" }],
  });

  // Group by deputeId to dedup (person × sector → one person with multiple sectors)
  const byDepute = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!r.deputeId) continue;
    const arr = byDepute.get(r.deputeId) ?? [];
    arr.push(r);
    byDepute.set(r.deputeId, arr);
  }

  for (const [deputeId, deputeRows] of byDepute) {
    const first = deputeRows[0];
    const sectors = [...new Set(deputeRows.map((r) => r.secteurDeclaration))];
    const tags = [...new Set(deputeRows.map((r) => r.tag))];
    const totalMontant = deputeRows.reduce(
      (sum, r) => sum + (r.totalMontant ?? 0),
      0,
    );
    const voteCount = deputeRows.reduce((sum, r) => sum + r.voteCount, 0);
    const participationCount = deputeRows.reduce(
      (sum, r) => sum + r.participationCount,
      0,
    );
    const severity = conflictSeverity(totalMontant, voteCount);

    const headline = `${participationCount} participation${participationCount > 1 ? "s" : ""} déclarée${participationCount > 1 ? "s" : ""}`;
    const detail =
      totalMontant > 0
        ? `${fmtEuro(totalMontant)} · ${fmt(voteCount)} vote${voteCount > 1 ? "s" : ""} sur ces sujets`
        : `${fmt(voteCount)} vote${voteCount > 1 ? "s" : ""} sur ces sujets`;

    upsert(map, {
      personKey: `depute:${deputeId}`,
      entityType: "depute",
      href: `/profils/deputes/${deputeId}?tab=transparence`,
      nom: first.nom,
      prenom: first.prenom,
      subtitle: first.typeMandat,
      type: "conflit",
      severity,
      headline,
      detail,
      chips: sectors.slice(0, 5),
      exposure: totalMontant + voteCount * 1000,
    });
  }
}

async function collectRevolvingDoors(
  map: Map<string, UnifiedSignal>,
): Promise<void> {
  const ministers = await prisma.personnalitePublique.findMany({
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

  for (const m of ministers) {
    const mandat = m.mandats[0];
    if (!mandat?.ministereCode) continue;

    const allKeywords = new Set<string>();
    const careerOrgs = new Set<string>();

    for (const c of m.carriere) {
      if (!c.organisation) continue;
      const kws = matchRevolvingDoor(
        mandat.ministereCode,
        mandat.portefeuille,
        c.organisation,
      );
      for (const kw of kws) allKeywords.add(kw);
      if (kws.length > 0) careerOrgs.add(c.organisation);
    }

    if (allKeywords.size === 0) continue;

    const severity: SignalSeverity = allKeywords.size >= 3 ? "CRITIQUE" : "NOTABLE";
    const orgsList = [...careerOrgs].slice(0, 3).join(", ");
    const headline = `Ancienne carrière privée recoupant ${mandat.titreCourt}`;
    const detail = orgsList ? `Ex-employeurs : ${orgsList}` : undefined;

    upsert(map, {
      personKey: `ministre:${m.slug}`,
      entityType: "ministre",
      href: `/profils/${m.slug}?tab=parcours`,
      nom: m.nom,
      prenom: m.prenom,
      subtitle: mandat.titreCourt,
      type: "porte",
      severity,
      headline,
      detail,
      chips: [...allKeywords].slice(0, 5),
      exposure: allKeywords.size * 10_000,
    });
  }
}

async function collectLobbyConcentration(
  map: Map<string, UnifiedSignal>,
): Promise<void> {
  const topMinistries = await prisma.actionLobby.groupBy({
    by: ["ministereCode"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  for (const tm of topMinistries) {
    const code = tm.ministereCode;
    const count = tm._count.id;
    const severity = lobbySeverity(count);

    const [minister, topOrgs] = await Promise.all([
      prisma.mandatGouvernemental.findFirst({
        where: { ministereCode: code, dateFin: null },
        include: {
          personnalite: { select: { nom: true, prenom: true, slug: true } },
        },
      }),
      prisma.actionLobby.groupBy({
        by: ["representantNom"],
        where: { ministereCode: code },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),
    ]);

    if (!minister) continue; // Skip ministries without a current minister

    const orgs = topOrgs.map((o) => o.representantNom);
    const headline = `${fmt(count)} déclarations AGORA ciblant ${minister.titreCourt}`;
    const detail =
      orgs.length > 0
        ? `Principaux représentants : ${orgs.slice(0, 2).join(", ")}`
        : undefined;

    upsert(map, {
      personKey: `ministre:${minister.personnalite.slug}`,
      entityType: "ministre",
      href: `/profils/${minister.personnalite.slug}?tab=mandats`,
      nom: minister.personnalite.nom,
      prenom: minister.personnalite.prenom,
      subtitle: minister.titreCourt,
      type: "lobby",
      severity,
      headline,
      detail,
      chips: orgs.slice(0, 3),
      exposure: count,
    });
  }
}

async function collectMediaNexus(map: Map<string, UnifiedSignal>): Promise<void> {
  const owners = await prisma.mediaProprietaire.findMany({
    where: { contextePolitique: { not: null } },
    select: {
      nom: true,
      prenom: true,
      contextePolitique: true,
      personnaliteId: true,
      personnalite: { select: { slug: true } },
      participations: {
        select: { groupe: { select: { nomCourt: true } } },
      },
    },
  });

  for (const o of owners) {
    if (!o.contextePolitique) continue;
    const severity: SignalSeverity = o.personnaliteId ? "CRITIQUE" : "NOTABLE";
    const groupes = o.participations.map((p) => p.groupe.nomCourt);
    const truncatedContext =
      o.contextePolitique.length > 180
        ? `${o.contextePolitique.slice(0, 180)}…`
        : o.contextePolitique;

    // If the owner is also a registered public figure, merge into their profile.
    const personKey = o.personnalite?.slug
      ? `ministre:${o.personnalite.slug}`
      : `media:${o.nom}`;
    const entityType: UnifiedEntityType = o.personnalite?.slug
      ? "ministre"
      : "mediaOwner";
    const href = o.personnalite?.slug
      ? `/profils/${o.personnalite.slug}`
      : "/dossiers/medias";

    upsert(map, {
      personKey,
      entityType,
      href,
      nom: o.nom,
      prenom: o.prenom ?? "",
      subtitle: "Propriétaire de médias",
      type: "media",
      severity,
      headline: truncatedContext,
      chips: groupes.slice(0, 5),
      exposure: groupes.length * 100 + (o.personnaliteId ? 1000 : 0),
    });
  }
}

async function collectDeclarationGaps(
  map: Map<string, UnifiedSignal>,
): Promise<void> {
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
    const lobbyCount = await prisma.actionLobby.count({
      where: { ministereCode: m.ministereCode },
    });
    if (lobbyCount === 0) continue;
    const interetCount = m.personnalite._count.interets;
    const ratio = lobbyCount / Math.max(interetCount, 1);
    const severity = gapSeverity(ratio);

    // Only signal if severity isn't INFORMATIF (otherwise ratio is too low to matter)
    if (severity === "INFORMATIF") continue;

    const headline = `${fmt(lobbyCount)} actions lobby contre ${fmt(interetCount)} intérêt${interetCount > 1 ? "s" : ""} déclaré${interetCount > 1 ? "s" : ""}`;
    const detail = `Ratio ${fmt(Math.round(ratio))}:1`;

    upsert(map, {
      personKey: `ministre:${m.personnalite.slug}`,
      entityType: "ministre",
      href: `/profils/${m.personnalite.slug}?tab=declarations`,
      nom: m.personnalite.nom,
      prenom: m.personnalite.prenom,
      subtitle: m.titreCourt,
      type: "ecart",
      severity,
      headline,
      detail,
      exposure: ratio * 100,
    });
  }
}

async function collectPartyDiscipline(
  map: Map<string, UnifiedSignal>,
): Promise<void> {
  const finalScrutins = await prisma.scrutinLoi.findMany({
    where: { role: "VOTE_FINAL" },
    select: { scrutinId: true },
  });
  const finalIds = finalScrutins.map((s) => s.scrutinId);
  if (finalIds.length === 0) return;

  const groupeVotes = await prisma.groupeVote.findMany({
    where: { scrutinId: { in: finalIds } },
    select: { scrutinId: true, organeRef: true, positionMajoritaire: true },
  });
  const gpMap = new Map<string, string>();
  for (const gv of groupeVotes) {
    gpMap.set(`${gv.scrutinId}:${gv.organeRef}`, gv.positionMajoritaire);
  }

  const votes = await prisma.voteRecord.findMany({
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
        select: { nom: true, prenom: true, groupe: true, groupeAbrev: true },
      },
    },
  });

  const deputyMap = new Map<
    string,
    {
      nom: string;
      prenom: string;
      groupe: string;
      groupeAbrev: string;
      total: number;
      dissidences: number;
    }
  >();

  for (const v of votes) {
    if (!v.groupeOrganeRef || !v.depute) continue;
    const groupePos = gpMap.get(`${v.scrutinId}:${v.groupeOrganeRef}`);
    if (!groupePos) continue;

    let entry = deputyMap.get(v.deputeId);
    if (!entry) {
      entry = {
        nom: v.depute.nom,
        prenom: v.depute.prenom,
        groupe: v.depute.groupe,
        groupeAbrev: v.depute.groupeAbrev,
        total: 0,
        dissidences: 0,
      };
      deputyMap.set(v.deputeId, entry);
    }
    entry.total++;
    if (v.position !== groupePos) entry.dissidences++;
  }

  for (const [deputeId, d] of deputyMap) {
    if (d.dissidences === 0 || d.total < 3) continue;
    const rate = d.dissidences / d.total;
    const severity = disciplineSeverity(rate);
    if (severity === "INFORMATIF" && rate < 0.15) continue; // cut long tail

    const headline = `${fmtPct(rate * 100)} de dissidence sur les votes finaux`;
    const detail = `${d.dissidences}/${d.total} votes contre la position du groupe ${d.groupeAbrev}`;

    upsert(map, {
      personKey: `depute:${deputeId}`,
      entityType: "depute",
      href: `/profils/deputes/${deputeId}?tab=activite`,
      nom: d.nom,
      prenom: d.prenom,
      subtitle: `Député · ${d.groupeAbrev}`,
      type: "dissidence",
      severity,
      headline,
      detail,
      exposure: rate * 10_000,
    });
  }
}

async function collectLobbyOwnerLinks(
  map: Map<string, UnifiedSignal>,
): Promise<void> {
  // 1. Preload all lobbies with a non-empty nom. Used for ILIKE search keys.
  const lobbies = await prisma.lobbyiste.findMany({
    select: { id: true, nom: true },
  });

  // Skip lobbies whose name collapses to < 4 chars after suffix strip (too broad)
  const lobbiesFiltered = lobbies
    .map((l) => ({
      id: l.id,
      nom: l.nom,
      searchCore: normalizeLobbyisteName(l.nom),
    }))
    .filter((l) => l.searchCore.length >= 4);

  if (lobbiesFiltered.length === 0) return;

  // 2. Per-lobby AGORA declaration count + top ministry (one query each)
  const agoraStats = new Map<string, { count: number; topMin: string | null }>();

  const nomCoreSet = new Set(lobbiesFiltered.map((l) => l.nom));
  const agoraRows = await prisma.actionLobby.groupBy({
    by: ["representantNom", "ministereCode"],
    where: { representantNom: { in: [...nomCoreSet] } },
    _count: { id: true },
  });
  for (const r of agoraRows) {
    const cur = agoraStats.get(r.representantNom) ?? { count: 0, topMin: null };
    cur.count += r._count.id;
    if (!cur.topMin || (r._count.id > 0 && r.ministereCode)) {
      cur.topMin = r.ministereCode ?? cur.topMin;
    }
    agoraStats.set(r.representantNom, cur);
  }

  // 3. Structural links from LobbyisteDirigeant (Phase 2 data)
  const structuralDirigeants = await prisma.lobbyisteDirigeant.findMany({
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

  for (const d of structuralDirigeants) {
    if (!d.personnalite) continue;
    const stats = agoraStats.get(d.lobbyiste.nom) ?? { count: 0, topMin: null };
    const current = d.dateFin == null;
    const linkKind = current ? "dirigeant_direct" : "ancien_dirigeant";
    const severity = lobbyOwnerLinkSeverity(linkKind, stats.count);

    const mandat = d.personnalite.mandats[0];
    const subtitle = mandat?.titreCourt ?? "Personnalité publique";
    const headline =
      current
        ? `${d.fonction ?? "Dirigeant"} de ${d.lobbyiste.nom}`
        : `Ancien ${d.fonction ?? "dirigeant"} de ${d.lobbyiste.nom}`;
    const detail =
      stats.count > 0
        ? `${fmt(stats.count)} déclarations AGORA du lobby`
        : undefined;

    upsert(map, {
      personKey: `ministre:${d.personnalite.slug}`,
      entityType: "ministre",
      href: `/profils/${d.personnalite.slug}?tab=mandats`,
      nom: d.personnalite.nom,
      prenom: d.personnalite.prenom,
      subtitle,
      type: "lobby-owner",
      severity,
      headline,
      detail,
      chips: stats.topMin ? [stats.topMin] : undefined,
      exposure: (current ? 10_000 : 2_000) + stats.count,
    });
  }

  // 4. Freetext links from EntreeCarriere.organisation — "former lobby exec now in government"
  // We look for ministers (PersonnalitePublique) whose private-sector career
  // entries contain a lobby core-name as a substring.
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
        select: { organisation: true, titre: true, dateDebut: true, dateFin: true },
      },
      interets: {
        where: {
          rubrique: { in: ["ACTIVITE_ANTERIEURE", "ACTIVITE_CONJOINT", "PARTICIPATION"] },
          organisation: { not: null },
        },
        select: { rubrique: true, contenu: true, organisation: true, montant: true },
      },
    },
  });

  // Pre-compile per-lobby regexes ONCE (previously built inside the hot loop,
  // causing ~12M RegExp compilations per request). Also cache the upper-cased
  // core and its first two tokens for the `indexOf` prefilter.
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lobbyCompiled = lobbiesFiltered.map((l) => {
    const core = l.searchCore.toUpperCase();
    return {
      id: l.id,
      nom: l.nom,
      core,
      reLobby: new RegExp(`\\b${escapeRe(core)}\\b`),
    };
  });

  for (const p of pps) {
    if (!p.carriere.length && !p.interets.length) continue;

    const seenLobbyIds = new Set<string>();

    const checkOrg = (
      orgUpper: string,
      onMatch: (lobby: (typeof lobbyCompiled)[number]) => void,
    ): void => {
      if (orgUpper.length < 4) return;
      // Compile the reverse-direction regex ONCE per org (not once per lobby).
      const reOrg = new RegExp(`\\b${escapeRe(orgUpper)}\\b`);
      for (const lobby of lobbyCompiled) {
        if (seenLobbyIds.has(lobby.id)) continue;
        // Cheap substring prefilter: if neither name is a substring of the
        // other, word-boundary regex can't match either. `indexOf` is ~100×
        // faster than RegExp.test. This skips ~99% of pairs.
        if (
          orgUpper.indexOf(lobby.core) === -1 &&
          lobby.core.indexOf(orgUpper) === -1
        )
          continue;
        if (lobby.reLobby.test(orgUpper) || reOrg.test(lobby.core)) {
          onMatch(lobby);
          seenLobbyIds.add(lobby.id);
        }
      }
    };

    for (const c of p.carriere) {
      const orgUpper = (c.organisation ?? "").toUpperCase();
      checkOrg(orgUpper, (lobby) => {
        const stats = agoraStats.get(lobby.nom) ?? { count: 0, topMin: null };
        const severity = lobbyOwnerLinkSeverity("carriere_prive", stats.count);
        const mandat = p.mandats[0];
        const headline = `${c.titre} — ${c.organisation}`;
        const detail =
          stats.count > 0
            ? `${lobby.nom} a déposé ${fmt(stats.count)} déclarations AGORA`
            : undefined;
        upsert(map, {
          personKey: `ministre:${p.slug}`,
          entityType: "ministre",
          href: `/profils/${p.slug}?tab=mandats`,
          nom: p.nom,
          prenom: p.prenom,
          subtitle: mandat?.titreCourt ?? "Personnalité publique",
          type: "lobby-owner",
          severity,
          headline,
          detail,
          chips: stats.topMin ? [stats.topMin] : undefined,
          exposure: 1_500 + stats.count * 0.5,
        });
      });
    }

    for (const i of p.interets) {
      const orgUpper = (i.organisation ?? "").toUpperCase();
      checkOrg(orgUpper, (lobby) => {
        const stats = agoraStats.get(lobby.nom) ?? { count: 0, topMin: null };
        const severity = lobbyOwnerLinkSeverity("interet_declare", stats.count);
        const mandat = p.mandats[0];
        const rubriqueLabel =
          i.rubrique === "ACTIVITE_CONJOINT"
            ? "Activité du conjoint"
            : i.rubrique === "PARTICIPATION"
              ? "Participation financière"
              : "Activité antérieure";
        const headline = `${rubriqueLabel} : ${i.organisation}`;
        const detail =
          stats.count > 0
            ? `${lobby.nom} — ${fmt(stats.count)} déclarations AGORA`
            : undefined;
        upsert(map, {
          personKey: `ministre:${p.slug}`,
          entityType: "ministre",
          href: `/profils/${p.slug}?tab=declarations`,
          nom: p.nom,
          prenom: p.prenom,
          subtitle: mandat?.titreCourt ?? "Personnalité publique",
          type: "lobby-owner",
          severity,
          headline,
          detail,
          chips: stats.topMin ? [stats.topMin] : undefined,
          exposure: 1_200 + stats.count * 0.3,
        });
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns all signals from all 7 collectors, deduplicated by person and
 * sorted by severity then total exposure.
 *
 * Two-level caching:
 *   - `unstable_cache` (10 min revalidate) shares the result across requests
 *     and users. Signals are a deterministic function of DB state that only
 *     changes when data is re-ingested, so cross-request caching is safe.
 *   - `React.cache` wraps the outer call so multiple callers in the same
 *     request tree (e.g. homepage + ProfileSignalBanner) share one lookup.
 */
const computeSignals = async (): Promise<UnifiedSignal[]> => {
  const map = new Map<string, UnifiedSignal>();

  await Promise.all([
    collectConflicts(map),
    collectRevolvingDoors(map),
    collectLobbyConcentration(map),
    collectLobbyOwnerLinks(map),
    collectMediaNexus(map),
    collectDeclarationGaps(map),
    collectPartyDiscipline(map),
  ]);

  return Array.from(map.values()).sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.totalExposure - a.totalExposure;
  });
};

const cachedComputeSignals = unstable_cache(
  computeSignals,
  ["unified-signals-v1"],
  { revalidate: 600, tags: ["signals"] },
);

export const getSignals = cache(
  async (): Promise<UnifiedSignal[]> => cachedComputeSignals(),
);

/**
 * Counts by type and severity for the filter bar and live metrics.
 */
export function summarizeSignals(signals: UnifiedSignal[]): {
  total: number;
  bySeverity: Record<SignalSeverity, number>;
  byType: Record<SignalType, number>;
} {
  const bySeverity: Record<SignalSeverity, number> = {
    CRITIQUE: 0,
    NOTABLE: 0,
    INFORMATIF: 0,
  };
  const byType: Record<SignalType, number> = {
    conflit: 0,
    porte: 0,
    lobby: 0,
    "lobby-owner": 0,
    media: 0,
    ecart: 0,
    dissidence: 0,
  };
  for (const s of signals) {
    bySeverity[s.severity]++;
    for (const t of s.types) byType[t]++;
  }
  return { total: signals.length, bySeverity, byType };
}
