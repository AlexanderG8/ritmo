import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  isAllowedEmail,
  safeEqual,
} from "@/lib/auth";
import {
  NONCE_COOKIE,
  STATE_COOKIE,
  exchangeCode,
  isGoogleConfigured,
  readIdToken,
  redirectUri,
} from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

function back(request: NextRequest, error: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${error}`, request.nextUrl.origin),
  );
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NONCE_COOKIE);
  return response;
}

/**
 * Vuelta de Google. El orden importa: primero se comprueba que la respuesta
 * es de la petición que salió de aquí (`state`), después se canjea el código y
 * solo al final se mira la lista blanca.
 */
export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) return back(request, "google-sin-configurar");

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return back(request, "google");

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  if (!code || !state || !expectedState || !nonce) {
    return back(request, "sesion-caducada");
  }
  if (!safeEqual(state, expectedState)) {
    return back(request, "estado-invalido");
  }

  let email: string;
  try {
    const idToken = await exchangeCode({
      code,
      redirectUri: redirectUri(request.nextUrl.origin),
    });
    email = readIdToken(idToken, nonce);
  } catch {
    return back(request, "google");
  }

  // La comprobación de la lista blanca va aquí y en ningún otro sitio.
  if (!isAllowedEmail(email)) {
    return back(request, "no-autorizado");
  }

  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));

  response.cookies.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NONCE_COOKIE);

  return response;
}
