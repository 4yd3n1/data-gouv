/**
 * Structured research data for the "Bilan Macron" dossier.
 * All figures sourced from official institutions (INSEE, Eurostat, DREES,
 * Cour des Comptes, France Stratégie, Oxfam, CEVIPOF, Amnesty, RSF, etc.).
 * Static data for metrics not available in the database.
 */

// ─── Types ───

export interface BeforeAfter {
  label: string;
  before: string;
  beforeYear: string;
  after: string;
  afterYear: string;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  severity: "critique" | "notable" | "informatif";
  source: string;
}

export interface StatCard {
  label: string;
  value: string;
  subtitle: string;
  color: "rose" | "amber" | "teal" | "blue";
}

export interface SourcedFact {
  text: string;
  value?: string;
  source: string;
  sourceUrl?: string;
}

// ─── Hero Stats ───

export const HERO_STATS: StatCard[] = [
  {
    label: "Personnes sous le seuil de pauvreté",
    value: "+900 000",
    subtitle: "8,9M (2017) -> 9,8M (2023)",
    color: "rose",
  },
  {
    label: "Dette publique",
    value: "+1 280 Md EUR",
    subtitle: "96,8 % du PIB -> 115,6 %",
    color: "amber",
  },
  {
    label: "Fortunes des milliardaires",
    value: "x 2,15",
    subtitle: "571 Md → 1 228 Md EUR",
    color: "teal",
  },
  {
    label: "Lits d'hôpital fermés",
    value: "-45 500",
    subtitle: "Fin 2013 -> fin 2024 (DREES)",
    color: "blue",
  },
];

// ─── Poverty & Inequality ───

export const POVERTY_DATA: BeforeAfter[] = [
  {
    label: "Taux de pauvreté (seuil 60 %)",
    before: "14,1 %",
    beforeYear: "2017",
    after: "15,4 %",
    afterYear: "2023",
    delta: "+1,3 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Personnes sous le seuil de pauvreté",
    before: "8,9 M",
    beforeYear: "2017",
    after: "9,8 M",
    afterYear: "2023",
    delta: "+900 000",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Pauvreté infantile",
    before: "20,1 %",
    beforeYear: "2017",
    after: "21,9 %",
    afterYear: "2023",
    delta: "+1,8 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE / UNICEF France",
  },
  {
    label: "Coefficient de Gini (niveau de vie)",
    before: "0,292",
    beforeYear: "2017",
    after: "0,294",
    afterYear: "2022",
    delta: "+0,002 (stable sur la période disponible)",
    deltaDirection: "up",
    severity: "informatif",
    source: "INSEE (enquêtes Revenus fiscaux et sociaux)",
  },
  {
    label: "Sans-abri (SDF)",
    before: "~300 000",
    beforeYear: "2020",
    after: "~350 000",
    afterYear: "2025",
    delta: "+17 % en 5 ans",
    deltaDirection: "up",
    severity: "critique",
    source: "Fondation Abbé Pierre",
  },
  {
    label: "Bénéficiaires Restos du Coeur",
    before: "860 000",
    beforeYear: "campagne 2017-2018",
    after: "1 300 000",
    afterYear: "campagne 2024-2025",
    delta: "+51 %",
    deltaDirection: "up",
    severity: "critique",
    source: "Restos du Coeur",
  },
];

// ─── Purchasing Power ───

export const PURCHASING_POWER_DATA: BeforeAfter[] = [
  {
    label: "Inflation cumulée (2017-2025)",
    before: "—",
    beforeYear: "2017",
    after: "~20 %",
    afterYear: "2025",
    delta: "+20 %",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Prix de l'électricité (Tarif Bleu, base 6 kVA, TTC)",
    before: "0,1466 EUR/kWh",
    beforeYear: "août 2017",
    after: "0,252 EUR/kWh",
    afterYear: "2024",
    delta: "+72 %",
    deltaDirection: "up",
    severity: "critique",
    source: "CRE / EDF (tarif réglementé)",
  },
  {
    label: "Prix alimentaires (panier 150 produits courants)",
    before: "—",
    beforeYear: "2022",
    after: "+25 %",
    afterYear: "2024",
    delta: "+25 % (panel produits) ; +13 % en cumul (IPC)",
    deltaDirection: "up",
    severity: "critique",
    source: "UFC-Que Choisir / Familles Rurales (panel) ; INSEE (IPC)",
  },
  {
    label: "SMIC brut mensuel",
    before: "1 480 EUR",
    beforeYear: "janv. 2017",
    after: "1 823 EUR",
    afterYear: "janv. 2026",
    delta: "+23 % (indexation auto)",
    deltaDirection: "up",
    severity: "informatif",
    source: "INSEE",
  },
];

// ─── Public Debt & Fiscal Policy ───

export const DEBT_FISCAL_DATA: BeforeAfter[] = [
  {
    label: "Dette publique",
    before: "2 218 Md EUR (96,8 % PIB)",
    beforeYear: "fin 2017",
    after: "~3 500 Md EUR (115,6 % PIB)",
    afterYear: "2025",
    delta: "+1 282 Md EUR (+58 %) ; +18,8 pts PIB",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE Comptes nationaux (mars 2026)",
  },
  {
    label: "Déficit public",
    before: "2,6 % du PIB",
    beforeYear: "2017",
    after: "5,1 % du PIB",
    afterYear: "2025",
    delta: "+2,5 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Dividendes versés (CAC 40)",
    before: "39,2 Md EUR",
    beforeYear: "2017",
    after: "72,8 Md EUR",
    afterYear: "2024",
    delta: "+86 %",
    deltaDirection: "up",
    severity: "critique",
    source: "Vernimmen / CAC 40",
  },
  {
    label: "Dividendes + rachats CAC 40",
    before: "50,9 Md EUR",
    beforeYear: "2017",
    after: "107,5 Md EUR",
    afterYear: "2025",
    delta: "+111 % (record)",
    deltaDirection: "up",
    severity: "critique",
    source: "Vernimmen / Janus Henderson",
  },
  {
    label: "Taux d'IS effectif grands groupes",
    before: "33,3 %",
    beforeYear: "2017",
    after: "25 % (effectif : 14,3 %)",
    afterYear: "2025",
    delta: "-8,3 pts",
    deltaDirection: "down",
    severity: "notable",
    source: "DGFiP / France Stratégie",
  },
];

export const FISCAL_GIFTS: SourcedFact[] = [
  {
    text: "Suppression de l'ISF : perte de recettes fiscales cumulée (~2,8 Md EUR/an en moyenne)",
    value: "~20 Md EUR sur 7 ans (2018-2024)",
    source: "France Stratégie (oct. 2023) / Sénat / Vie-publique",
  },
  {
    text: "Flat tax (PFU 30 %) : 1 % des foyers fiscaux perçoivent 96 % des dividendes déclarés",
    value: "Pas d'impact détecté sur l'investissement",
    source: "France Stratégie, rapport final oct. 2023, p. 188",
  },
  {
    text: "CICE : coût total pour ~100 000 emplois créés (estimation France Stratégie, sept. 2020)",
    value: "~100 Md EUR de créances (~1 M EUR/emploi)",
    source: "France Stratégie / FIPECO",
  },
  {
    text: "TotalÉnergies : impôt sur les sociétés payé en France (2020 et 2021)",
    value: "0 EUR (Tax Transparency Report)",
    source: "TotalEnergies TTR / Le Monde / Basta!",
  },
  {
    text: "Contribution temporaire de solidarité (CTS) : rendement réel vs potentiel",
    value: "61 M EUR collectés (Bercy attendait 200 M ; l'IPP estimait 1,15-3,9 Md EUR)",
    source: "IPP (mai 2024) / Observatoire des multinationales",
  },
];

// ─── Employment ───

export const EMPLOYMENT_DATA: BeforeAfter[] = [
  {
    label: "Taux de chômage officiel (BIT)",
    before: "9,5 %",
    beforeYear: "T2 2017",
    after: "7,9 %",
    afterYear: "T4 2025",
    delta: "-1,6 pts (définition BIT : 1h de travail = employé)",
    deltaDirection: "down",
    severity: "informatif",
    source: "INSEE Enquête emploi",
  },
  {
    label: "Inscrits France Travail (cat. A+B+C)",
    before: "5,92 M",
    beforeYear: "déc. 2017",
    after: "5,75 M",
    afterYear: "T4 2025",
    delta: "Quasi-stable — la baisse du chômage BIT ne se retrouve pas ici",
    deltaDirection: "neutral",
    severity: "critique",
    source: "DARES",
  },
  {
    label: "Inscrits toutes catégories (A à G) + halo du chômage",
    before: "—",
    beforeYear: "—",
    after: "~8,4 M de personnes en difficulté d'emploi",
    afterYear: "T4 2025",
    delta: "x3 le chiffre officiel (6,49 M inscrits + 1,9 M halo)",
    deltaDirection: "up",
    severity: "critique",
    source: "DARES / INSEE",
  },
  {
    label: "Chômage des jeunes (15-24 ans)",
    before: "22,3 %",
    beforeYear: "2017",
    after: "21,5 %",
    afterYear: "T4 2025",
    delta: "-0,8 pt sur la période (avec remontée récente)",
    deltaDirection: "down",
    severity: "notable",
    source: "INSEE",
  },
  {
    label: "Micro-entrepreneurs",
    before: "1,18 M",
    beforeYear: "fin 2017",
    after: "2,9 M",
    afterYear: "fin 2024",
    delta: "x2,46 (revenu moyen ~670 EUR/mois, CA médian 12 000 EUR/an)",
    deltaDirection: "up",
    severity: "critique",
    source: "URSSAF / INSEE",
  },
  {
    label: "Radiations administratives France Travail",
    before: "—",
    beforeYear: "—",
    after: "~55 000/mois (660 000/an)",
    afterYear: "2024",
    delta: "62 % pour non-réponse à convocation",
    deltaDirection: "up",
    severity: "critique",
    source: "DARES / Vie-publique",
  },
  {
    label: "Demandeurs indemnisés / inscrits",
    before: "—",
    beforeYear: "—",
    after: "40 % (60 % ne reçoivent rien)",
    afterYear: "2024",
    delta: "4 réformes ont durci l'éligibilité (2019-2024)",
    deltaDirection: "down",
    severity: "critique",
    source: "UNEDIC / France Info",
  },
  {
    label: "Embauches en contrat court (CDD <1 mois ou intérim)",
    before: "—",
    beforeYear: "—",
    after: "81 % de toutes les embauches",
    afterYear: "T1 2025",
    delta: "Précarité structurelle",
    deltaDirection: "up",
    severity: "critique",
    source: "Vie-publique / DARES",
  },
];

export const EMPLOYMENT_METHODOLOGY: SourcedFact[] = [
  {
    text: "Enquête Emploi rénovée en 2021 : nouveau questionnaire, collecte en ligne, pondérations revisées",
    value: "Taux d'emploi +0,8 pts (reclassification du halo vers l'emploi)",
    source: "INSEE Analyses n°65",
  },
  {
    text: "Nouvelles catégories F et G créées en janvier 2025 (loi Plein Emploi)",
    value: "Des centaines de milliers d'allocataires RSA absorbés dans des catégories non-demandeuses d'emploi",
    source: "France Travail / ASH",
  },
  {
    text: "Définition BIT : une seule heure de travail dans la période de référence suffit à être classé « employé »",
    value: "2,9 M de micro-entrepreneurs (CA médian : 12 000 EUR/an) sont « employés »",
    source: "INSEE / BIT",
  },
];

// ─── Healthcare ───

export const HEALTHCARE_DATA: BeforeAfter[] = [
  {
    label: "Lits d'hôpital",
    before: "412 800",
    beforeYear: "fin 2013",
    after: "367 300",
    afterYear: "fin 2024",
    delta: "-45 500 lits (-11 %) sur 11 ans",
    deltaDirection: "down",
    severity: "critique",
    source: "DREES (ER 1225, nov. 2025)",
  },
  {
    label: "Postes infirmiers vacants",
    before: "—",
    beforeYear: "—",
    after: "15 000",
    afterYear: "2022",
    delta: "Taux de vacance 6,6 % (vs 3 % en 2019)",
    deltaDirection: "up",
    severity: "critique",
    source: "FHF (enquête RH avril-mai 2022)",
  },
  {
    label: "Déficit hospitalier",
    before: "—",
    beforeYear: "—",
    after: "-2,9 Md EUR",
    afterYear: "2024",
    delta: "Record historique",
    deltaDirection: "up",
    severity: "critique",
    source: "FHF / Cour des comptes",
  },
  {
    label: "Déserts médicaux",
    before: "—",
    beforeYear: "—",
    after: "87 % du territoire",
    afterYear: "2024",
    delta: "6 millions sans médecin traitant",
    deltaDirection: "up",
    severity: "critique",
    source: "CNAM",
  },
  {
    label: "Maternités fermées",
    before: "496",
    beforeYear: "2017",
    after: "435",
    afterYear: "2024",
    delta: "-61 maternités",
    deltaDirection: "down",
    severity: "notable",
    source: "DREES",
  },
];

// ─── Social Protection ───

export const SOCIAL_CUTS: SourcedFact[] = [
  {
    text: "Assurance chômage : 4 réformes (2019-2024), éligibilité durcie de 4 mois sur 28 a 6 mois sur 24",
    value: "1 million de travailleurs ont perdu des mois d'indemnisation, 190 000 n'ouvrent plus de droit",
    source: "UNEDIC / DARES",
  },
  {
    text: "APL : baisse de 5 EUR/mois (octobre 2017)",
    value: "50 000+ personnes ont perdu toute aide, 392 M EUR « économisés » sur les plus précaires",
    source: "CNAF",
  },
  {
    text: "RSA : conditionné a 15h d'activité hebdomadaire (janvier 2025)",
    value: "Le Défenseur des droits juge cette mesure contraire aux droits fondamentaux",
    source: "Défenseur des droits",
  },
  {
    text: "Retraites : age legal relevé de 62 a 64 ans, passage en force via 49.3",
    value: "3,5 millions de travailleurs concernés, contre 65-70 % d'opposition",
    source: "Assemblée nationale / IFOP",
  },
];

export const EDUCATION_DATA: SourcedFact[] = [
  {
    text: "Postes d'enseignants supprimés depuis 2017",
    value: "10 000+",
    source: "MEN / Budget",
  },
  {
    text: "Scores PISA : baisse historique (maths, lecture, sciences)",
    value: "-19 a -21 points (maths, compréhension écrite)",
    source: "OCDE PISA 2022",
  },
  {
    text: "Parcoursup : sans affectation (2025)",
    value: "136 000 candidats",
    source: "MESRI",
  },
  {
    text: "Salaires enseignants vs moyenne OCDE",
    value: "Inférieurs en début de carrière, 35 ans pour atteindre le sommet (vs 25 OCDE)",
    source: "OCDE Regards sur l'éducation",
  },
];

export const PUBLIC_SERVICES_DATA: SourcedFact[] = [
  {
    text: "Bureaux de poste : recul des bureaux de plein exercice (gérés directement par La Poste)",
    value: "Réduction confirmée par la Cour des comptes (rapport févr. 2025), chiffre précis non publié",
    source: "Cour des comptes (févr. 2025)",
  },
  {
    text: "Lignes ferroviaires : petites lignes voyageurs menacées (rapport Spinetta 2018)",
    value: "~9 000 km menacés ; 3 380 km déjà fermés aux voyageurs (réservés au fret)",
    source: "Rapport Spinetta 2018 / Sénat",
  },
  {
    text: "Illectronisme : population en difficulté avec le numérique",
    value: "15,4 % (INSEE 2021) ; 96 028 réclamations Défenseur des droits 2024",
    source: "INSEE Première n°1953 / Défenseur des droits (rapport 2024)",
  },
];

// ─── Human Rights & Democracy ───

export const POLICE_VIOLENCE_STATS = {
  giletsJaunes: {
    blesses: "~2 500",
    yeux: "30",
    mains: "6",
    blessuresTete: "353",
    blessuresLBD: "200+ (recensement Mediapart / Allô Place Beauvau)",
    gardesAVue: "~11 000 (record pour un mouvement social)",
  },
  mortsInterventions: {
    macron: { total: 288, parAn: 41, periode: "2018-2024" },
    hollande: { total: 92, parAn: 18, periode: "2012-2017" },
    annee2024: "52 (Basta!) / 55 (Désarmons-les!) — plus haut niveau depuis plus de 50 ans",
  },
  retraitesProtestation: {
    blesses: "546 (officiel)",
    sainteSoline: "~200 blessés, 40 graves, 2 comas",
  },
  impunite: "70 % des enquêtes IGPN clôturées classées « absence d'infraction » (sur 88 % des 456 procédures)",
  contexteEuropeen: "France : seul pays de l'UE utilisant grenades GLI-F4 et grenades de désencerclement en maintien de l'ordre",
  condamnationsInternationales: [
    "ONU (HCDH)",
    "Amnesty International",
    "Human Rights Watch",
    "Conseil de l'Europe",
  ],
};

export const DEMOCRATIC_EROSION: BeforeAfter[] = [
  {
    label: "Utilisation du 49.3",
    before: "Usage rare",
    beforeYear: "Avant 2022",
    after: "~32 fois sous Macron",
    afterYear: "2022-2025",
    delta: "Borne seule : 23 (record depuis la réforme de 2008)",
    deltaDirection: "up",
    severity: "critique",
    source: "Assemblée nationale",
  },
  {
    label: "Dissolutions d'associations",
    before: "—",
    beforeYear: "—",
    after: "33 puis 40+",
    afterYear: "2017-2023, mi-2025",
    delta: "1/3 des dissolutions de la Ve République",
    deltaDirection: "up",
    severity: "critique",
    source: "Ministère de l'Interieur",
  },
  {
    label: "Democracy Index",
    before: "Démocratie pleine",
    beforeYear: "2017",
    after: "Démocratie imparfaite (26e)",
    afterYear: "2024",
    delta: "Rétrogradé",
    deltaDirection: "down",
    severity: "critique",
    source: "Economist Intelligence Unit",
  },
  {
    label: "Confiance politique (CEVIPOF)",
    before: "35 %",
    beforeYear: "2017",
    after: "22 %",
    afterYear: "2026",
    delta: "-13 pts (78 % n'ont aucune confiance)",
    deltaDirection: "down",
    severity: "critique",
    source: "CEVIPOF Baromètre de la confiance politique",
  },
  {
    label: "Liberté de la presse (RSF)",
    before: "—",
    beforeYear: "—",
    after: "25e (2025)",
    afterYear: "2025",
    delta: "Préoccupation : concentration par milliardaires",
    deltaDirection: "neutral",
    severity: "notable",
    source: "Reporters sans frontières",
  },
];

export const LABOR_RIGHTS: SourcedFact[] = [
  {
    text: "Ordonnances travail 2017 : plafonnement des indemnités prud'homales",
    value: "1 a 20 mois (contre réparation intégrale avant)",
    source: "Code du travail / ordonnances Macron",
  },
  {
    text: "Fusion CE/CHSCT/DP en CSE : réduction des instances de représentation",
    value: "Destruction des comites spécialisés sante/sécurité",
    source: "DARES",
  },
  {
    text: "Recours aux prud'hommes",
    value: "-15 % (travailleurs dissuadés)",
    source: "Ministère de la Justice",
  },
];

// ─── Elite Enrichment ───

export const BILLIONAIRE_DATA: BeforeAfter[] = [
  {
    label: "Nombre de milliardaires",
    before: "39",
    beforeYear: "2017",
    after: "53",
    afterYear: "2026",
    delta: "+36 %",
    deltaDirection: "up",
    severity: "critique",
    source: "Forbes / Oxfam (rapport Jan 2026)",
  },
  {
    label: "Top 500 fortunes (Challenges)",
    before: "571 Md EUR",
    beforeYear: "2017",
    after: "1 228 Md EUR",
    afterYear: "2024",
    delta: "x 2,15 (record)",
    deltaDirection: "up",
    severity: "critique",
    source: "Challenges Classement",
  },
  {
    label: "Bernard Arnault",
    before: "~41,5 Md $",
    beforeYear: "2017",
    after: "pic 240,7 Md $ (2023)",
    afterYear: "2023",
    delta: "x5,8 au pic",
    deltaDirection: "up",
    severity: "critique",
    source: "Forbes",
  },
];

export const ELITE_FACTS: SourcedFact[] = [
  {
    text: "53 milliardaires possèdent plus que les 32 millions de Français les plus pauvres (50 % de la population)",
    source: "Oxfam France (rapport Jan 2026)",
  },
  {
    text: "Croissance du patrimoine des milliardaires français depuis 2017",
    value: "+220 Md EUR (~67 M EUR/jour)",
    source: "Oxfam France (rapport Jan 2026)",
  },
  {
    text: "McKinsey Gate : dépenses de conseil depuis 2018",
    value: "2,4 Md EUR (McKinsey a payé 0 EUR d'IS sur 329 M EUR de CA)",
    source: "Sénat / Commission d'enquête",
  },
  {
    text: "Pantouflage : ministres partis vers le privé après le premier mandat (estimation presse)",
    value: "~51 %",
    source: "Synthèse presse / études pantouflage",
  },
  {
    text: "Patrimoine moyen des ministres (gouvernement Bayrou, juin 2025)",
    value: "2,9 M EUR (16x le patrimoine médian français)",
    source: "HATVP (déclarations de patrimoine, juin 2025)",
  },
];

export const REVOLVING_DOOR_CASES = [
  { name: "Édouard Philippe", from: "Premier ministre", to: "Conseil d'administration Atos (2020-2023)" },
  { name: "Brune Poirson", from: "Secrétaire d'État Écologie", to: "Accor (groupe hôtelier)" },
  { name: "Cédric O", from: "Secrétaire d'État Numérique", to: "Mistral AI (puis lobbying IA Act à Bruxelles)" },
  { name: "Éléonore Leprettre", from: "Cheffe de cabinet de Marc Fesneau (Relations avec le Parlement)", to: "Phyteis (lobby agrochimique)" },
];

// ─── The Two Frances (Contrast) ───

export const CONTRAST_ROWS: Array<{
  label: string;
  peuple: string;
  elite: string;
  category: "economie" | "social" | "fiscal";
}> = [
  {
    label: "Niveau de vie",
    peuple: "Décile 1 : -1,0 % en termes réels (2023)",
    elite: "Décile 9 : +2,1 % en termes réels",
    category: "economie",
  },
  {
    label: "Pauvreté / Richesse",
    peuple: "15,4 % sous le seuil (plus haut depuis 1996)",
    elite: "53 milliardaires (+36 %)",
    category: "economie",
  },
  {
    label: "Logement",
    peuple: "350 000 sans-abri (Fondation Abbé Pierre 2025)",
    elite: "Patrimoine moyen ministres : 2,9 M EUR (gvt Bayrou)",
    category: "social",
  },
  {
    label: "Alimentation",
    peuple: "8 millions en insécurité alimentaire (16 %)",
    elite: "Dividendes + rachats CAC 40 : 107,5 Md EUR (record 2025)",
    category: "social",
  },
  {
    label: "Hôpital",
    peuple: "-45 500 lits fermés (2013-2024, DREES), 87 % de désert médical",
    elite: "2,4 Md EUR de consulting (McKinsey & co)",
    category: "social",
  },
  {
    label: "Fiscalité",
    peuple: "CSG retraites +1,7 pts, cotisations chômage en hausse",
    elite: "ISF supprimé (~20 Md EUR sur 7 ans), flat tax (PFU 30 %), IS : 33 % -> 25 %",
    category: "fiscal",
  },
  {
    label: "Emploi",
    peuple: "2,9 M de micro-entrepreneurs (~670 EUR/mois moyen)",
    elite: "Dividendes versés CAC 40 : +86 % (39 -> 73 Md EUR)",
    category: "economie",
  },
  {
    label: "Démocratie",
    peuple: "22 % de confiance politique, démocratie « imparfaite »",
    elite: "23 passages en 49.3 (Borne), ~51 % pantouflage post-mandat",
    category: "fiscal",
  },
];

// ─── Environment ───

export const ENVIRONMENT_DATA: SourcedFact[] = [
  {
    text: "Objectif climatique : rythme de réduction CO2 a doubler pour atteindre -50 % en 2030",
    value: "-31 % vs 1990 (insuffisant)",
    source: "Haut Conseil pour le Climat",
  },
  {
    text: "France condamnée par la justice pour inaction climatique",
    value: "2 fois",
    source: "Tribunal administratif de Paris (Affaire du Siècle)",
  },
  {
    text: "Énergies renouvelables : part réelle vs objectif 2030",
    value: "23 % (2024) vs 33 % (objectif LTECV/LEC 2019) — seul pays UE a manquer l'objectif 2020",
    source: "Eurostat / SDES",
  },
  {
    text: "Interdiction du glyphosate promise pour 2020",
    value: "Abandonnée. Autorisation UE renouvelée jusqu'en 2033 ; ventes en rebond +15,3 % en 2023 (6 800 t)",
    source: "ANSES / Ministère Transition écologique",
  },
  {
    text: "Crise de l'eau : départements sous restriction (2022)",
    value: "93 départements, 1 200+ cours d'eau asséchés",
    source: "Propluvia / BRGM",
  },
];

// ─── Social Fabric ───

export const SOCIAL_FABRIC: SourcedFact[] = [
  {
    text: "Mouvements sociaux majeurs sous Macron vs prédécesseurs",
    value: "6 (vs 1 sous Hollande, 1 sous Sarkozy)",
    source: "presse / syndicats",
  },
  {
    text: "Manifestations retraites : record historique (7 mars 2023)",
    value: "Jusqu'à 3,5 millions dans la rue",
    source: "CGT / Ministère de l'Interieur",
  },
  {
    text: "Dépression chez les 18-29 ans (Baromètre Santé publique France)",
    value: "11,7 % (2017) -> 22 % (2024), quasi-doublée",
    source: "Santé publique France (Baromètre 2024)",
  },
  {
    text: "Suicide : 2e cause de décès chez les 15-24 ans (1re chez les 25-34 ans)",
    value: "Hospitalisations pour automutilation : +46 % (15-19 ans) et +54 % (20-24 ans) chez les jeunes femmes (2017-2023)",
    source: "DREES (6e rapport Observatoire suicide, févr. 2025) / Santé publique France",
  },
  {
    text: "Abstention aux législatives",
    value: ">50 % en 2017 et 2022 — la moitié du pays ne vote plus",
    source: "Ministère de l'Interieur",
  },
];
