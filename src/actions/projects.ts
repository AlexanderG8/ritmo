"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageFor } from "@/lib/errors";
import {
  createProject,
  deleteProject,
  projectInput,
  updateProject,
} from "@/server/projects";

export type ActionState = { error?: string; ok?: boolean };

function refresh(id?: string) {
  revalidatePath("/proyectos");
  if (id) revalidatePath(`/proyectos/${id}`);
}

function parse(formData: FormData) {
  return projectInput.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    module: formData.get("module") || undefined,
    status: formData.get("status"),
  });
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createProject(parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const id = String(formData.get("id"));

  try {
    await updateProject(id, parsed.data);
    refresh(id);
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await deleteProject(String(formData.get("id")));
  } catch (error) {
    return { error: messageFor(error) };
  }

  // Fuera del try: `redirect` funciona lanzando, y capturarlo aquí lo
  // convertiría en un error de formulario.
  refresh();
  redirect("/proyectos");
}
