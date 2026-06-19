import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin, errorResponse, readJson } from "@/lib/api-route";
import { listWorkCategories, createWorkCategory } from "@/domain/work-service";
import { parseWorkCategoryInput } from "@/lib/work-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/work-categories — разделы справочника. POST — создать раздел. Только админ.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(ok(await listWorkCategories()));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    const input = parseWorkCategoryInput(await readJson(req));
    return NextResponse.json(ok(await createWorkCategory(input, user)), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
