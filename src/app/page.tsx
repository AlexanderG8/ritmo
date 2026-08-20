import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ritmo</h1>
        <p className="text-muted-foreground mt-1">
          Forzar rendición de cuentas semanal cuando no hay jefe que la exija.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fase 0 completada</CardTitle>
          <CardDescription>
            Setup, auth y despliegue. El dashboard llega en la Fase 4.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Siguiente: Fase 1 — ciclo semanal, compromisos y la regla que impide
            cerrar una tarea sin documentar.
          </p>
          <p className="text-muted-foreground mt-3">
            Estado de la base de datos:{" "}
            <Link href="/api/health" className="underline">
              /api/health
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
