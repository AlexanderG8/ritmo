import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Rutas que se atraviesan sin sesión. El handshake con Google tiene que estar
 * aquí: si no, el callback se redirige al login antes de poder crear la
 * sesión, y el login por Google no llega a funcionar nunca.
 */
const PUBLIC = ["/login", "/api/auth/google"];

// Next.js 16 renombró `middleware.ts` a `proxy.ts`. Corre en runtime Node.js
// (no edge), por eso aquí sí se puede usar node:crypto para validar la firma.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isPublic) return NextResponse.next();

  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
