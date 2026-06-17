"use client";
import { useCallback, useEffect, useState } from "react";

// Состояние подписки на пуши для UI (PRD §7). Вся серверная логика — в /api/push/*.
export type PushState =
  | "loading"
  | "unsupported" // браузер не умеет пуши
  | "nokey" // не задан NEXT_PUBLIC_VAPID_PUBLIC_KEY
  | "denied" // разрешение отозвано/запрещено
  | "subscribed"
  | "unsubscribed";

// VAPID public key (base64url) → Uint8Array для applicationServerKey (надёжнее строки в Android Chrome).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushSubscription() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let active = true;
    // Всё внутри async после await — чтобы не дёргать setState синхронно в теле эффекта.
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (!vapid) {
        setState("nokey");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (!active) return;
        if (existing) setState("subscribed");
        else setState(Notification.permission === "denied" ? "denied" : "unsubscribed");
      } catch {
        if (active) setState("unsubscribed");
      }
    })();
    return () => {
      active = false;
    };
  }, [vapid]);

  // ВАЖНО: вызывать только из обработчика клика (жест пользователя) — иначе Chrome молча откажет.
  const subscribe = useCallback(async () => {
    if (!vapid) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (res.ok) setState("subscribed");
    } catch {
      // оставляем текущее состояние — пользователь может повторить
    } finally {
      setBusy(false);
    }
  }, [vapid]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("unsubscribed");
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, subscribe, unsubscribe };
}
