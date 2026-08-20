import "dotenv/config";
import { prisma } from "./src/lib/prisma.js";
import { ValidationError } from "./src/lib/errors.js";
import {
  changeStatus,
  completeCommitment,
  createCommitment,
  deleteCommitment,
  updateDocNotes,
} from "./src/server/commitments.js";
import { startWeek } from "./src/server/cycles.js";
import { weekMetrics } from "./src/server/metrics.js";
import { weekBounds } from "./src/lib/dates.js";

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

// Semana de prueba: 2020-01-06 (lunes), lejos de cualquier ciclo real.
const { weekStart, weekEnd } = weekBounds(new Date(Date.UTC(2020, 0, 8)));
check("weekBounds cae en lunes", weekStart.getUTCDay() === 1, weekStart.toISOString().slice(0, 10));
check("weekBounds cae en viernes", weekEnd.getUTCDay() === 5, weekEnd.toISOString().slice(0, 10));

await prisma.weeklyCycle.deleteMany({ where: { weekStart } });
const cycle = await prisma.weeklyCycle.create({ data: { weekStart, weekEnd } });

// En PLANNING, lo creado es planificado.
const planned = await createCommitment(cycle.id, {
  title: "Compromiso planificado de prueba",
  category: "DESARROLLO",
  priority: 1,
  plannedMinutes: 90,
  requiresDoc: true,
});
check("creado en PLANNING => wasPlanned true", planned.wasPlanned === true);

// LA REGLA.
await expectFail("cerrar sin documentación es rechazado", () =>
  completeCommitment(planned.id),
);

await updateDocNotes(planned.id, "Qué hace: nada, es una prueba.");
const done = await completeCommitment(planned.id);
check("cerrar con documentación funciona", done.status === "DONE");
check("completedAt queda registrado", done.completedAt !== null);

// No existe un segundo camino a DONE.
await expectFail("changeStatus no puede llevar a DONE", () =>
  changeStatus(planned.id, "DONE"),
);
await expectFail("un compromiso cerrado no se borra", () =>
  deleteCommitment(planned.id),
);

// requiresDoc=false sí puede cerrarse sin documentar.
const noDoc = await createCommitment(cycle.id, {
  title: "Compromiso sin exigencia de doc",
  category: "SOPORTE",
  priority: 3,
  requiresDoc: false,
});
const noDocDone = await completeCommitment(noDoc.id);
check("requiresDoc=false cierra sin doc", noDocDone.status === "DONE");

// Arrancar la semana cambia la naturaleza de lo que entra.
await startWeek(cycle.id);
await expectFail("no se puede iniciar dos veces", () => startWeek(cycle.id));

const unplanned = await createCommitment(cycle.id, {
  title: "Incidencia de Exactus que entró el miércoles",
  category: "SOPORTE",
  priority: 1,
  plannedMinutes: 60,
  requiresDoc: false,
});
check("creado en ACTIVE => wasPlanned false", unplanned.wasPlanned === false);

// Métricas.
const fresh = await prisma.weeklyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
const all = await prisma.commitment.findMany({ where: { cycleId: cycle.id } });
const m = weekMetrics(fresh, all);
check("cumplimiento solo cuenta planificados", m.plannedTotal === 2 && m.plannedDone === 2, `planned=${m.plannedTotal} done=${m.plannedDone} compliance=${m.compliance}`);
check("no planificado contabilizado aparte", m.unplannedTotal === 1, `unplanned=${m.unplannedTotal} share=${m.unplannedShare?.toFixed(2)}`);
check("deuda de documentación en cero", m.docDebt === 0);

// Validación de entrada.
const { commitmentInput } = await import("./src/server/commitments.js");
check("título vago rechazado", commitmentInput.safeParse({ title: "x", category: "SOPORTE", priority: 2, requiresDoc: true }).success === false);
check("categoría inválida rechazada", commitmentInput.safeParse({ title: "titulo valido", category: "OTRA", priority: 2, requiresDoc: true }).success === false);

await prisma.weeklyCycle.delete({ where: { id: cycle.id } });
const leftover = await prisma.commitment.count({ where: { cycleId: cycle.id } });
check("borrado en cascada limpio", leftover === 0);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
