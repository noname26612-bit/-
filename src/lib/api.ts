// Единый контракт ответов API: { data } | { error: { code, message } }.
// См. ARCHITECTURE §7. Хелперы чистые — обёртку NextResponse.json делает handler.

export type ApiError = { code: string; message: string };
export type ApiEnvelope<T> = { data: T } | { error: ApiError };

export function ok<T>(data: T): { data: T } {
  return { data };
}

export function fail(code: string, message: string): { error: ApiError } {
  return { error: { code, message } };
}
