import Link from "next/link";
import { ReactNode } from "react";
import { SrcChip } from "./src-chip";
import { ReadLink } from "./read-link";
import { Eyebrow } from "./eyebrow";

export function HeroLead({
  href,
  kicker,
  dateLabel,
  headline,
  dek,
  sources,
  readLinkLabel = "Lire le dossier",
}: {
  href: string;
  kicker: string;
  dateLabel: string;
  headline: ReactNode;
  dek: ReactNode;
  sources: readonly string[];
  readLinkLabel?: string;
}) {
  return (
    <article>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <Eyebrow tone="red" size="sm">
          ◆ {kicker}
        </Eyebrow>
        <span
          className="obs-mono"
          style={{ color: "var(--color-fg-dim)", fontSize: "var(--fs-mono-xs)" }}
          aria-hidden
        >
          //
        </span>
        <Eyebrow>{dateLabel}</Eyebrow>
      </div>

      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        <h1
          className="hd"
          style={{
            fontSize: "clamp(36px, 4.1vw, 58px)",
            lineHeight: 1.02,
            margin: 0,
            letterSpacing: "-0.02em",
            fontWeight: 400,
          }}
        >
          {headline}
        </h1>
      </Link>

      <p
        className="obs-serif"
        style={{
          fontSize: 19,
          lineHeight: 1.55,
          color: "var(--color-fg)",
          marginTop: 22,
          maxWidth: 640,
          textWrap: "pretty" as const,
        }}
      >
        {dek}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 26,
          flexWrap: "wrap",
        }}
      >
        <SrcChip items={sources} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 22,
          marginTop: 22,
          paddingTop: 22,
          borderTop: "1px solid var(--line)",
        }}
      >
        <ReadLink href={href}>{readLinkLabel}</ReadLink>
      </div>
    </article>
  );
}
