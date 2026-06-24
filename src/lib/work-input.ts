// Разбор тела запросов ведомости/справочника работ из untrusted JSON (этап 12–13 + разделы).
import type {
  WorkItemInput,
  WorkCatalogInput,
  WorkCategoryInput,
  PricingInput,
} from "@/domain/work-service";

export function parsePricingInput(body: Record<string, unknown>): PricingInput {
  const items: { id: string; price: number }[] = [];
  if (Array.isArray(body.items)) {
    for (const raw of body.items) {
      if (raw && typeof raw === "object") {
        const r = raw as Record<string, unknown>;
        if (typeof r.id === "string" && typeof r.price === "number" && Number.isFinite(r.price)) {
          items.push({ id: r.id, price: Math.trunc(r.price) });
        }
      }
    }
  }
  // Причина исправления цены после подписания акта (B2): обязательна только для SIGNED — проверка в домене.
  const reason = typeof body.reason === "string" ? body.reason : undefined;
  return { items, reason };
}

export function parseWorkItemInput(body: Record<string, unknown>): WorkItemInput {
  const out: WorkItemInput = {};
  if ("catalogItemId" in body) {
    const v = body.catalogItemId;
    if (v === null || typeof v === "string") out.catalogItemId = v;
  }
  if ("name" in body) {
    const v = body.name;
    if (v === null || typeof v === "string") out.name = v;
  }
  if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) {
    out.quantity = Math.trunc(body.quantity);
  }
  return out;
}

export function parseWorkCatalogInput(body: Record<string, unknown>): Partial<WorkCatalogInput> {
  const out: Partial<WorkCatalogInput> = {};
  if (typeof body.name === "string") out.name = body.name;
  if (typeof body.isActive === "boolean") out.isActive = body.isActive;
  if (typeof body.sortOrder === "number") out.sortOrder = Math.trunc(body.sortOrder);
  // Цена-подсказка: число (₽) или null (очистить). Прочее (undefined/строка) — поле не трогаем.
  if ("defaultPrice" in body) {
    const v = body.defaultPrice;
    if (v === null) out.defaultPrice = null;
    else if (typeof v === "number" && Number.isFinite(v)) out.defaultPrice = Math.trunc(v);
  }
  // Раздел: id (string) или null (без раздела).
  if ("categoryId" in body) {
    const v = body.categoryId;
    if (v === null || typeof v === "string") out.categoryId = v;
  }
  return out;
}

export function parseWorkCategoryInput(body: Record<string, unknown>): Partial<WorkCategoryInput> {
  const out: Partial<WorkCategoryInput> = {};
  if (typeof body.name === "string") out.name = body.name;
  if (typeof body.sortOrder === "number") out.sortOrder = Math.trunc(body.sortOrder);
  if (typeof body.isActive === "boolean") out.isActive = body.isActive;
  return out;
}
