import { requireRole } from "@/lib/session";
import { PayClient } from "./pay-client";

export const dynamic = "force-dynamic";

// Денежные настройки KPI (PRD §8 экран 5, §12.2): оклад/премия по водителю, веса штрафов,
// шаг прогрессии и нижний порог. Только админ (Артём).
export default async function PayPage() {
  await requireRole("ADMIN");
  return <PayClient />;
}
