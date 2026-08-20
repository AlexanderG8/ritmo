import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ValidationError } from "../src/lib/errors";
import {
  addDistraction,
  createFocusBlock,
  deleteFocusBlock,
  minutesByCommitment,
  startBlock,
  stopBlock,
} from "../src/server/focus";
import { dailyLogInput, saveTodayLog, getTodayLog } from "../src/server/daily";
import {
  formatTime,
  limaTimeToInstant,
  todayInLima,
  weekBounds,
} from "../src/lib/dates";

const results: [string, boolean, string?][] = [];
const check = (name: string, ok: boolean, detail?: string) =>
  results.push([name, ok, detail]);

async function expectFail(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(name, false, "no lanzó error");
  } catch (error) {
    check(name, error instanceof ValidationError, (error as Error).message);
  }
}

// ── Zona horaria: lo que más silenciosamente se rompe ──────────────
const day = new Date(Date.UTC(2026, 7, 20));
const instant = limaTimeToInstant(day, "14:30");
check(
  "14:30 en Lima se guarda como 19:30 UTC",
  instant.toISOString() === "2026-08-20T19:30:00.000Z",
  instant.toISOString(),
);
check("y se vuelve a leer como 14:30", formatTime(instant) === "14:30", formatTime(instant));

const today = todayInLima();
check(
  "todayInLima es medianoche UTC (columna @db.Date)",
  today.getUTCHours() === 0 && today.getUTCMinutes() === 0,
  today.toISOString(),
);
const { weekStart } = weekBounds(today);
check("la semana de hoy empieza en lunes", weekStart.getUTCDay() === 1);

// ── Estado previo, para restaurarlo al final ───────────────────────
const previousLog = await getTodayLog();
const preexisting = await prisma.focusBlock.findMany({
  where: { date: today },
  select: { id: true },
});
const preexistingIds = new Set(preexisting.map((b) => b.id));

// ── Bloques de foco ────────────────────────────────────────────────
const block = await createFocusBlock({
  category: "DESARROLLO",
  plannedStart: "09:00",
  plannedEnd: "10:30",
});
check("bloque creado en el día de Lima", block.date.toISOString() === today.toISOString());
check("plannedStart se relee como 09:00", formatTime(block.plannedStart) === "09:00");

await expectFail("no se cuentan distracciones antes de iniciar", () =>
  addDistraction(block.id),
);

await startBlock(block.id);
await expectFail("no se inicia dos veces", () => startBlock(block.id));

const second = await createFocusBlock({
  category: "SOPORTE",
  plannedStart: "11:00",
  plannedEnd: "12:00",
});
await expectFail("no se permiten dos bloques corriendo a la vez", () =>
  startBlock(second.id),
);

await addDistraction(block.id);
await addDistraction(block.id);

await expectFail("interrupción mayor que la duración es rechazada", () =>
  stopBlock(block.id, 999),
);

const stopped = await stopBlock(block.id, 0);
check("al cerrar se calculan los minutos", stopped.actualMinutes >= 1, `${stopped.actualMinutes} min`);
check("sin interrupciones => wasProtected true", stopped.wasProtected === true);
check("las distracciones quedaron contadas", stopped.distractions === 2);
await expectFail("un bloque cerrado no se borra", () => deleteFocusBlock(block.id));
await expectFail("un bloque cerrado no se vuelve a cerrar", () => stopBlock(block.id, 0));

// wasProtected se deriva, no se pregunta.
await startBlock(second.id);
const interrupted = await stopBlock(second.id, 1);
check("con interrupción => wasProtected false", interrupted.wasProtected === false);
check("los minutos interrumpidos quedan registrados", interrupted.interruptedMinutes === 1);

// ── Minutos reales por compromiso ──────────────────────────────────
const { weekStart: ws, weekEnd: we } = weekBounds(new Date(Date.UTC(2019, 0, 9)));
await prisma.weeklyCycle.deleteMany({ where: { weekStart: ws } });
const cycle = await prisma.weeklyCycle.create({ data: { weekStart: ws, weekEnd: we } });
const commitment = await prisma.commitment.create({
  data: { cycleId: cycle.id, title: "Compromiso con tiempo real", category: "DESARROLLO" },
});
await prisma.focusBlock.createMany({
  data: [
    { date: today, category: "DESARROLLO", plannedStart: instant, plannedEnd: instant, actualMinutes: 45, commitmentId: commitment.id },
    { date: today, category: "DESARROLLO", plannedStart: instant, plannedEnd: instant, actualMinutes: 30, commitmentId: commitment.id },
  ],
});
const map = await minutesByCommitment([commitment.id]);
check("minutesByCommitment suma los bloques", map.get(commitment.id) === 75, String(map.get(commitment.id)));

// ── Registro diario ────────────────────────────────────────────────
check("logro vacío rechazado", dailyLogInput.safeParse({ energyLevel: 3, focusRating: 3, win: "" }).success === false);
check("logro trivial rechazado", dailyLogInput.safeParse({ energyLevel: 3, focusRating: 3, win: "ok" }).success === false);
check("energía fuera de rango rechazada", dailyLogInput.safeParse({ energyLevel: 9, focusRating: 3, win: "un logro suficientemente largo" }).success === false);

await saveTodayLog({ energyLevel: 4, focusRating: 3, win: "Prueba automatizada del registro diario" });
await saveTodayLog({ energyLevel: 2, focusRating: 2, win: "Prueba automatizada corregida", friction: "ninguna" });
const logs = await prisma.dailyLog.count({ where: { date: today } });
check("un solo registro por día (upsert, no duplica)", logs === 1);

// ── Limpieza ───────────────────────────────────────────────────────
await prisma.weeklyCycle.delete({ where: { id: cycle.id } });
await prisma.focusBlock.deleteMany({
  where: { date: today, id: { notIn: [...preexistingIds] } },
});
if (previousLog) {
  await prisma.dailyLog.update({
    where: { date: today },
    data: {
      energyLevel: previousLog.energyLevel,
      focusRating: previousLog.focusRating,
      win: previousLog.win,
      friction: previousLog.friction,
    },
  });
} else {
  await prisma.dailyLog.deleteMany({ where: { date: today } });
}
const leftoverBlocks = await prisma.focusBlock.count({ where: { date: today } });
check("estado restaurado", leftoverBlocks === preexistingIds.size, `${leftoverBlocks} bloques`);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
