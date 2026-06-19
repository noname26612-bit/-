import { requireAnyRole } from "@/lib/session";
import { listActiveDrivers } from "@/domain/users";
import { getCapacitySettings } from "@/domain/capacity-service";
import { todayISO } from "@/lib/task-ui";
import { PlanningClient } from "./planning-client";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  await requireAnyRole("DISPATCHER", "ADMIN");
  const [drivers, settings] = await Promise.all([listActiveDrivers(), getCapacitySettings()]);
  // workdayMinutes — знаменатель для индикатора загрузки в ячейках (Фаза 2, §14.4).
  return <PlanningClient drivers={drivers} today={todayISO()} workdayMinutes={settings.workdayMinutes} />;
}
