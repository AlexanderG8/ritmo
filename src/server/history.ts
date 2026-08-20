import { prisma } from "@/lib/prisma";
import { formatDate, todayInLima, weekBounds } from "@/lib/dates";
import { weekMetrics } from "@/server/metrics";
import type { WorkCategory } from "@/generated/prisma/enums";

export type WeekSummary = {
  cycleId: string;
  weekStart: Date;
  weekEnd: Date;
  label: string;
  isCurrent: boolean;
  plannedTotal: number;
  plannedDone: number;
  compliance: number | null;
  unplannedTotal: number;
  unplannedShare: number | null;
  commitmentRatio: number | null;
  carriedOver: number;
  docDebt: number;
  distractions: number;
  workedMinutes: number;
  protectedShare: number | null;
};

/**
 * Resumen por semana. Se hace en dos consultas y se agrupa en memoria: a una
 * semana por fila, el volumen no justifica agregados en SQL.
 */
export async function weekHistory(weeks = 12): Promise<WeekSummary[]> {
  const cycles = await prisma.weeklyCycle.findMany({
    orderBy: { weekStart: "desc" },
    take: weeks,
    include: {
      commitments: {
        include: { documents: { select: { documentId: true } } },
      },
    },
  });

  if (cycles.length === 0) return [];

  const ordered = [...cycles].reverse();
  const from = ordered[0].weekStart;
  const to = ordered[ordered.length - 1].weekEnd;

  const blocks = await prisma.focusBlock.findMany({
    where: { date: { gte: from, lte: to } },
    select: {
      date: true,
      actualMinutes: true,
      distractions: true,
      wasProtected: true,
      actualEnd: true,
    },
  });

  const currentWeekStart = weekBounds(todayInLima()).weekStart.getTime();

  return ordered.map((cycle) => {
    const metrics = weekMetrics(cycle, cycle.commitments);

    const own = blocks.filter(
      (block) =>
        block.date >= cycle.weekStart && block.date <= cycle.weekEnd,
    );
    const finished = own.filter((block) => block.actualEnd !== null);

    return {
      cycleId: cycle.id,
      weekStart: cycle.weekStart,
      weekEnd: cycle.weekEnd,
      label: formatDate(cycle.weekStart, "d MMM"),
      isCurrent: cycle.weekStart.getTime() === currentWeekStart,
      plannedTotal: metrics.plannedTotal,
      plannedDone: metrics.plannedDone,
      compliance: metrics.compliance,
      unplannedTotal: metrics.unplannedTotal,
      unplannedShare: metrics.unplannedShare,
      commitmentRatio: metrics.commitmentRatio,
      carriedOver: metrics.carriedOver,
      docDebt: metrics.docDebt,
      distractions: own.reduce((sum, block) => sum + block.distractions, 0),
      workedMinutes: finished.reduce(
        (sum, block) => sum + block.actualMinutes,
        0,
      ),
      protectedShare:
        finished.length > 0
          ? finished.filter((block) => block.wasProtected).length /
            finished.length
          : null,
    };
  });
}

/**
 * Semanas consecutivas con cumplimiento ≥ 80%, contando hacia atrás desde la
 * última semana cerrada. La semana en curso no cuenta: todavía puede caerse.
 */
export function currentStreak(history: WeekSummary[]): number {
  let streak = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const week = history[i];
    if (week.isCurrent) continue;
    if (week.compliance !== null && week.compliance >= 0.8) streak++;
    else break;
  }

  return streak;
}

export async function categoryDistribution(from: Date, to: Date) {
  const rows = await prisma.focusBlock.groupBy({
    by: ["category"],
    where: { date: { gte: from, lte: to }, actualEnd: { not: null } },
    _sum: { actualMinutes: true },
  });

  return rows
    .map((row) => ({
      category: row.category as WorkCategory,
      minutes: row._sum.actualMinutes ?? 0,
    }))
    .filter((row) => row.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

/** Ciclos anteriores al actual, del más reciente al más antiguo. */
export async function pastCycles(limit = 26) {
  const currentWeekStart = weekBounds(todayInLima()).weekStart;

  const cycles = await prisma.weeklyCycle.findMany({
    where: { weekStart: { lt: currentWeekStart } },
    orderBy: { weekStart: "desc" },
    take: limit,
    include: {
      commitments: {
        include: { documents: { select: { documentId: true } } },
      },
    },
  });

  return cycles.map((cycle) => ({
    cycle,
    metrics: weekMetrics(cycle, cycle.commitments),
  }));
}
