import Link from "next/link";
import { SrcChip } from "./src-chip";
import { ReadLink } from "./read-link";

export type SecondaryDossier = {
  href: string;
  kicker: string;
  title: string;
  dek: string;
  sources: readonly string[];
  date: string;
};

export function SecondaryDossierCard({ dossier }: { dossier: SecondaryDossier }) {
  return (
    <article style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-signal)",
            letterSpacing: "0.14em",
          }}
        >
          {dossier.kicker}
        </span>
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-dim)",
          }}
        >
          {dossier.date}
        </span>
      </div>
      <Link href={dossier.href} style={{ textDecoration: "none", color: "inherit" }}>
        <h3
          className="hd"
          style={{ fontSize: 22, lineHeight: 1.14, margin: 0, letterSpacing: "-0.01em" }}
        >
          {dossier.title}
        </h3>
      </Link>
      <p
        style={{
          color: "var(--color-fg-mute)",
          fontSize: 13.5,
          lineHeight: 1.5,
          margin: 0,
          textWrap: "pretty" as const,
        }}
      >
        {dossier.dek}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <SrcChip items={dossier.sources} />
        <ReadLink href={dossier.href}>Lire</ReadLink>
      </div>
    </article>
  );
}
