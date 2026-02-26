-- CreateTable
CREATE TABLE "DeclarationInteret" (
    "id" TEXT NOT NULL,
    "civilite" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "typeDeclaration" TEXT NOT NULL,
    "typeMandat" TEXT NOT NULL,
    "organe" TEXT,
    "qualiteDeclarant" TEXT,
    "dateDepot" TIMESTAMP(3),
    "dateDebutMandat" TIMESTAMP(3),
    "totalParticipations" DOUBLE PRECISION,
    "totalRevenus" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationInteret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationFinanciere" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "nomSociete" TEXT NOT NULL,
    "evaluation" DOUBLE PRECISION,
    "remuneration" TEXT,
    "capitalDetenu" TEXT,
    "nombreParts" TEXT,

    CONSTRAINT "ParticipationFinanciere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenuDeclaration" (
    "id" TEXT NOT NULL,
    "declarationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "employeur" TEXT,
    "annee" INTEGER,
    "montant" DOUBLE PRECISION,

    CONSTRAINT "RevenuDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeclarationInteret_nom_prenom_idx" ON "DeclarationInteret"("nom", "prenom");

-- CreateIndex
CREATE INDEX "DeclarationInteret_typeMandat_idx" ON "DeclarationInteret"("typeMandat");

-- CreateIndex
CREATE INDEX "DeclarationInteret_totalParticipations_idx" ON "DeclarationInteret"("totalParticipations");

-- CreateIndex
CREATE INDEX "ParticipationFinanciere_declarationId_idx" ON "ParticipationFinanciere"("declarationId");

-- CreateIndex
CREATE INDEX "RevenuDeclaration_declarationId_idx" ON "RevenuDeclaration"("declarationId");

-- CreateIndex
CREATE INDEX "RevenuDeclaration_type_idx" ON "RevenuDeclaration"("type");

-- AddForeignKey
ALTER TABLE "ParticipationFinanciere" ADD CONSTRAINT "ParticipationFinanciere_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "DeclarationInteret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenuDeclaration" ADD CONSTRAINT "RevenuDeclaration_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "DeclarationInteret"("id") ON DELETE CASCADE ON UPDATE CASCADE;
