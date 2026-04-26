import type { TypeMandat } from "@prisma/client";

/**
 * Indemnités brutes mensuelles + annuelles fixées par texte officiel pour les
 * mandats publics. Sources :
 *  - Exécutif : décret n° 2002-562 du 22 avril 2002 (cadre de calcul) +
 *    décret n° 2012-983 du 23 août 2012 (réduction uniforme de 30 %).
 *  - Parlementaires : ordonnance n° 58-1210 du 13 décembre 1958 — indemnité
 *    parlementaire identique pour députés et sénateurs (parité légale).
 * Valeurs brutes mensuelles 2024-2026, indexées sur la valeur du point
 * d'indice de la fonction publique.
 */

export type BaremeOfficiel = {
  label: string;
  brutMensuel: number;
  brutAnnuel: number;
  /** Texts that establish the indemnity (décrets, ordonnances). */
  references: string[];
  sourceUrl: string;
};

const GOV_SOURCE_URL =
  "https://www.vie-publique.fr/fiches/19461-quelle-est-la-remuneration-dun-membre-du-gouvernement";
const GOV_REFS = ["décret 2002-562", "décret 2012-983"];

const PARLEMENT_SOURCE_URL =
  "https://www.senat.fr/role/indemnite_senateur.html";
const PARLEMENT_REFS = ["ordonnance 58-1210"];

const BAREMES_OFFICIELS: Record<TypeMandat, BaremeOfficiel> = {
  PRESIDENT: {
    label: "Président de la République",
    brutMensuel: 16000,
    brutAnnuel: 192000,
    references: GOV_REFS,
    sourceUrl: GOV_SOURCE_URL,
  },
  PREMIER_MINISTRE: {
    label: "Premier ministre",
    brutMensuel: 16000,
    brutAnnuel: 192000,
    references: GOV_REFS,
    sourceUrl: GOV_SOURCE_URL,
  },
  MINISTRE: {
    label: "Ministre",
    brutMensuel: 10700,
    brutAnnuel: 128400,
    references: GOV_REFS,
    sourceUrl: GOV_SOURCE_URL,
  },
  MINISTRE_DELEGUE: {
    label: "Ministre délégué",
    brutMensuel: 10700,
    brutAnnuel: 128400,
    references: GOV_REFS,
    sourceUrl: GOV_SOURCE_URL,
  },
  SECRETAIRE_ETAT: {
    label: "Secrétaire d'État",
    brutMensuel: 10200,
    brutAnnuel: 122400,
    references: GOV_REFS,
    sourceUrl: GOV_SOURCE_URL,
  },
};

const BAREME_DEPUTE: BaremeOfficiel = {
  label: "Député",
  brutMensuel: 7637,
  brutAnnuel: 91649,
  references: PARLEMENT_REFS,
  sourceUrl: PARLEMENT_SOURCE_URL,
};

const BAREME_SENATEUR: BaremeOfficiel = {
  label: "Sénateur",
  brutMensuel: 7637,
  brutAnnuel: 91649,
  references: PARLEMENT_REFS,
  sourceUrl: PARLEMENT_SOURCE_URL,
};

export function getBaremeOfficiel(
  type: TypeMandat | null | undefined,
): BaremeOfficiel | null {
  if (!type) return null;
  return BAREMES_OFFICIELS[type] ?? null;
}

export function getBaremeParlementaire(
  role: "depute" | "senateur",
): BaremeOfficiel {
  return role === "depute" ? BAREME_DEPUTE : BAREME_SENATEUR;
}
