import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { ProjectStatus } from "@/generated/prisma/enums";
import type { CommitmentStatus, WorkCategory } from "@/generated/prisma/enums";

export const projectInput = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre es demasiado vago.")
    .max(80, "Máximo 80 caracteres."),
  description: z.string().trim().max(2000).optional(),
  module: z.string().trim().max(80).optional(),
  status: z.enum(ProjectStatus),
});

export type ProjectInput = z.infer<typeof projectInput>;

/** Los archivados al final: dejan de estorbar sin desaparecer. */
const ORDER = [
  { status: "asc" as const },
  { updatedAt: "desc" as const },
];

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: ORDER,
    include: {
      _count: { select: { commitments: true, documents: true } },
    },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      commitments: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          cycle: { select: { weekStart: true, weekEnd: true } },
          documents: { select: { documentId: true } },
        },
      },
      documents: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, type: true, updatedAt: true },
      },
    },
  });
}

export async function createProject(input: ProjectInput) {
  const existing = await prisma.project.findUnique({
    where: { name: input.name },
  });

  if (existing) {
    throw new ValidationError("Ya tienes un proyecto con ese nombre.");
  }

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description || null,
      module: input.module || null,
      status: input.status,
    },
  });
}

export async function updateProject(id: string, input: ProjectInput) {
  const clash = await prisma.project.findUnique({
    where: { name: input.name },
  });

  if (clash && clash.id !== id) {
    throw new ValidationError("Ya tienes un proyecto con ese nombre.");
  }

  return prisma.project.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description || null,
      module: input.module || null,
      status: input.status,
    },
  });
}

/**
 * Un proyecto con trabajo cerrado no se borra: es historial, igual que un
 * compromiso cerrado. Para quitarlo de en medio está `ARCHIVED`.
 */
export async function deleteProject(id: string) {
  const done = await prisma.commitment.count({
    where: { projectId: id, status: "DONE" },
  });

  if (done > 0) {
    throw new ValidationError(
      done === 1
        ? "Este proyecto tiene un compromiso cerrado: es tu historial. Archívalo en vez de borrarlo."
        : `Este proyecto tiene ${done} compromisos cerrados: son tu historial. Archívalo en vez de borrarlo.`,
    );
  }

  return prisma.project.delete({ where: { id } });
}

export type ProjectMetrics = {
  total: number;
  done: number;
  open: number;
  compliance: number | null;
  plannedMinutes: number;
  actualMinutes: number;
  documents: number;
  byCategory: { category: WorkCategory; minutes: number }[];
  firstWeek: Date | null;
  lastWeek: Date | null;
};

/**
 * Lo que el ciclo semanal no puede contestar: cuánto tiempo real lleva este
 * proyecto y en qué se repartió. Los minutos salen de los bloques cerrados,
 * nunca de una columna acumulada.
 */
export async function projectMetrics(id: string): Promise<ProjectMetrics> {
  const commitments = await prisma.commitment.findMany({
    where: { projectId: id },
    select: {
      id: true,
      status: true,
      plannedMinutes: true,
      cycle: { select: { weekStart: true } },
    },
  });

  const ids = commitments.map((commitment) => commitment.id);

  const [blocks, documents] = await Promise.all([
    ids.length > 0
      ? prisma.focusBlock.groupBy({
          by: ["category"],
          where: { commitmentId: { in: ids }, actualEnd: { not: null } },
          _sum: { actualMinutes: true },
        })
      : Promise.resolve([]),
    prisma.document.count({ where: { projectId: id } }),
  ]);

  const counts = (status: CommitmentStatus) =>
    commitments.filter((commitment) => commitment.status === status).length;

  // DROPPED no cuenta para nada, igual que en las métricas de la semana.
  const active = commitments.filter(
    (commitment) => commitment.status !== "DROPPED",
  );
  const done = counts("DONE");

  const byCategory = blocks
    .map((row) => ({
      category: row.category as WorkCategory,
      minutes: row._sum.actualMinutes ?? 0,
    }))
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const weeks = commitments
    .map((commitment) => commitment.cycle.weekStart)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    total: active.length,
    done,
    open: active.length - done,
    compliance: active.length > 0 ? done / active.length : null,
    plannedMinutes: active.reduce(
      (sum, commitment) => sum + (commitment.plannedMinutes ?? 0),
      0,
    ),
    actualMinutes: byCategory.reduce((sum, row) => sum + row.minutes, 0),
    documents,
    byCategory,
    firstWeek: weeks[0] ?? null,
    lastWeek: weeks[weeks.length - 1] ?? null,
  };
}

/** Proyectos asignables desde un formulario: los que siguen vivos. */
export async function assignableProjects() {
  return prisma.project.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
