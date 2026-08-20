import { prisma } from "@/lib/prisma";
import { todayInLima, weekBounds } from "@/lib/dates";
import { ValidationError } from "@/lib/errors";

/**
 * Devuelve el ciclo de la semana actual, creándolo si no existe.
 * Idempotente: se puede llamar en cada render sin duplicar nada.
 */
export async function getCurrentCycle() {
  const { weekStart, weekEnd } = weekBounds(todayInLima());

  return prisma.weeklyCycle.upsert({
    where: { weekStart },
    update: {},
    create: { weekStart, weekEnd },
  });
}

export async function getCurrentCycleWithCommitments() {
  const cycle = await getCurrentCycle();

  const commitments = await prisma.commitment.findMany({
    where: { cycleId: cycle.id },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });

  return { cycle, commitments };
}

export async function setCapacity(cycleId: string, capacityMinutes: number) {
  if (capacityMinutes <= 0) {
    throw new ValidationError("La capacidad debe ser mayor que cero.");
  }
  if (capacityMinutes > 60 * 60) {
    throw new ValidationError("Esa capacidad no es realista para una semana.");
  }

  return prisma.weeklyCycle.update({
    where: { id: cycleId },
    data: { capacityMinutes },
  });
}

/** Cierra la planificación del lunes y arranca la semana. */
export async function startWeek(cycleId: string) {
  const cycle = await prisma.weeklyCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: { _count: { select: { commitments: true } } },
  });

  if (cycle.status !== "PLANNING") {
    throw new ValidationError("Esta semana ya fue iniciada.");
  }
  if (cycle._count.commitments === 0) {
    throw new ValidationError(
      "No puedes iniciar una semana sin un solo compromiso.",
    );
  }

  return prisma.weeklyCycle.update({
    where: { id: cycleId },
    data: { status: "ACTIVE" },
  });
}
