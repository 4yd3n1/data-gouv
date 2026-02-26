-- DropForeignKey
ALTER TABLE "Depute" DROP CONSTRAINT "Depute_departementCode_fkey";

-- AlterTable
ALTER TABLE "Depute" ADD COLUMN     "departementRefCode" TEXT;

-- CreateIndex
CREATE INDEX "Depute_departementRefCode_idx" ON "Depute"("departementRefCode");

-- AddForeignKey
ALTER TABLE "Depute" ADD CONSTRAINT "Depute_departementRefCode_fkey" FOREIGN KEY ("departementRefCode") REFERENCES "Departement"("code") ON DELETE SET NULL ON UPDATE CASCADE;
