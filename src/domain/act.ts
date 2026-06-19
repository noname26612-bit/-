// Состояние акта по задаче (этап 14, PRD §13). Чистая функция — без БД и UI, тестируется юнитом.
// Источник правды «акт приложен» — наличие вложения kind=DOCUMENT (ровно тот же признак, что у
// KPI-детектора UNSIGNED_DOCS, см. kpi.ts / kpi-service.ts: hasSignedDoc). Требование акта берётся
// со СНИМКА на задаче (Task.requiresSignedDoc): диспетчер мог снять его галочкой «акт не нужен»
// при создании — тогда заполнен actWaivedNote с причиной (PRD §4). Ведомость/расценка живут
// отдельно (worksheetStatus) и на состояние акта не влияют: опись-типы (аренда/забор) акт требуют,
// но расценки не имеют.

export type ActState =
  | "NOT_REQUIRED" // тип без акта, требование не снималось — акт не нужен
  | "WAIVED" // акт ожидался по типу, но диспетчер снял его на заявке (есть причина)
  | "PENDING" // акт нужен, но ещё не приложен
  | "COMPLETE"; // акт нужен и приложен (есть DOCUMENT-вложение)

export type ActInput = {
  requiresSignedDoc: boolean;
  actWaivedNote: string | null;
  hasSignedDoc: boolean;
};

/** Состояние акта по задаче. См. ActState. */
export function actState(t: ActInput): ActState {
  if (!t.requiresSignedDoc) return t.actWaivedNote ? "WAIVED" : "NOT_REQUIRED";
  return t.hasSignedDoc ? "COMPLETE" : "PENDING";
}

/** Учитывается ли задача в базе комплектности актов (PENDING/COMPLETE) — для бонуса §12.6 (этап 15). */
export function actCountsForCompleteness(state: ActState): boolean {
  return state === "PENDING" || state === "COMPLETE";
}
