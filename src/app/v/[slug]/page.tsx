// LCP triage 2026-05-02: LCP element is the hero <h1> with `framingTitle` (clamp 28–48px, Source Serif 4).
// Root cause of 4.4s vs 3.6s on other routes: getDraft() falls through to step 3 (O(n) full-scan
// + per-file Zod validation) when the slug "lecornu-5pm" doesn't match the exact filename
// "FactCheck-Lecornu5PM.json" via filename-derived slug derivation. React.cache prevents repeated
// parse on subsequent requests, but cold-start hits step 3 for slugs that don't canonicalize cleanly.
// TODO: pre-build a slug→filename index at build time (or store slug in the file and index it in a
// single pass) so getDraft always resolves in O(1) without Zod-validating every file.
// Quick wins shipped: none (rewrite of getDraft is out-of-scope for this polish pass; needs
// integration test coverage first). Font loading is handled by next/font/google (no CDN round-trip).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getDraft,
  isContrastDraft,
  isPromiseDraft,
  getDraftTitle,
  getDraftSubtitle,
} from "@/lib/factcheck-manifest";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { SrcChip } from "@/components/investigative/src-chip";
import { subscribeNewsletter } from "./newsletter-action";

export const revalidate = 3600;

// ──────────────────────────────────────────────────────────────────────────────
// Category → accent colour mapping (mirrors Remotion design-tokens)
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// generateMetadata
// ──────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const draft = await getDraft(slug);
  if (!draft) return { title: "Vérification introuvable" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const draftTitle = getDraftTitle(draft);
  const draftSubtitle = getDraftSubtitle(draft);
  const title = `${draftTitle} | Fact check L'Observatoire`;
  const description = draftSubtitle ?? draft.tldr;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/v/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/v/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

export default async function FactCheckPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const { newsletter } = await searchParams;
  const draft = await getDraft(slug);
  if (!draft) notFound();

  const accentColor =
    CATEGORY_COLOR[draft.branding.category] ?? "var(--color-signal)";
  const categoryLabel =
    CATEGORY_LABEL[draft.branding.category] ?? draft.branding.category;

  const draftTitle = getDraftTitle(draft);
  const draftSubtitle = getDraftSubtitle(draft);

  const publishedAt: string | undefined =
    draft._meta?.publishedAt ??
    (typeof (draft as Record<string, unknown>).publishedAt === "string"
      ? String((draft as Record<string, unknown>).publishedAt)
      : undefined) ??
    draft._meta?.draftedAt ??
    undefined;

  const publishedLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const personnaliteSlug =
    "personnaliteSlug" in draft ? draft.personnaliteSlug : undefined;

  // Bind slug into server action
  const subscribe = subscribeNewsletter.bind(null, slug);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* ── Top accent bar ── */}
      <div
        style={{ height: 2, background: accentColor, marginBottom: 32 }}
      />

      {/* ── Eyebrow + dateline ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Eyebrow tone="red">Fact check · {categoryLabel}</Eyebrow>
        {publishedLabel && (
          <span
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-dim)",
              letterSpacing: "0.14em",
            }}
          >
            {publishedLabel}
          </span>
        )}
      </div>

      {/* ── Hero headline ── */}
      <h1
        className="hd"
        style={{
          fontSize: "clamp(28px, 4vw, 48px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          margin: "0 0 16px",
        }}
      >
        {draftTitle}
      </h1>

      {/* ── Hero subtitle ── */}
      {draftSubtitle && (
        <p
          className="obs-serif"
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: "var(--color-fg-mute)",
            margin: "0 0 36px",
            maxWidth: 680,
          }}
        >
          {draftSubtitle}
        </p>
      )}

      {/* ── Verdict block ── */}
      <div
        className="severity-notable"
        style={{
          borderLeft: `3px solid ${accentColor}`,
          padding: "16px 20px",
          marginBottom: 40,
          background: "var(--color-ink-2)",
        }}
      >
        <p
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.18em",
            color: "var(--color-fg-dim)",
            margin: "0 0 6px",
          }}
        >
          {draft.verdictLabel}
        </p>
        <p
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: accentColor,
            margin: 0,
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {draft.verdictValue}
        </p>
      </div>

      {/* ── Contrast: two-side comparison block ── */}
      {isContrastDraft(draft) && (
        <section style={{ marginBottom: 48 }}>
          <h2
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.14em",
              color: "var(--color-fg-dim)",
              marginBottom: 20,
            }}
          >
            COMPARAISON
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {[
              { side: draft.sideA, role: "A" },
              { side: draft.sideB, role: "B" },
            ].map(({ side, role }) => (
              <div
                key={role}
                style={{
                  background: "var(--color-ink-1)",
                  border: "1px solid var(--line)",
                  padding: "20px 24px",
                }}
              >
                <p
                  className="obs-mono"
                  style={{
                    fontSize: "var(--fs-mono-xs)",
                    letterSpacing: "0.14em",
                    color: "var(--color-fg-dim)",
                    margin: "0 0 8px",
                  }}
                >
                  {side.label}
                </p>
                <p
                  className="obs-mono"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: "var(--color-fg-faint)",
                    margin: "0 0 12px",
                  }}
                >
                  {side.period}
                </p>
                <p
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: role === "B" ? accentColor : "var(--color-fg)",
                    margin: "0 0 4px",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {side.value}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--color-fg-mute)",
                    margin: "0 0 12px",
                    lineHeight: 1.4,
                  }}
                >
                  {side.unit}
                </p>
                <SrcChip items={[side.source]} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Promise: quote block ── */}
      {isPromiseDraft(draft) && (
        <section style={{ marginBottom: 48 }}>
          <h2
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.14em",
              color: "var(--color-fg-dim)",
              marginBottom: 20,
            }}
          >
            LA PROMESSE
          </h2>
          <blockquote
            style={{
              borderLeft: `3px solid var(--line-2)`,
              padding: "16px 24px",
              margin: "0 0 20px",
              background: "var(--color-ink-1)",
            }}
          >
            <p
              className="obs-serif italic"
              style={{
                fontSize: 20,
                lineHeight: 1.55,
                color: "var(--color-fg)",
                margin: "0 0 16px",
              }}
            >
              &laquo;&nbsp;{draft.promise.pullQuote ?? draft.promise.quote}&nbsp;&raquo;
            </p>
            {draft.promise.pullQuote && draft.promise.quote !== draft.promise.pullQuote && (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-fg-dim)",
                  margin: "0 0 12px",
                  lineHeight: 1.5,
                }}
              >
                Citation complète&nbsp;: &laquo;&nbsp;{draft.promise.quote}&nbsp;&raquo;
              </p>
            )}
            <p
              className="obs-mono"
              style={{
                fontSize: "var(--fs-mono-xs)",
                letterSpacing: "0.1em",
                color: "var(--color-fg-dim)",
                margin: 0,
              }}
            >
              — {draft.promise.attribution} · {draft.promise.date} ·{" "}
              {draft.promise.location}
            </p>
          </blockquote>
          {draft.promise.promiseSource && (
            <SrcChip items={[draft.promise.promiseSource]} />
          )}

          {/* Reality data points */}
          {draft.realities.length > 0 && (
            <>
              <h2
                className="obs-mono"
                style={{
                  fontSize: "var(--fs-mono-xs)",
                  letterSpacing: "0.14em",
                  color: "var(--color-fg-dim)",
                  margin: "32px 0 16px",
                }}
              >
                EN RÉALITÉ
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {draft.realities.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--color-ink-1)",
                      border: "1px solid var(--line)",
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-fg-mute)",
                        margin: 0,
                      }}
                    >
                      {r.label}
                    </p>
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: accentColor,
                        margin: 0,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {r.value}
                    </p>
                    <SrcChip
                      items={[
                        r.sourceKind === "press" ? `Presse — ${r.source}` : r.source,
                      ]}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* ── Additional context ── */}
      {isContrastDraft(draft) && draft.additionalContext.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.14em",
              color: "var(--color-fg-dim)",
              marginBottom: 16,
            }}
          >
            CONTEXTE ADDITIONNEL
          </h2>
          <dl
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              margin: 0,
            }}
          >
            {draft.additionalContext.map((ctx, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-ink-1)",
                  border: "1px solid var(--line)",
                  padding: "14px 18px",
                }}
              >
                <dt
                  style={{
                    fontSize: 12,
                    color: "var(--color-fg-dim)",
                    marginBottom: 4,
                    letterSpacing: "0.04em",
                  }}
                >
                  {ctx.label}
                </dt>
                <dd
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--color-fg)",
                    margin: "0 0 8px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ctx.value}
                  <div style={{ marginTop: 8 }}>
                    <SrcChip
                      items={[
                        ctx.sourceKind === "press"
                          ? `Presse — ${ctx.source}`
                          : ctx.source,
                      ]}
                    />
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ── TLDR ── */}
      <section
        style={{
          borderTop: "1px solid var(--line-2)",
          paddingTop: 32,
          marginBottom: 48,
        }}
      >
        <p
          className="obs-serif italic"
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: "var(--color-fg-mute)",
            margin: 0,
          }}
        >
          {draft.tldr}
        </p>
      </section>

      {/* ── Sources expansées ── */}
      <section style={{ marginBottom: 56 }}>
        <h2
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            letterSpacing: "0.14em",
            color: "var(--color-fg-dim)",
            marginBottom: 16,
          }}
        >
          SOURCES
        </h2>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {collectAllSources(draft).map((src, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: "var(--color-fg-mute)",
                lineHeight: 1.5,
                paddingLeft: 12,
                borderLeft: "2px solid var(--line-2)",
              }}
            >
              {src}
            </li>
          ))}
        </ul>
        {draft._meta?.sourceCorpus && draft._meta.sourceCorpus.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <SrcChip items={draft._meta.sourceCorpus} />
          </div>
        )}
      </section>

      {/* ── CTAs ── */}
      <section
        style={{
          borderTop: "1px solid var(--line)",
          paddingTop: 32,
          marginBottom: 48,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* CTA 1: Voir le profil complet — only if personnaliteSlug present */}
        {personnaliteSlug && (
          <div>
            <Link
              href={`/profils/${personnaliteSlug}`}
              className="obs-mono"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                border: "1px solid var(--color-signal)",
                color: "var(--color-signal)",
                textDecoration: "none",
                fontSize: "var(--fs-mono-xs)",
                letterSpacing: "0.14em",
                transition: "background 0.15s",
              }}
            >
              Voir le profil complet →
            </Link>
          </div>
        )}

        {/* CTA 2: Embed stub */}
        <div>
          <button
            disabled
            title="Intégrer ce fact-check (à venir)"
            className="obs-mono"
            style={{
              padding: "10px 18px",
              border: "1px solid var(--line)",
              color: "var(--color-fg-dim)",
              background: "transparent",
              cursor: "not-allowed",
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.14em",
            }}
          >
            Intégrer ce fact-check (à venir)
          </button>
        </div>

        {/* CTA 3: Newsletter */}
        <div
          style={{
            background: "var(--color-ink-1)",
            border: "1px solid var(--line)",
            padding: "24px",
            maxWidth: 480,
          }}
        >
          <p
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.14em",
              color: "var(--color-fg-dim)",
              margin: "0 0 8px",
            }}
          >
            HEBDOMADAIRE
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-fg-mute)",
              margin: "0 0 16px",
              lineHeight: 1.5,
            }}
          >
            Recevez les prochaines vérifications dans votre boîte mail.
          </p>

          {newsletter === "ok" && (
            <p
              style={{
                fontSize: 13,
                color: "#2dd4bf",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              Inscription enregistrée — vous recevrez l&apos;hebdo dès qu&apos;il sera prêt.
            </p>
          )}

          <form action={subscribe} style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              name="email"
              required
              placeholder="votre@email.fr"
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "var(--color-ink-0)",
                border: "1px solid var(--line)",
                color: "var(--color-fg)",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="obs-mono"
              style={{
                padding: "8px 16px",
                background: "var(--color-signal)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--fs-mono-xs)",
                letterSpacing: "0.14em",
                whiteSpace: "nowrap",
              }}
            >
              S&apos;inscrire
            </button>
          </form>
        </div>
      </section>

      {/* ── À propos de cette vérification ── */}
      <footer
        style={{
          borderTop: "1px solid var(--line-2)",
          paddingTop: 24,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span
          className="obs-mono"
          style={{
            fontSize: "var(--fs-mono-xs)",
            color: "var(--color-fg-dim)",
            letterSpacing: "0.1em",
          }}
        >
          À propos de cette vérification :
        </span>
        {[
          { label: "Méthodologie", href: "/methodologie" },
          { label: "À propos", href: "/apropos" },
          { label: "Signaler une erreur", href: "/signaler-une-erreur" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              color: "var(--color-fg-mute)",
              letterSpacing: "0.1em",
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </footer>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: collect all source strings from a draft
// ──────────────────────────────────────────────────────────────────────────────

function collectAllSources(draft: Awaited<ReturnType<typeof getDraft>>): string[] {
  if (!draft) return [];
  const sources: string[] = [];

  if (isContrastDraft(draft)) {
    sources.push(draft.sideA.source, draft.sideB.source);
    for (const ctx of draft.additionalContext) {
      sources.push(ctx.source);
    }
  } else if (isPromiseDraft(draft)) {
    sources.push(draft.promise.promiseSource);
    if (draft.promise.sourceNote) sources.push(draft.promise.sourceNote);
    for (const r of draft.realities) {
      sources.push(r.source);
    }
  }

  // Deduplicate while preserving order
  return [...new Set(sources.filter(Boolean))];
}
