// Подписи, цвета и форматтеры для интерфейса задач. Цвета статусов — строго из ui-guidelines.
// Классы записаны строками-литералами, чтобы Tailwind их увидел и сгенерировал.
//
// Палитра «спокойная» (редизайн 18.06, решение Артёма): уходим от радуги из 9 цветов к графитовой
// базе с тремя смысловыми акцентами — зелёный = готово (Выполнена), красный = сорвано (Отменена),
// янтарный = требует внимания сейчас (Ждёт / нужен пропуск). Все остальные статусы — нейтральный
// графит, различаются словом-подписью. Бейджи контурные (border + text), без заливок и «таблеток».
import type { PassStatus, PaymentType, TaskStatus } from "@/generated/prisma/enums";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  NEW: "Новая",
  ASSIGNED: "Назначена",
  ACCEPTED: "Принята",
  EN_ROUTE: "В пути",
  ON_SITE: "На месте",
  DONE: "Выполнена",
  ON_HOLD: "Ждёт",
  RESCHEDULED: "Перенесена",
  CANCELLED: "Отменена",
};

// Бейдж статуса — контурная метка (рамка + текст, прозрачный фон). Графит для нейтральных,
// акцент только у «готово» (зелёный), «сорвано» (красный) и «внимание» (янтарь).
export const STATUS_BADGE: Record<TaskStatus, string> = {
  NEW: "border border-slate-300 text-slate-600",
  ASSIGNED: "border border-slate-300 text-slate-600",
  ACCEPTED: "border border-slate-300 text-slate-600",
  EN_ROUTE: "border border-slate-300 text-slate-600",
  ON_SITE: "border border-slate-300 text-slate-600",
  DONE: "border border-green-600 text-green-700",
  ON_HOLD: "border border-amber-500 text-amber-700",
  RESCHEDULED: "border border-slate-300 text-slate-600",
  CANCELLED: "border border-red-600 text-red-700",
};

// Левая полоса-«корешок» карточки. Нейтральный графит для большинства; цвет загорается только
// у трёх смысловых состояний (готово / сорвано / внимание).
export const STATUS_BAR: Record<TaskStatus, string> = {
  NEW: "bg-slate-300",
  ASSIGNED: "bg-slate-300",
  ACCEPTED: "bg-slate-300",
  EN_ROUTE: "bg-slate-300",
  ON_SITE: "bg-slate-300",
  DONE: "bg-green-600",
  ON_HOLD: "bg-amber-600",
  RESCHEDULED: "bg-slate-300",
  CANCELLED: "bg-red-600",
};

export const PASS_LABEL: Record<PassStatus, string> = {
  NOT_NEEDED: "Пропуск не нужен",
  NEEDED: "Нужен пропуск!",
  ORDERED: "Пропуск заказан",
};

// Пропуск: «нужен» — янтарный сигнал внимания; «заказан» — спокойный графит (вопрос закрыт,
// подсвечивать нечего). Контурные.
export const PASS_BADGE: Record<PassStatus, string> = {
  NOT_NEEDED: "border border-slate-300 text-slate-500",
  NEEDED: "border border-amber-500 text-amber-700",
  ORDERED: "border border-slate-300 text-slate-600",
};

export const PAYMENT_LABEL: Record<PaymentType, string> = {
  NONE: "Без оплаты",
  OFFICE: "Через офис",
  ON_SITE: "Оплата на месте",
};

export const STATUS_ORDER: TaskStatus[] = [
  "NEW",
  "ASSIGNED",
  "ACCEPTED",
  "EN_ROUTE",
  "ON_SITE",
  "ON_HOLD",
  "RESCHEDULED",
  "DONE",
  "CANCELLED",
];

/** ISO-дату (или Date) — в «дд.мм.гггг». Берём части строки, чтобы не было сдвига по таймзоне. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const iso = typeof value === "string" ? value : value.toISOString();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "—";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** Дата → короткий «дд.мм». */
export function formatDateShort(value: string | Date | null | undefined): string {
  const full = formatDate(value);
  return full === "—" ? full : full.slice(0, 5);
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

/** ISO datetime → «дд.мм чч:мм» (для ленты истории), в местной зоне. */
export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ссылка для кнопки «Навигатор»: готовый deeplink из задачи (Яндекс/2ГИС) или, если его нет,
 *  поиск по тексту адреса в Яндекс.Картах — чтобы кнопка работала всегда. */
export function navUrl(addressLink: string | null | undefined, address: string): string {
  const link = addressLink?.trim();
  if (link) return link;
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
}

/** Сегодня в формате YYYY-MM-DD (местная зона) — для фильтра доски. */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Сдвиг даты «YYYY-MM-DD» на n дней (UTC — без сдвига зоны). Для горизонта доски/планирования. */
export function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const MONTHS_RU = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

/** Период «YYYY-MM» → «июнь 2026» (для KPI/зарплаты). */
export function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return period;
  return `${MONTHS_RU[m - 1]} ${y}`;
}

/** Сдвиг периода «YYYY-MM» на delta месяцев (для переключателя месяца). */
export function shiftPeriod(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
