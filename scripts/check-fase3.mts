import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ValidationError } from "../src/lib/errors";
import {
  createDocument,
  deleteDocument,
  documentInput,
  getDocument,
  linkDocument,
  listDocuments,
  promoteDocNotes,
  unlinkDocument,
  updateDocument,
} from "../src/server/documents";
import { completeCommitment } from "../src/server/commitments";
import { weekMetrics } from "../src/server/metrics";
import { exportDocument, exportEverything, slugify } from "../src/server/export";
import { weekBounds } from "../src/lib/dates";

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

const contenido =
  "## Qué hace\nAsciende notas a documentos.\n\n## Cómo se usa\nDesde /semana.";

// ── Validación de entrada ──────────────────────────────────────────
check("contenido demasiado corto rechazado", documentInput.safeParse({ title: "Un titulo valido", type: "FEATURE", contentMd: "corto" }).success === false);
check("tipo inválido rechazado", documentInput.safeParse({ title: "Un titulo valido", type: "OTRO", contentMd: contenido }).success === false);
const parsed = documentInput.safeParse({ title: "Un titulo valido", type: "FEATURE", contentMd: contenido, tags: " Exactus , CxC ,, exactus " });
check("etiquetas normalizadas a minúsculas", parsed.success && JSON.stringify(parsed.data.tags) === '["exactus","cxc","exactus"]', parsed.success ? JSON.stringify(parsed.data.tags) : "no parseó");

check("slugify quita tildes y símbolos", slugify("Órdenes de Pago: guía #1") === "ordenes-de-pago-guia-1", slugify("Órdenes de Pago: guía #1"));

// ── Semana de prueba ───────────────────────────────────────────────
const { weekStart, weekEnd } = weekBounds(new Date(Date.UTC(2018, 0, 10)));
await prisma.weeklyCycle.deleteMany({ where: { weekStart } });
const cycle = await prisma.weeklyCycle.create({ data: { weekStart, weekEnd } });

// ── Ascender notas de Fase 1 a documento real ──────────────────────
const withNotes = await prisma.commitment.create({
  data: {
    cycleId: cycle.id,
    title: "Compromiso con notas embebidas",
    category: "DESARROLLO",
    docNotes: contenido,
  },
});

const promoted = await promoteDocNotes(withNotes.id, { title: "Documento ascendido", type: "FEATURE" });
const afterPromote = await prisma.commitment.findUniqueOrThrow({
  where: { id: withNotes.id },
  include: { _count: { select: { documents: true } } },
});
check("ascender crea el documento", promoted.contentMd === contenido);
check("ascender vincula el documento", afterPromote._count.documents === 1);
check("ascender limpia las notas embebidas", afterPromote.docNotes === null);
await expectFail("no se asciende dos veces", () => promoteDocNotes(withNotes.id, { title: "Otro", type: "FEATURE" }));

// ── La regla sigue viva con documento en vez de notas ──────────────
const done = await completeCommitment(withNotes.id);
check("un documento vinculado satisface el DoD", done.status === "DONE");

// ── No se puede dejar huérfano un compromiso cerrado ───────────────
await expectFail("no se desvincula la única prueba de un cerrado", () => unlinkDocument(withNotes.id, promoted.id));
await expectFail("no se borra la única prueba de un cerrado", () => deleteDocument(promoted.id));

// Con un segundo documento vinculado, sí se puede soltar el primero.
const second = await createDocument({ title: "Segundo documento", type: "PROCESO", contentMd: contenido, tags: [] });
await linkDocument(withNotes.id, second.id);
await expectFail("no se vincula dos veces el mismo par", () => linkDocument(withNotes.id, second.id));
await unlinkDocument(withNotes.id, promoted.id);
const afterUnlink = await prisma.commitment.findUniqueOrThrow({ where: { id: withNotes.id }, include: { _count: { select: { documents: true } } } });
check("con otra prueba sí se puede desvincular", afterUnlink._count.documents === 1);

// N:N de verdad: un documento en varios compromisos.
const other = await prisma.commitment.create({ data: { cycleId: cycle.id, title: "Otro compromiso", category: "SOPORTE" } });
await linkDocument(other.id, second.id);
const shared = await getDocument(second.id);
check("un documento puede cubrir varios compromisos", shared!.commitments.length === 2, `${shared!.commitments.length} vínculos`);

// ── La deuda de documentación reconoce los documentos ──────────────
const all = await prisma.commitment.findMany({
  where: { cycleId: cycle.id },
  include: { documents: { select: { documentId: true } } },
});
const metrics = weekMetrics(cycle, all);
check("un cerrado con documento no genera deuda", metrics.docDebt === 0, `deuda=${metrics.docDebt}`);

// ── Búsqueda ───────────────────────────────────────────────────────
await updateDocument(second.id, { title: "Segundo documento", type: "PROCESO", module: "Exactus - CxC", contentMd: contenido, tags: ["exactus"] });
check("busca por módulo", (await listDocuments({ query: "exactus - cx" })).some((d) => d.id === second.id));
check("busca por contenido", (await listDocuments({ query: "asciende notas" })).some((d) => d.id === second.id));
check("busca por etiqueta", (await listDocuments({ query: "exactus" })).some((d) => d.id === second.id));
check("filtra por tipo", (await listDocuments({ type: "PROCESO" })).every((d) => d.type === "PROCESO"));
check("búsqueda sin resultados devuelve vacío", (await listDocuments({ query: "zzzzz-no-existe" })).length === 0);

// ── Exportación ────────────────────────────────────────────────────
const one = await exportDocument(second.id);
check("exporta un documento con frontmatter", one !== null && one.startsWith("---\n") && one.includes("# Segundo documento"));
check("exportar un id inexistente devuelve null", (await exportDocument("no-existe")) === null);

// Una nota sin ascender debe salir igualmente en la exportación completa.
const pendiente = await prisma.commitment.create({
  data: { cycleId: cycle.id, title: "Nota que nadie ascendió", category: "REPORTES", docNotes: "Texto que no debe perderse en la exportación." },
});
const todo = await exportEverything();
check("la exportación incluye los documentos", todo.includes("Segundo documento"));
check("y también las notas sin ascender", todo.includes("Texto que no debe perderse en la exportación."), "si esto falla, la promesa de exportar es falsa");

// ── Limpieza ───────────────────────────────────────────────────────
await prisma.weeklyCycle.delete({ where: { id: cycle.id } });
await prisma.document.deleteMany({ where: { id: { in: [promoted.id, second.id] } } });
check("limpieza completa", (await prisma.document.count()) === 0 && (await prisma.commitment.count({ where: { id: { in: [withNotes.id, other.id, pendiente.id] } } })) === 0);

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
await prisma.$disconnect();
process.exit(failed === 0 ? 0 : 1);
