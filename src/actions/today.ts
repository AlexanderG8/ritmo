"use server";

import { revalidatePath } from "next/cache";
import { messageFor } from "@/lib/errors";
import {
  addDistraction,
  createFocusBlock,
  deleteFocusBlock,
  focusBlockInput,
  startBlock,
  stopBlock,
} from "@/server/focus";
import { dailyLogInput, saveTodayLog } from "@/server/daily";

export type ActionState = { error?: string; ok?: boolean };

function refresh() {
  revalidatePath("/hoy");
  revalidatePath("/semana");
}

export async function createFocusBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = focusBlockInput.safeParse({
    category: formData.get("category"),
    plannedStart: formData.get("plannedStart"),
    plannedEnd: formData.get("plannedEnd"),
    commitmentId: formData.get("commitmentId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await createFocusBlock(parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function startBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await startBlock(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function stopBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await stopBlock(
      String(formData.get("id")),
      Number(formData.get("interruptedMinutes") ?? 0),
    );
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function addDistractionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await addDistraction(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function deleteFocusBlockAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await deleteFocusBlock(String(formData.get("id")));
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function saveDailyLogAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = dailyLogInput.safeParse({
    energyLevel: formData.get("energyLevel"),
    focusRating: formData.get("focusRating"),
    win: formData.get("win"),
    friction: formData.get("friction") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await saveTodayLog(parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
