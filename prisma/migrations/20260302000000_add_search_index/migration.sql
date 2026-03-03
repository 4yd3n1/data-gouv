-- Search index materialized view for global full-text search
-- Covers: deputies, senators, lobbyists, scrutins, communes (COM only), parties
-- Uses PostgreSQL french-language stemming via to_tsvector('french', ...)
-- Refresh with: REFRESH MATERIALIZED VIEW search_index

CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS

SELECT
  'depute' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  nom || ' ' || prenom AS title,
  'Député · ' || COALESCE(groupe, '') AS subtitle,
  '/representants/deputes/' || id AS url,
  to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE(groupe, '')) AS search_vector
FROM "Depute"

UNION ALL

SELECT
  'senateur' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  nom || ' ' || prenom AS title,
  'Sénateur · ' || COALESCE(groupe, '') AS subtitle,
  '/representants/senateurs/' || id AS url,
  to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE(groupe, '')) AS search_vector
FROM "Senateur"

UNION ALL

SELECT
  'lobbyiste' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  nom AS title,
  'Lobbyiste · ' || COALESCE("categorieActivite", '') AS subtitle,
  '/representants/lobbyistes/' || id AS url,
  to_tsvector('french', nom || ' ' || COALESCE("categorieActivite", '')) AS search_vector
FROM "Lobbyiste"

UNION ALL

SELECT
  'scrutin' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  titre AS title,
  CASE WHEN "sortCode" = 'adopté' THEN 'Adopté' ELSE 'Rejeté' END
    || ' · ' || TO_CHAR("dateScrutin", 'DD/MM/YYYY') AS subtitle,
  '/gouvernance/scrutins/' || id AS url,
  to_tsvector('french', titre) AS search_vector
FROM "Scrutin"

UNION ALL

SELECT
  'commune' AS entity_type,
  code AS entity_id,
  libelle AS title,
  'Commune · ' || "departementCode" AS subtitle,
  '/territoire/commune/' || code AS url,
  to_tsvector('french', libelle) AS search_vector
FROM "Commune"
WHERE typecom = 'COM'

UNION ALL

SELECT
  'parti' AS entity_type,
  CAST(id AS TEXT) AS entity_id,
  nom AS title,
  'Parti politique' AS subtitle,
  '/representants/partis/' || id AS url,
  to_tsvector('french', nom) AS search_vector
FROM "PartiPolitique";

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_search_index_vector
  ON search_index USING gin(search_vector);

-- B-tree index for entity_type filtering
CREATE INDEX IF NOT EXISTS idx_search_index_type
  ON search_index (entity_type);
