-- AlterTable
ALTER TABLE "DeclarationInteret" ADD COLUMN     "nomNormalise" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prenomNormalise" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Depute" ADD COLUMN     "nomNormalise" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prenomNormalise" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "PersonnalitePublique" ADD COLUMN     "nomNormalise" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prenomNormalise" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Senateur" ADD COLUMN     "nomNormalise" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prenomNormalise" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "DeclarationInteret_nomNormalise_prenomNormalise_idx" ON "DeclarationInteret"("nomNormalise", "prenomNormalise");

-- CreateIndex
CREATE INDEX "Depute_nomNormalise_prenomNormalise_idx" ON "Depute"("nomNormalise", "prenomNormalise");

-- CreateIndex
CREATE INDEX "PersonnalitePublique_nomNormalise_prenomNormalise_idx" ON "PersonnalitePublique"("nomNormalise", "prenomNormalise");

-- CreateIndex
CREATE INDEX "Senateur_nomNormalise_prenomNormalise_idx" ON "Senateur"("nomNormalise", "prenomNormalise");
