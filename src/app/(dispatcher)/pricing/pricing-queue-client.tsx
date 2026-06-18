"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { TaskDTO } from "@/lib/task-dto";
import { TypeIcon } from "@/components/type-icon";

// Очередь ведомостей «на расценке» (этап 13, PRD §13). Живое обновление поллингом; цены ставит
// диспетчер в карточке задачи (по ссылке). Доску не трогаем — это отдельный экран.
export function PricingQueueClient() {
  const { data: queue = [], isLoading } = useSWR<TaskDTO[]>("/api/worksheets/pricing", fetcher, {
    refreshInterval: 10_000,
  });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Расценка ведомостей</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Водители отправили выполненные работы — проставьте цены в карточке задачи (PRD §13).
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-neutral-400">Загрузка…</p>
      ) : queue.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Нет ведомостей, ожидающих расценки.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {queue.map((t) => (
            <li key={t.id}>
              <Link
                href={`/tasks/${t.id}`}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <TypeIcon name={t.type.icon} className="h-5 w-5 text-neutral-500" />
                <span className="flex-1">
                  <span className="text-sm font-medium text-neutral-900">
                    №{t.number} · {t.title}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {t.type.name}
                    {t.assignee ? ` · ${t.assignee.name}` : ""}
                  </span>
                </span>
                {t.priority ? (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">Срочно</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
