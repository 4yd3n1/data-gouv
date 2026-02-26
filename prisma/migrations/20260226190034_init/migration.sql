-- CreateTable
CREATE TABLE "Depute" (
    "id" TEXT NOT NULL,
    "legislature" INTEGER NOT NULL,
    "civilite" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "villeNaissance" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "age" INTEGER,
    "groupe" TEXT NOT NULL,
    "groupeAbrev" TEXT NOT NULL,
    "departementNom" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,
    "circonscription" INTEGER NOT NULL,
    "datePriseFonction" TIMESTAMP(3),
    "profession" TEXT,
    "email" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "website" TEXT,
    "nombreMandats" INTEGER,
    "experienceDepute" TEXT,
    "scoreParticipation" DOUBLE PRECISION,
    "scoreSpecialite" DOUBLE PRECISION,
    "scoreLoyaute" DOUBLE PRECISION,
    "scoreMajorite" DOUBLE PRECISION,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateMaj" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Senateur" (
    "id" TEXT NOT NULL,
    "civilite" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "groupe" TEXT,
    "departement" TEXT,
    "profession" TEXT,
    "datePriseFonction" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateMaj" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Senateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandatSenateur" (
    "id" TEXT NOT NULL,
    "senateurId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "MandatSenateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSenateur" (
    "id" TEXT NOT NULL,
    "senateurId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fonction" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "CommissionSenateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobbyiste" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "categorieActivite" TEXT,
    "adresse" TEXT,
    "siren" TEXT,
    "effectif" TEXT,
    "chiffreAffaires" TEXT,
    "dateInscription" TIMESTAMP(3),
    "dateMaj" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lobbyiste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLobbyiste" (
    "id" TEXT NOT NULL,
    "lobbyisteId" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "domaine" TEXT,
    "periode" TEXT,

    CONSTRAINT "ActionLobbyiste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rowsIngested" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Depute_nom_prenom_idx" ON "Depute"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Depute_groupeAbrev_idx" ON "Depute"("groupeAbrev");

-- CreateIndex
CREATE INDEX "Depute_departementCode_idx" ON "Depute"("departementCode");

-- CreateIndex
CREATE INDEX "Depute_actif_idx" ON "Depute"("actif");

-- CreateIndex
CREATE INDEX "Senateur_nom_prenom_idx" ON "Senateur"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Senateur_groupe_idx" ON "Senateur"("groupe");

-- CreateIndex
CREATE INDEX "Senateur_actif_idx" ON "Senateur"("actif");

-- CreateIndex
CREATE INDEX "MandatSenateur_senateurId_idx" ON "MandatSenateur"("senateurId");

-- CreateIndex
CREATE INDEX "CommissionSenateur_senateurId_idx" ON "CommissionSenateur"("senateurId");

-- CreateIndex
CREATE INDEX "Lobbyiste_nom_idx" ON "Lobbyiste"("nom");

-- CreateIndex
CREATE INDEX "Lobbyiste_categorieActivite_idx" ON "Lobbyiste"("categorieActivite");

-- CreateIndex
CREATE INDEX "ActionLobbyiste_lobbyisteId_idx" ON "ActionLobbyiste"("lobbyisteId");

-- CreateIndex
CREATE INDEX "ActionLobbyiste_domaine_idx" ON "ActionLobbyiste"("domaine");

-- AddForeignKey
ALTER TABLE "MandatSenateur" ADD CONSTRAINT "MandatSenateur_senateurId_fkey" FOREIGN KEY ("senateurId") REFERENCES "Senateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionSenateur" ADD CONSTRAINT "CommissionSenateur_senateurId_fkey" FOREIGN KEY ("senateurId") REFERENCES "Senateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLobbyiste" ADD CONSTRAINT "ActionLobbyiste_lobbyisteId_fkey" FOREIGN KEY ("lobbyisteId") REFERENCES "Lobbyiste"("id") ON DELETE CASCADE ON UPDATE CASCADE;
