import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { NavSearch } from "@/components/nav-search";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "L'Observatoire — Bureau des données publiques",
  description:
    "Plateforme indépendante d'intelligence civique. Gouvernance, votes, lobbying, territoire — 800 000+ lignes de données publiques croisées (HATVP, AGORA, Assemblée, Sénat, INSEE).",
};

const NAV = [
  { href: "/dossiers/bilan-macron", label: "Dossiers" },
  { href: "/signaux", label: "Signaux en Direct" },
  { href: "/profils", label: "Annuaire" },
  { href: "/territoire", label: "Territoire" },
  { href: "/methodologie", label: "Méthode" },
];

function ObservatoireLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="var(--color-signal)" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4.2" stroke="var(--color-fg)" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.4" fill="var(--color-signal)" />
      <path d="M2 12 L22 12 M12 2 L12 22" stroke="var(--line-2)" strokeWidth="0.6" />
    </svg>
  );
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        borderBottom: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--color-ink-0) 85%, transparent)",
      }}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          style={{ color: "var(--color-fg)" }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-sm"
            style={{ border: "1px solid var(--line-2)" }}
          >
            <ObservatoireLogo size={18} />
          </span>
          <span className="flex items-center gap-2">
            <span
              className="obs-serif italic"
              style={{
                fontSize: 17,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: "var(--color-fg)",
              }}
            >
              L&apos;Observatoire
            </span>
            <span
              className="obs-mono hidden sm:inline"
              style={{
                fontSize: "var(--fs-mono-xs)",
                color: "var(--color-fg-dim)",
                letterSpacing: "0.1em",
              }}
            >
              //
            </span>
            <span
              className="obs-mono hidden sm:inline"
              style={{
                fontSize: "var(--fs-mono-xs)",
                color: "var(--color-fg-mute)",
                letterSpacing: "0.14em",
              }}
            >
              Bureau des données publiques
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NavSearch />
          <div className="nav-links flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="obs-mono rounded-sm px-3 py-1.5 transition-colors"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--color-fg-mute)",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <MobileNav items={NAV} />
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  const FOOTER_COLUMNS: Array<{
    title: string;
    items: Array<{ label: string; href?: string; external?: boolean }>;
  }> = [
    {
      title: "Méthodologie",
      items: [
        { label: "Sources de données", href: "/methodologie" },
        { label: "Définition des signaux", href: "/signaux" },
        { label: "Mise à jour des données", href: "/methodologie" },
        { label: "Politique de correction" },
        { label: "Charte éditoriale" },
      ],
    },
    {
      title: "Accès",
      items: [
        { label: "Annuaire", href: "/profils" },
        { label: "Registre des votes", href: "/votes" },
        { label: "Territoire", href: "/territoire" },
        { label: "Patrimoine culturel", href: "/patrimoine" },
        { label: "data.gouv.fr", href: "https://www.data.gouv.fr", external: true },
      ],
    },
    {
      title: "Contribuer",
      items: [
        { label: "Signaler une erreur" },
        { label: "Proposer une enquête" },
        { label: "Lanceurs d'alerte" },
        { label: "Transparence financière" },
        { label: "Newsletter" },
      ],
    },
  ];

  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: "1px solid var(--line)",
        background: "var(--color-ink-0)",
      }}
    >
      <div
        className="footer-grid mx-auto grid max-w-7xl gap-10 px-6 py-12"
      >
        {/* Brand */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-sm"
              style={{ border: "1px solid var(--line-2)" }}
            >
              <ObservatoireLogo size={16} />
            </span>
            <span
              className="obs-serif italic"
              style={{ fontSize: 17, color: "var(--color-fg)", letterSpacing: "-0.01em" }}
            >
              L&apos;Observatoire
            </span>
          </div>
          <p
            className="obs-serif"
            style={{
              marginTop: 12,
              color: "var(--color-fg-mute)",
              lineHeight: 1.55,
              maxWidth: 360,
              fontSize: 14,
            }}
          >
            Plateforme indépendante d&apos;intelligence civique. Surveille les
            institutions démocratiques françaises. Fondée sur 800 000+ lignes
            de données publiques vérifiables.
          </p>
          <div
            className="obs-mono"
            style={{
              marginTop: 16,
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-dim)",
              letterSpacing: "0.14em",
            }}
          >
            <span>v1.0 · stable</span>
            <span>//</span>
            <span>données data.gouv.fr</span>
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <div
              className="obs-mono"
              style={{
                color: "var(--color-fg-dim)",
                fontSize: "var(--fs-mono-xs)",
                marginBottom: 14,
                letterSpacing: "0.14em",
              }}
            >
              {col.title}
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {col.items.map((it) => (
                <li key={it.label}>
                  {it.href ? (
                    it.external ? (
                      <a
                        href={it.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--color-fg-mute)", textDecoration: "none", fontSize: 13.5 }}
                      >
                        {it.label}
                      </a>
                    ) : (
                      <Link
                        href={it.href}
                        style={{ color: "var(--color-fg-mute)", textDecoration: "none", fontSize: 13.5 }}
                      >
                        {it.label}
                      </Link>
                    )
                  ) : (
                    <span
                      className="cursor-help"
                      title="À venir"
                      style={{ color: "var(--color-fg-dim)", fontSize: 13.5 }}
                    >
                      {it.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--line)" }}>
        <div
          className="obs-mono mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-4"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-dim)",
            letterSpacing: "0.14em",
          }}
        >
          <span>L&apos;Observatoire · 2026</span>
          <span>Bureau des données publiques</span>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable} ${mono.variable}`}>
      <body
        className="flex min-h-screen flex-col antialiased"
        style={{
          background: "var(--color-ink-0)",
          color: "var(--color-fg)",
          fontFamily: "var(--font-body)",
        }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
