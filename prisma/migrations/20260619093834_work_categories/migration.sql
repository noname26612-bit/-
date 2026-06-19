-- Разделы справочника работ (этап «справочник»: группы услуг/товаров). Аддитивно.
-- (Паразитный блок Prisma про Task.number / DROP SEQUENCE task_number_seq удалён вручную —
--  см. память проекта prisma-migrate-drops-task-number-seq.)

-- AlterTable
ALTER TABLE "WorkCatalogItem" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "WorkCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCategory_name_key" ON "WorkCategory"("name");

-- AddForeignKey
ALTER TABLE "WorkCatalogItem" ADD CONSTRAINT "WorkCatalogItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorkCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
