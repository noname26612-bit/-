import Link from "next/link";
import type { ReactNode } from "react";

// Крупная кнопка-возврат для водительских экранов (телефон): заметный текст и большой тач-таргет.
// Размер задаётся здесь в одном месте — чтобы менять единообразно во всех «назад».
export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2.5 text-2xl font-medium text-neutral-700 active:bg-neutral-100 ${className}`.trim()}
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
