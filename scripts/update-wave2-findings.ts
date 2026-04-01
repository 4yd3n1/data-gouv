/**
 * Wave 2 investigation findings — additional judicial events and conflict flags
 * discovered by the 12 parallel investigation agents.
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

function addFlag(data: Record<string, unknown>, flag: Record<string, unknown>) {
  if (!data.conflict_flags) data.conflict_flags = [];
  const flags = data.conflict_flags as Record<string, unknown>[];
  if (flags.some((f) => f.type === flag.type)) return false;
  flags.push(flag);
  return true;
}

function addJudicial(data: Record<string, unknown>, event: Record<string, unknown>) {
  if (!data.judicial_events) data.judicial_events = [];
  const events = data.judicial_events as Record<string, unknown>[];
  if (events.some((e) => e.nature === event.nature && e.date === event.date)) return false;
  events.push(event);
  return true;
}

let count = 0;

// ─── TABAROT: PNF enquête préliminaire (most significant new finding) ───
{
  const d = readJson("philippe-tabarot");
  if (d) {
    if (addJudicial(d, {
      date: "2021-09-01",
      type: "ENQUETE_PRELIMINAIRE",
      nature: "détournement de fonds publics, prise illégale d'intérêts, recel",
      juridiction: "Parquet National Financier (PNF)",
      statut: "EN_COURS",
      resume: "Enquête ouverte en septembre 2021 par le PNF après signalement de la HATVP. Porte sur le GIP créé par sa sœur Michèle Tabarot (maire du Cannet) dont Philippe est devenu directeur en avril 2018. Perquisitions au domicile de Tabarot et aux locaux du Cannet le 30 novembre 2022. L'enquête est confiée à la BRDE. Tabarot affirme n'avoir 'jamais été entendu ni sollicité par la justice'.",
      sourcePrincipale: "France Info",
      sourceUrl: "https://www.franceinfo.fr/enquetes-franceinfo/le-ministre-des-transports-philippe-tabarot-vise-par-une-enquete-pour-detournement-de-fonds-publics-et-prise-illegale-d-interets_7011494.html",
      sourceDate: "2025-01-13",
      corroborated_by: ["France Bleu", "France 3 Régions", "CNews"],
      verifie: true,
      _ingested: false,
    })) {
      console.log("[ADDED] philippe-tabarot: ENQUETE_PRELIMINAIRE (PNF, détournement fonds publics)");
      count++;
    }
    addFlag(d, {
      type: "PRIVATISATION_TRANSPORT",
      description: "En tant que VP de la Région PACA chargé des transports (2015-2021), Tabarot a piloté la première privatisation de TER en France (ligne Marseille-Toulon-Nice, attribuée à Transdev). Il est désormais ministre des Transports avec autorité sur le cadre national de mise en concurrence ferroviaire.",
      sourcePrincipale: "France Bleu / Public Sénat",
      severity: "notable",
      _ingested: false,
    });
    writeJson("philippe-tabarot", d);
  }
}

// ─── RIST: PharmaPapers (309 liens d'intérêts with pharma labs) ───
{
  const d = readJson("stephanie-rist");
  if (d) {
    if (addFlag(d, {
      type: "LIENS_INDUSTRIE_PHARMACEUTIQUE",
      description: "Entre 2012 et 2017, en tant que rhumatologue au CHR d'Orléans, Rist a déclaré 309 liens d'intérêts avec des laboratoires pharmaceutiques totalisant 40 196 € (hébergements, repas, transports, congrès, formations rémunérées). Record parmi les médecins-députés selon PharmaPapers/transparence.sante.gouv.fr. La polémique a resurgi lors de sa nomination comme ministre de la Santé (octobre 2025).",
      sourceUrl: "https://www.francebleu.fr/infos/politique/une-polemique-ressurgit-sur-les-liens-de-stephanie-rist-nouvelle-ministre-de-la-sante-avec-l-industrie-pharmaceutique-7992473",
      sourcePrincipale: "France Bleu / PharmaPapers",
      severity: "critique",
      data: { liensCount: 309, totalEuros: 40196, period: "2012-2017" },
      _ingested: false,
    })) {
      console.log("[ADDED] stephanie-rist: LIENS_INDUSTRIE_PHARMACEUTIQUE (309 liens, 40 196 €)");
      count++;
    }
    writeJson("stephanie-rist", d);
  }
}

// ─── BARROT: Uber déport (sister = Uber comms director) ───
{
  const d = readJson("jean-noel-barrot");
  if (d) {
    if (addFlag(d, {
      type: "DEPORT_OFFICIEL",
      description: "Décret de déport publié au Journal Officiel le 22 juillet 2022 : en tant que ministre délégué au Numérique, Barrot se récuse de tout dossier relatif à Uber. Motif : sa sœur Hélène Barrot est directrice de la communication d'Uber pour l'Europe de l'Ouest et du Sud. Les décisions relatives à Uber ont été transférées à la Première ministre Élisabeth Borne.",
      sourceUrl: "https://www.franceinfo.fr/politique/affaire/uber-files/le-ministre-delegue-au-numerique-jean-noel-barrot-ecarte-du-dossier-uber_5271544.html",
      sourcePrincipale: "France Info / Anticor",
      severity: "notable",
      data: { decretDate: "2022-07-22", motif: "sœur directrice communication Uber Europe" },
      _ingested: false,
    })) {
      console.log("[ADDED] jean-noel-barrot: DEPORT_OFFICIEL (Uber, sœur)");
      count++;
    }
    writeJson("jean-noel-barrot", d);
  }
}

// ─── PEGARD: Epstein photo + Cour des comptes criticism ───
{
  const d = readJson("catherine-pegard");
  if (d) {
    if (addFlag(d, {
      type: "EPSTEIN_VERSAILLES",
      description: "Enquête du Monde (11 mars 2026) : Pégard a organisé une visite 'très privée' du Château de Versailles pour Jeffrey Epstein le 25 mars 2013. Photo issue de documents judiciaires américains montrant Pégard posant dans la Galerie des Glaces avec Epstein, Woody Allen et Caroline Lang. Pégard a déclaré au Monde n'avoir 'aucun souvenir' de cette visite, contredite par la photographie.",
      sourceUrl: "https://www.lemonde.fr",
      sourcePrincipale: "Le Monde / BFMTV",
      severity: "critique",
      data: { date: "2013-03-25", source: "documents judiciaires US", photo: true },
      _ingested: false,
    })) {
      console.log("[ADDED] catherine-pegard: EPSTEIN_VERSAILLES (Le Monde, mars 2026)");
      count++;
    }
    if (addFlag(d, {
      type: "COUR_DES_COMPTES_ABUS",
      description: "Rapport de la Cour des comptes critiquant le maintien de Pégard à la tête de Versailles au-delà de la limite légale de 3 mandats et de la limite d'âge de 67 ans (atteinte en mars 2021). 27+ mois de statut intérimaire irrégulier après l'expiration formelle de son mandat (octobre 2022). La Cour a estimé que cette situation 'pourrait être assimilée à une forme d'abus de pouvoir' de la part de l'État.",
      sourceUrl: "https://www.franceinfo.fr/culture/patrimoine/chateau-de-versailles/la-cour-des-comptes-critique-le-maintien-de-catherine-pegard-a-la-tete-du-chateau-de-versailles-apres-trois-mandats_6169620.html",
      sourcePrincipale: "France Info / Cour des comptes",
      severity: "critique",
      _ingested: false,
    })) {
      console.log("[ADDED] catherine-pegard: COUR_DES_COMPTES_ABUS");
      count++;
    }
    writeJson("catherine-pegard", d);
  }
}

// ─── BARBUT: WWF revolving door ───
{
  const d = readJson("monique-barbut");
  if (d) {
    if (addFlag(d, {
      type: "PORTE_TOURNANTE",
      description: "Présidente du WWF France (janvier 2021-2023), organisation qui entretenait des partenariats avec Crédit Agricole (400 000 €, banque investissant dans les énergies fossiles), Lafarge, Ikea et Carrefour. Nommée ministre de la Transition écologique en octobre 2025. Sous sa présidence, le WWF a engagé une action en justice contre la classification du nucléaire dans la taxonomie verte de l'UE.",
      sourceUrl: "https://www.revolutionpermanente.fr/Monique-Barbut-nouveau-visage-de-l-ecologie-bourgeoise-dans-le-gouvernement-Lecornu-II",
      sourcePrincipale: "Révolution Permanente / agriculture-environnement.fr",
      severity: "notable",
      _ingested: false,
    })) {
      console.log("[ADDED] monique-barbut: PORTE_TOURNANTE (WWF → Transition écologique)");
      count++;
    }
    writeJson("monique-barbut", d);
  }
}

// ─── GENEVARD: FNSEA proximity ───
{
  const d = readJson("annie-genevard");
  if (d) {
    if (addFlag(d, {
      type: "PROXIMITE_LOBBY",
      description: "Proximité documentée avec la FNSEA (principal syndicat agricole). Qualifiée de 'passe-plat de la FNSEA' par un député écologiste (Reporterre). A poussé la réintroduction dérogatoire de l'acétamipride (néonicotinoïde interdit). Accusée par Générations Futures d'avoir fait pression sur des scientifiques pour adoucir un rapport gouvernemental sur les pesticides.",
      sourceUrl: "https://novethic.fr/environnement/biodiversite/annie-genevard-une-ministre-de-lagriculture-proche-de-la-fnsea",
      sourcePrincipale: "Novethic / Reporterre / Générations Futures",
      severity: "notable",
      _ingested: false,
    })) {
      console.log("[ADDED] annie-genevard: PROXIMITE_LOBBY (FNSEA)");
      count++;
    }
    writeJson("annie-genevard", d);
  }
}

console.log(`\nDone. Added ${count} new entries.`);
