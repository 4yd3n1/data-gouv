/**
 * Seed the current government (Gouvernement Lecornu II, since October 12, 2025).
 * Handles transition from Bayrou → Lecornu II + Feb 26, 2026 reshuffle.
 * Idempotent: upserts on `slug`, mandate matched by personnaliteId + gouvernement + type.
 *
 * Run: npx tsx scripts/seed-gouvernement.ts
 *
 * Data sourced from gouvernement.fr, info.gouv.fr, vie-publique.fr, Wikipedia.
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { TypeMandat } from "@prisma/client";

// ─── Constants ───────────────────────────────────────────────────────────────

const GOUVERNEMENT_BAYROU = "Gouvernement François Bayrou";
const GOUVERNEMENT_LECORNU = "Gouvernement Sébastien Lecornu";
const PRESIDENT = "Emmanuel Macron";
const PM = "Sébastien Lecornu";

const DATE_FIN_BAYROU = new Date("2025-10-11"); // Last day of Bayrou government
const DATE_DEBUT_LECORNU = new Date("2025-10-12"); // Formation date
const DATE_FIN_RESHUFFLE = new Date("2026-02-25"); // Last day before reshuffle
const DATE_DEBUT_RESHUFFLE = new Date("2026-02-26"); // Reshuffle date

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberSeed {
  nom: string;
  prenom: string;
  civilite: string;
  slug: string;
  rang: number;
  type: TypeMandat;
  titre: string;
  titreCourt: string;
  ministereCode?: string;
  portefeuille?: string;
  bioCourte?: string;
  photoUrl?: string;
  formation?: string;
  dateDebut?: Date; // Override for reshuffle entrants
  // For cross-referencing with existing parliamentary records
  deputeNom?: string;
  deputePrenom?: string;
  senateurNom?: string;
  senateurPrenom?: string;
}

// ─── Lecornu II Members ──────────────────────────────────────────────────────

const members: MemberSeed[] = [
  // ─── Président ───
  {
    nom: "Macron",
    prenom: "Emmanuel",
    civilite: "M.",
    slug: "emmanuel-macron",
    rang: 1,
    type: TypeMandat.PRESIDENT,
    titre: "Président de la République française",
    titreCourt: "Président de la République",
    ministereCode: "PRESIDENCE",
    bioCourte:
      "Emmanuel Macron est le 25e président de la République française, élu en 2017 et réélu en 2022.",
    formation: "ENA (promotion Léopold Sédar Senghor, 2004), Sciences Po Paris, université Paris-Nanterre (philosophie)",
  },
  // ─── Premier ministre ───
  {
    nom: "Lecornu",
    prenom: "Sébastien",
    civilite: "M.",
    slug: "sebastien-lecornu",
    rang: 2,
    type: TypeMandat.PREMIER_MINISTRE,
    titre: "Premier ministre, chargé de la planification écologique et énergétique",
    titreCourt: "Premier ministre",
    ministereCode: "MATIGNON",
    bioCourte:
      "Sébastien Lecornu est Premier ministre depuis le 12 octobre 2025. Ancien ministre des Armées (2022-2025), il est une figure montante de la droite macroniste.",
    formation: "Institut d'études politiques de Rennes, master en droit public",
  },
  // ─── Ministres de plein exercice ───
  {
    nom: "Nuñez",
    prenom: "Laurent",
    civilite: "M.",
    slug: "laurent-nunez",
    rang: 3,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Intérieur",
    titreCourt: "Intérieur",
    ministereCode: "INTERIEUR",
    portefeuille:
      "Sécurité intérieure, police nationale, gendarmerie nationale, immigration, libertés publiques.",
    bioCourte:
      "Laurent Nuñez est un haut fonctionnaire, ancien préfet de police de Paris et ancien coordonnateur national du renseignement.",
    formation: "ENA (promotion Averroès, 1993), IEP de Paris",
  },
  {
    nom: "Vautrin",
    prenom: "Catherine",
    civilite: "Mme",
    slug: "catherine-vautrin",
    rang: 4,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des Armées et des Anciens combattants",
    titreCourt: "Armées",
    ministereCode: "ARMEES",
    portefeuille:
      "Défense nationale, forces armées, industrie de défense, anciens combattants.",
    bioCourte:
      "Catherine Vautrin est une femme politique LR, ancienne ministre déléguée sous Chirac et présidente du Grand Reims.",
    formation: "Université de Reims (sciences économiques), DESS gestion des entreprises",
  },
  {
    nom: "Farandou",
    prenom: "Jean-Pierre",
    civilite: "M.",
    slug: "jean-pierre-farandou",
    rang: 5,
    type: TypeMandat.MINISTRE,
    titre: "Ministre du Travail et des Solidarités",
    titreCourt: "Travail et Solidarités",
    ministereCode: "TRAVAIL_SOLIDARITES",
    portefeuille:
      "Emploi, droit du travail, solidarités, protection sociale, dialogue social.",
    bioCourte:
      "Jean-Pierre Farandou est un dirigeant d'entreprise, ancien PDG de la SNCF (2019-2024), issu du monde ferroviaire.",
    formation: "École polytechnique (X1977), École nationale des ponts et chaussées",
  },
  {
    nom: "Barbut",
    prenom: "Monique",
    civilite: "Mme",
    slug: "monique-barbut",
    rang: 6,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Transition écologique, de la Biodiversité et des Négociations climatiques internationales",
    titreCourt: "Transition écologique",
    ministereCode: "TRANSITION_ECOLOGIQUE",
    portefeuille:
      "Politique climatique, biodiversité, négociations internationales sur le climat, prévention des risques.",
    bioCourte:
      "Monique Barbut est une haute fonctionnaire internationale, ancienne secrétaire exécutive de la Convention des Nations unies sur la lutte contre la désertification.",
    formation: "ENA (promotion Fernand Braudel, 1984), HEC Paris",
  },
  {
    nom: "Darmanin",
    prenom: "Gérald",
    civilite: "M.",
    slug: "gerald-darmanin",
    rang: 7,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Justice, Garde des Sceaux",
    titreCourt: "Justice",
    ministereCode: "JUSTICE",
    portefeuille:
      "Organisation judiciaire, droit civil et pénal, administration pénitentiaire, protection judiciaire de la jeunesse.",
    bioCourte:
      "Gérald Darmanin est un homme politique, ancien ministre de l'Intérieur (2020-2025) et des Comptes publics (2017-2020).",
    formation: "Université de Lille (droit), IEP de Lille",
  },
  {
    nom: "Lescure",
    prenom: "Roland",
    civilite: "M.",
    slug: "roland-lescure",
    rang: 8,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Économie, des Finances et de la Souveraineté industrielle, énergétique et numérique",
    titreCourt: "Économie et Finances",
    ministereCode: "ECONOMIE_FINANCES",
    portefeuille:
      "Politique économique, budget, fiscalité, souveraineté industrielle et numérique.",
    bioCourte:
      "Roland Lescure est un homme politique et financier franco-canadien, ancien député des Français d'Amérique du Nord et ministre délégué à l'Industrie.",
    formation: "HEC Paris, université Paris-Dauphine",
    deputeNom: "Lescure",
    deputePrenom: "Roland",
  },
  {
    nom: "Papin",
    prenom: "Serge",
    civilite: "M.",
    slug: "serge-papin",
    rang: 9,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des PME, du Commerce, de l'Artisanat, du Tourisme et du Pouvoir d'achat",
    titreCourt: "PME et Commerce",
    ministereCode: "PME_COMMERCE",
    portefeuille:
      "PME, commerce, artisanat, tourisme, pouvoir d'achat des ménages.",
    bioCourte:
      "Serge Papin est un chef d'entreprise, ancien PDG de Système U (2005-2018), figure du commerce coopératif français.",
    formation: "ESSCA Angers (école supérieure de commerce)",
  },
  {
    nom: "Genevard",
    prenom: "Annie",
    civilite: "Mme",
    slug: "annie-genevard",
    rang: 10,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Agriculture, de l'Agroalimentaire et de la Souveraineté alimentaire",
    titreCourt: "Agriculture",
    ministereCode: "AGRICULTURE",
    portefeuille:
      "Agriculture, agroalimentaire, souveraineté alimentaire, forêt, pêche.",
    bioCourte:
      "Annie Genevard est une femme politique LR, ancienne vice-présidente de l'Assemblée nationale et députée du Doubs.",
    formation: "Université de Besançon (lettres modernes), CAPES",
    deputeNom: "Genevard",
    deputePrenom: "Annie",
  },
  {
    nom: "Geffray",
    prenom: "Édouard",
    civilite: "M.",
    slug: "edouard-geffray",
    rang: 11,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Éducation nationale",
    titreCourt: "Éducation nationale",
    ministereCode: "EDUCATION_NATIONALE",
    portefeuille:
      "Enseignement scolaire de la maternelle au lycée, programmes, vie scolaire.",
    bioCourte:
      "Édouard Geffray est un haut fonctionnaire, ancien directeur général de l'enseignement scolaire et ancien secrétaire général de la CNIL.",
    formation: "ENA (promotion Léopold Sédar Senghor, 2004), Sciences Po Paris",
  },
  {
    nom: "Barrot",
    prenom: "Jean-Noël",
    civilite: "M.",
    slug: "jean-noel-barrot",
    rang: 12,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Europe et des Affaires étrangères",
    titreCourt: "Affaires étrangères",
    ministereCode: "AFFAIRES_ETRANGERES",
    portefeuille:
      "Relations diplomatiques, politique étrangère, représentation de la France au sein de l'UE.",
    bioCourte:
      "Jean-Noël Barrot est un homme politique MoDem, universitaire en économie, ancien ministre délégué au Numérique.",
    formation: "HEC Paris, MIT (PhD en économie)",
    deputeNom: "Barrot",
    deputePrenom: "Jean-Noël",
  },
  {
    nom: "Pégard",
    prenom: "Catherine",
    civilite: "Mme",
    slug: "catherine-pegard",
    rang: 13,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Culture",
    titreCourt: "Culture",
    ministereCode: "CULTURE",
    portefeuille:
      "Politique culturelle, patrimoine, création artistique, audiovisuel, presse, livre.",
    bioCourte:
      "Catherine Pégard est une journaliste politique et haute fonctionnaire, ancienne présidente de l'Établissement public du château de Versailles (2011-2024).",
    formation: "Institut français de presse (Paris II)",
    dateDebut: new Date("2026-02-26"),
  },
  {
    nom: "Rist",
    prenom: "Stéphanie",
    civilite: "Mme",
    slug: "stephanie-rist",
    rang: 14,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Santé, des Familles, de l'Autonomie et des Personnes handicapées",
    titreCourt: "Santé et Familles",
    ministereCode: "SANTE_FAMILLE",
    portefeuille:
      "Système de santé, politique familiale, autonomie des personnes âgées, handicap.",
    bioCourte:
      "Stéphanie Rist est médecin chirurgienne et députée Renaissance du Loiret, spécialiste des questions de santé à l'Assemblée.",
    formation: "Faculté de médecine de Tours, internat en chirurgie orthopédique",
    deputeNom: "Rist",
    deputePrenom: "Stéphanie",
  },
  {
    nom: "Moutchou",
    prenom: "Naïma",
    civilite: "Mme",
    slug: "naima-moutchou",
    rang: 15,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Outre-mer",
    titreCourt: "Outre-mer",
    ministereCode: "OUTREMER",
    portefeuille:
      "Politique ultramarine, développement économique des territoires d'outre-mer.",
    bioCourte:
      "Naïma Moutchou est avocate et députée Horizons du Val-d'Oise, ancienne vice-présidente de l'Assemblée nationale.",
    formation: "Université Paris 1 Panthéon-Sorbonne (droit), barreau de Paris",
    deputeNom: "Moutchou",
    deputePrenom: "Naïma",
  },
  {
    nom: "Gatel",
    prenom: "Françoise",
    civilite: "Mme",
    slug: "francoise-gatel",
    rang: 16,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Aménagement du territoire et de la Décentralisation",
    titreCourt: "Aménagement du territoire",
    ministereCode: "AMENAGEMENT_TERRITOIRE",
    portefeuille:
      "Aménagement du territoire, décentralisation, collectivités territoriales.",
    bioCourte:
      "Françoise Gatel est sénatrice centriste d'Ille-et-Vilaine, ancienne présidente de la délégation aux collectivités territoriales du Sénat.",
    formation: "Université de Rennes (lettres)",
    senateurNom: "Gatel",
    senateurPrenom: "Françoise",
  },
  {
    nom: "Amiel",
    prenom: "David",
    civilite: "M.",
    slug: "david-amiel",
    rang: 17,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des Comptes publics",
    titreCourt: "Comptes publics",
    ministereCode: "ECONOMIE_FINANCES",
    portefeuille:
      "Budget de l'État, comptes publics, fiscalité, douanes.",
    bioCourte:
      "David Amiel est député Renaissance de Paris, ancien conseiller à l'Élysée, spécialiste des questions économiques.",
    formation: "ENS (Ulm), Sciences Po Paris, MIT (économie)",
    dateDebut: new Date("2026-02-26"),
    deputeNom: "Amiel",
    deputePrenom: "David",
  },
  {
    nom: "Baptiste",
    prenom: "Philippe",
    civilite: "M.",
    slug: "philippe-baptiste",
    rang: 18,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de l'Enseignement supérieur, de la Recherche et de l'Espace",
    titreCourt: "Enseignement supérieur et Recherche",
    ministereCode: "ENSEIGNEMENT_SUPERIEUR",
    portefeuille:
      "Enseignement supérieur, recherche scientifique, politique spatiale.",
    bioCourte:
      "Philippe Baptiste est un scientifique, ancien PDG du CNES (Centre national d'études spatiales), spécialiste d'intelligence artificielle.",
    formation: "École polytechnique, ENSTA ParisTech, PhD en informatique (université Paris-Sud)",
  },
  {
    nom: "Ferrari",
    prenom: "Marina",
    civilite: "Mme",
    slug: "marina-ferrari",
    rang: 19,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des Sports, de la Jeunesse et de la Vie associative",
    titreCourt: "Sports et Jeunesse",
    ministereCode: "SPORTS_JEUNESSE",
    portefeuille:
      "Politique sportive, jeunesse, engagement associatif, service civique.",
    bioCourte:
      "Marina Ferrari est députée Renaissance de Savoie, ancienne secrétaire d'État au Numérique.",
    formation: "EM Lyon Business School",
    deputeNom: "Ferrari",
    deputePrenom: "Marina",
  },
  {
    nom: "Tabarot",
    prenom: "Philippe",
    civilite: "M.",
    slug: "philippe-tabarot",
    rang: 20,
    type: TypeMandat.MINISTRE,
    titre: "Ministre des Transports",
    titreCourt: "Transports",
    ministereCode: "TRANSPORTS",
    portefeuille:
      "Transports terrestres, aériens, maritimes, infrastructures, mobilité.",
    bioCourte:
      "Philippe Tabarot est sénateur LR des Alpes-Maritimes, spécialiste des transports au Sénat.",
    formation: "IEP d'Aix-en-Provence, DESS en droit public",
    senateurNom: "Tabarot",
    senateurPrenom: "Philippe",
  },
  {
    nom: "Jeanbrun",
    prenom: "Vincent",
    civilite: "M.",
    slug: "vincent-jeanbrun",
    rang: 21,
    type: TypeMandat.MINISTRE,
    titre: "Ministre de la Ville et du Logement",
    titreCourt: "Ville et Logement",
    ministereCode: "VILLE_LOGEMENT",
    portefeuille:
      "Logement, politique de la ville, habitat, rénovation urbaine.",
    bioCourte:
      "Vincent Jeanbrun est le maire de L'Haÿ-les-Roses, figure de la politique locale du Val-de-Marne.",
    formation: "Sciences Po Paris, master en affaires publiques",
  },
  // ─── Ministres délégués ───
  {
    nom: "Panifous",
    prenom: "Laurent",
    civilite: "M.",
    slug: "laurent-panifous",
    rang: 22,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé des Relations avec le Parlement",
    titreCourt: "Relations avec le Parlement",
    ministereCode: "MATIGNON",
    bioCourte:
      "Laurent Panifous est député LIOT de l'Ariège, spécialiste de la ruralité et des collectivités.",
    deputeNom: "Panifous",
    deputePrenom: "Laurent",
  },
  {
    nom: "Bregeon",
    prenom: "Maud",
    civilite: "Mme",
    slug: "maud-bregeon",
    rang: 23,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée, porte-parole du Gouvernement, chargée de l'Énergie",
    titreCourt: "Porte-parole / Énergie",
    ministereCode: "TRANSITION_ECOLOGIQUE",
    bioCourte:
      "Maud Bregeon est députée Renaissance des Hauts-de-Seine, ingénieure diplômée de Polytech Nantes, ancienne cadre chez EDF, porte-parole du gouvernement.",
    formation: "Polytech Nantes (ingénieur)",
    deputeNom: "Bregeon",
    deputePrenom: "Maud",
  },
  {
    nom: "Bergé",
    prenom: "Aurore",
    civilite: "Mme",
    slug: "aurore-berge",
    rang: 24,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de l'Égalité entre les femmes et les hommes et de la Lutte contre les discriminations",
    titreCourt: "Égalité femmes-hommes",
    ministereCode: undefined,
    bioCourte:
      "Aurore Bergé est députée Renaissance des Yvelines, ancienne présidente du groupe Renaissance à l'Assemblée.",
    formation: "Sciences Po Paris",
    deputeNom: "Bergé",
    deputePrenom: "Aurore",
  },
  {
    nom: "Berger",
    prenom: "Jean-Didier",
    civilite: "M.",
    slug: "jean-didier-berger",
    rang: 25,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué auprès du ministre de l'Intérieur",
    titreCourt: "Intérieur (délégué)",
    ministereCode: "INTERIEUR",
    bioCourte:
      "Jean-Didier Berger est le maire de Clamart et conseiller départemental des Hauts-de-Seine.",
    dateDebut: new Date("2026-02-26"),
  },
  {
    nom: "Vedrenne",
    prenom: "Marie-Pierre",
    civilite: "Mme",
    slug: "marie-pierre-vedrenne",
    rang: 26,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée auprès du ministre de l'Intérieur",
    titreCourt: "Intérieur (déléguée)",
    ministereCode: "INTERIEUR",
    bioCourte:
      "Marie-Pierre Vedrenne est une femme politique centriste, ancienne eurodéputée Renew Europe, spécialiste du commerce international.",
    formation: "Université de Rennes (droit européen)",
  },
  {
    nom: "Rufo",
    prenom: "Alice",
    civilite: "Mme",
    slug: "alice-rufo",
    rang: 27,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée auprès de la ministre des Armées",
    titreCourt: "Armées (déléguée)",
    ministereCode: "ARMEES",
    bioCourte:
      "Alice Rufo est une diplomate et haute fonctionnaire, passée par l'ENS Ulm, Sciences Po et l'ENA. Ancienne conseillère diplomatique à l'Élysée et directrice générale des relations internationales au ministère des Armées.",
    formation: "ENS Ulm, Sciences Po Paris, ENA (promotion Émile Zola)",
  },
  {
    nom: "Chabaud",
    prenom: "Catherine",
    civilite: "Mme",
    slug: "catherine-chabaud",
    rang: 28,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de la Mer et de la Pêche",
    titreCourt: "Mer et Pêche",
    ministereCode: "AGRICULTURE",
    bioCourte:
      "Catherine Chabaud est navigatrice, journaliste et ancienne eurodéputée, militante pour la protection des océans.",
  },
  {
    nom: "Lefèvre",
    prenom: "Mathieu",
    civilite: "M.",
    slug: "mathieu-lefevre",
    rang: 29,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé de la Transition écologique",
    titreCourt: "Transition écologique (délégué)",
    ministereCode: "TRANSITION_ECOLOGIQUE",
    bioCourte:
      "Mathieu Lefèvre est député Renaissance du Val-de-Marne, spécialiste des finances publiques.",
    deputeNom: "Lefèvre",
    deputePrenom: "Mathieu",
  },
  {
    nom: "Martin",
    prenom: "Sébastien",
    civilite: "M.",
    slug: "sebastien-martin",
    rang: 30,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé de l'Industrie",
    titreCourt: "Industrie",
    ministereCode: "INDUSTRIE_NUMERIQUE",
    bioCourte:
      "Sébastien Martin est le président du Grand Chalon, figure de l'intercommunalité et du développement industriel local.",
  },
  {
    nom: "Le Hénanff",
    prenom: "Anne",
    civilite: "Mme",
    slug: "anne-le-henanff",
    rang: 31,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de l'Intelligence artificielle et du Numérique",
    titreCourt: "IA et Numérique",
    ministereCode: "INDUSTRIE_NUMERIQUE",
    bioCourte:
      "Anne Le Hénanff est députée Horizons du Morbihan, spécialiste des questions numériques et de cybersécurité à l'Assemblée.",
    deputeNom: "Le Hénanff",
    deputePrenom: "Anne",
  },
  {
    nom: "Haddad",
    prenom: "Benjamin",
    civilite: "M.",
    slug: "benjamin-haddad",
    rang: 32,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé de l'Europe",
    titreCourt: "Europe",
    ministereCode: "AFFAIRES_ETRANGERES",
    bioCourte:
      "Benjamin Haddad est député Renaissance de Paris, politologue spécialiste des relations transatlantiques, ancien directeur à l'Atlantic Council.",
    formation: "Sciences Po Paris, Johns Hopkins SAIS (Washington)",
    deputeNom: "Haddad",
    deputePrenom: "Benjamin",
  },
  {
    nom: "Forissier",
    prenom: "Nicolas",
    civilite: "M.",
    slug: "nicolas-forissier",
    rang: 33,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé du Commerce extérieur et de l'Attractivité",
    titreCourt: "Commerce extérieur",
    ministereCode: "ECONOMIE_FINANCES",
    bioCourte:
      "Nicolas Forissier est député LR de l'Indre, ancien secrétaire d'État à l'Agriculture sous Raffarin (2004-2005), maire de La Châtre pendant vingt-deux ans.",
    deputeNom: "Forissier",
    deputePrenom: "Nicolas",
  },
  {
    nom: "Caroit",
    prenom: "Éléonore",
    civilite: "Mme",
    slug: "eleonore-caroit",
    rang: 34,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de la Francophonie, des Partenariats internationaux et des Français de l'étranger",
    titreCourt: "Francophonie",
    ministereCode: "AFFAIRES_ETRANGERES",
    bioCourte:
      "Éléonore Caroit est députée Renaissance des Français d'Amérique latine et des Caraïbes.",
    deputeNom: "Caroit",
    deputePrenom: "Éléonore",
  },
  {
    nom: "Galliard-Minier",
    prenom: "Camille",
    civilite: "Mme",
    slug: "camille-galliard-minier",
    rang: 35,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de l'Autonomie et des Personnes handicapées",
    titreCourt: "Autonomie et Handicap",
    ministereCode: "SANTE_FAMILLE",
    bioCourte:
      "Camille Galliard-Minier est députée Renaissance de l'Isère, avocate spécialisée en droit de la famille, ancienne suppléante d'Olivier Véran.",
    dateDebut: new Date("2026-02-26"),
    deputeNom: "Galliard-Minier",
    deputePrenom: "Camille",
  },
  {
    nom: "Agresti-Roubache",
    prenom: "Sabrina",
    civilite: "Mme",
    slug: "sabrina-agresti-roubache",
    rang: 36,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre déléguée chargée de l'Enseignement, de la Formation professionnelle et de l'Apprentissage",
    titreCourt: "Formation professionnelle",
    ministereCode: "EDUCATION_NATIONALE",
    bioCourte:
      "Sabrina Agresti-Roubache est députée Renaissance des Bouches-du-Rhône, ancienne secrétaire d'État à la Ville.",
    dateDebut: new Date("2026-02-26"),
    deputeNom: "Agresti-Roubache",
    deputePrenom: "Sabrina",
  },
  {
    nom: "Fournier",
    prenom: "Michel",
    civilite: "M.",
    slug: "michel-fournier",
    rang: 37,
    type: TypeMandat.MINISTRE_DELEGUE,
    titre: "Ministre délégué chargé des Affaires rurales",
    titreCourt: "Affaires rurales",
    ministereCode: "AGRICULTURE",
    bioCourte:
      "Michel Fournier est maire des Voivres (Vosges) et président de l'Association des maires ruraux de France.",
  },
];

// ─── Slugs of members who departed in the Feb 26, 2026 reshuffle ─────────────

const RESHUFFLE_DEPARTURES = [
  "rachida-dati",
  "amelie-de-montchalin",
  // charlotte-parmentier-lecocq not in our DB (never seeded)
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Government Transition: Bayrou → Lecornu II ===\n");

  // ─── Step 1: Close all Bayrou mandates ───
  console.log("Step 1: Closing Bayrou government mandates...");
  const closedBayrou = await prisma.mandatGouvernemental.updateMany({
    where: {
      gouvernement: GOUVERNEMENT_BAYROU,
      dateFin: null,
    },
    data: {
      dateFin: DATE_FIN_BAYROU,
    },
  });
  console.log(`  Closed ${closedBayrou.count} Bayrou mandates (dateFin = ${DATE_FIN_BAYROU.toISOString().slice(0, 10)})`);

  // ─── Step 2: Close Feb 26 reshuffle departures (if they exist) ───
  console.log("\nStep 2: Closing Feb 26 reshuffle departures...");
  for (const slug of RESHUFFLE_DEPARTURES) {
    const person = await prisma.personnalitePublique.findUnique({ where: { slug } });
    if (!person) {
      console.log(`  ${slug} — not in DB, skipping`);
      continue;
    }
    const closed = await prisma.mandatGouvernemental.updateMany({
      where: {
        personnaliteId: person.id,
        gouvernement: GOUVERNEMENT_LECORNU,
        dateFin: null,
      },
      data: {
        dateFin: DATE_FIN_RESHUFFLE,
      },
    });
    console.log(`  ${slug} — closed ${closed.count} Lecornu mandate(s)`);
  }

  // ─── Step 3: Seed Lecornu II members ───
  console.log(`\nStep 3: Seeding ${GOUVERNEMENT_LECORNU} (${members.length} members)...`);

  let created = 0;
  let updated = 0;

  for (const member of members) {
    // Resolve deputeId / senateurId if cross-reference fields are set
    let deputeId: string | null = null;
    let senateurId: string | null = null;

    if (member.deputeNom && member.deputePrenom) {
      const depute = await prisma.depute.findFirst({
        where: { nom: member.deputeNom, prenom: member.deputePrenom, legislature: 17 },
      });
      if (depute) deputeId = depute.id;
    }

    if (member.senateurNom && member.senateurPrenom) {
      const senateur = await prisma.senateur.findFirst({
        where: { nom: member.senateurNom, prenom: member.senateurPrenom },
      });
      if (senateur) senateurId = senateur.id;
    }

    const personnalite = await prisma.personnalitePublique.upsert({
      where: { slug: member.slug },
      create: {
        nom: member.nom,
        prenom: member.prenom,
        civilite: member.civilite,
        slug: member.slug,
        photoUrl: member.photoUrl ?? null,
        bioCourte: member.bioCourte ?? null,
        formation: member.formation ?? null,
        deputeId,
        senateurId,
        sourceRecherche: "HATVP_ONLY",
      },
      update: {
        nom: member.nom,
        prenom: member.prenom,
        civilite: member.civilite,
        photoUrl: member.photoUrl ?? null,
        bioCourte: member.bioCourte ?? null,
        formation: member.formation ?? null,
        deputeId,
        senateurId,
      },
    });

    // Upsert the Lecornu mandate (match by personnaliteId + gouvernement + type)
    const existingMandat = await prisma.mandatGouvernemental.findFirst({
      where: {
        personnaliteId: personnalite.id,
        gouvernement: GOUVERNEMENT_LECORNU,
        type: member.type,
      },
    });

    const dateDebut = member.dateDebut ?? DATE_DEBUT_LECORNU;

    if (existingMandat) {
      await prisma.mandatGouvernemental.update({
        where: { id: existingMandat.id },
        data: {
          titre: member.titre,
          titreCourt: member.titreCourt,
          premierMinistre: PM,
          president: PRESIDENT,
          rang: member.rang,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
          dateDebut,
        },
      });
      updated++;
    } else {
      await prisma.mandatGouvernemental.create({
        data: {
          personnaliteId: personnalite.id,
          titre: member.titre,
          titreCourt: member.titreCourt,
          gouvernement: GOUVERNEMENT_LECORNU,
          premierMinistre: PM,
          president: PRESIDENT,
          dateDebut,
          dateFin: null,
          rang: member.rang,
          type: member.type,
          portefeuille: member.portefeuille ?? null,
          ministereCode: member.ministereCode ?? null,
        },
      });
      created++;
    }

    const deputeTag = deputeId ? " [depute]" : "";
    const senateurTag = senateurId ? " [senateur]" : "";
    console.log(`  ${member.rang}. ${member.prenom} ${member.nom} — ${member.titreCourt}${deputeTag}${senateurTag}`);
  }

  console.log(`\n=== Done ===`);
  console.log(`Mandates created: ${created}, updated: ${updated}`);
  console.log(`Total members seeded: ${members.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
