"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, todayISO, addDaysISO } from "@/lib/task-ui";
import { parseDateInput } from "@/lib/date-input";

// Удобный ввод даты (решение Артёма 24.06): поле с печатью (умный разбор «вчера/+3/дд.мм» по Enter
// и уходу из поля), пресеты Вчера·Сегодня·Завтра·Послезавтра и единый календарь (Пн-первый), одинаковый
// во всех браузерах. Значение наружу — YYYY-MM-DD (как было у нативного input type=date), поэтому
// API/БД не меняются. Заменяет нативный date-input во всех формах.

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];
const PRESETS = [
  { label: "Вчера", offset: -1 },
  { label: "Сегодня", offset: 0 },
  { label: "Завтра", offset: 1 },
  { label: "Послезавтра", offset: 2 },
];

export function DateField({
  value,
  onChange,
  disabled,
  testId,
  autoFocus,
  className,
}: {
  value: string; // YYYY-MM-DD или ""
  onChange: (v: string) => void;
  disabled?: boolean;
  testId?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const today = todayISO();
  const [text, setText] = useState(value ? formatDate(value) : "");
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value || today).slice(0, 7)); // YYYY-MM
  const ref = useRef<HTMLDivElement>(null);

  // Внешнее изменение value (сброс формы, выбор пресета снаружи) → синхронизируем поле без эффекта
  // (паттерн React «adjust state on prop change»: setState во время рендера, не в useEffect).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value ? formatDate(value) : "");
    if (value) setViewMonth(value.slice(0, 7));
  }

  // Разобрать набранный текст: «вчера/+3/дд.мм/гггг-мм-дд» → дата; не распознали — откат к value.
  function commitText() {
    const raw = text.trim();
    if (raw === "") {
      if (value !== "") onChange("");
      return;
    }
    const parsed = parseDateInput(raw, today);
    if (parsed) {
      if (parsed !== value) onChange(parsed);
      setText(formatDate(parsed));
      setViewMonth(parsed.slice(0, 7));
    } else {
      setText(value ? formatDate(value) : "");
    }
  }

  // Закрытие поповера по клику вне + разбор набранного (уход из поля, как обещали Артёму).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        commitText();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text, value]);

  function pick(iso: string) {
    onChange(iso);
    setText(formatDate(iso));
    setViewMonth(iso.slice(0, 7));
    setOpen(false);
  }

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <div className="flex h-10 items-center rounded-lg border border-neutral-300 focus-within:border-neutral-900">
        <input
          type="text"
          inputMode="numeric"
          data-testid={testId}
          value={text}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="дд.мм.гггг"
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText();
              setOpen(false);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-full flex-1 rounded-lg bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-label="Открыть календарь"
          className="px-2.5 text-neutral-400 hover:text-neutral-700"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      {open && !disabled ? (
        <div className="absolute z-20 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-lg">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => pick(addDaysISO(today, p.offset))}
                className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-neutral-800">{monthTitle(viewMonth)}</span>
            <button
              type="button"
              aria-label="Следующий месяц"
              onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-[11px] text-neutral-400">
                {w}
              </span>
            ))}
            {grid.map((iso, i) =>
              iso === "" ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(iso)}
                  className={cn(
                    "rounded-md py-1 text-sm",
                    iso === value
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-100",
                    iso === today && iso !== value ? "ring-1 ring-inset ring-neutral-300" : "",
                  )}
                >
                  {Number(iso.slice(8, 10))}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Хелперы месяца — все на UTC, чтобы не было сдвига по таймзоне.
function shiftMonth(ym: string, delta: number): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthTitle(ym: string): string {
  const m = Number(ym.slice(5, 7));
  return `${MONTHS[m - 1]} ${ym.slice(0, 4)}`;
}

// Сетка 6×7 (Пн-первый): ISO-даты месяца + пустые слоты "" в начале.
function buildMonthGrid(ym: string): string[] {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Пн-первый
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: string[] = [];
  for (let i = 0; i < lead; i++) cells.push("");
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}
