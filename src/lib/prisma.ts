// Единый Prisma-клиент (singleton). Prisma 7: генератор `prisma-client` + queryCompiler,
// поэтому подключение к Postgres идёт через driver-адаптер @prisma/adapter-pg.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL не задан — проверь .env");
}

const adapter = new PrismaPg(connectionString);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// В dev переиспользуем клиент между hot-reload, чтобы не плодить пулы подключений.
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
