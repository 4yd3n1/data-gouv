-- CreateEnum
CREATE TYPE "TypeSignalement" AS ENUM ('MISE_EN_DEMEURE', 'SANCTION', 'RETRAIT_AUTORISATION', 'AVERTISSEMENT', 'AMENDE');

-- CreateEnum
CREATE TYPE "OrientationEditoriale" AS ENUM ('DROITE', 'CENTRE_DROIT', 'CENTRE', 'CENTRE_GAUCHE', 'GAUCHE', 'GENERALISTE', 'SERVICE_PUBLIC', 'DIVERTISSEMENT', 'THEMATIQUE');

-- AlterTable
ALTER TABLE "Filiale" ADD COLUMN     "ligneEditoriale" TEXT,
ADD COLUMN     "orientation" "OrientationEditoriale";

-- AlterTable
ALTER TABLE "MediaProprietaire" ADD COLUMN     "contextePolitique" TEXT,
ADD COLUMN     "sourceContextePolitique" TEXT;

-- CreateTable
CREATE TABLE "SignalementArcom" (
    "id" TEXT NOT NULL,
    "filialeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "TypeSignalement" NOT NULL,
    "motif" TEXT NOT NULL,
    "montant" DOUBLE PRECISION,
    "referenceArcom" TEXT,
    "sourceUrl" TEXT,
    "resume" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalementArcom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignalementArcom_filialeId_idx" ON "SignalementArcom"("filialeId");

-- CreateIndex
CREATE INDEX "SignalementArcom_type_idx" ON "SignalementArcom"("type");

-- CreateIndex
CREATE INDEX "SignalementArcom_date_idx" ON "SignalementArcom"("date");

-- CreateIndex
CREATE INDEX "Filiale_orientation_idx" ON "Filiale"("orientation");

-- AddForeignKey
ALTER TABLE "SignalementArcom" ADD CONSTRAINT "SignalementArcom_filialeId_fkey" FOREIGN KEY ("filialeId") REFERENCES "Filiale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
