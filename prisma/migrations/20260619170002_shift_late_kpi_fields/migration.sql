-- Этап D: привязка KPI-отметки к смене (идемпотентность детектора SHIFT_LATE) + порог опоздания смены.
-- Аддитивно. Лишний DROP SEQUENCE task_number_seq, который генерит Prisma, здесь не нужен (правим только
-- KpiMark и CapacitySettings).

-- KpiMark: shiftId + FK + уникальность (одна SHIFT_LATE на смену).
ALTER TABLE "KpiMark" ADD COLUMN "shiftId" TEXT;
ALTER TABLE "KpiMark" ADD CONSTRAINT "KpiMark_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "KpiMark_shiftId_kind_key" ON "KpiMark"("shiftId", "kind");

-- CapacitySettings: порог «поздно открыл смену» (начало дня + запас).
ALTER TABLE "CapacitySettings" ADD COLUMN "shiftStartMinutes" INTEGER NOT NULL DEFAULT 540;
ALTER TABLE "CapacitySettings" ADD COLUMN "shiftLateGraceMinutes" INTEGER NOT NULL DEFAULT 15;
