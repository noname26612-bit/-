"use client";
import { useCallback, useEffect, useState } from "react";

// Android-установка PWA через beforeinstallprompt (Chromium). Событие ловим, prevent'им и держим
// до клика по нашей кнопке (PRD §8 — установка на домашний экран). iOS — отдельная инструкция (вне MVP).
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    let active = true;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Проверку «уже установлено» откладываем за микротаск — без синхронного setState в эффекте.
    void Promise.resolve().then(() => {
      if (active && window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    });
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null); // событие одноразовое
  }, [deferred]);

  return { canInstall: Boolean(deferred) && !installed, installed, promptInstall };
}
