import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ClassificationBar } from "@/components/investigative/classification-bar";
import { Eyebrow } from "@/components/investigative/eyebrow";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "À propos — L’Observatoire Citoyen",
  description:
    "Équipe, financement, indépendance éditoriale et modalités de citation de L’Observatoire Citoyen, plateforme indépendante d’intelligence civique.",
};

const SECTIONS = [
  {
    id: "mission",
    kicker: "Section 1",
    title: "Mission",
    body: "L’Observatoire est une plateforme indépendante d’intelligence civique. Elle surveille les institutions démocratiques françaises en croisant des sources de données publiques vérifiables : HATVP, registre AGORA, Assemblée nationale, Sénat, INSEE, DREES, CNCCFP, data.gouv.fr. L’objectif est unique : montrer la transparence par les données, sans commentaire politique, sans prise de parti, sans favoriser un candidat ou une formation.",
  },
  {
    id: "origine",
    kicker: "Section 2",
    title: "Origine",
    body: "Le projet a démarré en 2025 comme un outil personnel de recoupement de données publiques. Face à la difficulté d’accéder à l’information de manière lisible et consolidée, il a évolué en plateforme publique. Il n’est affilié à aucun organe de presse, aucun parti politique, aucun groupe d’intérêt, aucune fondation.",
  },
  {
    id: "financement",
    kicker: "Section 3",
    title: "Financement",
    body: "À ce jour, le projet est autofinancé (hébergement, ingestion de données, développement). Un financement participatif est en préparation — Tipeee et HelloAsso loi-1901 — pour couvrir les coûts d’infrastructure à mesure que l’audience croît. Aucun annonceur, aucun contrat publicitaire, aucune aide publique à ce stade. La liste des sources de financement sera mise à jour sur cette page dès qu’un premier financement externe sera actif.",
  },
  {
    id: "conflits",
    kicker: "Section 4",
    title: "Conflits d’intérêts",
    body: "L’équipe déclare n’avoir aucune participation financière dans les organisations citées, aucun lien contractuel avec un groupe de pression, aucune affiliation partisane, aucun avantage en nature provenant d’une personnalité publique couverte. Si un tel lien devait apparaître, il serait divulgué ici avant toute publication concernée.",
  },
  {
    id: "independance",
    kicker: "Section 5",
    title: "Indépendance éditoriale",
    body: "L’Observatoire ne soutient aucun parti, ne recommande aucun candidat et n’accepte aucun accès préférentiel en échange de couverture favorable. Les signaux sont calculés de manière déterministe à partir des données publiques — les règles de détection sont publiées dans la section Méthodologie. Toute correction factuelle signalée est traitée selon la politique de correction documentée ci-dessous.",
  },
  {
    id: "equipe",
    kicker: "Section 6",
    title: "Équipe et contact",
    body: "Équipe indépendante de bénévoles civiques. Pour toute question, signalement d’erreur ou demande de droit de réponse : contact@lobservatoire.fr (réponse sous 5 jours ouvrés). Pour signaler une erreur factuelle directement depuis une page, utilisez le formulaire dédié.",
  },
  {
    id: "lanceurs-alerte",
    kicker: "Section 7",
    title: "Lanceurs d’alerte",
    body: "Si vous disposez d’informations d’intérêt public sur une personnalité ou une institution couverte par L’Observatoire, vous pouvez nous les transmettre via le formulaire de signalement. Toute information reçue est traitée de manière confidentielle. L’Observatoire ne publie jamais d’informations personnelles non vérifiées ni de pièces volées.",
  },
  {
    id: "citation",
    kicker: "Section 8",
    title: "Citer cette source",
    body: "Pour référencer L'Observatoire Citoyen dans un article, une étude ou un rapport : titre complet « L'Observatoire Citoyen — Bureau des données publiques », URL canonique (https://lobservatoire.fr), date de consultation. Format BibTeX disponible en pied de page. Les données sources restent sous la licence ouverte de leur émetteur original (HATVP, data.gouv.fr, INSEE).",
  },
];

export default async function AProposPage() {
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
          <Eyebrow tone="red">Transparence</Eyebrow>
        </div>
        <h1
          className="hd"
          style={{
            fontSize: "clamp(32px, 3.5vw, 52px)",
            lineHeight: 1.04,
            letterSpacing: "-0.018em",
            margin: 0,
            maxWidth: 920,
          }}
        >
          À propos
        </h1>
        <p
          className="obs-serif"
          style={{
            marginTop: 14,
            maxWidth: 720,
            fontSize: 16,
            lineHeight: 1.55,
            color: "var(--color-fg-mute)",
          }}
        >
          Mission, financement, indépendance éditoriale et modalités de
          citation. Ce document est mis à jour à chaque changement significatif
          dans la structure ou le financement du projet.
        </p>
      </header>

      <section
        style={{
          padding: "32px 40px 48px",
          display: "grid",
          gap: 32,
          maxWidth: 920,
        }}
      >
        {SECTIONS.map((s) => (
          <article
            key={s.id}
            id={s.id}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <Eyebrow>{s.kicker}</Eyebrow>
            <h2
              className="hd"
              style={{
                fontSize: 26,
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {s.title}
            </h2>
            <p
              className="obs-serif"
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--color-fg-mute)",
                margin: 0,
                maxWidth: 680,
              }}
            >
              {s.body}
            </p>
            {s.id === "equipe" && (
              <div style={{ marginTop: 4 }}>
                <a
                  href="/signaler-une-erreur"
                  style={{
                    fontSize: 13,
                    color: "var(--color-signal)",
                    textDecoration: "none",
                  }}
                >
                  Formulaire de signalement d’erreur →
                </a>
              </div>
            )}
            {s.id === "independance" && (
              <div style={{ marginTop: 4 }}>
                <a
                  href="/methodologie"
                  style={{
                    fontSize: 13,
                    color: "var(--color-signal)",
                    textDecoration: "none",
                  }}
                >
                  Consulter la méthodologie →
                </a>
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
