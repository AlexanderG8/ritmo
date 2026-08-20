import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { DocType } from "@/generated/prisma/enums";

export const documentInput = z.object({
  title: z
    .string()
    .trim()
    .min(4, "El título es demasiado vago.")
    .max(140, "Máximo 140 caracteres."),
  type: z.enum(DocType),
  module: z.string().trim().max(80).optional(),
  contentMd: z
    .string()
    .trim()
    .min(
      30,
      "Eso no es documentación, es una nota. Di qué hace, cómo se usa y qué decidiste.",
    ),
  tags: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 10)
        : [],
    ),
});

export type DocumentInput = z.infer<typeof documentInput>;

export async function listDocuments(options: {
  query?: string;
  type?: DocType;
} = {}) {
  const query = options.query?.trim();

  return prisma.document.findMany({
    where: {
      type: options.type,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { module: { contains: query, mode: "insensitive" } },
              { contentMd: { contains: query, mode: "insensitive" } },
              { tags: { has: query.toLowerCase() } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { commitments: true } } },
  });
}

export async function getDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      commitments: {
        include: {
          commitment: {
            select: { id: true, title: true, status: true, cycleId: true },
          },
        },
      },
    },
  });
}

export async function createDocument(input: DocumentInput) {
  return prisma.document.create({
    data: {
      title: input.title,
      type: input.type,
      module: input.module || null,
      contentMd: input.contentMd,
      tags: input.tags,
    },
  });
}

export async function updateDocument(id: string, input: DocumentInput) {
  return prisma.document.update({
    where: { id },
    data: {
      title: input.title,
      type: input.type,
      module: input.module || null,
      contentMd: input.contentMd,
      tags: input.tags,
    },
  });
}

/**
 * Un compromiso ya cerrado no puede quedarse sin documentación: eso crearía
 * deuda retroactiva y vaciaría la regla del proyecto por la puerta de atrás.
 */
async function assertNotLastProofOfDone(documentId: string) {
  const links = await prisma.commitmentDocument.findMany({
    where: { documentId },
    include: {
      commitment: {
        select: {
          id: true,
          title: true,
          status: true,
          requiresDoc: true,
          docNotes: true,
          _count: { select: { documents: true } },
        },
      },
    },
  });

  const orphaned = links.find(
    ({ commitment }) =>
      commitment.status === "DONE" &&
      commitment.requiresDoc &&
      !commitment.docNotes?.trim() &&
      commitment._count.documents <= 1,
  );

  if (orphaned) {
    throw new ValidationError(
      `Es la única documentación de "${orphaned.commitment.title}", que ya está cerrado. Documéntalo de otra forma antes de quitarlo.`,
    );
  }
}

export async function deleteDocument(id: string) {
  await assertNotLastProofOfDone(id);
  return prisma.document.delete({ where: { id } });
}

export async function linkDocument(commitmentId: string, documentId: string) {
  const existing = await prisma.commitmentDocument.findUnique({
    where: { commitmentId_documentId: { commitmentId, documentId } },
  });

  if (existing) {
    throw new ValidationError("Ese compromiso ya está vinculado.");
  }

  return prisma.commitmentDocument.create({
    data: { commitmentId, documentId },
  });
}

export async function unlinkDocument(commitmentId: string, documentId: string) {
  const commitment = await prisma.commitment.findUniqueOrThrow({
    where: { id: commitmentId },
    include: { _count: { select: { documents: true } } },
  });

  if (
    commitment.status === "DONE" &&
    commitment.requiresDoc &&
    !commitment.docNotes?.trim() &&
    commitment._count.documents <= 1
  ) {
    throw new ValidationError(
      "No puedes dejar sin documentación un compromiso ya cerrado.",
    );
  }

  return prisma.commitmentDocument.delete({
    where: { commitmentId_documentId: { commitmentId, documentId } },
  });
}

/**
 * Fase 1 guardaba la documentación como texto suelto en el compromiso.
 * Esto la asciende a documento real sin perder el vínculo ni la regla.
 */
export async function promoteDocNotes(
  commitmentId: string,
  meta: { title: string; type: DocType; module?: string },
) {
  const commitment = await prisma.commitment.findUniqueOrThrow({
    where: { id: commitmentId },
  });

  const notes = commitment.docNotes?.trim();
  if (!notes) {
    throw new ValidationError("Este compromiso no tiene notas que ascender.");
  }

  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        title: meta.title,
        type: meta.type,
        module: meta.module || null,
        contentMd: notes,
        tags: [],
      },
    });

    await tx.commitmentDocument.create({
      data: { commitmentId, documentId: document.id },
    });

    // Solo se limpian las notas una vez el documento existe y está vinculado:
    // si algo falla, la transacción deja el compromiso documentado como estaba.
    await tx.commitment.update({
      where: { id: commitmentId },
      data: { docNotes: null },
    });

    return document;
  });
}
