import type { ModaliteAffiliation, SourceParti, FamillePolitique } from "@prisma/client";

export interface AffiliationPartiSeed {
  slug: string;
  parti: string;
  partiCode: string;
  famille: FamillePolitique;
  dateDebut: string;
  dateFin?: string;
  modalite: ModaliteAffiliation;
  source: SourceParti;
  sourceUrl?: string;
  sourceDate?: string;
  notes?: string;
  verifie?: boolean;
}
