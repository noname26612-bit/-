// ЯДРО KPI (Фаза 1.5) — чистые функции без доступа к БД: утилиты времени/периода, детекторы
// трёх нарушений и прогрессивный расчёт зарплаты. Покрыто unit-тестами (kpi.test.ts).
// Продукт — PRD §12, модель — ARCHITECTURE §4а. Доступ к БД и изоляция — в kpi-service.ts.
import type { KpiMarkKind } from "@/generated/prisma/enums";

// Таймзона расчёта дат/периодов. Совпадает с cron (ARCHITECTURE §8). Москва — фиксированный UTC+3.
export const KPI_TZ = process.env.CRON_TZ ?? "Europe/Moscow";

// Виды авто-нарушений (детектируются системой). MANUAL — отдельный ручной вид, не детектируется.
export type AutoKind = "LATE" | "UNSIGNED_DOCS" | "MISSED_STOP";
export const AUTO_KINDS: AutoKind[] = ["LATE", "UNSIGNED_DOCS", "MISSED_STOP"];

export function isAutoKind(kind: KpiMarkKind): kind is AutoKind {
  return kind === "LATE" || kind === "UNSIGNED_DOCS" || kind === "MISSED_STOP";
}

// ───────────────────────────── Время и период ─────────────────────────────

/** Стенные часы момента в таймзоне tz: календарная дата (YYYY-MM-DD) и минуты от полуночи. */
function wallParts(instant: Date, tz: string): { dateKey: string; minutes: number } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(instant);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "00";
  let hour = get("hour");
  if (hour === "24") hour = "00"; // некоторые рантаймы дают 24 для полуночи
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(hour) * 60 + Number(get("minute")),
  };
}

/** Календарная дата момента (YYYY-MM-DD) в таймзоне tz. */
export function dateKeyInTz(instant: Date, tz: string = KPI_TZ): string {
  return wallParts(instant, tz).dateKey;
}

/** Месяц начисления «YYYY-MM» момента в таймзоне tz. */
export function periodOf(instant: Date, tz: string = KPI_TZ): string {
  return dateKeyInTz(instant, tz).slice(0, 7);
}

/** Календарная дата @db.Date (хранится UTC-полночью) как YYYY-MM-DD — без сдвига по зоне. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Полдень UTC указанного календарного дня — безопасный «момент дня» вдали от границ зоны. */
export function noonUtc(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

/** «HH:MM» (в т.ч. внутри «до 17:00») → минуты от полуночи; нечитаемое/невалидное → null. */
export function parseHHMM(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = /(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

// ───────────────────────────── Детекторы нарушений ─────────────────────────────

export type Candidate = {
  kind: AutoKind;
  driverId: string;
  taskId: string;
  occurredAt: Date;
  period: string;
  note: string;
};

const FINAL_FOR_MISSED = new Set(["DONE", "CANCELLED", "RESCHEDULED"]);

/** Опоздание: задача доведена до «На месте» позже окна времени (timeTo). PRD §12.1. */
export type LateInput = {
  driverId: string | null;
  taskId: string;
  scheduledDate: Date | null;
  timeTo: string | null;
  onSiteAt: Date | null; // момент первого перехода в ON_SITE (из журнала событий)
};

export function detectLate(t: LateInput, tz: string = KPI_TZ): Candidate | null {
  if (!t.driverId || !t.onSiteAt) return null; // не приехал или нет исполнителя
  const due = parseHHMM(t.timeTo);
  if (due === null) return null; // нет/нечитаемое окно времени — пропускаем (§8), Милена добавит вручную
  const onSite = wallParts(t.onSiteAt, tz);
  // Опорный день: дата задачи, а если её нет — день фактического приезда.
  const refDateKey = t.scheduledDate ? utcDateKey(t.scheduledDate) : onSite.dateKey;
  const late = onSite.dateKey > refDateKey || (onSite.dateKey === refDateKey && onSite.minutes > due);
  if (!late) return null;
  return {
    kind: "LATE",
    driverId: t.driverId,
    taskId: t.taskId,
    occurredAt: t.onSiteAt,
    period: periodOf(t.onSiteAt, tz),
    note: `Опоздание: на месте позже ${t.timeTo}`,
  };
}

/** Без акта: ремонтная задача завершена без подписанного документа-вложения. PRD §12.1. */
export type UnsignedDocInput = {
  driverId: string | null;
  taskId: string;
  requiresSignedDoc: boolean;
  status: string;
  completedAt: Date | null;
  hasSignedDoc: boolean; // есть ли вложение kind=DOCUMENT
};

export function detectUnsignedDoc(t: UnsignedDocInput, tz: string = KPI_TZ): Candidate | null {
  if (!t.driverId) return null;
  if (!t.requiresSignedDoc) return null; // метрика только для ремонтных типов
  if (t.status !== "DONE") return null; // нарушение фиксируется при завершении
  if (t.hasSignedDoc) return null;
  const occurredAt = t.completedAt ?? new Date();
  return {
    kind: "UNSIGNED_DOCS",
    driverId: t.driverId,
    taskId: t.taskId,
    occurredAt,
    period: periodOf(occurredAt, tz),
    note: "Завершено без подписанного акта",
  };
}

/** Невыполненная точка: назначенная на наступивший день задача не доведена до DONE
 *  (без переноса/отмены). PRD §12.1. asOf — момент прогона детектора (обычно ~23:30). */
export type MissedStopInput = {
  driverId: string | null;
  taskId: string;
  scheduledDate: Date | null;
  status: string;
};

export function detectMissedStop(t: MissedStopInput, asOf: Date, tz: string = KPI_TZ): Candidate | null {
  if (!t.driverId || !t.scheduledDate) return null; // без даты «точки дня» нет
  const dayKey = utcDateKey(t.scheduledDate);
  if (dayKey > dateKeyInTz(asOf, tz)) return null; // день ещё не наступил
  if (FINAL_FOR_MISSED.has(t.status)) return null; // доведена/перенесена/отменена — не нарушение
  const occurredAt = noonUtc(dayKey);
  return {
    kind: "MISSED_STOP",
    driverId: t.driverId,
    taskId: t.taskId,
    occurredAt,
    period: dayKey.slice(0, 7),
    note: "Точка дня не доведена до «Выполнено»",
  };
}

// ───────────────────────────── Прогрессивный расчёт ─────────────────────────────

export type KpiWeights = Record<AutoKind, number>;

export type CalcConfig = {
  weights: KpiWeights;
  progressionPercent: number; // шаг прогрессии, % (110 = ×1.10)
  progressionStartIndex: number; // с какого по счёту нарушения месяца включается прогрессия
  floor: "SALARY" | "ZERO"; // нижний порог итога
};

export type CalcMark = {
  id?: string;
  kind: KpiMarkKind;
  occurredAt: Date;
  manualAmount?: number | null; // только MANUAL: знаковая сумма (− штраф, + поощрение)
  taskId?: string | null;
  note?: string | null;
};

export type BreakdownItem = {
  markId?: string;
  kind: KpiMarkKind;
  taskId?: string | null;
  occurredAt: string; // ISO
  order: number | null; // порядковый номер штрафуемого нарушения месяца (для прогрессии)
  baseWeight: number | null; // вес до прогрессии (для авто-видов)
  multiplier: number | null; // множитель прогрессии
  amount: number; // знаковая сумма ₽: штраф < 0, поощрение > 0
  note?: string | null;
};

export type PayResult = {
  baseSalary: number;
  premiumBase: number;
  penalty: number; // сумма штрафов, положительное число
  bonus: number; // сумма ручных поощрений, положительное число
  premiumAfter: number; // премия после штрафов (может быть отрицательной — для отображения)
  total: number; // итог к выплате (не ниже нижнего порога)
  breakdown: BreakdownItem[];
};

/** Множитель прогрессии для нарушения с порядковым номером index (1-based). До startIndex
 *  множитель = 1.0, затем растёт геометрически с шагом percent. */
export function progressionMultiplier(index: number, percent: number, startIndex: number): number {
  const exponent = Math.max(0, index - (startIndex - 1));
  return Math.pow(percent / 100, exponent);
}

/** Сортировка отметок по времени возникновения (затем по id) — для устойчивой прогрессии. */
function byOccurrence(a: CalcMark, b: CalcMark): number {
  const d = a.occurredAt.getTime() - b.occurredAt.getTime();
  if (d !== 0) return d;
  return (a.id ?? "").localeCompare(b.id ?? "");
}

/**
 * Итог = Оклад + (Премия − прогрессивные штрафы) + ручные поощрения (PRD §12.3).
 * floor=SALARY (решение Артёма): штрафы максимум обнуляют премию, итог не ниже оклада.
 * floor=ZERO (историческое): премия может уйти в минус, итог не ниже 0.
 */
export function computePay(input: {
  baseSalary: number;
  premiumBase: number;
  marks: CalcMark[];
  config: CalcConfig;
}): PayResult {
  const { baseSalary, premiumBase, config } = input;
  const breakdown: BreakdownItem[] = [];

  // 1. Штрафуемые авто-нарушения, по порядку возникновения → прогрессивный штраф.
  const weighted = input.marks.filter((m) => isAutoKind(m.kind)).sort(byOccurrence);
  let penalty = 0;
  weighted.forEach((m, i) => {
    const order = i + 1;
    const base = config.weights[m.kind as AutoKind];
    const multiplier = progressionMultiplier(order, config.progressionPercent, config.progressionStartIndex);
    const amount = Math.round(base * multiplier);
    penalty += amount;
    breakdown.push({
      markId: m.id,
      kind: m.kind,
      taskId: m.taskId ?? null,
      occurredAt: m.occurredAt.toISOString(),
      order,
      baseWeight: base,
      multiplier,
      amount: -amount,
      note: m.note ?? null,
    });
  });

  // 2. Ручные отметки: положительная сумма — поощрение, отрицательная — ручной штраф.
  let bonus = 0;
  for (const m of input.marks.filter((x) => x.kind === "MANUAL").sort(byOccurrence)) {
    const amount = m.manualAmount ?? 0;
    if (amount >= 0) bonus += amount;
    else penalty += -amount;
    breakdown.push({
      markId: m.id,
      kind: m.kind,
      taskId: m.taskId ?? null,
      occurredAt: m.occurredAt.toISOString(),
      order: null,
      baseWeight: null,
      multiplier: null,
      amount,
      note: m.note ?? null,
    });
  }

  // 3. Сборка итога с учётом нижнего порога.
  const premiumAfter = premiumBase - penalty;
  const total =
    config.floor === "SALARY"
      ? baseSalary + Math.max(0, premiumAfter) + bonus
      : Math.max(0, baseSalary + premiumAfter + bonus);

  return { baseSalary, premiumBase, penalty, bonus, premiumAfter, total, breakdown };
}
