-- Этап D: новый вид KPI-отметки «поздно открыл смену». Только ADD VALUE — использование значения
-- (детектор) идёт в рантайме, не в этой транзакции.
ALTER TYPE "KpiMarkKind" ADD VALUE 'SHIFT_LATE' BEFORE 'LATE';
