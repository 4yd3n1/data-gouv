-- CreateTable
CREATE TABLE "StatLocale" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "indicateur" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "geoType" TEXT NOT NULL,
    "geoCode" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatLocale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLocal" (
    "id" TEXT NOT NULL,
    "geoType" TEXT NOT NULL,
    "geoCode" TEXT NOT NULL,
    "geoLibelle" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "population" INTEGER,
    "totalRecettes" DOUBLE PRECISION,
    "recettesFonct" DOUBLE PRECISION,
    "recettesInvest" DOUBLE PRECISION,
    "impotsTaxes" DOUBLE PRECISION,
    "dotationsSubv" DOUBLE PRECISION,
    "totalDepenses" DOUBLE PRECISION,
    "depensesFonct" DOUBLE PRECISION,
    "depensesInvest" DOUBLE PRECISION,
    "chargesPersonnel" DOUBLE PRECISION,
    "encoursDette" DOUBLE PRECISION,
    "annuiteDette" DOUBLE PRECISION,
    "resultatComptable" DOUBLE PRECISION,
    "depenseParHab" DOUBLE PRECISION,
    "detteParHab" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetLocal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrutinTag" (
    "id" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "ScrutinTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatLocale_indicateur_geoType_idx" ON "StatLocale"("indicateur", "geoType");

-- CreateIndex
CREATE INDEX "StatLocale_geoCode_geoType_idx" ON "StatLocale"("geoCode", "geoType");

-- CreateIndex
CREATE INDEX "StatLocale_annee_idx" ON "StatLocale"("annee");

-- CreateIndex
CREATE INDEX "StatLocale_indicateur_geoCode_idx" ON "StatLocale"("indicateur", "geoCode");

-- CreateIndex
CREATE UNIQUE INDEX "StatLocale_source_indicateur_annee_geoType_geoCode_key" ON "StatLocale"("source", "indicateur", "annee", "geoType", "geoCode");

-- CreateIndex
CREATE INDEX "BudgetLocal_geoType_geoCode_idx" ON "BudgetLocal"("geoType", "geoCode");

-- CreateIndex
CREATE INDEX "BudgetLocal_annee_idx" ON "BudgetLocal"("annee");

-- CreateIndex
CREATE INDEX "BudgetLocal_geoType_annee_idx" ON "BudgetLocal"("geoType", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLocal_geoType_geoCode_annee_key" ON "BudgetLocal"("geoType", "geoCode", "annee");

-- CreateIndex
CREATE INDEX "ScrutinTag_tag_idx" ON "ScrutinTag"("tag");

-- CreateIndex
CREATE INDEX "ScrutinTag_scrutinId_idx" ON "ScrutinTag"("scrutinId");

-- CreateIndex
CREATE UNIQUE INDEX "ScrutinTag_scrutinId_tag_key" ON "ScrutinTag"("scrutinId", "tag");

-- AddForeignKey
ALTER TABLE "ScrutinTag" ADD CONSTRAINT "ScrutinTag_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
