# Database Schema Reference

> Last updated: Mar 4, 2026 (Session 29)

Complete reference for all Prisma models, fields, relations, indexes, and ingestion sources.

---

## Overview

- **Database**: PostgreSQL 14
- **ORM**: Prisma 7 with `@prisma/adapter-pg` (WASM driver)
- **Connection**: `postgresql://aydenmomika@localhost:5432/datagouv`
- **Schema file**: [`prisma/schema.prisma`](../prisma/schema.prisma)
- **Client config**: [`prisma.config.ts`](../prisma.config.ts) — datasource URL injection

### Model Count

| Layer | Models | Approx. Rows |
|-------|--------|-------------|
| Territory | Region, Departement, Commune | ~37,031 |
| Governance | Depute, Senateur, MandatSenateur, CommissionSenateur, Lobbyiste, ActionLobbyiste | ~106,500 |
| Economy | Indicateur, Observation | ~358 |
| Culture | Musee, FrequentationMusee, Monument | ~60,071 |
| Declarations | DeclarationInteret, ParticipationFinanciere, RevenuDeclaration | varies |
| Parliament | Organe, Scrutin, GroupeVote, VoteRecord, Deport | varies |
| Elections & RNE | Elu, ElectionLegislative, CandidatLegislatif, PartiPolitique | ~601,514 |
| Local Data | StatLocale, BudgetLocal | ~70,667 (~1,644 + 69,023) |
| Vote Tags | ScrutinTag | ~3,170 |
| Safety & Health | StatCriminalite, DensiteMedicale | varies |
| Cross-reference | ConflictSignal | populated by `pnpm compute:conflicts` |
| Government Profiles (Phase 9) | PersonnalitePublique, MandatGouvernemental, EntreeCarriere, InteretDeclare, EvenementJudiciaire, ActionLobby | ~35 persons, 184+ interests, 94,924 ActionLobby, 12 EntreeCarriere |
| System | IngestionLog | grows over time |

**Total models**: 36 + IngestionLog

---

## Territory Layer (COG — Code Officiel Géographique)

Source: INSEE COG CSV exports. Ingested by `scripts/ingest-territoires.ts`.

### `Region`

INSEE administrative regions (18 in metropolitan France + overseas).

| Field | Type | Description |
|-------|------|-------------|
| `code` | String PK | INSEE region code: `"84"`, `"75"`, `"01"` (Guadeloupe), etc. |
| `cheflieu` | String? | INSEE code of the chef-lieu commune |
| `tncc` | Int? | Type de nom en clair (0–8, affects article usage) |
| `ncc` | String | Uppercase name: `"ILE-DE-FRANCE"` |
| `libelle` | String | Display name with article: `"Île-de-France"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `departements Departement[]`

**Indexes**: `libelle`

**Row count**: 18

---

### `Departement`

French departments (101 total including overseas).

| Field | Type | Description |
|-------|------|-------------|
| `code` | String PK | INSEE dept code: `"75"`, `"2A"`, `"974"`, `"976"` |
| `regionCode` | String FK | References `Region.code` |
| `cheflieu` | String? | INSEE commune code of the chef-lieu |
| `tncc` | Int? | Type de nom en clair |
| `ncc` | String | Uppercase: `"PARIS"`, `"CORSE-DU-SUD"` |
| `libelle` | String | Display: `"Paris"`, `"Corse-du-Sud"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**:
- `region Region` (many-to-one)
- `communes Commune[]`
- `deputes Depute[]`
- `senateurs Senateur[]`
- `musees Musee[]`
- `monuments Monument[]`
- `elus Elu[]`

**Indexes**: `regionCode`, `libelle`

**Row count**: 101

---

### `Commune`

All French communes (36,912 COM type). Also includes ARM (arrondissements), COMD (delegated communes), COMA (associated communes).

| Field | Type | Description |
|-------|------|-------------|
| `code` | String PK | 5-char INSEE code: `"75056"` (Paris), `"13055"` (Marseille) |
| `departementCode` | String FK | References `Departement.code` |
| `regionCode` | String | Denormalized for query performance |
| `typecom` | String | `COM` / `COMA` / `COMD` / `ARM` |
| `tncc` | Int? | Type de nom en clair |
| `ncc` | String | Uppercase name |
| `libelle` | String | Display name |
| `can` | String? | Canton code |
| `arr` | String? | Arrondissement code |
| `comparent` | String? | Parent commune code — set for ARM (arrondissements: Paris 75111→75056, Lyon 69381→69123, Marseille 13201→13055) and COMA/COMD |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**:
- `departement Departement` (many-to-one)
- `musees Musee[]`
- `monuments Monument[]`
- `elus Elu[]`

**Indexes**: `departementCode`, `regionCode`, `libelle`, `typecom`

**Row count**: ~36,912 (COM type only — filter `where: { typecom: "COM" }` for UI display)

---

## Governance Layer

### `Depute`

Members of the Assemblée Nationale. Source: Datan dataset via data.gouv.fr Tabular API.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | Acteur ID: `"PA1008"`, `"PA567"` |
| `legislature` | Int | Legislature number (e.g. 17) |
| `civilite` | String | `"M."` / `"Mme"` |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `villeNaissance` | String? | City of birth |
| `dateNaissance` | DateTime? | Date of birth |
| `age` | Int? | Age (at ingestion) |
| `groupe` | String | Full group name: `"Rassemblement National"` |
| `groupeAbrev` | String | Short: `"RN"`, `"SOC"`, `"DR"` |
| `departementNom` | String | Department name from source |
| `departementCode` | String | Raw code from source (may be `"099"`, `"975"` for overseas — not in COG) |
| `departementRefCode` | String? | Nullable FK to `Departement` (only set when code exists in COG) |
| `circonscription` | Int | Constituency number within the department |
| `datePriseFonction` | DateTime? | Date deputy took office |
| `profession` | String? | Declared profession |
| `email` | String? | Official contact email |
| `twitter` | String? | Twitter/X handle |
| `facebook` | String? | Facebook URL |
| `website` | String? | Personal/official website |
| `nombreMandats` | Int? | Total mandates held |
| `experienceDepute` | String? | Text: `"9 ans"` |
| `scoreParticipation` | Float? | Participation score 0–100 |
| `scoreSpecialite` | Float? | Speciality score |
| `scoreLoyaute` | Float? | Loyalty score (votes aligned with group) |
| `scoreMajorite` | Float? | Majority score |
| `photoUrl` | String? | Official AN photo URL |
| `actif` | Boolean | `true` if current legislature — **Note**: ministers who resigned their seat are set to `false` (Bayrou, Darmanin, Barrot, Vautrin, Borne, Wauquiez, Pannier-Runacher manually corrected) |
| `dateMaj` | DateTime? | Last update from source |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**:
- `departement Departement?` (via `departementRefCode`)
- `votes VoteRecord[]`
- `deports Deport[]`
- `personnalites PersonnalitePublique[]` — Phase 9 cross-reference

**Indexes**: `nom+prenom`, `groupeAbrev`, `departementCode`, `departementRefCode`, `actif`

**Row count**: ~2,101 (570 active — 7 corrected to `actif=false` after joining Bayrou government)

---

### `Senateur`

Members of the French Senate. Source: official Sénat open data CSVs (ISO-8859-1 encoding).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | Sénat matricule |
| `civilite` | String? | `"M."` / `"Mme"` |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `dateNaissance` | DateTime? | Date of birth |
| `groupe` | String? | Political group |
| `departement` | String? | Department name from source |
| `departementCode` | String? | Resolved FK to `Departement` (via fuzzy name matching) |
| `profession` | String? | Declared profession |
| `datePriseFonction` | DateTime? | Date senator took office |
| `actif` | Boolean | `true` if currently serving |
| `dateMaj` | DateTime? | Last update |
| `photoUrl` | String? | Official Sénat photo URL |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**:
- `departementRef Departement?` (via `departementCode`)
- `mandats MandatSenateur[]`
- `commissions CommissionSenateur[]`
- `personnalites PersonnalitePublique[]` — Phase 9 cross-reference

**Indexes**: `nom+prenom`, `groupe`, `departementCode`, `actif`

**Row count**: ~1,943

---

### `MandatSenateur`

Electoral and other mandates held by senators. Source: `ODSEN_ELUSEN.csv`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `senateurId` | String FK | References `Senateur.id` |
| `type` | String | `"senatorial"`, `"deputy"`, `"european"`, `"metropolitan"`, `"municipal"`, etc. |
| `libelle` | String | Full mandate description |
| `dateDebut` | DateTime? | Start date |
| `dateFin` | DateTime? | End date (null = ongoing) |

**Relations**: `senateur Senateur` (cascade delete)

**Row count**: ~3,348

---

### `CommissionSenateur`

Senate committee memberships. Source: `ODSEN_CUR_COMS.csv`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `senateurId` | String FK | References `Senateur.id` |
| `nom` | String | Committee name |
| `fonction` | String? | `"Président"`, `"Membre"`, etc. |
| `dateDebut` | DateTime? | Start date |
| `dateFin` | DateTime? | End date (null = ongoing) |

**Relations**: `senateur Senateur` (cascade delete)

**Row count**: ~616

---

### `Lobbyiste`

Organizations registered in the HATVP public lobbying registry.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | HATVP registry ID |
| `nom` | String | Organization name |
| `type` | String? | Entity type (association, société, etc.) |
| `categorieActivite` | String? | Activity category |
| `adresse` | String? | Registered address |
| `siren` | String? | SIREN company number |
| `effectif` | String? | Staff count range: `"1-9"`, `"10-49"` |
| `chiffreAffaires` | String? | Revenue range |
| `dateInscription` | DateTime? | Registry registration date |
| `dateMaj` | DateTime? | Last update |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `actions ActionLobbyiste[]`

**Indexes**: `nom`, `categorieActivite`

**Row count**: ~3,883

---

### `ActionLobbyiste`

Individual lobbying actions declared by organizations. Source: HATVP JSON (nested).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `lobbyisteId` | String FK | References `Lobbyiste.id` |
| `type` | String? | Action type |
| `description` | String? | Description of the lobbying action |
| `domaine` | String? | Policy domain (énergie, transport, etc.) |
| `periode` | String? | Reporting period |

**Relations**: `lobbyiste Lobbyiste` (cascade delete)

**Indexes**: `lobbyisteId`, `domaine`

**Row count**: ~94,646

---

## Economy Layer (INSEE BDM time-series)

Source: INSEE BDM SDMX XML + data.gouv.fr GDP CSV. Ingested by `scripts/ingest-economie.ts`.

### `Indicateur`

Economic indicator definitions (4 series currently loaded).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `code` | String UNIQUE | Internal code: `"PIB_ANNUEL"`, `"CHOMAGE_TRIM_NATIONAL"`, `"CHOMEURS_TRIM_NATIONAL"`, `"CREATIONS_ENTREPRISES_MENSUEL"` |
| `idBank` | String? | INSEE BDM idBank reference |
| `dataflow` | String? | INSEE BDM dataflow identifier |
| `nom` | String | Display name: `"PIB annuel"` |
| `description` | String? | Full description |
| `domaine` | String | `"pib"`, `"emploi"`, `"entreprises"` |
| `unite` | String | `"millions_eur"`, `"pourcent"`, `"nombre"` |
| `frequence` | String | `"annuel"`, `"trimestriel"`, `"mensuel"` |
| `source` | String | `"data.gouv.fr"`, `"INSEE BDM"` |
| `sourceUrl` | String? | Direct URL to source |
| `correction` | String? | `"CVS"` (seasonally adjusted), `"brut"` |
| `dernierePeriode` | String? | Latest period string: `"2025-Q4"` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `observations Observation[]`

**Indexes**: `domaine`

**Row count**: 4

---

### `Observation`

Individual data points for each indicator.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `indicateurId` | String FK | References `Indicateur.id` |
| `periode` | String | Period string: `"2022"`, `"2024-Q3"`, `"2025-01"` |
| `periodeDebut` | DateTime | Normalized start date for sorting/charting |
| `valeur` | Float | The observation value |
| `statut` | String? | `"A"` (definitive), `"P"` (provisional) |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `[indicateurId, periode]`

**Indexes**: `indicateurId`, `periodeDebut`, `(indicateurId, periodeDebut)`

**Row count**: ~354

---

## Culture Layer

### `Musee`

French museums with label Musée de France. Source: data.gouv.fr Tabular API (IDMuseofile dataset).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | IDMuseofile: `"M0001"`, `"M5027"` |
| `idPatrimostat` | String? | Patrimostat identifier |
| `nom` | String | Museum name |
| `ville` | String? | City |
| `communeCode` | String? FK | References `Commune.code` |
| `departementCode` | String? FK | References `Departement.code` |
| `region` | String? | Region name from source (display only) |
| `dateAppellation` | String? | Date label was granted |
| `ferme` | String? | `"oui"` / `"non"` |
| `anneeFermeture` | Int? | Year of closure if applicable |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `commune Commune?`, `departement Departement?`, `frequentations FrequentationMusee[]`

**Indexes**: `nom`, `communeCode`, `departementCode`

**Row count**: ~1,226

---

### `FrequentationMusee`

Annual visitor attendance per museum.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `museeId` | String FK | References `Musee.id` |
| `annee` | Int | Year |
| `payant` | Int? | Paying visitors |
| `gratuit` | Int? | Free-admission visitors |
| `total` | Int? | Total visitors |
| `individuel` | Int? | Individual visitors |
| `scolaires` | Int? | School groups |
| `groupesHorsScolaires` | Int? | Non-school groups |
| `moins18AnsHorsScolaires` | Int? | Under-18 non-school |
| `de18a25Ans` | Int? | 18–25 age group |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `[museeId, annee]`

**Indexes**: `museeId`, `annee`

**Row count**: ~12,148

---

### `Monument`

Classified and registered historical monuments (MH). Source: data.gouv.fr Tabular API.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | Reference code: `"PA00078066"`, `"IA00067890"` |
| `denomination` | String? | Name of the monument |
| `domaine` | String? | `"architecture religieuse"`, `"architecture militaire"`, etc. |
| `communeNom` | String? | Commune name from source |
| `communeCode` | String? FK | References `Commune.code` |
| `departementCode` | String? FK | References `Departement.code` |
| `departementNom` | String? | Department name from source |
| `region` | String? | Region from source |
| `adresse` | String? | Street address |
| `sieclePrincipal` | String? | `"16e siècle"`, `"XIXe siècle"` |
| `siecleSecondaire` | String? | Secondary period |
| `protectionType` | String? | `"classé MH"`, `"inscrit MH"` |
| `protectionDate` | String? | Complex date string |
| `statutJuridique` | String? | Ownership type |
| `description` | String? | Architectural description |
| `historique` | String? | Historical context |
| `coordonnees` | String? | Raw GPS string from source |
| `latitude` | Float? | Parsed WGS84 latitude |
| `longitude` | Float? | Parsed WGS84 longitude |
| `dateMaj` | String? | Last update from source |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `commune Commune?`, `departement Departement?`

**Indexes**: `denomination`, `communeCode`, `departementCode`, `domaine`, `protectionType`, `region`

**Row count**: ~46,697

---

## Declarations Layer (HATVP)

Source: HATVP XML open data. Ingested by `scripts/ingest-declarations.ts`.

### `DeclarationInteret`

Interest and activity declarations filed by elected officials. Source: HATVP XML.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | UUID from HATVP XML |
| `civilite` | String? | `"M."` / `"Mme"` |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `dateNaissance` | DateTime? | Date of birth |
| `typeDeclaration` | String | `"DI"` (intérêts) / `"DIA"` (intérêts et activités) / `"DIM"` (modification) |
| `typeMandat` | String | `"Député"`, `"Sénateur"`, `"Ministre"`, `"Maire ou adjoint municipal"`, etc. |
| `organe` | String? | Territorial or institutional scope: `"Seine-Saint-Denis(93)"` |
| `qualiteDeclarant` | String? | `"Président EPCI"`, `"maire"`, etc. |
| `dateDepot` | DateTime? | Filing date |
| `dateDebutMandat` | DateTime? | Start of mandate |
| `totalParticipations` | Float? | Computed sum of all `ParticipationFinanciere.evaluation` |
| `totalRevenus` | Float? | Computed sum of latest-year `RevenuDeclaration.montant` |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `participations ParticipationFinanciere[]`, `revenus RevenuDeclaration[]`

**Indexes**: `nom+prenom`, `typeMandat`, `totalParticipations`

---

### `ParticipationFinanciere`

Financial shareholdings declared by officials.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `declarationId` | String FK | References `DeclarationInteret.id` |
| `nomSociete` | String | Company name |
| `evaluation` | Float? | Estimated value in EUR |
| `remuneration` | String? | Free text: `"151 en 2021"` |
| `capitalDetenu` | String? | `"< 25%"`, `"> 25%"` |
| `nombreParts` | String? | Number of shares/units |

**Relations**: `declaration DeclarationInteret` (cascade delete)

---

### `RevenuDeclaration`

Income sources declared per activity type.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `declarationId` | String FK | References `DeclarationInteret.id` |
| `type` | String | `"professionnel"`, `"mandat_electif"`, `"dirigeant"`, `"consultant"` |
| `description` | String? | Activity description or role |
| `employeur` | String? | Employer or organization name |
| `annee` | Int? | Year of income |
| `montant` | Float? | Amount in EUR |

**Relations**: `declaration DeclarationInteret` (cascade delete)

**Indexes**: `declarationId`, `type`

---

## Parliamentary Votes Layer (AN open data)

Source: Assemblée Nationale open data XML. Ingested by `scripts/ingest-organes.ts`, `scripts/ingest-scrutins.ts`, `scripts/ingest-deports.ts`.

### `Organe`

Parliamentary bodies — political groups, committees, etc.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | `"PO845401"`, `"PO59047"` |
| `codeType` | String | `"GP"` (groupe parlementaire), `"COMPER"` (commission permanente), `"COMNL"`, `"CMP"`, `"ORGEXTPARL"`, `"GA"`, `"MISINFO"`, etc. |
| `libelle` | String | Full name: `"Rassemblement National"` |
| `libelleAbrege` | String? | Abbreviated: `"RN"` |
| `libelleAbrev` | String? | Alternate short name |
| `dateDebut` | DateTime? | Creation date |
| `dateFin` | DateTime? | Dissolution date (null = active) |
| `legislature` | Int? | Legislature number |
| `couleur` | String? | Hex color `"#313567"` (political groups only) |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `scrutins Scrutin[]`, `votesGroupe GroupeVote[]`

**Indexes**: `codeType`, `legislature`

---

### `Scrutin`

Parliamentary votes (solemn and public votes at AN).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | `"VTANR5L17V1"` — unique vote identifier |
| `numero` | Int | Sequential vote number |
| `legislature` | Int | Legislature (e.g. 17) |
| `dateScrutin` | DateTime | Date of the vote |
| `organeRef` | String FK | References `Organe.id` (the plenary assembly) |
| `codeTypeVote` | String | `"MOC"` (motion de censure), `"SPO"`, `"SPS"`, etc. |
| `libelleTypeVote` | String | `"motion de censure"`, `"scrutin public ordinaire"` |
| `typeMajorite` | String? | Required majority type |
| `sortCode` | String | `"rejeté"`, `"adopté"` |
| `titre` | String | Full description of what was voted on |
| `demandeur` | String? | Who requested the vote |
| `nombreVotants` | Int | Total voters |
| `suffragesExprimes` | Int | Expressed votes |
| `nbrSuffragesRequis` | Int? | Votes required for adoption |
| `pour` | Int | For |
| `contre` | Int | Against |
| `abstentions` | Int | Abstentions |
| `nonVotants` | Int? | Non-voters |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `organe Organe?`, `votes VoteRecord[]`, `groupeVotes GroupeVote[]`

**Indexes**: `dateScrutin`, `legislature`, `sortCode`, `codeTypeVote`, `numero`

---

### `GroupeVote`

Vote breakdown per political group for each scrutin.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `scrutinId` | String FK | References `Scrutin.id` |
| `organeRef` | String FK | References `Organe.id` (the political group) |
| `nombreMembresGroupe` | Int | Total group members |
| `positionMajoritaire` | String | Group's majority position: `"pour"`, `"contre"`, `"abstention"` |
| `pour` | Int | Members voting for |
| `contre` | Int | Members voting against |
| `abstentions` | Int | Abstentions |
| `nonVotants` | Int | Non-voters |

**Unique constraint**: `[scrutinId, organeRef]`

**Relations**: `scrutin Scrutin` (cascade delete), `organe Organe?`

---

### `VoteRecord`

Individual deputy votes per scrutin.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `scrutinId` | String FK | References `Scrutin.id` |
| `deputeId` | String FK | References `Depute.id` |
| `position` | String | `"pour"`, `"contre"`, `"abstention"`, `"nonVotant"` |
| `parDelegation` | Boolean | Vote cast by delegation |
| `groupeOrganeRef` | String? | Political group the deputy voted within |
| `causePositionVote` | String? | `"MG"` (membre du gouvernement), `"PAN"`, `"PSE"` |

**Unique constraint**: `[scrutinId, deputeId]`

**Indexes**: `scrutinId`, `deputeId`, `position`

---

### `Deport`

Recusal declarations (conflicts of interest) by deputies.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | `"DPTR5L15PA335999D0001"` |
| `legislature` | Int | Legislature number |
| `deputeId` | String FK | References `Depute.id` |
| `dateCreation` | DateTime? | Creation date |
| `datePublication` | DateTime? | Publication date |
| `porteeCode` | String? | `"COMPLET"` |
| `porteeLibelle` | String? | Full scope description |
| `instanceCode` | String? | `"COM"` (commission), etc. |
| `instanceLibelle` | String? | `"Commission"` |
| `cibleType` | String? | `"AUD"` (audition), etc. |
| `cibleTexte` | String? | Description of what was recused from |
| `explication` | String? | HTML explanation text |
| `createdAt` | DateTime | Auto |

**Indexes**: `deputeId`, `legislature`

---

## Elections & RNE Layer

### `Elu`

Elected officials from the Répertoire National des Élus (RNE). Source: DGCL CSV files by mandate type. Ingested by `scripts/ingest-elus.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `typeMandat` | String | `"maire"`, `"conseiller_municipal"`, `"conseiller_departemental"`, `"conseiller_regional"`, `"depute_europeen"`, `"conseiller_arrondissement"`, `"membre_assemblee"`, `"conseiller_francais_etranger"`, `"assemblee_francais_etranger"` |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `sexe` | String | `"M"` / `"F"` |
| `dateNaissance` | DateTime? | Date of birth |
| `codeCSP` | String? | INSEE socio-professional category code |
| `libelleCSP` | String? | Category label |
| `codeDepartement` | String? FK | References `Departement.code` (nullable) |
| `libelleDepartement` | String? | Department name from source |
| `codeCommune` | String? FK | References `Commune.code` (nullable) |
| `libelleCommune` | String? | Commune name from source |
| `codeCanton` | String? | Canton code (for conseillers départementaux) |
| `libelleCanton` | String? | Canton name |
| `codeCollParticuliere` | String? | Collectivité à statut particulier code |
| `libelleCollParticuliere` | String? | Collectivité name |
| `fonction` | String? | Role within the body: `"Président"`, `"Vice-président"`, `"Secrétaire"` |
| `dateDebutMandat` | DateTime? | Start of mandate |
| `dateDebutFonction` | DateTime? | Start of function/role |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: `departementRef Departement?`, `communeRef Commune?`

**Indexes**: `typeMandat`, `nom+prenom`, `codeDepartement`, `codeCommune`, `sexe`, `(typeMandat, codeDepartement)`, `(typeMandat, codeCommune)`

**Row count by type**:
| Type | Count |
|------|-------|
| conseiller_municipal | 485,827 |
| conseiller_communautaire | 65,027 |
| maire | 34,874 |
| conseiller_departemental | 4,042 |
| conseiller_regional | 1,747 |
| conseiller_arrondissement | 1,025 |
| conseiller_francais_etranger | 441 |
| assemblee_francais_etranger | 89 |
| depute_europeen | 81 |
| **Total** | **593,153** |

---

### `ElectionLegislative`

2024 French legislative election results per constituency. Sources: data.gouv.fr static CSV exports. Ingested by `scripts/ingest-elections.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `annee` | Int | Election year (2024) |
| `tour` | Int | `1` (1er tour) or `2` (2nd tour) |
| `codeDepartement` | String | Department code (plain string — no FK, overseas codes like `"ZZ"` present) |
| `libelleDepartement` | String | Department name |
| `codeCirconscription` | String | 2-digit constituency number within dept: `"01"`, `"12"` |
| `libelleCirconscription` | String | Full constituency name |
| `inscrits` | Int | Registered voters |
| `votants` | Int | Voters who voted |
| `abstentions` | Int | Abstentions |
| `exprimes` | Int | Expressed votes |
| `blancs` | Int | Blank ballots |
| `nuls` | Int | Null ballots |
| `createdAt` | DateTime | Auto |

**Relations**: `candidats CandidatLegislatif[]`

**Unique constraint**: `[annee, tour, codeDepartement, codeCirconscription]`

**Indexes**: `(annee, tour)`, `codeDepartement`

**Note**: No FK to `Departement` — overseas constituencies use codes not in COG (e.g. `"ZZ"` for Français établis hors de France). The column is a plain string.

**Row count**: 1,078 (577 tour 1 + 501 tour 2)

---

### `CandidatLegislatif`

Individual candidates in legislative elections.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `electionId` | String FK | References `ElectionLegislative.id` |
| `numeroPanneau` | Int | Candidate panel number |
| `nuance` | String | Political nuance code: `"RN"`, `"ENS"`, `"LFI"`, `"LR"`, `"LIOT"`, `"UG"`, `"DVG"`, `"DVE"`, `"DVC"`, `"DVD"`, `"DSV"`, `"EXG"`, `"EXD"`, `"REC"`, `"DLF"`, `"REG"`, `"NDA"`, `"ECO"`, `"SOC"`, etc. |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `sexe` | String | `"MASCULIN"` / `"FEMININ"` |
| `voix` | Int | Total votes received |
| `pctInscrits` | Float? | % of registered voters |
| `pctExprimes` | Float? | % of expressed votes |
| `elu` | Boolean | Elected (won the seat) |

**Relations**: `election ElectionLegislative` (cascade delete)

**Indexes**: `electionId`, `nuance`, `elu`, `nom+prenom`

**Row count**: ~5,103

---

### `PartiPolitique`

Political party financial accounts from CNCCFP (Commission nationale des comptes de campagne et des financements politiques). Source: data.gouv.fr. Ingested by `scripts/ingest-partis.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `codeCNCC` | Int | CNCCFP party code |
| `nom` | String | Party name |
| `exercice` | Int | Accounting year |
| `cotisationsAdherents` | Float | Member dues |
| `cotisationsElus` | Float | Elected official dues |
| `aidePublique1` | Float | 1ère fraction public aid (based on votes) |
| `aidePublique2` | Float | 2nde fraction public aid (based on elected MPs) |
| `donsPersonnes` | Float | Donations from natural persons |
| `contributionsPartis` | Float | Contributions received from other parties |
| `contributionsCandidats` | Float | Contributions to candidates |
| `salaires` | Float | Salaries |
| `chargesSociales` | Float | Social charges |
| `communication` | Float | Communication expenses |
| `totalProduits` | Float | Total revenue (recettes) |
| `totalCharges` | Float | Total expenses (dépenses) |
| `resultat` | Float | Net result (surplus if positive, deficit if negative) |
| `emprunts` | Float | Loans outstanding |
| `disponibilites` | Float | Cash available |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Unique constraint**: `[codeCNCC, exercice]`

**Indexes**: `nom`, `exercice`, `resultat`

**Row count**: ~2,180 (years 2021–2024)

---

## System

### `IngestionLog`

Tracks every ingestion run with timing, row counts, status, and metadata.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `source` | String | Script name: `"deputes"`, `"senateurs"`, `"elections"`, `"elus"`, etc. |
| `status` | String | `"success"`, `"error"`, `"partial"` |
| `rowsIngested` | Int | Rows successfully written |
| `rowsTotal` | Int? | Total rows available at source |
| `duration` | Int | Execution time in milliseconds |
| `error` | String? | Error message if status = `"error"` |
| `metadata` | String? | JSON string for source-specific stats (e.g. `{"elections": 577, "candidats": 2651}`) |
| `createdAt` | DateTime | Auto |

**Usage**: Written by `scripts/lib/ingestion-log.ts` wrapper function. Displayed in ingestion summary at end of `pnpm ingest`.

---

## Local Data Layer (Phase 1 additions)

Source: INSEE Mélodi API (anonymous, no API key) + OFGL Opendatasoft. Ingested by `scripts/ingest-insee-local.ts` + `scripts/ingest-budgets.ts`.

### `StatLocale`

Generic per-department/commune statistical indicators. All rows are upserted on `(source, indicateur, annee, geoType, geoCode)`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `source` | String | `"FILOSOFI"`, `"RP"` |
| `indicateur` | String | Indicator key — see table below |
| `annee` | Int | Reference year |
| `geoType` | String | `"DEP"` (only type currently ingested) |
| `geoCode` | String | INSEE dept code: `"75"`, `"93"`, `"974"` |
| `valeur` | Float | The indicator value |
| `unite` | String | `"EUR"`, `"%"`, `"NB"` |
| `metadata` | String? | JSON for additional breakdowns (unused currently) |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `(source, indicateur, annee, geoType, geoCode)`

**Indexes**: `(indicateur, geoType)`, `(geoCode, geoType)`, `annee`, `(indicateur, geoCode)`

**Row count**: ~1,644 (95–101 depts × 14 indicators; some depts partial due to Mélodi rate-limiting — re-run is safe)

**Known indicators by dataset**:

| Indicator | Source | Annee | Unite | Description |
|-----------|--------|-------|-------|-------------|
| `MEDIAN_INCOME` | FILOSOFI | 2021 | EUR | Médian des revenus disponibles par UC |
| `POVERTY_RATE` | FILOSOFI | 2021 | % | Taux de pauvreté au seuil de 60 % |
| `D1_INCOME` | FILOSOFI | 2021 | EUR | 1er décile des revenus disponibles |
| `D9_INCOME` | FILOSOFI | 2021 | EUR | 9e décile des revenus disponibles |
| `INTERDECILE_RATIO` | FILOSOFI | 2021 | — | Rapport interdécile D9/D1 |
| `POP_TOTAL` | RP | 2022 | NB | Population totale |
| `POP_65PLUS` | RP | 2022 | NB | Population 65 ans et plus |
| `POP_0019` | RP | 2022 | NB | Population 0–19 ans |
| `EMPLOYMENT_RATE` | RP | 2022 | % | Taux d'emploi |
| `UNEMPLOYMENT_RATE_LOCAL` | RP | 2022 | % | Taux de chômage local (recensement) |
| `ACTIVITY_RATE` | RP | 2022 | % | Taux d'activité |
| `HOUSING_TOTAL` | RP | 2022 | NB | Total résidences principales |
| `HOUSING_VACANCY_RATE` | RP | 2022 | % | Part des logements vacants (avg 8.7 %) |
| `HOUSING_SECONDARY_RATE` | RP | 2022 | % | Part des résidences secondaires (avg 11.5 %) |
| `EDUC_NO_DIPLOMA` | RP | 2022 | % | Part sans diplôme (Dataset: `DS_RP_DIPLOMES_PRINC`, EDUC code `001T100_RP`) |
| `EDUC_BAC_PLUS` | RP | 2022 | % | Part avec baccalauréat (EDUC code `350T351_RP`) |
| `EDUC_HIGHER_EDUC` | RP | 2022 | % | Part avec enseignement supérieur (EDUC codes `500_RP`+`600_RP`+`700_RP`) |

Housing indicators use dataset `DS_RP_LOGEMENT_PRINC` (Mélodi), OCS column: `_T` = total, `DW_VAC` = vacant, `DW_SEC_DW_OCC` = secondary. Rates computed as `(count / total) * 100`. See `scripts/lib/insee-client.ts` → `fetchLogementDep()`.

Education indicators use dataset `DS_RP_DIPLOMES_PRINC` (Mélodi), dimension `EDUC` (NOT `DIPL_GEN`). Rates computed per population 15 ans et plus. See `scripts/lib/insee-client.ts` → `fetchEducationDep()`.

---

### `BudgetLocal`

Local government financial accounts per commune or département, from OFGL Opendatasoft (not data.collectivites-locales.gouv.fr — those URLs are dead).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `geoType` | String | `"COM"` or `"DEP"` |
| `geoCode` | String | INSEE commune/dept code |
| `geoLibelle` | String | Name of the collectivité |
| `annee` | Int | Budget year |
| `population` | Int? | Reference population |
| `totalRecettes` | Float? | Total revenue (€) |
| `recettesFonct` | Float? | Operating revenue (€) |
| `recettesInvest` | Float? | Investment revenue (€) |
| `impotsTaxes` | Float? | Tax receipts (€) |
| `dotationsSubv` | Float? | Dotations & subventions (€) |
| `totalDepenses` | Float? | Total expenditure (€) |
| `depensesFonct` | Float? | Operating expenditure (€) |
| `depensesInvest` | Float? | Investment expenditure (€) |
| `chargesPersonnel` | Float? | Staff costs (€) |
| `encoursDette` | Float? | Outstanding debt (€) |
| `annuiteDette` | Float? | Annual debt service (€) |
| `resultatComptable` | Float? | Accounting result (€) |
| `depenseParHab` | Float? | Expenditure per inhabitant (€/hab) |
| `detteParHab` | Float? | Debt per inhabitant (€/hab) |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `(geoType, geoCode, annee)`

**Indexes**: `(geoType, geoCode)`, `annee`, `(geoType, annee)`

**Row count**: 69,023 (380 depts × 2 years + ~68,643 communes for 2022/2023)

---

### `ScrutinTag`

Topic classification of parliamentary votes. Each scrutin can have multiple tags. Populated by `pnpm tag:scrutins` (`scripts/tag-scrutins.ts`) — must run after `ingestScrutins`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `scrutinId` | String FK | References `Scrutin.id` (cascade delete) |
| `tag` | String | Policy topic: `"budget"`, `"fiscalite"`, `"sante"`, `"logement"`, `"emploi"`, `"education"`, `"retraites"`, `"ecologie"`, `"immigration"`, `"defense"`, `"institutionnel"`, `"europeen"`, `"culture"` |
| `confidence` | Float | 0–1: `1.0` for multi-word keyword match, `0.7` for single keyword match |

**Unique constraint**: `(scrutinId, tag)`

**Indexes**: `tag`, `scrutinId`

**Row count**: ~3,170

**Tags** (13 values): `budget`, `fiscalite`, `sante`, `logement`, `emploi`, `education`, `retraites`, `ecologie`, `immigration`, `defense`, `institutionnel`, `europeen`, `culture`

---

## Safety & Health Layer (Phase 5 additions)

Source: SSMSI + DREES. Ingested by `scripts/ingest-criminalite.ts` + `scripts/ingest-medecins.ts`.

### `StatCriminalite`

Crime statistics by département and indicator. Source: SSMSI (Service Statistique Ministériel de la Sécurité Intérieure) static CSV on data.gouv.fr.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `departementCode` | String FK | References `Departement.code` |
| `indicateur` | String | Crime category key — see below |
| `annee` | Int | Reference year |
| `total` | Int? | Raw count (number of offences recorded) |
| `tauxPour1000` | Float? | Rate per 1,000 inhabitants |
| `variationPct` | Float? | Year-over-year % change (null for first year) |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `(departementCode, indicateur, annee)`

**Indexes**: `departementCode`, `indicateur`, `annee`

**Known indicators** (8): `coups_blessures`, `vols_sans_violence`, `cambriolages`, `violences_sexuelles`, `escroqueries`, `destructions`, `homicides`, `vols_avec_violence`

---

### `DensiteMedicale`

Healthcare professional density per département. Source: DREES (Direction de la Recherche, des Études, de l'Évaluation et des Statistiques) Opendatasoft API.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `departementCode` | String FK | References `Departement.code` |
| `specialite` | String | Profession type — see below |
| `annee` | Int | Reference year |
| `nombreMedecins` | Int | Headcount (raw) |
| `pour10k` | Float? | Practitioners per 10,000 inhabitants |
| `population` | Int? | Reference population for density calculation |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `(departementCode, specialite, annee)`

**Indexes**: `departementCode`, `specialite`, `annee`

**Known `specialite` values** (6): `MG` (médecin généraliste), `SPEC` (spécialiste), `INFIRMIER`, `KINESITHERAPEUTE`, `DENTISTE`, `PHARMACIEN`

**UI**: `/dossiers/sante` shows `MG` density as a `DeptMap`. `/territoire/[dept]` shows `MG` density + `StatCriminalite` top categories in Santé & Sécurité section.

---

## ConflictSignal (Phase 7C — Session 15)

Pre-computed cross-reference results: deputy financial participations × vote records by policy domain. Populated by `pnpm compute:conflicts` (not by the main ingest orchestrator — run separately after Wave 5c).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `nom` | String | Deputy family name |
| `prenom` | String | Deputy given name |
| `typeMandat` | String | `"Député"` |
| `deputeId` | String? | Nullable FK to `Depute.id` (PA* format) |
| `secteurDeclaration` | String | Company name from `ParticipationFinanciere.nomSociete` |
| `participationCount` | Int | Number of financial participations declared in this sector |
| `totalMontant` | Float? | Sum of `ParticipationFinanciere.evaluation` in EUR |
| `tag` | String | Matched `ScrutinTag.tag` value |
| `voteCount` | Int | Number of vote records for this deputy on this tag |
| `votePour` | Int | Votes cast for on tagged scrutins |
| `voteContre` | Int | Votes cast against on tagged scrutins |
| `voteAbstention` | Int | Abstentions on tagged scrutins |
| `lastScrutinDate` | DateTime? | Date of most recent matching scrutin |
| `computedAt` | DateTime | Timestamp of last computation run |

**Unique constraint**: `(nom, prenom, typeMandat, secteurDeclaration, tag)`

**Populated by**: `scripts/compute-conflicts.ts` → `pnpm compute:conflicts`

**Algorithm**: `DeclarationInteret` × `ParticipationFinanciere.nomSociete` → `scripts/lib/sector-tag-map.ts` (15 RegExp patterns) → `VoteRecord` count per (deputeId, tag).

**Row count**: populated after running `pnpm compute:conflicts`

---

## search_index (PostgreSQL Materialized View — Session 15 / 7B)

Not a Prisma model — a PostgreSQL materialized view created by migration `20260302000000_add_search_index`. Backs the `globalSearch()` function in `src/lib/search.ts`.

**Migration file**: `prisma/migrations/20260302000000_add_search_index/migration.sql`

**Refresh**: `REFRESH MATERIALIZED VIEW search_index` — run via `pnpm refresh:search` after full ingest.

**Columns**: `entity_type`, `entity_id`, `title`, `subtitle`, `url`, `search_vector` (tsvector)

**Indexed entities**:

| entity_type | Source table | title | subtitle | url |
|-------------|-------------|-------|----------|-----|
| `depute` | Depute | `nom + prenom` | `Député · groupe` | `/representants/deputes/[id]` |
| `senateur` | Senateur | `nom + prenom` | `Sénateur · groupe` | `/representants/senateurs/[id]` |
| `lobbyiste` | Lobbyiste | `nom` | `Lobbyiste · categorieActivite` | `/representants/lobbyistes/[id]` |
| `scrutin` | Scrutin | `titre` | `Adopté/Rejeté · date` | `/gouvernance/scrutins/[id]` |
| `commune` | Commune (`typecom=COM`) | `libelle` | `Commune · deptCode` | `/territoire/commune/[code]` |
| `parti` | PartiPolitique | `nom` | `Parti politique` | `/representants/partis/[id]` |

**Indexes**: GIN index on `search_vector` (fast full-text), B-tree on `entity_type` (filter).

**Language**: `french` stemming via `to_tsvector('french', ...)` and `plainto_tsquery('french', ...)`.

**Static injection**: `src/lib/search.ts` also injects a hardcoded "Emmanuel Macron / Président de la République → `/gouvernement/emmanuel-macron`" result when the query matches `macron`, `manu`, `president`, `elysee` (no DB row — `/president` 308-redirects to `/gouvernement/emmanuel-macron`).

---

## Ingestion Order

Dependencies must run in this order (earlier layers are FK targets):

```
Wave 1a:  ingestTerritoires()                              # Region, Departement, Commune
Wave 1b:  Promise.all([ingestDeputes(), ingestSenateurs(), ingestLobbyistes()])
Wave 2:   ingestEconomie()                                 # Indicateur, Observation (15+ BDM series)
Wave 3:   Promise.all([ingestMusees(), ingestMonuments()])
Wave 4:   ingestDeclarations()                             # Large HATVP XML
Wave 5a:  ingestOrganes()                                  # Must precede scrutins
Wave 5b:  Promise.all([ingestScrutins(), ingestDeports()])
Wave 5c:  tagScrutins()                                    # ScrutinTag — run after scrutins
Wave 5d:  computeConflicts()                               # ConflictSignal — run after 5c
Wave 6:   ingestPhotos()                                   # Enriches Depute/Senateur photoUrl
Wave 7:   Promise.all([ingestElus(), ingestElections(), ingestPartis()])
Wave 8:   Promise.all([ingestInseeLocal(), ingestBudgets()])   # StatLocale, BudgetLocal
Wave 9:   Promise.all([ingestCriminalite(), ingestMedecins()]) # StatCriminalite, DensiteMedicale
Wave 10:  REFRESH MATERIALIZED VIEW search_index           # Final step — pnpm refresh:search
# Phase 9 (separate — run after 9A seed):
Phase9a:  npx tsx scripts/ingest-hatvp.ts                  # InteretDeclare (re-run safe)
Phase9c:  pnpm ingest:agora                                 # ActionLobby — 94,924 records (~32s)
Phase9d:  pnpm generate:carriere                            # EntreeCarriere from MandatGouvernemental + Depute/Senateur (NOT HATVP ACTIVITE_ANTERIEURE)
```

---

## Key Schema Decisions

### `departementCode` vs `departementRefCode` on Depute

`departementCode` stores the raw source code (may be `"099"`, `"975"`, `"977"`, `"978"` for overseas deputies not in COG). `departementRefCode` is the nullable FK to `Departement` — set only when the code actually exists in the database. UI joins use `departementRefCode`; raw display uses `departementCode`.

### No FK on `ElectionLegislative.codeDepartement`

Legislative election data includes overseas constituencies with dept codes like `"ZZ"` (Français établis hors de France) that don't exist in the COG `Departement` table. The FK was removed (migration `20260301102159_drop_election_dept_fk`) to allow these rows to be stored without constraint violations.

### Commune `typecom` filter

The `Commune` table contains COM (full communes), ARM (Paris/Lyon/Marseille arrondissements), COMD (delegated communes from mergers), and COMA (associated communes). For most UI displays and counts, filter to `typecom: "COM"` to get the canonical 36,912 active communes.

### `IngestionLog.metadata` as JSON string

Stored as `String?` rather than `Json` to avoid Prisma adapter type issues. Parse with `JSON.parse()` when reading.

### Postal code → Commune resolution (static file, no DB model)

`src/data/postal-codes.json` — 6,328 entries, La Poste Hexasmal dataset. Maps French postal codes to lists of INSEE commune codes: `{ "75011": ["75111"], "01000": ["01053", "01344"], ... }`. Used by `src/lib/postal-resolver.ts` to resolve a postal code to département + région context for the `/mon-territoire` page. ARM commune codes (Paris 75001–75020 → 75111, etc.) are resolved to their parent COM via `Commune.comparent`.

Source: `https://www.data.gouv.fr/api/1/datasets/r/008a2dda-2c60-4b63-b910-998f6f818089` (CSV, ISO-8859-1, semicolon-delimited, fields: `Code_commune_INSEE;Nom_de_la_commune;Code_postal;...`).

---

## Government Profiles Layer (Phase 9)

Source: HATVP open data XML + AGORA JSON + seed script (`scripts/seed-gouvernement.ts`). Routes: `/gouvernement` (index) + `/gouvernement/[slug]` (profile). Ingestion: `scripts/ingest-hatvp.ts` (interests), `scripts/ingest-agora.ts` (lobby actions), `scripts/generate-carriere.ts` (career timeline).

### Enums

| Enum | Values |
|------|--------|
| `TypeMandat` | `PRESIDENT`, `PREMIER_MINISTRE`, `MINISTRE`, `MINISTRE_DELEGUE`, `SECRETAIRE_ETAT` |
| `CategorieCarriere` | `FORMATION`, `CARRIERE_PRIVEE`, `FONCTION_PUBLIQUE`, `MANDAT_ELECTIF`, `MANDAT_GOUVERNEMENTAL`, `ORGANISME`, `AUTRE` |
| `SourceCarriere` | `HATVP`, `ASSEMBLEE`, `PRESSE`, `MANUELLE` |
| `RubriqueInteret` | `ACTIVITE_ANTERIEURE`, `MANDAT_ELECTIF`, `PARTICIPATION`, `ACTIVITE_CONJOINT`, `ACTIVITE_BENEVOLE`, `REVENU`, `DON_AVANTAGE` |
| `TypeEvenement` | `ENQUETE_PRELIMINAIRE`, `MISE_EN_EXAMEN`, `RENVOI_CORRECTIONNELLE`, `CONDAMNATION`, `RELAXE`, `CLASSEMENT_SANS_SUITE`, `NON_LIEU`, `APPEL`, `GARDE_A_VUE`, `COUR_JUSTICE_REPUBLIQUE` |
| `StatutEvenement` | `EN_COURS`, `CLOS`, `APPEL_EN_COURS` |
| `SourceRecherche` | `HATVP_ONLY`, `HATVP_PLUS_PRESSE`, `VERIFIE_MANUELLEMENT` |

---

### `PersonnalitePublique`

Core profile record for each government official. One row per person (not per mandate).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `nom` | String | Family name |
| `prenom` | String | Given name |
| `civilite` | String? | `"M."` / `"Mme"` |
| `dateNaissance` | DateTime? | Date of birth |
| `lieuNaissance` | String? | City of birth |
| `slug` | String UNIQUE | URL identifier: `"francois-bayrou"` |
| `photoUrl` | String? | Portrait URL |
| `bioCourte` | String? | 1–2 sentence biography |
| `formation` | String? | Academic background |
| `deputeId` | String? FK | References `Depute.id` — set when minister is also a current/former deputy. **7 records populated** via name-match: Bayrou (PA410), Barrot (PA721836), Borne (PA717161), Darmanin (PA607846), Pannier-Runacher (PA759832), Vautrin (PA267797), Wauquiez (PA267285). Enables redirect from `/representants/deputes/[id]` → `/gouvernement/[slug]`. |
| `senateurId` | String? FK | References `Senateur.id` — set when minister is also a senator |
| `hatvpDossierId` | String? | HATVP declaration URL path (e.g. `/open-data/xml/...`) |
| `sourceRecherche` | SourceRecherche | Research completeness: `HATVP_ONLY` / `HATVP_PLUS_PRESSE` / `VERIFIE_MANUELLEMENT` |
| `derniereMaj` | DateTime | Last updated (auto `@updatedAt`) |
| `createdAt` | DateTime | Auto |

**Relations**: `depute Depute?`, `senateur Senateur?`, `mandats MandatGouvernemental[]`, `carriere EntreeCarriere[]`, `interets InteretDeclare[]`, `evenements EvenementJudiciaire[]`

**Indexes**: `nom+prenom`, `deputeId`, `senateurId`

**Row count**: ~35 (current Bayrou government seeded)

---

### `MandatGouvernemental`

One row per government role held. A person who served in multiple governments has multiple rows.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `personnaliteId` | String FK | References `PersonnalitePublique.id` (cascade delete) |
| `titre` | String | Full official title |
| `titreCourt` | String | Display title (used in UI cards) |
| `gouvernement` | String | e.g. `"Gouvernement François Bayrou"` |
| `premierMinistre` | String? | PM name (redundant but useful for display) |
| `president` | String? | President name |
| `dateDebut` | DateTime | Start date |
| `dateFin` | DateTime? | End date — **null = currently in office** |
| `rang` | Int | Protocol order (used for sorting) |
| `type` | TypeMandat | Enum: `PRESIDENT` / `PREMIER_MINISTRE` / `MINISTRE` / `MINISTRE_DELEGUE` / `SECRETAIRE_ETAT` |
| `portefeuille` | String? | Free-text description of responsibilities |
| `ministereCode` | String? | Normalized ministry code — join key to `ActionLobby.ministereCode` |

**Indexes**: `personnaliteId`, `ministereCode`, `type`, `gouvernement`

---

### `EntreeCarriere`

Career timeline entries. Auto-generated from structured sources by `scripts/generate-carriere.ts` (idempotent — deletes and recreates on each run). Sources: `MandatGouvernemental` (source: `HATVP`) + `Depute` linked via `deputeId` (source: `ASSEMBLEE`) + `Senateur` linked via `senateurId` (source: `ASSEMBLEE`). **HATVP `ACTIVITE_ANTERIEURE` is NOT a source** — financial disclosure fields produce noise, not structured career entries.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `personnaliteId` | String FK | References `PersonnalitePublique.id` (cascade delete) |
| `dateDebut` | DateTime? | Start date |
| `dateFin` | DateTime? | End date (null = ongoing) |
| `categorie` | CategorieCarriere | Career category enum |
| `titre` | String | Role title |
| `organisation` | String? | Employer or institution |
| `description` | String? | Additional detail |
| `source` | SourceCarriere | `HATVP` / `ASSEMBLEE` / `PRESSE` / `MANUELLE` |
| `sourceUrl` | String? | Source URL |
| `sourceDate` | DateTime? | Date the source was accessed |
| `ordre` | Int | Manual sort order (default 0) |

**Indexes**: `personnaliteId`, `categorie`

---

### `InteretDeclare`

Interest declaration items parsed from HATVP XML. One row per item per declaration per rubrique.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `personnaliteId` | String FK | References `PersonnalitePublique.id` (cascade delete) |
| `declarationRef` | String | HATVP declaration identifier (groups items into a declaration) |
| `dateDeclaration` | DateTime? | Filing date of the declaration |
| `rubrique` | RubriqueInteret | Section type enum |
| `contenu` | String | Main text content of the interest entry |
| `organisation` | String? | Related organization name |
| `montant` | Float? | Monetary amount in EUR (for revenues/participations) |
| `dateDebut` | DateTime? | Start date |
| `dateFin` | DateTime? | End date |
| `alerteConflit` | Boolean | Set to true when a potential conflict was detected |
| `commentaireConflit` | String? | Explanation of the conflict |

**Indexes**: `personnaliteId`, `declarationRef`, `rubrique`, `alerteConflit`

**Row count**: 184 (Bayrou, Oct 2025 declaration). Other ministers' XML not yet published by HATVP — re-running `npx tsx scripts/ingest-hatvp.ts` picks them up automatically.

**HATVP XML → `rubrique` mapping**:

| XML Section | rubrique |
|-------------|----------|
| Mandats électifs (Section 1) | `MANDAT_ELECTIF` |
| Activités pro 5 dernières années (Section 2) | `ACTIVITE_ANTERIEURE` |
| Activités de consultant (Section 3) | `ACTIVITE_ANTERIEURE` |
| Participations financières (Section 4) | `PARTICIPATION` |
| Activités du conjoint (Section 5) | `ACTIVITE_CONJOINT` |
| Fonctions bénévoles (Section 6) | `ACTIVITE_BENEVOLE` |
| Revenus (Section 7) | `REVENU` |
| Dons et avantages (Section 8) | `DON_AVANTAGE` |

---

### `EvenementJudiciaire`

Judicial proceedings linked to a public figure.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `personnaliteId` | String FK | References `PersonnalitePublique.id` (cascade delete) |
| `date` | DateTime? | Date of the event |
| `type` | TypeEvenement | Proceeding type enum |
| `nature` | String? | Free text: `"abus de confiance"`, `"favoritisme"` |
| `juridiction` | String? | Court or jurisdiction name |
| `statut` | StatutEvenement | `EN_COURS` / `CLOS` / `APPEL_EN_COURS` |
| `resume` | String | 1–2 sentence factual summary (no editorializing) |
| `sourcePrincipale` | String | Outlet name: `"AFP"`, `"Le Monde"` |
| `sourceUrl` | String? | Source URL |
| `sourceDate` | DateTime? | Date the source was published |
| `verifie` | Boolean | **CRITICAL: only display on public profiles when `true`** |

**Indexes**: `personnaliteId`, `verifie`, `type`

**Legal rule**: `mise en examen` ≠ `condamnation`. Never imply guilt. Always state the proceeding type exactly.

---

### `ActionLobby`

Lobby actions from the AGORA registry targeting a specific ministry. **No direct FK to `PersonnalitePublique`** — the link is indirect: `MandatGouvernemental.ministereCode` → `ActionLobby.ministereCode`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String PK | cuid() |
| `representantNom` | String | Lobbying organization or representative name |
| `representantCategorie` | String? | Category (entreprise, association, etc.) |
| `ministereCode` | String | Target ministry code — join key to `MandatGouvernemental.ministereCode` |
| `domaine` | String? | Policy domain |
| `typeAction` | String? | Action type |
| `exercice` | String? | Reporting year: `"2023"`, `"2024"` |
| `depensesTranche` | String? | Declared spend range: `"10 000 € à 19 999 €"` |
| `sourceUrl` | String? | AGORA registry URL |
| `createdAt` | DateTime | Auto |

**Indexes**: `ministereCode`, `representantNom`, `exercice`, `domaine`

**Join pattern**: `PersonnalitePublique` → `MandatGouvernemental` (where `dateFin IS NULL`) → `ActionLobby` (on `ministereCode`). Never join `ActionLobby` directly to `PersonnalitePublique`.
