import { describe, it, expect } from "vitest";
import { overdueWhere, tomorrowPassWhere } from "./attention";

const TODAY = new Date("2026-06-17T00:00:00.000Z");
const TOMORROW = new Date("2026-06-18T00:00:00.000Z");

describe("overdueWhere — просроченные задачи", () => {
  it("берёт только дату строго меньше сегодня", () => {
    const w = overdueWhere(TODAY);
    expect(w.scheduledDate).toEqual({ lt: TODAY });
  });

  it("исключает завершённые (DONE/CANCELLED)", () => {
    const w = overdueWhere(TODAY);
    expect(w.status).toEqual({ notIn: ["DONE", "CANCELLED"] });
  });

  it("не ограничивает пропуск (любой passStatus просрочки важен)", () => {
    const w = overdueWhere(TODAY);
    expect(w.passStatus).toBeUndefined();
  });
});

describe("tomorrowPassWhere — незаказанные пропуска на завтра (PRD §6)", () => {
  it("берёт ровно завтрашнюю дату", () => {
    const w = tomorrowPassWhere(TOMORROW);
    expect(w.scheduledDate).toBe(TOMORROW);
  });

  it("только пропуск «нужен, не заказан»", () => {
    const w = tomorrowPassWhere(TOMORROW);
    expect(w.passStatus).toBe("NEEDED");
  });

  it("исключает завершённые", () => {
    const w = tomorrowPassWhere(TOMORROW);
    expect(w.status).toEqual({ notIn: ["DONE", "CANCELLED"] });
  });
});
