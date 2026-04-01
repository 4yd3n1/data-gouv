import { notFound } from "next/navigation";
import { getDossier } from "@/lib/dossier-config";
import { DossierNav } from "@/components/dossier-nav";
import { BilanHeroSection } from "@/components/bilan/bilan-hero-section";
import { BilanEconomieSection } from "@/components/bilan/bilan-economie-section";
import { BilanSanteSection } from "@/components/bilan/bilan-sante-section";
import { BilanDroitsSection } from "@/components/bilan/bilan-droits-section";
import { BilanElitesSection } from "@/components/bilan/bilan-elites-section";
import { BilanContrasteSection } from "@/components/bilan/bilan-contraste-section";

export const revalidate = 86400;

export default async function BilanMacronPage() {
  const dossier = getDossier("bilan-macron");
  if (!dossier) notFound();

  return (
    <>
      <BilanHeroSection />
      <DossierNav currentSlug="bilan-macron" />

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-16">
        <BilanEconomieSection />

        <div className="border-t border-bureau-700/20" />

        <BilanSanteSection />

        <div className="border-t border-bureau-700/20" />

        <BilanDroitsSection />

        <div className="border-t border-bureau-700/20" />

        <BilanElitesSection />

        <div className="border-t border-bureau-700/20" />

        <BilanContrasteSection />

        {/* Sources footer */}
        <footer className="border-t border-bureau-700/20 pt-8">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-bureau-500 mb-4">
            Sources principales
          </h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 text-xs text-bureau-500 sm:grid-cols-2">
            <p>INSEE &mdash; pauvret&eacute;, in&eacute;galit&eacute;s, emploi, inflation, dette, PIB</p>
            <p>Eurostat &mdash; coefficient de Gini, comparaisons UE</p>
            <p>DREES &mdash; sant&eacute;, protection sociale</p>
            <p>Cour des comptes &mdash; finances publiques, h&ocirc;pitaux</p>
            <p>France Strat&eacute;gie &mdash; &eacute;valuations ISF, PFU, CICE</p>
            <p>CEVIPOF &mdash; barom&egrave;tre de la confiance politique</p>
            <p>Fondation Abb&eacute; Pierre &mdash; mal-logement, sans-abrisme</p>
            <p>Oxfam France &mdash; in&eacute;galit&eacute;s, patrimoine milliardaires</p>
            <p>Amnesty International / HRW / ONU &mdash; violences polici&egrave;res</p>
            <p>RSF &mdash; libert&eacute; de la presse</p>
            <p>Economist Intelligence Unit &mdash; Democracy Index</p>
            <p>OCDE / PISA &mdash; classements &eacute;ducation</p>
            <p>Challenges &mdash; top 500 fortunes de France</p>
            <p>Restos du C&oelig;ur / Banques Alimentaires &mdash; ins&eacute;curit&eacute; alimentaire</p>
            <p>HATVP &mdash; d&eacute;clarations des ministres</p>
            <p>AGORA &mdash; donn&eacute;es de lobbying</p>
          </div>
          <p className="mt-4 text-[10px] text-bureau-600">
            Tous les chiffres proviennent de sources officielles ou
            d&rsquo;organismes reconnus. Derni&egrave;re mise &agrave; jour : mars 2026.
          </p>
        </footer>
      </div>
    </>
  );
}
