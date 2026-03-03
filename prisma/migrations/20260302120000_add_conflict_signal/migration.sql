-- CreateTable
CREATE TABLE "ConflictSignal" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "typeMandat" TEXT NOT NULL,
    "deputeId" TEXT,
    "secteurDeclaration" TEXT NOT NULL,
    "participationCount" INTEGER NOT NULL,
    "totalMontant" DOUBLE PRECISION,
    "tag" TEXT NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "votePour" INTEGER NOT NULL,
    "voteContre" INTEGER NOT NULL,
    "voteAbstention" INTEGER NOT NULL,
    "lastScrutinDate" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConflictSignal_pkey" PRIMARY KEY ("id")
);

-- CreateUnique
CREATE UNIQUE INDEX "ConflictSignal_nom_prenom_typeMandat_secteurDeclaration_tag_key"
    ON "ConflictSignal"("nom", "prenom", "typeMandat", "secteurDeclaration", "tag");

-- CreateIndex
CREATE INDEX "ConflictSignal_typeMandat_idx" ON "ConflictSignal"("typeMandat");
CREATE INDEX "ConflictSignal_tag_idx" ON "ConflictSignal"("tag");
CREATE INDEX "ConflictSignal_deputeId_idx" ON "ConflictSignal"("deputeId");
CREATE INDEX "ConflictSignal_participationCount_idx" ON "ConflictSignal"("participationCount" DESC);
