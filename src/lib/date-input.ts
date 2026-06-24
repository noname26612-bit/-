// Умный разбор введённой даты для DateField (решение Артёма 24.06). Поддерживает:
//  • слова: «вчера», «сегодня», «завтра», «послезавтра» (и сокращение «посл»);
//  • смещение в днях: «+3», «-1»;
//  • полную дату: «дд.мм.гггг» (разделители . / -);
//  • «дд.мм» — текущий год; «дд» — текущий месяц;
//  • ISO «гггг-мм-дд» (для вставки/совместимости).
// Разбор вызывается по Enter / уходу из поля, НЕ на лету (a11y и практики ввода даты).
// Возвращает дату в формате YYYY-MM-DD или null, если строку распознать не удалось.
import { addDaysISO } from "@/lib/task-ui";

function isValidYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseDateInput(raw: string, todayIso: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;

  if (s === "сегодня") return todayIso;
  if (s === "вчера") return addDaysISO(todayIso, -1);
  if (s === "завтра") return addDaysISO(todayIso, 1);
  if (s === "послезавтра" || s === "посл") return addDaysISO(todayIso, 2);

  const rel = /^([+-]\d{1,3})$/.exec(s);
  if (rel) return addDaysISO(todayIso, Number.parseInt(rel[1], 10));

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) {
    const [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    return isValidYmd(y, m, d) ? ymd(y, m, d) : null;
  }

  const cy = Number(todayIso.slice(0, 4));
  const cm = Number(todayIso.slice(5, 7));

  const full = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s);
  if (full) {
    const [d, m, y] = [Number(full[1]), Number(full[2]), Number(full[3])];
    return isValidYmd(y, m, d) ? ymd(y, m, d) : null;
  }

  const dm = /^(\d{1,2})[./-](\d{1,2})$/.exec(s);
  if (dm) {
    const [d, m] = [Number(dm[1]), Number(dm[2])];
    return isValidYmd(cy, m, d) ? ymd(cy, m, d) : null;
  }

  const dd = /^(\d{1,2})$/.exec(s);
  if (dd) {
    const d = Number(dd[1]);
    return isValidYmd(cy, cm, d) ? ymd(cy, cm, d) : null;
  }

  return null;
}
