import type { Commitment, WeeklyCycle } from "@/generated/prisma/client";

/**
 * Desde la Fase 3 un compromiso puede estar documentado de dos formas: por las
 * notas embebidas (Fase 1) o por un Document vinculado. `documents` es opcional
 * solo para no romper llamadas antiguas; la app siempre lo pasa.
 */
export type CommitmentWithDocs = Commitment & {
  documents?: unknown[];
};

export type WeekMetrics = {
  plannedTotal: number;
  plannedDone: number;
  compliance: number | null; // 0..1 — solo sobre lo planificado el lunes
  unplannedTotal: number;
  unplannedDone: number;
  unplannedShare: number | null; // 0..1 — cuánto de la semana no lo elegiste tú
  committedMinutes: number;
  commitmentRatio: number | null; // comprometido / capacidad
  carriedOver: number;
  docDebt: number;
};

export function weekMetrics(
  cycle: WeeklyCycle,
  commitments: CommitmentWithDocs[],
): WeekMetrics {
  const active = commitments.filter((c) => c.status !== "DROPPED");

  const planned = active.filter((c) => c.wasPlanned);
  const unplanned = active.filter((c) => !c.wasPlanned);
  const plannedDone = planned.filter((c) => c.status === "DONE");

  const committedMinutes = planned.reduce(
    (sum, c) => sum + (c.plannedMinutes ?? 0),
    0,
  );

  // Deuda de documentación: debería ser siempre 0 porque la regla lo impide.
  // Si algún día no lo es, es que alguien encontró un segundo camino a DONE.
  const docDebt = active.filter(
    (c) =>
      c.status === "DONE" &&
      c.requiresDoc &&
      !c.docNotes?.trim() &&
      (c.documents?.length ?? 0) === 0,
  ).length;

  return {
    plannedTotal: planned.length,
    plannedDone: plannedDone.length,
    compliance: planned.length > 0 ? plannedDone.length / planned.length : null,
    unplannedTotal: unplanned.length,
    unplannedDone: unplanned.filter((c) => c.status === "DONE").length,
    unplannedShare:
      active.length > 0 ? unplanned.length / active.length : null,
    committedMinutes,
    commitmentRatio: cycle.capacityMinutes
      ? committedMinutes / cycle.capacityMinutes
      : null,
    carriedOver: active.filter((c) => c.status === "CARRIED_OVER").length,
    docDebt,
  };
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}
