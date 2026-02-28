-- AlterTable
ALTER TABLE "Depute" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "Senateur" ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "Organe" (
    "id" TEXT NOT NULL,
    "codeType" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "libelleAbrege" TEXT,
    "libelleAbrev" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "legislature" INTEGER,
    "couleur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scrutin" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "legislature" INTEGER NOT NULL,
    "dateScrutin" TIMESTAMP(3) NOT NULL,
    "organeRef" TEXT NOT NULL,
    "codeTypeVote" TEXT NOT NULL,
    "libelleTypeVote" TEXT NOT NULL,
    "typeMajorite" TEXT,
    "sortCode" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "demandeur" TEXT,
    "nombreVotants" INTEGER NOT NULL,
    "suffragesExprimes" INTEGER NOT NULL,
    "nbrSuffragesRequis" INTEGER,
    "pour" INTEGER NOT NULL,
    "contre" INTEGER NOT NULL,
    "abstentions" INTEGER NOT NULL,
    "nonVotants" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scrutin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupeVote" (
    "id" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "organeRef" TEXT NOT NULL,
    "nombreMembresGroupe" INTEGER NOT NULL,
    "positionMajoritaire" TEXT NOT NULL,
    "pour" INTEGER NOT NULL,
    "contre" INTEGER NOT NULL,
    "abstentions" INTEGER NOT NULL,
    "nonVotants" INTEGER NOT NULL,

    CONSTRAINT "GroupeVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteRecord" (
    "id" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "deputeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "parDelegation" BOOLEAN NOT NULL DEFAULT false,
    "groupeOrganeRef" TEXT,
    "causePositionVote" TEXT,

    CONSTRAINT "VoteRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deport" (
    "id" TEXT NOT NULL,
    "legislature" INTEGER NOT NULL,
    "deputeId" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3),
    "datePublication" TIMESTAMP(3),
    "porteeCode" TEXT,
    "porteeLibelle" TEXT,
    "instanceCode" TEXT,
    "instanceLibelle" TEXT,
    "cibleType" TEXT,
    "cibleTexte" TEXT,
    "explication" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organe_codeType_idx" ON "Organe"("codeType");

-- CreateIndex
CREATE INDEX "Organe_legislature_idx" ON "Organe"("legislature");

-- CreateIndex
CREATE INDEX "Scrutin_dateScrutin_idx" ON "Scrutin"("dateScrutin");

-- CreateIndex
CREATE INDEX "Scrutin_legislature_idx" ON "Scrutin"("legislature");

-- CreateIndex
CREATE INDEX "Scrutin_sortCode_idx" ON "Scrutin"("sortCode");

-- CreateIndex
CREATE INDEX "Scrutin_codeTypeVote_idx" ON "Scrutin"("codeTypeVote");

-- CreateIndex
CREATE INDEX "Scrutin_numero_idx" ON "Scrutin"("numero");

-- CreateIndex
CREATE INDEX "GroupeVote_scrutinId_idx" ON "GroupeVote"("scrutinId");

-- CreateIndex
CREATE INDEX "GroupeVote_organeRef_idx" ON "GroupeVote"("organeRef");

-- CreateIndex
CREATE UNIQUE INDEX "GroupeVote_scrutinId_organeRef_key" ON "GroupeVote"("scrutinId", "organeRef");

-- CreateIndex
CREATE INDEX "VoteRecord_scrutinId_idx" ON "VoteRecord"("scrutinId");

-- CreateIndex
CREATE INDEX "VoteRecord_deputeId_idx" ON "VoteRecord"("deputeId");

-- CreateIndex
CREATE INDEX "VoteRecord_position_idx" ON "VoteRecord"("position");

-- CreateIndex
CREATE UNIQUE INDEX "VoteRecord_scrutinId_deputeId_key" ON "VoteRecord"("scrutinId", "deputeId");

-- CreateIndex
CREATE INDEX "Deport_deputeId_idx" ON "Deport"("deputeId");

-- CreateIndex
CREATE INDEX "Deport_legislature_idx" ON "Deport"("legislature");

-- AddForeignKey
ALTER TABLE "Scrutin" ADD CONSTRAINT "Scrutin_organeRef_fkey" FOREIGN KEY ("organeRef") REFERENCES "Organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupeVote" ADD CONSTRAINT "GroupeVote_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupeVote" ADD CONSTRAINT "GroupeVote_organeRef_fkey" FOREIGN KEY ("organeRef") REFERENCES "Organe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteRecord" ADD CONSTRAINT "VoteRecord_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deport" ADD CONSTRAINT "Deport_deputeId_fkey" FOREIGN KEY ("deputeId") REFERENCES "Depute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
