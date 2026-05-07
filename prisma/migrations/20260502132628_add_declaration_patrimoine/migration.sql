-- CreateTable
CREATE TABLE "DeclarationPatrimoine" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT,
    "nomNormalise" TEXT NOT NULL,
    "prenomNormalise" TEXT NOT NULL,
    "organe" TEXT,
    "dateDebutMandat" TIMESTAMP(3),
    "dateDepot" TIMESTAMP(3),
    "regimeMatrimonial" TEXT,
    "sourcePdfUrl" TEXT,
    "typeDeclaration" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationPatrimoine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrimoineRow" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "rubriqueNum" INTEGER NOT NULL,
    "rubriqueTitre" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isNeant" BOOLEAN NOT NULL DEFAULT false,
    "description" JSONB NOT NULL,
    "valeur" JSONB,

    CONSTRAINT "PatrimoineRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeclarationPatrimoine_nomNormalise_prenomNormalise_idx" ON "DeclarationPatrimoine"("nomNormalise", "prenomNormalise");

-- CreateIndex
CREATE INDEX "DeclarationPatrimoine_personnaliteId_idx" ON "DeclarationPatrimoine"("personnaliteId");

-- CreateIndex
CREATE INDEX "PatrimoineRow_declarationId_idx" ON "PatrimoineRow"("declarationId");

-- CreateIndex
CREATE INDEX "PatrimoineRow_rubriqueNum_idx" ON "PatrimoineRow"("rubriqueNum");

-- AddForeignKey
ALTER TABLE "DeclarationPatrimoine" ADD CONSTRAINT "DeclarationPatrimoine_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrimoineRow" ADD CONSTRAINT "PatrimoineRow_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "DeclarationPatrimoine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
