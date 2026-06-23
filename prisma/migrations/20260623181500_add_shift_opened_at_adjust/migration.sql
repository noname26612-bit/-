-- Аддитивная миграция (этап C, доработка №3): корректировка времени открытия смены диспетчером/админом
-- (на случай «не было связи / сел телефон»). В Shift.openedAt держим актуальное (исправленное) время,
-- здесь — аудит правки: исходное время + кто/когда/почему. Создана вручную (migrate dev на общей
-- dev-БД требует reset из-за drift; путь проекта — ручная миграция + migrate deploy).

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "openedAtReported" TIMESTAMP(3),
ADD COLUMN     "openedAtAdjustedById" TEXT,
ADD COLUMN     "openedAtAdjustedAt" TIMESTAMP(3),
ADD COLUMN     "openedAtAdjustNote" TEXT;
