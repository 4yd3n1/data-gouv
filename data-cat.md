# data.gouv.fr — Data Catalog Report

> Generated: 2026-02-26
> Source: [data.gouv.fr](https://www.data.gouv.fr) via MCP endpoint `https://mcp.data.gouv.fr/mcp`
> Transport: Streamable HTTP, read-only, no auth required

---

## 1. ECONOMY

### 1.1 GDP (Produit Intérieur Brut)

| Field | Value |
|-------|-------|
| **Dataset** | Produit intérieur brut (PIB) de la France |
| **ID** | `6587531b70a76262a407fc2f` |
| **Resource ID** | `cd2ac200-0130-459e-809f-843f46e20d28` |
| **Publisher** | Epicycle |
| **Format** | CSV (911 B) |
| **Rows** | 74 |
| **Span** | 1949–2022 |
| **Columns** | `annee`, `pib` (millions €, current prices) |
| **URL** | https://www.data.gouv.fr/datasets/produit-interieur-brut-pib-de-la-france |

**Key Data Points:**

| Year | PIB (M€) | YoY |
|------|----------|-----|
| 2022 | 2,639,092 | +5.5% |
| 2021 | 2,502,118 | +7.9% |
| 2020 | 2,317,832 | -4.9% |
| 2019 | 2,437,635 | +3.1% |
| 2018 | 2,363,306 | +2.9% |
| 2010 | 1,995,289 | — |
| 2000 | 1,478,585 | — |
| 1990 | 1,053,546 | — |
| 1980 | 451,770 | — |
| 1970 | 125,698 | — |
| 1960 | 46,834 | — |
| 1949 | 13,225 | — |

**Also available (INSEE, ZIP format — not directly parseable via MCP):**

| Dataset | ID | Resource ID |
|---------|----|-------------|
| PIB et grands agrégats économiques | `66685856500cccd9a7089112` | `decbe31d-e28c-4f68-9127-d48c7d0a5155` |

---

### 1.2 Employment & Unemployment

| Field | Value |
|-------|-------|
| **Dataset** | Activité, emploi et chômage — résultats annuels 2024 |
| **ID** | `67b67085f4e352ac804a8441` |
| **Publisher** | INSEE |
| **Resources** | 2 CSVs (2023 + 2024 results) |
| **Format** | CSV inside ZIP |
| **URL** | https://www.data.gouv.fr/datasets/activite-emploi-et-chomage-resultats-annuels-2024 |

| Resource | Resource ID |
|----------|-------------|
| Résultats annuels 2023 | `20b0d594-0e88-48a9-b502-4d5bbe550255` |
| Résultats annuels 2024 | `bb4e86a4-488d-4b8b-bb8a-16e73d673d9c` |

**Related long series:**

| Dataset | ID | Span |
|---------|----|------|
| Activité, emploi et chômage — séries longues | `66685855500cccd9a708910e` | Multi-decade |
| Enquête emploi en continu (11 annual files) | `53699434a3a729239d2043b3` | 2003–2023 |

---

### 1.3 Enterprise Creation

| Field | Value |
|-------|-------|
| **Dataset** | Créations d'entreprises — séries longues |
| **ID** | `698e69bcebf3fdf6036e38f1` |
| **Resource ID** | `c1bafe65-e6a5-49f9-a5ce-bf75a6875ef5` |
| **Publisher** | INSEE |
| **Format** | CSV (via INSEE Melodi API) |
| **URL** | https://www.data.gouv.fr/datasets/creations-dentreprises-series-longues |

**Related:**

| Dataset | ID |
|---------|----|
| Créations d'entreprises individuelles | `683f8e739bf2fdce342f1775` |

---

## 2. GOVERNANCE — ASSEMBLÉE NATIONALE

### 2.1 Active Deputies (17th Legislature)

| Field | Value |
|-------|-------|
| **Dataset** | Députés actifs de l'Assemblée nationale |
| **ID** | `5fc8b732d30fbf1ed6648aab` |
| **Resource ID** | `092bd7bb-1543-405b-b53c-932ebb49bb8e` |
| **Publisher** | Datan |
| **Format** | CSV (148.7 KB) |
| **Tabular API** | Yes — 577 rows, 27 columns |
| **Last updated** | 2026-02-26 (daily) |
| **URL** | https://www.data.gouv.fr/datasets/deputes-actifs-de-lassemblee-nationale-informations-et-statistiques |

**Columns:** `id`, `legislature`, `civ`, `nom`, `prenom`, `villeNaissance`, `naissance`, `age`, `groupe`, `groupeAbrev`, `departementNom`, `departementCode`, `circo`, `datePriseFonction`, `job`, `mail`, `twitter`, `facebook`, `website`, `nombreMandats`, `experienceDepute`, `scoreParticipation`, `scoreParticipationSpecialite`, `scoreLoyaute`, `scoreMajorite`, `dateMaj`

**Political Groups (sample):**

| Abbreviation | Full Name | Example |
|---|---|---|
| SOC | Socialistes et apparentés | François Hollande |
| DR | Droite Républicaine | Laurent Wauquiez |
| EPR | Ensemble pour la République | Éric Woerth |
| LIOT | Libertés, Indépendants, Outre-mer et Territoires | David Habib |
| ECOS | Écologiste et Social | Dominique Voynet |
| DEM | Les Démocrates | Jean-Carles Grelier |
| HOR | Horizons & Indépendants | Agnès Firmin Le Bodo |
| NI | Non inscrit | Véronique Besse |

**Tabular API endpoint:**
```
https://tabular-api.data.gouv.fr/api/resources/092bd7bb-1543-405b-b53c-932ebb49bb8e/data/?page_size=200
```

---

### 2.2 Historic Deputies (since 2002)

| Field | Value |
|-------|-------|
| **Dataset** | Historique des députés de l'Assemblée nationale (depuis 2002) |
| **ID** | `60f2ffc8284ff5e8c1ed0655` |
| **Resource ID** | `817fda38-d616-43e9-852f-790510f4d157` |
| **Publisher** | Datan |
| **Format** | CSV (497.7 KB) |
| **URL** | https://www.data.gouv.fr/datasets/historique-des-deputes-de-lassemblee-nationale-depuis-2002-informations-et-statistiques |

---

## 3. GOVERNANCE — SÉNAT

### 3.1 Senators

| Field | Value |
|-------|-------|
| **Dataset** | Les Sénateurs |
| **ID** | `58c2c63f88ee387e365cfcf1` |
| **Publisher** | Sénat |
| **Resources** | 55 files (CSV, JSON, XLS, SQL) |
| **URL** | https://www.data.gouv.fr/datasets/les-senateurs |

**Key Resources:**

| Resource | Format | Resource ID | Direct URL |
|----------|--------|-------------|------------|
| Informations générales | CSV | `f989081e-c6bd-46fc-ab0f-c067243e5e67` | https://data.senat.fr/data/senateurs/ODSEN_GENERAL.csv |
| Informations générales | JSON | `01a782e9-c0d0-4c14-906d-767bdb5258e1` | https://data.senat.fr/data/senateurs/ODSEN_GENERAL.json |
| Commissions (historique) | CSV | `2e760191-1df6-48ea-9e73-ee818d9b36f7` | https://data.senat.fr/data/senateurs/ODSEN_COMS.csv |
| Commissions (en cours) | CSV | `c72b5b7d-b4ac-4599-a056-a5dca4e8c8ca` | https://data.senat.fr/data/senateurs/ODSEN_CUR_COMS.csv |
| Mandats sénatoriaux | CSV | `a120bb29-5d9f-4213-a053-b39bae56ca55` | https://data.senat.fr/data/senateurs/ODSEN_ELUSEN.csv |
| Mandats de Député | CSV | `9f03fa68-8bc9-414d-b3ef-80f62f7cc7b7` | https://data.senat.fr/data/senateurs/ODSEN_ELUDEP.csv |
| Mandats européens | CSV | `bb2503ee-5faa-44f4-ab55-0bb720a8e862` | https://data.senat.fr/data/senateurs/ODSEN_ELUEUR.csv |
| Mandats métropolitains | CSV | `ba7c80e9-ae87-491a-87d3-1ec87b519848` | https://data.senat.fr/data/senateurs/ODSEN_ELUMET.csv |
| Mandats municipaux | CSV | `1664c9bc-bfb9-49c1-96a1-8e2abde62231` | https://data.senat.fr/data/senateurs/ODSEN_ELUVIL.csv |
| Mandats régionaux | CSV | `ec79fd4a-ad5c-489e-b8d5-aaf64bbbb8f0` | https://data.senat.fr/data/senateurs/ODSEN_ELUREG.csv |
| Mandats cantonaux/départementaux | CSV | `35449817-e81c-4f99-b683-bb4fac88c03b` | https://data.senat.fr/data/senateurs/ODSEN_CANDEP.csv |
| Offices parlementaires | CSV | `caf7f1e5-00d4-49ac-b03b-225269dbf8f2` | https://data.senat.fr/data/senateurs/ODSEN_OFFDEL.csv |
| Groupes d'études | CSV | `389055b1-1e52-4bb4-b31c-8a7dc5ab1f06` | https://data.senat.fr/data/senateurs/ODSEN_ETUDES.csv |
| Groupes interparlementaires d'amitié | CSV | `6015aad5-0ad6-41f4-889c-6779cab29c5b` | https://data.senat.fr/data/senateurs/ODSEN_GIA.csv |
| Organismes extraparlementaires | CSV | `776fe4be-1638-445c-9b6a-555c24f8c6b9` | https://data.senat.fr/data/senateurs/ODSEN_OEP.csv |

> Note: data.senat.fr URLs redirect HTTP → HTTPS (301). Use `https://` directly.

---

## 4. GOVERNANCE — ELECTIONS

| Query | Datasets Found |
|-------|---------------|
| `élections résultats` | **484** |
| `présidentielle 2022` | **65** |

**Notable Datasets:**

| Dataset | ID | Publisher |
|---------|----|-----------|
| Présidentielles 2022 — 1er Tour (Paris) | `6254f9bd2e72ec64f44b9806` | Ville de Paris |
| Présidentielles 2022 — Tour 1 (Marseille) | `66dada4c3b30732f477093e0` | Ville de Marseille |
| Présidentielle 2022 (Besançon) | `62b9743898bf535ca818ee13` | Ville de Besançon |

Election data is highly distributed — each commune/city publishes its own results. No single national consolidated dataset found via this MCP.

---

## 4bis. GOVERNANCE — CONFLICTS OF INTEREST (Session 47)

**Note**: not on data.gouv.fr MCP. These two sources are scraped/parsed out-of-band from ministerial websites.

### 4bis.1 Ministerial Déport Registry

| Field | Value |
|-------|-------|
| **Source** | Registre de prévention des conflits d'intérêts — services du Premier ministre |
| **URL** | https://www.info.gouv.fr/publications-officielles/registre-de-prevention-des-conflits-dinterets |
| **Publisher** | Premier ministre (services) |
| **Format** | HTML (Cloudflare-protected — must use browser automation, not curl/WebFetch) |
| **Rows** | 11 décrets de déport (Lecornu II, as of 2026-04-21) |
| **Fields extracted** | Minister name, portfolio, JORF décret number, JORF date, perimetre (scope of recusal), basis detail |
| **Legal basis** | Article 2 / 2-1 / 2-2 du décret n° 59-178 du 22 janvier 1959 |
| **DB target** | `DecretDeport` model (+ `BasisDeport` enum) |
| **Ingestion** | `pnpm tsx scripts/seed-decrets-deport.ts` — idempotent upsert on `(personnaliteId, perimetre)` |
| **Cadence** | Re-scrape weekly (new décrets appear after each reshuffle) |

**Current seeded ministers:**

| Minister | JORF ref | Date | Scope |
|----------|----------|------|-------|
| Sébastien Lecornu | 2025-1027 | 2025-10-31 | Magistrats PNF + procédures le concernant |
| Gérald Darmanin | 2025-1034 | 2025-10-31 | Magistrats mis en cause / le mettant en cause |
| Aurore Bergé | 2025-1028 | 2025-10-31 | Société Victory |
| Jean-Noël Barrot | 2025-1039 | 2025-10-31 | Groupe Uber ; société eXplain |
| Philippe Baptiste | 2025-1042 | 2025-10-31 | CNES Participations |
| Catherine Chabaud | 2025-1104 | 2025-11-21 | Yacht Club de France ; Institut français de la mer ; Académie de marine |
| Serge Papin | 2025-1160 | 2025-12-05 | Groupe Auchan + clients conseil stratégie |
| Stéphanie Rist | 2025-1337 | 2025-12-26 | CHU d'Orléans |
| Philippe Tabarot | 2026-165 | 2026-03-04 | Association Avenir Transports |
| David Amiel | 2026-173 | 2026-03-10 | Groupe La Poste |
| Nicolas Forissier | 2026-279 | 2026-04-14 | Société Cap Coreli |

**Cross-reference**: HATVP press release [publication-des-declarations-de-30-membres-du-gouvernement-de-m-sebastien-lecornu](https://www.hatvp.fr/presse/publication-des-declarations-de-30-membres-du-gouvernement-de-m-sebastien-lecornu/) cites 14 décrets — 3 are signed but not yet visible on the info.gouv.fr registre (publication lag).

### 4bis.2 HATVP Interest Declarations (reference)

Already documented in [`documentation/data-ingestion.md`](documentation/data-ingestion.md) § Wave 4. Distinct pipeline: HATVP XML → `DeclarationInteret` / `InteretDeclare` models. HATVP and the Registre PM are independent systems — HATVP issues private recommendations; the PM signs the décret and publishes to JORF.

---

## 5. PUBLIC FINANCES

### 5.1 State Budget Execution

| Field | Value |
|-------|-------|
| **Dataset** | Dépenses et recettes des budgets exécutés de l'État et de la défense |
| **ID** | `536992a6a3a729239d203fa3` |
| **Resource ID** | `627b65b3-a66b-4f20-8040-4777fd6be749` |
| **Publisher** | Ministère des Armées |
| **Format** | XLS |
| **URL** | https://www.data.gouv.fr/datasets/depenses-et-recettes-des-budgets-executes-de-l-etat-et-de-la-defense-30382662 |

### 5.2 Public Debt

| Field | Value |
|-------|-------|
| **Dataset** | La gestion de la dette publique et l'efficience du financement de l'État par l'Agence France Trésor |
| **ID** | `6238528ba33290ad418cb3f1` |
| **Publisher** | Cour des comptes |
| **License** | ODbL |
| **Tags** | aft, agence-france-tresor, dette-publique, finances-publiques |
| **URL** | https://www.data.gouv.fr/datasets/la-gestion-de-la-dette-publique-et-lefficience-du-financement-de-letat-par-lagence-france-tresor |

### 5.3 Public Sector Employment

| Dataset | ID | Resource (CSV) |
|---------|----|----------------|
| Effectifs fonction publique depuis 2004 | `5c4b0be98b4c412d41f1fdba` | `cee29469-28b0-4ba5-902c-bf24d8da844f` |
| Effectifs FP de l'État depuis 1998 | `5c4b0e3b8b4c413b76792089` | `e75cf6ec-4b8e-4c47-ba06-fabf8ea298ca` |
| Effectifs FP territoriale depuis 2004 | `5c4b0d2d8b4c413b7e935b3b` | — |
| Effectifs FP par département depuis 2010 | `5c4b01198b4c41172131e98d` | — |

Publisher: Direction Générale de l'Administration et de la Fonction Publique (DGAFP)

---

## 6. CULTURE — MUSEUMS

### 6.1 Museum Attendance (Ministère de la Culture)

| Field | Value |
|-------|-------|
| **Dataset** | Fréquentation des Musées de France |
| **ID** | `5af120e7b595087cfabcde82` |
| **Resource ID** | `7708e380-e7f8-4b56-936a-5d2a262d852d` |
| **Publisher** | Ministère de la Culture |
| **Format** | CSV (1.6 MB) |
| **Tabular API** | Yes — 12,292 rows |
| **Span** | 2001–2024 |
| **URL** | https://www.data.gouv.fr/datasets/frequentation-des-musees-de-france-1 |

**Columns:** `IDPatrimostat`, `IDMuseofile`, `region`, `departement`, `dateappellation`, `ferme`, `anneefermeture`, `nom_du_musee`, `ville`, `codeInseeCommune`, `annee`, `payant`, `gratuit`, `total`, `individuel`, `scolaires`, `groupes_hors_scolaires`, `moins_18_ans_hors_scolaires`, `_18_25_ans`

**Top 20 Museums — 2023 Attendance (sorted `total` desc, filtered `annee=2023`):**

| # | Museum | City | Total | Paid | Free |
|---|--------|------|------:|-----:|-----:|
| 1 | Musée du Louvre | Paris | 8,807,668 | 5,534,435 | 3,273,233 |
| 2 | Château de Versailles | Versailles | 8,352,135 | 6,681,012 | 1,671,123 |
| 3 | Musée d'Orsay | Paris | 3,871,498 | 2,422,010 | 1,449,488 |
| 4 | Centre Pompidou | Paris | 2,737,013 | 1,206,436 | 1,530,577 |
| 5 | Muséum d'Histoire Naturelle | Paris | 2,179,270 | 956,243 | 1,223,027 |
| 6 | Musée du Quai Branly | Paris | 1,410,641 | 582,805 | 827,836 |
| 7 | Musée de l'Orangerie | Paris | 1,239,539 | 806,652 | 432,887 |
| 8 | Musée de l'Armée | Paris | 1,214,913 | 662,083 | 552,830 |
| 9 | Petit Palais | Paris | 1,187,863 | 168,833 | 1,019,030 |
| 10 | Musée Carnavalet | Paris | 1,059,482 | 57,321 | 1,002,161 |
| 11 | Musée d'Art Moderne (Paris) | Paris | 927,023 | 370,841 | 556,182 |
| 12 | Musée des Confluences | Lyon | 671,597 | 355,366 | 316,231 |
| 13 | Musée de l'Immigration | Paris | 635,363 | 145,008 | 490,355 |
| 14 | Musée Rodin | Paris | 600,021 | 385,606 | 214,415 |
| 15 | Musée des Arts Décoratifs | Paris | 596,204 | 231,745 | 364,459 |
| 16 | Musée Picasso | Paris | 558,907 | 362,038 | 196,869 |
| 17 | Louvre-Lens | Lens | 555,607 | 74,387 | 481,220 |
| 18 | Musée Condé | Chantilly | 462,000 | 416,000 | 46,000 |
| 19 | Tapisserie de Bayeux | Bayeux | 459,708 | 406,318 | 53,390 |
| 20 | MuCEM | Marseille | 446,614 | 224,977 | 221,637 |

**Top 20 aggregate**: ~37.6M visits (2023). 1,057 museums reported data for 2023.

**Additional yearly resources (separate dataset):**

| Dataset ID | Years Covered | Resources |
|---|---|---|
| `6020fcd0bbc79d2e450b2130` | 2001–2018 | 18 individual CSV files by year |

---

### 6.2 Historical Monuments (Patrimoine)

| Field | Value |
|-------|-------|
| **Dataset** | Immeubles protégés au titre des Monuments Historiques |
| **ID** | `5af120e5b595087cfabcde81` |
| **Resource ID** | `3a52af4a-f9da-4dcc-8110-b07774dfb3bc` |
| **Publisher** | Ministère de la Culture |
| **Format** | CSV (94.9 MB) + GeoJSON (212.6 MB) |
| **Tabular API** | Yes — **46,697 rows** |
| **URL** | https://www.data.gouv.fr/datasets/immeubles-proteges-au-titre-des-monuments-historiques-2 |

**Key Columns:** `Reference`, `Denomination_de_l_edifice`, `Domaine`, `Region`, `Departement_en_lettres`, `Commune_forme_index`, `Siecle_de_la_campagne_principale_de_construction`, `Typologie_de_la_protection`, `Statut_juridique_de_l_edifice`, `Date_et_typologie_de_la_protection`, `coordonnees_au_format_WGS84`

**Building types observed (Domaine):** architecture religieuse, architecture domestique, architecture commerciale, architecture administrative

**Protection types:** classé MH, inscrit MH, classé MH partiellement, inscrit MH partiellement

**Century coverage:** 12th–20th century buildings represented.

---

## 7. POPULATION & DEMOGRAPHICS

### 7.1 Legal Populations by Commune

| Dataset | ID | Publisher |
|---------|----|-----------|
| Populations légales communales 2017–2021 | `658d7b6224d22ec7fe76e564` | icem7 |
| Population municipale communes — France entière | `65b1a75854fb88f787f72944` | Département du Loiret |
| Populations légales 2021 | `65cb3c2aaf4d6ebf3428bcde` | Mobility |

### 7.2 Census (Recensement)

| Dataset | ID | Publisher | Years |
|---------|----|-----------|-------|
| Recensement population — Grands quartiers (Toulouse) | `655ecfa75ba65b16eca6435b` | Toulouse métropole | 2020 |
| Recensement population — Grands quartiers (Toulouse) | `6234049daa97ec9f1e6723de` | Toulouse métropole | 2018 |
| Recensement population — Grands quartiers (Toulouse) | `5be128cb9ce2e703a2830ff0` | Toulouse métropole | 2015–2016 |

### 7.3 Births & Deaths (État Civil)

| Dataset | ID | Location |
|---------|----|----------|
| Démographie — Naissances Côtes d'Armor | `67ceae4c225e268885acaf9a` | Côtes d'Armor |
| Démographie — Naissances Poitiers depuis 2005 | `5511851bc751df2e70882846` | Poitiers |
| Séries historiques — Naissances Décès | `58ef2d4aa3a7293d49c4e17e` | Poitiers |

> Note: National-level INSEE demographic data is linked from data.gouv.fr but hosted on insee.fr in ZIP format (not directly queryable via Tabular API or MCP download).

---

## 8. SEARCH GAPS

Queries that returned **zero results** on data.gouv.fr MCP:

| Query | Domain |
|-------|--------|
| `PIB croissance` | Economy |
| `inflation prix consommation` | Economy |
| `commerce extérieur exportations` | Economy |
| `salaire revenu ménages` | Economy |
| `immigration étrangers` | Population |
| `espérance vie mortalité` | Population |
| `comptes nationaux INSEE` | Economy |
| `impôts fiscalité recettes` | Finance |
| `prélèvements obligatoires impôt` | Finance |
| `LOLF dépenses ministères` | Finance |
| `textes loi légifrance` | Law |
| `loi promulguée journal officiel` | Law |
| `éducation enseignement élèves` | Education |
| `santé hôpitaux` | Health |
| `énergie électricité consommation` | Energy |
| `logement immobilier construction` | Housing |
| `sécurité criminalité délinquance` | Security |
| `cinéma spectacle vivant` | Culture |
| `démographie France` | Population |
| `patrimoine monuments historiques` | Culture |

The MCP search uses AND logic — multi-word queries with accented/generic French terms frequently return empty. Single-word or two-word specific queries work best. Many national-level INSEE datasets exist on data.gouv.fr but are stored as external links to insee.fr in ZIP format, making them undiscoverable or unparseable through the MCP.

---

## 9. API PATTERNS

### Tabular API (for CSV/XLSX resources on data.gouv.fr)

```
GET https://tabular-api.data.gouv.fr/api/resources/{resource_id}/data/
    ?page=1
    &page_size=20
    &sort_column=total
    &sort_direction=desc
    &filter_column=annee
    &filter_value=2023
    &filter_operator=exact
```

Filter operators: `exact`, `contains`, `less`, `greater`, `strictly_less`, `strictly_greater`

### Direct Download (for external-hosted resources)

Many INSEE resources resolve to `https://api.insee.fr/melodi/file/...` which returns ZIP archives. The Sénat resources are at `https://data.senat.fr/data/senateurs/ODSEN_*.csv`.

### MCP Tool Workflow

```
search_datasets → get_dataset_info → list_dataset_resources →
  query_resource_data (CSV/XLSX via Tabular API)
  download_and_parse_resource (JSON/CSV direct download)
```

---

## 10. SUMMARY TABLE

| Domain | Dataset | Rows | Format | Tabular API | Parseable |
|--------|---------|------|--------|-------------|-----------|
| GDP | PIB France | 74 | CSV | No | Yes (download) |
| Employment | INSEE Emploi 2024 | — | ZIP | No | No |
| Enterprise | Créations séries longues | — | ZIP | No | No |
| Deputies (active) | Datan deputes-active | 577 | CSV | **Yes** | **Yes** |
| Deputies (historic) | Datan deputes-historique | ~2100 | CSV | **Yes** | **Yes** |
| Senators | Sénat ODSEN_GENERAL | ~348 | CSV | No | Yes (direct URL) |
| Elections | 484+ datasets | Varies | CSV | Varies | Varies |
| Déports ministériels *(Session 47)* | info.gouv.fr registre PM | 11 | HTML (Cloudflare) | No | Yes (browser automation) |
| State Budget | Min. Armées | — | XLS | No | No |
| Public Debt | Cour des comptes | 1 report | — | No | No |
| Public Sector Jobs | DGAFP effectifs | — | CSV | No (empty) | Untested |
| Museums | Min. Culture fréquentation | 12,292 | CSV | **Yes** | **Yes** |
| Monuments | Min. Culture Mérimée | 46,697 | CSV | **Yes** | **Yes** |
| Population | Commune-level | Varies | XLSX | Varies | Varies |
