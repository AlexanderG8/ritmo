import { NextResponse, type NextRequest } from "next/server";
import {
  HANDSHAKE_MAX_AGE,
  NONCE_COOKIE,
  STATE_COOKIE,
  authorizationUrl,
  isGoogleConfigured,
  randomToken,
  redirectUri,
} from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

/**
 * Arranca el flujo. El `state` protege de CSRF y el `nonce` de que te
 * devuelvan un id_token de otra sesión: los dos se guardan en cookies propias
 * y se comprueban en el callback.
 */
export function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google-sin-configurar", request.nextUrl.origin),
    );
  }

  const state = randomToken();
  const nonce = randomToken();

  const response = NextResponse.redirect(
    authorizationUrl({
      state,
      nonce,
      redirectUri: redirectUri(request.nextUrl.origin),
    }),
  );

  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HANDSHAKE_MAX_AGE,
  };

  response.cookies.set(STATE_COOKIE, state, options);
  response.cookies.set(NONCE_COOKIE, nonce, options);

  return response;
}
