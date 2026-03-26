export interface Dossier {
  slug: string;
  label: string;
  subtitle: string;
  priority: 1 | 2 | 3;
  stat: string;
  statSource: string;
  tags: string[];         // ScrutinTag domains
  lobbyDomains: string[]; // Lobbyiste domaine keywords (partial match)
  color: "amber" | "teal" | "blue" | "rose";
}

export const DOSSIERS: Dossier[] = [
  {
    slug: "pouvoir-dachat",
    label: "Pouvoir d'achat",
    subtitle: "Prix, salaires, fiscalité et économie du quotidien",
    priority: 1,
    stat: "43% des Français citent le pouvoir d'achat comme préoccupation n°1",
    statSource: "Baromètre IPSOS 2024",
    tags: ["budget", "fiscalite"],
    lobbyDomains: ["fiscal", "économi", "budget", "financ", "banque"],
    color: "amber",
  },
  {
    slug: "confiance-democratique",
    label: "Confiance démocratique",
    subtitle: "Conflits d'intérêts, lobbying et déports parlementaires",
    priority: 1,
    stat: "67% des Français estiment que les élus défendent des intérêts particuliers",
    statSource: "Enquête CEVIPOF 2023",
    tags: ["budget", "fiscalite"],
    lobbyDomains: ["énergi", "défens", "pharma", "agri", "numéri"],
    color: "rose",
  },
  {
    slug: "dette-publique",
    label: "Dette publique",
    subtitle: "Finances de l'État, évolution de la dette et charges d'intérêts",
    priority: 2,
    stat: "111% du PIB — la dette publique française en 2024",
    statSource: "INSEE Comptes nationaux 2024",
    tags: ["budget", "fiscalite"],
    lobbyDomains: ["budget", "financ", "fiscal"],
    color: "amber",
  },
  {
    slug: "emploi-jeunesse",
    label: "Emploi & Jeunesse",
    subtitle: "Chômage, formation professionnelle, perspectives des nouvelles générations",
    priority: 2,
    stat: "17% de chômage chez les 15-24 ans en France métropolitaine",
    statSource: "INSEE Enquête emploi 2024",
    tags: ["travail", "education"],
    lobbyDomains: ["emploi", "formation", "social", "travail"],
    color: "blue",
  },
  {
    slug: "logement",
    label: "Logement",
    subtitle: "Crise du logement, construction, loyers et hébergement social",
    priority: 3,
    stat: "4 millions de mal-logés en France",
    statSource: "Fondation Abbé Pierre 2024",
    tags: ["logement"],
    lobbyDomains: ["immobil", "construct", "logement", "habitat"],
    color: "teal",
  },
  {
    slug: "sante",
    label: "Santé",
    subtitle: "Déserts médicaux, hôpitaux, couverture sociale et inégalités",
    priority: 3,
    stat: "6 millions de Français sans médecin traitant",
    statSource: "CNAM 2024",
    tags: ["sante"],
    lobbyDomains: ["pharma", "santé", "médical", "hospital"],
    color: "rose",
  },
  {
    slug: "transition-ecologique",
    label: "Transition écologique",
    subtitle: "Climat, énergie, biodiversité et politiques environnementales",
    priority: 3,
    stat: "La France manquera ses objectifs climatiques 2030 selon le HCC",
    statSource: "Haut Conseil pour le Climat 2024",
    tags: ["ecologie"],
    lobbyDomains: ["énergi", "pétrole", "gaz", "automobil", "aéri"],
    color: "teal",
  },
  {
    slug: "retraites",
    label: "Retraites",
    subtitle: "Réforme des retraites, pensions et solidarité intergénérationnelle",
    priority: 3,
    stat: "L'article 49.3 utilisé pour la réforme des retraites 2023 sans vote",
    statSource: "Assemblée nationale 2023",
    tags: ["retraites"],
    lobbyDomains: ["retraite", "pension", "social", "assurance"],
    color: "amber",
  },
  {
    slug: "medias",
    label: "Concentration des médias",
    subtitle: "Propriété, influence et transparence des grands groupes médiatiques",
    priority: 1,
    stat: "9 milliardaires contrôlent plus de 80 % des médias privés en France",
    statSource: "Reporters sans frontières 2024",
    tags: ["culture"],
    lobbyDomains: ["audiovisuel", "presse", "telecommuni", "edition", "media"],
    color: "rose",
  },
  {
    slug: "financement-politique",
    label: "Financement politique",
    subtitle: "Aide publique, dons priv\u00e9s et co\u00fbt \u00e9lectoral des partis",
    priority: 2,
    stat: "66 M\u20ac d\u2019aide publique vers\u00e9e aux partis politiques en 2024",
    statSource: "CNCCFP 2024",
    tags: ["budget"],
    lobbyDomains: [],
    color: "amber",
  },
];

export function getDossier(slug: string): Dossier | undefined {
  return DOSSIERS.find((d) => d.slug === slug);
}
