-- CreateEnum
CREATE TYPE "TypeMedia" AS ENUM ('PRESSE_QUOTIDIENNE', 'PRESSE_MAGAZINE', 'TELEVISION', 'RADIO', 'NUMERIQUE', 'AGENCE');

-- CreateEnum
CREATE TYPE "TypeControle" AS ENUM ('MAJORITAIRE', 'MINORITAIRE', 'FONDATION', 'ETAT');

-- CreateTable
CREATE TABLE "GroupeMedia" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "nomCourt" TEXT NOT NULL,
    "description" TEXT,
    "chiffreAffaires" DOUBLE PRECISION,
    "rang" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "siteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupeMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaProprietaire" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "civilite" TEXT,
    "photoUrl" TEXT,
    "bioCourte" TEXT,
    "formation" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "fortuneEstimee" DOUBLE PRECISION,
    "sourceFortuneEstimee" TEXT,
    "activitePrincipale" TEXT,
    "personnaliteId" TEXT,

    CONSTRAINT "MediaProprietaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationMedia" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "partCapital" DOUBLE PRECISION,
    "typeControle" "TypeControle" NOT NULL,
    "dateAcquisition" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "ParticipationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filiale" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeMedia" NOT NULL,
    "groupeId" TEXT NOT NULL,
    "description" TEXT,
    "audienceEstimee" TEXT,
    "siteUrl" TEXT,
    "dateCreation" INTEGER,
    "dateAcquisition" INTEGER,
    "rang" INTEGER NOT NULL,

    CONSTRAINT "Filiale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupeMedia_slug_key" ON "GroupeMedia"("slug");

-- CreateIndex
CREATE INDEX "GroupeMedia_rang_idx" ON "GroupeMedia"("rang");

-- CreateIndex
CREATE INDEX "GroupeMedia_nom_idx" ON "GroupeMedia"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "MediaProprietaire_slug_key" ON "MediaProprietaire"("slug");

-- CreateIndex
CREATE INDEX "MediaProprietaire_nom_prenom_idx" ON "MediaProprietaire"("nom", "prenom");

-- CreateIndex
CREATE INDEX "MediaProprietaire_personnaliteId_idx" ON "MediaProprietaire"("personnaliteId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationMedia_proprietaireId_groupeId_key" ON "ParticipationMedia"("proprietaireId", "groupeId");

-- CreateIndex
CREATE UNIQUE INDEX "Filiale_slug_key" ON "Filiale"("slug");

-- CreateIndex
CREATE INDEX "Filiale_groupeId_idx" ON "Filiale"("groupeId");

-- CreateIndex
CREATE INDEX "Filiale_type_idx" ON "Filiale"("type");

-- CreateIndex
CREATE INDEX "Filiale_nom_idx" ON "Filiale"("nom");

-- AddForeignKey
ALTER TABLE "MediaProprietaire" ADD CONSTRAINT "MediaProprietaire_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationMedia" ADD CONSTRAINT "ParticipationMedia_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "MediaProprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationMedia" ADD CONSTRAINT "ParticipationMedia_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "GroupeMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filiale" ADD CONSTRAINT "Filiale_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "GroupeMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
