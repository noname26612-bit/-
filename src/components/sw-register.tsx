"use client";
import { useEffect } from "react";

// Регистрирует service worker (/sw.js) на всех страницах. SW только пушевый (без offline-кэша),
// поэтому безопасно и в dev на localhost (secure context). Без него не работают пуш-подписки.
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);
  return null;
}
