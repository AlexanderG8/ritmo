import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";

export const blockerInput = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Describe el bloqueo: “no avanza” no le sirve a nadie.")
    .max(500),
  commitmentId: z.string().trim().min(1).optional(),
});

export type BlockerInput = z.infer<typeof blockerInput>;

export async function listBlockers(cycleId: string) {
  return prisma.blocker.findMany({
    where: { cycleId },
    orderBy: [{ resolved: "asc" }, { createdAt: "asc" }],
    include: { commitment: { select: { id: true, title: true } } },
  });
}

export async function createBlocker(cycleId: string, input: BlockerInput) {
  const cycle = await prisma.weeklyCycle.findUniqueOrThrow({
    where: { id: cycleId },
  });

  if (cycle.status === "CLOSED") {
    throw new ValidationError("Esta semana ya está cerrada.");
  }

  return prisma.blocker.create({
    data: {
      cycleId,
      description: input.description,
      commitmentId: input.commitmentId ?? null,
    },
  });
}

export async function resolveBlocker(id: string) {
  const blocker = await prisma.blocker.findUniqueOrThrow({ where: { id } });

  if (blocker.resolved) {
    throw new ValidationError("Ese bloqueo ya está resuelto.");
  }

  return prisma.blocker.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

export async function deleteBlocker(id: string) {
  return prisma.blocker.delete({ where: { id } });
}
