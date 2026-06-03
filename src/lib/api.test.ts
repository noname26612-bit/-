import { describe, it, expect } from "vitest";
import { ok, fail } from "./api";

describe("контракт ответов API", () => {
  it("ok оборачивает данные в { data }", () => {
    expect(ok({ status: "ok" })).toEqual({ data: { status: "ok" } });
  });

  it("fail формирует { error: { code, message } }", () => {
    expect(fail("NOT_FOUND", "Не найдено")).toEqual({
      error: { code: "NOT_FOUND", message: "Не найдено" },
    });
  });
});
