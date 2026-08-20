import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { weekBounds } from "@/lib/dates";

export const retroInput = z.object({
  wentWell: z
    .string()
    .trim()
    .min(10, "Si no puedes nombrar una sola cosa que salió bien, no miraste."),
  toImprove: z
    .string()
    .trim()
    .min(10, "Una retro sin nada que mejorar no es una retro."),
});

export type RetroInput = z.infer<typeof retroInput>;

export async function getRetroData(cycleId: string) {
  const cycle = await prisma.weeklyCycle.findUniqueOrThrow({
    where: { id: cycleId },
    include: {
      commitments: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: { documents: { select: { documentId: true } } },
      },
      blockers: { orderBy: { createdAt: "asc" } },
    },
  });

  const open = cycle.commitments.filter(
    (commitment) =>
      commitment.status !== "DONE" && commitment.status !== "DROPPED",
  );

  return { cycle, open };
}

/**
 * Cierra la semana. Es lo único que puede llevar un ciclo a CLOSED, y lo único
 * que genera arrastre real: cada compromiso que se arrastra deja el original
 * marcado como CARRIED_OVER y nace de nuevo en la semana siguiente, con
 * `carriedFromId` apuntando al que no se hizo. Así el arrastre no se puede
 * borrar reescribiendo una tarea.
 */
export async function closeCycle(
  cycleId: string,
  input: RetroInput,
  carryOverIds: string[],
) {
  const { cycle, open } = await getRetroData(cycleId);

  if (cycle.status === "CLOSED") {
    throw new ValidationError("Esta semana ya está cerrada.");
  }
  if (cycle.status === "PLANNING") {
    throw new ValidationError(
      "Esta semana nunca arrancó. No hay nada que cerrar.",
    );
  }

  const openIds = new Set(open.map((commitment) => commitment.id));
  const carry = [...new Set(carryOverIds)].filter((id) => openIds.has(id));
  const drop = open
    .filter((commitment) => !carry.includes(commitment.id))
    .map((commitment) => commitment.id);

  // La semana siguiente arranca en PLANNING: lo arrastrado cuenta como
  // planificado, que es exactamente lo que es.
  const nextStart = new Date(cycle.weekStart);
  nextStart.setUTCDate(nextStart.getUTCDate() + 7);
  const nextBounds = weekBounds(nextStart);

  return prisma.$transaction(async (tx) => {
    const next = await tx.weeklyCycle.upsert({
      where: { weekStart: nextBounds.weekStart },
      update: {},
      create: {
        weekStart: nextBounds.weekStart,
        weekEnd: nextBounds.weekEnd,
      },
    });

    for (const id of carry) {
      const original = open.find((commitment) => commitment.id === id)!;

      await tx.commitment.create({
        data: {
          cycleId: next.id,
          title: original.title,
          description: original.description,
          category: original.category,
          priority: original.priority,
          plannedMinutes: original.plannedMinutes,
          requiresDoc: original.requiresDoc,
          docNotes: original.docNotes,
          wasPlanned: true,
          carriedFromId: original.id,
        },
      });

      await tx.commitment.update({
        where: { id },
        data: { status: "CARRIED_OVER" },
      });
    }

    if (drop.length > 0) {
      await tx.commitment.updateMany({
        where: { id: { in: drop } },
        data: { status: "DROPPED" },
      });
    }

    return tx.weeklyCycle.update({
      where: { id: cycleId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        retroWentWell: input.wentWell,
        retroToImprove: input.toImprove,
      },
    });
  });
}
