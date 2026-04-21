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
    value: "+1 million",
    subtitle: "8,8M (2016) -> 9,8M (2023)",
    color: "rose",
  },
  {
    label: "Dette publique",
    value: "+1 350 Md EUR",
    subtitle: "96 % du PIB -> 117,4 %",
    color: "amber",
  },
  {
    label: "Fortunes des milliardaires",
    value: "x 2",
    subtitle: "571 Md \u2192 1 228 Md EUR",
    color: "teal",
  },
  {
    label: "Lits d'hôpital fermés",
    value: "-30 000",
    subtitle: "Même pendant le Covid",
    color: "blue",
  },
];

// ─── Poverty & Inequality ───

export const POVERTY_DATA: BeforeAfter[] = [
  {
    label: "Taux de pauvreté (seuil 60 %)",
    before: "14,0 %",
    beforeYear: "2016",
    after: "15,4 %",
    afterYear: "2023",
    delta: "+1,4 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Personnes sous le seuil de pauvreté",
    before: "8,8 M",
    beforeYear: "2016",
    after: "9,8 M",
    afterYear: "2023",
    delta: "+1 million",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Pauvreté infantile",
    before: "~19 %",
    beforeYear: "2016",
    after: "21,9 %",
    afterYear: "2023",
    delta: "+3 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "UNICEF France",
  },
  {
    label: "Coefficient de Gini",
    before: "0,288",
    beforeYear: "2016",
    after: "0,300",
    afterYear: "2024",
    delta: "+0,012",
    deltaDirection: "up",
    severity: "notable",
    source: "Eurostat",
  },
  {
    label: "Sans-abri (SDF)",
    before: "~200 000",
    beforeYear: "2016",
    after: "~350 000",
    afterYear: "2025",
    delta: "+75 %",
    deltaDirection: "up",
    severity: "critique",
    source: "Fondation Abbé Pierre",
  },
  {
    label: "Bénéficiaires Restos du Coeur",
    before: "882 000",
    beforeYear: "2016",
    after: "1 300 000",
    afterYear: "2024",
    delta: "+47 %",
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
    label: "Prix de l'électricité",
    before: "0,158 EUR/kWh",
    beforeYear: "2016",
    after: "0,252 EUR/kWh",
    afterYear: "2024",
    delta: "+60 %",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE / CRE",
  },
  {
    label: "Prix alimentaires (150 produits courants)",
    before: "—",
    beforeYear: "2022",
    after: "+25 %",
    afterYear: "2024",
    delta: "+25 %",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "SMIC net mensuel",
    before: "1 466 EUR",
    beforeYear: "2016",
    after: "1 823 EUR",
    afterYear: "2026",
    delta: "+24 % (indexation auto)",
    deltaDirection: "up",
    severity: "informatif",
    source: "INSEE",
  },
];

// ─── Public Debt & Fiscal Policy ───

export const DEBT_FISCAL_DATA: BeforeAfter[] = [
  {
    label: "Dette publique",
    before: "2 147 Md EUR (96 % PIB)",
    beforeYear: "2016",
    after: "~3 500 Md EUR (117,4 % PIB)",
    afterYear: "2025",
    delta: "+1 350 Md EUR (+63 %)",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE Comptes nationaux",
  },
  {
    label: "Déficit public",
    before: "3,4 % du PIB",
    beforeYear: "2016",
    after: "5,1 % du PIB",
    afterYear: "2025",
    delta: "+1,7 pts",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE",
  },
  {
    label: "Dividendes déclarés",
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
    before: "45,8 Md EUR",
    beforeYear: "2017",
    after: "108 Md EUR",
    afterYear: "2025",
    delta: "+135 % (record)",
    deltaDirection: "up",
    severity: "critique",
    source: "Janus Henderson / Vernimmen",
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
    text: "Suppression de l'ISF : perte de recettes fiscales cumulée (~3 Md EUR/an)",
    value: "~25-30 Md EUR sur 8 ans",
    source: "Sénat / France Stratégie / Vie-publique",
  },
  {
    text: "Flat tax (PFU 30 %) : 1 % des foyers fiscaux per\u00e7oivent 96 % des dividendes déclarés",
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
    value: "69 M EUR collectés (Bercy attendait 200 M ; l'IPP estimait 3-6 Md EUR)",
    source: "IPP (mai 2024) / Observatoire des multinationales",
  },
];

// ─── Employment ───

export const EMPLOYMENT_DATA: BeforeAfter[] = [
  {
    label: "Taux de ch\u00f4mage officiel (BIT)",
    before: "10,2 %",
    beforeYear: "T1 2016",
    after: "7,9 %",
    afterYear: "T4 2025",
    delta: "-2,3 pts (d\u00e9finition BIT : 1h de travail = employ\u00e9)",
    deltaDirection: "down",
    severity: "informatif",
    source: "INSEE Enqu\u00eate emploi",
  },
  {
    label: "Inscrits France Travail (cat. A+B+C)",
    before: "~5,5 M",
    beforeYear: "2016",
    after: "5,75 M",
    afterYear: "T4 2025",
    delta: "Stable \u2014 la baisse officielle ne se retrouve pas ici",
    deltaDirection: "neutral",
    severity: "critique",
    source: "DARES",
  },
  {
    label: "Inscrits toutes cat\u00e9gories (A \u00e0 G) + halo du ch\u00f4mage",
    before: "\u2014",
    beforeYear: "\u2014",
    after: "~8,4 M de personnes en difficult\u00e9 d'emploi",
    afterYear: "T4 2025",
    delta: "x3 le chiffre officiel (6,49 M inscrits + 1,9 M halo)",
    deltaDirection: "up",
    severity: "critique",
    source: "DARES / INSEE",
  },
  {
    label: "Ch\u00f4mage des jeunes (15-24 ans)",
    before: "~24 %",
    beforeYear: "2016",
    after: "21,5 %",
    afterYear: "T4 2025",
    delta: "-2,5 pts sur la p\u00e9riode (mais remont\u00e9e r\u00e9cente)",
    deltaDirection: "down",
    severity: "notable",
    source: "INSEE",
  },
  {
    label: "Micro-entrepreneurs",
    before: "1,5 M",
    beforeYear: "2016",
    after: "2,9 M",
    afterYear: "2024",
    delta: "x2 (1 sur 3 sous le seuil de pauvret\u00e9)",
    deltaDirection: "up",
    severity: "critique",
    source: "INSEE / URSSAF / CAE",
  },
  {
    label: "Radiations administratives France Travail",
    before: "\u2014",
    beforeYear: "\u2014",
    after: "~55 000/mois (660 000/an)",
    afterYear: "2024",
    delta: "62 % pour non-r\u00e9ponse \u00e0 convocation",
    deltaDirection: "up",
    severity: "critique",
    source: "DARES / Vie-publique",
  },
  {
    label: "Demandeurs indemnis\u00e9s / inscrits",
    before: "\u2014",
    beforeYear: "\u2014",
    after: "40 % (60 % ne re\u00e7oivent rien)",
    afterYear: "2024",
    delta: "5 r\u00e9formes ont durci l'\u00e9ligibilit\u00e9",
    deltaDirection: "down",
    severity: "critique",
    source: "UNEDIC / France Info",
  },
  {
    label: "Embauches en contrat court (CDD <1 mois ou int\u00e9rim)",
    before: "\u2014",
    beforeYear: "\u2014",
    after: "81 % de toutes les embauches",
    afterYear: "2024",
    delta: "Pr\u00e9carit\u00e9 structurelle",
    deltaDirection: "up",
    severity: "critique",
    source: "Vie-publique / DARES",
  },
];

export const EMPLOYMENT_METHODOLOGY: SourcedFact[] = [
  {
    text: "Enqu\u00eate Emploi r\u00e9nov\u00e9e en 2021 : nouveau questionnaire, collecte en ligne, pond\u00e9rations revis\u00e9es",
    value: "Taux d'emploi +0,8 pts (reclassification du halo vers l'emploi)",
    source: "INSEE Analyses n\u00b065",
  },
  {
    text: "Nouvelles cat\u00e9gories F et G cr\u00e9\u00e9es en janvier 2025 (loi Plein Emploi)",
    value: "Des centaines de milliers d'allocataires RSA absorb\u00e9s dans des cat\u00e9gories non-demandeuses d'emploi",
    source: "France Travail / ASH",
  },
  {
    text: "D\u00e9finition BIT : une seule heure de travail dans la p\u00e9riode de r\u00e9f\u00e9rence suffit \u00e0 \u00eatre class\u00e9 « employ\u00e9 »",
    value: "2,9 M de micro-entrepreneurs (CA m\u00e9dian : 12 000 EUR/an) sont « employ\u00e9s »",
    source: "INSEE / BIT",
  },
];

// ─── Healthcare ───

export const HEALTHCARE_DATA: BeforeAfter[] = [
  {
    label: "Lits d'hôpital",
    before: "~400 000",
    beforeYear: "2016",
    after: "369 400",
    afterYear: "2023",
    delta: "-30 000 lits (tendance depuis les ann\u00e9es 2000)",
    deltaDirection: "down",
    severity: "critique",
    source: "DREES / SAE",
  },
  {
    label: "Urgences : temps d'attente médian",
    before: "2h15",
    beforeYear: "2013",
    after: "3h00",
    afterYear: "2023",
    delta: "+45 min",
    deltaDirection: "up",
    severity: "notable",
    source: "DREES",
  },
  {
    label: "Postes infirmiers vacants",
    before: "—",
    beforeYear: "—",
    after: "15 000",
    afterYear: "2022",
    delta: "1 infirmier sur 2 part avant 10 ans",
    deltaDirection: "up",
    severity: "critique",
    source: "FHF",
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
    label: "Maternités fermées depuis 2017",
    before: "493",
    beforeYear: "2017",
    after: "457",
    afterYear: "2024",
    delta: "-36 maternités",
    deltaDirection: "down",
    severity: "notable",
    source: "DREES",
  },
];

// ─── Social Protection ───

export const SOCIAL_CUTS: SourcedFact[] = [
  {
    text: "Assurance chômage : 5 réformes, éligibilité durcie de 4 mois sur 28 a 6 mois sur 24",
    value: "1 million de travailleurs ont perdu des mois d'indemnisation, 300 000 ont perdu tous leurs droits",
    source: "UNEDIC / DARES",
  },
  {
    text: "APL : baisse de 5 EUR/mois (octobre 2017)",
    value: "50 000+ personnes ont perdu toute aide, 392 M EUR « économisés » sur les plus précaires",
    source: "CNAF",
  },
  {
    text: "RSA : conditionné a 15-20h d'activité hebdomadaire (janvier 2025)",
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
    value: "-19 a -25 points",
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
    text: "Bureaux de poste : réduction des bureaux a service complet",
    value: "~20 %",
    source: "La Poste / Cour des comptes",
  },
  {
    text: "Lignes ferroviaires fermees ou non opérationnelles",
    value: "6 615 km (1/3 du réseau menacé)",
    source: "SNCF Réseau / Sénat",
  },
  {
    text: "Fracture numérique : population éloignée du numérique",
    value: "1/3 de la population",
    source: "Défenseur des droits (96 028 réclamations en 2024)",
  },
];

// ─── Human Rights & Democracy ───

export const POLICE_VIOLENCE_STATS = {
  giletsJaunes: {
    blesses: "~2 500",
    yeux: "24-25",
    mains: "5",
    blessuresTete: "236",
    blessuresLBD: "221+",
    gardesAVue: "~11 000 (record depuis mai 1968)",
  },
  mortsInterventions: {
    macron: { total: 288, parAn: 41, periode: "2018-2024" },
    hollande: { total: 92, parAn: 18, periode: "2012-2017" },
    annee2024: "55 (pire depuis les années 1970)",
  },
  retraitesProtestation: {
    blesses: "546 (officiel)",
    sainteSoline: "~200 blessés, 40 graves, 2 comas",
  },
  impunite: "70 % des cas de violences Gilets Jaunes classés sans suite (IGPN)",
  contexteEuropeen: "France : seul pays de l'UE utilisant LBD-40 et grenades d'encerclement contre les manifestants",
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
    delta: "Borne seule : 23 (record depuis la r\u00e9forme de 2008)",
    deltaDirection: "up",
    severity: "critique",
    source: "Assemblée nationale",
  },
  {
    label: "Dissolutions d'associations",
    before: "—",
    beforeYear: "—",
    after: "33",
    afterYear: "2017-2025",
    delta: "1/3 de toutes les dissolutions de la Ve République",
    deltaDirection: "up",
    severity: "critique",
    source: "Ministère de l'Interieur",
  },
  {
    label: "Democracy Index",
    before: "Démocratie pleine",
    beforeYear: "2016",
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
    before: "32",
    beforeYear: "2017",
    after: "52",
    afterYear: "2025",
    delta: "+62 %",
    deltaDirection: "up",
    severity: "critique",
    source: "Forbes / Oxfam",
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
    before: "~41-85 Md $",
    beforeYear: "2017",
    after: "pic 240,7 Md $ (2023)",
    afterYear: "2023",
    delta: "x3 a x6",
    deltaDirection: "up",
    severity: "critique",
    source: "Forbes",
  },
];

export const ELITE_FACTS: SourcedFact[] = [
  {
    text: "53 milliardaires possèdent plus que les 32 millions de Français les plus pauvres (50 % de la population)",
    source: "Oxfam France",
  },
  {
    text: "Croissance du patrimoine des milliardaires depuis 2019",
    value: "13 M EUR par jour",
    source: "Oxfam France",
  },
  {
    text: "McKinsey Gate : dépenses de conseil depuis 2018",
    value: "2,4 Md EUR (McKinsey a payé 0 EUR d'IS sur 329 M EUR de CA)",
    source: "Sénat / Commission d'enquête",
  },
  {
    text: "Pantouflage : ministres partis vers le privé après le premier mandat",
    value: "51 %",
    source: "HATVP / presse",
  },
  {
    text: "Patrimoine moyen des ministres",
    value: "2,9 M EUR (16x le patrimoine médian français)",
    source: "HATVP déclarations",
  },
];

export const REVOLVING_DOOR_CASES = [
  { name: "Édouard Philippe", from: "Premier ministre", to: "Conseil d'administration Atos" },
  { name: "Brune Poirson", from: "Secrétaire d'Etat Ecologie", to: "Accor (groupe hôtelier)" },
  { name: "Cédric O", from: "Secrétaire d'Etat Numerique", to: "Mistral AI (puis régulation IA)" },
  { name: "Éléonore Leprettre", from: "Conseillère Agriculture", to: "Lobby agrochimique" },
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
    elite: "52 milliardaires (+62 %)",
    category: "economie",
  },
  {
    label: "Logement",
    peuple: "350 000 sans-abri (+75 %)",
    elite: "Patrimoine immobilier des ministres : 2,9 M EUR en moyenne",
    category: "social",
  },
  {
    label: "Alimentation",
    peuple: "8 millions en insécurité alimentaire (16 %)",
    elite: "Dividendes CAC 40 : 108 Md EUR (record 2025)",
    category: "social",
  },
  {
    label: "Hôpital",
    peuple: "30 000 lits fermés, 87 % de désert médical",
    elite: "2,4 Md EUR de consulting (McKinsey & co)",
    category: "social",
  },
  {
    label: "Fiscalité",
    peuple: "CSG retraites +1,7 pts, cotisations chômage en hausse",
    elite: "ISF supprimé (-35 Md EUR), flat tax (PFU 30 %), IS : 33 % -> 25 %",
    category: "fiscal",
  },
  {
    label: "Emploi",
    peuple: "3,2 M de micro-entrepreneurs (<30 % survivent 5 ans)",
    elite: "Dividendes déclarés : +86 % (39 -> 73 Md EUR)",
    category: "economie",
  },
  {
    label: "Démocratie",
    peuple: "22 % de confiance politique, democratie « imparfaite »",
    elite: "23 passages en 49.3, 51 % de pantouflage post-mandat",
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
    value: "23 % (2024) vs 32 % (objectif) — seul pays UE a manquer l'objectif 2020",
    source: "Eurostat / SDES",
  },
  {
    text: "Interdiction du glyphosate promise pour 2020",
    value: "Abandonnée. Ventes en hausse.",
    source: "ANSES",
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
    text: "Depression chez les 18-24 ans",
    value: "11,7 % (2017) -> 22 % (2024), quasi-doublée",
    source: "Santé publique France",
  },
  {
    text: "Suicide : 3e cause de décès chez les 15-29 ans",
    value: "Hospitalisations pour automutilation en hausse continue chez les jeunes femmes",
    source: "DREES / Santé publique France",
  },
  {
    text: "Abstention aux législatives",
    value: ">50 % en 2017 et 2022 — la moitié du pays ne vote plus",
    source: "Ministère de l'Interieur",
  },
];
