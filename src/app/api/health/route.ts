import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

// Health не кэшируется (в Next 16 GET-хендлеры и так динамические — фиксируем явно)
// и должен работать в Node-рантайме (нужен Prisma).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(ok({ status: "ok", db: "up" }));
  } catch {
    return NextResponse.json(fail("DB_UNAVAILABLE", "База данных недоступна"), {
      status: 503,
    });
  }
}
