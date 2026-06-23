"use client";
// Отправка действия водителя: сразу (онлайн) или в очередь (офлайн/нет сети). Один ключ
// Idempotency-Key на действие — сервер применит его ровно один раз даже при повторной досылке.
import { apiSend, apiUpload, ApiError } from "@/lib/fetcher";
import { idbGet, STORE_BLOBS } from "./db";
import { putQueued } from "./queue";
import { newActionId } from "./id";
import type { QueuedAction, QueuedActionKind } from "./types";

type BlobRecord = { blob: Blob; name: string; type: string };

/** Низкоуровневая отправка одного действия с заголовками идемпотентности и времени. */
export async function sendAction(a: QueuedAction): Promise<void> {
  const headers = { "Idempotency-Key": a.id, "X-Occurred-At": a.occurredAt };
  if (a.blobId) {
    // Фото/документ, снятые офлайн (Коммит 5): восстанавливаем FormData из сохранённого blob.
    const rec = await idbGet<BlobRecord>(STORE_BLOBS, a.blobId);
    if (!rec) return; // blob потерян — пропускаем, не блокируя очередь
    const form = new FormData();
    form.append("file", rec.blob, rec.name);
    if (a.blobMeta?.kind === "DOCUMENT") form.append("kind", "DOCUMENT");
    await apiUpload(a.url, form, headers);
    return;
  }
  await apiSend(a.url, a.method, a.bodyJson, headers);
}

export type EnqueueParams = {
  kind: QueuedActionKind;
  method: "POST" | "PATCH" | "DELETE";
  url: string;
  taskId: string | null;
  bodyJson?: unknown;
  blobId?: string;
  blobMeta?: QueuedAction["blobMeta"];
};

/**
 * Отправить действие сразу (онлайн) или поставить в очередь (офлайн / нет связи / сервер лёг).
 * Доменные ошибки (4xx) пробрасываются — вызывающий откатит оптимистичный UI и покажет причину.
 * Возвращает { queued: true }, если действие ушло в очередь (UI покажет «ждёт отправки»).
 */
export async function enqueueOrSend(params: EnqueueParams): Promise<{ queued: boolean }> {
  const now = new Date().toISOString();
  const action: QueuedAction = {
    id: newActionId(),
    seq: Date.now(),
    occurredAt: now,
    createdAt: now,
    status: "pending",
    attempts: 0,
    ...params,
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await putQueued(action);
    return { queued: true };
  }
  try {
    await sendAction(action);
    return { queued: false };
  } catch (e) {
    if (e instanceof ApiError && e.retryable) {
      await putQueued(action); // нет сети / сервер лёг — в очередь, досошлём позже
      return { queued: true };
    }
    throw e; // доменная ошибка — наверх (откат оптимистики, показ причины)
  }
}
