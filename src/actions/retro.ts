"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { messageFor } from "@/lib/errors";
import { closeCycle, retroInput } from "@/server/retro";
import {
  blockerInput,
  createBlocker,
  deleteBlocker,
  resolveBlocker,
} from "@/server/blockers";

export type ActionState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/semana");
  revalidatePath("/semana/retro");
  revalidatePath("/semana/historial");
  revalidatePath("/metricas");
}

export async function closeCycleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = retroInput.safeParse({
    wentWell: formData.get("wentWell"),
    toImprove: formData.get("toImprove"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await closeCycle(
      String(formData.get("cycleId")),
      parsed.data,
      formData.getAll("carryOver").map(String),
    );
    refresh();
  } catch (error) {
    return { error: messageFor(error) };
  }

  redirect("/semana/historial");
}

export async function createBlockerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = blockerInput.safeParse({
    description: formData.get("description"),
    commitmentId: formData.get("commitmentId") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await createBlocker(String(formData.get("cycleId")), parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function resolveBlockerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await resolveBlocker(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteBlockerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await deleteBlocker(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
