import { createHmac, createHash, timingSafeEqual } from "node:crypto";

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
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("Falta la variable de entorno APP_PASSWORD");
  return safeEqual(input, expected);
}

/** Token = "<expiraEnMs>.<hmac>". No guarda nada en base de datos. */
export function createSessionToken(now: number = Date.now()): string {
  const payload = String(now + SESSION_MAX_AGE * 1000);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}
