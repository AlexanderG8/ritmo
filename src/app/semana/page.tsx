import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { CommitmentItem } from "@/components/commitment-item";
import { Metric } from "@/components/metric";
import { formatDate, formatMinutes } from "@/lib/dates";
import { cycleStatusLabel } from "@/lib/labels";
import { getCurrentCycleWithCommitments } from "@/server/cycles";
import { formatPercent, weekMetrics } from "@/server/metrics";

export const dynamic = "force-dynamic";

export default async function SemanaPage() {
  const { cycle, commitments } = await getCurrentCycleWithCommitments();
  const metrics = weekMetrics(cycle, commitments);

  const open = commitments.filter(
    (c) => c.status !== "DONE" && c.status !== "DROPPED",
  );
  const closed = commitments.filter(
    (c) => c.status === "DONE" || c.status === "DROPPED",
  );

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Semana del {formatDate(cycle.weekStart)} al{" "}
            {formatDate(cycle.weekEnd)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {cycle.capacityMinutes
              ? `Capacidad declarada: ${formatMinutes(cycle.capacityMinutes)}`
              : "Sin capacidad declarada"}
          </p>
        </div>
        <Badge variant="secondary">{cycleStatusLabel[cycle.status]}</Badge>
      </header>

      {cycle.status === "PLANNING" ? (
        <Alert>
          <AlertTitle>La semana todavía no arranca</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>
              Mientras el ciclo esté en planificación, todo lo que agregues
              cuenta como planificado. Cierra el ritual del lunes para que lo
              que entre después se registre como no planificado.
            </span>
            <Button asChild size="sm">
              <Link href="/semana/planificar">Ir a planificar</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Cumplimiento"
          value={formatPercent(metrics.compliance)}
          hint={`${metrics.plannedDone} de ${metrics.plannedTotal} planificados`}
          tone={
            metrics.compliance === null
              ? "neutral"
              : metrics.compliance >= 0.8
                ? "good"
                : "bad"
          }
        />
        <Metric
          label="Trabajo no planificado"
          value={formatPercent(metrics.unplannedShare)}
          hint={`${metrics.unplannedTotal} tareas entraron a mitad de semana`}
        />
        <Metric
          label="Compromiso vs capacidad"
          value={formatPercent(metrics.commitmentRatio)}
          hint={formatMinutes(metrics.committedMinutes) + " comprometidos"}
          tone={
            metrics.commitmentRatio === null
              ? "neutral"
              : metrics.commitmentRatio < 0.7
                ? "bad"
                : "good"
          }
        />
        <Metric
          label="Deuda de documentación"
          value={String(metrics.docDebt)}
          hint="Debe ser 0 siempre"
          tone={metrics.docDebt === 0 ? "good" : "bad"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Abiertos ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nada abierto. O terminaste la semana, o no te comprometiste a nada.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {open.map((commitment) => (
              <CommitmentItem key={commitment.id} commitment={commitment} />
            ))}
          </ul>
        )}
      </section>

      {closed.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Cerrados ({closed.length})</h2>
          <ul className="flex flex-col gap-3">
            {closed.map((commitment) => (
              <CommitmentItem key={commitment.id} commitment={commitment} />
            ))}
          </ul>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {cycle.status === "PLANNING"
              ? "Agregar compromiso"
              : "Registrar trabajo no planificado"}
          </CardTitle>
          <CardDescription>
            {cycle.status === "PLANNING"
              ? "Concreto y verificable. 3 a 5 por semana, no quince."
              : "La semana ya arrancó: esto se registra como no planificado, y así debe ser."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommitmentForm
            cycleId={cycle.id}
            unplanned={cycle.status !== "PLANNING"}
          />
        </CardContent>
      </Card>
    </main>
  );
}
