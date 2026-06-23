import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse, readJson } from "@/lib/api-route";
import { confirmShift } from "@/domain/shift-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/shifts/:id/confirm — подтвердить открытие смены (REQUESTED → OPEN). Только Д/А.
// Опционально {openedAtTime:"ЧЧ:ММ", reason} — сразу скорректировать время открытия (№3).
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { id } = await params;
    const body = await readJson(req);
    const timeHHMM = typeof body.openedAtTime === "string" ? body.openedAtTime : "";
    const reason = typeof body.reason === "string" ? body.reason : "";
    const adjust = timeHHMM.trim() ? { timeHHMM, reason } : undefined;
    return NextResponse.json(ok(await confirmShift(id, { id: user.id, role: user.role }, adjust)));
  } catch (e) {
    return errorResponse(e);
  }
}
