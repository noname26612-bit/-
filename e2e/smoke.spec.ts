import { test, expect } from "@playwright/test";

test("главная страница загружается", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "VanMark Drive" }),
  ).toBeVisible();
});

test("GET /api/health возвращает ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.data.status).toBe("ok");
  expect(body.data.db).toBe("up");
});
