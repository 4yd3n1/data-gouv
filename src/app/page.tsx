import { getHomepageData } from "@/lib/homepage-data";
import { Dateline } from "@/components/investigative/dateline";
import { HeroLead } from "@/components/investigative/hero-lead";
import { HeroVisualisation } from "@/components/investigative/hero-visualisation";
import {
  SecondaryArticle,
  type SecondaryArticleData,
} from "@/components/investigative/secondary-article";
import { SignalsRail } from "@/components/investigative/signals-rail";
import { InteractiveStrip } from "@/components/investigative/interactive-strip";
import {
  MethodologyNotes,
  type MethodologyNote,
} from "@/components/investigative/methodology-notes";

export const revalidate = 3600;

const LEAD = {
  href: "/dossiers/bilan-macron",
  kicker: "Enquête principale",
  dateLabel: "Avril 2026",
  headline: (
    <>
      Bilan Macron : deux mandats,
      <br />
      neuf ans de données,
      <br />
      <em>ce que les chiffres révèlent.</em>
    </>
  ),
  dek: (
    <>
      Analyse chiffrée de la présidence Macron (2017–2026) sur sept dimensions —
      économie, santé, droits, environnement, élites, cohésion sociale, climat
      politique. Plus de 900 000 personnes supplémentaires sous le seuil de
      pauvreté
      <sup className="obs-footnote">[1]</sup> pendant que le patrimoine des
      milliardaires doublait<sup className="obs-footnote">[2]</sup>.
    </>
  ),
  sources: ["INSEE", "Eurostat", "DREES", "Oxfam", "CEVIPOF"] as const,
};

const SECONDARY: readonly SecondaryArticleData[] = [
  {
    href: "/dossiers/medias",
    eyebrow: "Enquête · Concentration",
    dateLabel: "Avril 2026",
    title: "Neuf milliardaires, 80 % du paysage médiatique",
    dek: "Cartographie des dix principaux groupes de médias privés, de leurs filiales et de leurs liens politiques. Données ARCOM croisées avec HATVP et AGORA.",
    sources: ["ARCOM", "HATVP", "AGORA"],
    spark: [3, 4, 3, 5, 7, 6, 8, 9, 10, 12, 14, 16],
  },
  {
    href: "/dossiers/financement-politique",
    eyebrow: "Investigation · Financement",
    dateLabel: "Mars 2026",
    title: "66 M€ d'aide publique aux partis, qui en bénéficie ?",
    dek: "Suivi du financement des partis — aide publique, performance électorale, évolution depuis 2021. Décryptage des dépenses de campagne des législatives 2024.",
    sources: ["CNCCFP", "Min. Intérieur"],
    spark: [2, 3, 2, 4, 3, 4, 3, 5, 4, 6, 5, 7],
  },
  {
    href: "/territoire",
    eyebrow: "Territoires · Fractures",
    dateLabel: "Février 2026",
    title: "Carte des 101 départements, cinq indicateurs de fracture",
    dek: "Revenus, emploi, densité médicale, logement, pauvreté. Choropleth interactif sur les données INSEE 2022-2024 croisées.",
    sources: ["INSEE", "DREES", "OFGL"],
    spark: [8, 7, 9, 6, 7, 5, 6, 4, 5, 3, 4, 3],
  },
];

const METHODOLOGY_NOTES: readonly MethodologyNote[] = [
  {
    n: 1,
    body: "Seuil à 60 % du revenu médian. 8,9 M (2017) → 9,8 M (2023).",
    source: "INSEE, enquête revenus fiscaux et sociaux (ERFS), 2017-2023",
    href: "/methodologie",
  },
  {
    n: 2,
    body: "Patrimoine cumulé des milliardaires français : 571 Md€ (2017) → 1 228 Md€ (2024).",
    source: "Classement Challenges / Forbes, croisé avec Oxfam « Inégalités extrêmes », 2024",
    href: "/methodologie",
  },
];

export default async function HomePage() {
  const data = await getHomepageData();

  const { declarations, representants, firstYear, lastYear, topReps } =
    data.presidencyLobby;
  const presidencyDek = (() => {
    const parts = topReps
      .slice(0, 4)
      .map((r) => `${r.nom.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} (${r.declarations})`);
    return `Une déclaration = un (domaine × exercice × type d'action) rempli par un représentant enregistré HATVP — pas une rencontre. Principaux : ${parts.join(", ")}.`;
  })();

  return (
    <>
      <Dateline revisionIso={data.revisionIso} />

      {/* Hero */}
      <section
        className="hero-grid"
        style={{
          display: "grid",
          gap: 40,
          padding: "36px 40px 28px",
          gridTemplateColumns: "1fr",
        }}
      >
        <HeroLead
          href={LEAD.href}
          kicker={LEAD.kicker}
          dateLabel={LEAD.dateLabel}
          headline={LEAD.headline}
          dek={LEAD.dek}
          sources={LEAD.sources}
        />
        <HeroVisualisation
          data={data.mapData}
          indicator="pov"
          caption="Pauvreté monétaire par département, 2024"
          source="INSEE 2024"
        />
      </section>

      {/* Secondary trio + rail */}
      <section
        className="secondary-grid"
        style={{
          padding: "0 40px 28px",
          display: "grid",
          gap: 28,
          gridTemplateColumns: "1fr",
        }}
      >
        {SECONDARY.map((a) => (
          <SecondaryArticle key={a.href} article={a} />
        ))}
        <div className="secondary-rail">
          <SignalsRail
            signals={data.signals}
            total={data.summary.total}
            critique={data.summary.critique}
            maxItems={5}
            compact={false}
          />
        </div>
      </section>

      {/* Interactive strip — real AGORA counts for Présidence (representants + declarations) */}
      <section style={{ padding: "0 40px 32px" }}>
        <InteractiveStrip
          href="/signaux?type=lobby"
          kicker="Analyse interactive · Présidence de la République"
          headline={
            <>
              <em>{declarations.toLocaleString("fr-FR")} déclarations</em> au
              registre AGORA par{" "}
              <em>{representants.toLocaleString("fr-FR")} représentants</em>{" "}
              d&apos;intérêts ({firstYear}–{lastYear})
            </>
          }
          dek={presidencyDek}
          cta="Ouvrir le dashboard →"
        />
      </section>

      {/* Methodology footnotes */}
      <section style={{ padding: "0 40px 36px" }}>
        <MethodologyNotes notes={METHODOLOGY_NOTES} />
      </section>
    </>
  );
}
