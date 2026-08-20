import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { weekBounds } from "../src/lib/dates";
import {
  categoryDistribution,
  currentStreak,
  pastCycles,
  weekHistory,
  type WeekSummary,
} from "../src/server/history";

const results: [string, boolean, string?][] = [];
const check = (n: string, ok: boolean, d?: string) => results.push([n, ok, d]);

// Semanas de prueba: cuatro lunes consecutivos de 2017, lejos de datos reales.
const mondays = [
  new Date(Date.UTC(2017, 0, 2)),
  new Date(Date.UTC(2017, 0, 9)),
  new Date(Date.UTC(2017, 0, 16)),
  new Date(Date.UTC(2017, 0, 23)),
];

for (const monday of mondays) {
  await prisma.weeklyCycle.deleteMany({ where: { weekStart: monday } });
}

// Cumplimiento buscado por semana: 100%, 50%, 100%, 100%
const plan: { done: number; total: number; unplanned: number; carried: number }[] = [
  { done: 2, total: 2, unplanned: 0, carried: 0 },
  { done: 1, total: 2, unplanned: 1, carried: 1 },
  { done: 3, total: 3, unplanned: 1, carried: 0 },
  { done: 2, total: 2, unplanned: 2, carried: 0 },
];

const cycleIds: string[] = [];

for (const [index, monday] of mondays.entries()) {
  const { weekStart, weekEnd } = weekBounds(monday);
  const spec = plan[index];

  const cycle = await prisma.weeklyCycle.create({
    data: { weekStart, weekEnd, status: "ACTIVE", capacityMinutes: 1200 },
  });
  cycleIds.push(cycle.id);

  for (let i = 0; i < spec.total; i++) {
    const isDone = i < spec.done;
    const isCarried = !isDone && i - spec.done < spec.carried;
    await prisma.commitment.create({
      data: {
        cycleId: cycle.id,
        title: `Planificado ${index}-${i}`,
        category: "DESARROLLO",
        plannedMinutes: 300,
        wasPlanned: true,
        requiresDoc: false,
        status: isDone ? "DONE" : isCarried ? "CARRIED_OVER" : "PLANNED",
        completedAt: isDone ? new Date() : null,
      },
    });
  }

  for (let i = 0; i < spec.unplanned; i++) {
    await prisma.commitment.create({
      data: {
        cycleId: cycle.id,
        title: `Incidencia ${index}-${i}`,
        category: "SOPORTE",
        wasPlanned: false,
        requiresDoc: false,
        status: "DONE",
        completedAt: new Date(),
      },
    });
  }

  // Bloques: dos cerrados (uno protegido, uno no) y uno sin cerrar.
  const at = (hh: number) => new Date(Date.UTC(2017, 0, 2 + index * 7, hh));
  await prisma.focusBlock.createMany({
    data: [
      { date: weekStart, category: "DESARROLLO", plannedStart: at(9), plannedEnd: at(11), actualStart: at(9), actualEnd: at(11), actualMinutes: 120, distractions: 2, wasProtected: true },
      { date: weekStart, category: "SOPORTE", plannedStart: at(11), plannedEnd: at(12), actualStart: at(11), actualEnd: at(12), actualMinutes: 60, distractions: 1, wasProtected: false, interruptedMinutes: 15 },
      { date: weekStart, category: "REPORTES", plannedStart: at(14), plannedEnd: at(15), actualMinutes: 0, distractions: 0 },
    ],
  });
}

const history = await weekHistory(12);
const test = history.filter((w) => cycleIds.includes(w.cycleId));

check("weekHistory devuelve las cuatro semanas", test.length === 4, `${test.length}`);
check("ordenadas de más antigua a más reciente", test.every((w, i) => i === 0 || w.weekStart >= test[i - 1].weekStart));

const [w1, w2, , w4] = test;
check("cumplimiento semana 1 = 100%", w1.compliance === 1, String(w1.compliance));
check("cumplimiento semana 2 = 50%", w2.compliance === 0.5, String(w2.compliance));
check("el no planificado no entra en el cumplimiento", w4.compliance === 1 && w4.unplannedTotal === 2, `compliance=${w4.compliance} unplanned=${w4.unplannedTotal}`);
check("no planificado semana 4 = 50%", w4.unplannedShare === 0.5, String(w4.unplannedShare));
check("arrastre semana 2 = 1", w2.carriedOver === 1, String(w2.carriedOver));
check("compromiso vs capacidad = 50%", w1.commitmentRatio === 0.5, String(w1.commitmentRatio));

// Solo los bloques cerrados cuentan minutos; las distracciones cuentan todas.
check("minutos solo de bloques cerrados", w1.workedMinutes === 180, `${w1.workedMinutes}`);
check("distracciones de toda la semana", w1.distractions === 3, `${w1.distractions}`);
check("tiempo protegido = 50%", w1.protectedShare === 0.5, String(w1.protectedShare));

// Los bloques de una semana no se cuelan en otra.
check("los bloques no se mezclan entre semanas", test.every((w) => w.workedMinutes === 180), test.map((w) => w.workedMinutes).join(","));

// Racha: cuenta hacia atrás y se corta en la semana que falló.
const streak = currentStreak(test);
check("la racha se corta en la semana fallida", streak === 2, `racha=${streak}`);
check("racha cero si la última falla", currentStreak([...test.slice(0, 2)]) === 0, String(currentStreak([...test.slice(0, 2)])));

// La semana en curso no cuenta para la racha.
const fake: WeekSummary[] = [
  { ...w1, isCurrent: false, compliance: 1 },
  { ...w2, isCurrent: true, compliance: 0 },
];
check("la semana en curso no rompe la racha", currentStreak(fake) === 1, String(currentStreak(fake)));

// Distribución por categoría.
const dist = await categoryDistribution(mondays[0], weekBounds(mondays[3]).weekEnd);
const byCategory = new Map(dist.map((r) => [r.category, r.minutes]));
check("distribución suma los cuatro DESARROLLO", byCategory.get("DESARROLLO") === 480, String(byCategory.get("DESARROLLO")));
check("distribución suma los cuatro SOPORTE", byCategory.get("SOPORTE") === 240, String(byCategory.get("SOPORTE")));
check("excluye los bloques sin cerrar", !byCategory.has("REPORTES"), [...byCategory.keys()].join(","));
check("ordenada de mayor a menor", dist.every((r, i) => i === 0 || dist[i - 1].minutes >= r.minutes));

// Historial: solo semanas anteriores a la actual.
const past = await pastCycles();
const currentWeekStart = weekBounds(new Date()).weekStart;
check("el historial excluye la semana en curso si sigue abierta", past.every(({ cycle }) => cycle.weekStart < currentWeekStart || cycle.status === "CLOSED"));
check("el historial incluye las de prueba", cycleIds.every((id) => past.some(({ cycle }) => cycle.id === id)));

// Limpieza.
await prisma.weeklyCycle.deleteMany({ where: { id: { in: cycleIds } } });
await prisma.focusBlock.deleteMany({ where: { date: { in: mondays } } });
check("limpieza completa", (await prisma.weeklyCycle.count({ where: { id: { in: cycleIds } } })) === 0 && (await prisma.focusBlock.count({ where: { date: { in: mondays } } })) === 0);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
