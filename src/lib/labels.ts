import type {
  CommitmentStatus,
  CycleStatus,
  WorkCategory,
} from "@/generated/prisma/enums";

export const categoryLabel: Record<WorkCategory, string> = {
  SOPORTE: "Soporte",
  DESARROLLO: "Desarrollo",
  REPORTES: "Reportes",
  DOCUMENTACION: "Documentación",
  APRENDIZAJE: "Aprendizaje",
  REUNION: "Reunión",
};

export const statusLabel: Record<CommitmentStatus, string> = {
  PLANNED: "Planificado",
  IN_PROGRESS: "En curso",
  BLOCKED: "Bloqueado",
  DONE: "Hecho",
  CARRIED_OVER: "Arrastrado",
  DROPPED: "Descartado",
};

export const cycleStatusLabel: Record<CycleStatus, string> = {
  PLANNING: "Planificando",
  ACTIVE: "En curso",
  CLOSED: "Cerrada",
};

export const priorityLabel: Record<number, string> = {
  1: "Alta",
  2: "Media",
  3: "Baja",
};

/** Estados a los que se puede mover manualmente. DONE nunca está aquí. */
export const manualStatuses: CommitmentStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "BLOCKED",
  "CARRIED_OVER",
  "DROPPED",
];
