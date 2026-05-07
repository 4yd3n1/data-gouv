-- Read-only Postgres role for the Remotion fact-check pipeline.
-- The Remotion repo (sibling to data-gouv) connects via this role to query
-- PersonnalitePublique / EvenementJudiciaire / ActionLobby / ConflictSignal.
-- SELECT only; INSERT / UPDATE / DELETE rejected at the DB layer even if a
-- bug calls prisma.x.create() from the Remotion side.
--
-- The placeholder password lives here only so the migration applies cleanly;
-- the real password is stored in Remotion's .env.local (gitignored). Rotate
-- both at the same time when needed via:
--   ALTER ROLE remotion_reader WITH PASSWORD '...';

DO $$
BEGIN
  CREATE ROLE remotion_reader WITH LOGIN PASSWORD 'remotion_reader_local_only';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;

GRANT CONNECT ON DATABASE datagouv TO remotion_reader;
GRANT USAGE ON SCHEMA public TO remotion_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO remotion_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO remotion_reader;
