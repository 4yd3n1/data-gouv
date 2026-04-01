/**
 * Update research output JSON files with investigation findings
 * from the Phase 1 deep dive (March 27, 2026).
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data/research-output");

function readJson(slug: string) {
  const path = join(DATA_DIR, `${slug}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(slug: string, data: Record<string, unknown>) {
  const path = join(DATA_DIR, `${slug}.json`);
  (data as Record<string, unknown>).researched_at = "2026-03-27";
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

// ═══════════════════════════════════════════════════════
// NEW JUDICIAL EVENTS
// ═══════════════════════════════════════════════════════

const NEW_JUDICIAL_EVENTS: Array<{
  slug: string;
  events: Array<Record<string, unknown>>;
}> = [
  {
    slug: "gerald-darmanin",
    events: [
      {
        date: "2025-10-30",
        type: "CLASSEMENT_SANS_SUITE",
        nature: "prise illégale d'intérêts",
        juridiction: "Cour de Justice de la République (CJR)",
        statut: "CLOS",
        resume:
          "Le 29 octobre 2025, le garde des Sceaux a rendu visite à Nicolas Sarkozy incarcéré à la prison de la Santé. Un collectif de 29 avocats a déposé plainte pour prise illégale d'intérêts. Le 4 décembre 2025, la commission des requêtes de la CJR a classé sans suite.",
        sourcePrincipale: "France Info",
        sourceUrl:
          "https://www.franceinfo.fr/politique/gerald-darmanin/visite-de-gerald-darmanin-a-nicolas-sarkozy-le-garde-des-sceaux-vise-par-une-plainte-pour-prise-illegale-d-interets_7585403.html",
        sourceDate: "2025-10-31",
        corroborated_by: ["Euronews", "Le Club des Juristes"],
        verifie: true,
        _ingested: false,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// NEW CONFLICT FLAGS (from investigation findings)
// ═══════════════════════════════════════════════════════

const NEW_CONFLICTS: Array<{
  slug: string;
  flags: Array<Record<string, unknown>>;
}> = [
  {
    slug: "gerald-darmanin",
    flags: [
      {
        type: "CONFLIT_STRUCTUREL",
        description:
          "Garde des Sceaux (chef du système judiciaire) tout en étant témoin assisté dans une enquête judiciaire en cours (affaire PSG/Neymar, complicité de fraude fiscale). Tension structurelle relevée par la doctrine juridique (Dalloz).",
        sourceUrl:
          "https://www.franceinfo.fr/politique/gerald-darmanin/transfert-de-neymar-au-psg-on-vous-explique-pourquoi-gerald-darmanin-est-soupconne-de-complicite-de-fraude-fiscale_6296634.html",
        sourcePrincipale: "France Info",
        severity: "critique",
        _ingested: false,
      },
    ],
  },
  {
    slug: "jean-pierre-farandou",
    flags: [
      {
        type: "DEPORT_OFFICIEL",
        description:
          "Décret de déport publié au Journal Officiel le 11 novembre 2025 : le ministre se récuse de tous les dossiers relatifs au groupe SNCF, au groupe La Poste, à Fer de France et à Uside. Ces dossiers sont réattribués au Premier ministre. Reconnaissance formelle du conflit d'intérêts lié à ses fonctions antérieures de PDG de la SNCF.",
        sourceUrl:
          "https://www.franceinfo.fr/politique/gouvernement-de-sebastien-lecornu/le-ministre-du-travail-et-des-solidarites-jean-pierre-farandou-se-deporte-des-dossiers-lies-a-la-sncf-et-la-poste_7609559.html",
        sourcePrincipale: "France Info / Journal Officiel",
        severity: "critique",
        data: {
          decretDate: "2025-11-11",
          domainesRecuses: ["SNCF", "La Poste", "Fer de France", "Uside"],
        },
        _ingested: false,
      },
    ],
  },
  {
    slug: "serge-papin",
    flags: [
      {
        type: "DEPORT_OFFICIEL",
        description:
          "Décret de déport publié au Journal Officiel le 6 décembre 2025 : le ministre se récuse de tous les dossiers relatifs au groupe Auchan et aux entreprises qu'il a conseillées dans les 5 années précédant son entrée au gouvernement. Décision prise sur recommandation de la HATVP.",
        sourceUrl:
          "https://www.franceinfo.fr/politique/gouvernement-de-sebastien-lecornu/",
        sourcePrincipale: "France Info / Journal Officiel",
        severity: "notable",
        data: {
          decretDate: "2025-12-06",
          domainesRecuses: ["Auchan", "entreprises conseillées 2020-2025"],
          hatvpRecommandation: true,
        },
        _ingested: false,
      },
    ],
  },
  {
    slug: "roland-lescure",
    flags: [
      {
        type: "PARADIS_FISCAUX",
        description:
          "En tant que premier VP et CIO de la CDPQ (2009-2017), Lescure a doublé les investissements dans les paradis fiscaux. En 2016 : 14 Mds$ aux Îles Caïmans, 3,3 Mds$ en Suisse, 2,5 Mds$ aux Bermudes. Il est désormais ministre de l'Économie et des Finances — le ministère qui définit la politique fiscale française, y compris la lutte contre l'évasion fiscale.",
        sourceUrl:
          "https://ici.radio-canada.ca/nouvelle/1063046/cdpq-paradis-fiscaux-augmentation",
        sourcePrincipale: "Radio-Canada / Mediapart",
        severity: "critique",
        _ingested: false,
      },
    ],
  },
  {
    slug: "sabrina-agresti-roubache",
    flags: [
      {
        type: "DECLARATION_HATVP_RECTIFIEE",
        description:
          "Enquête de Marianne (décembre 2023) : écart de ~91 000 € entre les revenus déclarés en tant que députée (août/décembre 2022) et ceux déclarés lors de sa nomination comme secrétaire d'État à la Ville. Émoluments sous-évalués pour la période 2018-2022. Déclaration corrigée le 21 décembre 2023. Explication : « revenus de droits d'auteur oubliés » + « dispositif de report d'imposition sur plus-values ». L'Observatoire d'Anticor a relevé ce manquement.",
        sourceUrl: "https://www.marianne.net",
        sourcePrincipale: "Marianne / Anticor",
        severity: "notable",
        _ingested: false,
      },
    ],
  },
  {
    slug: "maud-bregeon",
    flags: [
      {
        type: "RAPPORTEUR_CONFLIT",
        description:
          "Élue députée en juin 2022 après 8 ans chez EDF, Bregeon est immédiatement désignée rapporteure de la loi d'accélération nucléaire (février 2023), soulevant des questions de conflit d'intérêts. Reporterre et Contexte ont documenté cette chronologie : démission d'EDF → élection → rapporteur de la loi nucléaire en 8 mois.",
        sourceUrl:
          "https://reporterre.net/La-pronucleaire-Maud-Bregeon-devient-ministre-deleguee-a-l-Energie",
        sourcePrincipale: "Reporterre",
        severity: "notable",
        _ingested: false,
      },
    ],
  },
  {
    slug: "catherine-pegard",
    flags: [
      {
        type: "NOMINATION_PRESIDENTIELLE",
        description:
          "Journaliste politique au Point pendant 20 ans, puis nommée présidente du Château de Versailles par Nicolas Sarkozy en 2011. Reconduite par Hollande et Macron (2016, 2020). Nommée ministre de la Culture en 2026. Profil illustrant la porosité entre journalisme politique, nomination présidentielle et fonction ministérielle — le ministère de la Culture est le tuteur de l'établissement qu'elle dirigeait.",
        sourceUrl:
          "https://www.lemonde.fr/culture/",
        sourcePrincipale: "Le Monde",
        severity: "informatif",
        _ingested: false,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════
// APPLY UPDATES
// ═══════════════════════════════════════════════════════

let updatedCount = 0;

// Add new judicial events
for (const { slug, events } of NEW_JUDICIAL_EVENTS) {
  const data = readJson(slug);
  if (!data) { console.log(`[SKIP] ${slug}: not found`); continue; }

  if (!data.judicial_events) data.judicial_events = [];

  for (const event of events) {
    // Check for duplicates by nature + date
    const isDuplicate = data.judicial_events.some(
      (e: Record<string, unknown>) => e.nature === event.nature && e.date === event.date,
    );
    if (isDuplicate) {
      console.log(`[SKIP] ${slug}: duplicate judicial event (${event.nature})`);
      continue;
    }
    data.judicial_events.push(event);
    console.log(`[ADDED] ${slug}: judicial event — ${event.nature} (${event.statut})`);
  }

  writeJson(slug, data);
  updatedCount++;
}

// Add new conflict flags
for (const { slug, flags } of NEW_CONFLICTS) {
  const data = readJson(slug);
  if (!data) { console.log(`[SKIP] ${slug}: not found`); continue; }

  if (!data.conflict_flags) data.conflict_flags = [];

  for (const flag of flags) {
    // Check for duplicates by type
    const isDuplicate = data.conflict_flags.some(
      (f: Record<string, unknown>) => f.type === flag.type,
    );
    if (isDuplicate) {
      console.log(`[SKIP] ${slug}: duplicate flag (${flag.type})`);
      continue;
    }
    data.conflict_flags.push(flag);
    console.log(`[ADDED] ${slug}: conflict flag — ${flag.type} (${flag.severity})`);
  }

  writeJson(slug, data);
  updatedCount++;
}

console.log(`\nDone. Updated ${updatedCount} JSON files.`);
