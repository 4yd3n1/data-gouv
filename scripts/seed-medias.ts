/**
 * seed-medias.ts — Seeds media ownership data
 *
 * 10 groups, 10 owners, ~80 subsidiaries, ARCOM signalements, editorial orientations.
 * Safe to re-run (upsert on slug).
 *
 * Run: npx tsx scripts/seed-medias.ts
 */

import { prisma } from "../src/lib/db";

// ── Types ───────────────────────────────────────────────────────────────────

type TypeMedia =
  | "PRESSE_QUOTIDIENNE"
  | "PRESSE_MAGAZINE"
  | "TELEVISION"
  | "RADIO"
  | "NUMERIQUE"
  | "AGENCE";

type TypeControle = "MAJORITAIRE" | "MINORITAIRE" | "FONDATION" | "ETAT";

type TypeSignalement =
  | "MISE_EN_DEMEURE"
  | "SANCTION"
  | "RETRAIT_AUTORISATION"
  | "AVERTISSEMENT"
  | "AMENDE";

type OrientationEditoriale =
  | "DROITE"
  | "CENTRE_DROIT"
  | "CENTRE"
  | "CENTRE_GAUCHE"
  | "GAUCHE"
  | "GENERALISTE"
  | "SERVICE_PUBLIC"
  | "DIVERTISSEMENT"
  | "THEMATIQUE";

interface GroupeDef {
  slug: string;
  nom: string;
  nomCourt: string;
  description: string;
  chiffreAffaires?: number;
  rang: number;
  siteUrl?: string;
}

interface ProprietaireDef {
  slug: string;
  nom: string;
  prenom: string;
  civilite?: string;
  bioCourte: string;
  formation: string;
  fortuneEstimee?: number;
  sourceFortuneEstimee?: string;
  activitePrincipale?: string;
  contextePolitique?: string;
  sourceContextePolitique?: string;
  personnaliteSlug?: string;
}

interface ParticipationDef {
  proprietaireSlug: string;
  groupeSlug: string;
  partCapital?: number;
  typeControle: TypeControle;
  description?: string;
}

interface FilialeDef {
  slug: string;
  nom: string;
  type: TypeMedia;
  groupeSlug: string;
  description?: string;
  audienceEstimee?: string;
  dateCreation?: number;
  rang: number;
}

interface SignalementDef {
  filialeSlug: string;
  date: string;
  type: TypeSignalement;
  motif: string;
  montant?: number;
  referenceArcom?: string;
  sourceUrl?: string;
  resume: string;
}

interface OrientationDef {
  slug: string;
  orientation: OrientationEditoriale;
  ligneEditoriale: string;
}

// ── Data ────────────────────────────────────────────────────────────────────

const GROUPES: GroupeDef[] = [
  { slug: "vivendi-bollore", nom: "Vivendi / Groupe Bollore", nomCourt: "Bollore", description: "Conglomerat industriel et mediatique controle par Vincent Bollore. Premier groupe audiovisuel prive francais via Canal+ et le reseau de chaines gratuites CNews, C8, CStar.", chiffreAffaires: 9_800_000_000, rang: 1 },
  { slug: "groupe-arnault", nom: "Groupe Arnault / LVMH", nomCourt: "Arnault", description: "Bernard Arnault, PDG de LVMH, a constitue un pole presse economique et grand public via Les Echos, Le Parisien et Paris Match.", chiffreAffaires: 86_000_000_000, rang: 2 },
  { slug: "bouygues", nom: "Bouygues", nomCourt: "Bouygues", description: "Groupe industriel (BTP, telecoms) proprietaire du premier groupe de television hertzienne prive en France via TF1.", chiffreAffaires: 56_000_000_000, rang: 3 },
  { slug: "groupe-dassault", nom: "Groupe Dassault", nomCourt: "Dassault", description: "Groupe industriel (aeronautique, defense) proprietaire du Figaro, premier quotidien national de droite.", rang: 4 },
  { slug: "njj-groupe-le-monde", nom: "NJJ / Groupe Le Monde", nomCourt: "Niel", description: "Xavier Niel, fondateur de Free, controle un pole presse via le Groupe Le Monde (Le Monde, Telerama, Courrier International, L'Obs, HuffPost).", rang: 5 },
  { slug: "cmi-france", nom: "CMI France", nomCourt: "Kretinsky", description: "Filiale francaise de Czech Media Invest, detenue par le milliardaire tcheque Daniel Kretinsky. Propriete de Liberation, Elle, Marianne et plusieurs magazines grand public.", rang: 6 },
  { slug: "cma-media", nom: "CMA Media", nomCourt: "Saade", description: "Branche media du groupe CMA CGM, premier armateur francais. Rodolphe Saade a acquis BFMTV, RMC et La Tribune en 2023.", rang: 7 },
  { slug: "rtl-group-bertelsmann", nom: "RTL Group / Bertelsmann", nomCourt: "Bertelsmann", description: "Filiale du geant allemand Bertelsmann. Proprietaire du groupe M6 (M6, W9, 6ter, Gulli) et des radios RTL, Fun Radio.", rang: 8 },
  { slug: "nrj-group", nom: "NRJ Group", nomCourt: "NRJ", description: "Premier groupe radio prive en France, fonde par Jean-Paul Baudecroux. Quatre stations nationales.", rang: 9 },
  { slug: "france-medias-etat", nom: "France Medias (Etat)", nomCourt: "Service public", description: "L'audiovisuel public francais regroupe France Televisions, Radio France, France Medias Monde (France 24, RFI) et l'INA. Finance par la contribution a l'audiovisuel public.", rang: 10 },
];

const PROPRIETAIRES: ProprietaireDef[] = [
  {
    slug: "vincent-bollore", nom: "Bollore", prenom: "Vincent", civilite: "M.",
    bioCourte: "Industriel breton, PDG du groupe Bollore (logistique, energie, medias). A pris le controle de Vivendi en 2014 puis impose une ligne editoriale conservatrice sur CNews et Europe 1.",
    formation: "Licence de droit, Paris-II Assas", fortuneEstimee: 10.3, sourceFortuneEstimee: "Challenges 2024",
    activitePrincipale: "Logistique, energie (Bollore SE)",
    contextePolitique: "A impose une ligne editoriale conservatrice sur CNews, Europe 1 et le JDD a partir de 2022. Proximite documentee avec Nicolas Sarkozy et des figures de la droite traditionnelle. CNews est regulierement qualifie de 'Fox News francais' par les chercheurs en media (INA, RSF). Sous sa direction, les redactions de CNews et Europe 1 ont connu des departs massifs de journalistes.",
    sourceContextePolitique: "INA Barometre des JT 2024 ; RSF Rapport 2024 ; Le Monde",
  },
  {
    slug: "bernard-arnault", nom: "Arnault", prenom: "Bernard", civilite: "M.",
    bioCourte: "PDG de LVMH, premiere fortune mondiale en 2023-2024. Possede un pole de presse economique et grand public via Les Echos et Le Parisien.",
    formation: "Ecole polytechnique", fortuneEstimee: 186.0, sourceFortuneEstimee: "Forbes 2024",
    activitePrincipale: "Luxe (LVMH)",
    contextePolitique: "Entretient des relations etroites avec Emmanuel Macron, documentees par la presse. Les Echos et Le Parisien conservent une ligne editoriale moderee. Critique recurrente du conflit d'interets entre les activites de LVMH et la couverture presse des titres du groupe.",
    sourceContextePolitique: "Mediapart ; Le Monde Diplomatique",
  },
  {
    slug: "martin-bouygues", nom: "Bouygues", prenom: "Martin", civilite: "M.",
    bioCourte: "President du conseil d'administration du groupe Bouygues. Controle TF1, premiere chaine privee hertzienne, via la filiale TF1 Group.",
    formation: "Universite Paris-Dauphine", fortuneEstimee: 4.1, sourceFortuneEstimee: "Challenges 2024",
    activitePrincipale: "BTP, telecoms (Bouygues SA)",
    contextePolitique: "Relations equilibrees avec les gouvernements successifs, liees aux marches publics du BTP et des telecoms. TF1 maintient une ligne editoriale generaliste. Le groupe Bouygues est regulierement attributaire de grands contrats d'Etat.",
    sourceContextePolitique: "Cour des comptes ; Le Canard Enchaine",
  },
  {
    slug: "famille-dassault", nom: "Dassault", prenom: "Famille",
    bioCourte: "Heritiers de Marcel Dassault, la famille controle Dassault Aviation et le Groupe Figaro. Laurent Dassault preside le directoire du groupe de presse.",
    formation: "Dynastique (Dassault Aviation depuis 1929)", fortuneEstimee: 28.5, sourceFortuneEstimee: "Challenges 2024",
    activitePrincipale: "Aeronautique, defense (Dassault Aviation)",
    contextePolitique: "Serge Dassault (1925-2018) fut senateur UMP de l'Essonne (2004-2017), condamne pour achat de votes a Corbeil-Essonnes. Le Figaro est aligne avec la droite republicaine depuis le XIXe siecle. Les contrats de defense (Rafale) soulevent des questions de conflit d'interets avec la couverture editoriale.",
    sourceContextePolitique: "Tribunal correctionnel de Paris ; Le Monde ; Senat.fr",
  },
  {
    slug: "xavier-niel", nom: "Niel", prenom: "Xavier", civilite: "M.",
    bioCourte: "Fondateur de Free (Iliad), investisseur tech et telecom. Actionnaire majoritaire du Groupe Le Monde via sa holding NJJ. A aussi fonde l'ecole 42.",
    formation: "Autodidacte", fortuneEstimee: 9.1, sourceFortuneEstimee: "Challenges 2024",
    activitePrincipale: "Telecoms (Iliad/Free)",
    contextePolitique: "Positionnement centriste revendique. Le Monde dispose d'une societe des redacteurs garantissant l'independance editoriale. Niel soutient la French Tech et l'ecole 42, proche des milieux macronistes sans affiliation partisane declaree.",
    sourceContextePolitique: "Les Jours ; Le Monde (charte editoriale)",
  },
  {
    slug: "daniel-kretinsky", nom: "Kretinsky", prenom: "Daniel", civilite: "M.",
    bioCourte: "Milliardaire tcheque, fondateur d'EPH (energie). A rachete Liberation et un portefeuille de magazines Lagardere via CMI France.",
    formation: "Droit, Universite Masaryk (Brno)", fortuneEstimee: 8.9, sourceFortuneEstimee: "Forbes 2024",
    activitePrincipale: "Energie (EPH), distribution (Casino via EP Investment)",
    contextePolitique: "Industriel tcheque sans attache politique francaise declaree. Liberation conserve sa ligne progressiste. Les rachats Kretinsky sont surveilles par les commissions parlementaires pour les enjeux de souverainete mediatique.",
    sourceContextePolitique: "Senat, commission d'enquete sur la concentration des medias (2022)",
  },
  {
    slug: "rodolphe-saade", nom: "Saade", prenom: "Rodolphe", civilite: "M.",
    bioCourte: "PDG de CMA CGM, premier armateur francais et troisieme mondial. A rachete BFMTV, RMC et La Tribune en 2023 a Altice/Patrick Drahi.",
    formation: "Concordia University (Montreal)", fortuneEstimee: 41.0, sourceFortuneEstimee: "Forbes 2024",
    activitePrincipale: "Transport maritime (CMA CGM)",
    contextePolitique: "Armateur libanais naturalise francais. Revendique une neutralite editoriale pour BFMTV et RMC. CMA CGM est le principal beneficiaire des aides publiques au fret maritime. La concentration media-transport souleve des interrogations au Senat.",
    sourceContextePolitique: "La Tribune ; Le Monde ; Senat.fr",
  },
  {
    slug: "famille-mohn", nom: "Mohn", prenom: "Famille",
    bioCourte: "Famille fondatrice de Bertelsmann, geant allemand des medias. Controle RTL Group via la Fondation Bertelsmann. En France : M6, RTL, Fun Radio.",
    formation: "Dynastique (Bertelsmann depuis 1835)", fortuneEstimee: 5.7, sourceFortuneEstimee: "Forbes 2024",
    activitePrincipale: "Edition, medias (Bertelsmann SE)",
    contextePolitique: "Groupe allemand sans engagement politique direct en France. M6 et RTL maintiennent une ligne editoriale generaliste.",
    sourceContextePolitique: "Bertelsmann SE, rapport annuel",
  },
  {
    slug: "jean-paul-baudecroux", nom: "Baudecroux", prenom: "Jean-Paul", civilite: "M.",
    bioCourte: "Fondateur et president du conseil de surveillance de NRJ Group. A lance NRJ en 1981, devenu premier reseau radio prive de France.",
    formation: "Non communique", fortuneEstimee: 1.2, sourceFortuneEstimee: "Challenges 2024",
    activitePrincipale: "Radio (NRJ Group SA)",
    contextePolitique: "Aucune affiliation politique declaree. NRJ Group est exclusivement positionne sur le divertissement musical.",
    sourceContextePolitique: "NRJ Group, document de reference AMF",
  },
  {
    slug: "etat-francais", nom: "Etat francais", prenom: "Republique",
    bioCourte: "L'Etat francais est l'actionnaire unique de France Televisions, Radio France, France Medias Monde (France 24, RFI) et l'INA, via la holding France Medias.",
    formation: "Secteur public", activitePrincipale: "Service public de l'audiovisuel",
    personnaliteSlug: "catherine-pegard",
    contextePolitique: "La redevance audiovisuelle a ete supprimee en 2022, remplacee par un financement budgetaire direct suscitant des inquietudes sur l'independance editoriale. Tensions recurrentes entre le pouvoir executif et les redactions, particulierement lors des campagnes presidentielles. France Inter et France Culture sont regulierement qualifiees de 'radios de gauche' par la droite parlementaire.",
    sourceContextePolitique: "Cour des comptes ; France Televisions rapport annuel ; commission de la culture du Senat",
  },
];

const PARTICIPATIONS: ParticipationDef[] = [
  { proprietaireSlug: "vincent-bollore", groupeSlug: "vivendi-bollore", partCapital: 29.0, typeControle: "MAJORITAIRE", description: "Controle effectif via droits de vote doubles" },
  { proprietaireSlug: "bernard-arnault", groupeSlug: "groupe-arnault", partCapital: 100, typeControle: "MAJORITAIRE" },
  { proprietaireSlug: "martin-bouygues", groupeSlug: "bouygues", partCapital: 21.3, typeControle: "MAJORITAIRE", description: "Controle via Bouygues SA" },
  { proprietaireSlug: "famille-dassault", groupeSlug: "groupe-dassault", partCapital: 100, typeControle: "MAJORITAIRE" },
  { proprietaireSlug: "xavier-niel", groupeSlug: "njj-groupe-le-monde", partCapital: 72.5, typeControle: "MAJORITAIRE", description: "Via holding NJJ et Le Monde Libre" },
  { proprietaireSlug: "daniel-kretinsky", groupeSlug: "cmi-france", partCapital: 100, typeControle: "MAJORITAIRE" },
  { proprietaireSlug: "rodolphe-saade", groupeSlug: "cma-media", partCapital: 100, typeControle: "MAJORITAIRE" },
  { proprietaireSlug: "famille-mohn", groupeSlug: "rtl-group-bertelsmann", partCapital: 76.9, typeControle: "FONDATION", description: "Via Bertelsmann Stiftung" },
  { proprietaireSlug: "jean-paul-baudecroux", groupeSlug: "nrj-group", partCapital: 73.6, typeControle: "MAJORITAIRE" },
  { proprietaireSlug: "etat-francais", groupeSlug: "france-medias-etat", partCapital: 100, typeControle: "ETAT" },
];

const FILIALES: FilialeDef[] = [
  // ── Vivendi / Bollore
  { slug: "canal-plus", nom: "Canal+", type: "TELEVISION", groupeSlug: "vivendi-bollore", audienceEstimee: "5,3M abonnes", dateCreation: 1984, rang: 1 },
  { slug: "cnews", nom: "CNews", type: "TELEVISION", groupeSlug: "vivendi-bollore", audienceEstimee: "2,1% PDA", dateCreation: 1999, rang: 2 },
  { slug: "c8", nom: "C8", type: "TELEVISION", groupeSlug: "vivendi-bollore", audienceEstimee: "2,6% PDA", dateCreation: 2005, rang: 3 },
  { slug: "cstar", nom: "CStar", type: "TELEVISION", groupeSlug: "vivendi-bollore", dateCreation: 2005, rang: 4 },
  { slug: "europe-1", nom: "Europe 1", type: "RADIO", groupeSlug: "vivendi-bollore", audienceEstimee: "4,3% AC", dateCreation: 1955, rang: 5 },
  { slug: "virgin-radio-bollore", nom: "Virgin Radio", type: "RADIO", groupeSlug: "vivendi-bollore", dateCreation: 2008, rang: 6 },
  { slug: "jdd", nom: "Le Journal du Dimanche", type: "PRESSE_QUOTIDIENNE", groupeSlug: "vivendi-bollore", dateCreation: 1948, rang: 7 },
  { slug: "prisma-geo", nom: "Geo", type: "PRESSE_MAGAZINE", groupeSlug: "vivendi-bollore", rang: 8 },
  { slug: "prisma-capital", nom: "Capital", type: "PRESSE_MAGAZINE", groupeSlug: "vivendi-bollore", rang: 9 },
  { slug: "prisma-voici", nom: "Voici", type: "PRESSE_MAGAZINE", groupeSlug: "vivendi-bollore", rang: 10 },
  { slug: "prisma-gala", nom: "Gala", type: "PRESSE_MAGAZINE", groupeSlug: "vivendi-bollore", rang: 11 },
  { slug: "prisma-femme-actuelle", nom: "Femme Actuelle", type: "PRESSE_MAGAZINE", groupeSlug: "vivendi-bollore", rang: 12 },
  // ── Groupe Arnault
  { slug: "les-echos", nom: "Les Echos", type: "PRESSE_QUOTIDIENNE", groupeSlug: "groupe-arnault", audienceEstimee: "130 000 ex.", dateCreation: 1908, rang: 1 },
  { slug: "le-parisien", nom: "Le Parisien", type: "PRESSE_QUOTIDIENNE", groupeSlug: "groupe-arnault", audienceEstimee: "238 000 ex.", dateCreation: 1944, rang: 2 },
  { slug: "paris-match", nom: "Paris Match", type: "PRESSE_MAGAZINE", groupeSlug: "groupe-arnault", audienceEstimee: "450 000 ex.", dateCreation: 1949, rang: 3 },
  { slug: "radio-classique", nom: "Radio Classique", type: "RADIO", groupeSlug: "groupe-arnault", dateCreation: 1983, rang: 4 },
  { slug: "challenges", nom: "Challenges", type: "PRESSE_MAGAZINE", groupeSlug: "groupe-arnault", dateCreation: 1982, rang: 5 },
  { slug: "connaissance-arts", nom: "Connaissance des Arts", type: "PRESSE_MAGAZINE", groupeSlug: "groupe-arnault", rang: 6 },
  // ── Bouygues / TF1
  { slug: "tf1", nom: "TF1", type: "TELEVISION", groupeSlug: "bouygues", audienceEstimee: "19,7% PDA", dateCreation: 1975, rang: 1 },
  { slug: "tmc", nom: "TMC", type: "TELEVISION", groupeSlug: "bouygues", audienceEstimee: "3,9% PDA", dateCreation: 1954, rang: 2 },
  { slug: "lci", nom: "LCI", type: "TELEVISION", groupeSlug: "bouygues", audienceEstimee: "1,4% PDA", dateCreation: 1994, rang: 3 },
  { slug: "tf1-series-films", nom: "TF1 Series Films", type: "TELEVISION", groupeSlug: "bouygues", dateCreation: 2012, rang: 4 },
  { slug: "tf1-plus", nom: "TF1+", type: "NUMERIQUE", groupeSlug: "bouygues", description: "Plateforme de streaming du groupe TF1", dateCreation: 2023, rang: 5 },
  // ── Groupe Dassault
  { slug: "le-figaro", nom: "Le Figaro", type: "PRESSE_QUOTIDIENNE", groupeSlug: "groupe-dassault", audienceEstimee: "310 000 ex.", dateCreation: 1826, rang: 1 },
  { slug: "figaro-magazine", nom: "Le Figaro Magazine", type: "PRESSE_MAGAZINE", groupeSlug: "groupe-dassault", dateCreation: 1978, rang: 2 },
  { slug: "figaro-madame", nom: "Madame Figaro", type: "PRESSE_MAGAZINE", groupeSlug: "groupe-dassault", rang: 3 },
  { slug: "lefigaro-fr", nom: "lefigaro.fr", type: "NUMERIQUE", groupeSlug: "groupe-dassault", audienceEstimee: "24M VU/mois", rang: 4 },
  // ── NJJ / Groupe Le Monde
  { slug: "le-monde", nom: "Le Monde", type: "PRESSE_QUOTIDIENNE", groupeSlug: "njj-groupe-le-monde", audienceEstimee: "480 000 abonnes", dateCreation: 1944, rang: 1 },
  { slug: "telerama", nom: "Telerama", type: "PRESSE_MAGAZINE", groupeSlug: "njj-groupe-le-monde", dateCreation: 1947, rang: 2 },
  { slug: "courrier-international", nom: "Courrier International", type: "PRESSE_MAGAZINE", groupeSlug: "njj-groupe-le-monde", dateCreation: 1990, rang: 3 },
  { slug: "huffpost-fr", nom: "HuffPost France", type: "NUMERIQUE", groupeSlug: "njj-groupe-le-monde", dateCreation: 2012, rang: 4 },
  { slug: "le-nouvel-obs", nom: "L'Obs", type: "PRESSE_MAGAZINE", groupeSlug: "njj-groupe-le-monde", audienceEstimee: "200 000 ex.", dateCreation: 1964, rang: 5 },
  { slug: "la-vie", nom: "La Vie", type: "PRESSE_MAGAZINE", groupeSlug: "njj-groupe-le-monde", rang: 6 },
  // ── CMI France / Kretinsky
  { slug: "liberation", nom: "Liberation", type: "PRESSE_QUOTIDIENNE", groupeSlug: "cmi-france", audienceEstimee: "67 000 ex.", dateCreation: 1973, rang: 1 },
  { slug: "elle", nom: "Elle", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", audienceEstimee: "300 000 ex.", dateCreation: 1945, rang: 2 },
  { slug: "marianne", nom: "Marianne", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", dateCreation: 1997, rang: 3 },
  { slug: "tele-7-jours", nom: "Tele 7 Jours", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", dateCreation: 1960, rang: 4 },
  { slug: "france-dimanche", nom: "France Dimanche", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", dateCreation: 1946, rang: 5 },
  { slug: "public", nom: "Public", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", rang: 6 },
  { slug: "version-femina", nom: "Version Femina", type: "PRESSE_MAGAZINE", groupeSlug: "cmi-france", rang: 7 },
  // ── CMA Media / Saade
  { slug: "bfmtv", nom: "BFMTV", type: "TELEVISION", groupeSlug: "cma-media", audienceEstimee: "2,8% PDA", dateCreation: 2005, rang: 1 },
  { slug: "rmc", nom: "RMC", type: "RADIO", groupeSlug: "cma-media", audienceEstimee: "4,5% AC", dateCreation: 1943, rang: 2 },
  { slug: "bfm-business", nom: "BFM Business", type: "TELEVISION", groupeSlug: "cma-media", dateCreation: 2010, rang: 3 },
  { slug: "la-provence", nom: "La Provence", type: "PRESSE_QUOTIDIENNE", groupeSlug: "cma-media", dateCreation: 1997, rang: 4 },
  { slug: "la-tribune", nom: "La Tribune", type: "NUMERIQUE", groupeSlug: "cma-media", dateCreation: 1985, rang: 5 },
  { slug: "brut", nom: "Brut", type: "NUMERIQUE", groupeSlug: "cma-media", description: "Media natif numerique, contenu video social", dateCreation: 2016, rang: 6 },
  { slug: "bfm-regions", nom: "BFM Regions", type: "TELEVISION", groupeSlug: "cma-media", description: "Reseau de chaines locales BFM", rang: 7 },
  { slug: "rmc-sport", nom: "RMC Sport", type: "TELEVISION", groupeSlug: "cma-media", rang: 8 },
  // ── RTL Group / Bertelsmann
  { slug: "m6", nom: "M6", type: "TELEVISION", groupeSlug: "rtl-group-bertelsmann", audienceEstimee: "9,7% PDA", dateCreation: 1987, rang: 1 },
  { slug: "w9", nom: "W9", type: "TELEVISION", groupeSlug: "rtl-group-bertelsmann", audienceEstimee: "2,6% PDA", dateCreation: 2005, rang: 2 },
  { slug: "6ter", nom: "6ter", type: "TELEVISION", groupeSlug: "rtl-group-bertelsmann", dateCreation: 2012, rang: 3 },
  { slug: "gulli", nom: "Gulli", type: "TELEVISION", groupeSlug: "rtl-group-bertelsmann", dateCreation: 2005, rang: 4 },
  { slug: "rtl-radio", nom: "RTL", type: "RADIO", groupeSlug: "rtl-group-bertelsmann", audienceEstimee: "11,2% AC", dateCreation: 1933, rang: 5 },
  { slug: "fun-radio", nom: "Fun Radio", type: "RADIO", groupeSlug: "rtl-group-bertelsmann", audienceEstimee: "3,5% AC", dateCreation: 1985, rang: 6 },
  { slug: "m6-plus", nom: "M6+", type: "NUMERIQUE", groupeSlug: "rtl-group-bertelsmann", dateCreation: 2020, rang: 7 },
  // ── NRJ Group
  { slug: "nrj", nom: "NRJ", type: "RADIO", groupeSlug: "nrj-group", audienceEstimee: "10,1% AC", dateCreation: 1981, rang: 1 },
  { slug: "cherie-fm", nom: "Cherie FM", type: "RADIO", groupeSlug: "nrj-group", audienceEstimee: "3,3% AC", dateCreation: 1987, rang: 2 },
  { slug: "nostalgie", nom: "Nostalgie", type: "RADIO", groupeSlug: "nrj-group", audienceEstimee: "5,5% AC", dateCreation: 1983, rang: 3 },
  { slug: "rire-et-chansons", nom: "Rire & Chansons", type: "RADIO", groupeSlug: "nrj-group", dateCreation: 1990, rang: 4 },
  { slug: "nrj-hits", nom: "NRJ Hits", type: "TELEVISION", groupeSlug: "nrj-group", rang: 5 },
  // ── France Medias (Etat)
  { slug: "france-2", nom: "France 2", type: "TELEVISION", groupeSlug: "france-medias-etat", audienceEstimee: "14,1% PDA", dateCreation: 1964, rang: 1 },
  { slug: "france-3", nom: "France 3", type: "TELEVISION", groupeSlug: "france-medias-etat", audienceEstimee: "8,4% PDA", dateCreation: 1972, rang: 2 },
  { slug: "france-5", nom: "France 5", type: "TELEVISION", groupeSlug: "france-medias-etat", audienceEstimee: "3,8% PDA", dateCreation: 1994, rang: 3 },
  { slug: "france-inter", nom: "France Inter", type: "RADIO", groupeSlug: "france-medias-etat", audienceEstimee: "12,2% AC", dateCreation: 1947, rang: 4 },
  { slug: "france-culture", nom: "France Culture", type: "RADIO", groupeSlug: "france-medias-etat", audienceEstimee: "2,8% AC", dateCreation: 1946, rang: 5 },
  { slug: "france-info-radio", nom: "franceinfo:", type: "RADIO", groupeSlug: "france-medias-etat", dateCreation: 1987, rang: 6 },
  { slug: "france-info-tv", nom: "franceinfo: TV", type: "TELEVISION", groupeSlug: "france-medias-etat", dateCreation: 2016, rang: 7 },
  { slug: "france-24", nom: "France 24", type: "TELEVISION", groupeSlug: "france-medias-etat", description: "Chaine d'information internationale francophone", dateCreation: 2006, rang: 8 },
  { slug: "rfi", nom: "RFI", type: "RADIO", groupeSlug: "france-medias-etat", description: "Radio France Internationale", dateCreation: 1975, rang: 9 },
  { slug: "france-musique", nom: "France Musique", type: "RADIO", groupeSlug: "france-medias-etat", dateCreation: 1954, rang: 10 },
  { slug: "arte", nom: "Arte", type: "TELEVISION", groupeSlug: "france-medias-etat", description: "Chaine culturelle franco-allemande (50% France)", dateCreation: 1992, rang: 11 },
  { slug: "france-tv-slash", nom: "france.tv Slash", type: "NUMERIQUE", groupeSlug: "france-medias-etat", dateCreation: 2018, rang: 12 },
];

// ── Editorial Orientations ──────────────────────────────────────────────────

const ORIENTATIONS: OrientationDef[] = [
  // Bollore
  { slug: "canal-plus", orientation: "GENERALISTE", ligneEditoriale: "Chaine premium, cinema et sport." },
  { slug: "cnews", orientation: "DROITE", ligneEditoriale: "Chaine d'opinion conservatrice. Classee 'chaine la plus a droite du paysage audiovisuel francais' par le barometre INA (2024). Forte presence d'editorialistes identifies a droite et a l'extreme droite." },
  { slug: "c8", orientation: "DIVERTISSEMENT", ligneEditoriale: "Divertissement grand public, dominee par l'emission TPMP. Critiquee pour derive polemique et desinformation." },
  { slug: "cstar", orientation: "DIVERTISSEMENT", ligneEditoriale: "Chaine musicale et de divertissement." },
  { slug: "europe-1", orientation: "CENTRE_DROIT", ligneEditoriale: "Radio generaliste, virage editorial conservateur depuis 2022 sous l'influence Bollore. Departs massifs de journalistes." },
  { slug: "virgin-radio-bollore", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio musicale." },
  { slug: "jdd", orientation: "CENTRE_DROIT", ligneEditoriale: "Hebdomadaire generaliste repositionne a droite apres la reprise par Bollore en 2023. Demission collective de la redaction." },
  { slug: "prisma-geo", orientation: "THEMATIQUE", ligneEditoriale: "Magazine de voyage et decouverte." },
  { slug: "prisma-capital", orientation: "CENTRE_DROIT", ligneEditoriale: "Magazine economique, orientation liberale." },
  { slug: "prisma-voici", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse people." },
  { slug: "prisma-gala", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse people." },
  { slug: "prisma-femme-actuelle", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse feminine." },
  // Arnault
  { slug: "les-echos", orientation: "CENTRE_DROIT", ligneEditoriale: "Quotidien economique de reference, orientation liberale pro-entreprise." },
  { slug: "le-parisien", orientation: "GENERALISTE", ligneEditoriale: "Quotidien populaire d'Ile-de-France." },
  { slug: "paris-match", orientation: "GENERALISTE", ligneEditoriale: "Hebdomadaire d'actualite grand public." },
  { slug: "radio-classique", orientation: "THEMATIQUE", ligneEditoriale: "Radio musicale classique avec chroniques economiques." },
  { slug: "challenges", orientation: "CENTRE_DROIT", ligneEditoriale: "Hebdomadaire economique." },
  { slug: "connaissance-arts", orientation: "THEMATIQUE", ligneEditoriale: "Magazine culturel." },
  // Bouygues
  { slug: "tf1", orientation: "GENERALISTE", ligneEditoriale: "Premiere chaine privee generaliste." },
  { slug: "tmc", orientation: "DIVERTISSEMENT", ligneEditoriale: "Divertissement et series." },
  { slug: "lci", orientation: "GENERALISTE", ligneEditoriale: "Chaine d'information en continu." },
  { slug: "tf1-series-films", orientation: "DIVERTISSEMENT", ligneEditoriale: "Fiction." },
  { slug: "tf1-plus", orientation: "DIVERTISSEMENT", ligneEditoriale: "Streaming et replay." },
  // Dassault
  { slug: "le-figaro", orientation: "DROITE", ligneEditoriale: "Journal de reference de la droite francaise depuis le XIXe siecle. Ligne conservatrice liberale." },
  { slug: "figaro-magazine", orientation: "DROITE", ligneEditoriale: "Supplement magazine du Figaro." },
  { slug: "figaro-madame", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse feminine haut de gamme." },
  { slug: "lefigaro-fr", orientation: "DROITE", ligneEditoriale: "Version numerique du Figaro." },
  // Niel
  { slug: "le-monde", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Journal de reference, positionnement centre-gauche liberal. Societe des redacteurs garantissant l'independance." },
  { slug: "telerama", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Hebdomadaire culturel, sensibilite progressiste." },
  { slug: "courrier-international", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Revue de presse internationale, sensibilite cosmopolite." },
  { slug: "huffpost-fr", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Media numerique progressiste." },
  { slug: "le-nouvel-obs", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Hebdomadaire social-democrate." },
  { slug: "la-vie", orientation: "CENTRE", ligneEditoriale: "Hebdomadaire d'inspiration chretienne, centriste." },
  // Kretinsky
  { slug: "liberation", orientation: "GAUCHE", ligneEditoriale: "Quotidien progressiste, fonde par Jean-Paul Sartre en 1973." },
  { slug: "elle", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse feminine internationale." },
  { slug: "marianne", orientation: "GAUCHE", ligneEditoriale: "Republicain de gauche, souverainiste." },
  { slug: "tele-7-jours", orientation: "DIVERTISSEMENT", ligneEditoriale: "Magazine television." },
  { slug: "france-dimanche", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse people." },
  { slug: "public", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse people." },
  { slug: "version-femina", orientation: "DIVERTISSEMENT", ligneEditoriale: "Presse feminine." },
  // Saade
  { slug: "bfmtv", orientation: "GENERALISTE", ligneEditoriale: "Information en continu, centrage factuel revendique." },
  { slug: "rmc", orientation: "GENERALISTE", ligneEditoriale: "Radio generaliste, talk et sport." },
  { slug: "bfm-business", orientation: "CENTRE_DROIT", ligneEditoriale: "Chaine economique, orientation liberale." },
  { slug: "la-provence", orientation: "GENERALISTE", ligneEditoriale: "Quotidien regional (Marseille)." },
  { slug: "la-tribune", orientation: "CENTRE_DROIT", ligneEditoriale: "Media economique numerique." },
  { slug: "brut", orientation: "CENTRE_GAUCHE", ligneEditoriale: "Media natif numerique, sensibilite progressiste, audiences jeunes." },
  { slug: "bfm-regions", orientation: "GENERALISTE", ligneEditoriale: "Information locale." },
  { slug: "rmc-sport", orientation: "DIVERTISSEMENT", ligneEditoriale: "Sport." },
  // Bertelsmann
  { slug: "m6", orientation: "DIVERTISSEMENT", ligneEditoriale: "Generaliste, dominante divertissement." },
  { slug: "w9", orientation: "DIVERTISSEMENT", ligneEditoriale: "Divertissement." },
  { slug: "6ter", orientation: "DIVERTISSEMENT", ligneEditoriale: "Chaine familiale." },
  { slug: "gulli", orientation: "DIVERTISSEMENT", ligneEditoriale: "Chaine jeunesse." },
  { slug: "rtl-radio", orientation: "GENERALISTE", ligneEditoriale: "Premiere radio de France, generaliste." },
  { slug: "fun-radio", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio musicale jeune." },
  { slug: "m6-plus", orientation: "DIVERTISSEMENT", ligneEditoriale: "Streaming." },
  // NRJ
  { slug: "nrj", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio musicale." },
  { slug: "cherie-fm", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio musicale adulte." },
  { slug: "nostalgie", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio musicale oldies." },
  { slug: "rire-et-chansons", orientation: "DIVERTISSEMENT", ligneEditoriale: "Radio humour et musique." },
  { slug: "nrj-hits", orientation: "DIVERTISSEMENT", ligneEditoriale: "Chaine musicale TV." },
  // Etat
  { slug: "france-2", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Chaine generaliste du service public." },
  { slug: "france-3", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Chaine regionale du service public." },
  { slug: "france-5", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Chaine du savoir et du debat." },
  { slug: "france-inter", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Radio generaliste du service public. Regulierement qualifiee de 'radio de gauche' par la droite parlementaire." },
  { slug: "france-culture", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Radio culturelle et intellectuelle du service public." },
  { slug: "france-info-radio", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Radio d'information en continu du service public." },
  { slug: "france-info-tv", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Chaine d'information en continu du service public." },
  { slug: "france-24", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Information internationale francophone." },
  { slug: "rfi", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Radio internationale du service public." },
  { slug: "france-musique", orientation: "THEMATIQUE", ligneEditoriale: "Radio musicale classique et jazz." },
  { slug: "arte", orientation: "THEMATIQUE", ligneEditoriale: "Chaine culturelle franco-allemande. Documentaires, cinema d'auteur." },
  { slug: "france-tv-slash", orientation: "SERVICE_PUBLIC", ligneEditoriale: "Offre numerique jeunesse du service public." },
];

// ── ARCOM Signalements ──────────────────────────────────────────────────────

const SIGNALEMENTS: SignalementDef[] = [
  // CNews (6)
  { filialeSlug: "cnews", date: "2022-01-18", type: "MISE_EN_DEMEURE", motif: "Manquement a l'honnetete et a la rigueur de l'information", resume: "Mise en demeure pour diffusion de fausses informations lors de segments d'opinion presentes comme de l'information, dans le contexte de la campagne presidentielle 2022.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "cnews", date: "2022-06-15", type: "MISE_EN_DEMEURE", motif: "Non-respect du pluralisme politique", resume: "Mise en demeure pour desequilibre persistant du temps de parole politique au profit de la droite et de l'extreme droite, constate par le barometre de l'ARCOM.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "cnews", date: "2023-03-22", type: "MISE_EN_DEMEURE", motif: "Propos discriminatoires a l'antenne", resume: "Mise en demeure apres diffusion de propos discriminatoires lors d'une emission de debat.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "cnews", date: "2023-11-08", type: "MISE_EN_DEMEURE", motif: "Desinformation climatique", resume: "Mise en demeure pour diffusion repetee de propos climatosceptiques presentes sans contradiction ni mise en perspective scientifique.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "cnews", date: "2024-02-14", type: "AMENDE", motif: "Manquement aux obligations de pluralisme", montant: 80_000, referenceArcom: "Decision ARCOM 2024-120", resume: "Amende de 80 000 EUR pour manquement reitere aux obligations de pluralisme politique.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "cnews", date: "2024-07-03", type: "MISE_EN_DEMEURE", motif: "Non-respect du principe du contradictoire", resume: "Mise en demeure pour non-respect du contradictoire lors de sequences d'information.", sourceUrl: "https://www.arcom.fr/" },
  // C8 (6)
  { filialeSlug: "c8", date: "2017-06-14", type: "AMENDE", motif: "Sequences humiliantes dans TPMP", montant: 3_000_000, referenceArcom: "Decision CSA 2017-548", resume: "Amende de 3 millions EUR pour diffusion de sequences humiliantes et attentatoires a la dignite humaine dans Touche Pas a Mon Poste.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "c8", date: "2019-07-24", type: "AMENDE", motif: "Propos discriminatoires en direct", montant: 3_000_000, referenceArcom: "Decision CSA 2019-381", resume: "Amende de 3 millions EUR pour propos discriminatoires et homophobes diffuses en direct dans TPMP.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "c8", date: "2022-03-09", type: "MISE_EN_DEMEURE", motif: "Manquement a la maitrise de l'antenne", resume: "Mise en demeure pour manquement au controle des contenus diffuses en direct.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "c8", date: "2023-12-06", type: "AMENDE", motif: "Publicite clandestine dans TPMP", montant: 50_000, resume: "Amende de 50 000 EUR pour publicite clandestine repetee dans Touche Pas a Mon Poste.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "c8", date: "2024-02-28", type: "RETRAIT_AUTORISATION", motif: "Non-renouvellement de la frequence hertzienne", referenceArcom: "Decision ARCOM 2024-157", resume: "L'ARCOM decide de ne pas renouveler l'autorisation de diffusion de C8 sur la TNT, effective en 2025. Bilan negatif des manquements repetes.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "c8", date: "2024-06-19", type: "AMENDE", motif: "Propos injurieux en direct", montant: 1_500_000, resume: "Amende de 1,5 million EUR pour propos injurieux diffuses en direct. Sixieme sanction financiere contre C8.", sourceUrl: "https://www.arcom.fr/" },
  // Europe 1 (2)
  { filialeSlug: "europe-1", date: "2023-06-21", type: "MISE_EN_DEMEURE", motif: "Equilibre editorial et temps de parole", resume: "Mise en demeure pour non-respect de l'equilibre des courants de pensee et d'opinion, apres le virage conservateur de 2022.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "europe-1", date: "2024-01-17", type: "MISE_EN_DEMEURE", motif: "Honnetete de l'information", resume: "Mise en demeure pour manquement a l'honnetete de l'information. Sequences d'opinion presentees comme des faits.", sourceUrl: "https://www.arcom.fr/" },
  // BFMTV (2)
  { filialeSlug: "bfmtv", date: "2022-05-18", type: "MISE_EN_DEMEURE", motif: "Atteinte a la dignite humaine", resume: "Mise en demeure pour diffusion d'images portant atteinte a la dignite humaine.", sourceUrl: "https://www.arcom.fr/" },
  { filialeSlug: "bfmtv", date: "2023-09-12", type: "AVERTISSEMENT", motif: "Manquement a l'ethique journalistique", resume: "Avertissement pour manquement aux regles deontologiques lors de la couverture d'un fait divers.", sourceUrl: "https://www.arcom.fr/" },
  // TF1 (1)
  { filialeSlug: "tf1", date: "2023-04-05", type: "MISE_EN_DEMEURE", motif: "Publicite clandestine", resume: "Mise en demeure pour publicite clandestine dans un programme de divertissement.", sourceUrl: "https://www.arcom.fr/" },
  // France 2 (1)
  { filialeSlug: "france-2", date: "2022-11-22", type: "MISE_EN_DEMEURE", motif: "Diffusion d'images de mineurs", resume: "Mise en demeure pour diffusion d'images de mineurs identifiables dans un contexte judiciaire.", sourceUrl: "https://www.arcom.fr/" },
  // NRJ Hits (1)
  { filialeSlug: "nrj-hits", date: "2023-02-08", type: "MISE_EN_DEMEURE", motif: "Clips violents hors horaires proteges", resume: "Mise en demeure pour diffusion de clips musicaux violents en dehors des horaires proteges.", sourceUrl: "https://www.arcom.fr/" },
  // M6 (1)
  { filialeSlug: "m6", date: "2023-08-30", type: "AVERTISSEMENT", motif: "Placement de produit non signale", resume: "Avertissement pour placement de produit non signale aux telespectateurs.", sourceUrl: "https://www.arcom.fr/" },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding media ownership data...");

  // 1. Upsert groups
  for (const g of GROUPES) {
    await prisma.groupeMedia.upsert({
      where: { slug: g.slug },
      update: { nom: g.nom, nomCourt: g.nomCourt, description: g.description, chiffreAffaires: g.chiffreAffaires, rang: g.rang, siteUrl: g.siteUrl },
      create: g,
    });
  }
  console.log(`  Groups: ${GROUPES.length}`);

  // 2. Upsert owners (with contextePolitique + optional government link)
  for (const p of PROPRIETAIRES) {
    let personnaliteId: string | undefined;
    if (p.personnaliteSlug) {
      const linked = await prisma.personnalitePublique.findUnique({
        where: { slug: p.personnaliteSlug },
        select: { id: true },
      });
      personnaliteId = linked?.id;
    }
    await prisma.mediaProprietaire.upsert({
      where: { slug: p.slug },
      update: {
        nom: p.nom, prenom: p.prenom, civilite: p.civilite, bioCourte: p.bioCourte,
        formation: p.formation, fortuneEstimee: p.fortuneEstimee,
        sourceFortuneEstimee: p.sourceFortuneEstimee, activitePrincipale: p.activitePrincipale,
        contextePolitique: p.contextePolitique, sourceContextePolitique: p.sourceContextePolitique,
        ...(personnaliteId && { personnaliteId }),
      },
      create: {
        slug: p.slug, nom: p.nom, prenom: p.prenom, civilite: p.civilite,
        bioCourte: p.bioCourte, formation: p.formation, fortuneEstimee: p.fortuneEstimee,
        sourceFortuneEstimee: p.sourceFortuneEstimee, activitePrincipale: p.activitePrincipale,
        contextePolitique: p.contextePolitique, sourceContextePolitique: p.sourceContextePolitique,
        ...(personnaliteId && { personnaliteId }),
      },
    });
  }
  console.log(`  Owners: ${PROPRIETAIRES.length}`);

  // 3. Resolve slugs → IDs, upsert participations
  const allGroups = await prisma.groupeMedia.findMany({ select: { id: true, slug: true } });
  const allOwners = await prisma.mediaProprietaire.findMany({ select: { id: true, slug: true } });
  const groupMap = new Map(allGroups.map((g) => [g.slug, g.id]));
  const ownerMap = new Map(allOwners.map((o) => [o.slug, o.id]));

  for (const p of PARTICIPATIONS) {
    const proprietaireId = ownerMap.get(p.proprietaireSlug);
    const groupeId = groupMap.get(p.groupeSlug);
    if (!proprietaireId || !groupeId) { console.warn(`  SKIP participation: ${p.proprietaireSlug} → ${p.groupeSlug}`); continue; }
    await prisma.participationMedia.upsert({
      where: { proprietaireId_groupeId: { proprietaireId, groupeId } },
      update: { partCapital: p.partCapital, typeControle: p.typeControle, description: p.description },
      create: { proprietaireId, groupeId, partCapital: p.partCapital, typeControle: p.typeControle, description: p.description },
    });
  }
  console.log(`  Participations: ${PARTICIPATIONS.length}`);

  // 4. Upsert filiales
  for (const f of FILIALES) {
    const groupeId = groupMap.get(f.groupeSlug);
    if (!groupeId) { console.warn(`  SKIP filiale: ${f.slug}`); continue; }
    await prisma.filiale.upsert({
      where: { slug: f.slug },
      update: { nom: f.nom, type: f.type, groupeId, description: f.description, audienceEstimee: f.audienceEstimee, dateCreation: f.dateCreation, rang: f.rang },
      create: { slug: f.slug, nom: f.nom, type: f.type, groupeId, description: f.description, audienceEstimee: f.audienceEstimee, dateCreation: f.dateCreation, rang: f.rang },
    });
  }
  console.log(`  Filiales: ${FILIALES.length}`);

  // 5. Apply editorial orientations
  let orientationCount = 0;
  for (const o of ORIENTATIONS) {
    await prisma.filiale.update({
      where: { slug: o.slug },
      data: { orientation: o.orientation, ligneEditoriale: o.ligneEditoriale },
    });
    orientationCount++;
  }
  console.log(`  Orientations: ${orientationCount}`);

  // 6. Seed ARCOM signalements (delete + recreate for idempotency)
  const allFiliales = await prisma.filiale.findMany({ select: { id: true, slug: true } });
  const filialeMap = new Map(allFiliales.map((f) => [f.slug, f.id]));

  await prisma.signalementArcom.deleteMany({});
  let signalementCount = 0;
  for (const s of SIGNALEMENTS) {
    const filialeId = filialeMap.get(s.filialeSlug);
    if (!filialeId) { console.warn(`  SKIP signalement: ${s.filialeSlug}`); continue; }
    await prisma.signalementArcom.create({
      data: {
        filialeId, date: new Date(s.date), type: s.type, motif: s.motif,
        montant: s.montant, referenceArcom: s.referenceArcom, sourceUrl: s.sourceUrl, resume: s.resume,
      },
    });
    signalementCount++;
  }
  console.log(`  Signalements ARCOM: ${signalementCount}`);

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
