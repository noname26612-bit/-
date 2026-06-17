import { requireAnyRole } from "@/lib/session";
import { listActiveDrivers } from "@/domain/users";
import { todayISO } from "@/lib/task-ui";
import { PlanningClient } from "./planning-client";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  await requireAnyRole("DISPATCHER", "ADMIN");
  const drivers = await listActiveDrivers();
  return <PlanningClient drivers={drivers} today={todayISO()} />;
}
