import type { Metadata } from "next";
import Link from "next/link";
import { listDrafts } from "@/lib/factcheck-manifest";
import { Eyebrow } from "@/components/investigative/eyebrow";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Vérifications publiées | L'Observatoire",
  description:
    "L'ensemble des fact-checks vidéo publiés par L'Observatoire, sources expansées et données vérifiables.",
};

const CATEGORY_COLOR: Record<string, string> = {
  ECONOMIE: "#d4a017",
  SOCIAL: "#ff3b30",
  SANTE: "#2dd4bf",
  DEMOCRATIE: "#3b5278",
  CLIMAT: "#22c55e",
};

const CATEGORY_LABEL: Record<string, string> = {
  ECONOMIE: "Économie",
  SOCIAL: "Social",
  SANTE: "Santé",
  DEMOCRATIE: "Démocratie",
  CLIMAT: "Climat",
};

const ALL_CATEGORIES = ["ECONOMIE", "SOCIAL", "SANTE", "DEMOCRATIE", "CLIMAT"] as const;

export default async function VerificationsIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { cat } = await searchParams;
  const drafts = await listDrafts();

  const filtered = cat
    ? drafts.filter((d) => d.category === cat.toUpperCase())
    : drafts;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* ── Page header ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 12 }}>
          <Eyebrow tone="red">Vérifications</Eyebrow>
        </div>
        <h1
          className="hd"
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 16px",
          }}
        >
          Fact-checks publiés
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--color-fg-mute)",
            margin: 0,
            maxWidth: 560,
            lineHeight: 1.5,
          }}
        >
          Chaque vérification est sourcée directement depuis des données publiques
          vérifiables (HATVP, INSEE, Cour des comptes, Assemblée nationale).
        </p>
      </div>

      {/* ── Category filter chips ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 40,
        }}
      >
        <Link
          href="/v"
          className="obs-mono"
          style={{
            padding: "6px 14px",
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.14em",
            border: "1px solid var(--line)",
            color: !cat ? "var(--color-fg)" : "var(--color-fg-dim)",
            background: !cat ? "var(--color-ink-2)" : "transparent",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
        >
          Tous
        </Link>
        {ALL_CATEGORIES.map((c) => {
          const active = cat?.toUpperCase() === c;
          return (
            <Link
              key={c}
              href={`/v?cat=${c.toLowerCase()}`}
              className="obs-mono"
              style={{
                padding: "6px 14px",
                fontSize: "var(--fs-mono-xs)",
                letterSpacing: "0.14em",
                border: `1px solid ${active ? CATEGORY_COLOR[c] : "var(--line)"}`,
                color: active ? CATEGORY_COLOR[c] : "var(--color-fg-dim)",
                background: active ? "var(--color-ink-2)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              {CATEGORY_LABEL[c]}
            </Link>
          );
        })}
      </div>

      {/* ── Draft count ── */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--color-fg-dim)", fontSize: 14 }}>
          Aucune vérification dans cette catégorie pour l&apos;instant.
        </p>
      ) : (
        <>
          <p
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-dim)",
              letterSpacing: "0.14em",
              marginBottom: 24,
            }}
          >
            {filtered.length} vérification{filtered.length > 1 ? "s" : ""}
          </p>

          {/* ── Draft cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {filtered.map((draft) => {
              const accent = CATEGORY_COLOR[draft.category] ?? "var(--color-signal)";
              const catLabel = CATEGORY_LABEL[draft.category] ?? draft.category;
              return (
                <article
                  key={draft.slug}
                  style={{
                    background: "var(--color-ink-1)",
                    border: "1px solid var(--line)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  {/* Accent top bar */}
                  <div style={{ height: 2, background: accent }} />

                  <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Eyebrow */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: "var(--fs-mono-xs)",
                          letterSpacing: "0.14em",
                          color: accent,
                        }}
                      >
                        FACT CHECK · {catLabel.toUpperCase()}
                      </span>
                      {draft.publishedAt && (
                        <span
                          className="obs-mono"
                          style={{
                            fontSize: "var(--fs-mono-xs)",
                            letterSpacing: "0.1em",
                            color: "var(--color-fg-dim)",
                          }}
                        >
                          {draft.publishedAt}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link href={`/v/${draft.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <h2
                        className="hd"
                        style={{
                          fontSize: 22,
                          lineHeight: 1.2,
                          margin: 0,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {draft.framingTitle}
                      </h2>
                    </Link>

                    {/* Format badge */}
                    <div style={{ marginTop: "auto", paddingTop: 12 }}>
                      <span
                        className="obs-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.12em",
                          color: "var(--color-fg-faint)",
                          border: "1px solid var(--line-2)",
                          padding: "3px 8px",
                        }}
                      >
                        {draft.format === "Contrast" ? "Comparaison" : "Promesse"}
                      </span>
                    </div>
                  </div>

                  {/* Footer link */}
                  <Link
                    href={`/v/${draft.slug}`}
                    className="obs-mono"
                    style={{
                      display: "block",
                      padding: "10px 24px",
                      borderTop: "1px solid var(--line-2)",
                      fontSize: "var(--fs-mono-xs)",
                      letterSpacing: "0.14em",
                      color: "var(--color-fg-mute)",
                      textDecoration: "none",
                      background: "var(--color-ink-0)",
                    }}
                  >
                    Lire la vérification →
                  </Link>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
