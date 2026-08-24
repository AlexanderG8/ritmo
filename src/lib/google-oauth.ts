import { randomBytes } from "node:crypto";
import { ValidationError } from "@/lib/errors";

// Endpoints tomados del documento de descubrimiento de Google
// (https://accounts.google.com/.well-known/openid-configuration).
const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const STATE_COOKIE = "ritmo_oauth_state";
export const NONCE_COOKIE = "ritmo_oauth_nonce";
/** El ida y vuelta a Google no debería llevar más de unos minutos. */
export const HANDSHAKE_MAX_AGE = 10 * 60;

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function clientId(): string {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) throw new Error("Falta la variable de entorno GOOGLE_CLIENT_ID");
  return value;
}

function clientSecret(): string {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) {
    throw new Error("Falta la variable de entorno GOOGLE_CLIENT_SECRET");
  }
  return value;
}

/**
 * La URI de retorno tiene que coincidir carácter a carácter con la registrada
 * en Google Cloud Console. En producción se fija con APP_URL: detrás de un
 * proxy, el origen que ve el servidor no siempre es el público.
 */
export function redirectUri(requestOrigin: string): string {
  const base = process.env.APP_URL?.replace(/\/+$/, "") || requestOrigin;
  return `${base}/api/auth/google/callback`;
}

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export function authorizationUrl(options: {
  state: string;
  nonce: string;
  redirectUri: string;
}): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email");
  url.searchParams.set("state", options.state);
  url.searchParams.set("nonce", options.nonce);
  // Sin esto, Google recuerda la cuenta y no deja cambiarla nunca más.
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeCode(options: {
  code: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: options.code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: options.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new ValidationError("Google rechazó el intercambio del código.");
  }

  const data = (await response.json()) as { id_token?: string };
  if (!data.id_token) {
    throw new ValidationError("Google no devolvió un id_token.");
  }

  return data.id_token;
}

type IdTokenPayload = {
  iss?: string;
  aud?: string;
  exp?: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean | string;
};

function decodePayload(idToken: string): IdTokenPayload {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new ValidationError("El id_token no tiene forma de JWT.");
  }

  try {
    return JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as IdTokenPayload;
  } catch {
    throw new ValidationError("El id_token no se puede leer.");
  }
}

/**
 * Lee el id_token del flujo de código.
 *
 * No se verifica la firma **a propósito**: la documentación de Google dice que
 * en este flujo el token llega por un canal HTTPS directo, sin intermediarios,
 * autenticado con el client secret, así que se sabe que viene de Google. Lo que
 * sí se comprueba —emisor, destinatario, caducidad, nonce y correo verificado—
 * es lo que detecta una configuración equivocada o una respuesta reutilizada.
 *
 * Si algún día este token llegara desde el cliente en vez del token endpoint,
 * esta función deja de ser suficiente y hay que verificar la firma RS256
 * contra el JWKS.
 */
export function readIdToken(idToken: string, nonce: string): string {
  const payload = decodePayload(idToken);

  if (!payload.iss || !ISSUERS.includes(payload.iss)) {
    throw new ValidationError("El id_token no lo emitió Google.");
  }
  if (payload.aud !== clientId()) {
    throw new ValidationError("El id_token es para otra aplicación.");
  }
  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    throw new ValidationError("El id_token ya caducó.");
  }
  if (!payload.nonce || payload.nonce !== nonce) {
    throw new ValidationError("El nonce no coincide con el de la petición.");
  }
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new ValidationError("Google no da ese correo por verificado.");
  }
  if (!payload.email) {
    throw new ValidationError("El id_token no trae correo.");
  }

  return payload.email.toLowerCase();
}
