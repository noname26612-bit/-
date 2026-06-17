// Сериализуемые типы KPI для границы сервер↔клиент (как task-dto). Без импортов prisma-клиента,
// чтобы безопасно использоваться в клиентских компонентах. Источник арифметики — src/domain/kpi.ts.
import type { KpiMarkKind, KpiMarkStatus, PayoutFloor } from "@/generated/prisma/enums";
import type { BreakdownItem } from "@/domain/kpi";

export type { BreakdownItem };

export type MarkView = {
  id: string;
  driverId: string;
  driverName: string;
  taskId: string | null;
  taskNumber: number | null;
  taskTitle: string | null;
  period: string;
  kind: KpiMarkKind;
  status: KpiMarkStatus;
  occurredAt: string;
  note: string | null;
  manualAmount: number | null;
  resolvedById: string | null;
  resolvedAt: string | null;
};

export type DriverPayrollView = {
  driverId: string;
  driverName: string;
  period: string;
  closed: boolean;
  baseSalary: number;
  premiumBase: number;
  penalty: number;
  bonus: number;
  premiumAfter: number;
  total: number;
  breakdown: BreakdownItem[];
  marks: MarkView[];
};

export type KpiOverview = {
  period: string;
  closed: boolean;
  candidates: MarkView[];
  drivers: DriverPayrollView[];
};

export type PayProfileView = {
  driverId: string;
  driverName: string;
  login: string;
  baseSalary: number;
  premiumBase: number;
  isActive: boolean;
};

export type KpiRuleView = { kind: KpiMarkKind; weight: number; isActive: boolean };

export type KpiSettingsView = {
  progressionPercent: number;
  progressionStartIndex: number;
  floor: PayoutFloor;
};

// Подписи видов нарушений для интерфейса (русский, кратко).
export const KPI_KIND_LABEL: Record<KpiMarkKind, string> = {
  LATE: "Опоздание",
  UNSIGNED_DOCS: "Без акта",
  MISSED_STOP: "Невыполненная точка",
  MANUAL: "Ручная отметка",
};

// Цвет бейджа вида нарушения (палитра ui-guidelines: оранжевый/красный/жёлтый/нейтральный).
export const KPI_KIND_BADGE: Record<KpiMarkKind, string> = {
  LATE: "bg-orange-100 text-orange-700",
  UNSIGNED_DOCS: "bg-red-100 text-red-700",
  MISSED_STOP: "bg-amber-100 text-amber-800",
  MANUAL: "bg-slate-100 text-slate-700",
};
