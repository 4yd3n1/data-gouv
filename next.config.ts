import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  async redirects() {
    return [
      // Legacy /gouvernance → /profils (final destination)
      { source: "/gouvernance", destination: "/profils", permanent: true },
      { source: "/gouvernance/deputes", destination: "/profils/deputes", permanent: true },
      { source: "/gouvernance/deputes/:id", destination: "/profils/deputes/:id", permanent: true },
      { source: "/gouvernance/senateurs", destination: "/profils/senateurs", permanent: true },
      { source: "/gouvernance/senateurs/:id", destination: "/profils/senateurs/:id", permanent: true },
      { source: "/gouvernance/elus", destination: "/profils/elus", permanent: true },
      { source: "/gouvernance/elus/maires", destination: "/profils/elus/maires", permanent: true },
      { source: "/gouvernance/lobbyistes", destination: "/profils/lobbyistes", permanent: true },
      { source: "/gouvernance/lobbyistes/:id", destination: "/profils/lobbyistes/:id", permanent: true },
      { source: "/gouvernance/partis", destination: "/profils/partis", permanent: true },
      { source: "/gouvernance/partis/:id", destination: "/profils/partis/:id", permanent: true },
      // President → profils
      { source: "/president", destination: "/profils/emmanuel-macron", permanent: true },
      // Phase 6: /representants → /profils
      { source: "/representants", destination: "/profils", permanent: true },
      { source: "/representants/deputes", destination: "/profils/deputes", permanent: true },
      { source: "/representants/deputes/:id", destination: "/profils/deputes/:id", permanent: true },
      { source: "/representants/senateurs", destination: "/profils/senateurs", permanent: true },
      { source: "/representants/senateurs/:id", destination: "/profils/senateurs/:id", permanent: true },
      { source: "/representants/lobbyistes", destination: "/profils/lobbyistes", permanent: true },
      { source: "/representants/lobbyistes/:id", destination: "/profils/lobbyistes/:id", permanent: true },
      { source: "/representants/partis", destination: "/profils/partis", permanent: true },
      { source: "/representants/partis/:id", destination: "/profils/partis/:id", permanent: true },
      { source: "/representants/elus", destination: "/profils/elus", permanent: true },
      { source: "/representants/elus/maires", destination: "/profils/elus/maires", permanent: true },
      { source: "/representants/scrutins", destination: "/votes", permanent: true },
      { source: "/representants/scrutins/:id", destination: "/votes/scrutins/:id", permanent: true },
      // Phase 6: /gouvernement → /profils
      { source: "/gouvernement", destination: "/profils/ministres", permanent: true },
      { source: "/gouvernement/:slug", destination: "/profils/:slug", permanent: true },
      // Phase 6: /gouvernance/scrutins → /votes
      { source: "/gouvernance/scrutins", destination: "/votes", permanent: true },
      { source: "/gouvernance/scrutins/:id", destination: "/votes/scrutins/:id", permanent: true },
      // Phase 6: /comparer/deputes → /profils/comparer
      { source: "/comparer/deputes", destination: "/profils/comparer", permanent: true },
      // Killed dossiers → signaux or territoire
      { source: "/dossiers", destination: "/signaux", permanent: true },
      { source: "/dossiers/confiance-democratique", destination: "/signaux", permanent: true },
      { source: "/dossiers/transition-ecologique", destination: "/signaux", permanent: true },
      { source: "/dossiers/retraites", destination: "/signaux", permanent: true },
      { source: "/dossiers/pouvoir-dachat", destination: "/territoire", permanent: true },
      { source: "/dossiers/dette-publique", destination: "/territoire", permanent: true },
      { source: "/dossiers/emploi-jeunesse", destination: "/territoire", permanent: true },
      { source: "/dossiers/logement", destination: "/territoire", permanent: true },
      { source: "/dossiers/sante", destination: "/territoire", permanent: true },
      // Phase 5: territory consolidation
      { source: "/economie", destination: "/territoire/economie", permanent: true },
      { source: "/comparer/territoires", destination: "/territoire/comparer", permanent: true },
      // P0.5: /votes/mon-depute → /mon-depute (308 permanent)
      { source: "/votes/mon-depute", destination: "/mon-depute", permanent: true },

      // ── Profile tab key migrations to 5-section frame (HTTP 308) ──
      // Minister tabs (excludes emmanuel-macron — president keeps specialized tabs)
      ...["parcours", "dossier", "hatvp", "mandats", "judiciaire", "parlementaire"].flatMap(
        (oldTab) => {
          const newTab =
            oldTab === "parcours"
              ? "chronologie"
              : oldTab === "dossier" || oldTab === "hatvp"
                ? "documents"
                : oldTab === "mandats" || oldTab === "parlementaire"
                  ? "relations"
                  : "signaux"; // judiciaire
          return [
            {
              source: "/profils/:slug((?!emmanuel-macron$)[^/]+)",
              has: [{ type: "query" as const, key: "tab", value: oldTab }],
              destination: `/profils/:slug?tab=${newTab}`,
              permanent: true,
            },
          ];
        },
      ),
      // Deputy tabs
      {
        source: "/profils/deputes/:id",
        has: [{ type: "query" as const, key: "tab", value: "transparence" }],
        destination: "/profils/deputes/:id?tab=signaux",
        permanent: true,
      },
      {
        source: "/profils/deputes/:id",
        has: [{ type: "query" as const, key: "tab", value: "declarations" }],
        destination: "/profils/deputes/:id?tab=documents",
        permanent: true,
      },
      {
        source: "/profils/deputes/:id",
        has: [{ type: "query" as const, key: "tab", value: "infos" }],
        destination: "/profils/deputes/:id?tab=resume",
        permanent: true,
      },
      // Senator tabs
      {
        source: "/profils/senateurs/:id",
        has: [{ type: "query" as const, key: "tab", value: "mandats" }],
        destination: "/profils/senateurs/:id?tab=chronologie",
        permanent: true,
      },
      {
        source: "/profils/senateurs/:id",
        has: [{ type: "query" as const, key: "tab", value: "transparence" }],
        destination: "/profils/senateurs/:id?tab=signaux",
        permanent: true,
      },
      {
        source: "/profils/senateurs/:id",
        has: [{ type: "query" as const, key: "tab", value: "declarations" }],
        destination: "/profils/senateurs/:id?tab=documents",
        permanent: true,
      },
      {
        source: "/profils/senateurs/:id",
        has: [{ type: "query" as const, key: "tab", value: "infos" }],
        destination: "/profils/senateurs/:id?tab=resume",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
