import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse, readJson } from "@/lib/api-route";
import { addManualMark } from "@/domain/kpi-service";
import { periodOf } from "@/domain/kpi";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/kpi/marks — ручная отметка: штраф (amount<0) или поощрение (amount>0). Только диспетчер.
export async function POST(req: Request) {
  try {
    const user = await requireDispatcher();
    const body = await readJson(req);
    const driverId = typeof body.driverId === "string" ? body.driverId : "";
    const amount = typeof body.amount === "number" ? body.amount : NaN;
    const note = typeof body.note === "string" ? body.note : undefined;
    const period = typeof body.period === "string" && body.period ? body.period : periodOf(new Date());
    if (!driverId) throw Errors.validation("Не указан водитель");
    if (!Number.isFinite(amount)) throw Errors.validation("Не указана сумма");
    return NextResponse.json(ok(await addManualMark({ driverId, amount, note, period }, user)), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
