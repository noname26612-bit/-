// Чистые правила вложений (без prisma/fs) — тестируются юнитом. Серверные операции — в
// attachment-service.ts. Лимиты из PRD §9 и security-check.

// PRD §9: ~5–20 МБ/задача суммарно, фото сжимаются на клиенте до ~1920px. На один файл — ≤15 МБ
// (запас под несжатый кадр; security-check: «фото ≤ 15 МБ»).
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// Акт-документ (Фаза 1.5) — фото подписанного акта или PDF-скан.
const ALLOWED_DOC_MIME = new Set([...ALLOWED_MIME, "application/pdf"]);

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function isAllowedDocMime(mime: string): boolean {
  return ALLOWED_DOC_MIME.has(mime);
}

export type UploadKind = "PHOTO" | "DOCUMENT";

export type UploadVerdict =
  | { ok: true }
  | { ok: false; code: "EMPTY" | "BAD_MIME" | "TOO_LARGE" };

/** Валидация загружаемого файла: непустой, разрешённый mime (фото — только image; акт — image+pdf),
 *  в пределах лимита размера. */
export function validateUpload(mimeType: string, sizeBytes: number, kind: UploadKind = "PHOTO"): UploadVerdict {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { ok: false, code: "EMPTY" };
  const mimeOk = kind === "DOCUMENT" ? isAllowedDocMime(mimeType) : isAllowedImageMime(mimeType);
  if (!mimeOk) return { ok: false, code: "BAD_MIME" };
  if (sizeBytes > MAX_UPLOAD_BYTES) return { ok: false, code: "TOO_LARGE" };
  return { ok: true };
}

/**
 * Сверка реальной сигнатуры (magic bytes) первых байтов файла с ЗАЯВЛЕННЫМ mime (preflight-аудит,
 * defense-in-depth): file.type приходит от клиента, и без этой проверки бинарник можно загрузить под
 * видом image/jpeg. Для HEIC/HEIF не проверяем (ftyp-боксы вариативны) — оставляем по заявленному mime.
 * Возвращает true, если сигнатура соответствует mime или тип не подлежит проверке.
 */
export function matchesMagic(bytes: Uint8Array, mime: string): boolean {
  const b = bytes;
  switch (mime) {
    case "image/jpeg":
      return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/webp":
      // RIFF....WEBP
      return (
        b.length >= 12 &&
        b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
      );
    case "application/pdf":
      // %PDF-
      return b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
    case "image/heic":
    case "image/heif":
      return true; // не проверяем — вариативный формат
    default:
      return false;
  }
}
