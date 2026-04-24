-- CreateEnum
CREATE TYPE "SourceDirigeant" AS ENUM ('RECHERCHE_ENTREPRISES', 'RNE_INPI', 'RESEARCH', 'HATVP');

-- CreateEnum
CREATE TYPE "CategorieCarriereLobby" AS ENUM ('FORMATION', 'FONCTION_PUBLIQUE', 'CABINET_MINISTERIEL', 'MANDAT_ELECTIF', 'MANDAT_GOUVERNEMENTAL', 'ENTREPRISE_PRIVEE', 'LOBBY', 'ASSOCIATION', 'MEDIA', 'AUTRE');

-- CreateTable
CREATE TABLE "LobbyisteDirigeant" (
    "id" TEXT NOT NULL,
    "lobbyisteId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "nomNormalise" TEXT NOT NULL,
    "prenomNormalise" TEXT,
    "fonction" TEXT,
    "dateNaissanceAnnee" INTEGER,
    "nationalite" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "source" "SourceDirigeant" NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "personnaliteId" TEXT,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LobbyisteDirigeant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyisteDirigeantCarriere" (
    "id" TEXT NOT NULL,
    "dirigeantId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "organisation" TEXT,
    "categorie" "CategorieCarriereLobby" NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyisteDirigeantCarriere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyistePosition" (
    "id" TEXT NOT NULL,
    "lobbyisteId" TEXT NOT NULL,
    "thematique" TEXT NOT NULL,
    "positionDeclaree" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceDate" TIMESTAMP(3),
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyistePosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LobbyisteDirigeant_nomNormalise_prenomNormalise_idx" ON "LobbyisteDirigeant"("nomNormalise", "prenomNormalise");

-- CreateIndex
CREATE INDEX "LobbyisteDirigeant_lobbyisteId_idx" ON "LobbyisteDirigeant"("lobbyisteId");

-- CreateIndex
CREATE INDEX "LobbyisteDirigeant_personnaliteId_idx" ON "LobbyisteDirigeant"("personnaliteId");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyisteDirigeant_lobbyisteId_nomNormalise_prenomNormalise_key" ON "LobbyisteDirigeant"("lobbyisteId", "nomNormalise", "prenomNormalise", "fonction");

-- CreateIndex
CREATE INDEX "LobbyisteDirigeantCarriere_dirigeantId_idx" ON "LobbyisteDirigeantCarriere"("dirigeantId");

-- CreateIndex
CREATE INDEX "LobbyisteDirigeantCarriere_organisation_idx" ON "LobbyisteDirigeantCarriere"("organisation");

-- CreateIndex
CREATE INDEX "LobbyistePosition_lobbyisteId_idx" ON "LobbyistePosition"("lobbyisteId");

-- CreateIndex
CREATE INDEX "LobbyistePosition_thematique_idx" ON "LobbyistePosition"("thematique");

-- AddForeignKey
ALTER TABLE "LobbyisteDirigeant" ADD CONSTRAINT "LobbyisteDirigeant_lobbyisteId_fkey" FOREIGN KEY ("lobbyisteId") REFERENCES "Lobbyiste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyisteDirigeant" ADD CONSTRAINT "LobbyisteDirigeant_personnaliteId_fkey" FOREIGN KEY ("personnaliteId") REFERENCES "PersonnalitePublique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyisteDirigeantCarriere" ADD CONSTRAINT "LobbyisteDirigeantCarriere_dirigeantId_fkey" FOREIGN KEY ("dirigeantId") REFERENCES "LobbyisteDirigeant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyistePosition" ADD CONSTRAINT "LobbyistePosition_lobbyisteId_fkey" FOREIGN KEY ("lobbyisteId") REFERENCES "Lobbyiste"("id") ON DELETE CASCADE ON UPDATE CASCADE;
