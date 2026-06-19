import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse } from "@/lib/api-route";
import { listPricingQueue } from "@/domain/work-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/worksheets/pricing — очередь ведомостей «на расценке» для диспетчера (этап 13).
export async function GET() {
  try {
    await requireDispatcher();
    return NextResponse.json(ok(await listPricingQueue()));
  } catch (e) {
    return errorResponse(e);
  }
}
