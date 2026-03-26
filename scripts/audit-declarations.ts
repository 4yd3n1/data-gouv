/**
 * Audit HATVP financial declarations: XML source vs DB vs display logic.
 * Read-only — never modifies data.
 *
 * Usage:
 *   npx tsx scripts/audit-declarations.ts [--download] [--verbose] [--limit=N]
 */

import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, statSync, createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import {
  splitDeclarations,
  parseDeclaration,
  type ParsedDeclaration,
} from "./lib/hatvp-parser";

// ─── ANSI Colors ───

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ─── CLI Args ───

const args = process.argv.slice(2);
const doDownload = args.includes("--download");
const verbose = args.includes("--verbose");
const limitArg = args.find((a) => a.startsWith("--limit="));
const sampleLimit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;

// ─── Paths ───

const DECLARATIONS_URL = "https://hatvp.fr/livraison/merge/declarations.xml";
const LOCAL_CACHE_PATH = join(
  process.cwd(),
  "documentation",
  "hatvp-old-context",
  "declarations.xml"
);
const DOWNLOAD_PATH = join(tmpdir(), "hatvp-declarations.xml");

// ─── Types ───

interface FieldMismatch {
  field: string;
  expected: unknown;
  actual: unknown;
}

interface DeclarationAudit {
  uuid: string;
  nom: string;
  prenom: string;
  typeMandat: string;
  status: "match" | "mismatch" | "missing_in_db" | "extra_in_db";
  mismatches: FieldMismatch[];
}

interface ReachabilityIssue {
  declarationId: string;
  nom: string;
  prenom: string;
  typeMandat: string;
  issue: string;
}

interface TotalDivergence {
  declarationId: string;
  nom: string;
  prenom: string;
  field: string;
  storedValue: number | null;
  recomputedValue: number | null;
  displayValue: number | null;
}

interface CrossSystemIssue {
  personnaliteSlug: string;
  nom: string;
  prenom: string;
  issue: string;
  system1Count: number;
  system2Count: number;
}

interface AuditReport {
  timestamp: string;
  xmlSource: string;
  phaseA: {
    totalXml: number;
    totalDb: number;
    matched: number;
    mismatches: DeclarationAudit[];
    missingInDb: DeclarationAudit[];
    extraInDb: DeclarationAudit[];
  };
  phaseB: {
    sampleSize: number;
    totalDivergences: TotalDivergence[];
    reachabilityIssues: ReachabilityIssue[];
  };
  phaseC: {
    crossRefCount: number;
    issues: CrossSystemIssue[];
  };
}

// ─── Helpers ───

function floatsEqual(a: number | null, b: number | null, tol = 0.01): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < tol;
}

function header(title: string) {
  console.log(`\n${BOLD}${CYAN}${"═".repeat(60)}${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${BOLD}${CYAN}${"═".repeat(60)}${RESET}\n`);
}

function ok(msg: string) {
  console.log(`  ${GREEN}OK${RESET} ${msg}`);
}

function warn(msg: string) {
  console.log(`  ${YELLOW}!!${RESET} ${msg}`);
}

function fail(msg: string) {
  console.log(`  ${RED}FAIL${RESET} ${msg}`);
}

// ─── Download ───

async function downloadFresh(): Promise<string> {
  console.log(`  Downloading ${DECLARATIONS_URL}...`);
  const res = await fetch(DECLARATIONS_URL, {
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Download failed: ${res.status}`);
  }
  const ws = createWriteStream(DOWNLOAD_PATH);
  const reader = res.body.getReader();
  let downloaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    ws.write(value);
    downloaded += value.length;
    if (downloaded % (20 * 1024 * 1024) < value.length) {
      console.log(`    ${(downloaded / 1024 / 1024).toFixed(0)}MB...`);
    }
  }
  ws.end();
  await new Promise((resolve) => ws.on("finish", resolve));
  console.log(`  Downloaded ${(downloaded / 1024 / 1024).toFixed(1)}MB`);
  return DOWNLOAD_PATH;
}

// ─── Phase A: XML vs DB ───

async function phaseA(
  xmlDecls: ParsedDeclaration[]
): Promise<AuditReport["phaseA"]> {
  header("Phase A: Source Verification (XML vs DB)");

  // Load all DB declarations into memory
  console.log("  Loading DB declarations...");
  const dbRecords = await prisma.declarationInteret.findMany({
    where: { typeMandat: { in: ["Député", "Sénateur"] } },
    include: { participations: true, revenus: true },
  });
  console.log(`  DB: ${dbRecords.length} declarations loaded`);

  const dbMap = new Map(dbRecords.map((d) => [d.id, d]));
  const visited = new Set<string>();

  const matched: DeclarationAudit[] = [];
  const mismatches: DeclarationAudit[] = [];
  const missingInDb: DeclarationAudit[] = [];

  for (const xml of xmlDecls) {
    visited.add(xml.uuid);
    const db = dbMap.get(xml.uuid);

    if (!db) {
      missingInDb.push({
        uuid: xml.uuid,
        nom: xml.nom,
        prenom: xml.prenom,
        typeMandat: xml.typeMandat,
        status: "missing_in_db",
        mismatches: [],
      });
      continue;
    }

    const issues: FieldMismatch[] = [];

    // Compare totals
    if (!floatsEqual(xml.totalParticipations, db.totalParticipations)) {
      issues.push({
        field: "totalParticipations",
        expected: xml.totalParticipations,
        actual: db.totalParticipations,
      });
    }
    if (!floatsEqual(xml.totalRevenus, db.totalRevenus)) {
      issues.push({
        field: "totalRevenus",
        expected: xml.totalRevenus,
        actual: db.totalRevenus,
      });
    }

    // Compare participation counts
    if (xml.participations.length !== db.participations.length) {
      issues.push({
        field: "participations.count",
        expected: xml.participations.length,
        actual: db.participations.length,
      });
    }

    // Compare individual participations — positional matching for duplicate names
    const dbPartsRemaining = [...db.participations];
    for (const xp of xml.participations) {
      // Find best match: prefer exact nomSociete + evaluation, then nomSociete only
      const exactIdx = dbPartsRemaining.findIndex(
        (p) =>
          p.nomSociete.trim() === xp.nomSociete.trim() &&
          floatsEqual(xp.evaluation, p.evaluation)
      );
      if (exactIdx !== -1) {
        dbPartsRemaining.splice(exactIdx, 1);
        continue; // perfect match
      }
      const nameIdx = dbPartsRemaining.findIndex(
        (p) => p.nomSociete.trim() === xp.nomSociete.trim()
      );
      if (nameIdx === -1) {
        issues.push({
          field: `participation[${xp.nomSociete.trim().slice(0, 50)}]`,
          expected: "exists",
          actual: "missing",
        });
      } else {
        const dbp = dbPartsRemaining[nameIdx];
        dbPartsRemaining.splice(nameIdx, 1);
        if (!floatsEqual(xp.evaluation, dbp.evaluation)) {
          issues.push({
            field: `participation[${xp.nomSociete.trim().slice(0, 50)}].evaluation`,
            expected: xp.evaluation,
            actual: dbp.evaluation,
          });
        }
      }
    }

    // Compare revenue counts
    if (xml.revenus.length !== db.revenus.length) {
      issues.push({
        field: "revenus.count",
        expected: xml.revenus.length,
        actual: db.revenus.length,
      });
    }

    // Compare individual revenues — greedy matching for duplicate keys
    const dbRevsRemaining = [...db.revenus];
    for (const xr of xml.revenus) {
      const matchKey = (r: typeof db.revenus[number]) =>
        r.type === xr.type &&
        (r.description ?? "") === (xr.description ?? "") &&
        (r.employeur ?? "") === (xr.employeur ?? "") &&
        r.annee === xr.annee;

      // Prefer exact amount match first
      const exactIdx = dbRevsRemaining.findIndex(
        (r) => matchKey(r) && floatsEqual(xr.montant, r.montant)
      );
      if (exactIdx !== -1) {
        dbRevsRemaining.splice(exactIdx, 1);
        continue;
      }
      const keyIdx = dbRevsRemaining.findIndex(matchKey);
      if (keyIdx === -1) {
        issues.push({
          field: `revenu[${xr.type}|${xr.annee}|${(xr.description ?? "").replace(/\s+/g, " ").slice(0, 30)}]`,
          expected: "exists",
          actual: "missing",
        });
      } else {
        const dbr = dbRevsRemaining[keyIdx];
        dbRevsRemaining.splice(keyIdx, 1);
        if (!floatsEqual(xr.montant, dbr.montant)) {
          issues.push({
            field: `revenu[${xr.type}|${xr.annee}].montant`,
            expected: xr.montant,
            actual: dbr.montant,
          });
        }
      }
    }

    const audit: DeclarationAudit = {
      uuid: xml.uuid,
      nom: xml.nom,
      prenom: xml.prenom,
      typeMandat: xml.typeMandat,
      status: issues.length > 0 ? "mismatch" : "match",
      mismatches: issues,
    };

    if (issues.length > 0) {
      mismatches.push(audit);
    } else {
      matched.push(audit);
    }
  }

  // Extra in DB (not in current XML)
  const extraInDb: DeclarationAudit[] = [];
  for (const db of dbRecords) {
    if (!visited.has(db.id)) {
      extraInDb.push({
        uuid: db.id,
        nom: db.nom,
        prenom: db.prenom,
        typeMandat: db.typeMandat,
        status: "extra_in_db",
        mismatches: [],
      });
    }
  }

  // Report
  ok(`${matched.length} declarations match perfectly`);
  if (mismatches.length > 0) {
    fail(`${mismatches.length} declarations have mismatches:`);
    for (const m of mismatches) {
      console.log(
        `    ${RED}${m.prenom} ${m.nom}${RESET} (${m.typeMandat}, ${m.uuid.slice(0, 8)}...)`
      );
      for (const issue of m.mismatches) {
        console.log(
          `      ${DIM}${issue.field}:${RESET} expected=${JSON.stringify(issue.expected)} actual=${JSON.stringify(issue.actual)}`
        );
      }
    }
  } else {
    ok("Zero mismatches between XML source and DB");
  }

  if (missingInDb.length > 0) {
    warn(
      `${missingInDb.length} XML declarations not found in DB (may indicate stale DB)`
    );
    if (verbose) {
      for (const m of missingInDb.slice(0, 10)) {
        console.log(`    ${m.prenom} ${m.nom} (${m.typeMandat})`);
      }
    }
  }

  if (extraInDb.length > 0) {
    warn(
      `${extraInDb.length} DB declarations not in current XML (may indicate stale XML cache)`
    );
    if (verbose) {
      for (const e of extraInDb.slice(0, 10)) {
        console.log(`    ${e.prenom} ${e.nom} (${e.typeMandat})`);
      }
    }
  }

  return {
    totalXml: xmlDecls.length,
    totalDb: dbRecords.length,
    matched: matched.length,
    mismatches,
    missingInDb,
    extraInDb,
  };
}

// ─── Phase B: Display Verification ───

async function phaseB(): Promise<AuditReport["phaseB"]> {
  header("Phase B: Display Verification (DB Internal Consistency)");

  const totalDivergences: TotalDivergence[] = [];
  const reachabilityIssues: ReachabilityIssue[] = [];

  // B1: Top deputies + senators by totalParticipations
  console.log(
    `  Checking top ${sampleLimit} deputies + ${sampleLimit} senators...`
  );

  const topDeclarations = await prisma.declarationInteret.findMany({
    where: {
      typeMandat: { in: ["Député", "Sénateur"] },
      totalParticipations: { not: null },
    },
    orderBy: { totalParticipations: "desc" },
    take: sampleLimit * 2,
    include: { participations: true, revenus: true },
  });

  for (const decl of topDeclarations) {
    // Recompute totalParticipations
    const recomputedPart = decl.participations.reduce(
      (sum, p) => sum + (p.evaluation ?? 0),
      0
    );
    const expectedPart = recomputedPart || null;
    if (!floatsEqual(expectedPart, decl.totalParticipations)) {
      totalDivergences.push({
        declarationId: decl.id,
        nom: decl.nom,
        prenom: decl.prenom,
        field: "totalParticipations",
        storedValue: decl.totalParticipations,
        recomputedValue: expectedPart,
        displayValue: null,
      });
    }

    // Recompute totalRevenus (ingestion grouping: type|desc|emp)
    const revenueGroups = new Map<
      string,
      { annee: number; montant: number }
    >();
    for (const r of decl.revenus) {
      const key = `${r.type}|${r.description}|${r.employeur}`;
      const existing = revenueGroups.get(key);
      if (!existing || (r.annee ?? 0) > existing.annee) {
        revenueGroups.set(key, {
          annee: r.annee ?? 0,
          montant: r.montant ?? 0,
        });
      }
    }
    const recomputedRev =
      Array.from(revenueGroups.values()).reduce(
        (sum, g) => sum + g.montant,
        0
      ) || null;

    if (!floatsEqual(recomputedRev, decl.totalRevenus)) {
      totalDivergences.push({
        declarationId: decl.id,
        nom: decl.nom,
        prenom: decl.prenom,
        field: "totalRevenus",
        storedValue: decl.totalRevenus,
        recomputedValue: recomputedRev,
        displayValue: null,
      });
    }

    // Check display grouping divergence
    // Display component (RevenueSummary/DeclarationCard) groups by type FIRST,
    // then by desc|emp within each type — effectively type|desc|emp, same as ingestion.
    // Verify by simulating the two-step grouping:
    const byType = new Map<string, typeof decl.revenus>();
    for (const r of decl.revenus) {
      const list = byType.get(r.type) ?? [];
      list.push(r);
      byType.set(r.type, list);
    }
    let displayRev = 0;
    for (const [, items] of byType) {
      const groups = new Map<string, { annee: number; montant: number }>();
      for (const r of items) {
        const key = `${r.description ?? ""}|${r.employeur ?? ""}`;
        const existing = groups.get(key);
        if (!existing || (r.annee ?? 0) > existing.annee) {
          groups.set(key, { annee: r.annee ?? 0, montant: r.montant ?? 0 });
        }
      }
      for (const g of groups.values()) displayRev += g.montant;
    }
    const displayRevFinal = displayRev || null;

    if (!floatsEqual(recomputedRev, displayRevFinal)) {
      totalDivergences.push({
        declarationId: decl.id,
        nom: decl.nom,
        prenom: decl.prenom,
        field: "totalRevenus (display vs ingestion grouping)",
        storedValue: recomputedRev,
        recomputedValue: recomputedRev,
        displayValue: displayRevFinal,
      });
    }
  }

  if (totalDivergences.length > 0) {
    fail(`${totalDivergences.length} total divergences found:`);
    for (const d of totalDivergences) {
      console.log(
        `    ${RED}${d.prenom} ${d.nom}${RESET} — ${d.field}: stored=${d.storedValue} recomputed=${d.recomputedValue}${d.displayValue !== null ? ` display=${d.displayValue}` : ""}`
      );
    }
  } else {
    ok("All stored totals match recomputed values");
  }

  // B2: Reachability — check name-matching for all declarations
  console.log("  Checking declaration reachability via name matching...");

  const allDeclarations = await prisma.declarationInteret.findMany({
    where: { typeMandat: { in: ["Député", "Sénateur"] } },
    select: {
      id: true,
      nom: true,
      prenom: true,
      typeMandat: true,
    },
  });

  // Load all deputies and senators
  const deputies = await prisma.depute.findMany({
    select: { id: true, nom: true, prenom: true },
  });
  const senators = await prisma.senateur.findMany({
    select: { id: true, nom: true, prenom: true },
  });

  const deputeNames = new Map(
    deputies.map((d) => [`${d.nom.toLowerCase()}|${d.prenom.toLowerCase()}`, d])
  );
  const senateurNames = new Map(
    senators.map((s) => [`${s.nom.toLowerCase()}|${s.prenom.toLowerCase()}`, s])
  );

  // Also build exact-case maps (to detect case-insensitive-only matches)
  const deputeExact = new Set(
    deputies.map((d) => `${d.nom}|${d.prenom}`)
  );
  const senateurExact = new Set(
    senators.map((s) => `${s.nom}|${s.prenom}`)
  );

  for (const decl of allDeclarations) {
    const lowerKey = `${decl.nom.toLowerCase()}|${decl.prenom.toLowerCase()}`;
    const exactKey = `${decl.nom}|${decl.prenom}`;

    if (decl.typeMandat === "Député") {
      const found = deputeNames.has(lowerKey);
      const exactFound = deputeExact.has(exactKey);
      if (!found) {
        reachabilityIssues.push({
          declarationId: decl.id,
          nom: decl.nom,
          prenom: decl.prenom,
          typeMandat: decl.typeMandat,
          issue: "No matching deputy (even case-insensitive)",
        });
      } else if (!exactFound) {
        // Case-insensitive match found but not exact — will work on
        // /representants/deputes and /profils/deputes (mode: "insensitive")
        // but will FAIL on /gouvernance/deputes (exact match)
        reachabilityIssues.push({
          declarationId: decl.id,
          nom: decl.nom,
          prenom: decl.prenom,
          typeMandat: decl.typeMandat,
          issue:
            "Case mismatch: works on /representants + /profils but FAILS on /gouvernance",
        });
      }
    } else if (decl.typeMandat === "Sénateur") {
      const found = senateurNames.has(lowerKey);
      const exactFound = senateurExact.has(exactKey);
      if (!found) {
        reachabilityIssues.push({
          declarationId: decl.id,
          nom: decl.nom,
          prenom: decl.prenom,
          typeMandat: decl.typeMandat,
          issue: "No matching senator (even case-insensitive)",
        });
      } else if (!exactFound) {
        // Senator queries use exact matching on ALL routes — this declaration is unreachable
        reachabilityIssues.push({
          declarationId: decl.id,
          nom: decl.nom,
          prenom: decl.prenom,
          typeMandat: decl.typeMandat,
          issue:
            "CRITICAL: Case mismatch — senator queries use exact matching on ALL routes, declaration unreachable",
        });
      }
    }
  }

  const criticalReach = reachabilityIssues.filter((r) =>
    r.issue.startsWith("CRITICAL")
  );
  const warningReach = reachabilityIssues.filter(
    (r) => !r.issue.startsWith("CRITICAL") && !r.issue.startsWith("No matching")
  );
  const noMatch = reachabilityIssues.filter((r) =>
    r.issue.startsWith("No matching")
  );

  if (criticalReach.length > 0) {
    fail(
      `${criticalReach.length} senator declarations UNREACHABLE (case mismatch):`
    );
    for (const r of criticalReach.slice(0, 20)) {
      console.log(`    ${RED}${r.prenom} ${r.nom}${RESET} — ${r.issue}`);
    }
    if (criticalReach.length > 20) {
      console.log(`    ... and ${criticalReach.length - 20} more`);
    }
  }
  if (warningReach.length > 0) {
    warn(`${warningReach.length} deputy declarations have case mismatches (partial route failure)`);
    if (verbose) {
      for (const r of warningReach.slice(0, 10)) {
        console.log(`    ${r.prenom} ${r.nom} — ${r.issue}`);
      }
    }
  }
  if (noMatch.length > 0) {
    console.log(
      `  ${DIM}${noMatch.length} declarations have no matching deputy/senator (may be former members)${RESET}`
    );
  }
  if (criticalReach.length === 0 && warningReach.length === 0) {
    ok("All declarations reachable via profile page queries");
  }

  return {
    sampleSize: topDeclarations.length,
    totalDivergences,
    reachabilityIssues,
  };
}

// ─── Phase C: Cross-System Verification ───

async function phaseC(): Promise<AuditReport["phaseC"]> {
  header("Phase C: Cross-System Verification (System 1 vs System 2)");

  const issues: CrossSystemIssue[] = [];

  // Find PersonnalitePublique with deputeId or senateurId
  const crossRefs = await prisma.personnalitePublique.findMany({
    where: {
      OR: [{ deputeId: { not: null } }, { senateurId: { not: null } }],
    },
    include: {
      interets: true,
      depute: { select: { nom: true, prenom: true } },
      senateur: { select: { nom: true, prenom: true } },
    },
  });

  console.log(
    `  ${crossRefs.length} government officials linked to deputies/senators`
  );

  for (const person of crossRefs) {
    const linkedNom = person.depute?.nom ?? person.senateur?.nom;
    const linkedPrenom = person.depute?.prenom ?? person.senateur?.prenom;
    const typeMandat = person.deputeId ? "Député" : "Sénateur";

    if (!linkedNom || !linkedPrenom) continue;

    // Find System 1 declarations
    const sys1 = await prisma.declarationInteret.findMany({
      where: {
        nom: { equals: linkedNom, mode: "insensitive" },
        prenom: { equals: linkedPrenom, mode: "insensitive" },
        typeMandat,
      },
      include: { participations: true },
    });

    // System 2 InteretDeclare records
    const sys2 = person.interets;

    // Compare participation counts
    const sys1Parts = sys1.reduce(
      (sum, d) => sum + d.participations.length,
      0
    );
    const sys2Parts = sys2.filter(
      (i) => i.rubrique === "PARTICIPATION"
    ).length;

    if (sys1Parts > 0 && sys2Parts > 0 && Math.abs(sys1Parts - sys2Parts) > 2) {
      issues.push({
        personnaliteSlug: person.slug,
        nom: person.nom,
        prenom: person.prenom,
        issue: `Participation count divergence: System1=${sys1Parts} System2=${sys2Parts}`,
        system1Count: sys1Parts,
        system2Count: sys2Parts,
      });
    }

    // Check if one system has data but the other doesn't
    if (sys1.length > 0 && sys2.length === 0) {
      issues.push({
        personnaliteSlug: person.slug,
        nom: person.nom,
        prenom: person.prenom,
        issue:
          "System 1 has declarations but System 2 (InteretDeclare) is empty — HATVP may not be published yet for this person",
        system1Count: sys1.length,
        system2Count: 0,
      });
    }
  }

  if (issues.length > 0) {
    warn(`${issues.length} cross-system issues found:`);
    for (const i of issues) {
      console.log(
        `    ${YELLOW}${i.prenom} ${i.nom}${RESET} (${i.personnaliteSlug}) — ${i.issue}`
      );
    }
  } else {
    ok("Cross-system verification clean");
  }

  return { crossRefCount: crossRefs.length, issues };
}

// ─── Main ───

async function main() {
  console.log(
    `\n${BOLD}HATVP Financial Declaration Audit${RESET}`
  );
  console.log(`${DIM}${new Date().toISOString()}${RESET}\n`);

  // Load XML
  let filePath: string;
  if (doDownload) {
    filePath = await downloadFresh();
  } else if (
    existsSync(LOCAL_CACHE_PATH) &&
    statSync(LOCAL_CACHE_PATH).size > 1_000_000
  ) {
    console.log(
      `  Using local XML cache: ${LOCAL_CACHE_PATH} (${(statSync(LOCAL_CACHE_PATH).size / 1024 / 1024).toFixed(1)}MB)`
    );
    filePath = LOCAL_CACHE_PATH;
  } else {
    console.log("  No local cache found, downloading...");
    filePath = await downloadFresh();
  }

  console.log("  Reading XML...");
  const xml = await readFile(filePath, "utf-8");
  console.log(`  ${(xml.length / 1024 / 1024).toFixed(1)}MB loaded`);

  const rawBlocks = splitDeclarations(xml);
  console.log(`  ${rawBlocks.length} total declaration blocks`);

  // Parse only deputies and senators
  const xmlDecls: ParsedDeclaration[] = [];
  let parseErrors = 0;
  for (const block of rawBlocks) {
    const decl = parseDeclaration(block);
    if (!decl) {
      parseErrors++;
      continue;
    }
    if (decl.typeMandat === "Député" || decl.typeMandat === "Sénateur") {
      xmlDecls.push(decl);
    }
  }
  console.log(
    `  ${xmlDecls.length} deputy/senator declarations parsed (${parseErrors} parse errors)`
  );

  // Run phases
  const phaseAResult = await phaseA(xmlDecls);
  const phaseBResult = await phaseB();
  const phaseCResult = await phaseC();

  // Summary
  header("Summary");

  const totalIssues =
    phaseAResult.mismatches.length +
    phaseBResult.totalDivergences.length +
    phaseBResult.reachabilityIssues.filter((r) => r.issue.startsWith("CRITICAL"))
      .length +
    phaseCResult.issues.length;

  console.log(`  XML declarations checked:    ${phaseAResult.totalXml}`);
  console.log(`  DB declarations:             ${phaseAResult.totalDb}`);
  console.log(`  Perfect matches:             ${GREEN}${phaseAResult.matched}${RESET}`);
  console.log(
    `  Mismatches:                  ${phaseAResult.mismatches.length > 0 ? RED : GREEN}${phaseAResult.mismatches.length}${RESET}`
  );
  console.log(
    `  Missing in DB:               ${phaseAResult.missingInDb.length > 0 ? YELLOW : GREEN}${phaseAResult.missingInDb.length}${RESET}`
  );
  console.log(
    `  Extra in DB:                 ${phaseAResult.extraInDb.length > 0 ? YELLOW : GREEN}${phaseAResult.extraInDb.length}${RESET}`
  );
  console.log(
    `  Total divergences (Phase B): ${phaseBResult.totalDivergences.length > 0 ? RED : GREEN}${phaseBResult.totalDivergences.length}${RESET}`
  );
  console.log(
    `  Unreachable senators:        ${phaseBResult.reachabilityIssues.filter((r) => r.issue.startsWith("CRITICAL")).length > 0 ? RED : GREEN}${phaseBResult.reachabilityIssues.filter((r) => r.issue.startsWith("CRITICAL")).length}${RESET}`
  );
  console.log(
    `  Cross-system issues:         ${phaseCResult.issues.length > 0 ? YELLOW : GREEN}${phaseCResult.issues.length}${RESET}`
  );
  console.log();

  if (totalIssues === 0) {
    console.log(`  ${GREEN}${BOLD}ALL CHECKS PASSED${RESET}`);
  } else {
    console.log(`  ${RED}${BOLD}${totalIssues} ISSUES FOUND${RESET}`);
  }

  // Write JSON report
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  const reportPath = join(
    process.cwd(),
    "data",
    `audit-declarations-${new Date().toISOString().slice(0, 10)}.json`
  );
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    xmlSource: filePath,
    phaseA: phaseAResult,
    phaseB: phaseBResult,
    phaseC: phaseCResult,
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  ${DIM}Report saved: ${reportPath}${RESET}\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
