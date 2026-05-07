-- CreateEnum
CREATE TYPE "CategorieAcquisition" AS ENUM ('CESSION_ETRANGERE', 'VETO_IEF', 'RETRAIT_POLITIQUE', 'SAUVETAGE_DOMESTIQUE', 'RACHAT_ETATIQUE', 'FUSION_DOMICILIATION', 'SCISSION_DOMICILIATION', 'ANCRAGE_DOMESTIQUE', 'VENTE_DETRESSE', 'RESTRUCTURATION_DETTE');

-- CreateEnum
CREATE TYPE "MesureEtat" AS ENUM ('AUCUNE', 'VETO', 'CONDITIONS', 'ACTION_DE_PREFERENCE', 'ACTION_SPECIFIQUE', 'BPIFRANCE_MINORITAIRE', 'ANCRAGE_PARTAGE', 'RACHAT_ETAT', 'RECAPITALISATION_ETAT', 'STANDSTILL');

-- CreateEnum
CREATE TYPE "SecteurStrategique" AS ENUM ('DEFENSE_AEROSPACE', 'DEFENSE_NUCLEAIRE', 'ENERGIE', 'TELECOM', 'SEMICONDUCTEUR', 'BIOMETRIE_IDENTITE', 'CYBERSECURITE', 'BIOTECH_PHARMA', 'SANTE_OTC', 'GRANDE_DISTRIBUTION', 'AGROALIMENTAIRE', 'MEDIA_AUDIOVISUEL', 'AUTOMOBILE', 'AERONAUTIQUE_CIVIL', 'IT_SERVICES_HPC', 'CHIMIE_MATERIAUX', 'BTP_CIMENT', 'LOGISTIQUE_PORTUAIRE', 'MUSIQUE_DIVERTISSEMENT', 'IOT_TELECOM', 'AUTRE');

-- CreateEnum
CREATE TYPE "PaysAcquereur" AS ENUM ('ETATS_UNIS', 'ROYAUME_UNI', 'ALLEMAGNE', 'ITALIE', 'SUISSE', 'PAYS_BAS', 'CANADA', 'CHINE', 'SINGAPOUR', 'EMIRATS_ARABES_UNIS', 'TURQUIE', 'INDE', 'SUEDE', 'JAPON', 'COREE_DU_SUD', 'LUXEMBOURG', 'FRANCE', 'MULTIPLE', 'AUTRE');

-- CreateTable
CREATE TABLE "AcquisitionEtrangere" (
    "id" TEXT NOT NULL,
    "cibleNom" TEXT NOT NULL,
    "cibleSecteur" "SecteurStrategique" NOT NULL,
    "cibleSousSecteur" TEXT,
    "cibleSiren" TEXT,
    "cibleSiteHistorique" TEXT,
    "acquereurNom" TEXT NOT NULL,
    "acquereurPays" "PaysAcquereur" NOT NULL,
    "acquereurType" TEXT,
    "dateAnnonce" TIMESTAMP(3),
    "dateCloture" TIMESTAMP(3),
    "valeurEur" BIGINT,
    "categorie" "CategorieAcquisition" NOT NULL,
    "mesureEtat" "MesureEtat" NOT NULL DEFAULT 'AUCUNE',
    "ministreReferent" TEXT,
    "iefDeclenche" BOOLEAN,
    "iefReference" TEXT,
    "contexte" TEXT NOT NULL,
    "enjeuxSouverainete" TEXT NOT NULL,
    "contextePolitique" TEXT,
    "sourcePrincipale" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDate" TIMESTAMP(3) NOT NULL,
    "sourcesAdditionnelles" JSONB,
    "verifie" BOOLEAN NOT NULL DEFAULT false,
    "precedeMacron" BOOLEAN NOT NULL DEFAULT false,
    "parentDealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionEtrangere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_cibleNom_idx" ON "AcquisitionEtrangere"("cibleNom");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_categorie_idx" ON "AcquisitionEtrangere"("categorie");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_acquereurPays_idx" ON "AcquisitionEtrangere"("acquereurPays");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_cibleSecteur_idx" ON "AcquisitionEtrangere"("cibleSecteur");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_dateAnnonce_idx" ON "AcquisitionEtrangere"("dateAnnonce");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_verifie_idx" ON "AcquisitionEtrangere"("verifie");

-- CreateIndex
CREATE INDEX "AcquisitionEtrangere_parentDealId_idx" ON "AcquisitionEtrangere"("parentDealId");

-- AddForeignKey
ALTER TABLE "AcquisitionEtrangere" ADD CONSTRAINT "AcquisitionEtrangere_parentDealId_fkey" FOREIGN KEY ("parentDealId") REFERENCES "AcquisitionEtrangere"("id") ON DELETE SET NULL ON UPDATE CASCADE;
