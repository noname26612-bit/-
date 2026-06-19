import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { confirmShift } from "@/domain/shift-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/shifts/:id/confirm — подтвердить открытие смены (REQUESTED → OPEN). Только Д/А.
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { id } = await params;
    return NextResponse.json(ok(await confirmShift(id, { id: user.id, role: user.role })));
  } catch (e) {
    return errorResponse(e);
  }
}
