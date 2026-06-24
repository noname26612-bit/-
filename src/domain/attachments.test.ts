import { describe, it, expect } from "vitest";
import { validateUpload, MAX_UPLOAD_BYTES, matchesMagic } from "./attachments";

describe("validateUpload — приёмка файла", () => {
  it("принимает обычный jpeg", () => {
    expect(validateUpload("image/jpeg", 500_000)).toEqual({ ok: true });
  });
  it("принимает png/webp/heic", () => {
    expect(validateUpload("image/png", 1000).ok).toBe(true);
    expect(validateUpload("image/webp", 1000).ok).toBe(true);
    expect(validateUpload("image/heic", 1000).ok).toBe(true);
  });
  it("отклоняет не-картинку (например, pdf/svg/exe)", () => {
    expect(validateUpload("application/pdf", 1000)).toEqual({ ok: false, code: "BAD_MIME" });
    expect(validateUpload("image/svg+xml", 1000)).toEqual({ ok: false, code: "BAD_MIME" });
    expect(validateUpload("application/octet-stream", 1000)).toEqual({ ok: false, code: "BAD_MIME" });
  });
  it("отклоняет пустой файл", () => {
    expect(validateUpload("image/jpeg", 0)).toEqual({ ok: false, code: "EMPTY" });
  });
  it("отклоняет файл больше лимита (>15 МБ)", () => {
    expect(validateUpload("image/jpeg", MAX_UPLOAD_BYTES + 1)).toEqual({ ok: false, code: "TOO_LARGE" });
    expect(validateUpload("image/jpeg", MAX_UPLOAD_BYTES).ok).toBe(true); // ровно лимит — ок
  });

  // Акт-документ (Фаза 1.5): kind=DOCUMENT разрешает PDF и фото; PHOTO — только фото.
  it("акт (DOCUMENT) принимает pdf и фото", () => {
    expect(validateUpload("application/pdf", 1000, "DOCUMENT").ok).toBe(true);
    expect(validateUpload("image/jpeg", 1000, "DOCUMENT").ok).toBe(true);
  });
  it("акт (DOCUMENT) отклоняет посторонние типы и соблюдает лимит размера", () => {
    expect(validateUpload("application/octet-stream", 1000, "DOCUMENT")).toEqual({ ok: false, code: "BAD_MIME" });
    expect(validateUpload("application/pdf", MAX_UPLOAD_BYTES + 1, "DOCUMENT")).toEqual({ ok: false, code: "TOO_LARGE" });
  });
  it("обычное фото (PHOTO) по-прежнему не принимает pdf", () => {
    expect(validateUpload("application/pdf", 1000, "PHOTO")).toEqual({ ok: false, code: "BAD_MIME" });
  });
});

describe("matchesMagic — сверка сигнатуры с заявленным mime (preflight-аудит, defense-in-depth)", () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

  it("принимает корректные сигнатуры", () => {
    expect(matchesMagic(jpeg, "image/jpeg")).toBe(true);
    expect(matchesMagic(png, "image/png")).toBe(true);
    expect(matchesMagic(webp, "image/webp")).toBe(true);
    expect(matchesMagic(pdf, "application/pdf")).toBe(true);
  });

  it("отклоняет подделку: бинарник, названный image/jpeg", () => {
    expect(matchesMagic(png, "image/jpeg")).toBe(false); // PNG-байты под видом jpeg
    expect(matchesMagic(pdf, "image/png")).toBe(false);
    expect(matchesMagic(new Uint8Array([0x00, 0x01, 0x02, 0x03]), "image/jpeg")).toBe(false);
  });

  it("heic/heif не проверяем по сигнатуре (вариативный формат) — пропускаем", () => {
    expect(matchesMagic(new Uint8Array([0, 0, 0, 0]), "image/heic")).toBe(true);
    expect(matchesMagic(new Uint8Array([0, 0, 0, 0]), "image/heif")).toBe(true);
  });

  it("слишком короткий буфер не проходит проверку", () => {
    expect(matchesMagic(new Uint8Array([0xff, 0xd8]), "image/jpeg")).toBe(false);
    expect(matchesMagic(new Uint8Array([]), "application/pdf")).toBe(false);
  });

  it("неизвестный mime → false", () => {
    expect(matchesMagic(jpeg, "application/octet-stream")).toBe(false);
  });
});
