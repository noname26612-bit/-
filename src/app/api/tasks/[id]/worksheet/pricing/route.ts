import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireDispatcher, errorResponse, readJson } from "@/lib/api-route";
import { priceWorksheet } from "@/domain/work-service";
import { parsePricingInput } from "@/lib/work-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/tasks/:id/worksheet/pricing — диспетчер проставляет цены по позициям и подтверждает
// расценку (PRICING→PRICED). Только диспетчер/админ (проверка в домене).
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireDispatcher();
    const { id } = await params;
    const input = parsePricingInput(await readJson(req));
    return NextResponse.json(ok(await priceWorksheet(id, input, user)));
  } catch (e) {
    return errorResponse(e);
  }
}
