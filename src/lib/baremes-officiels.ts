import type { TypeMandat } from "@prisma/client";

/**
 * Indemnités brutes mensuelles + annuelles fixées par décret pour les
 * fonctions exécutives. Sources publiques :
 *  - décret n° 2002-562 du 22 avril 2002 (cadre de calcul : traitement +
 *    indemnité de résidence + indemnité de fonction)
 *  - décret n° 2012-983 du 23 août 2012 (réduction uniforme de 30 %)
 * Valeurs brutes mensuelles 2024-2026, indexées sur la valeur du point
 * d'indice de la fonction publique.
 */

export type BaremeOfficiel = {
  type: TypeMandat;
  label: string;
  brutMensuel: number;
  brutAnnuel: number;
  decretRefs: string[];
  sourceUrl: string;
};

const SOURCE_URL =
  "https://www.vie-publique.fr/fiches/19461-quelle-est-la-remuneration-dun-membre-du-gouvernement";
const DECRET_REFS = ["décret 2002-562", "décret 2012-983"];

export const BAREMES_OFFICIELS: Record<TypeMandat, BaremeOfficiel> = {
  PRESIDENT: {
    type: "PRESIDENT",
    label: "Président de la République",
    brutMensuel: 16000,
    brutAnnuel: 192000,
    decretRefs: DECRET_REFS,
    sourceUrl: SOURCE_URL,
  },
  PREMIER_MINISTRE: {
    type: "PREMIER_MINISTRE",
    label: "Premier ministre",
    brutMensuel: 16000,
    brutAnnuel: 192000,
    decretRefs: DECRET_REFS,
    sourceUrl: SOURCE_URL,
  },
  MINISTRE: {
    type: "MINISTRE",
    label: "Ministre",
    brutMensuel: 10700,
    brutAnnuel: 128400,
    decretRefs: DECRET_REFS,
    sourceUrl: SOURCE_URL,
  },
  MINISTRE_DELEGUE: {
    type: "MINISTRE_DELEGUE",
    label: "Ministre délégué",
    brutMensuel: 10700,
    brutAnnuel: 128400,
    decretRefs: DECRET_REFS,
    sourceUrl: SOURCE_URL,
  },
  SECRETAIRE_ETAT: {
    type: "SECRETAIRE_ETAT",
    label: "Secrétaire d'État",
    brutMensuel: 10200,
    brutAnnuel: 122400,
    decretRefs: DECRET_REFS,
    sourceUrl: SOURCE_URL,
  },
};

export function getBaremeOfficiel(
  type: TypeMandat | null | undefined,
): BaremeOfficiel | null {
  if (!type) return null;
  return BAREMES_OFFICIELS[type] ?? null;
}
