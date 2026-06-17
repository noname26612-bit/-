import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin, errorResponse, readJson } from "@/lib/api-route";
import { getKpiSettings, updateKpiSettings } from "@/domain/kpi-service";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/kpi-settings — прогрессия и нижний порог. PUT — обновить. Только админ.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(ok(await getKpiSettings()));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await readJson(req);
    const progressionPercent = typeof body.progressionPercent === "number" ? body.progressionPercent : NaN;
    const progressionStartIndex = typeof body.progressionStartIndex === "number" ? body.progressionStartIndex : NaN;
    const floor = body.floor === "ZERO" ? "ZERO" : "SALARY";
    if (!Number.isFinite(progressionPercent) || !Number.isFinite(progressionStartIndex)) {
      throw Errors.validation("Шаг прогрессии и порог должны быть числами");
    }
    return NextResponse.json(ok(await updateKpiSettings({ progressionPercent, progressionStartIndex, floor })));
  } catch (e) {
    return errorResponse(e);
  }
}
