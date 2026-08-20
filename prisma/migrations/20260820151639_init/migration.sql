-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CARRIED_OVER', 'DROPPED');

-- CreateEnum
CREATE TYPE "WorkCategory" AS ENUM ('SOPORTE', 'DESARROLLO', 'REPORTES', 'DOCUMENTACION', 'APRENDIZAJE', 'REUNION');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('FEATURE', 'PROCESO', 'INCIDENTE', 'REPORTE', 'DECISION');

-- CreateTable
CREATE TABLE "WeeklyCycle" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'PLANNING',
    "capacityMinutes" INTEGER,
    "retroWentWell" TEXT,
    "retroToImprove" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "WorkCategory" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedMinutes" INTEGER,
    "wasPlanned" BOOLEAN NOT NULL DEFAULT true,
    "requiresDoc" BOOLEAN NOT NULL DEFAULT true,
    "docNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "carriedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusBlock" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" "WorkCategory" NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "plannedEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "distractions" INTEGER NOT NULL DEFAULT 0,
    "wasProtected" BOOLEAN NOT NULL DEFAULT true,
    "interruptedMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "commitmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "focusRating" INTEGER NOT NULL,
    "win" TEXT NOT NULL,
    "friction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "module" TEXT,
    "contentMd" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitmentDocument" (
    "commitmentId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitmentDocument_pkey" PRIMARY KEY ("commitmentId","documentId")
);

-- CreateTable
CREATE TABLE "Blocker" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "commitmentId" TEXT,
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blocker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyCycle_status_idx" ON "WeeklyCycle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyCycle_weekStart_key" ON "WeeklyCycle"("weekStart");

-- CreateIndex
CREATE INDEX "Commitment_cycleId_status_idx" ON "Commitment"("cycleId", "status");

-- CreateIndex
CREATE INDEX "Commitment_cycleId_wasPlanned_idx" ON "Commitment"("cycleId", "wasPlanned");

-- CreateIndex
CREATE INDEX "FocusBlock_date_idx" ON "FocusBlock"("date");

-- CreateIndex
CREATE INDEX "FocusBlock_commitmentId_idx" ON "FocusBlock"("commitmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "CommitmentDocument_documentId_idx" ON "CommitmentDocument"("documentId");

-- CreateIndex
CREATE INDEX "Blocker_cycleId_resolved_idx" ON "Blocker"("cycleId", "resolved");

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusBlock" ADD CONSTRAINT "FocusBlock_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentDocument" ADD CONSTRAINT "CommitmentDocument_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitmentDocument" ADD CONSTRAINT "CommitmentDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocker" ADD CONSTRAINT "Blocker_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "WeeklyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocker" ADD CONSTRAINT "Blocker_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
