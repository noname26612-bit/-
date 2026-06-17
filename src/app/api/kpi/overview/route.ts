import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { getKpiOverview } from "@/domain/kpi-service";
import { periodOf } from "@/domain/kpi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/kpi/overview?period=YYYY-MM — картина месяца для экрана Милены: кандидаты в нарушения
// и расчёт по всем водителям. Только диспетчер/админ. (ARCHITECTURE §7: объединяет candidates+statements.)
export async function GET(req: Request) {
  try {
    await requireDispatcher();
    const period = new URL(req.url).searchParams.get("period") || periodOf(new Date());
    return NextResponse.json(ok(await getKpiOverview(period)));
  } catch (e) {
    return errorResponse(e);
  }
}
