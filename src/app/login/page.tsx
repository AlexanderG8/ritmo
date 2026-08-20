import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <p className="font-heading text-sm font-semibold tracking-[0.14em] uppercase">
          Ritmo
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Seguimiento profesional
        </p>

        <div className="bg-card ring-foreground/10 mt-6 rounded-xl p-5 ring-1">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
