import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { weekBounds } from "../src/lib/dates";
import {
  renderWeeklyReportMarkdown,
  weeklyReport,
} from "../src/server/report";
import { weekBlockStats } from "../src/server/focus";

const results: [string, boolean, string?][] = [];
const check = (n: string, ok: boolean, d?: string) => results.push([n, ok, d]);

// Semana de prueba lejos de cualquier dato real: lunes 6 de marzo de 2017.
const monday = new Date(Date.UTC(2017, 2, 6));
const { weekStart, weekEnd } = weekBounds(monday);

await prisma.weeklyCycle.deleteMany({ where: { weekStart } });
await prisma.focusBlock.deleteMany({
  where: { date: { gte: weekStart, lte: weekEnd } },
});

const cycle = await prisma.weeklyCycle.create({
  data: { weekStart, weekEnd, status: "ACTIVE", capacityMinutes: 1200 },
});

// Dos planificados (uno cerrado y documentado, uno arrastrado) y uno no
// planificado cerrado: cumplimiento 50%, no planificado 1/3, arrastre 1.
const done = await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    title: "Reporte de cobranzas | con barra",
    category: "REPORTES",
    plannedMinutes: 300,
    wasPlanned: true,
    requiresDoc: true,
    docNotes: "Qué hace, cómo se usa y qué decidí.",
    status: "DONE",
    completedAt: new Date(),
  },
});

await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    title: "Migrar módulo de CxC",
    category: "DESARROLLO",
    plannedMinutes: 600,
    wasPlanned: true,
    requiresDoc: true,
    status: "CARRIED_OVER",
  },
});

const incident = await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    title: "Incidencia Exactus",
    category: "SOPORTE",
    wasPlanned: false,
    requiresDoc: false,
    status: "DONE",
    completedAt: new Date(),
  },
});

await prisma.blocker.create({
  data: {
    cycleId: cycle.id,
    commitmentId: incident.id,
    description: "El proveedor no responde al ticket abierto el martes.",
  },
});

// Tres bloques: dos cerrados (uno interrumpido) y uno abierto, que no debe
// contar ni en minutos ni en el reparto por categoría.
const at = (day: number, hh: number) => new Date(Date.UTC(2017, 2, day, hh));
await prisma.focusBlock.createMany({
  data: [
    {
      date: new Date(Date.UTC(2017, 2, 6)),
      category: "REPORTES",
      plannedStart: at(6, 14),
      plannedEnd: at(6, 16),
      actualStart: at(6, 14),
      actualEnd: at(6, 16),
      actualMinutes: 120,
      distractions: 2,
      interruptedMinutes: 0,
      wasProtected: true,
      commitmentId: done.id,
    },
    {
      date: new Date(Date.UTC(2017, 2, 7)),
      category: "SOPORTE",
      plannedStart: at(7, 9),
      plannedEnd: at(7, 10),
      actualStart: at(7, 9),
      actualEnd: at(7, 10),
      actualMinutes: 60,
      distractions: 1,
      interruptedMinutes: 15,
      wasProtected: false,
      commitmentId: incident.id,
    },
    {
      date: new Date(Date.UTC(2017, 2, 8)),
      category: "APRENDIZAJE",
      plannedStart: at(8, 18),
      plannedEnd: at(8, 19),
      actualStart: at(8, 18),
      actualMinutes: 0,
    },
  ],
});

// ── Agregado de bloques ────────────────────────────────────────────────
const stats = await weekBlockStats(weekStart, weekEnd);
check("solo suma minutos de bloques cerrados", stats.workedMinutes === 180, String(stats.workedMinutes));
check("suma las distracciones de la semana", stats.distractions === 3, String(stats.distractions));
check("suma los minutos interrumpidos", stats.interruptedMinutes === 15, String(stats.interruptedMinutes));
check("bloques protegidos: 1 de 2 cerrados", stats.protectedShare === 0.5, String(stats.protectedShare));

// ── Informe ────────────────────────────────────────────────────────────
const report = await weeklyReport(cycle.id);
if (!report) throw new Error("El informe de la semana de prueba salió vacío.");

check("cumplimiento sobre lo planificado", report.metrics.compliance === 0.5, String(report.metrics.compliance));
check("el no planificado no infla el cumplimiento", report.metrics.plannedTotal === 2, String(report.metrics.plannedTotal));
check("trabajo no planificado 1 de 3", report.metrics.unplannedShare === 1 / 3, String(report.metrics.unplannedShare));
check("arrastre correcto", report.metrics.carriedOver === 1, String(report.metrics.carriedOver));
check("deuda de documentación en cero", report.metrics.docDebt === 0, String(report.metrics.docDebt));
check("separa planificado de no planificado", report.planned.length === 2 && report.unplanned.length === 1, `${report.planned.length}/${report.unplanned.length}`);
check("minutos reales por compromiso", report.planned.find((c) => c.id === done.id)?.actualMinutes === 120, String(report.planned.find((c) => c.id === done.id)?.actualMinutes));
check("marca lo documentado", report.planned.find((c) => c.id === done.id)?.documented === true);
check("marca lo no documentado", report.planned.find((c) => c.status === "CARRIED_OVER")?.documented === false);
check("reparto por categoría sin bloques abiertos", report.categories.every((row) => row.category !== "APRENDIZAJE"), report.categories.map((r) => r.category).join(","));
check("reparto por categoría ordenado", report.categories[0]?.category === "REPORTES" && report.categories[0]?.minutes === 120);
check("incluye los bloqueos", report.blockers.length === 1 && report.blockers[0].commitmentTitle === "Incidencia Exactus");
check("una semana inexistente no devuelve informe", (await weeklyReport("no-existe")) === null);

// ── Markdown ───────────────────────────────────────────────────────────
const md = renderWeeklyReportMarkdown(report);
check("empieza por el frontmatter", md.startsWith("---\n"), md.slice(0, 12));
check("el frontmatter lleva el cumplimiento", md.includes("cumplimiento: 50%"));
check("el frontmatter lleva el trabajo no planificado", md.includes("trabajo_no_planificado: 33%"));
check("tiene un solo título de nivel 1", (md.match(/^# /gm) ?? []).length === 1);
check("trae las cinco secciones", ["## Resumen", "## Compromisos planificados", "## Trabajo no planificado", "## Dónde se fue el tiempo", "## Bloqueos"].every((h) => md.includes(h)));
check("lista el compromiso planificado", md.includes("Migrar módulo de CxC"));
check("lista el trabajo no planificado", md.includes("Incidencia Exactus"));
check("escapa las barras del título", md.includes("Reporte de cobranzas \\| con barra"));
check("dice el tiempo real por categoría", md.includes("| Reportes | 2h |"));
check("incluye los minutos interrumpidos", md.includes("Interrupciones dentro de bloques de foco: 15m."));
check("sin retro, no hay sección de retro", !md.includes("## Retro"));

// La retro aparece en cuanto la semana se cierra.
await prisma.weeklyCycle.update({
  where: { id: cycle.id },
  data: {
    status: "CLOSED",
    closedAt: new Date(),
    retroWentWell: "El reporte salió a tiempo.",
    retroToImprove: "Menos interrupciones de soporte.",
  },
});
const closed = await weeklyReport(cycle.id);
const closedMd = renderWeeklyReportMarkdown(closed!);
check("con la semana cerrada aparece la retro", closedMd.includes("## Retro") && closedMd.includes("El reporte salió a tiempo."));

// Una semana vacía no inventa números.
const emptyMonday = new Date(Date.UTC(2017, 2, 13));
const emptyBounds = weekBounds(emptyMonday);
await prisma.weeklyCycle.deleteMany({ where: { weekStart: emptyBounds.weekStart } });
const emptyCycle = await prisma.weeklyCycle.create({
  data: { weekStart: emptyBounds.weekStart, weekEnd: emptyBounds.weekEnd },
});
const empty = await weeklyReport(emptyCycle.id);
check("semana vacía: cumplimiento sin dato, no cero", empty!.metrics.compliance === null, String(empty!.metrics.compliance));
check("semana vacía: el markdown lo dice con palabras", renderWeeklyReportMarkdown(empty!).includes("_No se planificó nada esta semana._"));

// Limpieza.
await prisma.weeklyCycle.deleteMany({
  where: { id: { in: [cycle.id, emptyCycle.id] } },
});
await prisma.focusBlock.deleteMany({
  where: { date: { gte: weekStart, lte: weekEnd } },
});
check(
  "limpieza completa",
  (await prisma.weeklyCycle.count({ where: { id: { in: [cycle.id, emptyCycle.id] } } })) === 0 &&
    (await prisma.focusBlock.count({ where: { date: { gte: weekStart, lte: weekEnd } } })) === 0,
);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
