import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { closePeriod } from "@/domain/kpi-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ period: string }> };

// POST /api/kpi/periods/:period/close — закрыть месяц (снимок PayrollStatement). Только диспетчер.
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { period } = await params;
    return NextResponse.json(ok(await closePeriod(period, user)));
  } catch (e) {
    return errorResponse(e);
  }
}
