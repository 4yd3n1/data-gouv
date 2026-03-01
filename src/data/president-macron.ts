/**
 * Static data for the presidential profile page.
 * Promises are curated to only include entries verifiable with DB data
 * (INSEE BDM indicators or parliamentary votes via ScrutinTag).
 * Status notes are factual and cite measurable outcomes.
 */

export interface Promesse {
  id: string;
  election: 2017 | 2022;
  category: string; // maps to ScrutinTag.tag values
  categoryLabel: string;
  text: string;
  status: "tenu" | "partiel" | "abandonne" | "en-cours";
  statusNote: string; // brief factual note
  indicateurCode?: string; // Reference to Indicateur.code in DB
  indicateurTarget?: number; // Promised target value
  indicateurLabel?: string; // Short label for evidence card
  scrutinTag?: string; // Related ScrutinTag.tag for vote link
  sourceUrl?: string;
}

export const BIO = {
  nom: "Macron",
  prenom: "Emmanuel",
  civilite: "M.",
  dateNaissance: "1977-12-21",
  lieuNaissance: "Amiens (Somme)",
  formation:
    "Sciences Po Paris · Nanterre (philosophie) · ENA (promo Amélie Erard, 2004)",
  career: [
    {
      period: "2004–2012",
      role: "Inspecteur des Finances, puis banquier d'affaires chez Rothschild & Cie",
    },
    {
      period: "2012–2014",
      role: "Secrétaire général adjoint de l'Élysée (sous François Hollande)",
    },
    {
      period: "2014–2016",
      role: "Ministre de l'Économie, de l'Industrie et du Numérique",
    },
    { period: "2016", role: "Fondation du mouvement « En Marche ! »" },
    {
      period: "2017–",
      role: "Président de la République Française (8e président de la Ve République)",
    },
  ],
  elections: [
    {
      annee: 2017,
      adversaire: "Marine Le Pen",
      tour1Pct: 24.01,
      tour2Pct: 66.1,
    },
    {
      annee: 2022,
      adversaire: "Marine Le Pen",
      tour1Pct: 27.85,
      tour2Pct: 58.55,
    },
  ],
  parti: "La République En Marche (2016) → Renaissance (2022)",
  // Official Élysée photo (public domain)
  photoUrl:
    "https://www.elysee.fr/images/logotype.png",
} as const;

// ─── 2017 Programme ───

const PROMESSES_2017: Promesse[] = [
  {
    id: "2017-chomage",
    election: 2017,
    category: "emploi",
    categoryLabel: "Emploi",
    text: "Ramener le taux de chômage sous les 7 % avant la fin du quinquennat.",
    status: "partiel",
    statusNote:
      "Atteint à 7,1 % début 2020 avant le Covid-19. Remonté à ~7,5 % ensuite. Objectif techniquement frôlé mais non maintenu.",
    indicateurCode: "CHOMAGE_TAUX_TRIM",
    indicateurTarget: 7.0,
    indicateurLabel: "Taux de chômage",
    scrutinTag: "travail",
    sourceUrl:
      "https://storage.googleapis.com/en-marche-fr/EME/Le-programme-Emmanuel-Macron.pdf",
  },
  {
    id: "2017-taxe-habitation",
    election: 2017,
    category: "fiscalite",
    categoryLabel: "Fiscalité",
    text: "Supprimer la taxe d'habitation : d'abord pour 80 % des foyers, puis pour la totalité.",
    status: "tenu",
    statusNote:
      "Suppression totale effective depuis le 1er janvier 2023. Mesure tenue dans son intégralité.",
    scrutinTag: "fiscalite",
  },
  {
    id: "2017-ordonnances-travail",
    election: 2017,
    category: "travail",
    categoryLabel: "Emploi & Travail",
    text: "Réformer le code du travail par ordonnances pour plus de flexibilité et de sécurité.",
    status: "tenu",
    statusNote:
      "5 ordonnances adoptées en septembre 2017, ratifiées en janvier 2018. Réforme majeure du droit du travail.",
    scrutinTag: "travail",
  },
  {
    id: "2017-retraites-points",
    election: 2017,
    category: "retraites",
    categoryLabel: "Retraites",
    text: "Créer un système universel de retraite par points remplaçant les 42 régimes existants.",
    status: "abandonne",
    statusNote:
      "Le projet universel (2019-2020) suspendu pour cause de Covid. La réforme de 2023 s'est limitée au recul de l'âge légal à 64 ans (49.3).",
    scrutinTag: "retraites",
  },
  {
    id: "2017-dette",
    election: 2017,
    category: "budget",
    categoryLabel: "Finances publiques",
    text: "Réduire la dette publique et maintenir un déficit sous les 3 % du PIB (hors investissements).",
    status: "abandonne",
    statusNote:
      "La dette a atteint 115,6 % du PIB en 2024 (vs 98,4 % en 2017). Le déficit a dépassé 5,5 % en 2024.",
    indicateurCode: "DETTE_PIB",
    indicateurTarget: 100.0,
    indicateurLabel: "Dette publique",
    scrutinTag: "budget",
  },
  {
    id: "2017-assurance-chomage",
    election: 2017,
    category: "travail",
    categoryLabel: "Emploi",
    text: "Réformer l'assurance chômage : universalisation, droits rechargeables, indemnisation des démissionnaires.",
    status: "tenu",
    statusNote:
      "Loi Avenir professionnel (sept. 2018) : ouverture aux démissionnaires et indépendants, droits rechargeables renforcés.",
    scrutinTag: "travail",
  },
  {
    id: "2017-sante",
    election: 2017,
    category: "sante",
    categoryLabel: "Santé",
    text: "Investir dans les hôpitaux publics et lutter contre les déserts médicaux.",
    status: "partiel",
    statusNote:
      "Plan « Ma Santé 2022 » lancé en 2018 (3,4 Md€). Les déserts médicaux se sont aggravés : 9 M de Français sans médecin traitant en 2024.",
    scrutinTag: "sante",
  },
  {
    id: "2017-smic",
    election: 2017,
    category: "pouvoir-dachat",
    categoryLabel: "Pouvoir d'achat",
    text: "Augmenter le pouvoir d'achat : prime d'activité (+100 €), exonérations, SMIC revalorisé.",
    status: "partiel",
    statusNote:
      "Prime d'activité augmentée de 100 € en 2018 (gilets jaunes). SMIC régulièrement revalorisé. Mais l'inflation 2022-2024 a fortement érodé ces gains.",
    indicateurCode: "SMIC_HORAIRE",
    indicateurLabel: "SMIC horaire brut",
    scrutinTag: "fiscalite",
  },
  {
    id: "2017-ecologie",
    election: 2017,
    category: "ecologie",
    categoryLabel: "Transition écologique",
    text: "Atteindre 40 % d'énergies renouvelables dans la consommation énergétique finale en 2030.",
    status: "en-cours",
    statusNote:
      "Part des renouvelables autour de 20-22 % en 2023. Objectif 2030 atteignable mais nécessite une forte accélération.",
    scrutinTag: "ecologie",
  },
  {
    id: "2017-formation",
    election: 2017,
    category: "education",
    categoryLabel: "Formation",
    text: "Investir 15 milliards d'euros dans le plan « Compétences » pour les chômeurs et décrocheurs.",
    status: "partiel",
    statusNote:
      "Plan d'investissement dans les compétences (PIC) : 13,8 Md€ engagés sur 5 ans. Résultats mitigés selon la Cour des comptes (2023).",
    scrutinTag: "education",
  },
];

// ─── 2022 Programme ───

const PROMESSES_2022: Promesse[] = [
  {
    id: "2022-retraites-64",
    election: 2022,
    category: "retraites",
    categoryLabel: "Retraites",
    text: "Réformer le système de retraites pour atteindre l'équilibre financier, en relevant progressivement l'âge légal.",
    status: "tenu",
    statusNote:
      "Réforme adoptée le 14 avril 2023 : âge légal relevé à 64 ans. Passage en force via l'article 49.3, sans vote final de l'Assemblée.",
    scrutinTag: "retraites",
  },
  {
    id: "2022-plein-emploi",
    election: 2022,
    category: "emploi",
    categoryLabel: "Emploi",
    text: "Atteindre le « plein emploi » avec un taux de chômage à 5 % d'ici la fin du mandat (2027).",
    status: "en-cours",
    statusNote:
      "Taux de chômage autour de 7,3-7,5 % fin 2024. L'objectif de 5 % paraît hors d'atteinte avant 2027.",
    indicateurCode: "CHOMAGE_TAUX_TRIM",
    indicateurTarget: 5.0,
    indicateurLabel: "Taux de chômage",
    scrutinTag: "travail",
  },
  {
    id: "2022-pouvoir-achat-loi",
    election: 2022,
    category: "pouvoir-dachat",
    categoryLabel: "Pouvoir d'achat",
    text: "Prendre des mesures d'urgence pour protéger le pouvoir d'achat face à l'inflation.",
    status: "tenu",
    statusNote:
      "Loi du 16 août 2022 : bouclier tarifaire, revalorisation AAH, indexation salaires de la fonction publique.",
    scrutinTag: "budget",
  },
  {
    id: "2022-france-2030",
    election: 2022,
    category: "travail",
    categoryLabel: "Réindustrialisation",
    text: "Déployer « France 2030 » : 30 milliards d'euros pour réindustrialiser et investir dans les technologies d'avenir.",
    status: "en-cours",
    statusNote:
      "Plan lancé en octobre 2021, poursuivi. Premiers résultats : 200+ projets industriels, 80 000 emplois annoncés. Évaluation définitive en cours.",
    scrutinTag: "travail",
  },
  {
    id: "2022-logements",
    election: 2022,
    category: "logement",
    categoryLabel: "Logement",
    text: "Accélérer la construction de logements pour répondre à la pénurie.",
    status: "abandonne",
    statusNote:
      "Mises en chantier : 316 000 en 2023, ~270 000 prévues en 2024 (-25 %). La crise du logement s'est aggravée.",
    indicateurCode: "LOGEMENTS_COMMENCES",
    indicateurLabel: "Logements commencés",
    scrutinTag: "logement",
  },
  {
    id: "2022-deficit-3pct",
    election: 2022,
    category: "budget",
    categoryLabel: "Finances publiques",
    text: "Ramener le déficit public à 3 % du PIB d'ici 2027.",
    status: "abandonne",
    statusNote:
      "Déficit à 5,5 % du PIB en 2024. Budget d'austérité présenté fin 2024, bien loin de l'objectif.",
    indicateurCode: "DETTE_PIB",
    indicateurLabel: "Dette publique",
    scrutinTag: "budget",
  },
  {
    id: "2022-ecologie-nucleaire",
    election: 2022,
    category: "ecologie",
    categoryLabel: "Transition écologique",
    text: "Sortir des énergies fossiles : fin du charbon, relance du nucléaire, développement massif des renouvelables.",
    status: "partiel",
    statusNote:
      "Fermeture de la dernière centrale à charbon (Cordemais) reportée à 2027. 6 nouveaux EPR2 commandés. Renouvelables en progression.",
    scrutinTag: "ecologie",
  },
  {
    id: "2022-snu",
    election: 2022,
    category: "defense",
    categoryLabel: "Service national",
    text: "Généraliser le Service national universel (SNU) à tous les jeunes d'ici 2026.",
    status: "abandonne",
    statusNote:
      "Généralisation officiellement abandonnée en 2024. Seulement 80 000 jeunes sur 800 000 ont participé.",
    scrutinTag: "defense",
  },
  {
    id: "2022-reforme-chomage-2",
    election: 2022,
    category: "travail",
    categoryLabel: "Emploi",
    text: "Conditionner davantage le versement des allocations chômage à la reprise d'emploi.",
    status: "tenu",
    statusNote:
      "Décret du 26 juillet 2023 : durcissement des conditions de versement. Règle « moins d'un jour travaillé = moins d'allocations ». Contesté en justice.",
    scrutinTag: "travail",
  },
  {
    id: "2022-education",
    election: 2022,
    category: "education",
    categoryLabel: "Éducation",
    text: "Revaloriser les enseignants et réformer le lycée professionnel.",
    status: "partiel",
    statusNote:
      "Pacte enseignant : +200 €/mois nets en contrepartie de missions supplémentaires (2023). Réforme du lycée pro en cours mais critiquée.",
    scrutinTag: "education",
  },
];

export const PROMESSES: Promesse[] = [...PROMESSES_2017, ...PROMESSES_2022];

export function getPromesseSummary(election: 2017 | 2022) {
  const promises = PROMESSES.filter((p) => p.election === election);
  return {
    total: promises.length,
    tenu: promises.filter((p) => p.status === "tenu").length,
    partiel: promises.filter((p) => p.status === "partiel").length,
    abandonne: promises.filter((p) => p.status === "abandonne").length,
    enCours: promises.filter((p) => p.status === "en-cours").length,
  };
}

export const STATUS_CONFIG = {
  tenu: {
    label: "Tenu",
    color: "text-teal",
    bg: "bg-teal/10 border-teal/20",
    icon: "✓",
  },
  partiel: {
    label: "Partiel",
    color: "text-amber",
    bg: "bg-amber/10 border-amber/20",
    icon: "~",
  },
  abandonne: {
    label: "Abandonné",
    color: "text-rose",
    bg: "bg-rose/10 border-rose/20",
    icon: "✗",
  },
  "en-cours": {
    label: "En cours",
    color: "text-blue",
    bg: "bg-blue/10 border-blue/20",
    icon: "⏳",
  },
} as const;
