-- CreateTable
CREATE TABLE "LoiParlementaire" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "titreCourt" TEXT NOT NULL,
    "resumeSimple" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "legislature" INTEGER NOT NULL DEFAULT 17,
    "dateVote" TIMESTAMP(3),
    "referenceAN" TEXT,
    "dossierUrl" TEXT,
    "tags" TEXT[],
    "rang" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoiParlementaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrutinLoi" (
    "id" TEXT NOT NULL,
    "loiId" TEXT NOT NULL,
    "scrutinId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROCEDURAL',
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScrutinLoi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoiParlementaire_slug_key" ON "LoiParlementaire"("slug");

-- CreateIndex
CREATE INDEX "LoiParlementaire_statut_idx" ON "LoiParlementaire"("statut");

-- CreateIndex
CREATE INDEX "LoiParlementaire_legislature_idx" ON "LoiParlementaire"("legislature");

-- CreateIndex
CREATE INDEX "LoiParlementaire_rang_idx" ON "LoiParlementaire"("rang");

-- CreateIndex
CREATE INDEX "ScrutinLoi_loiId_idx" ON "ScrutinLoi"("loiId");

-- CreateIndex
CREATE INDEX "ScrutinLoi_scrutinId_idx" ON "ScrutinLoi"("scrutinId");

-- CreateIndex
CREATE INDEX "ScrutinLoi_role_idx" ON "ScrutinLoi"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ScrutinLoi_loiId_scrutinId_key" ON "ScrutinLoi"("loiId", "scrutinId");

-- AddForeignKey
ALTER TABLE "ScrutinLoi" ADD CONSTRAINT "ScrutinLoi_loiId_fkey" FOREIGN KEY ("loiId") REFERENCES "LoiParlementaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrutinLoi" ADD CONSTRAINT "ScrutinLoi_scrutinId_fkey" FOREIGN KEY ("scrutinId") REFERENCES "Scrutin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
