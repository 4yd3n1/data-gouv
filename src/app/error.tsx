"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side error (no PII)
    console.error("[L'Observatoire] Erreur rendue par le boundary :", error.message);
  }, [error]);

  return (
    <section
      style={{
        padding: "72px 40px 80px",
        maxWidth: 600,
      }}
    >
      <p
        className="obs-mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "var(--color-signal)",
          marginBottom: 16,
        }}
      >
        ERREUR INATTENDUE
      </p>
      <h1
        className="hd"
        style={{
          fontSize: "clamp(26px, 3vw, 40px)",
          lineHeight: 1.06,
          letterSpacing: "-0.016em",
          margin: "0 0 16px",
        }}
      >
        Une erreur s&apos;est produite
      </h1>
      <p
        className="obs-serif"
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--color-fg-mute)",
          marginBottom: 32,
          maxWidth: 480,
        }}
      >
        La page n&apos;a pas pu se charger. Vous pouvez réessayer ou revenir à
        l&apos;accueil.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{
            background: "transparent",
            border: "1px solid var(--color-signal)",
            borderRadius: 4,
            padding: "10px 20px",
            fontSize: 13,
            color: "var(--color-signal)",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
          }}
        >
          Réessayer
        </button>
        <Link
          href="/"
          style={{
            display: "inline-block",
            border: "1px solid var(--line)",
            borderRadius: 4,
            padding: "10px 20px",
            fontSize: 13,
            color: "var(--color-fg-mute)",
            textDecoration: "none",
            fontFamily: "var(--font-body)",
          }}
        >
          Accueil
        </Link>
      </div>
    </section>
  );
}
