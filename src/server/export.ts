import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { categoryLabel, docTypeLabel } from "@/lib/labels";
import type { DocType } from "@/generated/prisma/enums";

/** Cabecera YAML. La comparten la exportación de documentos y el informe semanal. */
export function frontmatter(fields: Record<string, string | undefined>): string {
  const lines = Object.entries(fields)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);
  return ["---", ...lines, "---"].join("\n");
}

function renderDocument(doc: {
  title: string;
  type: DocType;
  module: string | null;
  tags: string[];
  contentMd: string;
  createdAt: Date;
  updatedAt: Date;
}): string {
  return [
    frontmatter({
      titulo: doc.title,
      tipo: docTypeLabel[doc.type],
      modulo: doc.module ?? undefined,
      tags: doc.tags.length ? doc.tags.join(", ") : undefined,
      creado: doc.createdAt.toISOString(),
      actualizado: doc.updatedAt.toISOString(),
    }),
    "",
    `# ${doc.title}`,
    "",
    doc.contentMd.trim(),
    "",
  ].join("\n");
}

export async function exportDocument(id: string): Promise<string | null> {
  const doc = await prisma.document.findUnique({ where: { id } });
  return doc ? renderDocument(doc) : null;
}

/**
 * Exportación completa. Incluye a propósito las notas que todavía viven dentro
 * de un compromiso (Fase 1) y no se han ascendido a documento: si se quedaran
 * fuera, la promesa de "tu documentación puede salir de la app" sería falsa.
 */
export async function exportEverything(): Promise<string> {
  const [documents, pending] = await Promise.all([
    prisma.document.findMany({ orderBy: [{ type: "asc" }, { title: "asc" }] }),
    prisma.commitment.findMany({
      where: { docNotes: { not: null } },
      orderBy: { createdAt: "asc" },
      include: { cycle: { select: { weekStart: true } } },
    }),
  ]);

  const parts: string[] = [
    frontmatter({
      exportado: new Date().toISOString(),
      documentos: String(documents.length),
      notas_sin_ascender: String(pending.length),
    }),
    "",
    "# Documentación de Ritmo",
    "",
  ];

  if (documents.length === 0 && pending.length === 0) {
    parts.push("_Todavía no hay nada documentado._", "");
  }

  for (const doc of documents) {
    parts.push("---", "", renderDocument(doc));
  }

  if (pending.length > 0) {
    parts.push(
      "---",
      "",
      "## Notas todavía dentro de compromisos",
      "",
      "Documentación escrita en la Fase 1 que aún no es un documento propio.",
      "",
    );

    for (const commitment of pending) {
      parts.push(
        `### ${commitment.title}`,
        "",
        `- Categoría: ${categoryLabel[commitment.category]}`,
        `- Semana: ${formatDate(commitment.cycle.weekStart, "d 'de' MMMM 'de' yyyy")}`,
        `- Estado: ${commitment.status}`,
        "",
        commitment.docNotes!.trim(),
        "",
      );
    }
  }

  return parts.join("\n");
}

/** Nombre de archivo seguro a partir de un título. */
export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "documento"
  );
}
