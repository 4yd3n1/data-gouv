-- CreateTable
CREATE TABLE "Elu" (
    "id" TEXT NOT NULL,
    "typeMandat" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "codeCSP" TEXT,
    "libelleCSP" TEXT,
    "codeDepartement" TEXT,
    "libelleDepartement" TEXT,
    "codeCommune" TEXT,
    "libelleCommune" TEXT,
    "codeCanton" TEXT,
    "libelleCanton" TEXT,
    "codeCollParticuliere" TEXT,
    "libelleCollParticuliere" TEXT,
    "fonction" TEXT,
    "dateDebutMandat" TIMESTAMP(3),
    "dateDebutFonction" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Elu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionLegislative" (
    "id" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "tour" INTEGER NOT NULL,
    "codeDepartement" TEXT NOT NULL,
    "libelleDepartement" TEXT NOT NULL,
    "codeCirconscription" TEXT NOT NULL,
    "libelleCirconscription" TEXT NOT NULL,
    "inscrits" INTEGER NOT NULL,
    "votants" INTEGER NOT NULL,
    "abstentions" INTEGER NOT NULL,
    "exprimes" INTEGER NOT NULL,
    "blancs" INTEGER NOT NULL,
    "nuls" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionLegislative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatLegislatif" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "numeroPanneau" INTEGER NOT NULL,
    "nuance" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" TEXT NOT NULL,
    "voix" INTEGER NOT NULL,
    "pctInscrits" DOUBLE PRECISION,
    "pctExprimes" DOUBLE PRECISION,
    "elu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CandidatLegislatif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartiPolitique" (
    "id" TEXT NOT NULL,
    "codeCNCC" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "exercice" INTEGER NOT NULL,
    "cotisationsAdherents" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cotisationsElus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aidePublique1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aidePublique2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "donsPersonnes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionsPartis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionsCandidats" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salaires" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chargesSociales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communication" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalProduits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resultat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emprunts" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disponibilites" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartiPolitique_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Elu_typeMandat_idx" ON "Elu"("typeMandat");

-- CreateIndex
CREATE INDEX "Elu_nom_prenom_idx" ON "Elu"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Elu_codeDepartement_idx" ON "Elu"("codeDepartement");

-- CreateIndex
CREATE INDEX "Elu_codeCommune_idx" ON "Elu"("codeCommune");

-- CreateIndex
CREATE INDEX "Elu_sexe_idx" ON "Elu"("sexe");

-- CreateIndex
CREATE INDEX "Elu_typeMandat_codeDepartement_idx" ON "Elu"("typeMandat", "codeDepartement");

-- CreateIndex
CREATE INDEX "Elu_typeMandat_codeCommune_idx" ON "Elu"("typeMandat", "codeCommune");

-- CreateIndex
CREATE INDEX "ElectionLegislative_annee_tour_idx" ON "ElectionLegislative"("annee", "tour");

-- CreateIndex
CREATE INDEX "ElectionLegislative_codeDepartement_idx" ON "ElectionLegislative"("codeDepartement");

-- CreateIndex
CREATE UNIQUE INDEX "ElectionLegislative_annee_tour_codeDepartement_codeCirconsc_key" ON "ElectionLegislative"("annee", "tour", "codeDepartement", "codeCirconscription");

-- CreateIndex
CREATE INDEX "CandidatLegislatif_electionId_idx" ON "CandidatLegislatif"("electionId");

-- CreateIndex
CREATE INDEX "CandidatLegislatif_nuance_idx" ON "CandidatLegislatif"("nuance");

-- CreateIndex
CREATE INDEX "CandidatLegislatif_elu_idx" ON "CandidatLegislatif"("elu");

-- CreateIndex
CREATE INDEX "CandidatLegislatif_nom_prenom_idx" ON "CandidatLegislatif"("nom", "prenom");

-- CreateIndex
CREATE INDEX "PartiPolitique_nom_idx" ON "PartiPolitique"("nom");

-- CreateIndex
CREATE INDEX "PartiPolitique_exercice_idx" ON "PartiPolitique"("exercice");

-- CreateIndex
CREATE INDEX "PartiPolitique_resultat_idx" ON "PartiPolitique"("resultat");

-- CreateIndex
CREATE UNIQUE INDEX "PartiPolitique_codeCNCC_exercice_key" ON "PartiPolitique"("codeCNCC", "exercice");

-- AddForeignKey
ALTER TABLE "Elu" ADD CONSTRAINT "Elu_codeDepartement_fkey" FOREIGN KEY ("codeDepartement") REFERENCES "Departement"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Elu" ADD CONSTRAINT "Elu_codeCommune_fkey" FOREIGN KEY ("codeCommune") REFERENCES "Commune"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionLegislative" ADD CONSTRAINT "ElectionLegislative_codeDepartement_fkey" FOREIGN KEY ("codeDepartement") REFERENCES "Departement"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatLegislatif" ADD CONSTRAINT "CandidatLegislatif_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "ElectionLegislative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
