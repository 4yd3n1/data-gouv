import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/investigative/eyebrow";

export const metadata: Metadata = {
  title: "Page introuvable — L'Observatoire Citoyen",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section
      style={{
        padding: "72px 40px 80px",
        maxWidth: 720,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Eyebrow tone="red">Page introuvable</Eyebrow>
      </div>
      <h1
        className="hd"
        style={{
          fontSize: "clamp(32px, 3.5vw, 52px)",
          lineHeight: 1.04,
          letterSpacing: "-0.018em",
          margin: "0 0 20px",
        }}
      >
        Cette page n&apos;existe pas
      </h1>
      <p
        className="obs-serif"
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--color-fg-mute)",
          marginBottom: 40,
          maxWidth: 560,
        }}
      >
        L&apos;adresse demandée ne correspond à aucune page connue de
        L&apos;Observatoire. Elle a peut-être été déplacée ou supprimée.
      </p>

      {/* Navigation links */}
      <nav
        aria-label="Liens de navigation alternatifs"
        style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}
      >
        {[
          { href: "/", label: "Accueil" },
          { href: "/profils", label: "Annuaire des profils" },
          { href: "/methodologie", label: "Méthodologie" },
          { href: "/signaux", label: "Signaux en direct" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "var(--color-fg-mute)",
              textDecoration: "none",
              borderBottom: "1px solid var(--line)",
              paddingBottom: 10,
            }}
          >
            <span style={{ color: "var(--color-signal)", fontWeight: 600 }}>→</span>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Search suggestion */}
      <form
        method="GET"
        action="/recherche"
        style={{ display: "flex", gap: 8, maxWidth: 480 }}
      >
        <input
          name="q"
          type="search"
          placeholder="Rechercher un nom, une institution…"
          style={{
            flex: 1,
            background: "var(--color-ink-0)",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "10px 12px",
            fontSize: 14,
            color: "var(--color-fg)",
            fontFamily: "var(--font-body)",
          }}
        />
        <button
          type="submit"
          style={{
            background: "transparent",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "10px 16px",
            fontSize: 13,
            color: "var(--color-fg-mute)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          Rechercher
        </button>
      </form>
    </section>
  );
}
