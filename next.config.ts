import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/gouvernance", destination: "/representants", permanent: true },
      { source: "/gouvernance/deputes", destination: "/representants/deputes", permanent: true },
      { source: "/gouvernance/deputes/:id", destination: "/representants/deputes/:id", permanent: true },
      { source: "/gouvernance/senateurs", destination: "/representants/senateurs", permanent: true },
      { source: "/gouvernance/senateurs/:id", destination: "/representants/senateurs/:id", permanent: true },
      { source: "/gouvernance/elus", destination: "/representants/elus", permanent: true },
      { source: "/gouvernance/elus/maires", destination: "/representants/elus/maires", permanent: true },
      { source: "/gouvernance/lobbyistes", destination: "/representants/lobbyistes", permanent: true },
      { source: "/gouvernance/lobbyistes/:id", destination: "/representants/lobbyistes/:id", permanent: true },
      { source: "/gouvernance/partis", destination: "/representants/partis", permanent: true },
      { source: "/gouvernance/partis/:id", destination: "/representants/partis/:id", permanent: true },
    ];
  },
};

export default nextConfig;
