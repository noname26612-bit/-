-- Этап 13 (PRD §13): цены позиций ведомости + подсказка цены в справочнике.
-- Ручная правка после `migrate --create-only`: убран паразитный DROP SEQUENCE task_number_seq.

-- AlterTable
ALTER TABLE "WorkCatalogItem" ADD COLUMN     "defaultPrice" INTEGER;

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "price" INTEGER;
