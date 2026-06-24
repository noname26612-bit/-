import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse, readJson } from "@/lib/api-route";
import { adjustShiftOpenedAt } from "@/domain/shift-service";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/shifts/:id {openedAtTime:"ЧЧ:ММ", reason} — правка времени открытия смены задним числом (№3).
// Только диспетчер/админ. Время любое (раньше/позже факта), причина обязательна, в закрытом месяце — отказ.
// Личность правящего — из сессии; SHIFT_LATE пересчитывается в сервисе.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { id } = await params;
    const body = await readJson(req);
    const timeHHMM = typeof body.openedAtTime === "string" ? body.openedAtTime : "";
    const reason = typeof body.reason === "string" ? body.reason : "";
    if (!timeHHMM.trim()) throw Errors.validation("Укажите время открытия (ЧЧ:ММ)");
    return NextResponse.json(
      ok(await adjustShiftOpenedAt(id, { timeHHMM, reason }, { id: user.id, role: user.role })),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
