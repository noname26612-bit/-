import { test, expect, type Page } from "@playwright/test";

// Этап A: доступы и роли. №4 — Михаил (директор: права ADMIN, подпись «Директор»).
// №10 — у диспетчера убран расчёт зарплаты (на сервере), нарушения и суммы штрафов остаются.
const PASSWORD = process.env.SEED_PASSWORD ?? "vanmark123";
const thisPeriod = new Date().toISOString().slice(0, 7);

async function login(page: Page, login: string): Promise<void> {
  await page.goto("/login");
  await page.fill('input[name="login"]', login);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

// ───────────────────────── №4: Михаил (директор) ─────────────────────────

test("№4: Михаил входит с правами админа, в шапке подпись «Директор»", async ({ page }) => {
  await login(page, "mikhail");
  // homeForRole(ADMIN) → /admin (как у Артёма).
  await page.waitForURL(/\/admin/);
  // Подпись должности в шапке — «Директор», а не «Администратор».
  await expect(page.getByText("Директор", { exact: true })).toBeVisible();
  // Полный доступ администратора: админский API отвечает 200 (как Артёму).
  expect((await page.request.get("/api/admin/pay-profiles")).status()).toBe(200);
  // Зарплата видна директору (payrollVisible=true) — он администратор.
  const ov = (await (await page.request.get(`/api/kpi/overview?period=${thisPeriod}`)).json()).data;
  expect(ov.payrollVisible).toBe(true);
});

// ───────────────────────── №10: зарплата скрыта от диспетчера ─────────────────────────

test("№10: диспетчер не получает зарплату через API, но видит нарушения", async ({ page }) => {
  await login(page, "milena");
  const ov = (await (await page.request.get(`/api/kpi/overview?period=${thisPeriod}`)).json()).data;
  // Сервер помечает картину как «зарплата скрыта» и физически обнуляет денежные итоги.
  expect(ov.payrollVisible).toBe(false);
  expect(Array.isArray(ov.drivers)).toBe(true);
  for (const d of ov.drivers as Array<Record<string, number> & { actBonus: { value: number } }>) {
    expect(d.baseSalary).toBe(0);
    expect(d.premiumBase).toBe(0);
    expect(d.penalty).toBe(0);
    expect(d.bonus).toBe(0);
    expect(d.total).toBe(0);
    expect(d.actBonus.value).toBe(0);
  }
  // Кандидаты-нарушения остаются доступны и несут сумму штрафа (поле penaltyAmount присутствует).
  expect(ov.candidates).toBeDefined();
  for (const c of ov.candidates as Array<{ penaltyAmount: number | null }>) {
    expect(c).toHaveProperty("penaltyAmount");
  }
});

test("№10: админ получает полный расчёт зарплаты (payrollVisible, оклад > 0)", async ({ page }) => {
  await login(page, "artem");
  const ov = (await (await page.request.get(`/api/kpi/overview?period=${thisPeriod}`)).json()).data;
  expect(ov.payrollVisible).toBe(true);
  // У штатных водителей в сиде есть оклад — админ его видит (в отличие от диспетчера).
  expect((ov.drivers as Array<{ baseSalary: number }>).some((d) => d.baseSalary > 0)).toBe(true);
});

test("№10: страница KPI — у диспетчера без зарплаты, у админа с расчётом", async ({ browser }) => {
  // Диспетчер: заголовки «нарушения», нет блока «Расчёт по водителям» и подписи «Оклад».
  const dctx = await browser.newContext();
  const milena = await dctx.newPage();
  await login(milena, "milena");
  await milena.goto("/kpi");
  await expect(milena.getByRole("heading", { name: "KPI / Нарушения" })).toBeVisible();
  await expect(milena.getByRole("heading", { name: "Нарушения и штрафы по водителям" })).toBeVisible();
  await expect(milena.getByText("Расчёт по водителям")).toHaveCount(0);
  await expect(milena.getByText("Оклад")).toHaveCount(0);
  await dctx.close();

  // Админ: видит расчёт по водителям и зарплатный заголовок.
  const actx = await browser.newContext();
  const artem = await actx.newPage();
  await login(artem, "artem");
  await artem.goto("/kpi");
  await expect(artem.getByRole("heading", { name: "KPI / Зарплата" })).toBeVisible();
  await expect(artem.getByRole("heading", { name: "Расчёт по водителям" })).toBeVisible();
  await actx.close();
});
