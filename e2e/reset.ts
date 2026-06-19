// Сброс «зависших» активных задач перед e2e-тестами. Нужен из-за правила «одна активная задача»
// (этап B): тесты делят ОДНУ dev-БД и общий ростер водителей, поэтому накопленные/оставленные
// прошлыми тестами задачи в IN_PROGRESS иначе дают 409 ACTIVE_TASK_EXISTS при взятии в работу.
// Перед каждым тестом гасим все IN_PROGRESS → DONE: водители стартуют без активной задачи.
//
// Доступ к БД — через `docker exec` в контейнер Postgres (как в docker-compose проекта), чтобы не
// тянуть драйвер БД в e2e: generated Prisma client несовместим с ESM-загрузчиком playwright, а
// добавлять отдельный pg-пакет ради теста не хотим (CLAUDE.md правило 6). e2e гоняются локально.
import { execSync } from "node:child_process";

const CONTAINER = process.env.POSTGRES_CONTAINER ?? "vanmark-postgres";
const SQL = `UPDATE \\"Task\\" SET status='DONE', \\"completedAt\\"=now() WHERE status='IN_PROGRESS'`;

export async function resetActiveTasks(): Promise<void> {
  execSync(`docker exec ${CONTAINER} psql -U vanmark -d vanmark -c "${SQL}"`, { stdio: "ignore" });
}
