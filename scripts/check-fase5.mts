import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ValidationError } from "../src/lib/errors";
import { weekBounds } from "../src/lib/dates";
import { closeCycle, retroInput } from "../src/server/retro";
import {
  blockerInput,
  createBlocker,
  deleteBlocker,
  listBlockers,
  resolveBlocker,
} from "../src/server/blockers";
import { weekMetrics } from "../src/server/metrics";

const results: [string, boolean, string?][] = [];
const check = (n: string, ok: boolean, d?: string) => results.push([n, ok, d]);

async function expectFail(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(name, false, "no lanzó error");
  } catch (error) {
    check(name, error instanceof ValidationError, (error as Error).message);
  }
}

const retro = { wentWell: "Cerré la pantalla de aprobación.", toImprove: "Bloquear YouTube por la mañana." };

// ── Validación de entrada ──────────────────────────────────────────
check("retro vacía rechazada", retroInput.safeParse({ wentWell: "", toImprove: "" }).success === false);
check("retro trivial rechazada", retroInput.safeParse({ wentWell: "ok", toImprove: "nada" }).success === false);
check("bloqueo vago rechazado", blockerInput.safeParse({ description: "no avanza" }).success === false);

// ── Semanas de prueba ──────────────────────────────────────────────
const base = new Date(Date.UTC(2016, 0, 4)); // lunes
const { weekStart, weekEnd } = weekBounds(base);
const next = new Date(weekStart);
next.setUTCDate(next.getUTCDate() + 7);
const nextBounds = weekBounds(next);

await prisma.weeklyCycle.deleteMany({ where: { weekStart: { in: [weekStart, nextBounds.weekStart] } } });

const cycle = await prisma.weeklyCycle.create({
  data: { weekStart, weekEnd, status: "PLANNING", capacityMinutes: 1200 },
});

// Un ciclo que nunca arrancó no se puede cerrar.
await expectFail("no se cierra una semana que nunca arrancó", () => closeCycle(cycle.id, retro, []));

await prisma.weeklyCycle.update({ where: { id: cycle.id }, data: { status: "ACTIVE" } });

const hecho = await prisma.commitment.create({
  data: { cycleId: cycle.id, title: "Hecho", category: "DESARROLLO", requiresDoc: false, status: "DONE", completedAt: new Date(), plannedMinutes: 120 },
});
const arrastrar = await prisma.commitment.create({
  data: { cycleId: cycle.id, title: "Se arrastra", category: "REPORTES", priority: 1, plannedMinutes: 90, requiresDoc: true, docNotes: "Notas previas." },
});
const descartar = await prisma.commitment.create({
  data: { cycleId: cycle.id, title: "Se descarta", category: "APRENDIZAJE", requiresDoc: false },
});

// ── Bloqueos ───────────────────────────────────────────────────────
const blocker = await createBlocker(cycle.id, {
  description: "El proveedor de Exactus no responde el ticket.",
  commitmentId: arrastrar.id,
});
check("el bloqueo nace sin resolver", blocker.resolved === false);
check("el bloqueo se vincula al compromiso", blocker.commitmentId === arrastrar.id);

const otro = await createBlocker(cycle.id, { description: "Sin acceso al servidor de reportes." });
await resolveBlocker(otro.id);
const resuelto = await prisma.blocker.findUniqueOrThrow({ where: { id: otro.id } });
check("resolver marca fecha", resuelto.resolved === true && resuelto.resolvedAt !== null);
await expectFail("no se resuelve dos veces", () => resolveBlocker(otro.id));

const listados = await listBlockers(cycle.id);
check("los sin resolver salen primero", listados[0].id === blocker.id, listados.map((b) => b.resolved).join(","));

// ── Cierre del ciclo ───────────────────────────────────────────────
const closed = await closeCycle(cycle.id, retro, [arrastrar.id]);
check("el ciclo queda CLOSED", closed.status === "CLOSED");
check("se registra la fecha de cierre", closed.closedAt !== null);
check("se guarda la retro", closed.retroWentWell === retro.wentWell && closed.retroToImprove === retro.toImprove);

const original = await prisma.commitment.findUniqueOrThrow({ where: { id: arrastrar.id } });
check("lo arrastrado queda CARRIED_OVER", original.status === "CARRIED_OVER");

const descartado = await prisma.commitment.findUniqueOrThrow({ where: { id: descartar.id } });
check("lo no marcado queda DROPPED", descartado.status === "DROPPED");

const intacto = await prisma.commitment.findUniqueOrThrow({ where: { id: hecho.id } });
check("lo ya hecho no se toca", intacto.status === "DONE");

// La semana siguiente nace con la copia.
const siguiente = await prisma.weeklyCycle.findUniqueOrThrow({
  where: { weekStart: nextBounds.weekStart },
  include: { commitments: true },
});
check("la semana siguiente se crea en PLANNING", siguiente.status === "PLANNING");
check("con exactamente un compromiso", siguiente.commitments.length === 1, String(siguiente.commitments.length));

const copia = siguiente.commitments[0];
check("la copia apunta al original", copia.carriedFromId === arrastrar.id);
check("la copia conserva titulo, categoria y prioridad", copia.title === "Se arrastra" && copia.category === "REPORTES" && copia.priority === 1);
check("la copia conserva la documentacion", copia.docNotes === "Notas previas.");
check("la copia cuenta como planificada", copia.wasPlanned === true);
check("la copia nace sin cerrar", copia.status === "PLANNED");

// El arrastre aparece en la métrica de la semana cerrada.
const cerrada = await prisma.weeklyCycle.findUniqueOrThrow({
  where: { id: cycle.id },
  include: { commitments: { include: { documents: { select: { documentId: true } } } } },
});
const metrics = weekMetrics(cerrada, cerrada.commitments);
check("el arrastre se cuenta en la metrica", metrics.carriedOver === 1, String(metrics.carriedOver));
check("lo descartado no cuenta como incumplido", metrics.plannedTotal === 2 && metrics.plannedDone === 1, `total=${metrics.plannedTotal} done=${metrics.plannedDone}`);

// ── Una semana cerrada está cerrada ────────────────────────────────
await expectFail("no se cierra dos veces", () => closeCycle(cycle.id, retro, []));
await expectFail("no se registran bloqueos en una semana cerrada", () =>
  createBlocker(cycle.id, { description: "Un bloqueo tardío que no debería entrar." }),
);

// Cerrar es idempotente respecto al ciclo siguiente: si ya existe, no lo duplica.
const cuantos = await prisma.weeklyCycle.count({ where: { weekStart: nextBounds.weekStart } });
check("no se duplica el ciclo siguiente", cuantos === 1, String(cuantos));

// ── Limpieza ───────────────────────────────────────────────────────
await deleteBlocker(blocker.id);
await prisma.weeklyCycle.deleteMany({ where: { id: { in: [cycle.id, siguiente.id] } } });
check("limpieza completa", (await prisma.weeklyCycle.count({ where: { weekStart: { in: [weekStart, nextBounds.weekStart] } } })) === 0);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
