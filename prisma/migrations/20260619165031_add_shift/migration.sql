-- Аддитивная миграция: смена водителя (этап C). Лишний DROP SEQUENCE task_number_seq, который
-- генерит Prisma, удалён вручную (ломает нумерацию задач).
-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('REQUESTED', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'REQUESTED',
    "openedAt" TIMESTAMP(3) NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_date_status_idx" ON "Shift"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_driverId_date_key" ON "Shift"("driverId", "date");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
