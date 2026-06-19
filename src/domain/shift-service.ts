// Доменный сервис смен водителя (этап C, переработка механики). Открытие/подтверждение/закрытие.
// Изоляция (CLAUDE.md правило 1, ARCHITECTURE §6): для водителя driverId берётся ТОЛЬКО из сессии
// (аргумент), никогда из тела запроса. Подтверждение и список смен — только диспетчер/админ (гейт в
// route handler). Учёт отработанного/простоя по сменам — этап D, считается из openedAt/closedAt.
import { prisma } from "@/lib/prisma";
import { Errors } from "./errors";
import type { ShiftStatus } from "@/generated/prisma/enums";

export type Actor = { id: string; role: string };

export type ShiftView = {
  id: string;
  driverId: string;
  driverName: string | null;
  date: string; // YYYY-MM-DD (локальный день смены)
  status: ShiftStatus;
  openedAt: string; // ISO — фактическое начало
  confirmedAt: string | null;
  closedAt: string | null;
};

type ShiftRow = {
  id: string;
  driverId: string;
  date: Date;
  status: ShiftStatus;
  openedAt: Date;
  confirmedAt: Date | null;
  closedAt: Date | null;
  driver?: { name: string } | null;
};

// YYYY-MM-DD → Date в UTC-полночь (@db.Date хранит только дату). Совпадает с конвенцией задач.
function parseDate(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw Errors.validation("Некорректная дата");
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw Errors.validation("Некорректная дата");
  return d;
}

function toView(s: ShiftRow): ShiftView {
  return {
    id: s.id,
    driverId: s.driverId,
    driverName: s.driver?.name ?? null,
    date: s.date.toISOString().slice(0, 10),
    status: s.status,
    openedAt: s.openedAt.toISOString(),
    confirmedAt: s.confirmedAt ? s.confirmedAt.toISOString() : null,
    closedAt: s.closedAt ? s.closedAt.toISOString() : null,
  };
}

/** Смена водителя на день (или null). driverId — ТОЛЬКО из сессии. */
export async function getMyShift(driverId: string, today: string): Promise<ShiftView | null> {
  const date = parseDate(today);
  const shift = await prisma.shift.findUnique({ where: { driverId_date: { driverId, date } } });
  return shift ? toView(shift) : null;
}

/**
 * Открыть смену (водитель). Фиксирует фактическое начало рабочего дня = момент нажатия. Повторное
 * открытие в тот же день — идемпотентно (возвращаем текущую смену, не пересоздаём и не сдвигаем время).
 */
export async function openShift(driverId: string, today: string): Promise<ShiftView> {
  const date = parseDate(today);
  const existing = await prisma.shift.findUnique({ where: { driverId_date: { driverId, date } } });
  if (existing) return toView(existing);
  const created = await prisma.shift.create({
    data: { driverId, date, status: "REQUESTED", openedAt: new Date() },
  });
  return toView(created);
}

/** Закрыть смену (водитель). Допустимо из REQUESTED и OPEN. Повторное закрытие — идемпотентно. */
export async function closeShift(driverId: string, today: string): Promise<ShiftView> {
  const date = parseDate(today);
  const shift = await prisma.shift.findUnique({ where: { driverId_date: { driverId, date } } });
  if (!shift) throw Errors.notFound();
  if (shift.status === "CLOSED") return toView(shift);
  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  return toView(updated);
}

/** Подтвердить открытие смены (диспетчер/админ): REQUESTED → OPEN. Время начала не меняем. */
export async function confirmShift(shiftId: string, actor: Actor): Promise<ShiftView> {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw Errors.notFound();
  if (shift.status !== "REQUESTED") throw Errors.validation("Смена уже подтверждена или закрыта");
  const updated = await prisma.shift.update({
    where: { id: shiftId },
    data: { status: "OPEN", confirmedById: actor.id, confirmedAt: new Date() },
    include: { driver: { select: { name: true } } },
  });
  return toView(updated);
}

/** Смены за день для доски диспетчера (все статусы, с именем водителя). Только диспетчер/админ. */
export async function listShiftsForDate(today: string): Promise<ShiftView[]> {
  const date = parseDate(today);
  const shifts = await prisma.shift.findMany({
    where: { date },
    include: { driver: { select: { name: true } } },
    orderBy: [{ status: "asc" }, { openedAt: "asc" }],
  });
  return shifts.map(toView);
}
