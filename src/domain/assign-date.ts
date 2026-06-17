// Чистая доменная логика авто-даты при назначении (п.1). Без prisma/IO — юнит-тестируема,
// как myTasksWhere в my-tasks.ts. Используется в task-service.assignTask.

/**
 * Дата, которую надо проставить задаче при назначении водителя.
 * Назначение задачи БЕЗ даты → сегодня (уходит из пула «Без даты» в работу на сегодня).
 * Если дата уже задана или это снятие назначения (assigneeId == null) — `null` (ничего не трогаем).
 */
export function resolveAssignedDate(
  currentDate: Date | null,
  assigneeId: string | null,
  today: Date | null,
): Date | null {
  if (assigneeId && currentDate === null) return today;
  return null;
}
