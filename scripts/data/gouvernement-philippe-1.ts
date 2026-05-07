import { TypeMandat } from "@prisma/client";
import type { GovernmentConfig } from "./types";

/**
 * Gouvernement Édouard Philippe I — composition complète.
 * En fonction du 17 mai 2017 au 19 juin 2017 (gouvernement de transition avant les législatives).
 *
 * Sources : Wikipedia, vie-publique.fr, Légifrance décret du 17 mai 2017.
 * Le président Macron n'est pas inclus — ajouté séparément par le script de seed.
 */
export const PHILIPPE_1_CONFIG: GovernmentConfig = {
  gouvernement: "Gouvernement Édouard Philippe I",
  premierMinistre: "Édouard Philippe",
  president: "Emmanuel Macron",
  dateDebut: new Date("2017-05-17"),
  dateFin: new Date("2017-06-19"),
  members: [
    // ─── Premier ministre ──────────────────────────────────────────────────────
    {
      nom: "Philippe",
      prenom: "Édouard",
      civilite: "M.",
      slug: "edouard-philippe",
      rang: 1,
      type: TypeMandat.PREMIER_MINISTRE,
      titre: "Premier ministre",
      titreCourt: "Premier ministre",
      ministereCode: "MATIGNON",
      bioCourte:
        "Édouard Philippe est Premier ministre de 2017 à 2020. Ancien maire du Havre, issu des Républicains, il rallie La République En Marche.",
      formation: "Sciences Po Paris, ENA (promotion Averroès, 1997)",
    },

    // ─── Ministres d'État ──────────────────────────────────────────────────────
    {
      nom: "Collomb",
      prenom: "Gérard",
      civilite: "M.",
      slug: "gerard-collomb",
      rang: 2,
      type: TypeMandat.MINISTRE,
      titre: "Ministre d'État, ministre de l'Intérieur",
      titreCourt: "Intérieur",
      ministereCode: "INTERIEUR",
      bioCourte:
        "Gérard Collomb est l'ancien maire de Lyon (2001-2017), premier grand élu socialiste à soutenir la candidature Macron en 2016.",
    },
    {
      nom: "Hulot",
      prenom: "Nicolas",
      civilite: "M.",
      slug: "nicolas-hulot",
      rang: 3,
      type: TypeMandat.MINISTRE,
      titre: "Ministre d'État, ministre de la Transition écologique et solidaire",
      titreCourt: "Transition écologique",
      ministereCode: "TRANSITION_ECOLOGIQUE",
      bioCourte:
        "Nicolas Hulot est animateur, militant écologiste et président de la Fondation pour la Nature et l'Homme.",
    },
    {
      nom: "Bayrou",
      prenom: "François",
      civilite: "M.",
      slug: "francois-bayrou",
      rang: 4,
      type: TypeMandat.MINISTRE,
      titre: "Ministre d'État, ministre de la Justice, garde des Sceaux",
      titreCourt: "Justice",
      ministereCode: "JUSTICE",
      bioCourte:
        "François Bayrou est président du MoDem et ancien candidat à l'élection présidentielle. Il démissionne le 21 juin 2017.",
      formation: "Lettres classiques, agrégation",
    },

    // ─── Ministres de plein exercice ───────────────────────────────────────────
    {
      nom: "Goulard",
      prenom: "Sylvie",
      civilite: "Mme",
      slug: "sylvie-goulard",
      rang: 5,
      type: TypeMandat.MINISTRE,
      titre: "Ministre des Armées",
      titreCourt: "Armées",
      ministereCode: "ARMEES",
      bioCourte:
        "Sylvie Goulard est une haute fonctionnaire européenne, ancienne eurodéputée MoDem. Elle démissionne le 21 juin 2017 en raison d'une mise en cause dans l'affaire des assistants parlementaires MoDem.",
      formation: "Sciences Po Paris, ENA (promotion Liberté-Égalité-Fraternité, 1993)",
    },
    {
      nom: "Le Drian",
      prenom: "Jean-Yves",
      civilite: "M.",
      slug: "jean-yves-le-drian",
      rang: 6,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Europe et des Affaires étrangères",
      titreCourt: "Affaires étrangères",
      ministereCode: "AFFAIRES_ETRANGERES",
      bioCourte:
        "Jean-Yves Le Drian est l'ancien ministre de la Défense sous François Hollande (2012-2017) et président de la région Bretagne.",
    },
    {
      nom: "Ferrand",
      prenom: "Richard",
      civilite: "M.",
      slug: "richard-ferrand",
      rang: 7,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de la Cohésion des territoires",
      titreCourt: "Cohésion des territoires",
      ministereCode: "AMENAGEMENT_TERRITOIRE",
      bioCourte:
        "Richard Ferrand est secrétaire général de La République En Marche lors de la campagne Macron. Il démissionne le 21 juin 2017 après la mise en cause dans l'affaire des Mutuelles de Bretagne.",
    },
    {
      nom: "Buzyn",
      prenom: "Agnès",
      civilite: "Mme",
      slug: "agnes-buzyn",
      rang: 8,
      type: TypeMandat.MINISTRE,
      titre: "Ministre des Solidarités et de la Santé",
      titreCourt: "Solidarités et Santé",
      ministereCode: "SANTE_FAMILLE",
      bioCourte:
        "Agnès Buzyn est hématologue et professeure des universités, ancienne présidente de la Haute Autorité de Santé.",
    },
    {
      nom: "Nyssen",
      prenom: "Françoise",
      civilite: "Mme",
      slug: "francoise-nyssen",
      rang: 9,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de la Culture",
      titreCourt: "Culture",
      ministereCode: "CULTURE",
      bioCourte:
        "Françoise Nyssen est directrice des éditions Actes Sud, fondée par ses parents.",
    },
    {
      nom: "Le Maire",
      prenom: "Bruno",
      civilite: "M.",
      slug: "bruno-le-maire",
      rang: 10,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Économie et des Finances",
      titreCourt: "Économie et Finances",
      ministereCode: "ECONOMIE_FINANCES",
      bioCourte:
        "Bruno Le Maire est un ancien ministre de l'Agriculture sous Sarkozy (2009-2012), issu des Républicains.",
    },
    {
      nom: "Pénicaud",
      prenom: "Muriel",
      civilite: "Mme",
      slug: "muriel-penicaud",
      rang: 11,
      type: TypeMandat.MINISTRE,
      titre: "Ministre du Travail",
      titreCourt: "Travail",
      ministereCode: "TRAVAIL_SOLIDARITES",
      bioCourte:
        "Muriel Pénicaud est une dirigeante d'entreprise, ancienne DRH de Danone et directrice générale de Business France.",
    },
    {
      nom: "Blanquer",
      prenom: "Jean-Michel",
      civilite: "M.",
      slug: "jean-michel-blanquer",
      rang: 12,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Éducation nationale",
      titreCourt: "Éducation nationale",
      ministereCode: "EDUCATION_NATIONALE",
      bioCourte:
        "Jean-Michel Blanquer est un haut fonctionnaire, ancien directeur général de l'enseignement scolaire et directeur de l'ESSEC.",
    },
    {
      nom: "Mézard",
      prenom: "Jacques",
      civilite: "M.",
      slug: "jacques-mezard",
      rang: 13,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Agriculture et de l'Alimentation",
      titreCourt: "Agriculture",
      ministereCode: "AGRICULTURE",
      bioCourte:
        "Jacques Mézard est sénateur du Cantal et président du groupe RDSE au Sénat.",
    },
    {
      nom: "Darmanin",
      prenom: "Gérald",
      civilite: "M.",
      slug: "gerald-darmanin",
      rang: 14,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Action et des Comptes publics",
      titreCourt: "Comptes publics",
      ministereCode: "ECONOMIE_FINANCES",
      bioCourte:
        "Gérald Darmanin est un élu LR, ancien maire de Tourcoing, député du Nord.",
    },
    {
      nom: "Vidal",
      prenom: "Frédérique",
      civilite: "Mme",
      slug: "frederique-vidal",
      rang: 15,
      type: TypeMandat.MINISTRE,
      titre: "Ministre de l'Enseignement supérieur, de la Recherche et de l'Innovation",
      titreCourt: "Enseignement supérieur",
      ministereCode: "ENSEIGNEMENT_SUPERIEUR",
      bioCourte:
        "Frédérique Vidal est présidente de l'université Nice Sophia Antipolis, biochimiste.",
    },
    {
      nom: "Girardin",
      prenom: "Annick",
      civilite: "Mme",
      slug: "annick-girardin",
      rang: 16,
      type: TypeMandat.MINISTRE,
      titre: "Ministre des Outre-mer",
      titreCourt: "Outre-mer",
      ministereCode: "OUTREMER",
      bioCourte:
        "Annick Girardin est une élue de Saint-Pierre-et-Miquelon, ancienne secrétaire d'État chargée du Développement et de la Francophonie sous Hollande.",
    },
    {
      nom: "Flessel",
      prenom: "Laura",
      civilite: "Mme",
      slug: "laura-flessel",
      rang: 17,
      type: TypeMandat.MINISTRE,
      titre: "Ministre des Sports",
      titreCourt: "Sports",
      ministereCode: "SPORTS_JEUNESSE",
      bioCourte:
        "Laura Flessel est une championne olympique d'escrime (Atlanta 1996, Sydney 2000), surnommée « La Guêpe ».",
    },

    // ─── Ministres auprès d'un ministre ───────────────────────────────────────
    {
      nom: "Borne",
      prenom: "Élisabeth",
      civilite: "Mme",
      slug: "elisabeth-borne",
      rang: 18,
      type: TypeMandat.MINISTRE_DELEGUE,
      titre: "Ministre auprès du ministre d'État, ministre de la Transition écologique et solidaire, chargée des Transports",
      titreCourt: "Transports",
      ministereCode: "TRANSPORTS",
      bioCourte:
        "Élisabeth Borne est une haute fonctionnaire, ancienne directrice de cabinet de Ségolène Royal au ministère de l'Environnement.",
    },
    {
      nom: "de Sarnez",
      prenom: "Marielle",
      civilite: "Mme",
      slug: "marielle-de-sarnez",
      rang: 19,
      type: TypeMandat.MINISTRE_DELEGUE,
      titre: "Ministre auprès du ministre de l'Europe et des Affaires étrangères, chargée des Affaires européennes",
      titreCourt: "Affaires européennes",
      ministereCode: "AFFAIRES_ETRANGERES",
      bioCourte:
        "Marielle de Sarnez est vice-présidente du MoDem et ancienne eurodéputée.",
    },

    // ─── Secrétaires d'État ────────────────────────────────────────────────────
    {
      nom: "Castaner",
      prenom: "Christophe",
      civilite: "M.",
      slug: "christophe-castaner",
      rang: 20,
      type: TypeMandat.SECRETAIRE_ETAT,
      titre: "Secrétaire d'État auprès du Premier ministre, chargé des Relations avec le Parlement, porte-parole du gouvernement",
      titreCourt: "Relations avec le Parlement",
      ministereCode: "MATIGNON",
      bioCourte:
        "Christophe Castaner est délégué général de La République En Marche et ancien élu socialiste des Alpes-de-Haute-Provence.",
    },
    {
      nom: "Schiappa",
      prenom: "Marlène",
      civilite: "Mme",
      slug: "marlene-schiappa",
      rang: 21,
      type: TypeMandat.SECRETAIRE_ETAT,
      titre: "Secrétaire d'État auprès du Premier ministre, chargée de l'Égalité entre les femmes et les hommes",
      titreCourt: "Égalité femmes-hommes",
      ministereCode: "MATIGNON",
      bioCourte:
        "Marlène Schiappa est essayiste, ancienne adjointe au maire du Mans.",
    },
    {
      nom: "Cluzel",
      prenom: "Sophie",
      civilite: "Mme",
      slug: "sophie-cluzel",
      rang: 22,
      type: TypeMandat.SECRETAIRE_ETAT,
      titre: "Secrétaire d'État auprès du Premier ministre, chargée des Personnes handicapées",
      titreCourt: "Personnes handicapées",
      ministereCode: "MATIGNON",
      bioCourte:
        "Sophie Cluzel est une militante associative, présidente de la FNASEPH (Fédération nationale des associations au service des élèves présentant un handicap).",
    },
    {
      nom: "Mahjoubi",
      prenom: "Mounir",
      civilite: "M.",
      slug: "mounir-mahjoubi",
      rang: 23,
      type: TypeMandat.SECRETAIRE_ETAT,
      titre: "Secrétaire d'État auprès du Premier ministre, chargé du Numérique",
      titreCourt: "Numérique",
      ministereCode: "INDUSTRIE_NUMERIQUE",
      bioCourte:
        "Mounir Mahjoubi est directeur des ressources numériques de la campagne Macron, ancien président du Conseil national du numérique.",
    },
  ],
};
