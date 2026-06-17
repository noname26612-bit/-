// Планировщик node-cron в процессе приложения (ARCHITECTURE §8). Запускается из
// src/instrumentation.ts (register) только в Node-рантайме. Один процесс на проде — иначе
// задачи задвоятся (deploy-release: не запускать в кластере/нескольких репликах).
import cron from "node-cron";
import { runMorningReminders, runPassWarnings } from "@/domain/push-service";

const TZ = process.env.CRON_TZ ?? "Europe/Moscow";
const g = globalThis as typeof globalThis & { __vanmarkCronStarted?: boolean };

function schedule(name: string, expr: string, job: () => Promise<void>): void {
  if (cron.getTasks().has(name)) return; // защита от повторной регистрации (register может вызваться >1 раза)
  cron.schedule(
    expr,
    async () => {
      try {
        await job();
      } catch (e) {
        console.error(`[cron] ${name} failed`, e);
      }
    },
    { name, timezone: TZ, noOverlap: true },
  );
}

if (!g.__vanmarkCronStarted) {
  g.__vanmarkCronStarted = true;
  schedule("morning-reminder", "0 8 * * *", runMorningReminders); // 08:00 — водителям
  schedule("pass-warning", "0 16 * * *", runPassWarnings); // 16:00 — диспетчеру про пропуска
  console.log(`[cron] scheduled 08:00 + 16:00 (${TZ})`);
}

export {};
