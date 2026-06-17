import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDriver, errorResponse } from "@/lib/api-route";
import { getMyKpi } from "@/domain/kpi-service";
import { periodOf } from "@/domain/kpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/my/kpi?period=YYYY-MM — расчёт водителя ИЗ СЕССИИ. Изоляция (CLAUDE.md §1, ARCHITECTURE §6):
// driverId = user.id из requireDriver(), никогда из запроса — чужой расчёт получить нельзя.
export async function GET(req: Request) {
  try {
    const user = await requireDriver();
    const period = new URL(req.url).searchParams.get("period") || periodOf(new Date());
    return NextResponse.json(ok(await getMyKpi(user.id, period)));
  } catch (e) {
    return errorResponse(e);
  }
}
