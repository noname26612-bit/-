"use client";

import { useState } from "react";
import { apiSend } from "@/lib/fetcher";
import type { WorkItemDTO } from "@/lib/task-dto";
import type { WorksheetStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Редактируемый блок «Расценка ведомости» — диспетчер ставит цены по позициям (этап 13, PRD §13).
 * Вынесен из карточки задачи, чтобы переиспользоваться и в полной карточке, и в компактном экране
 * расценки (/pricing/[id]). Весь state расценки (цены, причина, busy) — внутри компонента; наружу
 * отдаёт только onSaved (обновить данные) и onCancel (для режима исправления после акта).
 *
 * reprice=true — правка цены после подписания акта (SIGNED): обязательное поле причины. Цена-подсказка
 * (defaultPrice) приходит только диспетчеру (PRD §13), поэтому подставляется в пустое поле.
 */
export function WorksheetPricingSection({
  taskId,
  workItems,
  worksheetStatus,
  reprice,
  onSaved,
  onCancel,
}: {
  taskId: string;
  workItems: WorkItemDTO[];
  worksheetStatus: WorksheetStatus | null;
  reprice: boolean;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Значение поля цены: ручной ввод → уже проставленная цена → цена-подсказка из справочника → пусто.
  const priceStr = (w: WorkItemDTO): string =>
    prices[w.id] ?? (w.price != null ? String(w.price) : w.defaultPrice != null ? String(w.defaultPrice) : "");
  const total = workItems.reduce((s, w) => s + (Number.parseInt(priceStr(w), 10) || 0) * w.quantity, 0);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      const items = workItems.map((w) => ({ id: w.id, price: Number.parseInt(priceStr(w), 10) || 0 }));
      await apiSend(
        `/api/tasks/${taskId}/worksheet/pricing`,
        "POST",
        reprice ? { items, reason: reason.trim() } : { items },
      );
      setReason("");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const heading = reprice
    ? "· исправление после акта"
    : worksheetStatus === "PRICED"
      ? "· расценено"
      : "· ждёт цен";

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-neutral-700">Расценка ведомости {heading}</h2>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs text-neutral-400">
            <tr>
              <th className="px-3 py-2">Работа</th>
              <th className="px-3 py-2">Кол-во</th>
              <th className="px-3 py-2">Цена, ₽</th>
              <th className="px-3 py-2 text-right">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {workItems.map((w) => {
              const val = priceStr(w);
              const sum = (Number.parseInt(val, 10) || 0) * w.quantity;
              return (
                <tr key={w.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-3 py-2">{w.name}</td>
                  <td className="px-3 py-2">{w.quantity}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={val}
                      disabled={busy}
                      onChange={(e) => setPrices((p) => ({ ...p, [w.id]: e.target.value }))}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">{sum.toLocaleString("ru")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {reprice ? (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-neutral-500">
            Причина исправления цены (обязательно)
          </label>
          <Textarea
            rows={2}
            value={reason}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Например: ошибка в цене позиции, согласовано с клиентом"
          />
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Итого: {total.toLocaleString("ru")} ₽</span>
        <div className="flex gap-2">
          {reprice && onCancel ? (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setReason("");
                onCancel();
              }}
            >
              Отмена
            </Button>
          ) : null}
          <Button data-testid="save-pricing" disabled={busy || (reprice && !reason.trim())} onClick={save}>
            {reprice ? "Сохранить исправление" : worksheetStatus === "PRICED" ? "Сохранить цены" : "Подтвердить расценку"}
          </Button>
        </div>
      </div>
    </section>
  );
}
