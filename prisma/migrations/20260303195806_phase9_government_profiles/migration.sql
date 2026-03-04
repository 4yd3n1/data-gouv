-- CreateEnum
CREATE TYPE "TypeMandat" AS ENUM ('PRESIDENT', 'PREMIER_MINISTRE', 'MINISTRE', 'MINISTRE_DELEGUE', 'SECRETAIRE_ETAT');

-- CreateEnum
CREATE TYPE "CategorieCarriere" AS ENUM ('FORMATION', 'CARRIERE_PRIVEE', 'FONCTION_PUBLIQUE', 'MANDAT_ELECTIF', 'MANDAT_GOUVERNEMENTAL', 'ORGANISME', 'AUTRE');

-- CreateEnum
CREATE TYPE "SourceCarriere" AS ENUM ('HATVP', 'ASSEMBLEE', 'PRESSE', 'MANUELLE');

-- CreateEnum
CREATE TYPE "RubriqueInteret" AS ENUM ('ACTIVITE_ANTERIEURE', 'MANDAT_ELECTIF', 'PARTICIPATION', 'ACTIVITE_CONJOINT', 'ACTIVITE_BENEVOLE', 'REVENU', 'DON_AVANTAGE');

-- CreateEnum
CREATE TYPE "TypeEvenement" AS ENUM ('ENQUETE_PRELIMINAIRE', 'MISE_EN_EXAMEN', 'RENVOI_CORRECTIONNELLE', 'CONDAMNATION', 'RELAXE', 'CLASSEMENT_SANS_SUITE', 'NON_LIEU', 'APPEL', 'GARDE_A_VUE', 'COUR_JUSTICE_REPUBLIQUE');

-- CreateEnum
CREATE TYPE "StatutEvenement" AS ENUM ('EN_COURS', 'CLOS', 'APPEL_EN_COURS');

-- CreateEnum
CREATE TYPE "SourceRecherche" AS ENUM ('HATVP_ONLY', 'HATVP_PLUS_PRESSE', 'VERIFIE_MANUELLEMENT');

-- CreateTable
CREATE TABLE "PersonnalitePublique" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "civilite" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "slug" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bioCourte" TEXT,
    "formation" TEXT,
    "deputeId" TEXT,
    "senateurId" TEXT,
    "hatvpDossierId" TEXT,
    "sourceRecherche" "SourceRecherche" NOT NULL DEFAULT 'HATVP_ONLY',
    "derniereMaj" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonnalitePublique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandatGouvernemental" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "titreCourt" TEXT NOT NULL,
    "gouvernement" TEXT NOT NULL,
    "premierMinistre" TEXT,
    "president" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "rang" INTEGER NOT NULL,
    "type" "TypeMandat" NOT NULL,
    "portefeuille" TEXT,
    "ministereCode" TEXT,

    CONSTRAINT "MandatGouvernemental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntreeCarriere" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "categorie" "CategorieCarriere" NOT NULL,
    "titre" TEXT NOT NULL,
    "organisation" TEXT,
    "description" TEXT,
    "source" "SourceCarriere" NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EntreeCarriere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteretDeclare" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "declarationRef" TEXT NOT NULL,
    "dateDeclaration" TIMESTAMP(3),
    "rubrique" "RubriqueInteret" NOT NULL,
    "contenu" TEXT NOT NULL,
    "organisation" TEXT,
    "montant" DOUBLE PRECISION,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "alerteConflit" BOOLEAN NOT NULL DEFAULT false,
    "commentaireConflit" TEXT,

    CONSTRAINT "InteretDeclare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementJudiciaire" (
    "id" TEXT NOT NULL,
    "personnaliteId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "type" "TypeEvenement" NOT NULL,
    "nature" TEXT,
    "juridiction" TEXT,
    "statut" "StatutEvenement" NOT NULL,
    "resume" TEXT NOT NULL,
    "sourcePrincipale" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifie" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EvenementJudiciaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLobby" (
    "id" TEXT NOT NULL,
    "representantNom" TEXT NOT NULL,
    "representantCategorie" TEXT,
    "ministereCode" TEXT NOT NULL,
    "domaine" TEXT,
    "typeAction" TEXT,
    "exercice" TEXT,
    "depensesTranche" TEXT,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLobby_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonnalitePublique_slug_key" ON "PersonnalitePublique"("slug");

-- CreateIndex
CREATE INDEX "PersonnalitePublique_nom_prenom_idx" ON "PersonnalitePublique"("nom", "prenom");

-- CreateIndex
CREATE INDEX "PersonnalitePublique_deputeId_idx" ON "PersonnalitePublique"("deputeId");

-- CreateIndex
CREATE INDEX "PersonnalitePublique_senateurId_idx" ON "PersonnalitePublique"("senateurId");

-- CreateIndex
CREATE INDEX "MandatGouvernemental_personnaliteId_idx" ON "MandatGouvernemental"("personnaliteId");

-- CreateIndex
CREATE INDEX "MandatGouvernemental_ministereCode_idx" ON "MandatGouvernemental"("ministereCode");

-- CreateIndex
CREATE INDEX "MandatGouvernemental_type_idx" ON "MandatGouvernemental"("type");

-- CreateIndex
CREATE INDEX "MandatGouvernemental_gouvernement_idx" ON "MandatGouvernemental"("gouvernement");

-- CreateIndex
CREATE INDEX "EntreeCarriere_personnaliteId_idx" ON "EntreeCarriere"("personnaliteId");

-- CreateIndex
CREATE INDEX "EntreeCarriere_categorie_idx" ON "EntreeCarriere"("categorie");

-- CreateIndex
CREATE INDEX "InteretDeclare_personnaliteId_idx" ON "InteretDeclare"("personnaliteId");

-- CreateIndex
CREATE INDEX "InteretDeclare_declarationRef_idx" ON "InteretDeclare"("declarationRef");

-- CreateIndex
CREATE INDEX "InteretDeclare_rubrique_idx" ON "InteretDeclare"("rubrique");

-- CreateIndex
CREATE INDEX "InteretDeclare_alerteConflit_idx" ON "InteretDeclare"("alerteConflit");

-- CreateIndex
CREATE INDEX "EvenementJudiciaire_personnaliteId_idx" ON "EvenementJudiciaire"("personnaliteId");

-- CreateIndex
CREATE INDEX "EvenementJudiciaire_verifie_idx" ON "EvenementJudiciaire"("verifie");

-- CreateIndex
CREATE INDEX "EvenementJudiciaire_type_idx" ON "EvenementJudiciaire"("type");

-- CreateIndex
CREATE INDEX "ActionLobby_ministereCode_idx" ON "ActionLobby"("ministereCode");

-- CreateIndex
CREATE INDEX "ActionLobby_representantNom_idx" ON "ActionLobby"("representantNom");

-- CreateIndex
CREATE INDEX "ActionLobby_exercice_idx" ON "ActionLobby"("exercice");

-- CreateIndex
CREATE INDEX "ActionLobby_domaine_idx" ON "ActionLobby"("domaine");

-- AddForeignKey
ALTER TABLE "PersonnalitePublique" ADD CONSTRAINT "PersonnalitePublique_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonnalitePublique" ADD CONSTRAINT "PersonnalitePublique_senateurId_fkey" FOREIGN KEY ("senateurId") REFERENCES "Senateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandatGouvernemental" ADD CONSTRAINT "MandatGouvernemental_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeCarriere" ADD CONSTRAINT "EntreeCarriere_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteretDeclare" ADD CONSTRAINT "InteretDeclare_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementJudiciaire" ADD CONSTRAINT "EvenementJudiciaire_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
