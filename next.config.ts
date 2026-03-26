import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      // Phase 6: activate once /representants/* and /gouvernement/* pages are deleted
      // { source: "/representants", destination: "/profils", permanent: true },
      // { source: "/representants/deputes", destination: "/profils/deputes", permanent: true },
      // { source: "/representants/deputes/:id", destination: "/profils/deputes/:id", permanent: true },
      // { source: "/representants/senateurs", destination: "/profils/senateurs", permanent: true },
      // { source: "/representants/senateurs/:id", destination: "/profils/senateurs/:id", permanent: true },
      // { source: "/representants/lobbyistes", destination: "/profils/lobbyistes", permanent: true },
      // { source: "/representants/lobbyistes/:id", destination: "/profils/lobbyistes/:id", permanent: true },
      // { source: "/representants/partis", destination: "/profils/partis", permanent: true },
      // { source: "/representants/partis/:id", destination: "/profils/partis/:id", permanent: true },
      // { source: "/representants/elus", destination: "/profils/elus", permanent: true },
      // { source: "/representants/elus/maires", destination: "/profils/elus/maires", permanent: true },
      // { source: "/gouvernement", destination: "/profils/ministres", permanent: true },
      // { source: "/gouvernement/:slug", destination: "/profils/:slug", permanent: true },
      // { source: "/comparer/deputes", destination: "/profils/comparer", permanent: true },
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
      // These will be added in Phase 5 once the pages are deleted:
      // { source: "/economie", destination: "/territoire", permanent: true },
      // { source: "/mon-territoire", destination: "/territoire", permanent: true },
    ];
  },
};

export default nextConfig;
