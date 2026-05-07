import type { Metadata } from "next";
import { getSouveraineteOverview } from "@/lib/souverainete-data";
import { DossierNav } from "@/components/dossier-nav";
import { SouveraineteHero } from "@/components/souverainete/souverainete-hero";
import {
  CategoryBreakdown,
  CountryBreakdown,
  SectorBreakdown,
  MesureBreakdown,
} from "@/components/souverainete/souverainete-breakdowns";
import { SouveraineteTable } from "@/components/souverainete/souverainete-table";
import { SouveraineteTimeline } from "@/components/souverainete/souverainete-timeline";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Souveraineté économique — fleurons français cédés à l'étranger",
  description:
    "Cas documentés d'acquisitions étrangères, vétos IEF, sauvetages et rachats étatiques de fleurons industriels français, 2014-2026. Sources : Bercy, Légifrance, presse économique.",
};

export default async function SouverainetePage() {
  const data = await getSouveraineteOverview();

  return (
    <>
      <SouveraineteHero stats={data.stats} />
      <DossierNav currentSlug="souverainete" />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <CategoryBreakdown data={data.byCategory} total={data.stats.totalPhases} />
        <CountryBreakdown data={data.byCountry} />
        <SectorBreakdown data={data.bySector} />
        <MesureBreakdown data={data.byMesure} />
        <SouveraineteTimeline data={data.byYear} />
        <SouveraineteTable rows={data.rows} />

        <footer
          style={{
            borderTop: "1px solid var(--color-ink-2)",
            paddingTop: 24,
            marginTop: 32,
          }}
        >
          <h3
            className="obs-mono"
            style={{
              fontSize: "var(--fs-mono-xs)",
              letterSpacing: "0.15em",
              color: "var(--color-fg-mute)",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Méthodologie & sources
          </h3>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--color-fg-mute)",
              maxWidth: "72ch",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              Corpus initial de {data.stats.totalCas} dossiers (
              {data.stats.totalPhases} phases) hand-curated et sourcés au cas
              par cas — pas d'agrégat automatique. Chaque ligne porte une
              source primaire (presse économique française : Le Monde, Les
              Échos, La Tribune, L'Usine Nouvelle, AFP ; communiqués
              officiels : Bercy, Légifrance, sociétés cotées) et une date de
              publication.
            </p>
            <p style={{ margin: "0 0 8px 0" }}>
              Les décisions IEF (R.151-3 CMF) sont confidentielles par défaut
              en France. La colonne « mesure publique » mesure ce qui a été
              rendu public — pas l'existence d'une instruction. Le rapport
              parlementaire Marleix (avril 2018) reste le document de référence
              sur les manquements de l'État dans la cession Alstom-GE de
              2014-2015.
            </p>
            <p style={{ margin: 0 }}>
              Les phases enfants (Photonis-HLD post-veto Teledyne, EDF-Arabelle
              post Alstom-GE, recapitalisation Eutelsat 2025, Bull-État 2026)
              sont indentées sous leur dossier parent. Limites : la liste
              n'est pas exhaustive ; cas non encore intégrés (Areva-Orano,
              Withings-Nokia, Sequans, GrandVision) à venir.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
