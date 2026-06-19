"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher, apiSend } from "@/lib/fetcher";
import type { WorkCatalogFullDTO, WorkCategoryDTO } from "@/lib/task-dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function WorkCatalogClient({ initial }: { initial: WorkCatalogFullDTO[] }) {
  const { data: items = initial, mutate } = useSWR<WorkCatalogFullDTO[]>("/api/admin/work-catalog", fetcher, {
    fallbackData: initial,
  });
  const { data: categories = [], mutate: mutateCats } = useSWR<WorkCategoryDTO[]>(
    "/api/admin/work-categories",
    fetcher,
  );
  const refresh = () => Promise.all([mutate(), mutateCats()]);

  // Группируем позиции по разделам (порядок разделов — из categories), плюс «Без раздела».
  const sections = categories.map((c) => ({ cat: c, items: items.filter((i) => i.categoryId === c.id) }));
  const uncategorized = items.filter((i) => !i.categoryId);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
        ← Администрирование
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Работы (для ведомости)</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Справочник работ по разделам, из которого водитель выбирает позиции ведомости (PRD §13).
        Цена-подсказка помогает диспетчеру при расценке (он правит под случай). Водитель цен не видит.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {sections.map(({ cat, items: its }) => (
          <CategorySection key={cat.id} cat={cat} items={its} categories={categories} onChanged={refresh} />
        ))}
        {uncategorized.length > 0 ? (
          <CategorySection cat={null} items={uncategorized} categories={categories} onChanged={refresh} />
        ) : null}
      </div>

      <AddCategory onSaved={() => void mutateCats()} />
    </main>
  );
}

function CategorySection({
  cat,
  items,
  categories,
  onChanged,
}: {
  cat: WorkCategoryDTO | null;
  items: WorkCatalogFullDTO[];
  categories: WorkCategoryDTO[];
  onChanged: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-3 py-2">
        {cat ? <CategoryHeader cat={cat} onSaved={onChanged} /> : (
          <span className="text-sm font-medium text-neutral-500">Без раздела</span>
        )}
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {items.map((it) => (
            <ItemRow key={it.id} item={it} categories={categories} onSaved={onChanged} />
          ))}
        </tbody>
      </table>
      <AddItem categoryId={cat?.id ?? null} categoryName={cat?.name ?? null} onSaved={onChanged} />
    </section>
  );
}

function CategoryHeader({ cat, onSaved }: { cat: WorkCategoryDTO; onSaved: () => void }) {
  const [name, setName] = useState(cat.name);
  const [sortOrder, setSortOrder] = useState(String(cat.sortOrder));
  const [isActive, setIsActive] = useState(cat.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = name !== cat.name || Number(sortOrder) !== cat.sortOrder || isActive !== cat.isActive;

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await apiSend(`/api/admin/work-categories/${cat.id}`, "PATCH", {
        name,
        sortOrder: Math.trunc(Number(sortOrder)) || 0,
        isActive,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-52 font-medium" />
      <label className="flex items-center gap-1 text-xs text-neutral-500">
        порядок
        <Input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="h-8 w-16"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-neutral-500">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        активен
      </label>
      <Button variant="secondary" disabled={!dirty || busy} onClick={save} className="ml-auto h-8 px-3">
        Сохранить раздел
      </Button>
      {error ? <span className="w-full text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

function ItemRow({
  item,
  categories,
  onSaved,
}: {
  item: WorkCatalogFullDTO;
  categories: WorkCategoryDTO[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.defaultPrice != null ? String(item.defaultPrice) : "");
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  const [isActive, setIsActive] = useState(item.isActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceVal = price.trim() === "" ? null : Math.trunc(Number(price)) || 0;
  const dirty =
    name !== item.name ||
    priceVal !== item.defaultPrice ||
    (categoryId || null) !== item.categoryId ||
    isActive !== item.isActive;

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await apiSend(`/api/admin/work-catalog/${item.id}`, "PATCH", {
        name,
        isActive,
        defaultPrice: priceVal,
        categoryId: categoryId || null,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-3 py-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 w-56" />
        {error ? <span className="block text-xs text-red-600">{error}</span> : null}
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="без цены"
          className="h-8 w-24"
        />
      </td>
      <td className="px-3 py-2">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-8 w-40">
          <option value="">— без раздела —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </td>
      <td className="px-3 py-2 text-center">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
      </td>
      <td className="px-3 py-2 text-right">
        <Button variant="secondary" disabled={!dirty || busy} onClick={save} className="h-8 px-3">
          Сохранить
        </Button>
      </td>
    </tr>
  );
}

function AddItem({
  categoryId,
  categoryName,
  onSaved,
}: {
  categoryId: string | null;
  categoryName: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await apiSend("/api/admin/work-catalog", "POST", {
        name: name.trim(),
        defaultPrice: price.trim() === "" ? null : Math.trunc(Number(price)) || 0,
        categoryId,
      });
      setName("");
      setPrice("");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 border-t border-dashed border-neutral-200 px-3 py-2.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={categoryName ? `Позиция в «${categoryName}»` : "Позиция без раздела"}
        className="h-8 w-56"
      />
      <Input
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="цена ₽"
        className="h-8 w-24"
      />
      <Button variant="ghost" disabled={busy || !name.trim()} onClick={add} className="h-8 px-3 text-xs">
        + позиция
      </Button>
      {error ? <span className="w-full text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

function AddCategory({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await apiSend("/api/admin/work-categories", "POST", { name: name.trim() });
      setName("");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-neutral-300 p-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500">Новый раздел</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название раздела" className="w-64" />
      </label>
      <Button disabled={busy || !name.trim()} onClick={add}>
        Добавить раздел
      </Button>
      {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
