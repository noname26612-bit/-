// Next.js instrumentation: точка инициализации серверного процесса. Стартуем планировщик
// node-cron (ARCHITECTURE §8) только в Node-рантайме; динамический import — чтобы Edge-бандл
// не тянул node-cron/prisma.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/cron");
  }
}
