import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CommitmentForm } from "@/components/commitment-form";
import { CapacityForm, StartWeekForm } from "@/components/planning-forms";
import { formatDate, formatMinutes } from "@/lib/dates";
import { categoryLabel, priorityLabel } from "@/lib/labels";
import { getCurrentCycleWithCommitments } from "@/server/cycles";

export const dynamic = "force-dynamic";

export default async function PlanificarPage() {
  const { cycle, commitments } = await getCurrentCycleWithCommitments();

  const planned = commitments.filter((c) => c.wasPlanned);
  const committedMinutes = planned.reduce(
    (sum, c) => sum + (c.plannedMinutes ?? 0),
    0,
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Ritual del lunes
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          15 minutos. Semana del {formatDate(cycle.weekStart)} al{" "}
          {formatDate(cycle.weekEnd)}.
        </p>
      </header>

      {cycle.status !== "PLANNING" ? (
        <Card>
          <CardHeader>
            <CardTitle>La semana ya está en curso</CardTitle>
            <CardDescription>
              El ritual del lunes ya se hizo. Lo que agregues ahora se registra
              como trabajo no planificado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/semana">Ver la semana</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>1. Declara tu capacidad</CardTitle>
              <CardDescription>
                Sin esto no se puede saber si te comprometes a poco.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CapacityForm
                cycleId={cycle.id}
                capacityMinutes={cycle.capacityMinutes}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Define 3 a 5 compromisos</CardTitle>
              <CardDescription>
                Concretos. &quot;Avanzar en el módulo&quot; no es un compromiso;
                &quot;cerrar la pantalla de aprobación de OP&quot; sí.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommitmentForm cycleId={cycle.id} unplanned={false} />
            </CardContent>
          </Card>

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium">
                Comprometido ({planned.length})
              </h2>
              <p className="text-muted-foreground text-sm">
                {formatMinutes(committedMinutes)}
                {cycle.capacityMinutes
                  ? ` de ${formatMinutes(cycle.capacityMinutes)}`
                  : ""}
              </p>
            </div>

            {planned.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Todavía nada. Una semana sin compromisos escritos es una semana
                sin rendición de cuentas.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {planned.map((commitment) => (
                  <li
                    key={commitment.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                  >
                    <span>{commitment.title}</span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      <Badge variant="outline">
                        {categoryLabel[commitment.category]}
                      </Badge>
                      <span>{priorityLabel[commitment.priority]}</span>
                      {commitment.plannedMinutes ? (
                        <span>{formatMinutes(commitment.plannedMinutes)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>3. Arranca</CardTitle>
              <CardDescription>
                A partir de aquí, todo lo que entre queda marcado como no
                planificado. Ese es el punto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StartWeekForm cycleId={cycle.id} />
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
