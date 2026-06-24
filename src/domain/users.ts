// Запросы по пользователям для экранов диспетчера.
import { prisma } from "@/lib/prisma";
import type { DriverDTO } from "@/lib/task-dto";

/** Активные водители для колонок доски и выбора исполнителя (включая внешних без входа).
 *  onPayroll = есть активный денежный профиль (штатный на окладе) — признак «работает каждый день»
 *  для блока «Смены водителей» (решение Артёма 24.06). */
export async function listActiveDrivers(): Promise<DriverDTO[]> {
  const rows = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    select: {
      id: true,
      name: true,
      canLogin: true,
      payProfile: { select: { isActive: true } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    canLogin: u.canLogin,
    onPayroll: u.payProfile?.isActive ?? false,
  }));
}
