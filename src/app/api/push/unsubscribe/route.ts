import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireApiUser, errorResponse, readJson } from "@/lib/api-route";
import { deleteSubscription } from "@/domain/push-service";

export const runtime = "nodejs";

// POST /api/push/unsubscribe — удалить подписку устройства. Только СВОЮ (userId из сессии).
export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = await readJson(req);
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    await deleteSubscription(user.id, endpoint);
    return NextResponse.json(ok({ ok: true }));
  } catch (e) {
    return errorResponse(e);
  }
}
