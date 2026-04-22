import { prisma } from "@/lib/db";
import { ClassificationBar } from "@/components/investigative/classification-bar";
import { Eyebrow } from "@/components/investigative/eyebrow";

export const revalidate = 3600;

const SECTIONS = [
  {
    kicker: "Section 1",
    title: "Sources de données",
    body: "HATVP (déclarations d'intérêts et de patrimoine), AGORA (actions de lobbying déclarées), Assemblée Nationale (scrutins et interventions), Sénat (mandats), data.gouv.fr (listes départementales, budgets locaux), INSEE (macro-indicateurs, cartes socio-économiques), DREES (santé), CNCCFP (comptes de campagne). Chaque source est horodatée dans le strip en pied de page d'accueil.",
  },
  {
    kicker: "Section 2",
    title: "Définition des signaux",
    body: "Six types détectés par requêtes croisées : conflits d'intérêts (carrière privée vs portefeuille ministériel), portes tournantes (transitions public-privé < 3 ans), lobbying (concentration AGORA par ministère cible), médias (proximité propriétaires-exécutif), écarts HATVP (retards de dépôt), dissidences (votes contre ligne de groupe). Seuils recalibrés session 41.",
  },
  {
    kicker: "Section 3",
    title: "Mise à jour des données",
    body: "HATVP : cache local XML re-téléchargé hebdomadairement ; AGORA : import complet JSON ; Assemblée : derniers scrutins récupérés quotidiennement. Les timestamps réels de chaque ingestion apparaissent sur la bande « IngestionLog » en pied de page d'accueil.",
  },
  {
    kicker: "Section 4",
    title: "Politique de correction",
    body: "Toute erreur factuelle signalée est corrigée avec mention datée dans le fil Git public. Les déclarations ne sont jamais réécrites : les corrections apparaissent en erratum. Contact à venir.",
  },
  {
    kicker: "Section 5",
    title: "Charte éditoriale",
    body: "Ne pas présumer de la culpabilité à partir d'une mise en examen. Citer la source primaire et la date pour chaque fait judiciaire. Ne jamais synthétiser sans citation explicite. Langage mesuré : « Lobbying déclaré ciblant ce ministère » (pas « influences du lobby sur ce ministre »).",
  },
];

export default async function MethodologiePage() {
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
          <Eyebrow tone="red">Documentation</Eyebrow>
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
          Méthodologie
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
          Sources, définitions, cadence de rafraîchissement et charte
          éditoriale. Pages détaillées à venir — ce document liste les règles
          appliquées aujourd&apos;hui.
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
          <article key={s.title} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
            <div style={{ marginTop: 4 }}>
              <span
                className="sig-tag sig-tag--neutral"
                title="Page dédiée à venir"
              >
                Page dédiée — À venir
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
