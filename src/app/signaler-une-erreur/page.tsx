import type { Metadata } from "next";
import { ClassificationBar } from "@/components/investigative/classification-bar";
import { Eyebrow } from "@/components/investigative/eyebrow";
import { prisma } from "@/lib/db";
import { submitErrorReport } from "./actions";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Signaler une erreur — L’Observatoire Citoyen",
  description:
    "Signalez une erreur factuelle, une source manquante, une coquille ou une demande de droit de réponse sur L’Observatoire Citoyen.",
};

export default async function SignalerErreurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { from = "", erreur } = await searchParams;

  const latest = await prisma.ingestionLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const revisionIso = (latest?.createdAt ?? new Date()).toISOString();

  return (
    <>
      <ClassificationBar revisionIso={revisionIso} />

      <header
        style={{
          padding: "36px 40px 28px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <Eyebrow tone="red">Correction</Eyebrow>
        </div>
        <h1
          className="hd"
          style={{
            fontSize: "clamp(28px, 3vw, 44px)",
            lineHeight: 1.04,
            letterSpacing: "-0.018em",
            margin: 0,
            maxWidth: 720,
          }}
        >
          Signaler une erreur
        </h1>
        <p
          className="obs-serif"
          style={{
            marginTop: 14,
            maxWidth: 600,
            fontSize: 15,
            lineHeight: 1.55,
            color: "var(--color-fg-mute)",
          }}
        >
          Erreur factuelle, source manquante, coquille ou demande de droit de
          réponse — ce formulaire transmet votre signalement directement à
          l&apos;équipe. Toute correction est documentée dans le fil Git public.
        </p>
      </header>

      <section
        style={{
          padding: "32px 40px 64px",
          maxWidth: 680,
        }}
      >
        {erreur === "description" && (
          <div
            style={{
              marginBottom: 24,
              padding: "12px 16px",
              border: "1px solid var(--color-signal)",
              borderRadius: 4,
              fontSize: 14,
              color: "var(--color-signal)",
            }}
          >
            La description doit comporter au moins 10 caractères.
          </div>
        )}

        <form action={submitErrorReport} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Page URL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="url"
              className="obs-mono"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-fg-dim)" }}
            >
              PAGE CONCERNÉE
            </label>
            <input
              id="url"
              name="url"
              type="url"
              defaultValue={from}
              placeholder="https://lobservatoire.fr/profils/..."
              style={{
                background: "var(--color-ink-0)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-fg)",
                fontFamily: "var(--font-body)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Error type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="type"
              className="obs-mono"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-fg-dim)" }}
            >
              TYPE D’ERREUR <span style={{ color: "var(--color-signal)" }}>*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue="FACTUEL"
              style={{
                background: "var(--color-ink-0)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-fg)",
                fontFamily: "var(--font-body)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="FACTUEL">Erreur factuelle</option>
              <option value="SOURCE">Source manquante ou incorrecte</option>
              <option value="TYPO">Coquille / typographie</option>
              <option value="AUTRE">Autre (droit de réponse, question…)</option>
            </select>
          </div>

          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="description"
              className="obs-mono"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-fg-dim)" }}
            >
              DESCRIPTION <span style={{ color: "var(--color-signal)" }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              rows={5}
              placeholder="Décrivez l’erreur avec précision. Indiquez la donnée incorrecte et, si possible, la correction attendue avec sa source."
              style={{
                background: "var(--color-ink-0)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-fg)",
                fontFamily: "var(--font-body)",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                lineHeight: 1.55,
              }}
            />
          </div>

          {/* Contact (optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="contact"
              className="obs-mono"
              style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--color-fg-dim)" }}
            >
              COORDONNÉES (FACULTATIF)
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              placeholder="E-mail ou autre — pour vous répondre si nécessaire"
              style={{
                background: "var(--color-ink-0)",
                border: "1px solid var(--line)",
                borderRadius: 4,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-fg)",
                fontFamily: "var(--font-body)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              alignSelf: "flex-start",
              background: "transparent",
              border: "1px solid var(--color-signal)",
              borderRadius: 4,
              padding: "10px 24px",
              fontSize: 13,
              color: "var(--color-signal)",
              cursor: "pointer",
              letterSpacing: "0.06em",
              fontFamily: "var(--font-body)",
            }}
          >
            Envoyer le signalement
          </button>
        </form>

        <p
          className="obs-serif"
          style={{
            marginTop: 32,
            fontSize: 13,
            color: "var(--color-fg-dim)",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          Les signalements sont examinés par l&apos;équipe sous 5 jours ouvrés.
          Toute correction publiée est documentée en erratum daté. Voir la{" "}
          <a
            href="/methodologie#correction"
            style={{ color: "var(--color-fg-mute)", textDecoration: "underline" }}
          >
            politique de correction
          </a>
          .
        </p>
      </section>
    </>
  );
}
