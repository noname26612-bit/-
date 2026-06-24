import { describe, it, expect } from "vitest";
import { parseDateInput } from "./date-input";

const TODAY = "2026-06-24"; // среда

describe("parseDateInput — умный ввод даты (Артём 24.06)", () => {
  it("относительные слова", () => {
    expect(parseDateInput("сегодня", TODAY)).toBe("2026-06-24");
    expect(parseDateInput("вчера", TODAY)).toBe("2026-06-23");
    expect(parseDateInput("завтра", TODAY)).toBe("2026-06-25");
    expect(parseDateInput("послезавтра", TODAY)).toBe("2026-06-26");
    expect(parseDateInput("посл", TODAY)).toBe("2026-06-26");
  });

  it("регистр и пробелы не мешают", () => {
    expect(parseDateInput("  Завтра ", TODAY)).toBe("2026-06-25");
    expect(parseDateInput("ПОСЛЕЗАВТРА", TODAY)).toBe("2026-06-26");
  });

  it("смещение в днях +N / -N", () => {
    expect(parseDateInput("+3", TODAY)).toBe("2026-06-27");
    expect(parseDateInput("-1", TODAY)).toBe("2026-06-23");
    expect(parseDateInput("+7", TODAY)).toBe("2026-07-01"); // переход через месяц
  });

  it("полная дата дд.мм.гггг (любой разделитель)", () => {
    expect(parseDateInput("20.06.2026", TODAY)).toBe("2026-06-20");
    expect(parseDateInput("1.7.2026", TODAY)).toBe("2026-07-01");
    expect(parseDateInput("05/12/2026", TODAY)).toBe("2026-12-05");
  });

  it("дд.мм — текущий год; дд — текущий месяц", () => {
    expect(parseDateInput("26.06", TODAY)).toBe("2026-06-26");
    expect(parseDateInput("26", TODAY)).toBe("2026-06-26");
    expect(parseDateInput("1.7", TODAY)).toBe("2026-07-01");
  });

  it("ISO гггг-мм-дд (вставка/совместимость)", () => {
    expect(parseDateInput("2026-06-20", TODAY)).toBe("2026-06-20");
    expect(parseDateInput("2026-6-1", TODAY)).toBe("2026-06-01");
  });

  it("нераспознанное и невалидное → null", () => {
    expect(parseDateInput("", TODAY)).toBeNull();
    expect(parseDateInput("абвгд", TODAY)).toBeNull();
    expect(parseDateInput("32.01.2026", TODAY)).toBeNull(); // нет 32-го
    expect(parseDateInput("10.13.2026", TODAY)).toBeNull(); // нет 13-го месяца
    expect(parseDateInput("29.02.2026", TODAY)).toBeNull(); // 2026 не високосный
  });
});
