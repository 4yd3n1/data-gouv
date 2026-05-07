-- CreateEnum
CREATE TYPE "ModaliteAffiliation" AS ENUM ('ADHESION', 'INVESTITURE', 'RALLIEMENT', 'DEMISSION', 'EXCLUSION', 'DISSIDENCE', 'REBRANDING');

-- CreateEnum
CREATE TYPE "SourceParti" AS ENUM ('WIKIPEDIA', 'ASSEMBLEE_NATIONALE', 'SENAT', 'PRESSE_TIER_1', 'PRESSE_TIER_2', 'DECLARATION_PUBLIQUE', 'MANUELLE');

-- CreateEnum
CREATE TYPE "FamillePolitique" AS ENUM ('EXTREME_GAUCHE', 'GAUCHE', 'CENTRE_GAUCHE', 'CENTRE', 'CENTRE_DROIT', 'DROITE', 'EXTREME_DROITE', 'ECOLOGISTE', 'REGIONALISTE', 'DIVERS');

-- CreateTable
CREATE TABLE "AffiliationParti" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "parti" TEXT NOT NULL,
    "partiCode" TEXT NOT NULL,
    "famille" "FamillePolitique" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "modalite" "ModaliteAffiliation" NOT NULL,
    "source" "SourceParti" NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "notes" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "derniereMaj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliationParti_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliationParti_personnaliteId_dateDebut_idx" ON "AffiliationParti"("personnaliteId", "dateDebut");

-- CreateIndex
CREATE INDEX "AffiliationParti_partiCode_idx" ON "AffiliationParti"("partiCode");

-- CreateIndex
CREATE INDEX "AffiliationParti_famille_idx" ON "AffiliationParti"("famille");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliationParti_personnaliteId_partiCode_dateDebut_key" ON "AffiliationParti"("personnaliteId", "partiCode", "dateDebut");

-- AddForeignKey
ALTER TABLE "AffiliationParti" ADD CONSTRAINT "AffiliationParti_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
