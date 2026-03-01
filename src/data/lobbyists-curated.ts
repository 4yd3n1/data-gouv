/**
 * Curated power lobbyist profiles — sourced from HATVP registry + public records.
 *
 * Methodology:
 *   - Raw HATVP data contains 3,883 registered organizations.
 *   - Mutualité Française appears as 13+ autonomous regional entities (legal requirement
 *     under loi Sapin II). They are consolidated here into a single entry.
 *   - For-hire public affairs firms (cabinets de conseil) are shown separately — their
 *     clients are NOT disclosed under French law; the firm is the registered lobbyist.
 *   - Ranking reflects real influence (legislative wins, political access, sector weight),
 *     not raw action count.
 */

export type LobbyistType =
  | "federation-patronale"
  | "syndicat-professionnel"
  | "federation-sectorielle"
  | "corps-professionnel"
  | "cabinet-conseil";

export interface CuratedLobbyist {
  /** Unique ID for rendering */
  id: string;
  /** Display name (may differ from DB nom for consolidated entries) */
  nom: string;
  /** HATVP SIREN(s) — one or more for consolidated entries */
  sirens: string[];
  type: LobbyistType;
  secteur: string;
  /** Current president or DG */
  leader: string;
  /** Key members or scale indicator */
  membres?: string;
  /** Documented relationship with the Macron government */
  connexionMacron?: string;
  /** Most significant legislative win under Macron */
  victoireLegislative?: string;
  /** 1-sentence description */
  note: string;
  /** Conflict-of-interest warning */
  alerte?: string;
}

/** Color scheme per type */
export const TYPE_CONFIG: Record<
  LobbyistType,
  { label: string; color: string; bg: string; border: string }
> = {
  "federation-patronale": {
    label: "Fédération patronale",
    color: "text-amber",
    bg: "bg-amber/5",
    border: "border-amber/20",
  },
  "syndicat-professionnel": {
    label: "Syndicat professionnel",
    color: "text-amber",
    bg: "bg-amber/5",
    border: "border-amber/20",
  },
  "federation-sectorielle": {
    label: "Fédération sectorielle",
    color: "text-blue",
    bg: "bg-blue/5",
    border: "border-blue/20",
  },
  "corps-professionnel": {
    label: "Corps professionnel",
    color: "text-teal",
    bg: "bg-teal/5",
    border: "border-teal/20",
  },
  "cabinet-conseil": {
    label: "Cabinet de conseil",
    color: "text-rose",
    bg: "bg-rose/5",
    border: "border-rose/20",
  },
};

/**
 * All SIREN IDs belonging to the Mutualité Française network.
 * They register separately (each is an autonomous legal entity) but act in
 * coordination under FNMF national doctrine.
 */
export const MUTUALITE_SIRENS = [
  "304426240", // Fédération Nationale (FNMF)
  "523445690", // PACA
  "442250304", // Nouvelle-Aquitaine (ex-Aquitaine)
  "325412930", // Bourgogne-Franche-Comté
  "333645034", // Centre-Val de Loire
  "390917664", // Auvergne-Rhône-Alpes
  "443873930", // Bretagne
  "444628275", // Normandie
  "518102975", // Île-de-France
  "443811211", // Hauts-de-France
  "352137848", // Pays de la Loire
  "438320632", // Occitanie
  "517784088", // Grand Est
];

/**
 * Tier 1 — Direct interest groups (lobby on their own behalf).
 * Ordered by real influence, not raw action count.
 */
export const POWER_LOBBYISTS: CuratedLobbyist[] = [
  {
    id: "mutualite-francaise",
    nom: "Mutualité Française",
    sirens: MUTUALITE_SIRENS,
    type: "federation-sectorielle",
    secteur: "Santé · Protection sociale",
    leader: "Éric Chenut (président, depuis oct. 2021)",
    membres: "38 millions d'assurés · 400+ mutuelles membres",
    connexionMacron:
      "Thierry Beaudet (ex-président FNMF) nommé président du CESE par Macron en 2021 — absorption dans les corps consultatifs d'État.",
    victoireLegislative:
      "100% Santé (2019) — co-négocié avec le gouvernement ; résistance victorieuse à la « Grande Sécu ».",
    note:
      "Plus grand réseau d'assurance complémentaire santé en France. S'enregistre en 13 entités régionales autonomes, ce qui multiplie la visibilité HATVP sans masquer la coordination nationale.",
  },
  {
    id: "medef",
    nom: "MEDEF",
    sirens: ["784668618"],
    type: "federation-patronale",
    secteur: "Droit du travail · Fiscalité · Retraites",
    leader: "Patrick Martin (président depuis juillet 2023)",
    membres: "~75 fédérations de branche · 102 MEDEF territoriaux",
    connexionMacron:
      "Geoffroy Roux de Bezieux (prédécesseur) soutien public explicite aux réformes Macron 2017–2023. Le MEDEF a co-rédigé techniquement les Ordonnances Travail.",
    victoireLegislative:
      "Ordonnances Macron (2017), suppression CVAE (2023), réforme des retraites à 64 ans (2023), réduction IS 33% → 25%.",
    note:
      "Première organisation patronale de France. Budget estimé à 35–50 M€/an. L'UIMM (fédération métallurgie) en est historiquement le financeur dominant — impliquée dans le scandale des caisses noires (600 M€, 2007).",
    alerte:
      "Scandale UIMM (2007) : fonds occultes de 600 M€ utilisés notamment pour financer les activités du CNPF/MEDEF. Denis Gautier-Sauvagnac condamné.",
  },
  {
    id: "fnsea",
    nom: "FNSEA",
    sirens: ["784854937"],
    type: "syndicat-professionnel",
    secteur: "Agriculture · PAC · Eau · Pesticides",
    leader: "Arnaud Rousseau (président depuis avril 2023)",
    membres: "~220 000 agriculteurs · 92 FDSEA départementales · JA (Jeunes Agriculteurs)",
    connexionMacron:
      "Révolte agricole janv.–fév. 2024 : Gabriel Attal reçoit la FNSEA en 48h et annonce un package de concessions de ~600 M€ (gel GNR, pesticides, PAC anticipée).",
    victoireLegislative:
      "Abandon de la promesse glyphosate de Macron (2017→ jamais appliquée), réautorisation néonicotinoïdes betterave sucrière (2020), gel taxe GNR (2024), clause miroir imports Ukraine.",
    note:
      "Monopole quasi-institutionnel via les Chambres d'agriculture (élections avec ~55% des sièges FNSEA/JA). Capacité de mobilisation nationale éprouvée en 2024.",
    alerte:
      "Arnaud Rousseau cumule la présidence de la FNSEA ET celle du groupe Avril (ex-Sofiprotéol, CA ~7 Mds€, acheteur de céréales). Conflit structurel dénoncé par la Confédération Paysanne.",
  },
  {
    id: "ffa",
    nom: "Fédération Française de l'Assurance",
    sirens: ["784409013"],
    type: "federation-sectorielle",
    secteur: "Assurance · Santé complémentaire · Catastrophes naturelles",
    leader: "Florence Lustman (présidente 2021–2024) · Stéphane Pénet (DG permanent)",
    membres: "AXA, Covéa, Allianz, Groupama, CNP, BNP Cardif, SG Assurances — 97% des cotisations françaises",
    connexionMacron:
      "Florence Lustman est ancienne inspectrice générale des finances (IGF) — réseau hauts fonctionnaires. Participations au CCSF (Banque de France) et aux groupes de travail PLFSS.",
    victoireLegislative:
      "Blocage de la « Grande Sécu » (2021–2022) — marché de 40 Mds€ de primes préservé. Loi Baudu CatNat (2021) : surprime 12 % → 20 %. PACTE 2019 : création du PER (> 100 Mds€ capté par les assureurs en 2024).",
    note:
      "Née en 2016 de la fusion FFSA + GEMA. Réunit assureurs commerciaux ET mutuelles assurances sous la même bannière de lobbying.",
  },
  {
    id: "cnb",
    nom: "Conseil National des Barreaux",
    sirens: ["391576964"],
    type: "corps-professionnel",
    secteur: "Justice · Aide juridictionnelle · Secret professionnel",
    leader: "Jérôme Hercé (président depuis janv. 2024)",
    membres: "73 000 avocats · 163 barreaux en France",
    connexionMacron:
      "Relation tendue avec Belloubet (2017–2020). Ambivalente avec Dupond-Moretti (lui-même avocat 2020–2024). Grève nationale jan.–fév. 2021 contre l'intégration de la CNBF au régime universel.",
    victoireLegislative:
      "SUR abandonné (2021) : CNBF préservé hors réforme universelle. LOPJ 2023 : UV portée à 36 €, aide à l'accès au droit créée. Ordonnance AMLD5 (2020) : secret professionnel maintenu vs TRACFIN. Loi confiance judiciaire (2021) : protection des perquisitions en cabinet.",
    note:
      "Organisme de droit public, pas une association commerciale. Lobby structurellement distinct : agit en régulateur ET en défenseur de la profession. Dépense déclarée HATVP ~50–200 K€/an.",
  },
  {
    id: "fbf",
    nom: "Fédération Bancaire Française",
    sirens: ["434987582"],
    type: "federation-sectorielle",
    secteur: "Banque · Crédit · Épargne · Réglementation prudentielle",
    leader: "Slawomir Krupa (prés. CA, CEO Société Générale) · DG permanent",
    membres: "BNP Paribas, Société Générale, Crédit Agricole, BPCE, Crédit Mutuel, La Banque Postale",
    connexionMacron:
      "Emmanuel Macron a travaillé chez Rothschild & Cie (2008–2012). Marie-Anne Barbat-Layani, directrice générale de la FBF (2013–2022), a été nommée présidente de l'AMF par décret du Président de la République en 2022.",
    victoireLegislative:
      "Mensualisation du taux d'usure (arrêté jan. 2023) — demande FBF exacte traduite en décret, marché hypothécaire débloqué. Extension TTF bloquée 2017–2024 (dérivés non taxés). CRR3/Bâle III (2023) : transition output floor 10 ans, carve-out hypothèques françaises.",
    note:
      "Budget ~20–30 M€/an. Coordonne avec la FFA via Paris EUROPLACE et le CCSF sur les dossiers de finance durable (CSRD) et d'open banking (PSD2).",
    alerte:
      "Marie-Anne Barbat-Layani a dirigé la FBF (2013–2022), principal syndicat bancaire, avant d'être nommée présidente de l'AMF par décret présidentiel en 2022 — l'AMF étant le régulateur des marchés financiers pour les établissements membres de la FBF.",
  },
  {
    id: "ser",
    nom: "Syndicat des Énergies Renouvelables",
    sirens: ["419710280"],
    type: "federation-sectorielle",
    secteur: "Énergie renouvelable · Permitting · Appels d'offres CRE",
    leader: "Alexandre Roesch (délégué général)",
    membres: "EDF Renouvelables, Engie Green, TotalEnergies Renouvelables, RWE, Voltalia, Neoen",
    connexionMacron:
      "Consultations officielles lors de la loi LAURE (2022–2023). Participation au Conseil Supérieur de l'Énergie. Position alignée sur le plan REPowerEU.",
    victoireLegislative:
      "Loi Énergie-Climat 2019 : objectifs ENR 40 % codifiés, base des AO CRE. Loi LAURE (mars 2023) : présomption RIIPM, zones d'accélération ENR, suppression d'un degré de juridiction — co-rédigée avec la filière. LFR 2022 : producteurs ENR sous CCR exclus de la windfall tax.",
    note:
      "~500 membres. Secteur ENR représente ~15 Mds€ d'investissement annuel en France. Membre WindEurope et SolarPower Europe pour le plaidoyer bruxellois.",
  },
];

/**
 * Tier 2 — For-hire public affairs firms.
 * These firms lobby on behalf of undisclosed paying clients.
 * Their high action count reflects client volume, not institutional power.
 */
export const CONSULTING_LOBBYISTS: CuratedLobbyist[] = [
  {
    id: "boury-tallon",
    nom: "Boury Tallon & Associés",
    sirens: ["502999626"],
    type: "cabinet-conseil",
    secteur: "Multi-sectoriel (pour compte de tiers)",
    leader: "Paul Boury (prés. fondateur) · Pascal Tallon (directeur général associé)",
    note:
      "Fondé en 1987 par Paul Boury (HEC), développé avec Pascal Tallon (HEC, 2000), renommé en 2012. Paul Boury a co-fondé l'AFCL en 1991, l'association professionnelle des lobbyistes français, dont Pascal Tallon a été président 2011–2013. L'un des cabinets les plus actifs en France par volume HATVP. Clients non divulgués par la loi.",
    alerte:
      "Le cabinet est co-dirigé par les fondateurs et anciens présidents de l'AFCL — l'organe d'autorégulation de la profession de lobbyiste. Paul Boury a siégé aux instances qui définissent les règles éthiques du secteur tout en exerçant la profession.",
  },
  {
    id: "anthenor",
    nom: "Anthenor Public Affairs",
    sirens: ["450089107"],
    type: "cabinet-conseil",
    secteur: "Santé · Transports · Agriculture · Sport",
    leader: "Timothé de Romance (PDG depuis 2021)",
    connexionMacron:
      "Fondé en 2003 par Gilles Lamarque — ancien responsable des relations avec les collectivités locales au MEDEF, directeur des affaires européennes chez Publicis, puis directeur des affaires publiques chez Renault. Timothé de Romance enseigne le lobbying à Sciences Po Paris.",
    note:
      "Boutique spécialisée en secteurs réglementés : pharma (ANSM, CEPS), transport aérien et ferroviaire (DGAC, DGITM), agriculture, et sport (Paris 2024, Coupe du monde de rugby). Société à mission depuis 2021. Clients non divulgués par la loi.",
  },
  {
    id: "lysios",
    nom: "Lysios Public Affairs",
    sirens: ["447525452"],
    type: "cabinet-conseil",
    secteur: "Énergie · Numérique · Santé · Finance",
    leader: "Direction non publiquement identifiée",
    note:
      "Fondé en 2003 à Paris, bureau à Bruxelles depuis 2007. 30+ consultants, 100+ clients actifs. Présent sur les dossiers de régulation sectorielle (CRE, ARCEP, AMF, HAS) autant que sur le lobbying politique. Membres de l'EPACA (association européenne des cabinets d'affaires publiques). Clients non divulgués par la loi.",
  },
];

/** Combined list for total action count queries */
export const ALL_CURATED_SIRENS = [
  ...POWER_LOBBYISTS.flatMap((l) => l.sirens),
  ...CONSULTING_LOBBYISTS.flatMap((l) => l.sirens),
];
