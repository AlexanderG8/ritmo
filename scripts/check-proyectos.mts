import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { weekBounds } from "../src/lib/dates";
import { ValidationError } from "../src/lib/errors";
import {
  assignableProjects,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectMetrics,
  updateProject,
} from "../src/server/projects";

const results: [string, boolean, string?][] = [];
const check = (n: string, ok: boolean, d?: string) => results.push([n, ok, d]);

async function fails(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (error) {
    if (error instanceof ValidationError) return error.message;
    throw error;
  }
}

// Semana de prueba: lunes 5 de junio de 2017.
const monday = new Date(Date.UTC(2017, 5, 5));
const { weekStart, weekEnd } = weekBounds(monday);

const NAMES = ["Proyecto de prueba", "Proyecto renombrado", "Proyecto vacío"];
await prisma.project.deleteMany({ where: { name: { in: NAMES } } });
await prisma.weeklyCycle.deleteMany({ where: { weekStart } });
await prisma.focusBlock.deleteMany({
  where: { date: { gte: weekStart, lte: weekEnd } },
});

const cycle = await prisma.weeklyCycle.create({
  data: { weekStart, weekEnd, status: "ACTIVE", capacityMinutes: 1200 },
});

// ── Alta ───────────────────────────────────────────────────────────────
const project = await createProject({
  name: "Proyecto de prueba",
  description: "Para la suite.",
  module: "Exactus - CxC",
  status: "ACTIVE",
});
check("crea el proyecto", project.name === "Proyecto de prueba" && project.status === "ACTIVE");

const duplicate = await fails(() =>
  createProject({ name: "Proyecto de prueba", status: "ACTIVE" }),
);
check("rechaza un nombre repetido", duplicate !== null, duplicate ?? "no falló");

const empty = await createProject({ name: "Proyecto vacío", status: "PAUSED" });

// ── Compromisos y bloques ──────────────────────────────────────────────
const done = await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    projectId: project.id,
    title: "Pantalla de accesos",
    category: "DESARROLLO",
    plannedMinutes: 240,
    requiresDoc: false,
    status: "DONE",
    completedAt: new Date(),
  },
});

const open = await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    projectId: project.id,
    title: "Permisos por usuario",
    category: "DESARROLLO",
    plannedMinutes: 120,
    requiresDoc: false,
    status: "IN_PROGRESS",
  },
});

await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    projectId: project.id,
    title: "Idea descartada",
    category: "DESARROLLO",
    requiresDoc: false,
    status: "DROPPED",
  },
});

const at = (day: number, hh: number) => new Date(Date.UTC(2017, 5, day, hh));
await prisma.focusBlock.createMany({
  data: [
    {
      date: new Date(Date.UTC(2017, 5, 5)),
      category: "DESARROLLO",
      plannedStart: at(5, 9),
      plannedEnd: at(5, 12),
      actualStart: at(5, 9),
      actualEnd: at(5, 12),
      actualMinutes: 180,
      commitmentId: done.id,
    },
    {
      date: new Date(Date.UTC(2017, 5, 6)),
      category: "DOCUMENTACION",
      plannedStart: at(6, 9),
      plannedEnd: at(6, 10),
      actualStart: at(6, 9),
      actualEnd: at(6, 10),
      actualMinutes: 60,
      commitmentId: open.id,
    },
    // Abierto: no debe contar como tiempo trabajado.
    {
      date: new Date(Date.UTC(2017, 5, 7)),
      category: "DESARROLLO",
      plannedStart: at(7, 9),
      plannedEnd: at(7, 10),
      actualStart: at(7, 9),
      actualMinutes: 0,
      commitmentId: open.id,
    },
  ],
});

const doc = await prisma.document.create({
  data: {
    title: "Accesos del front de prueba",
    type: "FEATURE",
    projectId: project.id,
    contentMd: "Contenido suficientemente largo para pasar la validación.",
    tags: ["prueba"],
  },
});

// ── Métricas ───────────────────────────────────────────────────────────
const metrics = await projectMetrics(project.id);
check("cuenta los compromisos vivos, sin descartados", metrics.total === 2, String(metrics.total));
check("cuenta los cerrados", metrics.done === 1 && metrics.open === 1, `${metrics.done}/${metrics.open}`);
check("cumplimiento del proyecto", metrics.compliance === 0.5, String(metrics.compliance));
check("suma los minutos estimados", metrics.plannedMinutes === 360, String(metrics.plannedMinutes));
check("solo suma bloques cerrados", metrics.actualMinutes === 240, String(metrics.actualMinutes));
check("reparto por categoría ordenado", metrics.byCategory[0]?.category === "DESARROLLO" && metrics.byCategory[0]?.minutes === 180, JSON.stringify(metrics.byCategory));
check("cuenta los documentos", metrics.documents === 1, String(metrics.documents));
check("recuerda la primera semana tocada", metrics.firstWeek?.getTime() === weekStart.getTime());

const none = await projectMetrics(empty.id);
check("proyecto sin trabajo: cumplimiento sin dato, no cero", none.compliance === null, String(none.compliance));
check("proyecto sin trabajo: cero minutos", none.actualMinutes === 0 && none.total === 0);

// ── Lectura ────────────────────────────────────────────────────────────
const detail = await getProject(project.id);
check("el detalle trae compromisos y documentos", detail?.commitments.length === 3 && detail?.documents.length === 1, `${detail?.commitments.length}/${detail?.documents.length}`);
check("el detalle trae la semana de cada compromiso", detail?.commitments.every((c) => c.cycle.weekStart instanceof Date) === true);

const listed = await listProjects();
check("el listado incluye los dos de prueba", NAMES.slice(0, 1).concat("Proyecto vacío").every((name) => listed.some((p) => p.name === name)));
check("el listado cuenta compromisos y documentos", listed.find((p) => p.id === project.id)?._count.commitments === 3);

const assignable = await assignableProjects();
check("los asignables incluyen activos y en pausa", assignable.some((p) => p.id === project.id) && assignable.some((p) => p.id === empty.id));

// ── Edición ────────────────────────────────────────────────────────────
const renamed = await updateProject(project.id, {
  name: "Proyecto renombrado",
  status: "PAUSED",
});
check("renombra y cambia el estado", renamed.name === "Proyecto renombrado" && renamed.status === "PAUSED");
check("al renombrar se limpian los opcionales vacíos", renamed.module === null && renamed.description === null);

const clash = await fails(() =>
  updateProject(empty.id, { name: "Proyecto renombrado", status: "ACTIVE" }),
);
check("rechaza renombrar sobre un nombre ocupado", clash !== null, clash ?? "no falló");

await updateProject(project.id, { name: "Proyecto renombrado", status: "ARCHIVED" });
const archivedList = await assignableProjects();
check("un archivado deja de ser asignable", !archivedList.some((p) => p.id === project.id));

// ── Borrado ────────────────────────────────────────────────────────────
const blocked = await fails(() => deleteProject(project.id));
check("no se borra un proyecto con trabajo cerrado", blocked !== null, blocked ?? "no falló");

await deleteProject(empty.id);
check("sí se borra uno sin historial", (await prisma.project.count({ where: { id: empty.id } })) === 0);

// SetNull: el trabajo sobrevive al proyecto.
await prisma.commitment.update({
  where: { id: done.id },
  data: { status: "IN_PROGRESS", completedAt: null },
});
await deleteProject(project.id);

const survivor = await prisma.commitment.findUnique({ where: { id: done.id } });
const survivingDoc = await prisma.document.findUnique({ where: { id: doc.id } });
check("borrar el proyecto no borra sus compromisos", survivor !== null && survivor.projectId === null, String(survivor?.projectId));
check("borrar el proyecto no borra sus documentos", survivingDoc !== null && survivingDoc.projectId === null);
check("los bloques de foco siguen intactos", (await prisma.focusBlock.count({ where: { commitmentId: done.id } })) === 1);

// Limpieza.
await prisma.weeklyCycle.delete({ where: { id: cycle.id } });
await prisma.document.delete({ where: { id: doc.id } });
await prisma.focusBlock.deleteMany({
  where: { date: { gte: weekStart, lte: weekEnd } },
});
check(
  "limpieza completa",
  (await prisma.project.count({ where: { name: { in: NAMES } } })) === 0 &&
    (await prisma.weeklyCycle.count({ where: { id: cycle.id } })) === 0 &&
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
