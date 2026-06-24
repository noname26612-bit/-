import { requireAnyRole } from "@/lib/session";
import { PricingCardClient } from "./pricing-card-client";

// Компактный экран расценки (решение Артёма 24.06): из очереди /pricing открываем сразу блок цен,
// а не всю карточку задачи. Группа (dispatcher) и так под guard'ом layout'а — дублируем явной
// проверкой роли (defense in depth), данные клиент тянет через SWR (/api/tasks/:id, авторизуется внутри).
export const dynamic = "force-dynamic";

export default async function PricingCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole("DISPATCHER", "ADMIN");
  const { id } = await params;
  return <PricingCardClient taskId={id} />;
}
