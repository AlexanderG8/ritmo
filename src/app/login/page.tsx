import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { passwordLoginEnabled } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/google-oauth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/**
 * Los motivos se traducen aquí y no en el callback: la pantalla no debe decir
 * si un correo existe, solo si puede entrar.
 */
const ERRORS: Record<string, string> = {
  "no-autorizado": "Esa cuenta no tiene acceso a Ritmo.",
  google: "Google no completó el acceso. Inténtalo otra vez.",
  "google-sin-configurar": "El acceso con Google no está configurado.",
  "sesion-caducada": "El acceso tardó demasiado. Empieza de nuevo.",
  "estado-invalido": "La respuesta no coincide con la petición. Empieza de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? ERRORS.google) : null;

  const google = isGoogleConfigured();
  const password = passwordLoginEnabled();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <p className="font-heading text-sm font-semibold tracking-[0.14em] uppercase">
          Ritmo
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Seguimiento profesional
        </p>

        <div className="bg-card ring-foreground/10 mt-6 flex flex-col gap-4 rounded-xl p-5 ring-1">
          {message ? (
            <p
              role="alert"
              className="text-destructive flex items-start gap-1.5 text-xs"
            >
              <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {message}
            </p>
          ) : null}

          {google ? (
            <Button asChild size="lg">
              <a href="/api/auth/google/start">Entrar con Google</a>
            </Button>
          ) : null}

          {google && password ? (
            <p className="text-muted-foreground text-xs">
              O con la contraseña de respaldo:
            </p>
          ) : null}

          {password ? <LoginForm /> : null}

          {!google && !password ? (
            <p className="text-muted-foreground text-xs text-pretty">
              No hay ningún método de acceso configurado. Define
              GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET, o activa la contraseña
              con ALLOW_PASSWORD_LOGIN=1.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
