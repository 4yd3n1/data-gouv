/**
 * Seed: Acquisitions étrangères de fleurons français depuis 2014.
 *
 * Each entry is a hand-curated, sourced fact sheet describing a single phase
 * of a foreign acquisition (or attempted acquisition) of a French strategic
 * company. Multi-phase deals (Photonis Teledyne→HLD, Alstom→GE→Arabelle, Atos
 * saga, Eutelsat-OneWeb→state recap, Segault Flowserve→Framatome, SFR Altice
 * →creditors→French operators) are modelled as parent + child rows linked via
 * `parentDealId`.
 *
 * Idempotent: upserts on a synthetic `seedKey` resolved against `cibleNom +
 * dateAnnonce + categorie`. Re-running mutates rather than duplicating.
 *
 * Run: pnpm tsx scripts/seed-acquisitions-etrangeres.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";
import {
  CategorieAcquisition,
  MesureEtat,
  SecteurStrategique,
  PaysAcquereur,
} from "@prisma/client";
import { logIngestion } from "./lib/ingestion-log";

interface SourceLink {
  outlet: string;
  url: string;
  date: string; // ISO
}

interface AcquisitionSeed {
  seedKey: string; // local identifier — used to resolve parent/child links
  parentSeedKey?: string;
  cibleNom: string;
  cibleSecteur: SecteurStrategique;
  cibleSousSecteur?: string;
  cibleSiteHistorique?: string;
  acquereurNom: string;
  acquereurPays: PaysAcquereur;
  acquereurType?: string;
  dateAnnonce?: string; // ISO
  dateCloture?: string; // ISO
  valeurEur?: bigint;
  categorie: CategorieAcquisition;
  mesureEtat?: MesureEtat;
  ministreReferent?: string;
  iefDeclenche?: boolean;
  iefReference?: string;
  contexte: string;
  enjeuxSouverainete: string;
  contextePolitique?: string;
  sourcePrincipale: string;
  sourceUrl: string;
  sourceDate: string;
  sourcesAdditionnelles?: SourceLink[];
  verifie?: boolean;
  precedeMacron?: boolean;
}

const SEEDS: AcquisitionSeed[] = [
  // -- Alstom-GE saga (3 phases) ------------------------------------------------
  {
    seedKey: "alstom-ge-2015",
    cibleNom: "Alstom Énergie",
    cibleSecteur: SecteurStrategique.ENERGIE,
    cibleSousSecteur: "Turbines à gaz, hydraulique, réseau, nucléaire",
    cibleSiteHistorique: "Belfort / Grenoble",
    acquereurNom: "General Electric",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté",
    dateAnnonce: "2014-04-30",
    dateCloture: "2015-11-02",
    valeurEur: BigInt("9700000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.CONDITIONS,
    ministreReferent: "Emmanuel Macron (Économie)",
    iefDeclenche: true,
    iefReference: "Décret 2014-479 (« décret Montebourg »)",
    contexte:
      "Cession d'environ 70 % du chiffre d'affaires d'Alstom (Power + Grid) à GE pour 9,7 Md€ nets, structurée en 3 coentreprises (réseau, renouvelables, vapeur-nucléaire) avec action spécifique de l'État sur les turbines Arabelle. Engagement GE de 1 000 emplois nets en France à fin 2018, non tenu (≈1 050 suppressions à Belfort).",
    enjeuxSouverainete:
      "Cas fondateur de la doctrine IEF française. Le rapport Marleix (avril 2018, n° 897 rect.) a documenté la défaillance de l'État dans la préservation des intérêts nationaux et nourri toutes les réformes ultérieures (PACTE 2019, décret 2019-1590, décret 2023-1293).",
    contextePolitique:
      "Macron, ministre de l'Économie depuis août 2014, valide le 5 novembre 2014 sous décret Montebourg signé par son prédécesseur. Affaire Pierucci (FCPA, arrestation FBI 2013) pèse en arrière-plan — DOJ amende Alstom 772 M$ en décembre 2014.",
    sourcePrincipale: "GE press release",
    sourceUrl:
      "https://www.ge.com/news/press-releases/ge-completes-acquisition-alstom-power-and-grid-businesses-0",
    sourceDate: "2015-11-02",
    sourcesAdditionnelles: [
      {
        outlet: "Légifrance",
        url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000028933611/",
        date: "2014-05-14",
      },
      {
        outlet: "L'Usine Nouvelle (Marleix)",
        url: "https://www.usinenouvelle.com/article/un-depute-denonce-les-manquements-de-l-etat-sur-alstom-ge.N682814",
        date: "2018-04-19",
      },
    ],
    verifie: true,
    precedeMacron: true,
  },
  {
    seedKey: "alstom-siemens-2019",
    parentSeedKey: "alstom-ge-2015",
    cibleNom: "Alstom Mobilité (projet de fusion ferroviaire)",
    cibleSecteur: SecteurStrategique.AERONAUTIQUE_CIVIL,
    cibleSousSecteur: "Matériel ferroviaire, TGV, signalisation",
    acquereurNom: "Siemens Mobility",
    acquereurPays: PaysAcquereur.ALLEMAGNE,
    acquereurType: "Industriel coté",
    dateAnnonce: "2017-09-26",
    dateCloture: "2019-02-06", // date du veto
    categorie: CategorieAcquisition.VETO_IEF,
    mesureEtat: MesureEtat.VETO,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: false,
    iefReference: "Veto Commission européenne (concurrence)",
    contexte:
      "Projet de « champion européen ferroviaire » Siemens-Alstom interdit par la Commission européenne le 6 février 2019 sur les marchés signalisation et TGV. Le Maire et Altmaier publient le 19 février 2019 un Manifeste franco-allemand pour réformer le contrôle des concentrations.",
    enjeuxSouverainete:
      "Veto européen perçu comme un échec de la doctrine « champion européen » défendue par la France. Précipite le débat sur la révision du règlement concentrations UE — débat toujours en cours en 2026.",
    sourcePrincipale: "Commission européenne IP-19-881",
    sourceUrl: "https://europa.eu/rapid/press-release_IP-19-881_en.htm",
    sourceDate: "2019-02-06",
    verifie: true,
  },
  {
    seedKey: "edf-arabelle-2024",
    parentSeedKey: "alstom-ge-2015",
    cibleNom: "Arabelle Solutions (ex GE Steam Power)",
    cibleSecteur: SecteurStrategique.DEFENSE_NUCLEAIRE,
    cibleSousSecteur: "Turbines vapeur pour réacteurs nucléaires",
    cibleSiteHistorique: "Belfort",
    acquereurNom: "EDF",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Entreprise publique",
    dateAnnonce: "2022-02-10",
    dateCloture: "2024-05-31",
    valeurEur: BigInt("1200000000"),
    categorie: CategorieAcquisition.RACHAT_ETATIQUE,
    mesureEtat: MesureEtat.RACHAT_ETAT,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: false,
    contexte:
      "EDF rachète à GE Steam Power l'activité turbines Arabelle (équipement clé du parc nucléaire français et des SNLE). Symbolique : reprise par la France de l'actif jugé le plus stratégique cédé en 2015. ~3 200 salariés à Belfort.",
    enjeuxSouverainete:
      "Reprise partielle d'un actif IEF dix ans après la cession initiale ; n'inverse pas le déficit (Hydro/Grid demeurent dans GE Vernova spin-off du 2 avril 2024).",
    sourcePrincipale: "Wikipédia — GE Steam Power",
    sourceUrl: "https://fr.wikipedia.org/wiki/GE_Steam_Power",
    sourceDate: "2024-05-31",
    verifie: true,
  },

  // -- Lafarge → Holcim (2015) --------------------------------------------------
  {
    seedKey: "lafarge-holcim-2015",
    cibleNom: "Lafarge SA",
    cibleSecteur: SecteurStrategique.BTP_CIMENT,
    cibleSousSecteur: "Ciment, granulats, béton prêt-à-l'emploi",
    cibleSiteHistorique: "Paris (16e)",
    acquereurNom: "Holcim Ltd",
    acquereurPays: PaysAcquereur.SUISSE,
    acquereurType: "Industriel coté",
    dateAnnonce: "2014-04-07",
    dateCloture: "2015-07-10",
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "« Fusion entre égaux » dans laquelle Holcim absorbe Lafarge. Siège à Jona puis Zug (Suisse) ; 380 suppressions de postes mai 2015, fermeture du siège parisien début 2016 (~420 postes supprimés cumulés Paris + Zurich). Cement non couvert par le décret IEF de l'époque.",
    enjeuxSouverainete:
      "Fleuron du CAC 40 perd son siège social français. Lafarge SA reste coquille juridique pénalement responsable du dossier Syrie (mise en examen 2018, plaidoyer DOJ 778 M$ 2022, condamnation 2026 pour financement du terrorisme).",
    sourcePrincipale: "Holcim press release",
    sourceUrl:
      "https://www.holcim.com/media/media-releases/holcim-and-lafarge-complete-merger-and-create-lafargeholcim-a-new-leader-building-materials-industry",
    sourceDate: "2015-07-10",
    verifie: true,
    precedeMacron: true,
  },

  // -- Technip → FMC (2017) -----------------------------------------------------
  {
    seedKey: "technip-fmc-2017",
    cibleNom: "Technip SA",
    cibleSecteur: SecteurStrategique.ENERGIE,
    cibleSousSecteur: "Ingénierie pétrolière et gazière",
    cibleSiteHistorique: "Paris",
    acquereurNom: "FMC Technologies",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté",
    dateAnnonce: "2016-05-19",
    dateCloture: "2017-01-16",
    valeurEur: BigInt("13000000000"),
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    ministreReferent: "Emmanuel Macron (Économie)",
    iefDeclenche: false,
    contexte:
      "Fusion par échange d'actions Technip + FMC. Domiciliation à Londres (TechnipFMC plc). Macron, alors ministre de l'Économie, défend publiquement la fusion comme compatible avec l'attractivité française (24 mai 2016).",
    enjeuxSouverainete:
      "Fleuron CAC 40 perd son siège social et son ancrage fiscal au profit de Londres. Bpifrance et IFP Énergies dilués. Spin-off partiel Technip Energies relisté à Paris en 2021 atténue (sans annuler) la perte.",
    contextePolitique:
      "Annonce mai 2016 sous gouvernement Hollande/Sapin ; closing janvier 2017 sous gouvernement Cazeneuve, pré-élection présidentielle.",
    sourcePrincipale: "TechnipFMC press release",
    sourceUrl:
      "https://www.technipfmc.com/en/investors/archives/merger/press-releases/fmc-technologies-and-technip-combination-high-court-of-justice-approves-cross-border-merger-and-sets-closing-for-january-16-2017/",
    sourceDate: "2017-01-12",
    verifie: true,
    precedeMacron: true,
  },

  // -- Morpho/Idemia → Advent (2017) -------------------------------------------
  {
    seedKey: "morpho-advent-2017",
    cibleNom: "Safran Identity & Security (Morpho/Idemia)",
    cibleSecteur: SecteurStrategique.BIOMETRIE_IDENTITE,
    cibleSousSecteur:
      "Biométrie, passeports, CNI, AFIS police/gendarmerie, PARAFE",
    cibleSiteHistorique: "Issy-les-Moulineaux",
    acquereurNom: "Advent International (+ Bpifrance minoritaire)",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Capital-investissement",
    dateAnnonce: "2016-09-29",
    dateCloture: "2017-05-31",
    valeurEur: BigInt("2425000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.BPIFRANCE_MINORITAIRE,
    iefDeclenche: true,
    iefReference: "R.153 CMF (sécurité nationale)",
    contexte:
      "Cession par Safran de Morpho à Advent (US PE), fusionné avec Oberthur pour devenir Idemia. Bpifrance entre minoritaire (<10 %) en cover politique. Engagement de cession de CPS imposé par la Commission européenne. Activité détection (Morpho Detection) cédée séparément à Smiths Group (UK, 710 M$).",
    enjeuxSouverainete:
      "Infrastructure d'identité régalienne française (passeports, CNI, AFIS) sous contrôle ultime d'un PE américain. Bpifrance minoritaire = template suivi pour Doliprane 2024.",
    sourcePrincipale: "Safran",
    sourceUrl:
      "https://www.safran-group.com/fr/espace-presse/safran-finalise-cession-ses-activites-didentite-securite-2017-05-31",
    sourceDate: "2017-05-31",
    verifie: true,
  },

  // -- Linxens → Tsinghua (2018) -----------------------------------------------
  {
    seedKey: "linxens-tsinghua-2018",
    cibleNom: "Linxens",
    cibleSecteur: SecteurStrategique.SEMICONDUCTEUR,
    cibleSousSecteur:
      "Microconnecteurs cartes à puce, antennes/inlays RFID (passeports, CB, SIM)",
    cibleSiteHistorique: "Levallois-Perret",
    acquereurNom: "Tsinghua Unigroup",
    acquereurPays: PaysAcquereur.CHINE,
    acquereurType: "Industriel adossé à l'État (Université Tsinghua)",
    dateAnnonce: "2018-06-28",
    dateCloture: "2018-07-18",
    valeurEur: BigInt("2200000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: false,
    contexte:
      "Bercy estime Linxens hors périmètre IEF (« composants passifs »), n'exige aucune condition. Critique publique du député Marleix : composants pourtant intégrés à passeports et CB. Tsinghua en défaut nov. 2020 ; Linxens passe à Beijing Zhiguangxin (Wise Road + JAC) en 2022.",
    enjeuxSouverainete:
      "Catalyseur narratif (corrélation, pas causalité documentée) du décret PACTE 2019-1590 (31 décembre 2019) qui ajoute les semi-conducteurs et abaisse le seuil non-UE à 25 %.",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/article/la-france-autorisera-t-elle-le-chinois-tsinghua-a-croquer-linxens-notre-specialiste-des-composants-de-cartes-a-puces.N725044",
    sourceDate: "2018-06-28",
    verifie: true,
  },

  // -- Manurhin → EDIC/EDGE (2018) ---------------------------------------------
  {
    seedKey: "manurhin-edic-2018",
    cibleNom: "Manurhin",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur: "Machines-outils pour munitions de petit calibre",
    cibleSiteHistorique: "Mulhouse",
    acquereurNom: "EDIC (Émirats arabes unis, depuis 2019 EDGE Group)",
    acquereurPays: PaysAcquereur.EMIRATS_ARABES_UNIS,
    acquereurType: "Conglomérat de défense étatique",
    dateAnnonce: "2018-08-01",
    dateCloture: "2018-08-01",
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Reprise par tribunal de commerce de Mulhouse après redressement judiciaire (juin 2018). Aucune décision IEF publiée malgré le caractère défense. Rebaptisé MHR. Discussions de cession à ARCA Defense (Turquie) signalées en septembre 2025.",
    enjeuxSouverainete:
      "Machines-outils utilisées par ~80 % (auto-déclaratif) des usines de munitions occidentales. Asymétrie IEF documentée : acquéreurs Golfe / Turquie semblent rencontrer moins de scrutin que les acquéreurs US (cf. Photonis 2020, Segault 2023).",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/article/manurhin-repris-par-le-groupe-industriel-emirati-edic.N727384",
    sourceDate: "2018-08-02",
    verifie: true,
  },

  // -- Essilor → Luxottica (2018) ----------------------------------------------
  {
    seedKey: "essilor-luxottica-2018",
    cibleNom: "Essilor International",
    cibleSecteur: SecteurStrategique.SANTE_OTC,
    cibleSousSecteur: "Verres ophtalmiques, montures, distribution optique",
    cibleSiteHistorique: "Charenton-le-Pont",
    acquereurNom: "Luxottica Group / Delfin (famille Del Vecchio)",
    acquereurPays: PaysAcquereur.ITALIE,
    acquereurType: "Family office / industriel coté",
    dateAnnonce: "2017-01-16",
    dateCloture: "2018-10-01",
    valeurEur: BigInt("48000000000"),
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "« Fusion entre égaux » donnant à Delfin ~38,9 % du capital (droits de vote initialement plafonnés à 31 %). Crise de gouvernance Sagnières/Del Vecchio 2019-2020 résolue à l'avantage italien. Bpifrance entre via fonds LAC1 en mars 2021, post-fusion.",
    enjeuxSouverainete:
      "Fleuron CAC 40 sous contrôle de fait italien via « OPA déguisée ». Pattern partagé avec Lafarge 2015, Technip 2017, Stellantis 2021.",
    sourcePrincipale: "Novethic",
    sourceUrl:
      "https://www.novethic.fr/actualite/gouvernance-dentreprise/gouvernance/isr-rse/la-crise-de-gouvernance-d-essilorluxottica-repose-la-question-des-fusions-entre-egaux-147218.html",
    sourceDate: "2019-12-01",
    verifie: true,
  },

  // -- Sentryo → Cisco (2019) --------------------------------------------------
  {
    seedKey: "sentryo-cisco-2019",
    cibleNom: "Sentryo",
    cibleSecteur: SecteurStrategique.CYBERSECURITE,
    cibleSousSecteur: "Cybersécurité industrielle (ICS/SCADA, OIV)",
    cibleSiteHistorique: "Lyon",
    acquereurNom: "Cisco Systems",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté",
    dateAnnonce: "2019-06-06",
    dateCloture: "2019-10-26",
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.CONDITIONS,
    iefDeclenche: true,
    iefReference: "Décret 2018-1057 (cybersécurité ajoutée à la liste IEF)",
    contexte:
      "Premier dossier cyber sous le décret IEF étendu de novembre 2018. Sentryo (financé par Bpifrance) absorbé par Cisco et rebaptisé Cisco Cyber Vision. Approbation IEF confidentielle.",
    enjeuxSouverainete:
      "Pépite cyber Bpifrance-aidée drainée vers les US ; cas-type pour la séquence d'acquisitions cyber post-2019 ciblant des fournisseurs OIV.",
    sourcePrincipale: "Cisco Blogs",
    sourceUrl:
      "https://blogs.cisco.com/news/securing-the-internet-of-things-cisco-announces-intent-to-acquire-sentryo",
    sourceDate: "2019-06-06",
    verifie: true,
  },

  // -- Souriau → Eaton (2019) --------------------------------------------------
  {
    seedKey: "souriau-eaton-2019",
    cibleNom: "Souriau-Sunbank",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur: "Connecteurs aéronautiques et défense (Rafale, Ariane)",
    cibleSiteHistorique: "Versailles / Marolles-en-Brie",
    acquereurNom: "Eaton Corporation",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté (domicilié Irlande)",
    dateAnnonce: "2019-07-22",
    dateCloture: "2019-12-20",
    valeurEur: BigInt("830000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    iefDeclenche: true,
    iefReference: "R.151-3 CMF",
    contexte:
      "Carve-out post-fusion TransDigm/Esterline. Cession en cascade : Esterline (US) → TransDigm (US, mars 2019) → Eaton (US, déc. 2019, 920 M$). Aucune décision IEF publique trouvée malgré l'exposition défense.",
    enjeuxSouverainete:
      "Connecteurs qualifiés défense (Rafale, missiles, Ariane) passent successivement de propriétaire US en propriétaire US sans intervention française visible.",
    sourcePrincipale: "Eaton press release",
    sourceUrl:
      "https://www.eaton.com/us/en-us/company/news-insights/news-releases/2019/eaton-completes-the-acquisition-of-souriau-sunbank-connection-te.html",
    sourceDate: "2019-12-20",
    verifie: true,
  },

  // -- Latécoère → Searchlight (2019) ------------------------------------------
  {
    seedKey: "latecoere-searchlight-2019",
    cibleNom: "Latécoère",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur:
      "Aérostructures, systèmes d'interconnexion (Airbus, Dassault)",
    cibleSiteHistorique: "Toulouse",
    acquereurNom: "Searchlight Capital Partners",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Capital-investissement",
    dateAnnonce: "2019-04-01",
    dateCloture: "2019-12-20",
    valeurEur: BigInt("366000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.CONDITIONS,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: true,
    iefReference: "R.151-3 CMF",
    contexte:
      "Bloc 26 % racheté à Apollo/Monarch/CVI puis OPA. IEF accordé avec engagements (emplois, sites, centres de décision en France ; cession ~10 % de capital sur périmètre défense, jamais publiée). Lettre de 17 députés défense au Premier ministre, occupation Action française à Toulouse. Restructuration CIRI 2023 efface 183 M€ de dette (60 % de PGE garanti par l'État).",
    enjeuxSouverainete:
      "Icône aéronautique toulousaine (1917, héritage Aéropostale) sous contrôle PE américain ; cadrage presse « nouveau scandale Alstom ». Restructuration 2023 écrase le flottant ; effective sortie du contrôle public.",
    sourcePrincipale: "École de Guerre Économique",
    sourceUrl:
      "https://www.ege.fr/infoguerre/2020/09/cas-decole-de-perte-industrielle-france-cas-latecoere",
    sourceDate: "2020-09-01",
    verifie: true,
  },

  // -- Photonis (2 phases) ------------------------------------------------------
  {
    seedKey: "photonis-teledyne-2020",
    cibleNom: "Photonis (tentative Teledyne)",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur: "Tubes intensificateurs de lumière (vision nocturne)",
    cibleSiteHistorique: "Brive-la-Gaillarde",
    acquereurNom: "Teledyne Technologies",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté",
    dateAnnonce: "2019-09-01",
    dateCloture: "2020-12-18", // veto formel
    categorie: CategorieAcquisition.VETO_IEF,
    mesureEtat: MesureEtat.VETO,
    ministreReferent: "Bruno Le Maire (avec Florence Parly)",
    iefDeclenche: true,
    iefReference: "R.151-3 CMF + abaissement temporaire seuil COVID 33 %→25 %",
    contexte:
      "Bercy oppose un veto IEF formel le 18 déc. 2020 — Teledyne se retire en sept. 2020 face aux conditions (entrée Bpifrance, droits de veto). Photonis = fournisseur unique européen de tubes pour les armées française et alliées + instrumentation Laser Mégajoule.",
    enjeuxSouverainete:
      "Cas d'école du veto IEF post-traumatisme Alstom. Précédent invoqué dans Carrefour 2021, Segault 2023.",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/article/bercy-oppose-officiellement-son-veto-au-rachat-de-photonis-par-l-americain-teledyne.N950621",
    sourceDate: "2020-12-18",
    verifie: true,
  },
  {
    seedKey: "photonis-hld-2021",
    parentSeedKey: "photonis-teledyne-2020",
    cibleNom: "Photonis (sauvetage HLD/Bpifrance)",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur: "Tubes intensificateurs de lumière",
    cibleSiteHistorique: "Brive-la-Gaillarde",
    acquereurNom: "HLD Europe + Bpifrance",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Capital-investissement français + état",
    dateAnnonce: "2021-02-16",
    dateCloture: "2021-08-01",
    valeurEur: BigInt("370000000"),
    categorie: CategorieAcquisition.SAUVETAGE_DOMESTIQUE,
    mesureEtat: MesureEtat.ANCRAGE_PARTAGE,
    contexte:
      "Reprise par HLD Europe (PE français) après le veto. Bpifrance entre au capital. ~55 M€ en-dessous de l'offre Teledyne mais souveraineté préservée. Société rebaptisée Exosens, IPO Euronext Paris mai 2024.",
    enjeuxSouverainete:
      "Seul cas connu de « blocked-then-thrived » dans la série post-2017 — IPO réussie 3 ans plus tard. Argument d'efficacité économique du veto IEF.",
    sourcePrincipale: "Ardian",
    sourceUrl:
      "https://www.ardian.com/press-releases/hld-europe-enters-exclusive-discussions-ardian-acquire-photonis",
    sourceDate: "2021-02-16",
    verifie: true,
  },

  // -- Carrefour Couche-Tard (2021) --------------------------------------------
  {
    seedKey: "carrefour-couchetard-2021",
    cibleNom: "Carrefour",
    cibleSecteur: SecteurStrategique.GRANDE_DISTRIBUTION,
    cibleSousSecteur: "Distribution alimentaire",
    cibleSiteHistorique: "Massy",
    acquereurNom: "Alimentation Couche-Tard",
    acquereurPays: PaysAcquereur.CANADA,
    acquereurType: "Industriel coté (Circle K)",
    dateAnnonce: "2021-01-13",
    dateCloture: "2021-01-16",
    valeurEur: BigInt("16200000000"),
    categorie: CategorieAcquisition.RETRAIT_POLITIQUE,
    mesureEtat: MesureEtat.AUCUNE,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: true,
    iefReference: "Décret 2019-1590 (sécurité alimentaire)",
    contexte:
      "Le Maire : « un non poli, mais un non clair et définitif » invoquant la souveraineté alimentaire. Pas d'arrêté formel — Couche-Tard se retire sous signal politique. Aucune décision IEF publiée.",
    enjeuxSouverainete:
      "Première invocation de la souveraineté alimentaire comme motif IEF (étirement doctrinal jamais testé en justice). Précédent pour les revendications « souveraineté économique » ultérieures (EDF re-nationalisation 2022, Atos 2024).",
    contextePolitique:
      "15 mois avant la présidentielle d'avril 2022 ; 105 000 emplois français en jeu ; OPA hostile aurait nourri narratif RN.",
    sourcePrincipale: "Bloomberg",
    sourceUrl:
      "https://www.bloomberg.com/news/articles/2021-01-13/france-says-not-in-favor-of-couche-tard-buying-carrefour",
    sourceDate: "2021-01-13",
    verifie: true,
  },

  // -- Stellantis (PSA-FCA, 2021) ----------------------------------------------
  {
    seedKey: "stellantis-2021",
    cibleNom: "Groupe PSA",
    cibleSecteur: SecteurStrategique.AUTOMOBILE,
    cibleSousSecteur: "Constructeur automobile",
    cibleSiteHistorique: "Rueil-Malmaison",
    acquereurNom: "Fiat Chrysler Automobiles (Exor/Agnelli) → Stellantis NV",
    acquereurPays: PaysAcquereur.PAYS_BAS,
    acquereurType: "Industriel coté",
    dateAnnonce: "2019-12-18",
    dateCloture: "2021-01-16",
    valeurEur: BigInt("38000000000"),
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: true,
    iefReference: "R.151-3 CMF",
    contexte:
      "Fusion 50/50 Peugeot/FCA dans Stellantis NV (Hoofddorp, Pays-Bas). Bpifrance dilué de 12,3 % (PSA pré-fusion) à 6,2 % (Stellantis post). Dongfeng (Chine) 5,6 % ; Exor (Agnelli) 14,4 %, président John Elkann ; Tavares CEO jusqu'à démission 1er déc. 2024.",
    enjeuxSouverainete:
      "Dernier constructeur automobile français indépendant majeur dissous dans une multinationale néerlandaise. Politique industrielle française réduite à un vecteur d'influence parmi italien (Agnelli), américain (FCA), chinois (Dongfeng).",
    sourcePrincipale: "Stellantis press release",
    sourceUrl:
      "https://www.stellantis.com/en/news/press-releases/2021/january/the-merger-of-fca-and-groupe-psa-has-been-completed",
    sourceDate: "2021-01-16",
    verifie: true,
  },

  // -- Talend → Thoma Bravo (2021) ---------------------------------------------
  {
    seedKey: "talend-thomabravo-2021",
    cibleNom: "Talend",
    cibleSecteur: SecteurStrategique.IT_SERVICES_HPC,
    cibleSousSecteur: "Data integration / cloud (French Tech)",
    cibleSiteHistorique: "Suresnes (siège déplacé Redwood City en 2018)",
    acquereurNom: "Thoma Bravo",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Capital-investissement",
    dateAnnonce: "2021-03-10",
    dateCloture: "2021-08-01",
    valeurEur: BigInt("2400000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Take-private NASDAQ. Talend redomicilié US dès 2018 — IEF probablement pas déclenché malgré l'empreinte opérationnelle française (Suresnes, Nantes, Bordeaux). Fusionné avec Qlik en 2023 (Thoma Bravo également).",
    enjeuxSouverainete:
      "Cas d'école de la « redomiciliation pré-cession » comme contournement IEF — angle mort du dispositif R.151-3.",
    sourcePrincipale: "Talend press release",
    sourceUrl:
      "https://www.talend.com/about-us/press-releases/talend-to-be-acquired-by-thoma-bravo-in-a-2-4-billion-transaction/",
    sourceDate: "2021-03-10",
    verifie: true,
  },

  // -- Forvia/Faurecia-Hella (2022) --------------------------------------------
  {
    seedKey: "forvia-hella-2022",
    cibleNom: "Faurecia → Forvia (acquisition de Hella)",
    cibleSecteur: SecteurStrategique.AUTOMOBILE,
    cibleSousSecteur: "Équipement automobile (éclairage, électronique)",
    cibleSiteHistorique: "Nanterre",
    acquereurNom: "Famille Hueck/Roepke (via apport Hella)",
    acquereurPays: PaysAcquereur.ALLEMAGNE,
    acquereurType: "Family office",
    dateAnnonce: "2021-08-14",
    dateCloture: "2022-01-31",
    valeurEur: BigInt("6700000000"),
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Faurecia rachète Hella (60 % bloc familial + tender), pacte familial allemand devient ~9 % de Forvia coté Paris. Dette acquise +4,2 Md€ ; plan « EU FORWARD » 2024 = 10 000 suppressions européennes pesant sur 31 sites français (~11 000 salariés).",
    enjeuxSouverainete:
      "Cas hybride : acquisition sortante française mais introduction permanente d'un bloc familial allemand au capital + restructuration dette-pilotée frappant l'emploi français. Aucune intervention publique visible.",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/article/le-francais-faurecia-acquiert-l-equipementier-auto-allemand-hella.N1132719",
    sourceDate: "2021-08-14",
    verifie: true,
  },

  // -- Sigfox → UnaBiz (2022) --------------------------------------------------
  {
    seedKey: "sigfox-unabiz-2022",
    cibleNom: "Sigfox",
    cibleSecteur: SecteurStrategique.IOT_TELECOM,
    cibleSousSecteur: "Réseau IoT longue portée 0G (ex-licorne French Tech)",
    cibleSiteHistorique: "Labège / Toulouse",
    acquereurNom: "UnaBiz",
    acquereurPays: PaysAcquereur.SINGAPOUR,
    acquereurType: "Industriel privé",
    dateAnnonce: "2022-04-21",
    dateCloture: "2022-04-30",
    valeurEur: BigInt("3300000"),
    categorie: CategorieAcquisition.VENTE_DETRESSE,
    mesureEtat: MesureEtat.AUCUNE,
    ministreReferent: "Bruno Le Maire",
    iefDeclenche: true,
    iefReference: "R.151-3 CMF (temporisation entre-deux-tours présidentiel)",
    contexte:
      "Plan de cession (redressement judiciaire Toulouse) ; UnaBiz reprend les actifs pour 3,3 M€ vs >300 M€ levés cumulés. Bpifrance actionnaire historique wipée. Bercy temporise l'autorisation IEF jusqu'après le second tour présidentiel. UnaBiz France elle-même en redressement sept. 2025.",
    enjeuxSouverainete:
      "Effondrement d'une ex-licorne French Tech présentée comme champion IoT. ~1 % du capital cumulé levé récupéré, ancrage français perdu.",
    contextePolitique:
      "Décision tribunal 21 avril 2022 — entre les deux tours de l'élection présidentielle.",
    sourcePrincipale: "Le Monde Informatique",
    sourceUrl:
      "https://www.lemondeinformatique.fr/actualites/lire-le-rachat-de-sigfox-par-unabiz-bloque-par-bercy-86448.html",
    sourceDate: "2022-04-13",
    verifie: true,
  },

  // -- Bolloré Africa Logistics → MSC (2022) -----------------------------------
  {
    seedKey: "bollore-africa-msc-2022",
    cibleNom: "Bolloré Africa Logistics",
    cibleSecteur: SecteurStrategique.LOGISTIQUE_PORTUAIRE,
    cibleSousSecteur:
      "Concessions portuaires + 3 concessions ferroviaires en Afrique (~21 000 salariés)",
    cibleSiteHistorique: "Puteaux (siège)",
    acquereurNom: "MSC Mediterranean Shipping Company",
    acquereurPays: PaysAcquereur.SUISSE,
    acquereurType: "Famille Aponte (Genève / Naples)",
    dateAnnonce: "2021-12-20",
    dateCloture: "2022-12-21",
    valeurEur: BigInt("5700000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Cession de 42 ports + 3 chemins de fer (Sitarail, Camrail, Benirail). Coïncide avec retraits militaires français (Mali 2022, Burkina 2023, Niger 2023). IEF non applicable (cession sortante d'actifs étrangers).",
    enjeuxSouverainete:
      "Plus grand recul d'infrastructure « Françafrique » depuis la décolonisation. Bolloré Logistics Europe/Asie cédée séparément à CMA CGM (FR, 4,85 Md€, 29 fév. 2024) — repositionnement vers les médias (Vivendi, Hachette).",
    sourcePrincipale: "Le Monde",
    sourceUrl:
      "https://www.lemonde.fr/en/economy/article/2022/12/21/french-tycoon-vincent-bollore-exits-african-ports-and-railways_6008622_19.html",
    sourceDate: "2022-12-21",
    verifie: true,
  },

  // -- Exxelia → HEICO (2023) --------------------------------------------------
  {
    seedKey: "exxelia-heico-2023",
    cibleNom: "Exxelia",
    cibleSecteur: SecteurStrategique.DEFENSE_AEROSPACE,
    cibleSousSecteur:
      "Composants passifs spéciaux (capacités, magnétiques, filtres) — Rafale, Ariane, Barracuda",
    cibleSiteHistorique: "Paris",
    acquereurNom: "HEICO Corporation",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté NYSE",
    dateAnnonce: "2022-07-28",
    dateCloture: "2023-01-05",
    valeurEur: BigInt("453000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.ACTION_DE_PREFERENCE,
    iefDeclenche: true,
    iefReference: "R.151-3 CMF + action de préférence (loi PACTE 2019)",
    contexte:
      "Secondary buyout depuis IK Partners. État français convertit l'action de préférence en action spécifique le 3 août 2023 — droits de veto sur transferts d'IP, de production et de personnel ; siège au conseil. Engagements précis non publiés.",
    enjeuxSouverainete:
      "Mécanisme distinct du veto et des conditions IEF classiques : maintien du contrôle US mais firewall via golden share PACTE. Présenté par les critiques (École de Guerre Économique, Sénat) comme face-saving face à l'extraterritorialité ITAR/EAR/CLOUD Act.",
    sourcePrincipale: "GIFAS",
    sourceUrl:
      "https://www.gifas.fr/press-summary/l-etat-francais-protege-ses-interets-strategiques-dans-exxelia-rachete-par-l-americain-heico",
    sourceDate: "2023-08-03",
    verifie: true,
  },

  // -- Aubert & Duval → consortium FR (2023) -----------------------------------
  {
    seedKey: "aubert-duval-2023",
    cibleNom: "Aubert & Duval",
    cibleSecteur: SecteurStrategique.DEFENSE_NUCLEAIRE,
    cibleSousSecteur:
      "Aciers spéciaux, superalliages, titane (M88, Rafale, Ariane, M51)",
    cibleSiteHistorique: "Pamiers / Les Ancizes / Issoire",
    acquereurNom: "Airbus + Safran + Tikehau ACE Capital",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Consortium industriel + PE souverain",
    dateAnnonce: "2022-02-22",
    dateCloture: "2023-04-28",
    valeurEur: BigInt("95000000"),
    categorie: CategorieAcquisition.SAUVETAGE_DOMESTIQUE,
    mesureEtat: MesureEtat.ACTION_SPECIFIQUE,
    iefDeclenche: true,
    contexte:
      "Cession Eramet → consortium 100 % français orchestrée par l'Élysée + Armées. Engagement modernisation ~300 M€ sur 4 ans. Action spécifique (golden share) initialement portée par Eramet, transférée à A&D au closing.",
    enjeuxSouverainete:
      "Composant clé de la dissuasion (M51) maintenu en mains françaises via activation des clients-actionnaires + fonds Tikehau ACE Capital (Bpifrance LP). Modèle alternatif au veto Photonis/Segault.",
    sourcePrincipale: "Airbus",
    sourceUrl:
      "https://www.airbus.com/en/newsroom/press-releases/2023-04-airbus-safran-and-tikehau-capital-finalise-acquisition-of-aubert",
    sourceDate: "2023-04-28",
    verifie: true,
  },

  // -- Eutelsat-OneWeb (2 phases) ----------------------------------------------
  {
    seedKey: "eutelsat-oneweb-2023",
    cibleNom: "Eutelsat Communications",
    cibleSecteur: SecteurStrategique.TELECOM,
    cibleSousSecteur: "Satellite GEO + LEO post-fusion (réponse Starlink)",
    cibleSiteHistorique: "Issy-les-Moulineaux",
    acquereurNom: "OneWeb (Bharti Global, UK Government, SoftBank, Hanwha)",
    acquereurPays: PaysAcquereur.MULTIPLE,
    acquereurType: "Consortium souverain + industriels",
    dateAnnonce: "2022-07-26",
    dateCloture: "2023-09-28",
    valeurEur: BigInt("3400000000"),
    categorie: CategorieAcquisition.FUSION_DOMICILIATION,
    mesureEtat: MesureEtat.CONDITIONS,
    iefDeclenche: true,
    contexte:
      "Fusion par échange d'actions ; ancrage français (Bpifrance + FSP) dilué ~27,6 % → ~17,6 %. Bharti 21,2 %, UK Government 10,9 % + Special Share, SoftBank 10,9 %.",
    enjeuxSouverainete:
      "Première dilution structurelle de l'ancrage public sur l'actif satellite commercial européen, contre arbitrage scale/LEO.",
    sourcePrincipale: "SpaceNews",
    sourceUrl:
      "https://spacenews.com/eutelsat-completes-multi-orbit-oneweb-merger-after-shareholder-vote/",
    sourceDate: "2023-09-28",
    verifie: true,
  },
  {
    seedKey: "eutelsat-recap-2025",
    parentSeedKey: "eutelsat-oneweb-2023",
    cibleNom: "Eutelsat Group (recapitalisation État)",
    cibleSecteur: SecteurStrategique.TELECOM,
    cibleSousSecteur: "Constellation GEO+LEO",
    acquereurNom: "État français (Bpifrance) + partenaires",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Recapitalisation publique",
    dateAnnonce: "2025-06-29",
    dateCloture: "2025-07-01",
    valeurEur: BigInt("1350000000"),
    categorie: CategorieAcquisition.RACHAT_ETATIQUE,
    mesureEtat: MesureEtat.RECAPITALISATION_ETAT,
    contexte:
      "Effondrement du cours (-70 %+ depuis fusion) ; recapitalisation de 1,35 Md€ portant l'État à ~30 % de facto re-nationalisation 21 mois après la fusion. CEO Berneke remplacé par Fallacher (ex-Orange).",
    enjeuxSouverainete:
      "Inversion partielle de la dilution 2023. Démontre la capacité de l'État à reprendre la main via cours dépréciés plutôt que IEF — coût budgétaire élevé.",
    sourcePrincipale: "CNBC",
    sourceUrl: "https://www.cnbc.com/2025/06/29/eutelsat-europe-starlink.html",
    sourceDate: "2025-06-29",
    verifie: true,
  },

  // -- Segault (2 phases) -------------------------------------------------------
  {
    seedKey: "segault-flowserve-2023",
    cibleNom: "Segault + Velan SAS (tentative Flowserve)",
    cibleSecteur: SecteurStrategique.DEFENSE_NUCLEAIRE,
    cibleSousSecteur:
      "Robinetterie nucléaire qualifiée (SNLE, Charles-de-Gaulle, parc EDF)",
    cibleSiteHistorique: "Mennecy / Lyon",
    acquereurNom: "Flowserve Corporation",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Industriel coté NYSE",
    dateAnnonce: "2023-02-08",
    dateCloture: "2023-10-31", // veto formel
    valeurEur: BigInt("245000000"),
    categorie: CategorieAcquisition.VETO_IEF,
    mesureEtat: MesureEtat.VETO,
    ministreReferent: "Bruno Le Maire (avec Sébastien Lecornu)",
    iefDeclenche: true,
    iefReference: "R.151-3 CMF",
    contexte:
      "Bercy juge insuffisants les engagements de mitigation Flowserve (extraterritorialité Patriot Act / ITAR-EAR sur la dissuasion). Deuxième veto public IEF français contre un investisseur US après Photonis.",
    enjeuxSouverainete:
      "Doctrine consolidée : sous-traitant rang-2 mono-source de la dissuasion = motif suffisant de veto ; engagements US-firm jugés non-crédibles face au risque extraterritorial.",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/article/bercy-bloque-definitivement-la-vente-de-segault-et-de-velan-sas.N2179877",
    sourceDate: "2023-10-31",
    verifie: true,
  },
  {
    seedKey: "segault-framatome-2025",
    parentSeedKey: "segault-flowserve-2023",
    cibleNom: "Segault + Velan SAS (reprise Framatome)",
    cibleSecteur: SecteurStrategique.DEFENSE_NUCLEAIRE,
    acquereurNom: "Framatome (+ TechnicAtome minoritaire)",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Industriel public (EDF / consortium)",
    dateAnnonce: "2025-03-31",
    dateCloture: "2025-03-31",
    valeurEur: BigInt("170000000"),
    categorie: CategorieAcquisition.SAUVETAGE_DOMESTIQUE,
    mesureEtat: MesureEtat.RACHAT_ETAT,
    contexte:
      "Carve-out post-veto : Framatome rachète les filiales françaises de Velan, rétrocède une participation minoritaire à TechnicAtome (CEA/EDF/Naval Group/TechnipFMC). Prix ~170 M€ + 22,5 M€ prêt intra-groupe.",
    enjeuxSouverainete:
      "Issue souveraine après 17 mois de négociation post-veto. Parallèle structurel avec Photonis 2020-2021.",
    sourcePrincipale: "Framatome",
    sourceUrl:
      "https://www.framatome.com/medias/framatome-and-technicatome-announce-the-acquisition-of-segault-sas/?lang=en",
    sourceDate: "2025-03-31",
    verifie: true,
  },

  // -- Believe → EQT/TCV (2024) ------------------------------------------------
  {
    seedKey: "believe-eqt-2024",
    cibleNom: "Believe",
    cibleSecteur: SecteurStrategique.MUSIQUE_DIVERTISSEMENT,
    cibleSousSecteur: "Distribution musicale digitale (French Tech Next40)",
    cibleSiteHistorique: "Paris",
    acquereurNom: "EQT + TCV + Denis Ladegaillerie (consortium)",
    acquereurPays: PaysAcquereur.SUEDE,
    acquereurType: "Capital-investissement + fondateur",
    dateAnnonce: "2024-02-12",
    dateCloture: "2025-07-22",
    valeurEur: BigInt("1500000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "OPA simplifiée à 15 €/action (puis 17,20 € squeeze-out 2025) après IPO 2021 à 19,50 €. Contre-offre WMG (US) « ≥17 € » non concrétisée. Distribution musicale non listée IEF.",
    enjeuxSouverainete:
      "33 mois entre IPO Euronext et take-private étranger ; minoritaires perdants pendant que le fondateur roule dans la nouvelle structure suédoise/US.",
    sourcePrincipale: "Music Business Worldwide",
    sourceUrl:
      "https://www.musicbusinessworldwide.com/eqt-denis-ladegaillerie-and-tcv-launch-1-64-billion-takeover-bid-for-believe/",
    sourceDate: "2024-02-12",
    verifie: true,
  },

  // -- Vivendi 4-way split (2024) ----------------------------------------------
  {
    seedKey: "vivendi-split-2024",
    cibleNom: "Vivendi SE",
    cibleSecteur: SecteurStrategique.MEDIA_AUDIOVISUEL,
    cibleSousSecteur: "TV, publicité, édition (Bolloré-contrôlé)",
    cibleSiteHistorique: "Paris",
    acquereurNom: "Scission Bolloré-pilotée (Canal+ → Londres, Havas → Amsterdam)",
    acquereurPays: PaysAcquereur.MULTIPLE,
    acquereurType: "Auto-scission de l'actionnaire de contrôle",
    dateAnnonce: "2023-12-13",
    dateCloture: "2024-12-16",
    categorie: CategorieAcquisition.SCISSION_DOMICILIATION,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Scission en 4 entités : Vivendi (Paris résiduel), Canal+ (LSE), Havas N.V. (Amsterdam), Louis Hachette Group (Euronext Growth Paris). EGM 9 déc. 2024 (97,5 %). Cour d'appel Paris 22 avril 2025 ordonne squeeze-out, Cassation 28 nov. 2025 annule et renvoie — obligation actuellement suspendue.",
    enjeuxSouverainete:
      "Deux fleurons médias français listés à l'étranger sans OPA étrangère — cas inverse aux fusions Lafarge/Technip/Essilor, mais conséquence similaire pour la place de Paris (« fuite des cotations »).",
    sourcePrincipale: "Vivendi",
    sourceUrl:
      "https://www.vivendi.com/en/press-release/vivendis-shareholders-meeting-approves-the-spin-off-project-by-more-than-97-5/",
    sourceDate: "2024-12-09",
    verifie: true,
  },

  // -- Sanofi/Opella → CD&R (2025) ---------------------------------------------
  {
    seedKey: "opella-cdr-2025",
    cibleNom: "Opella (ex-Sanofi Consumer Healthcare)",
    cibleSecteur: SecteurStrategique.SANTE_OTC,
    cibleSousSecteur: "OTC (Doliprane, Maalox, Allegra, Dulcolax)",
    cibleSiteHistorique: "Lisieux / Compiègne",
    acquereurNom: "Clayton, Dubilier & Rice (+ Bpifrance 1,8 %)",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Capital-investissement",
    dateAnnonce: "2024-10-21",
    dateCloture: "2025-04-30",
    valeurEur: BigInt("16000000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.BPIFRANCE_MINORITAIRE,
    iefDeclenche: true,
    iefReference: "Décret 2020-892 (élargissement santé COVID)",
    contexte:
      "CD&R 50 %, Sanofi 48,2 %, Bpifrance 1,8 % (+ siège conseil). Conditions IEF : 1 700 emplois français protégés, pénalité 40 M€/site si arrêt de production Lisieux/Compiègne.",
    enjeuxSouverainete:
      "Doliprane = symbole de souveraineté sanitaire. Template définitif : 1,8 % Bpifrance + pénalité par site = « optique souveraineté sans contrôle d'État ».",
    contextePolitique:
      "~3 semaines après formation gouvernement Barnier (sept. 2024 — censuré 4 déc. 2024). Opposition cross-spectrum : LFI/PS/RN/LR.",
    sourcePrincipale: "Sanofi",
    sourceUrl:
      "https://www.sanofi.com/en/media-room/press-releases/2025/2025-04-30-11-00-00-3071167",
    sourceDate: "2025-04-30",
    verifie: true,
  },

  // -- Atos → Bull → État (2026) -----------------------------------------------
  {
    seedKey: "atos-bull-etat-2026",
    cibleNom: "Atos Advanced Computing (Bull SAS)",
    cibleSecteur: SecteurStrategique.IT_SERVICES_HPC,
    cibleSousSecteur:
      "Supercalcul (Tera 1000, EXA1, Alice Recoque), HPC souverain CEA-DAM",
    cibleSiteHistorique: "Bezons / Les Clayes-sous-Bois",
    acquereurNom: "État français (Agence des Participations de l'État)",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Rachat étatique direct",
    dateAnnonce: "2024-11-25",
    dateCloture: "2026-03-31",
    valeurEur: BigInt("410000000"),
    categorie: CategorieAcquisition.RACHAT_ETATIQUE,
    mesureEtat: MesureEtat.RACHAT_ETAT,
    ministreReferent: "Antoine Armand → Éric Lombard (Économie) + Sébastien Lecornu (Armées)",
    iefDeclenche: false,
    contexte:
      "Issue post-saga Atos (échec Křetínský, Airbus, Onepoint, plan créanciers). État rachète Bull (HPC + Quantum + Business Computing & AI ; ~2 500 salariés, ~800 M€ CA 2025) pour 300 M€ + 110 M€ earn-outs. BDS cyber/Mission Critical reste dans Atos pour l'instant.",
    enjeuxSouverainete:
      "Cas le plus serré : un magnat tchèque a failli contrôler le sous-traitant des supercalculateurs nucléaires français. Précédent rachat étatique direct comme alternative au veto IEF.",
    sourcePrincipale: "Atos press release",
    sourceUrl:
      "https://www.atosgroup.com/en/press/atos-group-completes-sale-bull-its-advanced-computing-activities-french-state",
    sourceDate: "2026-03-31",
    verifie: true,
  },

  // -- Soitec / NSIG (2016, ancrage domestique) --------------------------------
  {
    seedKey: "soitec-nsig-2016",
    cibleNom: "Soitec",
    cibleSecteur: SecteurStrategique.SEMICONDUCTEUR,
    cibleSousSecteur: "Substrats SOI (RF-SOI iPhone, FD-SOI auto/IoT, photonique)",
    cibleSiteHistorique: "Bernin (Isère)",
    acquereurNom: "NSIG (Shanghai / Big Fund) + ancrage domestique CEA + Bpifrance",
    acquereurPays: PaysAcquereur.CHINE,
    acquereurType: "Fonds souverain + investisseurs publics français",
    dateAnnonce: "2016-02-10",
    dateCloture: "2016-05-31",
    valeurEur: BigInt("152000000"),
    categorie: CategorieAcquisition.ANCRAGE_DOMESTIQUE,
    mesureEtat: MesureEtat.STANDSTILL,
    iefDeclenche: true,
    iefReference: "Décret 2014-479 (Montebourg)",
    contexte:
      "Recapitalisation 152 M€ : NSIG, CEA Investissement, Bpifrance ~14,5 % chacun. Standstill empêchant NSIG d'augmenter sa participation, exclusion d'un comité des affaires sensibles. NSIG passe sous 10 % en mars 2023 ; ancrage français combiné ~22,7 % en 2026.",
    enjeuxSouverainete:
      "Précédent canonique d'« ancrage domestique » — capital ouvert au stratégique chinois mais gouvernance firewall. Modèle alternatif au veto (Photonis/Segault) et aux conditions (Doliprane).",
    sourcePrincipale: "Soitec",
    sourceUrl:
      "https://www.globenewswire.com/news-release/2016/02/10/1713067/0/fr/SOITEC-rojet-de-deux-augmentations-de-capital-successives-de-Soitec-pour-un-montant-total-compris-entre-130-et-180-millions-avec-le-soutien-de-CEA-Investissement-NSIG-et-Bpifrance.html",
    sourceDate: "2016-02-10",
    verifie: true,
    precedeMacron: true,
  },

  // -- SFR / Altice (3 phases) -------------------------------------------------
  {
    seedKey: "sfr-altice-2014",
    cibleNom: "SFR (Société Française du Radiotéléphone)",
    cibleSecteur: SecteurStrategique.TELECOM,
    cibleSousSecteur: "Opérateur télécom #2 (mobile + fibre)",
    cibleSiteHistorique: "Paris",
    acquereurNom: "Altice / Patrick Drahi",
    acquereurPays: PaysAcquereur.LUXEMBOURG,
    acquereurType: "Holding multi-domiciliée (Drahi : Genève / FR-IL-PT)",
    dateAnnonce: "2014-04-05",
    dateCloture: "2014-11-27",
    valeurEur: BigInt("17000000000"),
    categorie: CategorieAcquisition.CESSION_ETRANGERE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Vivendi cède SFR à Altice (Drahi/Numericable) battant Bouygues. Pré-Décret 2019-1590 — telecoms pas encore liste sensible. Altice se réorganise 2018 (Altice Europe Amsterdam ; Altice USA NYSE), Altice Europe privatisée 2021.",
    enjeuxSouverainete:
      "Opérateur télécom #2 français passe sous holding luxembourgeoise/néerlandaise pendant 12 ans. Fait jurisprudence : changement de contrôle pré-PACTE 2019 hors filet IEF moderne.",
    sourcePrincipale: "Bloomberg",
    sourceUrl:
      "https://www.bloomberg.com/news/articles/2014-04-05/vivendi-agrees-to-sell-sfr-to-altice-in-23-billion-deal",
    sourceDate: "2014-04-05",
    verifie: true,
    precedeMacron: true,
  },
  {
    seedKey: "altice-debt-2024",
    parentSeedKey: "sfr-altice-2014",
    cibleNom: "Altice France (restructuration dette)",
    cibleSecteur: SecteurStrategique.TELECOM,
    acquereurNom: "Consortium créanciers (largement anglo-américain)",
    acquereurPays: PaysAcquereur.MULTIPLE,
    acquereurType: "Créanciers obligataires",
    dateAnnonce: "2024-03-20",
    dateCloture: "2025-02-28",
    categorie: CategorieAcquisition.RESTRUCTURATION_DETTE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Crise dette ~60 Md$ groupe Altice. Plan final : ~8,6 Md€ de dette annulée, créanciers garantis prennent 31 % du capital, Drahi conserve 55 %. Drahi déplace plusieurs Md€ d'actifs hors portée des créanciers en amont des négociations.",
    enjeuxSouverainete:
      "Test inédit : changement de contrôle de fait via dette plutôt que vente — IEF applicable ? Aucune intervention publique visible 2024-2025.",
    sourcePrincipale: "Bloomberg",
    sourceUrl:
      "https://www.bloomberg.com/news/articles/2024-12-12/altice-france-s-creditors-depart-paris-without-debt-deal",
    sourceDate: "2024-12-12",
    verifie: true,
  },
  {
    seedKey: "sfr-french-operators-2026",
    parentSeedKey: "sfr-altice-2014",
    cibleNom: "SFR (négociations exclusives Bouygues + Iliad + Orange)",
    cibleSecteur: SecteurStrategique.TELECOM,
    acquereurNom: "Bouygues Telecom + Iliad/Free + Orange (consortium)",
    acquereurPays: PaysAcquereur.FRANCE,
    acquereurType: "Trois opérateurs domestiques en consortium",
    dateAnnonce: "2026-04-17",
    categorie: CategorieAcquisition.SAUVETAGE_DOMESTIQUE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: true,
    iefReference: "R.151-3 CMF (telecom + cyber post-2019)",
    contexte:
      "Négociations exclusives ouvertes le 17 avril 2026 (exclusivité jusqu'au 15 mai 2026). Découpage probable de SFR entre les trois opérateurs français restants. IEF quasi certain pour valider la transaction.",
    enjeuxSouverainete:
      "Re-domiciliation complète du contrôle en France après 12 ans hors hexagone. Inverse la séquence Altice 2014. Issue en cours.",
    sourcePrincipale: "Orange",
    sourceUrl:
      "https://www.orange.com/en/press-release/bouygues-telecom-free-groupe-iliad-et-orange-entrent-en-negociations-exclusives-avec-le-groupe-altice-france-pour-lacquisition-de-sfr-461112-461112",
    sourceDate: "2026-04-17",
    verifie: false,
  },

  // -- Polytechnyl → Lone Star (2026) ------------------------------------------
  {
    seedKey: "polytechnyl-lonestar-2026",
    cibleNom: "Polytechnyl",
    cibleSecteur: SecteurStrategique.CHIMIE_MATERIAUX,
    cibleSousSecteur:
      "Production intégrée de nylon (compound polyamide + filature) — Vallée de la chimie",
    cibleSiteHistorique: "Saint-Fons (Rhône) + Valence (Drôme)",
    acquereurNom: "Lone Star Funds",
    acquereurPays: PaysAcquereur.ETATS_UNIS,
    acquereurType: "Capital-investissement (PE distressed)",
    dateAnnonce: "2026-04-23",
    dateCloture: "2026-04-27",
    valeurEur: BigInt("10100000"),
    categorie: CategorieAcquisition.VENTE_DETRESSE,
    mesureEtat: MesureEtat.AUCUNE,
    iefDeclenche: false,
    contexte:
      "Plan de cession validé par le tribunal de commerce de Lyon le 27 avril 2026. Lone Star ne reprend que les brevets, la marque Technyl et la R&D — abandonne les outils de production et l'immobilier. 72 emplois préservés sur ~550 (Saint-Fons), 88 emplois supprimés à Valence (filature arrêtée le 23 avril, hors périmètre). Ancien propriétaire : Domo Chemicals (Belgique, 2020) ; avant : Solvay (2011-2020). Stocks valorisés ~17 M€, soit plus que le prix de cession.",
    enjeuxSouverainete:
      "Fin de la production intégrée de nylon en France — Saint-Fons fabriquait les compounds à partir de polymères bruts, Valence les transformait en fil. Risque collatéral : Saint-Fons abritait une chaufferie alimentant les voisins de la Vallée de la chimie. Cas d'école de cession-IP étrangère où l'actif productif français est volontairement laissé en déshérence. Patron CFE-CGC : « On subit une décision écœurante » ; intersyndicale dénonce « le manque de soutien de l'État ». Aurélie Trouvé (LFI) : « Bercy, la BPI, le tribunal de commerce et tout le système macroniste ont laissé faire ».",
    contextePolitique:
      "Décision le 27 avril 2026, alors que la doctrine de réindustrialisation du gouvernement Lecornu II est mise à l'épreuve. Aucune intervention publique IEF visible malgré le caractère stratégique de la chimie de spécialité.",
    sourcePrincipale: "L'Usine Nouvelle",
    sourceUrl:
      "https://www.usinenouvelle.com/chimie/cest-la-fin-dune-production-integree-de-nylon-en-france-polytechnyl-est-repris-par-le-fonds-americain-lone-star-pour-10-millions-deuros-mais-sans-ses-deux-usines.BPRCQ7WLPBBPRCDT6WTWOVGJCY.html",
    sourceDate: "2026-04-28",
    sourcesAdditionnelles: [
      {
        outlet: "France Info",
        url: "https://www.franceinfo.fr/economie/industrie/l-etat-nous-a-laisses-tomber-les-syndicats-de-l-entreprise-chimique-polytechnyl-denoncent-une-reprise-a-minima-par-un-fonds-d-investissement_7969814.html",
        date: "2026-04-28",
      },
      {
        outlet: "Lyon Capitale",
        url: "https://www.lyoncapitale.fr/actualite/polytechnyl-a-saint-fons-l-offre-de-reprise-acceptee-seulement-72-emplois-sauves-sur-550",
        date: "2026-04-27",
      },
      {
        outlet: "Tribune de Lyon",
        url: "https://tribunedelyon.fr/economie/polytechnyl-cession-500-salaries-sur-le-carreau-et-fragilise-vallee-chimie/",
        date: "2026-04-27",
      },
    ],
    verifie: true,
  },
];

async function seedAcquisitions() {
  await logIngestion("seed-acquisitions-etrangeres", async () => {
    let upserted = 0;
    const idByKey = new Map<string, string>();

    for (const seed of SEEDS.filter((s) => !s.parentSeedKey)) {
      const id = await upsertSeed(seed, idByKey);
      idByKey.set(seed.seedKey, id);
      upserted++;
    }
    for (const seed of SEEDS.filter((s) => s.parentSeedKey)) {
      const id = await upsertSeed(seed, idByKey);
      idByKey.set(seed.seedKey, id);
      upserted++;
    }

    return {
      rowsIngested: upserted,
      rowsTotal: SEEDS.length,
      metadata: {
        parents: SEEDS.filter((s) => !s.parentSeedKey).length,
        children: SEEDS.filter((s) => s.parentSeedKey).length,
      },
    };
  });
}

async function upsertSeed(
  seed: AcquisitionSeed,
  idByKey: Map<string, string>,
): Promise<string> {
  const parentId = seed.parentSeedKey ? idByKey.get(seed.parentSeedKey) : null;
  if (seed.parentSeedKey && !parentId) {
    throw new Error(`Parent ${seed.parentSeedKey} not found for ${seed.seedKey}`);
  }

  // Match on (cibleNom, dateAnnonce, categorie) — same triple = update
  const existing = await prisma.acquisitionEtrangere.findFirst({
    where: {
      cibleNom: seed.cibleNom,
      dateAnnonce: seed.dateAnnonce ? new Date(seed.dateAnnonce) : null,
      categorie: seed.categorie,
    },
    select: { id: true },
  });

  const data = {
    cibleNom: seed.cibleNom,
    cibleSecteur: seed.cibleSecteur,
    cibleSousSecteur: seed.cibleSousSecteur ?? null,
    cibleSiteHistorique: seed.cibleSiteHistorique ?? null,
    acquereurNom: seed.acquereurNom,
    acquereurPays: seed.acquereurPays,
    acquereurType: seed.acquereurType ?? null,
    dateAnnonce: seed.dateAnnonce ? new Date(seed.dateAnnonce) : null,
    dateCloture: seed.dateCloture ? new Date(seed.dateCloture) : null,
    valeurEur: seed.valeurEur ?? null,
    categorie: seed.categorie,
    mesureEtat: seed.mesureEtat ?? MesureEtat.AUCUNE,
    ministreReferent: seed.ministreReferent ?? null,
    iefDeclenche: seed.iefDeclenche ?? null,
    iefReference: seed.iefReference ?? null,
    contexte: seed.contexte,
    enjeuxSouverainete: seed.enjeuxSouverainete,
    contextePolitique: seed.contextePolitique ?? null,
    sourcePrincipale: seed.sourcePrincipale,
    sourceUrl: seed.sourceUrl,
    sourceDate: new Date(seed.sourceDate),
    sourcesAdditionnelles: seed.sourcesAdditionnelles
      ? (seed.sourcesAdditionnelles as unknown as object)
      : undefined,
    verifie: seed.verifie ?? false,
    precedeMacron: seed.precedeMacron ?? false,
    parentDealId: parentId ?? null,
  };

  if (existing) {
    const updated = await prisma.acquisitionEtrangere.update({
      where: { id: existing.id },
      data,
    });
    return updated.id;
  }
  const created = await prisma.acquisitionEtrangere.create({ data });
  return created.id;
}

seedAcquisitions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
