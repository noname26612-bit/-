import { requireAnyRole } from "@/lib/session";
import { periodOf } from "@/domain/kpi";
import { KpiClient } from "./kpi-client";

export const dynamic = "force-dynamic";

// Экран Милены «KPI / Зарплата» (PRD §8 экран 6): кандидаты в нарушения, расчёт по водителям,
// ручные отметки, закрытие месяца. Доступен диспетчеру и админу.
export default async function KpiPage() {
  await requireAnyRole("DISPATCHER", "ADMIN");
  return <KpiClient initialPeriod={periodOf(new Date())} />;
}
