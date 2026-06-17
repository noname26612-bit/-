import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin, errorResponse, readJson } from "@/lib/api-route";
import { listPayProfiles, upsertPayProfile } from "@/domain/kpi-service";
import { Errors } from "@/domain/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/pay-profiles — оклад/премия по водителям. PUT — обновить один. Только админ.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(ok(await listPayProfiles()));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await readJson(req);
    const driverId = typeof body.driverId === "string" ? body.driverId : "";
    const baseSalary = typeof body.baseSalary === "number" ? body.baseSalary : NaN;
    const premiumBase = typeof body.premiumBase === "number" ? body.premiumBase : NaN;
    const isActive = body.isActive === false ? false : true;
    if (!driverId) throw Errors.validation("Не указан водитель");
    if (!Number.isFinite(baseSalary) || !Number.isFinite(premiumBase)) {
      throw Errors.validation("Оклад и премия должны быть числами");
    }
    return NextResponse.json(ok(await upsertPayProfile({ driverId, baseSalary, premiumBase, isActive })));
  } catch (e) {
    return errorResponse(e);
  }
}
