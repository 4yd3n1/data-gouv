import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/investigative/eyebrow";

export const metadata: Metadata = {
  title: "Signalement reçu — L'Observatoire Citoyen",
  description: "Votre signalement d'erreur a bien été reçu.",
  robots: { index: false },
};

export default function MerciPage() {
  return (
    <section
      style={{
        padding: "64px 40px 80px",
        maxWidth: 680,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <Eyebrow>Confirmation</Eyebrow>
      </div>
      <h1
        className="hd"
        style={{
          fontSize: "clamp(28px, 3vw, 42px)",
          lineHeight: 1.06,
          letterSpacing: "-0.016em",
          margin: "0 0 20px",
        }}
      >
        Signalement reçu
      </h1>
      <p
        className="obs-serif"
        style={{
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--color-fg-mute)",
          marginBottom: 32,
          maxWidth: 560,
        }}
      >
        Votre signalement a été transmis à l&apos;équipe. Si vous avez laissé
        vos coordonnées, nous vous répondrons sous 5 jours ouvrés. Toute
        correction publiée apparaîtra en erratum daté.
      </p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "var(--color-fg-mute)",
            textDecoration: "none",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "8px 18px",
          }}
        >
          Accueil
        </Link>
        <Link
          href="/methodologie"
          style={{
            fontSize: 13,
            color: "var(--color-fg-mute)",
            textDecoration: "none",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "8px 18px",
          }}
        >
          Méthodologie
        </Link>
      </div>
    </section>
  );
}
