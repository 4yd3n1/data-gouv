import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("Dropping and recreating search index with canonical URLs...");

  // Drop existing view + indexes
  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS search_index CASCADE`);

  // Recreate with canonical /profils/* URLs
  await prisma.$executeRawUnsafe(`
    CREATE MATERIALIZED VIEW search_index AS

    SELECT
      'depute' AS entity_type,
      CAST(id AS TEXT) AS entity_id,
      nom || ' ' || prenom AS title,
      'D\u00e9put\u00e9 \u00b7 ' || COALESCE(groupe, '') AS subtitle,
      '/profils/deputes/' || id AS url,
      to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE(groupe, '')) AS search_vector
    FROM "Depute"

    UNION ALL

    SELECT
      'senateur' AS entity_type,
      CAST(id AS TEXT) AS entity_id,
      nom || ' ' || prenom AS title,
      'S\u00e9nateur \u00b7 ' || COALESCE(groupe, '') AS subtitle,
      '/profils/senateurs/' || id AS url,
      to_tsvector('french', nom || ' ' || prenom || ' ' || COALESCE(groupe, '')) AS search_vector
    FROM "Senateur"

    UNION ALL

    SELECT
      'lobbyiste' AS entity_type,
      CAST(id AS TEXT) AS entity_id,
      nom AS title,
      'Lobbyiste \u00b7 ' || COALESCE("categorieActivite", '') AS subtitle,
      '/profils/lobbyistes/' || id AS url,
      to_tsvector('french', nom || ' ' || COALESCE("categorieActivite", '')) AS search_vector
    FROM "Lobbyiste"

    UNION ALL

    SELECT
      'scrutin' AS entity_type,
      CAST(id AS TEXT) AS entity_id,
      titre AS title,
      CASE WHEN "sortCode" = 'adopt\u00e9' THEN 'Adopt\u00e9' ELSE 'Rejet\u00e9' END
        || ' \u00b7 ' || TO_CHAR("dateScrutin", 'DD/MM/YYYY') AS subtitle,
      '/votes/scrutins/' || id AS url,
      to_tsvector('french', titre) AS search_vector
    FROM "Scrutin"

    UNION ALL

    SELECT
      'commune' AS entity_type,
      code AS entity_id,
      libelle AS title,
      'Commune \u00b7 ' || "departementCode" AS subtitle,
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
      '/profils/partis/' || id AS url,
      to_tsvector('french', nom) AS search_vector
    FROM "PartiPolitique"
  `);

  // Recreate indexes
  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_search_index_vector ON search_index USING gin(search_vector)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX idx_search_index_type ON search_index (entity_type)
  `);

  console.log("Search index recreated with canonical URLs.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
