import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { listShiftsForDate } from "@/domain/shift-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/shifts?date=YYYY-MM-DD — смены водителей за день для доски диспетчера. Только Д/А
// (requireDispatcher): водителю эндпоинт недоступен (403).
export async function GET(req: Request) {
  try {
    await requireDispatcher();
    const date = new URL(req.url).searchParams.get("date") ?? "";
    return NextResponse.json(ok(await listShiftsForDate(date)));
  } catch (e) {
    return errorResponse(e);
  }
}
