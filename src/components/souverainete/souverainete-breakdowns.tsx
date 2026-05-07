import { BarRows } from "@/components/investigative/bar-rows";
import { Eyebrow } from "@/components/investigative/eyebrow";
import {
  CATEGORIE_LABELS,
  MESURE_LABELS,
  PAYS_LABELS,
  SECTEUR_LABELS,
  type SouveraineteOverview,
} from "@/lib/souverainete-data";
import {
  CategorieAcquisition,
  MesureEtat,
  PaysAcquereur,
} from "@prisma/client";

const RED = "var(--color-signal)";
const VERIFIED = "var(--color-verified)";
const WARN = "var(--color-warn)";
const FAINT = "var(--color-fg-faint)";

const CATEGORY_COLOR: Record<CategorieAcquisition, string> = {
  CESSION_ETRANGERE: RED,
  FUSION_DOMICILIATION: RED,
  SCISSION_DOMICILIATION: RED,
  VENTE_DETRESSE: RED,
  RESTRUCTURATION_DETTE: WARN,
  VETO_IEF: VERIFIED,
  RETRAIT_POLITIQUE: VERIFIED,
  SAUVETAGE_DOMESTIQUE: VERIFIED,
  RACHAT_ETATIQUE: VERIFIED,
  ANCRAGE_DOMESTIQUE: WARN,
};

const MESURE_COLOR: Record<MesureEtat, string> = {
  AUCUNE: FAINT,
  VETO: VERIFIED,
  CONDITIONS: WARN,
  ACTION_DE_PREFERENCE: WARN,
  ACTION_SPECIFIQUE: WARN,
  BPIFRANCE_MINORITAIRE: WARN,
  ANCRAGE_PARTAGE: VERIFIED,
  RACHAT_ETAT: VERIFIED,
  RECAPITALISATION_ETAT: VERIFIED,
  STANDSTILL: VERIFIED,
};

export function CategoryBreakdown({
  data,
  total,
}: {
  data: SouveraineteOverview["byCategory"];
  total: number;
}) {
  return (
    <Section
      figure="FIG. 1"
      title="Trajectoires documentées"
      caption={`${total} phases enregistrées. Chaque cession, veto, fusion ou sauvetage est compté comme un événement distinct (un dossier multi-phases comme Photonis Teledyne→HLD compte deux fois).`}
    >
      <BarRows
        items={data.map((d) => ({
          label: CATEGORIE_LABELS[d.categorie],
          value: d.count,
          color: CATEGORY_COLOR[d.categorie],
        }))}
        labelWidth={280}
      />
    </Section>
  );
}

export function CountryBreakdown({
  data,
}: {
  data: SouveraineteOverview["byCountry"];
}) {
  return (
    <Section
      figure="FIG. 2"
      title="Pays des acquéreurs"
      caption="France inclut les sauvetages domestiques (HLD-Photonis, Airbus-Safran-Tikehau pour Aubert & Duval, Framatome pour Segault, recapitalisation Eutelsat 2025, État-Bull 2026). Multi-pays : consortiums Eutelsat-OneWeb, créanciers Altice, scission Vivendi."
    >
      <BarRows
        items={data.map((d) => ({
          label: PAYS_LABELS[d.pays],
          value: d.count,
          color: d.pays === PaysAcquereur.FRANCE ? VERIFIED : RED,
        }))}
        labelWidth={220}
      />
    </Section>
  );
}

export function SectorBreakdown({
  data,
}: {
  data: SouveraineteOverview["bySector"];
}) {
  return (
    <Section
      figure="FIG. 3"
      title="Secteurs touchés"
      caption="Concentration sur les secteurs régaliens et stratégiques : défense, énergie, télécoms, semi-conducteurs, santé. Le secteur n'épuise pas l'enjeu : un fournisseur rang-2 peut être plus critique qu'un constructeur tier-1."
    >
      <BarRows
        items={data.map((d) => ({
          label: SECTEUR_LABELS[d.secteur],
          value: d.count,
          color: RED,
        }))}
        labelWidth={300}
      />
    </Section>
  );
}

export function MesureBreakdown({
  data,
}: {
  data: SouveraineteOverview["byMesure"];
}) {
  return (
    <Section
      figure="FIG. 4"
      title="Mesures publiques activées"
      caption="« Aucune mesure publique » ne signifie pas absence de revue IEF — celles-ci sont confidentielles. Cela signifie : aucune trace publique d'engagement, veto, action spécifique, ancrage Bpifrance ni rachat étatique. La doctrine officielle invoque souvent « confidentialité » ; cette colonne mesure la transparence effective."
    >
      <BarRows
        items={data.map((d) => ({
          label: MESURE_LABELS[d.mesureEtat],
          value: d.count,
          color: MESURE_COLOR[d.mesureEtat],
        }))}
        labelWidth={280}
      />
    </Section>
  );
}

function Section({
  figure,
  title,
  caption,
  children,
}: {
  figure: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <Eyebrow>{figure}</Eyebrow>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "var(--color-fg)",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-fg-mute)",
          margin: "8px 0 22px 0",
          maxWidth: "72ch",
        }}
      >
        {caption}
      </p>
      {children}
    </section>
  );
}
