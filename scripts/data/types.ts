import { TypeMandat } from "@prisma/client";

export interface MemberSeed {
  nom: string;
  prenom: string;
  civilite: string;
  slug: string;
  rang: number;
  type: TypeMandat;
  titre: string;
  titreCourt: string;
  ministereCode?: string;
  portefeuille?: string;
  bioCourte?: string;
  photoUrl?: string;
  formation?: string;
  dateDebut?: Date;
  deputeNom?: string;
  deputePrenom?: string;
  senateurNom?: string;
  senateurPrenom?: string;
}

export interface GovernmentConfig {
  gouvernement: string;
  premierMinistre: string;
  president: string;
  dateDebut: Date;
  dateFin: Date | null;
  members: MemberSeed[];
}
