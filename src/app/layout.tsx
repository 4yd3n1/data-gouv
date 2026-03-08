import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { NavSearch } from "@/components/nav-search";
import { MobileNav } from "@/components/mobile-nav";
import "./globals.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const display = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "L'Observatoire Citoyen — Intelligence civique française",
  description: "Plateforme de transparence : gouvernance, économie, territoire et patrimoine. Données publiques françaises cross-référencées.",
};

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/dossiers", label: "Dossiers" },
  { href: "/representants", label: "Représentants" },
  { href: "/votes", label: "Votes" },
  { href: "/economie", label: "Économie" },
  { href: "/territoire", label: "Territoire" },
  { href: "/patrimoine", label: "Patrimoine" },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-bureau-700/50 bg-bureau-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal/10 text-teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className={`${display.variable} font-[family-name:var(--font-display)] text-lg text-bureau-100`}>
            L&apos;Observatoire
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NavSearch />
          <div className="nav-links flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-bureau-300 transition-colors hover:bg-bureau-800 hover:text-bureau-100"
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
  return (
    <footer className="mt-auto border-t border-bureau-700/30 bg-bureau-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-bureau-500">
        <p>Données publiques — data.gouv.fr, INSEE, Sénat, HATVP</p>
        <p>L&apos;Observatoire Citoyen · 2025</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${body.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col bg-bureau-950 font-[family-name:var(--font-body)] text-bureau-200 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
