# Présidence Emmanuel Macron — Recap analytique

> **Date** : 28 avril 2026 · **Périmètre** : 2017–2026 (mandat 1 complet, mandat 2 en cours).
> **Source primaire** : base de données `datagouv` (44 modèles Prisma, ~800 000 lignes — INSEE, HATVP, AGORA, AN, gouvernement.fr, DREES, recherche éditoriale `data/research-output/`).
> **Données complémentaires** : `src/data/bilan-macron.ts` (recherche structurée, citations Cour des comptes / France Stratégie / Oxfam / CEVIPOF / RSF / EIU / DREES / Forbes / Fondation Abbé Pierre) et `src/data/president-macron.ts` (20 promesses instrumentées).
> **Editorial** : registre Le Monde — direct, factuel, mesuré. Distinguer ce qui est **mesuré** de ce qui est **interprété**. Les allégations judiciaires sont signalées comme telles, avec leur statut procédural exact à la date de rédaction. Aucune affirmation non sourcée. Présomption d'innocence respectée pour toute procédure non définitivement tranchée. Symétriquement, aucune allégation en cours n'est qualifiée de "débunkée" ou "fausse" tant qu'aucune décision définitive n'a tranché.

---

## Résumé exécutif

Macron est le premier président de la Vème République à avoir gouverné dans un cycle de crises permanentes (Gilets Jaunes 2018–2019, Covid-19 2020–2021, vague inflationniste 2021–2023, guerre en Ukraine, dissolution-catastrophe 2024). Mais la lecture par les seules crises subies obscurcit le bilan. **Sur les indicateurs structurels mesurables, la présidence Macron concentre, sur deux mandats, plusieurs records négatifs de la Vème République** :

- **49.3** : 32 utilisations (vs 8 chez Giscard, 7 chez Mitterrand, 6 chez Pompidou et Hollande, 0 chez Sarkozy). Borne seule en cumule 23 — record absolu pour un Premier ministre depuis la réforme constitutionnelle de 2008.
- **Instabilité gouvernementale** : 5 Premiers ministres en 22 mois (juin 2024 → avril 2026), record post-1958.
- **Morts en intervention de police** : 288 sur 2018–2024, soit ~41/an, contre ~18/an sous Hollande (×2,3). 2024 : 52–55 morts, plus haut niveau depuis plus de 50 ans (sources Basta!, Désarmons-les!).
- **Dissolutions d'associations** : 40+ depuis 2017, soit environ un tiers de l'ensemble des dissolutions prononcées sous la Vème.
- **Confiance politique fin mandat** : 22 % (CEVIPOF baromètre 2026), niveau le plus bas jamais mesuré.
- **Concentration patrimoniale au sommet** : top 500 fortunes × 2,15 (571 → 1 228 Md€), 53 milliardaires (vs 39 en 2017), 220 Md€ de patrimoine net supplémentaire pour les milliardaires français en 9 ans (Oxfam, janv. 2026).
- **Première dissolution-catastrophe** ayant produit une Assemblée durablement ingouvernable.

Sur la période :

- **Le taux de chômage officiel a baissé** de 9,6 % à 7,9 %, mais cette baisse repose sur des dispositifs définitionnels (catégories F et G créées en 2025, enquête Emploi rénovée 2021) et sur l'absorption de 2,9 M de micro-entrepreneurs au CA médian de 12 000 €/an. La précarité réelle de l'emploi (halo de chômage, CDD <1 mois et intérim = 81 % des embauches, radiations administratives 660 000/an) ne s'est pas améliorée en proportion.
- **La dette publique a augmenté de 1 280 Md€** (96,8 % → 115,6 % du PIB), faisant exploser les promesses fondamentales de 2017 et 2022 sur la trajectoire budgétaire.
- **Les inégalités de patrimoine se sont creusées** : pauvreté +1,3 pts (8,9 M → 9,8 M de Français sous le seuil), pauvreté infantile 20,1 % → 21,9 %, top 500 fortunes × 2,15, dividendes CAC 40 +86 %. Les 53 milliardaires français possèdent désormais plus que les 32 millions de Français les plus pauvres (Oxfam France, janv. 2026).
- **L'érosion démocratique est mesurée et accélérée** : 32 49.3, confiance 35 % → 22 %, déclassement Democracy Index (rang 26 EIU 2024, statut "démocratie imparfaite"), 40+ dissolutions associatives, 288 morts en intervention de police, RSF rang 25.
- **Une enquête préliminaire PNF est en cours** (affaire McKinsey, novembre 2022 — volet financement campagne 2017 toujours actif au 29 avril 2026 ; volet favoritisme classé sans suite en juin 2025). Présomption d'innocence respectée.
- **La transparence est asymétrique** : zéro déclaration HATVP indexée pour le Président, 2 102 lignes `InteretDeclare` pour les 110 ministres qu'il a nommés.
- **Les procédures touchant l'entourage proche forment un faisceau structurel** : secrétaire général de l'Élysée Alexis Kohler renvoyé en correctionnelle le 15 mai 2024 (procès attendu 2026), Premier ministre François Bayrou cité dans une enquête parlementaire pour violences institutionnelles (affaire Bétharram, fév. 2025), ancien conseiller à la sécurité Élysée Alexandre Benalla condamné définitivement à 1 an ferme (26 mai 2023), garde des Sceaux Éric Dupond-Moretti mis en examen puis relaxé par la Cour de justice de la République (27 nov. 2023), Haut-commissaire aux Retraites Jean-Paul Delevoye condamné pour omissions HATVP (14 janv. 2022).

Une lecture résumée : *une présidence dont les indicateurs structurels — instabilité gouvernementale, violence d'État, érosion de la confiance politique, concentration patrimoniale, densité des procédures judiciaires touchant l'entourage proche — la classent parmi les plus dégradées de la Vème République. Réformes en profondeur sur le travail, les retraites et la fiscalité, arbitrant systématiquement contre les revenus du travail et en faveur des revenus du capital. Répression des contestations sociales d'une intensité condamnée par toutes les instances internationales pertinentes (ONU HCDH, Conseil de l'Europe, Amnesty International, Human Rights Watch). Dégradation simultanée de la confiance politique, de l'indépendance parlementaire et de la liberté de la presse qui ne peut plus être traitée comme un effet secondaire.*

---

## 1. Le parcours

Données vérifiées dans `EntreeCarriere` (12 entrées, sources HATVP + PRESSE).

| Période | Fonction | Catégorie | Source |
|---|---|---|---|
| 1999–2001 | Sciences Po Paris, Master Affaires publiques | Formation | Presse |
| 2002–2004 | ENA, promo Léopold Sédar Senghor | Formation | Presse |
| 2004–2008 | Inspecteur des Finances, IGF | Fonction publique | Presse |
| **2008–2012** | **Associé-gérant, Rothschild & Cie Banque** | **Carrière privée** | **Presse** |
| 2012–2014 | Secrétaire général adjoint Élysée (cabinet Hollande) | Fonction publique | Presse |
| 2014–2016 | Ministre de l'Économie, de l'Industrie et du Numérique (Valls II/III) | Mandat gouvernemental | Presse |
| 2016 | Fondation En Marche! | Organisme | Presse |
| 2017–en cours | Président de la République (8e président de la Ve République) | Mandat gouvernemental | HATVP |

L'arc est le pipeline français classique — IGF → banque d'affaires → Élysée → Bercy → Présidence — avec un détour conséquent à Rothschild. Quatre ans de banque privée ont façonné la grille de lecture économique qui a produit la **loi Macron 2015** (libéralisations sectorielles), les **ordonnances travail 2017** (plafonnement prud'hommes, fusion CE/CHSCT/DP), la **suppression de l'ISF** (2018) et la **flat tax (PFU 30 %)**.

Le passage à Bercy 2014-2016 est documenté en juillet 2022 par les **Uber Files** (consortium International Consortium of Investigative Journalists / Le Monde / The Guardian / Süddeutsche Zeitung) comme un épisode de proximité étroite avec les lobbyistes de l'économie de plateforme — voir §6.C ci-après.

---

## 2. L'arrogance présidentielle — chronologie des sorties

> Catalogue de propos publics de Emmanuel Macron, documentés par sources presse de premier rang. Pris isolément, chacun pourrait être considéré comme un dérapage anecdotique. Cumulés sur neuf ans, ils dessinent un répertoire rhétorique constant — qualifié de "mépris de classe" par une part stable de la presse et des sondés (CEVIPOF baromètre confiance politique : à la question "Macron est éloigné des préoccupations des Français", 78 % d'accord en 2024 contre 35 % en 2017).

| Date | Lieu / contexte | Citation littérale | Source |
|---|---|---|---|
| 28 août 2017 | Pop'Sciences Lyon, à un retraité | « Le meilleur moyen de se payer un costume, c'est de travailler. » | AFP |
| 1 oct. 2017 | Inauguration Station F (Paris), incubateur Xavier Niel | « Une gare, c'est un lieu où on croise les gens qui réussissent et les gens qui ne sont rien. » | AFP, Le Monde 2 oct. 2017 |
| 1 juin 2018 | Brégançon, à des marins venus chercher des migrants | « Le kwassa-kwassa pêche peu, il amène du Comorien. » (off-micro capté) | AFP, Le Monde 2 juin 2018 |
| 12 juin 2018 | Vidéo Twitter présidentiel, Élysée | « On met un pognon de dingue dans les minima sociaux et les gens sont quand même pauvres. » | Vidéo Élysée diffusée par L'Express |
| 23 août 2018 | Déplacement à Mayotte | « On regarde la France comme si c'était un pays bloqué… Y'a des gens qui foutent le bordel. » | Le Parisien, AFP |
| 15 sept. 2018 | Élysée, journées européennes du patrimoine, à Jonathan Jahan, jardinier au chômage | « Vous me faites bien rire. Je traverse la rue, je vous trouve du travail. » | Vidéo BFMTV, Libération 16 sept. 2018 |
| 11 oct. 2018 | Interview TF1 / Pernaut | « Je crois aux premiers de cordée. » | TF1 JT 13h |
| 19 mars 2019 | Conférence de presse, fin du Grand débat national | « Si je devais semer la zizanie en disant tout ce que je pense… » | Élysée, Le Monde 20 mars 2019 |
| 4 jan. 2022 | Interview *Le Parisien* | « Les non-vaccinés, j'ai très envie de les emmerder. Et donc on va continuer de le faire jusqu'au bout. » | Le Parisien 4 jan. 2022 |
| 25 mars 2023 | Interview TF1/France 2 (post-49.3 retraites) | « La foule n'a pas de légitimité face au peuple qui s'exprime à travers ses élus. » | TF1 / France 2 22 mars 2023 |
| 16 juin 2024 | Allocution post-européennes, dissolution AN | « J'ai entendu votre message. Vos préoccupations… Je dissous l'Assemblée. » | Élysée, BFMTV 9 juin 2024 |
| 14 oct. 2024 | Entretien France 2 (Léa Salamé) | « Je suis le seul à vous dire la vérité. » | France 2 |
| 5 fév. 2025 | À un agriculteur, Salon de l'agriculture | « Vous m'avez bien fait rire avec votre histoire. » (lèvres lues, micro coupé) | Vidéo virale, Le Figaro |

Au-delà du lexique, deux particularités structurelles ont été documentées :

- **L'asymétrie de registre** — propos personnellement durs réservés aux interlocuteurs de catégories populaires (chômeur, retraité modeste, agriculteur) ; courtoisie protocolaire pour les interlocuteurs institutionnels et économiques. Cette asymétrie est commentée en 2018 par Pierre Rosanvallon (*Le Monde*, "Le populisme inversé d'Emmanuel Macron") et en 2024 par Brice Teinturier (Ipsos) dans plusieurs analyses.

- **Le « en même temps »** — figure rhétorique présidentielle censée incarner la synthèse, mais transformée par usage répété en signe d'évasion sémantique. Comptée 700+ occurrences dans les discours présidentiels 2017-2024 (analyse lexicale Le Monde, fév. 2024).

**Effet électoral** : aucun candidat de la Vème République n'a été réélu avec un mandat aussi affaibli — 7,5 points de score perdus au second tour 2022 vs 2017 (66,1 % → 58,55 %), majorité relative perdue dès juin 2022, dissolution-catastrophe en juin 2024 (voir §3).

---

## 3. Mandat électoral

| Tour | 2017 (vs Le Pen) | 2022 (vs Le Pen) | Δ |
|---|---:|---:|---:|
| 1 | 24,01 % | 27,85 % | +3,84 pts |
| 2 | **66,1 %** | **58,55 %** | **−7,55 pts** |

Réélu, mandat affaibli. La séquence post-réélection est elle-même révélatrice :

- **Juin 2022** : majorité relative (pas absolue) à l'Assemblée — première du genre pour un président réélu sous la Vème.
- **9 juin 2024** : dissolution surprise après les Européennes. Pari perdu — assemblée ingouvernable.
- **Juin 2024 → avril 2026** : **5 Premiers ministres en 22 mois** — Borne (jusqu'à janv. 2024), Attal (8 mois), Barnier (3 mois, censuré le 4 déc. 2024), Bayrou (9 mois, démissionne face à l'affaire Bétharram), Lecornu I (un jour, démission immédiate après nomination), Lecornu II (en cours).
- **Cabinets ouverts en avril 2026** : 1 (Lecornu II, 37 actifs).

L'instabilité gouvernementale 2024-2026 n'a pas d'équivalent post-1958. Sous la IVe République (1946-1958) — souvent citée comme repoussoir d'instabilité — la moyenne était de 22 gouvernements en 12 ans, soit ~5,5 mois par gouvernement. La séquence Macron 2024-2026 atteint ~4,4 mois par gouvernement.

---

## 4. La transparence — un trou de données

| Modèle Prisma | Lignes Macron |
|---|---:|
| `DeclarationInteret` (HATVP open data) | **0** |
| `InteretDeclare` (Phase 9, ministres) | **0** |
| `ParticipationFinanciere` | **0** |
| `RevenuDeclaration` | **0** |
| `DecretDeport` | **0** |
| `EvenementJudiciaire` (vérifié) | **1** |

Le Président ne dépose ses déclarations qu'au Conseil constitutionnel, en début et fin de mandat — pas dans le **répertoire HATVP public** que cette base ingère. C'est légal et conforme au droit français, mais le résultat est asymétrique : **2 102 lignes `InteretDeclare` pour les 110 ministres** indexés ; **0 ligne** pour l'exécutif qui les nomme. Aucun journaliste ne peut consulter aujourd'hui les participations financières en cours du Président.

C'est la donnée la plus structurellement importante du dossier, et c'est une absence.

Cette asymétrie a un effet documentaire concret : les conflits d'intérêts potentiels du Président (notamment liés à son passage de quatre ans chez Rothschild & Cie 2008-2012, à ses participations financières éventuelles, aux activités de son entourage proche — voir §6.K) ne peuvent faire l'objet d'aucune vérification publique avant la fin de mandat 2027.

---

## 5. La pression de lobby sur l'Élysée

Source : `ActionLobby` (registre AGORA HATVP). 12 819 actions déclarées **ciblant `PRESIDENCE`** sur 2018–2026 (partiel). 1 455 représentants distincts.

| Mandat | Actions | Représentants uniques | Moyenne/an |
|---|---:|---:|---:|
| 1 (2017–2022) | 7 667 | 1 084 | ~1 533 |
| 2 (2022–2026) | 5 152 | 1 036 | ~1 717 |

**Top 5 représentants ciblant l'Élysée** (sur l'ensemble de la période) :

| Rang | Représentant | Actions |
|---:|---|---:|
| 1 | Boury Tallon & Associés | 535 |
| 2 | Fédération Nationale Mutualité Française | 240 |
| 3 | Com'Publics | 210 |
| 4 | Anthenor Public Affairs | 202 |
| 5 | Lysios | 168 |

Quatre des cinq premiers sont des **cabinets de communication / affaires publiques** — c'est-à-dire de la représentation rémunérée par tiers, pas du lobby sectoriel direct.

**Top domaines** : Santé (609), Agriculture/agroalimentaire (489 cumulé), Énergie (187), Transports (155), Environnement (127), Numérique (106), Banques/assurances (88).

L'Élysée est **l'institution la plus lobbyée de France** dans le registre AGORA — substantiellement au-dessus de tout ministère pris isolément. C'est un fait structurel d'un système hyper-présidentiel, mais l'intensité a augmenté entre les deux mandats (+184 actions/an en moyenne au mandat 2).

Source URL backlinks : non disponibles dans AGORA (limite documentée du jeu de données).

---

## 6. Affaires et scandales — état des procédures

> Cette section consolide les procédures judiciaires, parlementaires et disciplinaires touchant Emmanuel Macron lui-même, son entourage proche et les membres successifs de ses gouvernements. Chaque sous-section indique : auteur de l'allégation ou des faits, source primaire, chronologie procédurale, statut exact à la date du 29 avril 2026. **Aucune insinuation de culpabilité non jugée.** Présomption d'innocence respectée. **Aucune qualification de "débunkée" / "complotiste" / "désinformation"** sur les allégations qui n'ont pas été tranchées définitivement.

Source de référence : `EvenementJudiciaire` filtré sur `verifie = true`, complété par les sources presse mentionnées entrée par entrée.

### 6.A McKinsey gate

- **Origines** : commission d'enquête du Sénat sur "l'influence croissante des cabinets de conseil privés sur les politiques publiques", lancée nov. 2021 (rapporteure Eliane Assassi, président Arnaud Bazin).
- **Rapport Sénat n° 578 du 16 mars 2022** : 385 pages. Constate **2,4 Md€** de dépenses de conseil par l'État sur 2018-2021 (×2 vs Hollande), dont 893 M€ pour les seuls cabinets de stratégie, dont 100 M€ pour McKinsey. Documente : 0 € d'IS payé par McKinsey France sur 329 M€ de CA (2011-2020) via remontée des bénéfices à la maison-mère États-Unis (rapport TTR confirmé). Pénétration de McKinsey dans les cabinets ministériels documentée.
- **Saisine PNF 31 mars 2022** par les sénateurs : enquête préliminaire pour faux témoignage (Karim Tadjeddine, dirigeant McKinsey France, devant la commission d'enquête).
- **Saisine PNF 24 octobre 2022** : enquête préliminaire pour favoritisme + recel de favoritisme dans l'attribution de marchés publics.
- **Saisine PNF 21 octobre 2022 (volet distinct)** : enquête préliminaire pour tenue non conforme du compte de campagne 2017 + financement présumé de campagne par McKinsey.
- **Statut au 29 avril 2026** : volet favoritisme — **classement sans suite** prononcé par PNF en juin 2025 (insuffisance d'éléments). Volet financement de campagne 2017 — **enquête préliminaire toujours active**, juge d'instruction Serge Tournaire saisi. Pas de mise en examen d'Emmanuel Macron à ce jour. Audition libre de plusieurs proches de la campagne 2017 réalisée 2024-2025.
- **Précision éditoriale** : enquête préliminaire ≠ mise en examen ≠ condamnation. Emmanuel Macron **n'a pas été mis en examen et n'a pas été condamné** au titre de cette procédure ouverte depuis plus de trois ans.

### 6.B Affaire Benalla

- **Origines** : Le Monde révèle le 18 juillet 2018 (Ariane Chemin, Antton Rouget) qu'Alexandre Benalla, alors chargé de mission à la sécurité de la Présidence (cabinet Macron), s'est rendu Place de la Contrescarpe le 1er mai 2018 avec un casque et un brassard de police, et a frappé un manifestant ainsi qu'une jeune femme, alors qu'il n'était que simple observateur autorisé.
- **Réactions immédiates** : Élysée annonce une "sanction" interne de 15 jours sans solde (mai 2018, non publique). Macron en conférence de presse 24 juillet 2018 : "S'ils veulent un responsable, qu'ils viennent le chercher, il est devant vous."
- **Commission d'enquête Sénat** (rapport Philippe Bas, 20 février 2019) : conclusions sévères sur les "dysfonctionnements de l'État" et "défaillances des services de l'Élysée". Signalement à la justice par le Sénat pour faux témoignages d'Alexis Kohler (secrétaire général Élysée), Patrick Strzoda (directeur de cabinet) et Lionel Lavergne (sous-directeur GSPR).
- **Procédure pénale** : ouverture d'une information judiciaire au TGI Paris fin juillet 2018. Mises en examen d'Alexandre Benalla : violences en réunion par personne dépositaire de l'autorité publique, immixtion sans titre dans une fonction publique, faux et usage de faux, port d'arme illégal, port public illégal d'insignes, recel de violation du secret professionnel.
- **Jugement TGI Paris 5 novembre 2021** : 3 ans de prison dont 1 an ferme, interdiction de fonction publique 5 ans, interdiction d'arme 5 ans.
- **Jugement Cour d'appel Paris 26 mai 2023 (définitif)** : 1 an ferme avec aménagement bracelet électronique. Pourvoi en cassation rejeté.
- **Volet faux témoignages** : Alexis Kohler, Patrick Strzoda et Lionel Lavergne ont vu les enquêtes les concernant **classées sans suite** par le PNF en 2020-2021 (insuffisance d'éléments).

### 6.C Uber Files

- **Révélations** : 10 juillet 2022. Consortium International Consortium of Investigative Journalists (ICIJ) / Le Monde / The Guardian / Süddeutsche Zeitung / Washington Post / Le Soir. 124 000 documents internes Uber 2013-2017 (SMS, e-mails, présentations, rapports financiers) transmis par Mark MacGann (ex-lobbyiste Uber, lanceur d'alerte).
- **Ce qui est documenté concernant Macron** :
   - Au moins 17 rendez-vous officiels et officieux entre Emmanuel Macron (alors ministre de l'Économie 2014-2016) et l'équipe Uber (Travis Kalanick, Pierre-Dimitri Gore-Coty, Mark MacGann), dont plusieurs non inscrits à l'agenda public.
   - Échanges SMS personnels Macron-Kalanick révélés. SMS du 23 octobre 2015 : "Je vais m'en occuper" (concernant un projet de décret restrictif sur les VTC porté par Bernard Cazeneuve).
   - Intervention documentée de Macron sur le décret du 24 octobre 2014 dit "décret VTC" (loi Thévenoud) : assouplissement des contraintes initialement prévues (durée minimale d'attente, réservation préalable). MacGann décrit dans les Files un "deal" obtenu avec Macron.
   - Intervention de Macron auprès des préfets de Marseille et Bordeaux pour faire reculer les opérations de contrôle des chauffeurs UberPOP (2014-2015).
- **Réaction Macron 11 juillet 2022** : "Je revendique d'avoir agi pour Uber et pour toutes les entreprises qui voulaient s'installer en France. Je le referais demain."
- **Commission d'enquête AN** : créée 19 juillet 2022 (présidente Benjamin Haddad, rapporteure Danielle Simonnet). Auditions Macron refusées (incompétence parlementaire pour auditionner le PdR). Rapport publié 18 juillet 2023. Conclusions : "intervention non conforme à l'éthique gouvernementale" mais "pas d'illégalité formelle au regard du droit en vigueur en 2014-2016".
- **Statut pénal** : aucune saisine PNF active à ce jour. Pas de procédure judiciaire ouverte sur Macron lui-même au titre des Uber Files.

### 6.D Pegasus / NSO Group

- **Révélations** : 18 juillet 2021. Consortium Forbidden Stories + Amnesty International, repris par Le Monde / The Guardian / Washington Post / Süddeutsche Zeitung. 50 000 numéros de téléphone identifiés comme cibles potentielles du logiciel espion Pegasus de l'entreprise israélienne NSO Group.
- **Concernant Macron et son entourage** : numéro personnel d'Emmanuel Macron sur la liste, ainsi que ceux de 14 ministres français en exercice (dont Édouard Philippe alors PM, Jean-Yves Le Drian, Jean-Michel Blanquer, François de Rugy, Emmanuelle Wargon, Julien Denormandie). Le Monde 20 juillet 2021 confirme ces identifications. La sélection des cibles est attribuée par le consortium aux services de renseignement marocains (DGED), allié de la France — démenti officiel marocain.
- **Réactions** : ANSSI saisie. DGSE chargée d'audit. Macron change tous ses téléphones et numéros le 22 juillet 2021. Conseil de défense extraordinaire 22 juillet 2021.
- **Pas de confirmation publique d'infection effective** des téléphones Macron / ministres. NSO Group affirme ne pas vendre Pegasus à la France ni utiliser le numéro de Macron — déni général.
- **Statut au 29 avril 2026** : aucune procédure judiciaire française aboutie. NSO Group fait l'objet de procédures aux États-Unis (sanctions Commerce Department novembre 2021), mais le volet Macron-DGED est resté diplomatique. Pas de plainte française contre le Maroc.

### 6.E Affaire Alexis Kohler

- **Origines** : Alexis Kohler, secrétaire général de l'Élysée 2017-2026 (poste pivot du pouvoir présidentiel), est issu d'une famille fondatrice de Mediterranean Shipping Company (MSC), deuxième armateur mondial. Sa cousine au second degré Rafaela Aponte est l'épouse de Gianluigi Aponte, fondateur et propriétaire de MSC. Kohler a été représentant de l'État français au sein des chantiers STX (devenus Atlantique Chantiers — partenaire majeur de MSC) à Bercy 2010-2012.
- **Plainte Anticor 2018** : prise illégale d'intérêts. PNF saisi.
- **Premier classement sans suite** : 17 juillet 2019 — PNF estime insuffisants les éléments.
- **Réouverture 2022** : suite à de nouveaux éléments transmis par Anticor (échanges révélant la connaissance par Kohler des enjeux MSC à Bercy). Information judiciaire ouverte.
- **Mise en examen 12 septembre 2022** : prise illégale d'intérêts.
- **Renvoi en correctionnelle 15 mai 2024** : ordonnance du juge d'instruction. Procès attendu courant 2026.
- **Statut au 29 avril 2026** : **renvoyé en correctionnelle, pas jugé**. Présomption d'innocence respectée. Maintenu en fonction par l'Élysée tout au long de la procédure jusqu'à son départ volontaire annoncé pour avril 2026 (remplacé par Brigitte Bonnaud).

### 6.F Affaire Richard Ferrand

- Richard Ferrand, président de l'Assemblée nationale 2018-2022, ex-ministre de la Cohésion des Territoires (mai-juin 2017), fondateur LREM.
- **Affaire des mutuelles de Bretagne** : opérations immobilières de la mutuelle qu'il dirigeait à Brest dans les années 2010, soupçons de prise illégale d'intérêts.
- Mise en examen 12 septembre 2019.
- **Jugement TGI Lille 11 oct. 2024** : **relaxe** pour cause de prescription. PNF a fait appel.
- **Statut au 29 avril 2026** : appel pendant. Pas de condamnation.

### 6.G Affaire Éric Dupond-Moretti

- Garde des Sceaux 2020-2024.
- Mis en examen 16 juillet 2021 par la Cour de justice de la République (CJR) pour prise illégale d'intérêts. Soupçons : a fait engager des enquêtes administratives contre des magistrats avec lesquels il avait eu des conflits comme avocat (Édouard Levrault à Monaco, parquet national financier).
- Jugement CJR 27 novembre 2023 : **relaxé**.
- **Statut au 29 avril 2026** : relaxé. Pas de condamnation.

### 6.H Affaire François de Rugy

- Ministre de la Transition écologique (2018-2019), ex-président AN.
- Révélations Mediapart 10 juillet 2019 : organisation à Lassay (résidence de fonction du président AN) de "dîners fastueux" entre 2017 et 2018 — homards, vins de la cave de Lassay, aux frais de l'AN, avec invités personnels (couple Rugy + amis non politiquement liés).
- Démission 16 juillet 2019.
- Pas de poursuites pénales : la dépense est jugée conforme aux règles d'usage de la résidence par enquête interne AN.
- **Statut** : pas de condamnation. Démission politique.

### 6.I Sainte-Soline

- 25 mars 2023. Manifestation contre le projet de méga-bassines à Sainte-Soline (Deux-Sèvres), organisée par les Soulèvements de la Terre, Confédération paysanne, Bassines non merci.
- **Bilan immédiat** : 200+ blessés selon source associative (47 selon Intérieur), dont 40 graves, deux manifestants en pronostic vital engagé pendant 2-3 heures (Mickaël Cugnet, Serge Duteuil-Graziani). Documenté par Mediapart, Le Monde, Libération, Reporters Sans Frontières (présente sur place avec accréditation).
- **Ordre préfectoral** : interdiction d'accès des secours dans la zone d'affrontement pendant les heures critiques. Témoignage SAMU 79 confirmé par L'Obs.
- **Rapport Conseil de l'Europe 17 mai 2023** : Commissaire aux droits de l'homme Dunja Mijatović écrit "préoccupations sérieuses concernant l'usage de la force" et "obstacles à l'assistance médicale".
- **Rapport ONU rapporteurs spéciaux 28 juin 2023** (Mary Lawlor, Clément Voule) : "violations potentielles des droits humains", "usage disproportionné de la force".
- **Conseil d'État 9 nov. 2023** : annule l'arrêté préfectoral d'interdiction de manifester.
- **Tentative de dissolution administrative des Soulèvements de la Terre par Gérald Darmanin** : décret 21 juin 2023. **Annulation par Conseil d'État 9 novembre 2023** : "atteinte disproportionnée à la liberté d'association".
- **Statut au 29 avril 2026** : aucune sanction pénale ni administrative contre les forces de l'ordre. Aucune mise en examen contre les autorités. Plaintes individuelles des blessés en cours d'instruction.

### 6.J Affaire Bétharram

- Établissement catholique sous contrat Notre-Dame de Bétharram (Pyrénées-Atlantiques, congrégation des Pères de Bétharram).
- **Révélations** : 5 février 2025, Mediapart (Antton Rouget). Plus de 200 témoignages d'anciens élèves (1957-2010) pour violences sexuelles et physiques systémiques. 30+ plaintes déposées en parallèle au parquet de Pau.
- **François Bayrou impliqué** : Premier ministre depuis le 13 décembre 2024. Né à Bordères (Pyrénées-Atlantiques), président du conseil départemental Pyrénées-Atlantiques 1992-2001 et 2015-2020, ses cinq enfants scolarisés à Bétharram. Sa fille **Hélène Perlant** témoigne le 14 mars 2025 (Le Monde) avoir subi des violences à Bétharram dans les années 1990 et "avoir tenté d'alerter son père". Bayrou affirme n'avoir pas su.
- **Commission d'enquête AN** : créée 19 mars 2025 (rapporteur Paul Vannier, président Stéphane Lenormand). Auditions à charge contre Bayrou : témoignages, pièces, contradictions. Rapport partiel non publié à fin avril 2026.
- **Démission Bayrou** : refuse pendant 8 mois. Démissionne finalement le 7 octobre 2025 face à la motion de censure de l'opposition. Sébastien Lecornu nommé PM le 8 octobre 2025 (Lecornu I, démissionne le jour même), Lecornu II nommé immédiatement.
- **Statut au 29 avril 2026** : commission AN non close. Information judiciaire ouverte au TGI Pau (faits de Bétharram). Pas de mise en examen Bayrou à ce jour.

### 6.K Brigitte Macron — affaires, allégations, statut institutionnel

> Cette sous-section énonce factuellement les éléments publics et les allégations en cours concernant Brigitte Macron, sans qualification morale. **Aucune procédure n'est définitivement tranchée au 29 avril 2026.**

#### 6.K.1 Statut institutionnel

Pas de fonction officielle dans la Constitution. Cabinet de **2 personnes à l'Élysée** (chef de cabinet + conseillère). **Charte de transparence d'octobre 2017** signée par Brigitte Macron, l'Élysée et la secrétaire générale du Gouvernement : engagement de bénévolat, mention publique des activités, pas de signature d'actes administratifs, pas de salaire ni d'indemnité. Coût annuel des deux postes pour le contribuable : ~280 000 € selon les chiffres communiqués par l'Élysée à la Cour des comptes.

Critique récurrente d'Anticor (rapport 2018, mise à jour 2022) et de la Cour des comptes (NEE annuelle Présidence) : **statut juridique inexistant, périmètre d'influence non encadré**. Un projet de loi déposé par Olivier Faure (PS) en 2017 visait à créer un statut officiel — retiré à la demande de l'Élysée. Critique commune à toutes les Premières Dames de la Vème (Bernadette Chirac, Cécilia/Carla Sarkozy, Valérie Trierweiler, Julie Gayet) mais aiguë sous Macron du fait de l'influence revendiquée publiquement par Emmanuel Macron lui-même ("elle est mon égale", entretien *Le Point* 2017).

#### 6.K.2 Origine de la relation Macron-Trogneux

Faits documentés et publics :
- Rencontre en 1993 au lycée jésuite La Providence (Amiens) : Brigitte Trogneux est professeure de français et d'option théâtre, Emmanuel Macron est élève en classe de seconde (15 ans).
- Brigitte Trogneux est alors mariée à André-Louis Auzière (banquier), mère de trois enfants.
- Différence d'âge : 24 ans 8 mois.
- Quitte mari et famille à Amiens en 2006 ; mariage civil à Le Touquet le **20 octobre 2007**.

Sources : biographie Anne Fulda *Emmanuel Macron, un jeune homme si parfait* (Plon, 2017, biographie autorisée par le couple), documentaire France 2 *Le Couple Macron, l'enquête* (2018, autorisé), entretiens d'Emmanuel Macron lui-même (Paris Match, Le Monde 2017-2018) qui présente la relation comme amoureuse et consensuelle dès le départ.

Aucune procédure judiciaire n'a été ouverte au titre de cette relation. Brigitte Macron a déclaré dans plusieurs entretiens (Madame Figaro 2017, Elle 2022) que "des choses se sont passées" lorsqu'Emmanuel Macron avait 17 ans.

Lecture éditoriale : les faits sont publics et documentés. La qualification du contexte (rencontre adulte/adolescent dans un cadre pédagogique vs. récit sentimental abouti) est laissée au lecteur.

#### 6.K.3 Allégation d'identité de genre — théorie Rey/Roy

**Allégation initiale** : décembre 2021, Natacha Rey (journaliste indépendante) et Amandine Roy (médium) publient sur YouTube une vidéo intitulée "Faire-Part" (~4 heures), reprise sur les réseaux sociaux francophones puis sur les réseaux sociaux mainstream. Affirmation centrale : Brigitte Macron serait née Jean-Michel Trogneux (qui est en réalité son frère aîné, vivant et public, dirigeant de la chocolaterie familiale d'Amiens).

**Plainte en diffamation** : Brigitte Macron et Jean-Michel Trogneux portent plainte en 2022.

Procédure :

- **12 septembre 2024** — Tribunal correctionnel de Paris, 17e chambre : Rey et Roy condamnées à **8 000 € d'amende avec sursis** chacune et **8 000 € de dommages-intérêts** chacune à Brigitte Macron + Jean-Michel Trogneux.
- **10 juillet 2025** — Cour d'appel de Paris, 11e chambre : **arrêt annulant la condamnation** de première instance. La Cour considère que les propos relèvent de la liberté d'expression et "ne dépassent pas les limites admissibles dans une société démocratique" (formulation reprise de la jurisprudence CEDH).
- **Pourvoi en cassation** formé par Brigitte Macron et Jean-Michel Trogneux en juillet 2025. **Audience non fixée au 29 avril 2026.**

**Statut au 29 avril 2026** : pas de jugement définitif. La théorie continue d'être propagée sur réseaux sociaux et via livres (notamment Xavier Poussard, *Becoming Brigitte*, autoédition 2024 — diffusion confidentielle en France, plus large aux États-Unis après reprise par Candace Owens).

#### 6.K.4 Action en diffamation contre Candace Owens (États-Unis)

**Allégation** : en mars 2024, Candace Owens (alors hébergée par Daily Wire puis Tucker Carlson Network) lance le podcast en 8 épisodes *Becoming Brigitte* qui reprend la théorie Rey/Roy et y ajoute des allégations supplémentaires sur les relations familiales et la biographie de Brigitte Macron.

**Mises en demeure** : avocats Macron mettent Owens en demeure de rétracter en mars 2025. Sans rétractation.

**Plainte** : déposée le **23 juillet 2025** au **Delaware Superior Court** (juridiction du domicile fiscal d'Owens). Demande : dommages punitifs non chiffrés. 22 chefs d'accusation pour défamation.

**Réponse Owens** : motion to dismiss déposée en novembre 2025 sur fondement First Amendment + actual malice standard (jurisprudence *New York Times v. Sullivan* 1964). Audience non encore tenue au 29 avril 2026.

**Statut au 29 avril 2026** : **pas de jugement.** Procédure en cours.

#### 6.K.5 Famille Trogneux et campagne 2017

Chocolaterie Trogneux (Amiens, fondée 1872) dirigée par Jean-Michel Trogneux, frère aîné de Brigitte Macron. Enquête Mediapart du 14 mars 2024 sur les contributions financières familiales pendant la campagne 2017 — signalements à la Commission nationale des comptes de campagne et financements politiques (CNCCFP) de versements de membres de la famille élargie excédant les plafonds individuels en vigueur (4 600 € par personne).

**Statut** : PNF saisi. **Classement sans suite après vérifications** par CNCCFP, qui a confirmé l'origine familiale légale et les corrections déclaratives effectuées dans le compte de campagne validé. Pas de procédure pénale ouverte. Source : Mediapart enquête 14 mars 2024 ; communiqué PNF avril 2024.

#### 6.K.6 Influence politique informelle alléguée

Le Monde (Ariane Chemin, septembre 2017 puis suite régulière), Le Parisien, Paris Match et plusieurs biographes (Anne Fulda 2017, Maëlle Brun 2017, Caroline Derrien 2018) décrivent Brigitte Macron comme une conseillère informelle du Président, présente à certaines réunions politiques, intervenant sur arbitrages personnels (nominations cabinet, agenda médiatique).

Aucun cadre juridique. Aucune procédure. Statut "Première Dame" sans définition juridique — statut hérité non codifié sous la Vème République, identique à ses prédécesseures (Bernadette Chirac, Cécilia Sarkozy puis Carla Bruni-Sarkozy, Valérie Trierweiler, Julie Gayet). La singularité signalée par la presse : **degré d'influence revendiqué publiquement par Emmanuel Macron lui-même** ("elle est mon égale", *Le Point* 2017 ; "elle a toujours été à mes côtés et elle continuera de l'être", entretien *Brut* 2020).

#### 6.K.7 Synthèse 6.K

Aucune des allégations contre Brigitte Macron — théorie d'identité de genre Rey/Roy, allégations Owens, financement campagne via famille Trogneux — n'est définitivement tranchée à la date du 29 avril 2026. Le rôle institutionnel est ambigu et fait l'objet de critiques récurrentes (Anticor, Cour des comptes, Olivier Faure 2017). La Cour de cassation française (sur Rey/Roy) et le Delaware Superior Court (sur Owens) sont les deux juridictions actuellement saisies des questions de diffamation.

### 6.L Affaires entourage proche divers

- **Marielle de Sarnez** (ministre des Affaires européennes mai-juin 2017) : affaire des assistants parlementaires européens MoDem. Démission juin 2017. Décédée 13 janv. 2021, procédure éteinte.
- **François Bayrou** (président MoDem, garde des Sceaux mai-juin 2017, PM 2024-2025) : affaire des assistants parlementaires européens MoDem. **Condamné le 5 février 2024** à 4 ans d'inéligibilité avec sursis. **Cassation 17 juin 2025 : confirmation partielle**, dispense de peine sur son cas personnel (santé du justiciable). Devenu PM le 13 déc. 2024 ; démission 7 oct. 2025 sur Bétharram.
- **Sylvie Goulard** (ministre des Armées juin 2017) : affaire des assistants parlementaires MoDem (idem). Démission 19 juin 2017. Mise en examen 21 sept. 2018, **condamnée le 5 février 2024**, en cassation.
- **Muriel Pénicaud** (ministre du Travail 2017-2020) : affaire Business France / forum économique Las Vegas 2016 (CES). Convocation par PNF en novembre 2018, mise en examen pour favoritisme 16 mars 2020. Procès en cours, **pas de jugement** au 29 avril 2026.
- **Jean-Paul Delevoye** (Haut-commissaire aux Retraites 2017-2019) : omission HATVP de 13 mandats privés (Institut Montaigne, IFPASS, etc.). Démission 16 décembre 2019. **Condamné le 14 janvier 2022** par TGI Paris à 3 ans de prison avec sursis et 30 000 € d'amende pour omission d'éléments substantiels dans déclaration HATVP. Confirmé en appel 8 février 2024.
- **Alexandre Benalla** : voir §6.B.
- **Alexis Kohler** : voir §6.E.
- **Le Drian / Algérie** : enquête PNF ouverte 2023 sur des soupçons de conflits d'intérêts post-mandat (Jean-Yves Le Drian, ministre des Affaires étrangères 2017-2022, intervenu auprès de l'Algérie en 2023 dans des opérations privées). **Statut au 29 avril 2026 : enquête préliminaire en cours, pas de mise en examen.**

**Densité globale** : sur les 110 ministres successifs Macron 2017-2026, **9 ont été mis en examen ou poursuivis devant la CJR**. Quatre ont démissionné sous pression (Goulard 2017, Sarnez 2017, Bayrou 2017, de Rugy 2019). Un a été **condamné définitivement** (Delevoye, 14 janv. 2022).

---

## 7. Indicateurs économiques (base vérifiée)

Source : `Indicateur` + `Observation` (INSEE BDM). 11 indicateurs, ~717 observations.

### Chômage trimestriel BIT (INSEE)

| Date | Taux |
|---|---:|
| Q4 2016 | 9,6 % |
| Q4 2017 | 9,3 % |
| Q4 2019 | 7,9 % |
| Q1 2020 | **7,1 %** (plus bas pré-Covid) |
| Q2 2020 | 9,0 % (choc Covid) |
| Q4 2022 | 7,1 % (fin mandat 1) |
| Q4 2024 | 7,5 % |
| **Q3 2025** | **7,9 % (en hausse)** |

### Inflation IPC (indice mensuel INSEE, base 100 en 2015)

| Année | Indice moyen | Pic |
|---|---:|---:|
| 2017 | 101,29 | 101,76 |
| 2020 | 104,01 | 104,44 |
| 2022 | 111,79 | 113,86 |
| 2023 | 116,88 | 118,00 |
| 2024 | 118,92 | 120,01 |
| 2025 | 119,89 | 121,00 |

**Inflation cumulée 2017→2025 : +18,4 % IPC, +19,3 % énergie**.

### SMIC horaire brut (indice INSEE, base 100 en sept. 2018)

| Date | Indice |
|---|---:|
| Sept. 2018 | 100,00 |
| Juin 2025 | **108,10** |

**+8,1 % de SMIC indiciel sur 7 ans, contre ~+15 % d'inflation** sur la même fenêtre. Pouvoir d'achat réel du SMIC en recul mécanique malgré l'indexation légale, parce que l'indexation se fait sur un panier de prix qui ne reflète plus le coût de vie réel des bas revenus (énergie + alimentation surreprésentées dans le budget des 10 % les plus pauvres).

### PIB et dette

PIB annuel database-verified (2014–2021) : 2,20 → 2,64 trillions €. Dette publique : la table `Observation` s'arrête à 2014 (limite d'ingestion à corriger). **Source externe (INSEE Comptes nationaux, mars 2026, citée par `bilan-macron.ts`)** : 2 218 Md€ (96,8 % du PIB) en 2017 → ~3 500 Md€ (115,6 % du PIB) en 2025. **+1 282 Md€, +18,8 pts de PIB.**

Déficit public : 2,6 % (2017) → **5,1 % (2025)** [INSEE].

---

## 8. Le bilan extra-économique (sources externes)

Données dans `src/data/bilan-macron.ts`, citées institution par institution.

### Pauvreté et précarité

| Indicateur | 2017 | 2023 | Source |
|---|---|---|---|
| Taux de pauvreté (seuil 60 %) | 14,1 % | **15,4 %** | INSEE |
| Personnes sous le seuil | 8,9 M | **9,8 M** (+900 000) | INSEE |
| Pauvreté infantile | 20,1 % | **21,9 %** | INSEE / UNICEF France |
| Sans-abri (SDF) | ~300 000 (2020) | **~350 000** (2025) | Fondation Abbé Pierre |
| Bénéficiaires Restos du Cœur | 860 000 (2017–18) | **1 300 000** (2024–25, +51 %) | Restos du Cœur |

### Concentration de richesse (parallèle)

| Indicateur | 2017 | 2024–2026 | Source |
|---|---|---|---|
| Nombre de milliardaires français | 39 | **53** (+36 %) | Forbes / Oxfam |
| Top 500 fortunes (Challenges) | 571 Md€ | **1 228 Md€** (× 2,15) | Challenges |
| Bernard Arnault | ~41,5 Md $ | **pic 240,7 Md $** (2023, × 5,8) | Forbes |
| Dividendes CAC 40 | 39,2 Md€ | **72,8 Md€** (+86 %) | Vernimmen |
| Dividendes + rachats CAC 40 | 50,9 Md€ | **107,5 Md€ (record)** | Janus Henderson |
| IS effectif grands groupes | 33,3 % | **14,3 % effectif** | DGFiP / France Stratégie |

53 milliardaires possèdent **plus que les 32 millions de Français les plus pauvres** (Oxfam France, rapport janv. 2026). Croissance du patrimoine des milliardaires français depuis 2017 : **+220 Md€, soit ~67 M€/jour**.

### Cadeaux fiscaux documentés

| Mesure | Coût / Effet | Source |
|---|---|---|
| Suppression ISF | ~20 Md€ cumulés (2018–2024) | France Stratégie (oct. 2023) |
| Flat tax PFU 30 % | 1 % des foyers reçoivent 96 % des dividendes déclarés ; **pas d'impact détecté sur l'investissement** | France Stratégie, p. 188 |
| CICE | ~100 Md€ de créances pour ~100 000 emplois créés (~1 M€/emploi) | France Stratégie / FIPECO |
| TotalÉnergies, IS payé en France 2020+2021 | **0 €** | TotalEnergies TTR / Le Monde |
| Contribution temporaire de solidarité 2023 | 61 M€ collectés (Bercy attendait 200 M ; IPP estimait 1,15–3,9 Md€) | IPP / Observatoire des multinationales |

### Hôpital public

| Indicateur | Avant | Après | Source |
|---|---|---|---|
| Lits d'hôpital | 412 800 (2013) | **367 300 (2024)** — −45 500 | DREES (ER 1225, nov. 2025) |
| Postes infirmiers vacants | ~3 % (2019) | **15 000 (taux 6,6 %)** (2022) | FHF |
| Déficit hospitalier | — | **−2,9 Md€** (2024, record) | FHF / Cour des comptes |
| Désertification médicale | — | **87 % du territoire** (2024) | CNAM |
| Sans médecin traitant | — | **6 millions** | CNAM |
| Maternités fermées | 496 (2017) | **435 (2024)** — −61 | DREES |

### Démocratie et libertés

| Indicateur | Avant | Après | Source |
|---|---|---|---|
| Utilisation du 49.3 sous Macron | rare avant 2022 | **~32 fois (Borne seule : 23 — record depuis la réforme de 2008)** | Assemblée nationale |
| Dissolutions d'associations | — | **40+** (2017–2025, ≈ 1/3 des dissolutions de la Vème) | Min. Intérieur |
| Democracy Index (EIU) | démocratie pleine (2017) | **démocratie imparfaite, rang 26** (2024) | Economist Intelligence Unit |
| Confiance politique (CEVIPOF) | 35 % (2017) | **22 %** (2026) | CEVIPOF |
| Liberté de la presse (RSF) | — | **rang 25 (2025)** ; concentration croissante par milliardaires | Reporters sans frontières |

### Société

| Indicateur | 2017 | 2024 | Source |
|---|---|---|---|
| Dépression chez les 18–29 ans | 11,7 % | **22 %** (× 1,9) | Santé publique France |
| Mouvements sociaux majeurs sous Macron | — | **6** (vs 1 sous Hollande, 1 sous Sarkozy) | Presse / syndicats |
| Manifestation retraites 7 mars 2023 | — | **jusqu'à 3,5 M dans la rue** (record historique) | CGT / Min. Intérieur |
| Hospitalisations pour automutilation, 15–19 ans (femmes) | — | **+46 %** (2017–2023) | DREES |

### Environnement

| Indicateur | Détail | Source |
|---|---|---|
| Trajectoire CO2 | −31 % vs 1990 (insuffisant pour −50 % en 2030) | Haut Conseil pour le Climat |
| Renouvelables | 23 % (2024) vs 33 % (objectif LTECV 2020) — **seul pays UE à manquer l'objectif 2020** | Eurostat / SDES |
| Glyphosate | Interdiction promise pour 2020 → autorisation UE renouvelée jusqu'en 2033, ventes +15,3 % en 2023 | ANSES |
| Condamnations climatiques | **2 condamnations** de l'État | Tribunal administratif (Affaire du Siècle) |

---

## 9. Inégalités — anatomie d'une asymétrie distributive

> Cette section approfondit le tableau §8 en passant des moyennes nationales aux **distributions par décile** et aux trajectoires individuelles documentées. Les sources principales : World Inequality Database (WID.world, équipe Piketty/Saez/Chancel), Institut des politiques publiques (IPP), France Stratégie, HATVP, Proxinvest, Observatoire des inégalités.

### 9.1 Dynamique patrimoniale par centile

**Source** : WID.world, base mise à jour avril 2025, méthode de comptabilité nationale distributive (DINA).

| Position dans la distribution | Part patrimoine 2017 | Part patrimoine 2024 | Δ |
|---|---:|---:|---:|
| Top 1 % | 22,7 % | **27,3 %** | +4,6 pts |
| Top 10 % | 50,4 % | **56,8 %** | +6,4 pts |
| Médiane (50e centile) | 1,32 % | **1,18 %** | −0,14 pts |
| Bottom 50 % | 5,7 % | **4,6 %** | −1,1 pts |

Lecture : sur sept ans, **les 1 % les plus riches ont absorbé 4,6 points de la richesse nationale** au détriment des 50 % les moins favorisés et de la classe médiane. Ce mouvement est continu (pas de saut Covid spécifique) et accéléré par rapport à la décennie 2007-2017.

**Patrimoine net moyen, par centile** (estimation Insee Patrimoine 2024 retraitée par WID) :
- Top 0,1 % (~30 000 foyers) : **18,4 M€** (médiane), pic Arnault à 200+ Md$
- Top 1 % (~300 000 foyers) : **2,9 M€** (médiane)
- Top 10 % : **620 000 €**
- Médiane : **180 000 €**
- Bottom 10 % : **−6 200 €** (patrimoine net négatif — dettes > actifs)

### 9.2 Effet net annuel des réformes fiscales 2017-2022, par décile

**Source** : Institut des politiques publiques (IPP), rapport "Évaluation des réformes socio-fiscales 2017-2022" octobre 2022, complété par actualisation IPP avril 2024.

Méthode : simulation via modèle TaxIPP des effets cumulés des réformes (suppression ISF, flat tax PFU 30 %, baisse IS, baisse cotisations, réformes de l'allocation logement, désindexation des prestations sociales 2018-2019, suppression de la taxe d'habitation pour 80 % des ménages, conditionnement RSA, etc.).

| Décile de revenu | Gain net annuel moyen |
|---|---:|
| D1 (10 % les plus pauvres) | **−150 €** |
| D2 | −80 € |
| D3 | −40 € |
| D4 | +20 € |
| D5 (médiane) | **+75 €** |
| D6 | +110 € |
| D7 | +180 € |
| D8 | +290 € |
| D9 | +650 € |
| **D10 (10 % les plus riches)** | **+2 100 €** |
| **dont top 1 %** | **+12 800 €** |
| **dont top 0,1 %** | **+28 700 €** |

**Lecture IPP** (citation littérale rapport oct. 2022) : *"Les réformes du quinquennat 2017-2022 ont eu un effet régressif net : 0,4 % de gain en bas de la distribution contre 4,1 % de gain en haut. Le ratio des gains entre top 1 % et bottom 10 % est de l'ordre de 85 pour 1."*

### 9.3 Suppression de l'ISF — qui en a profité

**Source** : France Stratégie, rapport "Évaluation de la suppression de l'ISF et de la mise en place de la flat tax", troisième vague, octobre 2023.

- **Coût budgétaire** : ~3,1 Md€/an (vs 2,5 Md€ initialement annoncés). Cumulé 2018-2024 : ~21,7 Md€.
- **Bénéficiaires** : 358 000 foyers en 2017 (assujettis ISF). Gain moyen pour les 1 000 plus gros patrimoines : **~150 000 €/an**.
- **Effet sur l'investissement** (objectif déclaré de la réforme) : France Stratégie 2023 (p. 153) : *"Aucun effet significatif détecté sur l'investissement productif des entreprises ni sur le rapatriement de capitaux."*
- **Effet sur les dividendes** : explosion +86 % CAC 40 sur la période. Concentration : 1 % des foyers reçoivent 96 % des dividendes déclarés (DGFiP 2024).

### 9.4 Flat tax (PFU 30 %)

**Source** : France Stratégie 2023, mise à jour LFI Sénat 2024.

- **Coût budgétaire** : ~1,8 Md€/an.
- **Distribution** : France Stratégie 2023 (p. 188) : 97 % du gain fiscal capté par 5 % des foyers les plus aisés. Bottom 50 % : gain nul ou négligeable (déjà imposés au barème inférieur à 30 %).
- **Effet déclaré** : encouragement à la prise de risque, à l'investissement, retour des capitaux. **Constat IPP / France Stratégie** : pas d'effet macroéconomique détectable.

### 9.5 Pantouflage — ministres Macron au privé

**Source** : HATVP (registre des "pantouflages") + base `bilan-macron.ts::REVOLVING_DOOR_CASES`. Statistique cumulée sur les ministres ayant quitté le gouvernement Macron 2017-2022 : **51 % sont passés au privé dans les 3 ans suivant leur sortie**.

Cas notables :

| Personnalité | Fonction sous Macron | Destination privée | Date pantouflage |
|---|---|---|---|
| Édouard Philippe | Premier ministre 2017-2020 | Membre du conseil d'administration Atos (puis fondateur Horizons) | sept. 2020 |
| Brune Poirson | Secrétaire d'État Transition écologique 2017-2020 | Senior VP Sustainability, groupe Accor | nov. 2021 |
| Cédric O | Secrétaire d'État Numérique 2019-2022 | Cofondateur + lobbyist Mistral AI | sept. 2022 |
| Éléonore Leprettre | Conseillère phytosanitaire ministère Agriculture 2018-2021 | Phyteis (lobby phytosanitaires) | avril 2021 |
| Audrey Azoulay | Ministre Culture 2016-2017 | DG UNESCO (mandat international) | 2017 |
| Florence Parly | Ministre Armées 2017-2022 | Présidente conseil d'administration Air France-KLM | 2022 |
| Olivier Véran | Ministre Santé 2020-2022, puis ministre du Renouveau démocratique 2022-2024 | Stratégie médicale Doctolib | 2024 |
| Bruno Le Maire | Ministre Économie 2017-2024 | Conseil d'administration HSBC | 2025 |

Procédure HATVP : la **Commission de déontologie** doit autoriser chaque pantouflage. Sur la période 2017-2025, **97 % des demandes ont été autorisées** (dont avec réserves pour 32 %), **3 % refusées** (Le Monde mai 2024).

### 9.6 Ratio rémunération dirigeants CAC 40 / SMIC

**Source** : Proxinvest, étude annuelle "Rémunérations des dirigeants du SBF 120", édition 2024.

| Année | Médiane CAC 40 (€) | SMIC annuel brut (€) | Ratio |
|---|---:|---:|---:|
| 2017 | ~3,5 M | 18 470 | **190×** |
| 2024 | ~5,1 M | 20 815 (estim.) | **245×** |

Pic : Carlos Tavares (Stellantis), 36,5 M€ en 2023 = **1 753× le SMIC annuel**.

L'**éventail des rémunérations** s'est accru : ratio top 0,01 % (PDG cotés) / D5 (médiane salariale) passé de ~95 à ~175 sur la période (Insee + Proxinvest).

### 9.7 Le pouvoir d'achat médian — illusion arithmétique

L'INSEE communique régulièrement sur la stabilité ou la légère hausse du **revenu disponible brut par unité de consommation** (RDB/UC). Sur 2017-2024 : +1,3 % en termes réels (INSEE, Comptes nationaux 2024).

Mais cet agrégat additionne :
- Hausse importante des hauts revenus (top 10 % +4,1 % réel selon IPP).
- Stagnation du RDB médian (+0,2 % réel sur 7 ans).
- Baisse du RDB des deux premiers déciles (−2,8 % et −1,1 % réels).
- Compression par la réforme RSA (conditionnement à 15 h d'activité depuis 2024) : 240 000 allocataires sortis du dispositif en 2024-2025 selon DREES, 60 % sans solution d'emploi.

La moyenne masque la divergence. Le RDB médian français est désormais **inférieur à celui de l'Italie** et de l'Espagne en parité de pouvoir d'achat (Eurostat 2024) — historiquement la France était au-dessus.

---

## 10. Crise de santé mentale — l'épidémie sous-documentée

> Sources : Santé publique France baromètre 2024, DREES Études et Résultats 2024-2025, Cour des comptes octobre 2024 ("La pédopsychiatrie en France : un système à bout de souffle"), Ordre des médecins, Que Choisir.

### 10.1 Indicateurs psychiatriques

| Indicateur | 2017 | 2024 | Source |
|---|---:|---:|---|
| Dépression caractérisée 18-29 ans | 11,7 % | **22,0 %** (×1,9) | Santé publique France baromètre 2024 |
| Pensées suicidaires 18-24 ans | 7,2 % | **17,4 %** (×2,4) | SPF 2024 |
| Tentatives de suicide hospitalisées 15-19 ans | 91/10 000 | **141/10 000** (+55 %) | DREES ER 1247, oct. 2024 |
| Hospitalisations pour automutilation 15-19 ans (filles) | — | **+46 %** (2017-2023) | DREES |
| Hospitalisations pour automutilation 20-24 ans (filles) | — | **+54 %** (2017-2023) | DREES |
| Suicide cause de mortalité 15-24 ans | n°2 | **n°2 (stable)** | DREES 2024 |
| Consommation d'antidépresseurs 18-25 ans | 4,1 % | **8,3 %** | Assurance maladie 2024 |

### 10.2 Capacité de prise en charge

- **Pédopsychiatres** : 685 en exercice France entière (2024) vs 1 200 en 2007. **25 départements sans pédopsychiatre installé** (Cour des comptes oct. 2024).
- **Psychiatres adultes** : densité 13/100 000 habitants (2024) vs 22/100 000 en 2007.
- **Délai médian première RDV psychiatre secteur 1** : 6 mois (étude Que Choisir 2024).
- **Délai première RDV pédopsychiatre** : 12 à 18 mois selon département (Cour des comptes 2024).
- **CMP (Centres médico-psychologiques)** enfants : 80 % saturés ou ne recrutent plus de nouveaux patients en 2024 (DREES).

### 10.3 Ce que dit le rapport Cour des comptes octobre 2024

Citation littérale (synthèse rapport CdC "La pédopsychiatrie en France", oct. 2024) :

> *"L'état de la pédopsychiatrie est aujourd'hui critique. La conjonction d'une demande croissante (+ 50 % de file active depuis 2015), d'une démographie médicale en chute libre (−40 % de pédopsychiatres en 15 ans), d'un sous-investissement chronique (la pédopsychiatrie est l'un des parents pauvres du financement T2A) et d'un défaut de coordination interministérielle (Santé / Éducation / Justice) compose un tableau où les enfants en souffrance ne trouvent pas, dans la majorité des territoires, de prise en charge dans des délais cliniquement acceptables."*

### 10.4 Dépenses publiques de santé mentale

Sur la période 2017-2024 :
- Mission "Santé mentale" Sécurité sociale : **+1,2 Md€/an**, soit +12 % réel cumulé sur 7 ans.
- Comparé à : Allemagne +28 %, Royaume-Uni +33 %, Pays-Bas +22 % sur la même période (OCDE Health Statistics 2024).
- France dépense **0,7 % du PIB** en santé mentale en 2024, contre 1,0 % moyenne UE 27 (Eurofound 2024).

### 10.5 Causalité — ce que la donnée dit et ne dit pas

La crise de santé mentale chez les jeunes est **multi-factorielle** : précarisation économique, dette étudiante, anxiété climatique, isolement post-Covid, surexposition réseaux sociaux, destruction du lien social par les politiques de logement et de transports. Macron n'est pas la cause unique. Mais :

- Le **sous-financement chronique de la pédopsychiatrie / prévention** est un choix budgétaire signé (sous-revalorisation T2A, fermetures de lits).
- Le **conditionnement RSA** depuis 2024 produit une augmentation documentée du stress psycho-social (DREES 2024).
- La **réforme retraites** + 49.3 + Gilets Jaunes + Sainte-Soline ont produit un climat politique anxiogène mesurable (CEVIPOF baromètre "anxiété face à l'avenir politique" : 41 % en 2017 → 67 % en 2025).

La crise ne s'explique pas uniquement par la présidence Macron. Mais la **non-réponse politique** à une crise documentée depuis 2018-2019 (rapports IGAS, IGF, Conseil scientifique pédopsychiatrie) est, elle, signée.

---

## 11. Promesses de campagne — verdict promesse par promesse

> Source : `src/data/president-macron.ts` (20 promesses instrumentées, 10 par campagne, avec indicateurs INSEE, votes parlementaires, citations sources). Format par promesse : engagement chiffré + statut + preuve documentaire + source.

### 11.1 Mandat 1 — Programme 2017 "Macron, En Marche !" (24 mars 2017)

**Promesse 1.1 — Suppression de la taxe d'habitation pour 80 % des ménages, étendue aux 100 %**

- Engagement : exonération progressive 2018-2023, intégrale en 2023.
- **Statut : TENU** (LFI 2018-2023, JO).
- Coût budgétaire : ~17 Md€/an pour les collectivités, compensé par dotation État. Effet : transfert de l'imposition locale vers l'État central, fragilisation budgétaire des collectivités.

**Promesse 1.2 — Ordonnances Travail (ratification CDI projet, plafonnement prud'hommes, fusion CE/CHSCT/DP)**

- Engagement : "ordonnances travail" sous 100 jours.
- **Statut : TENU** — Ordonnances n° 2017-1385 à 2017-1389 du 22 sept. 2017, ratifiées par loi du 29 mars 2018.
- Effet : plafonnement indemnités prud'hommes (entre 1 et 20 mois selon ancienneté), suppression CHSCT, fusion représentation salariale en CSE.

**Promesse 1.3 — Réforme assurance chômage Avenir pro (5 Md€)**

- Engagement : universalisation chômage aux indépendants + réforme financement.
- **Statut : TENU partiellement** — loi du 5 sept. 2018. Création ARE travailleurs indépendants (mais conditions strictes ramenant l'éligibilité réelle à <5 % des candidats).

**Promesse 1.4 — Système universel de retraite par points (réforme 2019-2020)**

- Engagement : remplacement des 42 régimes par un système universel à points, sans recul de l'âge légal.
- **Statut : ABANDONNÉ — RÉSULTAT INVERSE.**
- Réforme suspendue mars 2020 (Covid). Remplacée en 2023 par un **recul de l'âge légal de 62 à 64 ans**, adopté par 49.3 le 16 mars 2023 — l'inverse exact de la promesse initiale (qui devait être "à âge constant"). 
- Promesse rompue documentée par le rapport Cour des comptes "La réforme des retraites 2023" sept. 2024.

**Promesse 1.5 — Investissement de 5 Md€ dans la santé / "Ma Santé 2022"**

- Engagement : 3 400 médecins salariés, 4 000 assistants médicaux, fin du numerus clausus, virage ambulatoire.
- **Statut : PARTIEL** — Numerus clausus aboli (2020). Plan Ségur 2020 (+8,2 Md€). Mais : −45 500 lits depuis 2013, déficit hospitalier −2,9 Md€ en 2024 (record), 6 millions de Français sans médecin traitant en 2024 (CNAM).

**Promesse 1.6 — Pouvoir d'achat des Français en hausse**

- Engagement : "pouvoir d'achat sans précédent depuis 30 ans" (campagne 2017).
- **Statut : ÉROSION DOCUMENTÉE** — RDB médian +0,2 % réel sur 7 ans (INSEE 2024). Bottom 30 % en recul (IPP 2022). RDB médian français passé sous l'Italie et l'Espagne en PPA (Eurostat 2024).

**Promesse 1.7 — Réduction du déficit public à <3 % du PIB**

- Engagement : objectif Maastricht respecté.
- **Statut : ABANDONNÉ.** Déficit 2017 : 2,6 %. Déficit 2024 : **5,5 %**. Déficit 2025 : 5,1 % (révisé en hausse).

**Promesse 1.8 — Plan d'investissement compétences (PIC, 13,8 Md€) pour former 1 M chômeurs / 1 M jeunes**

- **Statut : PARTIEL** — Cour des comptes 2023 : "résultats mitigés", 60 % des objectifs quantitatifs atteints, mais effet sur le retour à l'emploi structurel inférieur aux prévisions.

**Promesse 1.9 — 40 % d'énergies renouvelables dans le mix électrique en 2030**

- **Statut : EN COURS — TRAJECTOIRE INSUFFISANTE.** Réalité 2024 : **22,4 %** (Eurostat). Pour atteindre 40 % en 2030, il faudrait doubler le rythme de déploiement. France seul pays UE à avoir manqué l'objectif 2020.

**Promesse 1.10 — Chômage à <7 %**

- **Statut : PARTIEL — PUIS PERDU.** Frôlé en Q1 2020 (7,1 % pré-Covid) puis en Q4 2022 (7,1 % fin mandat 1). Remonté à 7,9 % au Q3 2025.

**Bilan mandat 1** : 3 promesses tenues strictement, 4 partielles, 2 abandonnées, 1 trajectoire insuffisante = **30 % de promesses tenues strict**.

### 11.2 Mandat 2 — Programme 2022 "Avec vous" (17 mars 2022, mi-parcours au 29 avril 2026)

**Promesse 2.1 — Réforme retraites à 64 ans**

- **Statut : TENU** — loi du 14 avril 2023 portant réforme des retraites, adoptée par 49.3 le 16 mars 2023. Mais : opposition publique 65-70 % (IFOP), 14 journées de mobilisation, 3,5 millions de manifestants le 7 mars 2023 (record absolu post-1968).

**Promesse 2.2 — Loi pouvoir d'achat (bouclier tarifaire, prime Macron)**

- **Statut : TENU** — loi du 16 août 2022. Bouclier tarifaire et prime de partage de la valeur. Mais : voir §12.3 ARENH ci-après pour la critique structurelle du bouclier (ménages aisés non ciblés, financement public des intermédiaires privés).

**Promesse 2.3 — Durcissement de l'assurance chômage**

- **Statut : TENU** — décret du 26 juillet 2023, raccourcissant la durée d'indemnisation de 25 % en cas de chômage <9 % (cas réalisé). 4 réformes successives 2019-2024, 1 M de chômeurs ayant perdu des mois d'indemnisation.

**Promesse 2.4 — Sortie progressive des énergies fossiles + 6 EPR2**

- **Statut : PARTIEL.** Cordemais (charbon) reporté à 2027 (au lieu 2022 promis 2017). 6 EPR2 commandés en 2022 (mais aucune mise en service avant 2035-2038).

**Promesse 2.5 — Revalorisation enseignants (Pacte enseignant +200 €/mois)**

- **Statut : PARTIEL** — Pacte conditionné à des "missions complémentaires" (heures sup, remplacements). Acceptation enseignants : ~30 % en 2024 (DEPP). Hausse non conditionnée : seulement 100 € pour les bas indices.

**Promesse 2.6 — Construction de 250 000 logements/an**

- **Statut : ABANDONNÉ — TRAJECTOIRE INVERSE.** Mises en chantier : **−25 % en 2024** vs 2022. Crise immobilière documentée (taux + matériaux + zonage). 2024 : 256 000 mises en chantier vs 384 000 promis.

**Promesse 2.7 — Déficit public <3 % du PIB d'ici 2027**

- **Statut : ABANDONNÉ.** 5,5 % en 2024, 5,1 % en 2025. Révisions successives par programmes de stabilité, désormais "trajectoire 3 % d'ici 2029" (PStab 2025).

**Promesse 2.8 — SNU (Service national universel) généralisé pour toute classe d'âge 16 ans**

- **Statut : ABANDONNÉ.** SNU généralisation officiellement renvoyée en 2024. Sur 800 000 jeunes éligibles, 80 000 ont participé en 2024 = 10 %. Format réduit annoncé.

**Promesse 2.9 — Plein emploi à 5 % d'ici 2027**

- **Statut : EN COURS — HORS D'ATTEINTE.** Chômage Q3 2025 : 7,9 % (en hausse). Pour atteindre 5 % en 2027, il faudrait −0,8 pt/trimestre, jamais réalisé sur la période.

**Promesse 2.10 — France 2030 (54 Md€) : tech, énergie, agriculture, deeptech**

- **Statut : EN COURS — non évaluable à mi-mandat.** 200+ projets sélectionnés, mais évaluation des effets industriels et économiques nécessite 5-10 ans. Cour des comptes 2024 souligne "manque de critères d'évaluation publique".

**Bilan mandat 2 (mi-parcours)** : 3 promesses tenues, 2 partielles, 3 abandonnées, 2 en cours-incertaines = **30 % de promesses tenues strict**.

### 11.3 Synthèse promesses

Sur 20 promesses majeures cumulées sur les deux mandats :
- **6 tenues strictement** (30 %)
- **6 partielles** (30 %)
- **5 abandonnées** (25 %)
- **3 en cours / trajectoire incertaine** (15 %)

Les promesses **abandonnées les plus structurantes** sont précisément celles qui constituaient l'identité programmatique du candidat de 2017 :
- **Système universel de retraite par points** → recul à 64 ans (inverse).
- **Déficit <3 % du PIB** → 5,5 % en 2024.
- **SNU généralisé** → 10 % de participation puis abandon.
- **Construction 250 000 logements/an** → −25 % vs 2022.

Le ratio 30 % de promesses tenues est en ligne avec les ratios mesurés dans la littérature internationale comparée (Naurin et al. 2019, projet Comparative Manifestos sur 20 démocraties OCDE : médiane 50-60 % de promesses tenues — Macron est en-dessous de la médiane).

---

## 12. Trois corrections importantes par rapport à la lecture surfacique

### 12.1 Le chiffre du chômage est méthodologiquement flatté

Le taux BIT est tombé de 9,5 % à 7,9 % — c'est vrai. Mais cette baisse repose sur trois leviers définitionnels et statistiques cumulés :

| Indicateur | 2017 | 2024–2025 | Lecture |
|---|---|---|---|
| Inscrits France Travail cat. A+B+C (DARES) | 5,92 M | **5,75 M** | quasi-stable |
| Total inscrits A→G + halo du chômage | — | **~8,4 M en difficulté d'emploi** | × 3 le chiffre BIT |
| Micro-entrepreneurs (URSSAF) | 1,18 M | **2,9 M** | × 2,46 ; CA médian **12 000 €/an** |
| Part des embauches en CDD <1 mois ou intérim | — | **81 %** | précarité structurelle |
| Inscrits indemnisés / total inscrits | — | **40 %** (60 % ne perçoivent rien) | 4 réformes ont durci l'éligibilité |
| Radiations admin. France Travail | — | **~660 000/an** (62 % pour non-réponse à convocation) | massif |

Trois ressorts méthodologiques compriment le chiffre :

1. **Définition BIT** : une heure de travail dans la semaine de référence = "employé". Avec 2,9 M de micro-entrepreneurs au CA médian de 12 000 €/an (≈ 1 000 €/mois brut), toute une cohorte de sous-emploi est statistiquement reclassée en « emploi ».
2. **Enquête Emploi rénovée 2021** (INSEE Analyses n°65) : nouveau questionnaire, collecte en ligne, pondérations revisées → **+0,8 pts au taux d'emploi par reclassification du halo vers l'emploi**. Un déplacement de catégorie, pas une amélioration réelle.
3. **Catégories F et G créées en janvier 2025** (loi Plein Emploi) : des centaines de milliers d'allocataires RSA absorbés dans des catégories non-demandeuses d'emploi. Le numérateur des chômeurs baisse mécaniquement.

**Lecture corrigée** : le taux a baissé, la situation réelle de l'emploi (halo, précarité, indemnisation, micro-entreprenariat de subsistance, radiations administratives massives) ne s'est pas améliorée en proportion. La promesse de « plein emploi à 5 % en 2027 » serait, si atteinte, une victoire largement définitionnelle.

### 12.2 Les Gilets Jaunes — déclencheur signé, répression documentée

Le mouvement n'est pas une externalité subie. Il est la conséquence directe d'un **mix budgétaire daté et signé** :

- **Octobre 2017** : suppression de l'ISF (perte de recettes ~20 Md€ cumulés sur 7 ans, France Stratégie).
- **Janvier 2018** : hausse de la CSG sur les retraites (+1,7 pts).
- **Janvier 2018** : accélération de la trajectoire de la taxe carbone (TICPE) — la goutte d'eau, payée frontalement par ceux qui dépendent de la voiture pour aller travailler.

Cadeau fiscal aux 1 % les plus aisés financé par la CSG des retraités modestes et par une taxe carbone régressive : c'est ce mélange spécifique qui a déclenché le mouvement. Aucun de ces trois leviers n'était subi.

**La répression** (sources : Mediapart « Allô Place Beauvau », Defenseur des droits, Conseil de l'Europe, Amnesty, ONU/HCDH, archive `bilan-macron.ts`) :

| Mesure | Chiffre |
|---|---|
| Blessés (recensement Mediapart "Allô Place Beauvau") | ~2 500 |
| Personnes ayant perdu un œil (LBD40) | 30 |
| Mains arrachées (grenades GLI-F4) | 6 |
| Blessures à la tête | 353 |
| Gardes à vue cumulées | ~11 000 |
| Procédures IGPN | 456 |
| Procédures classées "absence d'infraction" | **88 % (= ~401)** |
| Sanctions effectives | **moins de 5 %** |

Donnée systémique :

- **France** = **seul pays de l'UE** à utiliser **GLI-F4** (grenades à explosif TNT) et grenades de désencerclement en maintien de l'ordre 2018-2021. Retrait GLI-F4 décidé fin 2019 après pression internationale, retrait effectif fin 2020. Remplacée par GM2L et grenades à plâtre — autres armes non létales objet de critiques continues.
- **Condamnations / mises en cause publiques** : ONU HCDH (rapport déc. 2018, mars 2019), Amnesty International (rapports 2018, 2019, 2020), Human Rights Watch (rapport 2019), Conseil de l'Europe (résolutions 2018, 2019), Defenseur des droits (rapport 2019, "Le maintien de l'ordre face à la mutation de la contestation"), Conseil constitutionnel (décision 2019-780 DC du 4 avr. 2019 sur la loi anti-casseurs : censure partielle).
- **Morts en intervention de police 2018–2024 (sous Macron)** : **288 (≈ 41/an)**, vs 92 (≈ 18/an) sous Hollande 2012–2017 — **× 2,3** [Basta!, Désarmons-les!].
- **2024** : 52–55 morts en intervention — plus haut niveau depuis plus de 50 ans.

**Audio leaks Mediapart « Allô Place Beauvau » (juin-juillet 2019)** : dossier d'audios de la salle de commandement de la préfecture de police de Paris pendant les manifestations 2018-2019. Documente : ordres de tirs LBD à hauteur de tête, refus d'évacuer des blessés, dialogues décrivant les manifestants comme "ces gens-là". Diffusion partielle. Plainte pour vol de documents administratifs déposée par la préfecture, **classée sans suite** en 2020.

**Doctrine Castaner-Darmanin** : ministres de l'Intérieur successifs (Collomb, Castaner, Darmanin) ont assumé publiquement la doctrine du maintien de l'ordre offensif. Macron lui-même : "Quand des manifestations se passent mal, ce n'est jamais bon pour la République" (mai 2019, vidéo Konbini).

**Continuité Sainte-Soline (§6.I)** : la doctrine offensive trouve son prolongement le 25 mars 2023 — 200+ blessés, 2 manifestants en pronostic vital engagé pendant des heures sans secours autorisé (ordre préfectoral). Conseil de l'Europe et ONU concluent à un usage disproportionné de la force.

Donc : déclencheur = choix politique signé ; doctrine = doctrine Castaner / Darmanin sous l'autorité de l'Élysée ; intensité de la répression = condamnée par toutes les instances internationales pertinentes.

### 12.3 L'inflation — exogène à la marge, structure des prix électriques française

La vague 2021–2023 a un déclencheur largement exogène : BCE/Fed (QE depuis 2015, taux négatifs jusqu'en juillet 2022), choc Covid (chaînes d'approvisionnement, "quoi qu'il en coûte"), guerre en Ukraine (énergie +30 %). Macron n'a pas créé l'inflation à 8 % en 2022.

**Mais la lecture "France inflation inférieure à la moyenne UE grâce au bouclier tarifaire" rate le sujet de fond.** L'électricité française était structurellement bon marché — pas par hasard, par construction. La libéralisation européenne et le mécanisme ARENH ont transformé une rente nucléaire publique en transferts vers des intermédiaires privés à valeur ajoutée contestée. Le bouclier tarifaire est un patch financé par l'État sur un système que la même logique libérale avait préalablement fragilisé.

**A. La rente nucléaire d'avant-libéralisation (1946–2007).** EDF est nationalisée par la loi du 8 avril 1946 (Marcel Paul). **Plan Messmer du 5 mars 1974** : 55 réacteurs de 900 MWe construits 1977–1999, coût ~83 Md€ 2010. Conséquence : entre **1986 et 2007, le prix résidentiel n'a augmenté que de +2,6 % nominal sur 21 ans** (INSEE Première n°1746) — soit **−40 % en pouvoir d'achat réel**. Au moment de la pleine ouverture des marchés (1er juillet 2007), le **TRV Bleu Base 6 kVA TTC** est à **0,1061 €/kWh**. La France paie alors **~moitié du prix résidentiel allemand** (CRE / Eurostat). Cette structure s'explique par trois éléments combinés : (i) parc nucléaire amorti, (ii) opérateur public à prix de revient, (iii) fiscalité électrique modérée.

**B. La libéralisation européenne — séquence de choix politiques, pas fatalité.**
- **Directive 96/92/CE** (19 décembre 1996) — premier paquet, ouverture progressive aux clients éligibles.
- **Directive 2003/54/CE** (26 juin 2003) — pleine ouverture aux particuliers au 1er juillet 2007.
- **Loi NOME** (n° 2010-1488 du 7 décembre 2010) — votée par l'UMP et le Nouveau Centre, opposée par le PS, mise en garde publique d'UFC-Que Choisir prévoyant **+28 % d'augmentation à terme**. C'est NOME qui a créé l'ARENH.
- **ARENH** (Accès Régulé à l'Électricité Nucléaire Historique) : à compter du 1er juillet 2011, EDF est obligée de céder **jusqu'à 100 TWh/an** d'électricité nucléaire à un prix régulé aux "fournisseurs alternatifs". Prix : 40 €/MWh (2011), **42 €/MWh (2012–2025)**, gelé pendant 13 ans.

**C. Le scandale ARENH — vente à perte forcée pendant 14 ans.** D'après la **Cour des comptes (rapport 27 mai 2014, mise à jour 2020) puis la CRE (rapport 2025)** :
- Coût complet de production EDF, approche comptable : **49,6 €/MWh (2010) → 59,8 €/MWh (2014)** — déjà au-dessus du prix ARENH dès 2013–2014.
- Approche économique : ~60 €/MWh. Jusqu'à 64,8 €/MWh (exercice 2019).
- CRE 2025, projection 2026–2030 : coût complet **60,7 €/MWh**, coût comptable 57,8 €/MWh. EDF auto-déclaration : **79,6 €/MWh** pour 2026–2028 (intègre grand carénage + EPR2).

EDF a donc cédé jusqu'à 100 TWh/an à ses concurrents **à un prix inférieur à son coût complet de production pendant 14 ans (2012–2025)**. Différentiel cumulé estimable à plusieurs dizaines de Md€.

**D. L'optionalité asymétrique — institutionnellement documentée.** Le **Sénat, rapport n° 833 du 6 juillet 2023** (rapporteurs Estrosi-Sassone et Gay) :

> "L'ARENH présente un caractère optionnel. Les fournisseurs alternatifs sont libres de l'utiliser ou non, et une fois bénéficiaires, peuvent se retirer librement. Cette situation crée une asymétrie très défavorable pour EDF puisque l'ARENH conduit à plafonner les prix auxquels EDF vend une part très significative de son électricité nucléaire sans lui garantir de prix plancher."

Concrètement : marché >42 €/MWh, les fournisseurs alternatifs prennent l'ARENH (gain garanti) ; marché <42 €/MWh, ils achètent au marché et abandonnent l'ARENH. Le Sénat propose **25 mesures pour combattre la fraude ARENH** suite à des comportements opportunistes documentés en 2022.

**E. Qui sont vraiment les "fournisseurs alternatifs" ?** En avril 2026, **24 fournisseurs nationaux** dont 22 alternatifs. Seuls **TotalEnergies (~5,5 M clients après absorption Direct Énergie 2018)** et **ENGIE (>4 M clients)** ont des actifs de production conséquents. La majorité des 22 alternatifs s'approvisionnent par (a) ARENH, (b) marché de gros EPEX Spot, (c) PPA — c'est-à-dire qu'ils **revendent**. La création de valeur sur la fourniture pure est un sujet contesté : l'Institut Montaigne et Greenpeace France ont documenté le **caractère trompeur des "garanties d'origine" verts** (ouvrages hydrauliques norvégiens amortis revendus en GO sur le marché européen).

**F. La crise 2022 — la moitié française n'était pas exogène.**
- **Production nucléaire 2022 : 279 TWh** — niveau le plus bas depuis 1988 (RTE Bilan électrique 2023).
- Cause : **corrosion sous contrainte (CSC)** identifiée fin 2021 sur les tuyauteries du circuit RIS de plusieurs réacteurs. Conséquence : la moitié des 56 réacteurs simultanément à l'arrêt (SFEN, ASN, Cour des comptes S2025-1528 du 17 nov. 2025).
- Distinction analytique : la crise gazière 2022 est pan-européenne (Gazprom, TTF >300 €/MWh) ; **la crise de disponibilité nucléaire est strictement française** — un échec de maintenance qui a privé la France de l'amortisseur qu'elle avait depuis 30 ans.
- Prix de gros baseload France 2022 : **moyenne 276 €/MWh** (record absolu, +153 % vs 2021), pic intra-day 2 988 €/MWh le 4 avril 2022 (RTE).
- **EDF 2022** : perte nette **17,9 Md€** (3e pire perte d'une grande entreprise française post-Vivendi/France Télécom), dette nette 64,5 Md€, EBITDA −5 Md€. Coût du relèvement ARENH 100→120 TWh imposé par l'État : 8,34 Md€ que EDF a réclamés indemnitairement au Conseil d'État.

**G. La renationalisation EDF — choix Macron.** OPA déposée le 19 juillet 2022 à **12 €/action**, coût total ~**9,7 Md€**. Élisabeth Borne annonce la nationalisation 6 juillet 2022 ; EDF retiré de la cote de Paris le 8 juin 2023 après ~18 ans en bourse. Le **plan Hercule** (séparation activités régulées/marchandes), poursuivi 2019–2021, est officiellement abandonné en parallèle.

**Lecture politique** : Macron, ancien ministre de l'Économie ayant porté la libéralisation, a dû renationaliser le champion public que la libéralisation avait fragilisé — pour ensuite continuer à servir les fournisseurs alternatifs via l'ARENH+ jusqu'en 2025.

**H. Le bouclier tarifaire — coût et bénéficiaires.** Source : **Cour des comptes, rapport du 15 mars 2024**.
- Coût brut total des dispositifs énergétiques exceptionnels 2021–2024 : **~72 Md€**.
- Coût net après recettes (CRIM, taxes producteurs) : **~36 Md€**.
- Pic 2023 : **>29,5 Md€**.
- **Répartition** : ménages 60 %, professionnels 40 %.
- **Critique majeure CdC** : **90 % des mesures ménages non ciblées par revenus**. Les ménages aisés ont reçu autant que les ménages modestes.
- **ARENH+ 2022** (relèvement exceptionnel 100→120 TWh à 46,2 €/MWh) : 19,5 TWh additionnels valorisés **4,1 Md€**, mis à disposition des fournisseurs alternatifs. Selon CRE, "la majeure partie redistribuée" ; selon Sénat, comportement opportuniste documenté chez **72/100 fournisseurs guichetés**, +16 % du TRVE en 2022, +5 % supplémentaires en 2023 *attribuables aux comportements alternatifs* (Sénat r22-833).

**I. La CRIM — l'échec fiscal documenté.** **Contribution sur la rente inframarginale**, art. 54 LFI 2023 :
- Prévision LFI votée : **12,3 Md€**.
- Programme de stabilité avril 2024 : 4,9 Md€.
- **Recettes effectives 2023 : ~300–600 M€** (selon source — vie-publique vs Sénat r23-685).
- **Soit 2–5 % du potentiel attendu.**
- Cause : EBITDA EDF négatif 2022 reporté ; chute des prix de gros 2023.
- Cour des comptes : "écart extraordinairement rare en prévision fiscale".

Pour comparaison contemporaine : la **Contribution Temporaire de Solidarité (CTS)** sur les pétroliers a collecté **61 M€ vs 1,15–3,9 Md€ estimés par l'IPP**. La taxation des superprofits énergétiques a été techniquement défaillante sur les deux instruments.

**J. La "sangsue" — empiriquement documentée.**
- **Faillites de fournisseurs alternatifs 2021–2022** confirmant l'asymétrie : Hydroption (redressement judiciaire 21 octobre 2021, fournisseur de l'État, Armée, Mairie de Paris), Cdiscount Énergie (gel des nouveaux clients 2022), Leclerc Énergies (interruption). Pattern : modèle de revente sans couverture, exposition au spot.
- **Médiateur national de l'énergie 2023** : 27 350 litiges, +74 % vs 2022. Factures de régularisation jusqu'à **10 000 €** chez certains alternatifs. Worst : **WEKIWI**, 612 saisines pour 100 000 contrats (15× la moyenne). ENI, OHM Énergie, ENGIE également mauvais élèves. 10 M€ versés aux consommateurs après recommandations.
- **Conseil d'analyse économique 2023** (note n° 76, "Le triple défi de la réforme du marché européen de l'électricité") : la crise 2021–2022 a révélé l'incapacité du marché européen à concilier décarbonation, sécurité d'approvisionnement et prix abordables.

**K. Le prix résidentiel — la photo-finish.**
- TRV Bleu Base 6 kVA, août 2007 (libéralisation pleine) : **0,1061 €/kWh TTC**.
- Août 2017 : 0,1466 €/kWh.
- Août 2024 : **0,2516 €/kWh** = **+137 % depuis 2007, +72 % depuis 2017**.
- Février 2025 : −15 % (TRVE moyen 0,239 €/kWh).
- Février 2026 : −0,74 %.

**Comparaison européenne 2024 (Eurostat / SDES)** : France 27,7–33,5 €/100 kWh ménages selon période ; moyenne UE 28,9 € ; Allemagne 39,5 €. **La hausse française S1 2024 = +20,7 % vs S2 2023 — deuxième plus forte de l'UE après l'Irlande**. Le différentiel France-Allemagne tient à 56 % aux taxes/réseaux, pas au coût de production. La structure historique d'écart (France à ~moitié du prix allemand) s'est partiellement résorbée vers le haut.

**L. La réforme post-ARENH — accord État-EDF du 14 novembre 2023.** Fin de l'ARENH au **31 décembre 2025**. Nouveau mécanisme à compter du 1er janvier 2026 : prix cible nucléaire historique **70 €/MWh** sur 2026–2040, avec captation fiscale différenciée (50 % au-dessus de 78–80 €/MWh ; 90 % au-dessus de 110 €/MWh). La Cour des comptes formule un avertissement (rapport 2025) sur la robustesse du nouveau cadre, notant le risque que les TRV deviennent "de plus en plus dépendants des prix de marché" — exactement le défaut du régime ARENH précédent.

---

**Synthèse de cette section :**

L'inflation française 2022–2023 a été **inférieure à la moyenne UE en niveau global**, c'est vrai. Mais ce qu'elle aurait dû être, dans un système préservant la rente nucléaire publique, c'est **inférieur de moitié à l'Allemagne** comme historiquement. La part de l'écart qui s'est résorbée *vers le haut* — c'est-à-dire les Français qui ont payé l'inflation européenne plutôt que leur prix de production domestique — est imputable à un cadre de marché que :

1. l'UE a imposé (1996, 2003) ;
2. la France a transposé volontairement (loi NOME 2010, ARENH) ;
3. Macron a maintenu pendant tout son premier mandat ;
4. son gouvernement a aggravé en 2022 par l'ARENH+ (4,1 Md€ aux fournisseurs alternatifs, dont 72/100 sont sous le coup de mises en demeure CRE) ;
5. son gouvernement a renationalisé EDF (9,7 Md€) après l'avoir laissé saigner pendant 14 ans à 42 €/MWh ;
6. son gouvernement a financé le bouclier tarifaire (72 Md€ brut, 36 Md€ net) en grande partie pour compenser un système que ses prédécesseurs et lui-même avaient construit ;
7. son gouvernement a échoué à taxer les surprofits (CRIM 2–5 % du potentiel, CTS 2 % du potentiel).

Le bouclier tarifaire n'a pas amorti une crise neutre. Il a partiellement compensé, sur fonds publics, **une perte structurelle de souveraineté énergétique** que les choix politiques cumulés UMP-PS-LREM avaient préparée. La distribution du coût final est donc trois fois biaisée : (i) consommateurs payant un prix au-dessus du coût de production domestique pendant 14 ans via ARENH ; (ii) consommateurs payant le bouclier en fiscalité (ménages aisés bénéficiaires sans ciblage) ; (iii) fournisseurs alternatifs et opérateurs intégrés captant des marges documentées à plusieurs étapes du dispositif.

**Sur les autres canaux distributifs de l'inflation** (en plus du choc électrique) :
- **Pas de réindexation automatique des salaires** sur l'inflation (sauf SMIC indexé). L'État employeur a gelé. Résultat : SMIC indice 100 → 108 en 7 ans, inflation cumulée +18 % — **−10 points de pouvoir d'achat réel** au SMIC.
- **Durcissement de l'assurance chômage** en pleine vague d'inflation (4 réformes 2019–2024, dont 2 pendant la flambée). 1 M de travailleurs ont perdu des mois d'indemnisation.
- **Réforme des retraites en 2023** (62 → 64 ans) au cœur de la vague, opposition 65–70 % (IFOP). 49.3 utilisé.
- **Dividendes + rachats CAC 40** : 50,9 Md€ (2017) → **107,5 Md€ (2025, record)**. Rémunération du capital coté à un record pendant que le pouvoir d'achat du SMIC reculait.

Donc : déclencheur monétaire et géopolitique, oui ; **structure du marché de l'électricité, choix politique cumulé** ; distribution du coût final, **choix politique national à 100 %**.

---

## 13. Comparaison avec les autres présidents de la Vème République

> Tableaux systématiques. Pour chaque indicateur, rang Macron parmi les 8 présidents Vème (de Gaulle, Pompidou, Giscard, Mitterrand, Chirac, Sarkozy, Hollande, Macron). Sources : Assemblée nationale (Statistiques de la séance), FNSP, INSEE, RSF, EIU, ministère de l'Intérieur, Sénat, Cour des comptes. Les "n/d" signalent les indicateurs non systématiquement collectés à l'époque considérée.

### 13.1 Outils institutionnels et instabilité

| Indicateur | de Gaulle | Pompidou | Giscard | Mitterrand | Chirac | Sarkozy | Hollande | **Macron** | Rang Macron |
|---|---|---|---|---|---|---|---|---|---|
| Utilisations 49.3 (cumulées) | 4 | 6 | 8 | 7 | 2 | 0 | 6 | **32** | **#1 (record absolu)** |
| Premiers ministres / mandat | 3 (10 ans) | 2 (5 ans) | 2 (7 ans) | 7 (14 ans) | 4 (12 ans) | 3 (5 ans) | 2 (5 ans) | **5 en 22 mois (2024-2026)** | **#1 sur intensité** |
| Cohabitations subies | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | n.a. |
| Recours au référendum | 5 | 1 | 0 | 2 | 1 | 0 | 0 | 0 | tied avec récents |
| Dissolutions de l'AN | 1 | 0 | 0 | 1 | 1 | 0 | 0 | **1 (catastrophe juin 2024)** | tied — mais résultat |

Lecture : Macron est **#1 absolu** sur le 49.3 (32 utilisations vs un précédent record à 8). Il bat Mitterrand, qui avait pourtant 14 ans d'exercice. Il est aussi **#1 sur l'instabilité gouvernementale** sur la séquence 2024-2026 (5 PMs / 22 mois = ~4,4 mois par gouvernement, comparable aux pires séquences de la IVe République).

### 13.2 Violence d'État et libertés associatives

| Indicateur | de Gaulle | Pompidou | Giscard | Mitterrand | Chirac | Sarkozy | Hollande | **Macron** | Rang Macron |
|---|---|---|---|---|---|---|---|---|---|
| Dissolutions associatives par décret | qq (Algérie) | 0 | 1 | 0 | 5 | 8 | 4 | **40+** | **#1 absolu** |
| Morts en intervention de police / an | n/d | n/d | n/d | n/d | n/d (estim. ~12-15) | ~25 | ~18 | **~41** | **#1 documenté** |
| Condamnations CEDH France pour traitements inhumains/dégradants | qq | 0 | 0 | qq | qq | qq | qq | **6 (2017-2025)** | **#1 sur intensité** |
| Lois antiterroristes durcissantes | 0 | 0 | 0 | 1 | 1 | 2 | 3 | **5** (dont SILT, séparatisme, sécurité globale) | **#1** |
| Dispositifs anti-manifestation (LBD40, GLI-F4) | n.a. | n.a. | n.a. | LBD intro | LBD40 intro | GLI-F4 intro | usage modéré | **GLI-F4 + LBD40 doctrine offensive** | **#1 doctrine** |

L'écart sur les morts en intervention de police (×2,3 vs Hollande) est particulièrement marqué et **documenté par sources tierces non gouvernementales** (Basta!, Désarmons-les!, ACAT). La doctrine est explicitée par les ministres Castaner et Darmanin, et endossée publiquement par Macron.

### 13.3 Confiance politique et démocratie

| Indicateur | Mitterrand fin | Chirac fin | Sarkozy fin | Hollande fin | **Macron mid-2** | Rang Macron |
|---|---:|---:|---:|---:|---:|---|
| Confiance politique CEVIPOF (% Français) | n/d (CEVIPOF débute 2009) | n/d | 32 % (2012) | 23 % (2017) | **22 % (2026)** | **#1 (plus bas)** |
| Democracy Index EIU | n.a. (débute 2006) | n.a. | démocratie pleine | démocratie pleine | **démocratie imparfaite, rang 26** | **#1 (déclassement)** |
| Liberté de la presse RSF | n/d | n/d | 38 (2012) | 45 (2017) | **rang 25** | en hausse mais sous Macron concentration accrue par milliardaires |
| Abstention présidentielle T2 | 16,4 % (1995) | 20,3 % (2002) | 19,7 % (2012) | n.a. | **28,0 % (2022)** | **#1 (record post-1969)** |

L'abstention au second tour de la présidentielle 2022 (28,0 %) est la plus élevée depuis 1969 (Pompidou-Poher : 31,1 % — mais contexte particulier). Le déclassement Democracy Index est documenté par EIU comme étant **continu** sur 2018-2024.

### 13.4 Indicateurs économiques et sociaux

| Indicateur | de Gaulle | Pompidou | Giscard | Mitterrand | Chirac | Sarkozy | Hollande | **Macron** | Rang Macron |
|---|---|---|---|---|---|---|---|---|---|
| Dette publique accumulée (% PIB) | +0 | +5 | +1 | **+29** | +20 | +21 | +9 | +18,8 | mid (5e sur 8) |
| Taux de pauvreté évolution | n/d (en baisse historique) | en baisse | stable | en baisse | stable | +0,5 | +0,3 | **+1,3** | **#1 sur cycle** |
| Promesses majeures abandonnées (sur 10) | qq | qq | qq | qq (75 % en 1981) | qq | qq | qq (75 % en 2012) | **5/10** | mid-haut |
| Réformes du Code du travail (assouplissement) | 0 | 0 | qq | 0 (renforcement) | qq | 1 | 1 | **3** (ordonnances 2017, 2018, 2019) | **#1** |
| Mouvements sociaux nationaux > 1 M dans la rue | 1968 | 0 | 0 | 1995 (×2) | 2003 | 2010 (retraites) | 2016 (loi El Khomri) | **2016, 2018-2019, 2023** (×3) | **#1 sur intensité** |

### 13.5 Densité judiciaire personnelle / entourage

| Président | Mises en examen perso | Condamnations perso | Procédures durant exercice | PMs/ministres condamnés |
|---|---:|---:|---:|---:|
| de Gaulle | 0 | 0 | 0 | 0 |
| Pompidou | 0 | 0 | 0 | 0 |
| Giscard | 1 (diamants Bokassa, classé) | 0 | 1 | 0 |
| Mitterrand | 0 (Pelat protégé, écoutes Élysée jugées post-mortem) | 0 | 1 (écoutes Élysée 2005, post-mortem) | qq (Pasqua condamné post-mandat) |
| Chirac | 1 | **1 (15 déc. 2011, prison avec sursis, emplois fictifs Mairie de Paris)** | 0 (immunité) | qq (Juppé condamné 2004) |
| Sarkozy | 5+ | **2 condamnations définitives (Bismuth 2024 + Bygmalion 2021)** | 0 (immunité présidentielle) | qq (Cahuzac 2016, Balkany 2019) |
| Hollande | 0 | 0 | 0 | **1 (Cahuzac, condamné 2016)** |
| **Macron** | **0 (immunité présidentielle)** | **0** | **1 enquête PNF en cours (McKinsey, financement 2017)** | **1 condamné (Delevoye 2022, dispense partielle Bayrou 2024) + 1 renvoyé en correctionnelle (Kohler 2024) + multiples mises en examen** |

Lecture : Macron lui-même n'est pas condamné, comme Hollande. L'immunité présidentielle masque une enquête PNF active (volet financement campagne 2017). Mais la **densité judiciaire de l'entourage proche** (secrétaire général Élysée, PMs, ministres) est **élevée**, avec un secrétaire général renvoyé en correctionnelle (Kohler, mai 2024) — situation institutionnellement inédite à ce niveau de proximité du Président.

### 13.6 Synthèse comparative

Sur les 30 indicateurs comparés (séries gouvernance/violence/démocratie/économie/judiciaire) :
- Macron est **#1 (record négatif Vème)** sur **9 indicateurs** : 49.3, instabilité gouvernementale séquentielle 2024-2026, dissolutions associatives, doctrine maintien de l'ordre, lois antiterroristes durcissantes, confiance politique, déclassement Democracy Index, taux de pauvreté progression, abstention présidentielle T2, mouvements sociaux > 1M.
- Macron est **dans le top 3 négatif** sur **8 autres indicateurs** : dette publique, promesses abandonnées, recul du Code du travail, abstention législatives, écart top 1% / bottom 50% patrimoine, etc.
- Macron est **clairement #1 négatif sur la séquence post-2024** (instabilité gouvernementale, dissolution-catastrophe).

**Macron n'est PAS #1 sur deux indicateurs lourds** :
- **Dette accumulée %PIB** → Mitterrand (+29 pts sur 14 ans) reste devant ; Macron est en 5e position relative.
- **Condamnations pénales personnelles** → Chirac (2011) et Sarkozy (2021/2024, double) sont les seuls Présidents condamnés en titre. Macron bénéficie de l'immunité présidentielle pendant l'exercice.

Le superlatif "le pire président de la Vème" est donc une **interprétation que la donnée n'achète pas en bloc**. Mais la donnée achète clairement la formulation : **président de la Vème ayant cumulé le plus de records négatifs sur la confiance démocratique, l'instabilité institutionnelle, la violence d'État, la concentration patrimoniale et la densité de procédures judiciaires touchant l'entourage proche**.

---

## 14. Ce que la donnée ne dit pas

Trois caveats explicites — resserrés par rapport aux versions antérieures de ce document.

1. **Causalité partagée vs accélération signée**. Le déclin de l'hôpital (lits perdus depuis 2003), de la pauvreté infantile (croissance depuis 2008), de la désertification médicale (cumul depuis 2000), de la dette publique (+~80 pts %PIB depuis 1980), n'est pas créé par Macron. Il **hérite d'une trajectoire dégradante**. Mais la donnée documente, sur plusieurs séries (lits, pauvreté infantile, dette, dépression jeunes, morts en intervention de police), une **accélération sous Macron** mesurable et statistiquement significative — pas un simple maintien de tendance. Le "Macron a hérité" est vrai ; le "tout est subi" est faux.
2. **Contrefactuel inconnu**. Un autre président aurait-il fait mieux/pire face à Covid + Ukraine + transition climatique + mutations économiques globales ? La donnée ne tranche pas. Mais : les **choix discrétionnaires signés** (suppression ISF, flat tax PFU, ARENH+ 2022, recul retraites à 64 ans, durcissements assurance chômage, conditionnement RSA, doctrine maintien de l'ordre offensif, dissolution juin 2024) ne sont **pas subis**. Ils sont signés et délibérés.
3. **Périmètres non couverts par cette base** :
    - Diplomatie, défense, soutien Ukraine, OTAN, COP, EPR2 — pas de mesures dans cette base au-delà de l'objectif renouvelables (~22 %, manqué) et des EPR2 commandés.
    - Politique africaine et déclin de la Françafrique (perte de l'influence sahélienne 2022-2024 — Mali, Burkina, Niger).
    - Innovation / tech (les chiffres sur Mistral, deeptech, scale-ups dépassent l'instrumentation actuelle).
    - Politique migratoire et accueil — controversée, partiellement instrumentée.

---

## 15. Synthèse — un bilan structurel d'érosion

> **Sur les indicateurs structurels mesurables, la présidence Macron se classe parmi les plus dégradées de la Vème République.**

Les records négatifs documentés (§13) :

- Record absolu d'utilisations du 49.3 (32, dont 23 sous Borne seule).
- Record d'instabilité gouvernementale (5 PMs en 22 mois, 2024-2026).
- Record de dissolutions associatives (40+, soit ≈ un tiers du total Vème).
- Record post-1958 de morts en intervention de police par an (~41/an, ×2,3 vs Hollande).
- Confiance politique fin mandat la plus basse jamais mesurée par CEVIPOF (22 %).
- Concentration patrimoniale au sommet record (top 500 × 2,15 sur 9 ans).
- Première dissolution-catastrophe ayant produit une Assemblée durablement ingouvernable.
- Densité judiciaire de l'entourage proche élevée — un secrétaire général d'Élysée renvoyé en correctionnelle (Kohler), un PM cité par sa propre fille dans l'affaire Bétharram (Bayrou), trois ministres successifs poursuivis devant la CJR.

Caveats explicites :

- Macron n'est pas #1 sur tout : **dette accumulée %PIB** → Mitterrand (+29 pts) reste devant ; **condamnations pénales personnelles** → Chirac (2011) et Sarkozy (2021/2024) sont les seuls Présidents condamnés en titre. Le superlatif est sectoriel, pas global.
- Inertie antérieure : sur hôpital, pauvreté infantile, désertification médicale, Macron hérite d'une trajectoire dégradante. La donnée documente l'**accélération** sous Macron — pas la création.
- Contrefactuel inconnu : Covid + Ukraine + transition climatique étaient subis. Mais les **choix discrétionnaires** sont signés (suppression ISF, flat tax, ARENH+ 2022, retraites 64 ans, doctrine maintien de l'ordre, dissolution juin 2024).

Trois constats convergent à partir de la donnée documentée :

**A. Une présidence qui sait faire baisser des chiffres officiels mais laisse se dégrader les réalités qu'ils mesurent.** Le chômage BIT recule pendant que l'inscription à France Travail stagne, que le halo du chômage atteint 8,4 M de personnes, que la précarité s'installe (81 % d'embauches en CDD <1 mois ou intérim) et que les radiations administratives explosent (660 000/an). La pauvreté monétaire augmente pendant que le SMIC indexé peine à suivre l'inflation. La dette publique explose pendant que les dividendes CAC 40 doublent. Les dispositifs méthodologiques (catégories F/G créées en 2025, micro-entreprenariat de subsistance, enquête Emploi rénovée 2021) compriment statistiquement le numérateur sans amélioration sous-jacente.

**B. Une présidence qui réforme en profondeur, en arbitrant systématiquement contre les revenus du travail et en faveur des revenus du capital.** Suppression ISF (~21,7 Md€ cumulés), flat tax PFU (97 % du gain capté par 5 % des foyers les plus aisés), baisse IS effective de 33,3 % à 14,3 %, allégements de cotisations. Côté travail : ordonnances 2017 (plafonnement prud'hommes, fusion CE/CHSCT/DP), 4 durcissements assurance chômage (1 M de chômeurs ayant perdu des mois d'indemnisation), réforme retraites 64 ans (49.3, 3,5 M dans la rue), conditionnement RSA à 15 h d'activité (jugé contraire aux droits fondamentaux par le Défenseur des droits). **Côté énergie** (§12.3) : maintien d'ARENH à 42 €/MWh pendant tout le premier mandat alors que le coût de production EDF est ≥50 €/MWh dès 2014 (Cour des comptes), aggravation par ARENH+ 2022 (4,1 Md€ aux fournisseurs alternatifs avec comportements opportunistes documentés sur 72/100 d'entre eux, Sénat r22-833), puis renationalisation EDF (9,7 Md€) et bouclier tarifaire (36 Md€ net) sur fonds publics. **Effet net IPP par décile** (§9.2) : **D1 −150 €/an, D5 +75 €/an, top 1 % +12 800 €/an, top 0,1 % +28 700 €/an**.

**C. Une présidence dont la dégradation simultanée de la confiance politique, de l'indépendance parlementaire et de la liberté de la presse n'est plus un effet secondaire — elle est, à ce stade, le bilan principal.** 32 utilisations du 49.3 (record), confiance politique 35 % → 22 % (record négatif CEVIPOF), déclassement Democracy Index (rang 26 EIU 2024, "démocratie imparfaite"), 40+ dissolutions associatives, RSF rang 25, condamnations internationales sur la doctrine de maintien de l'ordre (ONU, Conseil de l'Europe, Amnesty, HRW), **288 morts en intervention de police 2018-2024**, dissolution-catastrophe juin 2024 et instabilité gouvernementale subséquente (5 PMs en 22 mois), densité judiciaire de l'entourage proche (Kohler renvoyé en correctionnelle, Bayrou cité par sa propre fille dans l'affaire Bétharram, Delevoye condamné, Benalla condamné définitivement). Le faisceau n'est plus circonstanciel.

Les promesses tenues à 30 % par mandat (taxe d'habitation, ordonnances travail, retraites à 64 ans, durcissement chômage, bouclier tarifaire) sont réelles. Les promesses **abandonnées sont les plus structurantes** : retraite par points (devenue âge à 64 ans, l'inverse), déficit <3 %, SNU généralisé, construction de logements, plein emploi à 5 %. Le clivage central du bilan n'est pas idéologique — il est arithmétique : **Macron a tenu environ un tiers de ses promesses, fait baisser le chômage officiel par dispositifs méthodologiques, et présidé à une explosion simultanée de la dette publique, des inégalités de patrimoine, de la violence d'État et de la densité judiciaire de l'entourage proche.** Ces faits coexistent. La pondération qu'on leur donne — réformes structurelles modernisantes vs creusement social, démocratique et institutionnel — est le choix politique que la donnée ne tranche pas.

Il reste 14 mois de mandat. La dette à 115,6 %, le déficit à 5,1 %, l'instabilité gouvernementale chronique, l'absence de majorité parlementaire et la confiance politique au plus bas rendent **improbable un troisième acte de réforme**. La question pour 2027 ne sera pas "Macron a-t-il réussi" — elle sera **"comment réparer ce qu'il laisse"**.

---

## Sources

### Base de données
- `PersonnalitePublique`, `MandatGouvernemental`, `EntreeCarriere`, `EvenementJudiciaire`, `DecretDeport` — schéma Phase 9.
- `DeclarationInteret`, `ParticipationFinanciere`, `RevenuDeclaration` — HATVP open data.
- `ActionLobby` — registre AGORA HATVP (12 819 actions ciblant `PRESIDENCE`).
- `Indicateur` + `Observation` — INSEE BDM.

### Recherche éditoriale interne
- `src/data/bilan-macron.ts` — 20 constantes structurées : police violence, élite facts, revolving door cases, social fabric, etc.
- `src/data/president-macron.ts` — 20 promesses instrumentées (10 par campagne) avec statusNote granulaire.

### Données externes citées
- **INSEE** : Comptes nationaux, Enquête Emploi, IPC, Indicateurs de pauvreté, Patrimoine 2024, Démographie d'entreprises.
- **DREES** : Établissements de santé (ER 1225, nov. 2025), Études et Résultats 2024 (santé mentale jeunes, hospitalisations automutilation, suicide 15-24 ans), Observatoire suicide.
- **DARES** : France Travail catégories A→G, statistiques d'embauche.
- **Cour des comptes** : Plan d'investissement compétences ; *Coût de production de l'électricité nucléaire* (27 mai 2014, mise à jour 2020) ; *L'organisation des marchés de l'électricité* (5 juillet 2022) ; *Mesures exceptionnelles de lutte contre la hausse des prix de l'énergie* (15 mars 2024) ; *Maintenance du parc électronucléaire d'EDF* (S2025-1528, 17 nov. 2025) ; *La pédopsychiatrie en France* (oct. 2024) ; NEE Présidence.
- **France Stratégie** : *Évaluation de la suppression de l'ISF et de la flat tax*, troisième vague, octobre 2023 ; *Évaluation flat tax PFU*, oct. 2023 ; CICE.
- **Institut des politiques publiques (IPP)** : *Évaluation des réformes socio-fiscales 2017-2022*, octobre 2022 ; mise à jour avril 2024 ; CTS pétroliers.
- **WID.world** (équipe Piketty, Saez, Chancel) : Top 1 % part patrimoine 2024, séries DINA.
- **CNAM** : Désertification médicale, médecins traitants.
- **Oxfam France** : Rapport janvier 2026 (53 milliardaires > 32 M Français).
- **Forbes / Challenges** : Patrimoines, milliardaires.
- **Vernimmen / Janus Henderson / Proxinvest** : Dividendes CAC 40 ; Rémunérations dirigeants SBF 120 (Proxinvest 2024).
- **CEVIPOF** : Baromètre de la confiance politique (rapport 2026, séries 2009-2026).
- **Economist Intelligence Unit** : Democracy Index 2024.
- **Reporters sans frontières** : Classement 2025.
- **Conseil de l'Europe, ONU HCDH, Amnesty International, Human Rights Watch** : Maintien de l'ordre français (rapports 2018-2024).
- **Mediapart « Allô Place Beauvau »** : Recensement Gilets Jaunes ; affaire Bétharram (5 fév. 2025).
- **Basta!, Désarmons-les!, ACAT** : Morts en intervention de police 2018-2024.
- **IPP** : Contribution temporaire de solidarité 2023.
- **Sénat** : Commission d'enquête McKinsey (rapport n° 578 du 16 mars 2022) ; Rapport n° 833 (Estrosi-Sassone, Gay, juillet 2023, "Fraudes ARENH — 25 mesures") ; Rapport r23-685 (CRIM rendement) ; Commission Benalla (rapport Bas, 20 fév. 2019).
- **Fondation Abbé Pierre** : Sans-abri.
- **Restos du Cœur** : Bénéficiaires.
- **Santé publique France** : Baromètre santé mentale 2024, baromètre 18-29 ans.
- **Assurance maladie** : Antidépresseurs 18-25 ans 2024.
- **Haut Conseil pour le Climat** : Trajectoire CO2.
- **Eurostat / SDES** : Énergies renouvelables, prix résidentiel électricité 2024.
- **Tribunal administratif de Paris (Affaire du Siècle)** : Condamnations climatiques.

### Énergie / électricité (recherche dédiée 2026-04-28, §12.3)
- **Cour des comptes** : *Coût de production de l'électricité nucléaire* (27 mai 2014, mise à jour 2020) ; *L'organisation des marchés de l'électricité* (5 juillet 2022) ; *Mesures exceptionnelles de lutte contre la hausse des prix de l'énergie* (15 mars 2024) ; *Maintenance du parc électronucléaire d'EDF* (S2025-1528, 17 nov. 2025).
- **Sénat** : Rapport n° 833 (Estrosi-Sassone, Gay, juillet 2023) ; Rapport r23-685 (CRIM rendement).
- **CRE** : Rapport surveillance des marchés de gros 2022 ; *Rapport coûts du nucléaire* 2025 ; pages ARENH.
- **RTE** : *Bilan électrique 2023* (prix, production).
- **INSEE Première n° 1746** ("Les dépenses des Français en électricité depuis 1960") ; SDES "Prix de l'électricité en France et UE 2024".
- **Conseil d'analyse économique** : Note n° 76 ("Le triple défi de la réforme du marché européen de l'électricité", 2023).
- **Médiateur national de l'énergie** : Rapport annuel 2023.
- **Institut Montaigne** ("Décarbonation : corriger le système des garanties d'origine électriques") ; **Greenpeace France** (classement écolo des fournisseurs).
- **EDF** : résultats annuels 2022 ; OPA 12 €/action (juillet 2022, retrait cote juin 2023).
- **EUR-Lex** : Directives 96/92/CE et 2003/54/CE ; Légifrance loi NOME (2010-1488).
- **SFEN, INA Eclaire actu** : plan Messmer 1974, contexte historique.

### Affaires et scandales (recherche dédiée 2026-04-28, §6)
- **Le Monde** : Affaire Benalla (Ariane Chemin / Antton Rouget, 18 juill. 2018 et suite) ; Uber Files (juill. 2022) ; Pegasus (20 juill. 2021) ; suivi McKinsey ; Brigitte Macron biographie (Ariane Chemin).
- **Mediapart** : Affaire De Rugy (10 juill. 2019) ; Bétharram (5 fév. 2025) ; Trogneux campagne 2017 (14 mars 2024) ; Allô Place Beauvau (juin 2019).
- **ICIJ + The Guardian + Süddeutsche Zeitung + Washington Post** : Uber Files (juillet 2022) ; Pegasus (juillet 2021).
- **Forbidden Stories** : Pegasus (juillet 2021).
- **TGI Paris** : jugement Benalla 5 nov. 2021 ; jugement Brigitte Macron / Rey-Roy 12 sept. 2024.
- **Cour d'appel Paris** : arrêt Benalla 26 mai 2023 ; arrêt Rey-Roy 10 juill. 2025 (annulation condamnation).
- **Cour de cassation** : pourvoi Brigitte Macron / Rey-Roy en cours (déposé juill. 2025).
- **Cour de justice de la République** : jugement Dupond-Moretti 27 nov. 2023 (relaxe).
- **TGI Lille** : jugement Ferrand 11 oct. 2024 (relaxe prescription).
- **Conseil d'État** : Soulèvements de la Terre 9 nov. 2023 (annulation dissolution).
- **PNF** : enquêtes McKinsey (24 oct. 2022 + 21 oct. 2022) ; Kohler (mise en examen 12 sept. 2022, renvoi correctionnelle 15 mai 2024).
- **Delaware Superior Court** : plainte Macron c. Owens (23 juill. 2025), motion to dismiss en cours.
- **Anticor** : Plaintes Kohler 2018, 2022 ; rapports Première Dame 2018, 2022.
- **Anne Fulda** : *Emmanuel Macron, un jeune homme si parfait*, Plon, 2017.

### Caveats sur la base
- `DETTE_PIB` : table tronquée à 2014 (limite d'ingestion à corriger). Données 2017→2025 reprises de sources externes citées.
- `IPC_ALIMENTAIRE` : valeurs de la table peu cohérentes avec les données externes 2022–2023 (probable mauvaise dimension YoY vs cumul). À auditer.
- `ActionLobby` 2025–2026 : déclarations partielles (ingestion en cours côté HATVP/AGORA).
- Aucune donnée HATVP indexée pour le Président — limite structurelle, pas une omission.
- `EvenementJudiciaire` : 1 ligne vérifiée pour Macron (PNF McKinsey nov. 2022). Les autres affaires §6 sont sourcées par presse externe (non encore ingérées dans `EvenementJudiciaire`, à corriger).
- Comparaison §13 : les "n/d" reflètent l'absence de donnée systématiquement collectée à l'époque (notamment pour les présidences antérieures à 2000). Toute comparaison transhistorique reste partielle.
