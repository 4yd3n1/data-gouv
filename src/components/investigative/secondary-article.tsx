import Link from "next/link";
import { Spark } from "./spark";
import { SrcChip } from "./src-chip";
import { ReadLink } from "./read-link";

export type SecondaryArticleData = {
  href: string;
  eyebrow: string;
  dateLabel: string;
  title: string;
  dek: string;
  sources: readonly string[];
  spark?: readonly number[];
};

export function SecondaryArticle({
  article,
  readLinkLabel = "Lire le dossier",
}: {
  article: SecondaryArticleData;
  readLinkLabel?: string;
}) {
  return (
    <article
      style={{
        borderTop: "1px solid var(--line-2)",
        paddingTop: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-signal)",
            letterSpacing: "0.14em",
          }}
        >
          {article.eyebrow}
        </span>
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-dim)",
            letterSpacing: "0.14em",
          }}
        >
          {article.dateLabel}
        </span>
      </div>
      <Link href={article.href} style={{ textDecoration: "none", color: "inherit" }}>
        <h2
          className="hd"
          style={{
            fontSize: 24,
            lineHeight: 1.15,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {article.title}
        </h2>
      </Link>
      <p
        style={{
          color: "var(--color-fg-mute)",
          fontSize: 14.5,
          lineHeight: 1.5,
          margin: 0,
          textWrap: "pretty" as const,
        }}
      >
        {article.dek}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
          gap: 12,
        }}
      >
        {article.spark ? (
          <Spark data={article.spark} width={90} height={22} color="var(--color-fg-mute)" />
        ) : (
          <span />
        )}
        <ReadLink href={article.href}>{readLinkLabel}</ReadLink>
      </div>
      <SrcChip items={article.sources} />
    </article>
  );
}
