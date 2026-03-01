-- CreateTable
CREATE TABLE "StatCriminalite" (
    "id" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,
    "indicateur" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "total" INTEGER,
    "tauxPour1000" DOUBLE PRECISION,
    "variationPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatCriminalite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DensiteMedicale" (
    "id" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "nombreMedecins" INTEGER NOT NULL,
    "pour10k" DOUBLE PRECISION,
    "population" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DensiteMedicale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatCriminalite_departementCode_idx" ON "StatCriminalite"("departementCode");

-- CreateIndex
CREATE INDEX "StatCriminalite_indicateur_idx" ON "StatCriminalite"("indicateur");

-- CreateIndex
CREATE INDEX "StatCriminalite_annee_idx" ON "StatCriminalite"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "StatCriminalite_departementCode_indicateur_annee_key" ON "StatCriminalite"("departementCode", "indicateur", "annee");

-- CreateIndex
CREATE INDEX "DensiteMedicale_departementCode_idx" ON "DensiteMedicale"("departementCode");

-- CreateIndex
CREATE INDEX "DensiteMedicale_specialite_idx" ON "DensiteMedicale"("specialite");

-- CreateIndex
CREATE INDEX "DensiteMedicale_annee_idx" ON "DensiteMedicale"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "DensiteMedicale_departementCode_specialite_annee_key" ON "DensiteMedicale"("departementCode", "specialite", "annee");

-- AddForeignKey
ALTER TABLE "StatCriminalite" ADD CONSTRAINT "StatCriminalite_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DensiteMedicale" ADD CONSTRAINT "DensiteMedicale_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
