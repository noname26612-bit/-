import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin, errorResponse, readJson } from "@/lib/api-route";
import { updateWorkCategory } from "@/domain/work-service";
import { parseWorkCategoryInput } from "@/lib/work-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/work-categories/:id — изменить раздел (название, порядок, активность). Только админ.
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const input = parseWorkCategoryInput(await readJson(req));
    return NextResponse.json(ok(await updateWorkCategory(id, input, user)));
  } catch (e) {
    return errorResponse(e);
  }
}
