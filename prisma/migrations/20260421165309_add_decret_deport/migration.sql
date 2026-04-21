-- CreateEnum
CREATE TYPE "BasisDeport" AS ENUM ('ANCIEN_EMPLOYEUR', 'PARTICIPATION_FINANCIERE', 'FAMILLE_CONJOINT', 'MANDAT_ANTERIEUR', 'ACTIVITE_BENEVOLE', 'PROCEDURE_JUDICIAIRE', 'AUTRE');

-- CreateTable
CREATE TABLE "DecretDeport" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "dateDecret" TIMESTAMP(3),
    "jorfRef" TEXT,
    "jorfUrl" TEXT,
    "perimetre" TEXT NOT NULL,
    "basis" "BasisDeport" NOT NULL,
    "basisDetail" TEXT,
    "sourceUrl" TEXT,
    "sourceOutlet" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecretDeport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecretDeport_personnaliteId_idx" ON "DecretDeport"("personnaliteId");

-- CreateIndex
CREATE INDEX "DecretDeport_dateDecret_idx" ON "DecretDeport"("dateDecret");

-- CreateIndex
CREATE INDEX "DecretDeport_basis_idx" ON "DecretDeport"("basis");

-- CreateIndex
CREATE UNIQUE INDEX "DecretDeport_personnaliteId_perimetre_key" ON "DecretDeport"("personnaliteId", "perimetre");

-- AddForeignKey
ALTER TABLE "DecretDeport" ADD CONSTRAINT "DecretDeport_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
