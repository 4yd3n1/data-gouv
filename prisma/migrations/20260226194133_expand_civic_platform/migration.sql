-- AlterTable
ALTER TABLE "IngestionLog" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "rowsTotal" INTEGER;

-- AlterTable
ALTER TABLE "Senateur" ADD COLUMN     "departementCode" TEXT;

-- CreateTable
CREATE TABLE "Region" (
    "code" TEXT NOT NULL,
    "cheflieu" TEXT,
    "tncc" INTEGER,
    "ncc" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Departement" (
    "code" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "cheflieu" TEXT,
    "tncc" INTEGER,
    "ncc" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Commune" (
    "code" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "typecom" TEXT NOT NULL,
    "tncc" INTEGER,
    "ncc" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "can" TEXT,
    "arr" TEXT,
    "comparent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Indicateur" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "idBank" TEXT,
    "dataflow" TEXT,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "domaine" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "frequence" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "correction" TEXT,
    "dernierePeriode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Indicateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "indicateurId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "periodeDebut" TIMESTAMP(3) NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "statut" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Musee" (
    "id" TEXT NOT NULL,
    "idPatrimostat" TEXT,
    "nom" TEXT NOT NULL,
    "ville" TEXT,
    "communeCode" TEXT,
    "departementCode" TEXT,
    "region" TEXT,
    "dateAppellation" TEXT,
    "ferme" TEXT,
    "anneeFermeture" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Musee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequentationMusee" (
    "id" TEXT NOT NULL,
    "museeId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "payant" INTEGER,
    "gratuit" INTEGER,
    "total" INTEGER,
    "individuel" INTEGER,
    "scolaires" INTEGER,
    "groupesHorsScolaires" INTEGER,
    "moins18AnsHorsScolaires" INTEGER,
    "de18a25Ans" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrequentationMusee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monument" (
    "id" TEXT NOT NULL,
    "denomination" TEXT,
    "domaine" TEXT,
    "communeNom" TEXT,
    "communeCode" TEXT,
    "departementCode" TEXT,
    "departementNom" TEXT,
    "region" TEXT,
    "adresse" TEXT,
    "sieclePrincipal" TEXT,
    "siecleSecondaire" TEXT,
    "protectionType" TEXT,
    "protectionDate" TEXT,
    "statutJuridique" TEXT,
    "description" TEXT,
    "historique" TEXT,
    "coordonnees" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "dateMaj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Region_libelle_idx" ON "Region"("libelle");

-- CreateIndex
CREATE INDEX "Departement_regionCode_idx" ON "Departement"("regionCode");

-- CreateIndex
CREATE INDEX "Departement_libelle_idx" ON "Departement"("libelle");

-- CreateIndex
CREATE INDEX "Commune_departementCode_idx" ON "Commune"("departementCode");

-- CreateIndex
CREATE INDEX "Commune_regionCode_idx" ON "Commune"("regionCode");

-- CreateIndex
CREATE INDEX "Commune_libelle_idx" ON "Commune"("libelle");

-- CreateIndex
CREATE INDEX "Commune_typecom_idx" ON "Commune"("typecom");

-- CreateIndex
CREATE UNIQUE INDEX "Indicateur_code_key" ON "Indicateur"("code");

-- CreateIndex
CREATE INDEX "Indicateur_domaine_idx" ON "Indicateur"("domaine");

-- CreateIndex
CREATE INDEX "Observation_indicateurId_idx" ON "Observation"("indicateurId");

-- CreateIndex
CREATE INDEX "Observation_periodeDebut_idx" ON "Observation"("periodeDebut");

-- CreateIndex
CREATE INDEX "Observation_indicateurId_periodeDebut_idx" ON "Observation"("indicateurId", "periodeDebut");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_indicateurId_periode_key" ON "Observation"("indicateurId", "periode");

-- CreateIndex
CREATE INDEX "Musee_nom_idx" ON "Musee"("nom");

-- CreateIndex
CREATE INDEX "Musee_communeCode_idx" ON "Musee"("communeCode");

-- CreateIndex
CREATE INDEX "Musee_departementCode_idx" ON "Musee"("departementCode");

-- CreateIndex
CREATE INDEX "FrequentationMusee_museeId_idx" ON "FrequentationMusee"("museeId");

-- CreateIndex
CREATE INDEX "FrequentationMusee_annee_idx" ON "FrequentationMusee"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "FrequentationMusee_museeId_annee_key" ON "FrequentationMusee"("museeId", "annee");

-- CreateIndex
CREATE INDEX "Monument_denomination_idx" ON "Monument"("denomination");

-- CreateIndex
CREATE INDEX "Monument_communeCode_idx" ON "Monument"("communeCode");

-- CreateIndex
CREATE INDEX "Monument_departementCode_idx" ON "Monument"("departementCode");

-- CreateIndex
CREATE INDEX "Monument_domaine_idx" ON "Monument"("domaine");

-- CreateIndex
CREATE INDEX "Monument_protectionType_idx" ON "Monument"("protectionType");

-- CreateIndex
CREATE INDEX "Monument_region_idx" ON "Monument"("region");

-- CreateIndex
CREATE INDEX "Senateur_departementCode_idx" ON "Senateur"("departementCode");

-- AddForeignKey
ALTER TABLE "Departement" ADD CONSTRAINT "Departement_regionCode_fkey" FOREIGN KEY ("regionCode") REFERENCES "Region"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Depute" ADD CONSTRAINT "Depute_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Senateur" ADD CONSTRAINT "Senateur_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_indicateurId_fkey" FOREIGN KEY ("indicateurId") REFERENCES "Indicateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Musee" ADD CONSTRAINT "Musee_communeCode_fkey" FOREIGN KEY ("communeCode") REFERENCES "Commune"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Musee" ADD CONSTRAINT "Musee_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequentationMusee" ADD CONSTRAINT "FrequentationMusee_museeId_fkey" FOREIGN KEY ("museeId") REFERENCES "Musee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monument" ADD CONSTRAINT "Monument_communeCode_fkey" FOREIGN KEY ("communeCode") REFERENCES "Commune"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monument" ADD CONSTRAINT "Monument_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "Departement"("code") ON DELETE SET NULL ON UPDATE CASCADE;
