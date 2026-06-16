import "server-only";
// Транспорт web-push (ARCHITECTURE §8). VAPID-ключи — из env (CLAUDE.md правило 5).
// server-only: гарантирует, что приватный VAPID-ключ никогда не попадёт в клиентский бандл.
// Отправка best-effort: вызывается из доменных мутаций fire-and-forget и НИКОГДА не должна
// ронять мутацию. Протухшие подписки (HTTP 404/410) удаляются из БД.
import webpush, { type WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";
import {
  buildTaskPayload,
  type PushPayload,
  type TaskNotifyKind,
  type NotifiableTask,
} from "@/domain/notifications";

let configured: boolean | null = null;

// Лениво конфигурируем VAPID один раз. Нет ключей — пуши тихо выключены (dev без .env).
function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@van-mark.ru";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID ключи не заданы — web-push отключён");
    configured = false;
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

const DEAD_STATUS = new Set([404, 410]); // 404 — невалидный endpoint, 410 — подписка истекла

function isWebPushError(e: unknown): e is WebPushError {
  return typeof e === "object" && e !== null && "statusCode" in e;
}

/**
 * Отправить пуш всем устройствам пользователя. userId задаёт ВЫЗЫВАЮЩИЙ код из доменной мутации
 * (из сессии), не из запроса. Ошибки не пробрасываются (best-effort). allSettled — одна мёртвая
 * подписка не мешает доставке на другие устройства.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const body = JSON.stringify(payload); // заведомо < ~4 КБ (минимальная нагрузка)
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60, urgency: "high" },
        );
      } catch (e) {
        if (isWebPushError(e) && DEAD_STATUS.has(e.statusCode)) {
          await prisma.pushSubscription
            .deleteMany({ where: { endpoint: s.endpoint } })
            .catch(() => {});
        } else {
          console.error(
            "[push] sendNotification error:",
            isWebPushError(e) ? e.statusCode : undefined,
            (e as Error).message,
          );
        }
      }
    }),
  );
}

/**
 * Уведомить назначенного водителя об изменении задачи (fire-and-forget). Вызывается из доменных
 * мутаций ПОСЛЕ коммита. Не уведомляем, если действие совершил сам исполнитель (он и так знает).
 */
export function notifyTaskAssignee(
  task: NotifiableTask & { assigneeId: string | null },
  kind: TaskNotifyKind,
  actorId?: string,
): void {
  if (!task.assigneeId || task.assigneeId === actorId) return;
  void sendPushToUser(task.assigneeId, buildTaskPayload(task, kind)).catch(() => {});
}
