"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { TaskDetailDTO } from "@/lib/task-dto";
import { TypeIcon } from "@/components/type-icon";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/task-ui";
import { WorksheetPricingSection } from "../../_components/worksheet-pricing-section";

/**
 * Компактный экран расценки: только шапка задачи (что и кому расцениваем) + блок «Расценка ведомости»
 * и кнопка «Открыть всю заявку» (решение Артёма 24.06). Из очереди /pricing диспетчер попадает сразу
 * к ценам, не прокручивая всю карточку. Данные — тот же /api/tasks/:id (цены-подсказки приходят
 * только диспетчеру/админу, PRD §13).
 */
export function PricingCardClient({ taskId }: { taskId: string }) {
  const key = `/api/tasks/${taskId}`;
  const { data: task, error, isLoading, mutate } = useSWR<TaskDetailDTO>(key, fetcher);

  if (isLoading) return <p className="p-6 text-sm text-neutral-400">Загрузка…</p>;
  if (error || !task)
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Задача не найдена.</p>
        <Link href="/pricing" className="text-sm text-neutral-600 underline">
          ← К расценке
        </Link>
      </div>
    );

  const hasWorksheet =
    task.type.requiresPricing &&
    task.workItems.length > 0 &&
    (task.worksheetStatus === "PRICING" || task.worksheetStatus === "PRICED");

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/pricing" className="text-sm text-neutral-500 hover:underline">
          ← К расценке
        </Link>
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Открыть всю заявку
        </Link>
      </div>

      {/* Компактная шапка: что и кому расцениваем — без остальных секций задачи (PRD §13). */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <TypeIcon name={task.type.icon} className="h-6 w-6 text-neutral-500" />
        <h1 className="text-xl font-semibold text-neutral-900">
          №{task.number} · {task.title}
        </h1>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-neutral-500">
        <span>{task.type.name}</span>
        <span>Исполнитель: {task.assignee?.name ?? "—"}</span>
        {task.orgName ? <span>Клиент: {task.orgName}</span> : null}
        <span>{task.address}</span>
        <span>Дата: {formatDate(task.scheduledDate)}</span>
      </div>

      {hasWorksheet ? (
        <WorksheetPricingSection
          taskId={task.id}
          workItems={task.workItems}
          worksheetStatus={task.worksheetStatus}
          reprice={false}
          onSaved={() => void mutate()}
        />
      ) : (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
          Эта ведомость не ждёт расценки (нет позиций или цены уже проставлены). Откройте всю заявку для деталей.
        </div>
      )}
    </main>
  );
}
