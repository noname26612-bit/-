import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireAdmin, errorResponse, readJson } from "@/lib/api-route";
import { listKpiRules, updateKpiRule } from "@/domain/kpi-service";
import { Errors } from "@/domain/errors";
import type { KpiMarkKind } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RULE_KINDS: KpiMarkKind[] = ["LATE", "MISSED_STOP", "UNSIGNED_DOCS"];

// GET /api/admin/kpi-rules — веса штрафов. PUT {kind, weight} — обновить вес. Только админ.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(ok(await listKpiRules()));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await readJson(req);
    const kind = RULE_KINDS.find((k) => k === body.kind);
    const weight = typeof body.weight === "number" ? body.weight : NaN;
    if (!kind) throw Errors.validation("Неизвестный вид нарушения");
    if (!Number.isFinite(weight)) throw Errors.validation("Вес должен быть числом");
    return NextResponse.json(ok(await updateKpiRule(kind, weight)));
  } catch (e) {
    return errorResponse(e);
  }
}
