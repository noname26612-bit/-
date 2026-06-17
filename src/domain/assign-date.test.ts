import { describe, it, expect } from "vitest";
import { resolveAssignedDate } from "./assign-date";

const today = new Date("2026-06-17T00:00:00.000Z");
const someDate = new Date("2026-06-10T00:00:00.000Z");

describe("resolveAssignedDate (п.1 авто-дата при назначении)", () => {
  it("назначение задачи БЕЗ даты → проставляем сегодня", () => {
    expect(resolveAssignedDate(null, "driver-1", today)).toEqual(today);
  });

  it("задача уже с датой → не трогаем (null)", () => {
    expect(resolveAssignedDate(someDate, "driver-1", today)).toBeNull();
  });

  it("снятие назначения (assigneeId=null) у задачи без даты → не датируем", () => {
    expect(resolveAssignedDate(null, null, today)).toBeNull();
  });

  it("снятие назначения у задачи с датой → не трогаем", () => {
    expect(resolveAssignedDate(someDate, null, today)).toBeNull();
  });

  it("нет валидной даты сегодня (today=null) → ничего не проставляем", () => {
    expect(resolveAssignedDate(null, "driver-1", null)).toBeNull();
  });
});
