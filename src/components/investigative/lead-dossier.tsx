import Link from "next/link";
import { ReactNode } from "react";
import { SrcChip } from "./src-chip";
import { ReadLink } from "./read-link";
import { Eyebrow } from "./eyebrow";

export function LeadDossier({
  href,
  kicker,
  headline,
  dek,
  sources,
  updatedLabel,
  readLinkLabel = "Ouvrir le dossier",
}: {
  href: string;
  kicker: string;
  headline: ReactNode;
  dek: ReactNode;
  sources: readonly string[];
  updatedLabel: string;
  readLinkLabel?: string;
}) {
  return (
    <article>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <Eyebrow tone="red" size="sm">◆ {kicker}</Eyebrow>
        <span
          className="obs-mono"
          style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
          aria-hidden
        >
          //
        </span>
        <Eyebrow>Dossier de une</Eyebrow>
      </div>
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        <h1
          className="hd"
          style={{
            fontSize: "clamp(30px, 3.2vw, 46px)",
            lineHeight: 1.04,
            margin: 0,
            letterSpacing: "-0.018em",
          }}
        >
          {headline}
        </h1>
      </Link>
      <p
        className="obs-serif"
        style={{
          fontSize: 16,
          lineHeight: 1.5,
          color: "var(--color-fg)",
          marginTop: 16,
          textWrap: "pretty" as const,
        }}
      >
        {dek}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <SrcChip items={sources} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-mute)",
            letterSpacing: "0.1em",
          }}
        >
          {updatedLabel}
        </div>
        <ReadLink href={href}>{readLinkLabel}</ReadLink>
      </div>
    </article>
  );
}
