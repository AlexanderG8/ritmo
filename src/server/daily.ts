import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { todayInLima } from "@/lib/dates";

export const dailyLogInput = z.object({
  energyLevel: z.coerce.number<number>().int().min(1).max(5),
  focusRating: z.coerce.number<number>().int().min(1).max(5),
  // Obligatorio a propósito: es el antídoto contra la negatividad.
  // Un día sin un solo logro registrado casi nunca es un día sin logros.
  win: z
    .string()
    .trim()
    .min(10, "Un logro de menos de 10 caracteres no es un logro, es un trámite.")
    .max(500),
  friction: z.string().trim().max(500).optional(),
});

export type DailyLogInput = z.infer<typeof dailyLogInput>;

export async function getTodayLog() {
  return prisma.dailyLog.findUnique({ where: { date: todayInLima() } });
}

/** Un registro por día: se puede corregir, no duplicar. */
export async function saveTodayLog(input: DailyLogInput) {
  const date = todayInLima();
  const data = {
    energyLevel: input.energyLevel,
    focusRating: input.focusRating,
    win: input.win,
    friction: input.friction || null,
  };

  return prisma.dailyLog.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
}

export async function getRecentLogs(days = 7) {
  return prisma.dailyLog.findMany({
    orderBy: { date: "desc" },
    take: days,
  });
}
