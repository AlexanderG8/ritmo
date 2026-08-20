"use server";

import { revalidatePath } from "next/cache";
import { messageFor } from "@/lib/errors";
import { setCapacity, startWeek } from "@/server/cycles";
import {
  changeStatus,
  commitmentInput,
  completeCommitment,
  createCommitment,
  deleteCommitment,
  updateDocNotes,
} from "@/server/commitments";
import type { CommitmentStatus } from "@/generated/prisma/enums";

export type ActionState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/semana");
  revalidatePath("/semana/planificar");
}

export async function createCommitmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = commitmentInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    category: formData.get("category"),
    priority: formData.get("priority"),
    plannedMinutes: formData.get("plannedMinutes") || undefined,
    // Un checkbox desmarcado no viaja en el FormData: ausente = false.
    requiresDoc: formData.get("requiresDoc") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createCommitment(String(formData.get("cycleId")), parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function completeCommitmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await completeCommitment(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function saveDocNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await updateDocNotes(
      String(formData.get("id")),
      String(formData.get("docNotes") ?? ""),
    );
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function changeStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await changeStatus(
      String(formData.get("id")),
      String(formData.get("status")) as CommitmentStatus,
    );
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteCommitmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await deleteCommitment(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function setCapacityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await setCapacity(
      String(formData.get("cycleId")),
      Number(formData.get("capacityMinutes")),
    );
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function startWeekAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await startWeek(String(formData.get("cycleId")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
