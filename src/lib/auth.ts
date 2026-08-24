import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { isGoogleConfigured } from "@/lib/google-oauth";

export const SESSION_COOKIE = "ritmo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta la variable de entorno AUTH_SECRET");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Compara sin filtrar información por tiempo de respuesta. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * La contraseña única sobrevive como respaldo para no quedarte fuera de tu
 * propia app si el OAuth de Google está mal configurado en producción.
 *
 * `ALLOW_PASSWORD_LOGIN` manda: "1" la fuerza encendida, "0" la apaga. Sin
 * decidir nada, sigue viva mientras Google no esté configurado. El valor por
 * defecto se elige así a propósito: equivocarse hacia "no puedo entrar en mi
 * app" es peor que equivocarse hacia "sigue habiendo contraseña".
 */
export function passwordLoginEnabled(): boolean {
  const flag = process.env.ALLOW_PASSWORD_LOGIN;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return !isGoogleConfigured();
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("Falta la variable de entorno APP_PASSWORD");
  return safeEqual(input, expected);
}

/**
 * Quién puede entrar. Lista blanca explícita: sin ella no entra nadie por
 * Google, porque un OAuth abierto deja pasar a cualquier cuenta del mundo.
 */
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return allowedEmails().some((allowed) => safeEqual(allowed, normalized));
}

export type Session = { email: string | null; expiresAt: number };

/**
 * Token = "<expiraEnMs>.<email>.<hmac>". No guarda nada en base de datos: se
 * valida criptográficamente. El correo viaja dentro del payload firmado, así
 * que no se puede cambiar sin romper la firma.
 */
export function createSessionToken(
  email: string | null = null,
  now: number = Date.now(),
): string {
  const payload = `${now + SESSION_MAX_AGE * 1000}.${email ?? ""}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, sign(payload))) return null;

  // Los tokens antiguos eran solo "<expiraEnMs>", sin correo. Siguen valiendo:
  // la firma es sobre el payload completo, sea cual sea su forma.
  const cut = payload.indexOf(".");
  const expiresAt = Number(cut < 0 ? payload : payload.slice(0, cut));
  const email = cut < 0 ? null : payload.slice(cut + 1) || null;

  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;

  return { email, expiresAt };
}

export function verifySessionToken(token: string | undefined): boolean {
  return verifySession(token) !== null;
}
