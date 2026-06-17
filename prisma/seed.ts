// Сид пользователей (этап 1). Идемпотентный: upsert по login, повторный запуск не плодит дубли.
// Пароль берём из SEED_PASSWORD (см. .env.example) — в коде паролей нет (CLAUDE.md правило 5).
// Запуск: `pnpm db:seed` (нужен поднятый Postgres и применённые миграции).
import "dotenv/config";
import { PrismaClient, type Role } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "@/lib/password";
import { seedKpi } from "./seed-kpi";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL не задан — проверь .env");
}

const seedPassword = process.env.SEED_PASSWORD;
if (!seedPassword) {
  throw new Error("SEED_PASSWORD не задан — задай в .env (см. .env.example).");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

type SeedUser = {
  login: string; // только латиница, в нижнем регистре (вход нормализует к lower-case)
  name: string;
  role: Role;
  canLogin?: boolean; // по умолчанию true
};

// Команда из ROADMAP этап 1 + внешний перевозчик из PRD §2 (без права входа).
const USERS: SeedUser[] = [
  { login: "artem", name: "Артём", role: "ADMIN" },
  { login: "milena", name: "Милена", role: "DISPATCHER" },
  { login: "kashirskiy", name: "Алексей Каширский", role: "DRIVER" },
  { login: "pisarev", name: "Алексей Писарев", role: "DRIVER" },
  // Султан — наёмный перевозчик: задачи на него ведёт диспетчер, сам не входит.
  { login: "sultan", name: "Султан (внешний перевозчик)", role: "DRIVER", canLogin: false },
];

// Типы задач (PRD §3). requiresPhoto — по PRD §5 (фото обязательно для аренды, забора/возврата
// из ремонта, гарантийной замены, выездного ремонта; для ТК/СДЭК — нет). Иконки — имена lucide.
// requiresSignedDoc (Фаза 1.5, PRD §12.1) — ремонтно-арендные типы, где ожидается подписанный
// акт приёма-передачи: аренда, забор/возврат из ремонта, гарантийная замена, выездной ремонт.
// Это НЕ гейт завершения — отсутствие акта = нарушение KPI UNSIGNED_DOCS (см. src/domain/kpi.ts).
const TASK_TYPES: { name: string; icon: string; requiresPhoto: boolean; requiresSignedDoc: boolean }[] = [
  { name: "Доставка в аренду", icon: "truck", requiresPhoto: true, requiresSignedDoc: true },
  { name: "Забор в ремонт", icon: "package-minus", requiresPhoto: true, requiresSignedDoc: true },
  { name: "Доставка/возврат из ремонта", icon: "package-check", requiresPhoto: true, requiresSignedDoc: true },
  { name: "Отвезти в ТК", icon: "warehouse", requiresPhoto: false, requiresSignedDoc: false },
  { name: "Забрать СДЭК/посылку", icon: "package", requiresPhoto: false, requiresSignedDoc: false },
  { name: "Выездной ремонт / диагностика", icon: "wrench", requiresPhoto: true, requiresSignedDoc: true },
  { name: "Гарантийная замена", icon: "replace", requiresPhoto: true, requiresSignedDoc: true },
  { name: "Доставка проданного", icon: "package-plus", requiresPhoto: true, requiresSignedDoc: false },
  { name: "Закупка/выкуп станка", icon: "shopping-cart", requiresPhoto: true, requiresSignedDoc: false },
  { name: "Прочее", icon: "ellipsis", requiresPhoto: false, requiresSignedDoc: false },
];

// KPI / зарплата (Фаза 1.5): дефолты и логика — в prisma/seed-kpi.ts (там же безопасный
// прод-сид `pnpm db:seed:kpi`, не трогающий пользователей). Здесь только вызываем seedKpi().

// Пароль учётки: индивидуальный SEED_PASSWORD_<LOGIN> (если задан) приоритетнее общего SEED_PASSWORD.
// На локалке достаточно общего; на проде Артём может задать каждому свой (см. deploy/.env.prod.example).
function passwordFor(login: string, fallback: string): string {
  return process.env[`SEED_PASSWORD_${login.toUpperCase()}`] || fallback;
}

async function main(defaultPassword: string): Promise<void> {
  for (const u of USERS) {
    const canLogin = u.canLogin ?? true;
    const passwordHash = await hashPassword(passwordFor(u.login, defaultPassword));
    await prisma.user.upsert({
      where: { login: u.login },
      update: { name: u.name, role: u.role, canLogin, isActive: true, passwordHash },
      create: { login: u.login, name: u.name, role: u.role, canLogin, passwordHash },
    });
    console.log(`  ✓ ${u.login} — ${u.name} (${u.role}${canLogin ? "" : ", без входа"})`);
  }

  for (const [i, t] of TASK_TYPES.entries()) {
    await prisma.taskType.upsert({
      where: { name: t.name },
      update: {
        icon: t.icon,
        requiresPhoto: t.requiresPhoto,
        requiresSignedDoc: t.requiresSignedDoc,
        sortOrder: i + 1,
        isActive: true,
      },
      create: {
        name: t.name,
        icon: t.icon,
        requiresPhoto: t.requiresPhoto,
        requiresSignedDoc: t.requiresSignedDoc,
        sortOrder: i + 1,
      },
    });
  }
  console.log(`  ✓ типы задач: ${TASK_TYPES.length}`);

  await seedKpi(prisma);
}

main(seedPassword)
  .then(() => console.log("Сид пользователей готов."))
  .catch((error) => {
    console.error("Сид упал:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
