/**
 * HATVP DI + DSP section titles.
 *
 * `short` is the editorial label used in UI badges and section bands.
 * `long` is the verbatim PDF wording — kept for tooltips / a11y / méthodologie.
 */

export type SectionDef = { num: number; short: string; long: string };

export const DI_SECTIONS: SectionDef[] = [
  {
    num: 1,
    short: "Activités professionnelles",
    long: "Activités professionnelles donnant lieu à rémunération ou gratification exercées à la date de l'élection ou de la nomination ou au cours des cinq années précédant la déclaration",
  },
  {
    num: 2,
    short: "Consultant",
    long: "Activités de consultant exercées à la date de l'élection ou de la nomination ou au cours des cinq années précédant la déclaration",
  },
  {
    num: 3,
    short: "Participations dirigeantes",
    long: "Participations aux organes dirigeants d'un organisme public ou privé ou d'une société à la date de l'élection ou de la nomination et au cours des cinq années précédant la date de la déclaration",
  },
  {
    num: 4,
    short: "Participations financières",
    long: "Participations financières directes dans le capital d'une société à la date de l'élection ou de la nomination",
  },
  {
    num: 5,
    short: "Activités du conjoint",
    long: "Activités professionnelles exercées à la date de l'élection ou de la nomination par le conjoint, le partenaire lié par un pacte civil de solidarité ou le concubin",
  },
  {
    num: 6,
    short: "Fonctions bénévoles",
    long: "Fonctions bénévoles susceptibles de faire naître un conflit d'intérêts",
  },
  {
    num: 7,
    short: "Mandats électifs",
    long: "Fonctions et mandats électifs exercés à la date de l'élection ou de la nomination et au cours des cinq années précédant celle-ci",
  },
];

export const DSP_SECTIONS: SectionDef[] = [
  { num: 1, short: "Immeubles", long: "Les immeubles bâtis et non bâtis" },
  { num: 2, short: "SCI", long: "Les parts de sociétés civiles immobilières" },
  {
    num: 3,
    short: "Valeurs mobilières non cotées",
    long: "Les autres valeurs mobilières non cotées en bourse",
  },
  { num: 4, short: "Instruments financiers", long: "Les instruments financiers" },
  { num: 5, short: "Assurances vie", long: "Les assurances vie" },
  {
    num: 6,
    short: "Comptes & épargne",
    long: "Les comptes bancaires courants et les produits d'épargne",
  },
  {
    num: 7,
    short: "Biens mobiliers > 10 k€",
    long: "Les biens mobiliers divers, lorsque leur valeur unitaire est égale ou supérieure à 10 000 €",
  },
  { num: 8, short: "Véhicules", long: "Les véhicules à moteur" },
  {
    num: 9,
    short: "Fonds de commerce",
    long: "Les fonds de commerce, les clientèles, les charges et les offices",
  },
  {
    num: 10,
    short: "Espèces & stock-options",
    long: "Les espèces et les autres biens, dont les comptes courants de société ou les stock-options, d'une valeur supérieure ou égale à 10 000 €",
  },
  {
    num: 11,
    short: "Biens à l'étranger",
    long: "Les biens mobiliers, immobiliers et les comptes détenus à l'étranger",
  },
  {
    num: 12,
    short: "Passif",
    long: "Les éléments du passif, y compris les dettes de nature fiscale",
  },
];

export function diShort(num: number): string {
  return DI_SECTIONS.find((s) => s.num === num)?.short ?? `§${num}°`;
}

export function dspShort(num: number): string {
  return DSP_SECTIONS.find((s) => s.num === num)?.short ?? `§${num}°`;
}

export function diLong(num: number): string {
  return DI_SECTIONS.find((s) => s.num === num)?.long ?? "";
}

export function dspLong(num: number): string {
  return DSP_SECTIONS.find((s) => s.num === num)?.long ?? "";
}
