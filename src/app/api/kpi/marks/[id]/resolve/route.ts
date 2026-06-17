import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse, readJson } from "@/lib/api-route";
import { resolveMark } from "@/domain/kpi-service";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/kpi/marks/:id/resolve {status: CONFIRMED|DISMISSED} — решение по кандидату. Только диспетчер.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { id } = await params;
    const body = await readJson(req);
    const status =
      body.status === "CONFIRMED" ? "CONFIRMED" : body.status === "DISMISSED" ? "DISMISSED" : null;
    if (!status) throw Errors.validation("Статус должен быть CONFIRMED или DISMISSED");
    return NextResponse.json(ok(await resolveMark(id, status, user)));
  } catch (e) {
    return errorResponse(e);
  }
}
