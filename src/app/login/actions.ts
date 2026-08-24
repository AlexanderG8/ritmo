"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionToken,
  passwordLoginEnabled,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // La puerta de respaldo se cierra desde el entorno: si está apagada, este
  // camino no existe aunque alguien envíe el formulario a mano.
  if (!passwordLoginEnabled()) {
    return { error: "El acceso por contraseña está desactivado." };
  }

  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    return { error: "Contraseña incorrecta." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/");
}
