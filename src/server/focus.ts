import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { limaTimeToInstant, todayInLima } from "@/lib/dates";
import { WorkCategory } from "@/generated/prisma/enums";

const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (formato HH:mm).");

export const focusBlockInput = z
  .object({
    category: z.enum(WorkCategory),
    plannedStart: hhmm,
    plannedEnd: hhmm,
    commitmentId: z.string().trim().min(1).optional(),
  })
  .refine((value) => value.plannedEnd > value.plannedStart, {
    message: "El bloque debe terminar después de empezar.",
    path: ["plannedEnd"],
  });

export type FocusBlockInput = z.infer<typeof focusBlockInput>;

export async function getTodayBlocks() {
  const date = todayInLima();

  return prisma.focusBlock.findMany({
    where: { date },
    orderBy: { plannedStart: "asc" },
    include: { commitment: { select: { id: true, title: true } } },
  });
}

export async function createFocusBlock(input: FocusBlockInput) {
  const date = todayInLima();

  return prisma.focusBlock.create({
    data: {
      date,
      category: input.category,
      plannedStart: limaTimeToInstant(date, input.plannedStart),
      plannedEnd: limaTimeToInstant(date, input.plannedEnd),
      commitmentId: input.commitmentId ?? null,
    },
  });
}

export async function startBlock(id: string) {
  const block = await prisma.focusBlock.findUniqueOrThrow({ where: { id } });

  if (block.actualStart) {
    throw new ValidationError("Este bloque ya fue iniciado.");
  }

  const running = await prisma.focusBlock.findFirst({
    where: { actualStart: { not: null }, actualEnd: null },
  });
  if (running) {
    throw new ValidationError(
      "Ya tienes un bloque corriendo. Ciérralo antes de abrir otro: dos bloques a la vez es exactamente la dispersión que esto combate.",
    );
  }

  return prisma.focusBlock.update({
    where: { id },
    data: { actualStart: new Date() },
  });
}

/**
 * `wasProtected` no se pregunta: se deriva. Un bloque está protegido si nada
 * lo interrumpió. Preguntarlo por separado invita a mentirse.
 */
export async function stopBlock(id: string, interruptedMinutes: number) {
  const block = await prisma.focusBlock.findUniqueOrThrow({ where: { id } });

  if (!block.actualStart) {
    throw new ValidationError("Este bloque nunca se inició.");
  }
  if (block.actualEnd) {
    throw new ValidationError("Este bloque ya está cerrado.");
  }
  if (interruptedMinutes < 0) {
    throw new ValidationError("Los minutos interrumpidos no pueden ser negativos.");
  }

  const actualEnd = new Date();
  const elapsed = Math.max(
    1,
    Math.round((actualEnd.getTime() - block.actualStart.getTime()) / 60_000),
  );

  if (interruptedMinutes > elapsed) {
    throw new ValidationError(
      `El bloque duró ${elapsed} minutos: no pudieron interrumpirte ${interruptedMinutes}.`,
    );
  }

  return prisma.focusBlock.update({
    where: { id },
    data: {
      actualEnd,
      actualMinutes: elapsed,
      interruptedMinutes,
      wasProtected: interruptedMinutes === 0,
    },
  });
}

export async function addDistraction(id: string) {
  const block = await prisma.focusBlock.findUniqueOrThrow({ where: { id } });

  if (!block.actualStart || block.actualEnd) {
    throw new ValidationError(
      "Solo se cuentan distracciones mientras el bloque corre.",
    );
  }

  return prisma.focusBlock.update({
    where: { id },
    data: { distractions: { increment: 1 } },
  });
}

export async function deleteFocusBlock(id: string) {
  const block = await prisma.focusBlock.findUniqueOrThrow({ where: { id } });

  if (block.actualEnd) {
    throw new ValidationError(
      "Un bloque ya registrado no se borra: es tu historial real.",
    );
  }

  return prisma.focusBlock.delete({ where: { id } });
}

/** Minutos reales por compromiso. Reemplaza la columna que quitamos. */
export async function minutesByCommitment(commitmentIds: string[]) {
  if (commitmentIds.length === 0) return new Map<string, number>();

  const rows = await prisma.focusBlock.groupBy({
    by: ["commitmentId"],
    where: { commitmentId: { in: commitmentIds } },
    _sum: { actualMinutes: true },
  });

  return new Map(
    rows
      .filter((row) => row.commitmentId !== null)
      .map((row) => [row.commitmentId as string, row._sum.actualMinutes ?? 0]),
  );
}

export type BlockStats = {
  workedMinutes: number;
  distractions: number;
  interruptedMinutes: number;
  protectedShare: number | null;
};

/**
 * Agregado de bloques entre dos fechas, para una sola semana.
 * `weekHistory()` calcula lo mismo para doce semanas de una sentada partiendo
 * un único findMany; aquí se consulta el rango directo porque pedir doce
 * semanas para leer una sería peor. Los minutos solo cuentan bloques cerrados:
 * un bloque abierto todavía no es tiempo trabajado.
 */
export async function weekBlockStats(from: Date, to: Date): Promise<BlockStats> {
  const blocks = await prisma.focusBlock.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      actualMinutes: true,
      distractions: true,
      interruptedMinutes: true,
      wasProtected: true,
      actualEnd: true,
    },
  });

  const finished = blocks.filter((block) => block.actualEnd !== null);

  return {
    workedMinutes: finished.reduce((sum, b) => sum + b.actualMinutes, 0),
    distractions: blocks.reduce((sum, b) => sum + b.distractions, 0),
    interruptedMinutes: finished.reduce(
      (sum, b) => sum + b.interruptedMinutes,
      0,
    ),
    protectedShare:
      finished.length > 0
        ? finished.filter((b) => b.wasProtected).length / finished.length
        : null,
  };
}
