import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { CommitmentStatus, WorkCategory } from "@/generated/prisma/enums";

export const commitmentInput = z.object({
  title: z
    .string()
    .trim()
    .min(4, "El título es demasiado vago.")
    .max(140, "Máximo 140 caracteres."),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(WorkCategory),
  priority: z.coerce.number<number>().int().min(1).max(3),
  plannedMinutes: z.coerce
    .number<number>()
    .int()
    .min(15, "Menos de 15 minutos no merece ser un compromiso.")
    .max(2400, "Divide eso en compromisos más pequeños.")
    .optional(),
  requiresDoc: z.boolean(),
});

export type CommitmentInput = z.infer<typeof commitmentInput>;

/**
 * `wasPlanned` no lo decide el formulario: lo decide el estado del ciclo.
 * Si la semana ya arrancó, lo que entra es trabajo no planificado y así queda
 * registrado. Es la diferencia entre "no cumplí" y "me interrumpieron".
 */
export async function createCommitment(cycleId: string, input: CommitmentInput) {
  const cycle = await prisma.weeklyCycle.findUniqueOrThrow({
    where: { id: cycleId },
  });

  if (cycle.status === "CLOSED") {
    throw new ValidationError("Esta semana ya está cerrada.");
  }

  return prisma.commitment.create({
    data: {
      cycleId,
      ...input,
      description: input.description || null,
      plannedMinutes: input.plannedMinutes ?? null,
      wasPlanned: cycle.status === "PLANNING",
    },
  });
}

export async function updateDocNotes(id: string, docNotes: string) {
  return prisma.commitment.update({
    where: { id },
    data: { docNotes: docNotes.trim() || null },
  });
}

export function isDocumented(commitment: {
  docNotes: string | null;
  documents?: unknown[];
}): boolean {
  if (commitment.docNotes && commitment.docNotes.trim().length > 0) return true;
  return (commitment.documents?.length ?? 0) > 0;
}

/**
 * ─────────────────────────────────────────────────────────────
 *  LA REGLA. Único punto que puede llevar un compromiso a DONE.
 *  Si algún día aparece un segundo camino a DONE, esta regla deja
 *  de existir sin que nadie se entere.
 * ─────────────────────────────────────────────────────────────
 */
export async function completeCommitment(id: string) {
  const commitment = await prisma.commitment.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });

  if (commitment.status === "DONE") return commitment;

  const documented =
    Boolean(commitment.docNotes?.trim()) || commitment._count.documents > 0;

  if (commitment.requiresDoc && !documented) {
    throw new ValidationError(
      "No puedes cerrar esta tarea sin documentación. Escribe qué hace, cómo se usa y qué decidiste.",
    );
  }

  return prisma.commitment.update({
    where: { id },
    data: { status: "DONE", completedAt: new Date() },
  });
}

/** Transiciones que NO son DONE. DONE solo pasa por completeCommitment. */
export async function changeStatus(id: string, status: CommitmentStatus) {
  if (status === "DONE") {
    throw new ValidationError(
      "DONE solo se alcanza por completeCommitment(), que valida la documentación.",
    );
  }

  return prisma.commitment.update({
    where: { id },
    data: { status, completedAt: null },
  });
}

export async function deleteCommitment(id: string) {
  const commitment = await prisma.commitment.findUniqueOrThrow({
    where: { id },
  });

  if (commitment.status === "DONE") {
    throw new ValidationError(
      "Un compromiso cerrado no se borra: es tu historial.",
    );
  }

  return prisma.commitment.delete({ where: { id } });
}
