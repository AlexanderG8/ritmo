"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageFor } from "@/lib/errors";
import {
  createDocument,
  deleteDocument,
  documentInput,
  linkDocument,
  promoteDocNotes,
  unlinkDocument,
  updateDocument,
} from "@/server/documents";
import type { DocType } from "@/generated/prisma/enums";

export type ActionState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/docs");
  revalidatePath("/semana");
}

function parse(formData: FormData) {
  return documentInput.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    module: formData.get("module") || undefined,
    contentMd: formData.get("contentMd"),
    tags: formData.get("tags") || undefined,
  });
}

export async function createDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let id: string;
  try {
    const document = await createDocument(parsed.data);
    id = document.id;
    refresh();
  } catch (error) {
    return { error: messageFor(error) };
  }

  // Fuera del try: redirect() señaliza lanzando y no es un error que capturar.
  redirect(`/docs/${id}`);
}

export async function updateDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const id = String(formData.get("id"));
    await updateDocument(id, parsed.data);
    revalidatePath(`/docs/${id}`);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await deleteDocument(String(formData.get("id")));
    refresh();
  } catch (error) {
    return { error: messageFor(error) };
  }

  redirect("/docs");
}

export async function linkDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const documentId = String(formData.get("documentId"));
  try {
    await linkDocument(String(formData.get("commitmentId")), documentId);
    revalidatePath(`/docs/${documentId}`);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function unlinkDocumentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const documentId = String(formData.get("documentId"));
  try {
    await unlinkDocument(String(formData.get("commitmentId")), documentId);
    revalidatePath(`/docs/${documentId}`);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function promoteDocNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 4) {
    return { error: "Ponle un título al documento antes de ascenderlo." };
  }

  let id: string;
  try {
    const document = await promoteDocNotes(
      String(formData.get("commitmentId")),
      {
        title,
        type: String(formData.get("type") ?? "FEATURE") as DocType,
        module: String(formData.get("module") ?? "") || undefined,
      },
    );
    id = document.id;
    refresh();
  } catch (error) {
    return { error: messageFor(error) };
  }

  redirect(`/docs/${id}`);
}
