import { test, expect, type Page } from "@playwright/test";

// Этап 5: PWA-установка и web-push. Реальную доставку пуша проверяет Артём на Android-телефоне
// (нужен push-сервис). Здесь — устанавливаемость (манифест/SW) и изоляция эндпоинтов подписки.

const PASSWORD = process.env.SEED_PASSWORD ?? "vanmark123";

async function login(page: Page, login: string, path: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="login"]', login);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${path}`);
}

test.describe("PWA: манифест и service worker", () => {
  test("манифест отдаётся и устанавливаемый", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const m = await res.json();
    expect(m.name).toBe("VanMark Drive");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.icons.some((i: { sizes: string }) => i.sizes === "192x192")).toBeTruthy();
    expect(
      m.icons.some(
        (i: { sizes: string; purpose?: string }) =>
          i.sizes === "512x512" && i.purpose === "maskable",
      ),
    ).toBeTruthy();
  });

  test("service worker отдаётся с обработчиками push и notificationclick", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('addEventListener("push"');
    expect(body).toContain('addEventListener("notificationclick"');
  });
});

test.describe("Подписка на пуши: авторизация и валидация", () => {
  const sub = () => ({
    endpoint: `https://fcm.googleapis.com/fcm/send/e2e-${Date.now()}-${Math.random()}`,
    keys: { p256dh: "BNdummyp256dhkeyforE2Etest_padding_padding_padding", auth: "authdummyE2E" },
  });

  test("гость не может подписаться → 401", async ({ request }) => {
    const res = await request.post("/api/push/subscribe", { data: sub() });
    expect(res.status()).toBe(401);
  });

  test("водитель подписывается → 200; мусорное тело → 422; отписка → 200", async ({ page }) => {
    await login(page, "kashirskiy", "/m");
    const s = sub();

    const okRes = await page.request.post("/api/push/subscribe", { data: s });
    expect(okRes.status()).toBe(200);

    const badRes = await page.request.post("/api/push/subscribe", { data: { endpoint: "https://x" } });
    expect(badRes.status()).toBe(422);

    const unRes = await page.request.post("/api/push/unsubscribe", { data: { endpoint: s.endpoint } });
    expect(unRes.status()).toBe(200);
  });
});
