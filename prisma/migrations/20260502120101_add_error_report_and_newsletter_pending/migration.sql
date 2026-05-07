-- CreateEnum
CREATE TYPE "ErrorReportType" AS ENUM ('FACTUEL', 'SOURCE', 'TYPO', 'AUTRE');

-- CreateEnum
CREATE TYPE "ErrorReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ErrorReport" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ErrorReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "contact" TEXT,
    "status" "ErrorReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterPending" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sourceSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterPending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorReport_status_createdAt_idx" ON "ErrorReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterPending_email_key" ON "NewsletterPending"("email");

-- CreateIndex
CREATE INDEX "NewsletterPending_createdAt_idx" ON "NewsletterPending"("createdAt");
