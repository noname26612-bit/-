-- Этап 9: KPI и зарплата (Фаза 1.5). Только аддитивно — существующие таблицы не трогаем,
-- кроме нового поля TaskType.requiresSignedDoc.
-- ВНИМАНИЕ: Prisma 7 ошибочно генерит блок `ALTER TABLE "Task" ... DROP SEQUENCE "task_number_seq"`
-- (кастомная sequence нумерации из этапа 2 не «принадлежит» Prisma). Блок удалён вручную —
-- нумерацию задач не трогаем (см. MEMORY: Prisma migrate dev ломает task_number_seq).

-- CreateEnum
CREATE TYPE "KpiMarkKind" AS ENUM ('LATE', 'UNSIGNED_DOCS', 'MISSED_STOP', 'MANUAL');

-- CreateEnum
CREATE TYPE "KpiMarkStatus" AS ENUM ('CANDIDATE', 'CONFIRMED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PayoutFloor" AS ENUM ('SALARY', 'ZERO');

-- AlterTable
ALTER TABLE "TaskType" ADD COLUMN     "requiresSignedDoc" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KpiMark" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "taskId" TEXT,
    "period" TEXT NOT NULL,
    "kind" "KpiMarkKind" NOT NULL,
    "status" "KpiMarkStatus" NOT NULL DEFAULT 'CANDIDATE',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "manualAmount" INTEGER,
    "createdById" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPayProfile" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "premiumBase" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPayProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiRule" (
    "id" TEXT NOT NULL,
    "kind" "KpiMarkKind" NOT NULL,
    "weight" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KpiRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "progressionPercent" INTEGER NOT NULL DEFAULT 110,
    "progressionStartIndex" INTEGER NOT NULL DEFAULT 3,
    "floor" "PayoutFloor" NOT NULL DEFAULT 'SALARY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollStatement" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "premiumBase" INTEGER NOT NULL,
    "penalty" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "closedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollStatement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KpiMark_driverId_period_idx" ON "KpiMark"("driverId", "period");

-- CreateIndex
CREATE INDEX "KpiMark_status_period_idx" ON "KpiMark"("status", "period");

-- CreateIndex
CREATE UNIQUE INDEX "KpiMark_taskId_kind_key" ON "KpiMark"("taskId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPayProfile_driverId_key" ON "DriverPayProfile"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiRule_kind_key" ON "KpiRule"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollStatement_driverId_period_key" ON "PayrollStatement"("driverId", "period");

-- AddForeignKey
ALTER TABLE "KpiMark" ADD CONSTRAINT "KpiMark_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMark" ADD CONSTRAINT "KpiMark_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiMark" ADD CONSTRAINT "KpiMark_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayProfile" ADD CONSTRAINT "DriverPayProfile_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollStatement" ADD CONSTRAINT "PayrollStatement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
