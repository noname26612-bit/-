import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { getKpiOverview } from "@/domain/kpi-service";
import { periodOf } from "@/domain/kpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/kpi/overview?period=YYYY-MM — картина месяца: кандидаты в нарушения (для диспетчера/админа)
// и расчёт по водителям. Зарплату (оклад/премия/итог) отдаём ТОЛЬКО админу — диспетчер её не получает
// даже в ответе API (доработка №10, решение Артёма 23.06). Роль берём из сессии, не из запроса.
export async function GET(req: Request) {
  try {
    const user = await requireDispatcher();
    const period = new URL(req.url).searchParams.get("period") || periodOf(new Date());
    const payrollVisible = user.role === "ADMIN";
    return NextResponse.json(ok(await getKpiOverview(period, { payrollVisible })));
  } catch (e) {
    return errorResponse(e);
  }
}
