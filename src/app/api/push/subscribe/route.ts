import { NextResponse } from "next/server";
import { ok } from "@/lib/api";
import { requireApiUser, errorResponse, readJson } from "@/lib/api-route";
import { saveSubscription } from "@/domain/push-service";

// web-push использует node:crypto (через src/lib/push.ts по цепочке домена) — только Node-рантайм.
export const runtime = "nodejs";

// POST /api/push/subscribe — сохранить подписку устройства. Личность из сессии (CLAUDE.md правило 1),
// не из тела. Доступно любому вошедшему (водитель и диспетчер — ARCHITECTURE §7).
export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const body = await readJson(req);
    await saveSubscription(user.id, body, req.headers.get("user-agent"));
    return NextResponse.json(ok({ ok: true }));
  } catch (e) {
    return errorResponse(e);
  }
}
