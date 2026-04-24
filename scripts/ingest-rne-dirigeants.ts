/**
 * Ingest dirigeants (company officers) from recherche-entreprises.api.gouv.fr
 * (SIRENE + RNE open data) for every Lobbyiste row with a siren.
 *
 * Source: https://recherche-entreprises.api.gouv.fr/docs/
 *   - Free, unauthenticated
 *   - 7 req/s soft limit
 *   - Returns dirigeants[] per entity with nom / prenoms / annee_de_naissance / qualite / nationalite
 *
 * Auto-matches each dirigeant to PersonnalitePublique / Depute / Senateur via
 * normalizeName() on (nom, prenom). Writes LobbyisteDirigeant rows with
 * soft-FK personnaliteId when a unique match is found.
 *
 * Flags:
 *   --limit N        Cap to first N Lobbyiste rows (pilot mode)
 *   --siren A B ...  Only process these exact SIRENs (overrides --limit)
 *   --verbose        Log every API response
 *
 * Idempotent: re-running updates existing LobbyisteDirigeant rows on the
 * composite unique (lobbyisteId, nomNormalise, prenomNormalise, fonction).
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { normalizeName, normalizedKey } from "../src/lib/normalize-name";
import { logIngestion } from "./lib/ingestion-log";

const API_BASE = "https://recherche-entreprises.api.gouv.fr";
const CONCURRENCY = 1; // serial — fetch bans IPs that spike rapidly
const INTER_REQ_MS = 500; // pace between requests globally
const RETRY_429_MS = 5_000; // exponential backoff base
const MAX_RETRIES = 5;

interface ApiDirigeant {
  nom?: string;
  prenoms?: string;
  annee_de_naissance?: string | null;
  date_de_naissance?: string | null;
  qualite?: string | null;
  nationalite?: string | null;
  type_dirigeant?: "personne physique" | "personne morale";
  siren?: string;
  denomination?: string;
}

interface ApiResult {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  dirigeants?: ApiDirigeant[];
  date_creation?: string;
}

interface ApiResponse {
  results?: ApiResult[];
  total_results?: number;
}

interface LookupMaps {
  personnalites: Map<string, string>; // nomNormalise|prenomNormalise -> id
  personnaliteAmbiguous: Set<string>;
  deputes: Map<string, string>;
  deputeAmbiguous: Set<string>;
  senateurs: Map<string, string>;
  senateurAmbiguous: Set<string>;
}

interface Stats {
  lobbyProcessed: number;
  lobbySkipped: number;
  dirigeantsUpserted: number;
  dirigeantsMatched: number;
  dirigeantsSkippedPersonneMorale: number;
  apiErrors: number;
}

async function buildLookupMaps(): Promise<LookupMaps> {
  const personnalites = new Map<string, string>();
  const personnaliteAmbiguous = new Set<string>();
  const deputes = new Map<string, string>();
  const deputeAmbiguous = new Set<string>();
  const senateurs = new Map<string, string>();
  const senateurAmbiguous = new Set<string>();

  const ppRows = await prisma.personnalitePublique.findMany({
    select: { id: true, nomNormalise: true, prenomNormalise: true },
  });
  for (const r of ppRows) {
    if (!r.nomNormalise || !r.prenomNormalise) continue;
    const key = `${r.nomNormalise}|${r.prenomNormalise}`;
    if (personnalites.has(key)) personnaliteAmbiguous.add(key);
    else personnalites.set(key, r.id);
  }

  const depRows = await prisma.depute.findMany({
    where: { actif: true },
    select: { id: true, nomNormalise: true, prenomNormalise: true },
  });
  for (const r of depRows) {
    if (!r.nomNormalise || !r.prenomNormalise) continue;
    const key = `${r.nomNormalise}|${r.prenomNormalise}`;
    if (deputes.has(key)) deputeAmbiguous.add(key);
    else deputes.set(key, r.id);
  }

  const senRows = await prisma.senateur.findMany({
    where: { actif: true },
    select: { id: true, nomNormalise: true, prenomNormalise: true },
  });
  for (const r of senRows) {
    if (!r.nomNormalise || !r.prenomNormalise) continue;
    const key = `${r.nomNormalise}|${r.prenomNormalise}`;
    if (senateurs.has(key)) senateurAmbiguous.add(key);
    else senateurs.set(key, r.id);
  }

  return { personnalites, personnaliteAmbiguous, deputes, deputeAmbiguous, senateurs, senateurAmbiguous };
}

async function fetchApi(url: string, attempt = 1): Promise<ApiResponse | null> {
  await paceRequest();
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const wait = RETRY_429_MS * attempt;
      console.warn(`  429 on ${url} — retrying in ${wait}ms (${attempt}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, wait));
      return fetchApi(url, attempt + 1);
    }
    if (!res.ok) {
      console.warn(`  API ${res.status} on ${url}`);
      return null;
    }
    return (await res.json()) as ApiResponse;
  } catch (e) {
    if (attempt <= MAX_RETRIES) {
      const wait = RETRY_429_MS * attempt;
      console.warn(`  fetch failed ${url} — retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      return fetchApi(url, attempt + 1);
    }
    console.warn(`  fetch failed ${url}: ${String(e)}`);
    return null;
  }
}

async function resolveBySiren(siren: string): Promise<ApiResult | null> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(siren)}&per_page=1`;
  const data = await fetchApi(url);
  const first = data?.results?.[0];
  if (first && first.siren === siren) return first;
  return null;
}

async function resolveByName(nom: string): Promise<ApiResult | null> {
  const cleaned = nom.replace(/[^\p{L}\p{N}\s&'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  const url = `${API_BASE}/search?q=${encodeURIComponent(cleaned)}&per_page=1`;
  const data = await fetchApi(url);
  return data?.results?.[0] ?? null;
}

function parseYear(dirig: ApiDirigeant): number | null {
  if (dirig.annee_de_naissance) {
    const n = parseInt(dirig.annee_de_naissance, 10);
    if (Number.isFinite(n) && n >= 1900 && n <= new Date().getFullYear()) return n;
  }
  if (dirig.date_de_naissance) {
    const m = dirig.date_de_naissance.match(/^(\d{4})/);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (Number.isFinite(n) && n >= 1900) return n;
    }
  }
  return null;
}

function matchPersonnalite(
  nomNorm: string,
  prenomNorm: string,
  maps: LookupMaps,
): string | null {
  if (!nomNorm || !prenomNorm) return null;
  const key = normalizedKey(prenomNorm, nomNorm);
  if (maps.personnaliteAmbiguous.has(key)) return null;
  return maps.personnalites.get(key) ?? null;
}

function splitPrenoms(prenoms: string): string[] {
  // API format: "JEAN LUC" or "JEAN-LUC" or "JEAN LUC OLIVIER"
  // Take the first compound-hyphenated token for normalization.
  return prenoms
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function processLobby(
  lobby: { id: string; nom: string; siren: string | null },
  maps: LookupMaps,
  stats: Stats,
  verbose: boolean,
): Promise<void> {
  let apiResult: ApiResult | null = null;

  if (lobby.siren) {
    apiResult = await resolveBySiren(lobby.siren);
  }
  if (!apiResult) {
    // Fallback: name search (handles HATVP-only IDs like PLEAD / H771956256)
    apiResult = await resolveByName(lobby.nom);
  }

  if (!apiResult) {
    stats.lobbySkipped++;
    if (verbose) console.log(`  [skip] ${lobby.nom} — no API match`);
    return;
  }

  const sourceUrl = `${API_BASE}/search?q=${apiResult.siren}`;
  const sourceDate = new Date();
  const dirigeants = apiResult.dirigeants ?? [];

  if (verbose) {
    console.log(`  ${lobby.nom} (${apiResult.siren}) — ${dirigeants.length} dirigeants`);
  }

  for (const d of dirigeants) {
    if (d.type_dirigeant === "personne morale") {
      // Legal-person dirigeants (e.g. commissaires aux comptes) — skip in v1
      stats.dirigeantsSkippedPersonneMorale++;
      continue;
    }
    const nom = (d.nom ?? "").trim();
    if (nom.length < 2) continue;
    const prenomsRaw = (d.prenoms ?? "").trim();
    const prenomFirst = splitPrenoms(prenomsRaw)[0] ?? null;

    const nomNormalise = normalizeName(nom);
    const prenomNormalise = prenomFirst ? normalizeName(prenomFirst) : null;

    const fonction = (d.qualite ?? "").trim() || null;
    const dateNaissanceAnnee = parseYear(d);
    const nationalite = (d.nationalite ?? "").trim() || null;

    const personnaliteId =
      prenomNormalise != null
        ? matchPersonnalite(nomNormalise, prenomNormalise, maps)
        : null;
    if (personnaliteId) stats.dirigeantsMatched++;

    await prisma.lobbyisteDirigeant.upsert({
      where: {
        lobbyisteId_nomNormalise_prenomNormalise_fonction: {
          lobbyisteId: lobby.id,
          nomNormalise,
          prenomNormalise: prenomNormalise ?? "",
          fonction: fonction ?? "",
        },
      },
      create: {
        lobbyisteId: lobby.id,
        nom,
        prenom: prenomsRaw || null,
        nomNormalise,
        prenomNormalise,
        fonction,
        dateNaissanceAnnee,
        nationalite,
        source: "RECHERCHE_ENTREPRISES",
        sourceUrl,
        sourceDate,
        personnaliteId,
        verifie: true,
      },
      update: {
        nom,
        prenom: prenomsRaw || null,
        dateNaissanceAnnee,
        nationalite,
        source: "RECHERCHE_ENTREPRISES",
        sourceUrl,
        sourceDate,
        personnaliteId,
        verifie: true,
      },
    });
    stats.dirigeantsUpserted++;
  }

  stats.lobbyProcessed++;
}

async function runInBatches<T>(items: T[], fn: (item: T) => Promise<void>, size: number) {
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const start = Date.now();
    await Promise.all(batch.map(fn));
    const minElapsed = size * INTER_REQ_MS;
    const elapsed = Date.now() - start;
    if (elapsed < minElapsed) {
      await new Promise((r) => setTimeout(r, minElapsed - elapsed));
    }
  }
}

let lastRequestAt = 0;
async function paceRequest(): Promise<void> {
  const now = Date.now();
  const delta = now - lastRequestAt;
  if (delta < INTER_REQ_MS) {
    await new Promise((r) => setTimeout(r, INTER_REQ_MS - delta));
  }
  lastRequestAt = Date.now();
}

function parseArgs(): { limit: number | null; sirens: string[] | null; verbose: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let sirens: string[] | null = null;
  let verbose = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--limit") {
      const n = parseInt(args[++i] ?? "", 10);
      if (Number.isFinite(n)) limit = n;
    } else if (a === "--siren") {
      sirens = [];
      while (i + 1 < args.length && !args[i + 1]!.startsWith("--")) {
        sirens.push(args[++i]!);
      }
    } else if (a === "--verbose") {
      verbose = true;
    }
  }
  return { limit, sirens, verbose };
}

export async function ingestRneDirigeants(opts: {
  limit?: number | null;
  sirens?: string[] | null;
  verbose?: boolean;
} = {}) {
  await logIngestion("rne-dirigeants", async () => {
    const { limit = null, sirens = null, verbose = false } = opts;

    console.log("  Building PersonnalitePublique + Depute + Senateur lookup maps...");
    const maps = await buildLookupMaps();
    console.log(
      `  Loaded ${maps.personnalites.size} PP (ambig ${maps.personnaliteAmbiguous.size}), ` +
        `${maps.deputes.size} députés (ambig ${maps.deputeAmbiguous.size}), ` +
        `${maps.senateurs.size} sénateurs (ambig ${maps.senateurAmbiguous.size})`,
    );

    const where = sirens
      ? { OR: [{ siren: { in: sirens } }, { id: { in: sirens } }] }
      : { OR: [{ siren: { not: null } }, { type: "HATVP" }] };

    const lobbies = await prisma.lobbyiste.findMany({
      where,
      select: { id: true, nom: true, siren: true },
      orderBy: { nom: "asc" },
      take: limit ?? undefined,
    });
    console.log(`  Processing ${lobbies.length} lobbyiste rows`);

    const stats: Stats = {
      lobbyProcessed: 0,
      lobbySkipped: 0,
      dirigeantsUpserted: 0,
      dirigeantsMatched: 0,
      dirigeantsSkippedPersonneMorale: 0,
      apiErrors: 0,
    };

    await runInBatches(
      lobbies,
      async (lobby) => {
        try {
          await processLobby(lobby, maps, stats, verbose);
        } catch (e) {
          stats.apiErrors++;
          console.warn(`  [error] ${lobby.nom}: ${String(e)}`);
        }
      },
      CONCURRENCY,
    );

    console.log(
      `  Done: ${stats.lobbyProcessed} lobbies, ${stats.lobbyProcessed - stats.lobbySkipped} with dirigeants, ` +
        `${stats.dirigeantsUpserted} dirigeants upserted, ${stats.dirigeantsMatched} matched to PersonnalitePublique, ` +
        `${stats.dirigeantsSkippedPersonneMorale} personne-morale skipped, ${stats.apiErrors} errors`,
    );

    return {
      rowsIngested: stats.dirigeantsUpserted,
      rowsTotal: lobbies.length,
      metadata: stats as unknown as Record<string, unknown>,
    };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { limit, sirens, verbose } = parseArgs();
  ingestRneDirigeants({ limit, sirens, verbose })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
