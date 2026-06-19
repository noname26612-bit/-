import { describe, it, expect } from "vitest";
import { actState, actCountsForCompleteness } from "./act";

describe("actState — состояние акта по задаче (этап 14)", () => {
  it("тип без акта (требование не снималось) → NOT_REQUIRED", () => {
    expect(actState({ requiresSignedDoc: false, actWaivedNote: null, hasSignedDoc: false })).toBe(
      "NOT_REQUIRED",
    );
    // даже если по ошибке есть документ — раз акт не нужен, состояние «не требуется»
    expect(actState({ requiresSignedDoc: false, actWaivedNote: null, hasSignedDoc: true })).toBe(
      "NOT_REQUIRED",
    );
  });

  it("диспетчер снял требование акта (есть причина) → WAIVED", () => {
    expect(
      actState({ requiresSignedDoc: false, actWaivedNote: "подпишут по ЭДО", hasSignedDoc: false }),
    ).toBe("WAIVED");
  });

  it("акт нужен, не приложен → PENDING", () => {
    expect(actState({ requiresSignedDoc: true, actWaivedNote: null, hasSignedDoc: false })).toBe(
      "PENDING",
    );
  });

  it("акт нужен и приложен → COMPLETE", () => {
    expect(actState({ requiresSignedDoc: true, actWaivedNote: null, hasSignedDoc: true })).toBe(
      "COMPLETE",
    );
  });

  it("в базу комплектности (бонус §12.6) идут только PENDING и COMPLETE", () => {
    expect(actCountsForCompleteness("PENDING")).toBe(true);
    expect(actCountsForCompleteness("COMPLETE")).toBe(true);
    expect(actCountsForCompleteness("WAIVED")).toBe(false);
    expect(actCountsForCompleteness("NOT_REQUIRED")).toBe(false);
  });
});
