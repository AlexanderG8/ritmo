import "dotenv/config";

// Entorno controlado: esta suite no toca la base de datos ni la red, solo las
// funciones puras que deciden quién entra.
process.env.AUTH_SECRET = "secreto-de-prueba-para-la-suite";
process.env.GOOGLE_CLIENT_ID = "id-de-prueba.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "secreto-de-prueba";
process.env.ALLOWED_EMAILS = " Persona@Ejemplo.com , otra@ejemplo.com ";
delete process.env.ALLOW_PASSWORD_LOGIN;

const {
  SESSION_MAX_AGE,
  createSessionToken,
  isAllowedEmail,
  passwordLoginEnabled,
  verifySession,
  verifySessionToken,
} = await import("../src/lib/auth");

const { authorizationUrl, readIdToken, redirectUri, randomToken } =
  await import("../src/lib/google-oauth");

const { ValidationError } = await import("../src/lib/errors");

const results: [string, boolean, string?][] = [];
const check = (n: string, ok: boolean, d?: string) => results.push([n, ok, d]);

function rejects(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (error) {
    if (error instanceof ValidationError) return error.message;
    throw error;
  }
}

function idToken(payload: Record<string, unknown>): string {
  const part = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "RS256" })}.${part(payload)}.firma-que-no-se-verifica`;
}

const validPayload = {
  iss: "https://accounts.google.com",
  aud: "id-de-prueba.apps.googleusercontent.com",
  exp: Math.floor(Date.now() / 1000) + 600,
  nonce: "nonce-correcto",
  email: "Persona@Ejemplo.com",
  email_verified: true,
};

// ── Lista blanca ───────────────────────────────────────────────────────
check("acepta un correo de la lista", isAllowedEmail("persona@ejemplo.com"));
check("ignora mayúsculas y espacios", isAllowedEmail("  PERSONA@ejemplo.COM  "));
check("acepta el segundo de la lista", isAllowedEmail("otra@ejemplo.com"));
check("rechaza un correo que no está", !isAllowedEmail("intruso@ejemplo.com"));
check("rechaza un correo vacío", !isAllowedEmail(""));
check("no acepta a nadie sin lista", (() => {
  const saved = process.env.ALLOWED_EMAILS;
  process.env.ALLOWED_EMAILS = "";
  const result = isAllowedEmail("persona@ejemplo.com");
  process.env.ALLOWED_EMAILS = saved;
  return !result;
})(), "una lista vacía no puede significar 'entra todo el mundo'");

// ── Contraseña de respaldo ─────────────────────────────────────────────
check("con Google configurado la contraseña queda apagada", !passwordLoginEnabled());
check("ALLOW_PASSWORD_LOGIN=1 la enciende", (() => {
  process.env.ALLOW_PASSWORD_LOGIN = "1";
  const on = passwordLoginEnabled();
  delete process.env.ALLOW_PASSWORD_LOGIN;
  return on;
})());
check("sin Google configurado sigue viva", (() => {
  const id = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  const on = passwordLoginEnabled();
  process.env.GOOGLE_CLIENT_ID = id;
  return on;
})(), "si no, un despliegue sin credenciales te deja fuera");

// ── Sesión ─────────────────────────────────────────────────────────────
const token = createSessionToken("persona@ejemplo.com");
const session = verifySession(token);
check("la sesión válida se acepta", session !== null);
check("el correo viaja dentro del token", session?.email === "persona@ejemplo.com", String(session?.email));
// Con margen: entre crear el token y leerlo pasa tiempo real, y comparar al
// milisegundo hace fallar la suite cuando la máquina va cargada.
const remaining = Math.round(((session?.expiresAt ?? 0) - Date.now()) / 1000);
check("caduca a los 30 días", remaining <= SESSION_MAX_AGE && remaining > SESSION_MAX_AGE - 10, String(remaining));

check("un token manipulado se rechaza", verifySession(token.replace("persona", "intruso")) === null);
check("una firma cambiada se rechaza", verifySession(`${token.slice(0, -1)}0`) === null);
check("un token inventado se rechaza", verifySession("1.2.3") === null);
check("sin token no hay sesión", verifySession(undefined) === null);
check("un token caducado se rechaza", verifySession(createSessionToken("persona@ejemplo.com", Date.now() - SESSION_MAX_AGE * 1000 - 1000)) === null);

// Los tokens del formato antiguo (sin correo) siguen valiendo: nadie tiene
// que volver a entrar por desplegar esto.
const legacyPayload = String(Date.now() + 60_000);
const { createHmac } = await import("node:crypto");
const legacy = `${legacyPayload}.${createHmac("sha256", process.env.AUTH_SECRET!).update(legacyPayload).digest("hex")}`;
check("un token del formato anterior sigue valiendo", verifySessionToken(legacy));
check("y se lee sin correo", verifySession(legacy)?.email === null);

// ── id_token de Google ─────────────────────────────────────────────────
check("lee el correo del id_token", readIdToken(idToken(validPayload), "nonce-correcto") === "persona@ejemplo.com");
check("normaliza el correo a minúsculas", readIdToken(idToken(validPayload), "nonce-correcto") === "persona@ejemplo.com");

const cases: [string, Record<string, unknown>][] = [
  ["rechaza otro emisor", { ...validPayload, iss: "https://malo.example" }],
  ["rechaza otro destinatario", { ...validPayload, aud: "otra-app" }],
  ["rechaza uno caducado", { ...validPayload, exp: Math.floor(Date.now() / 1000) - 10 }],
  ["rechaza un correo sin verificar", { ...validPayload, email_verified: false }],
  ["rechaza uno sin correo", { ...validPayload, email: undefined }],
];
for (const [name, payload] of cases) {
  const message = rejects(() => readIdToken(idToken(payload), "nonce-correcto"));
  check(name, message !== null, message ?? "no falló");
}

const wrongNonce = rejects(() => readIdToken(idToken(validPayload), "otro-nonce"));
check("rechaza un nonce que no coincide", wrongNonce !== null, wrongNonce ?? "no falló");
const notAJwt = rejects(() => readIdToken("esto-no-es-un-jwt", "nonce-correcto"));
check("rechaza lo que no es un JWT", notAJwt !== null, notAJwt ?? "no falló");
check("acepta email_verified como texto", readIdToken(idToken({ ...validPayload, email_verified: "true" }), "nonce-correcto") === "persona@ejemplo.com");

// ── URLs del flujo ─────────────────────────────────────────────────────
const state = randomToken();
const url = new URL(authorizationUrl({ state, nonce: "n", redirectUri: "https://app.example/api/auth/google/callback" }));
check("apunta al endpoint de Google", url.origin + url.pathname === "https://accounts.google.com/o/oauth2/v2/auth");
check("pide el flujo de código", url.searchParams.get("response_type") === "code");
check("pide openid y email", url.searchParams.get("scope") === "openid email");
check("lleva el state y el nonce", url.searchParams.get("state") === state && url.searchParams.get("nonce") === "n");
check("el state es impredecible", state.length === 64 && state !== randomToken());

check("la URI de retorno sale del origen", redirectUri("https://local.example") === "https://local.example/api/auth/google/callback");
check("APP_URL manda sobre el origen", (() => {
  process.env.APP_URL = "https://ritmo.example/";
  const uri = redirectUri("https://otro.example");
  delete process.env.APP_URL;
  return uri === "https://ritmo.example/api/auth/google/callback";
})(), "detrás de un proxy el origen que ve el servidor no es el público");

let failed = 0;
for (const [name, ok, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed === 0 ? "\nTodo correcto." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
