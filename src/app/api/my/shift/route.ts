import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDriver, errorResponse, readJson } from "@/lib/api-route";
import { getMyShift, openShift, closeShift } from "@/domain/shift-service";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/my/shift?date=YYYY-MM-DD — смена водителя на день. Изоляция (CLAUDE.md §1): driverId = user.id
// из сессии, никогда из запроса.
export async function GET(req: Request) {
  try {
    const user = await requireDriver();
    const date = new URL(req.url).searchParams.get("date") ?? "";
    return NextResponse.json(ok(await getMyShift(user.id, date)));
  } catch (e) {
    return errorResponse(e);
  }
}

// POST /api/my/shift { op: "open"|"close", today } — открыть/закрыть смену (driverId из сессии).
export async function POST(req: Request) {
  try {
    const user = await requireDriver();
    const body = await readJson(req);
    const today = typeof body.today === "string" ? body.today : "";
    if (body.op === "open") return NextResponse.json(ok(await openShift(user.id, today)));
    if (body.op === "close") return NextResponse.json(ok(await closeShift(user.id, today)));
    throw Errors.validation("Неизвестная операция смены");
  } catch (e) {
    return errorResponse(e);
  }
}
