"use client";
/* eslint-disable @next/next/no-img-element -- фото отдаются через /api/attachments/:id по сессионной
   куке; next/image ходит через свой прокси без куки и получил бы 404. */

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// Полноэкранный просмотр фото для водительского PWA. Раньше фото открывалось ссылкой в новой вкладке
// браузера (target=_blank) — в Android/TWA её нельзя закрыть привычным жестом, фото «залипало».
// Здесь — встроенный просмотрщик: закрывается крестиком, тапом по фону, свайпом вверх/вниз и
// аппаратной кнопкой «назад» (через запись в history, чтобы «назад» не выходил из приложения).
// Монтируется только когда есть фото (родитель рендерит по условию) — поэтому смещение всегда 0.
export function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [dy, setDy] = useState(0); // смещение по вертикали во время свайпа
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Закрытие пользователем: если открытие добавило запись в history — откатываем её (popstate вызовет
  // onClose), иначе закрываем напрямую. Стабильная ссылка — читает только refs/window.
  const requestClose = useCallback(() => {
    const st = typeof window !== "undefined" ? (window.history.state as { vmLightbox?: boolean } | null) : null;
    if (st?.vmLightbox) window.history.back();
    else onCloseRef.current();
  }, []);

  // Пока открыто: ловим аппаратную «назад» (popstate) и Esc; добавляем запись в history.
  useEffect(() => {
    const onPop = () => onCloseRef.current();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.history.pushState({ vmLightbox: true }, "");
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [requestClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex touch-none items-center justify-center bg-black/90"
      onClick={requestClose}
      style={{ opacity: Math.max(0.35, 1 - Math.abs(dy) / 400) }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        onClick={(e) => {
          e.stopPropagation();
          requestClose();
        }}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/30"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={url}
        alt="фото"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          startY.current = e.touches[0].clientY;
          setDragging(true);
        }}
        onTouchMove={(e) => {
          if (startY.current !== null) setDy(e.touches[0].clientY - startY.current);
        }}
        onTouchEnd={() => {
          if (Math.abs(dy) > 120) requestClose();
          else setDy(0);
          startY.current = null;
          setDragging(false);
        }}
        className="max-h-full max-w-full object-contain"
        style={{ transform: `translateY(${dy}px)`, transition: dragging ? "none" : "transform 0.2s" }}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-white/60">
        Потяните вверх или вниз, чтобы закрыть
      </p>
    </div>
  );
}
