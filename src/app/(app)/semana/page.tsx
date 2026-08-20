import Link from "next/link";
import { CalendarClock, Inbox } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes } from "@/lib/dates";
import { cycleStatusLabel } from "@/lib/labels";
import { getCurrentCycleWithCommitments } from "@/server/cycles";
import { formatPercent, weekMetrics } from "@/server/metrics";
import { minutesByCommitment } from "@/server/focus";

export const dynamic = "force-dynamic";

export default async function SemanaPage() {
  const { cycle, commitments } = await getCurrentCycleWithCommitments();
  const metrics = weekMetrics(cycle, commitments);
  // Los minutos reales se derivan de los bloques de foco, no de una columna
  // que habría que mantener sincronizada a mano.
  const minutes = await minutesByCommitment(commitments.map((c) => c.id));

  const open = commitments.filter(
    (c) => c.status !== "DONE" && c.status !== "DROPPED",
  );
  const closed = commitments.filter(
    (c) => c.status === "DONE" || c.status === "DROPPED",
  );

  const ratio = metrics.commitmentRatio;
  // Sin un solo compromiso registrado, un cero no es un logro: es ausencia de
  // datos. Pintarlo de verde sería exactamente la mentira que la app evita.
  const hasData = commitments.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <>
            Semana del {formatDate(cycle.weekStart)} al{" "}
            {formatDate(cycle.weekEnd)}
          </>
        }
        description={
          cycle.capacityMinutes
            ? `Capacidad declarada: ${formatMinutes(cycle.capacityMinutes)}`
            : "Sin capacidad declarada"
        }
        aside={
          <Badge variant={cycle.status === "ACTIVE" ? "secondary" : "outline"}>
            {cycleStatusLabel[cycle.status]}
          </Badge>
        }
      />

      {cycle.status === "PLANNING" ? (
        <Alert>
          <CalendarClock />
          <AlertTitle>La semana todavía no arranca</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span className="max-w-prose">
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

      {/* Las tres que deciden si la semana valió. */}
      <Section>
        <SectionTitle>Cómo va la semana</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            emphasis="primary"
            label="Cumplimiento"
            value={formatPercent(metrics.compliance)}
            hint={`${metrics.plannedDone} de ${metrics.plannedTotal} planificados`}
            target="Meta ≥ 80%"
            tone={
              metrics.compliance === null
                ? "neutral"
                : metrics.compliance >= 0.8
                  ? "good"
                  : "bad"
            }
          />
          <Metric
            emphasis="primary"
            label="Trabajo no planificado"
            value={formatPercent(metrics.unplannedShare)}
            hint={
              metrics.unplannedTotal === 1
                ? "1 tarea entró a mitad de semana"
                : `${metrics.unplannedTotal} tareas entraron a mitad de semana`
            }
            target="Meta: conocerlo"
          />
          <Metric
            emphasis="primary"
            label="Arrastre"
            value={String(metrics.carriedOver)}
            hint="Tareas que pasan a la semana siguiente"
            target="Meta ≤ 1 por semana"
            tone={
              !hasData ? "neutral" : metrics.carriedOver <= 1 ? "good" : "bad"
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Compromiso vs capacidad"
            value={formatPercent(ratio)}
            hint={`${formatMinutes(metrics.committedMinutes)} comprometidos`}
            target="Meta 70–90%"
            tone={
              ratio === null
                ? "neutral"
                : ratio < 0.7
                  ? "bad"
                  : ratio > 0.9
                    ? "warn"
                    : "good"
            }
          />
          <Metric
            label="Deuda de documentación"
            value={String(metrics.docDebt)}
            hint="Debe ser 0 siempre"
            tone={
              !hasData ? "neutral" : metrics.docDebt === 0 ? "good" : "bad"
            }
          />
        </div>
      </Section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Section>
            <SectionTitle count={open.length}>Abiertos</SectionTitle>
            {open.length === 0 ? (
              <EmptyState icon={Inbox}>
                Nada abierto. O terminaste la semana, o no te comprometiste a
                nada.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((commitment) => (
                  <CommitmentItem
                    key={commitment.id}
                    commitment={commitment}
                    actualMinutes={minutes.get(commitment.id) ?? 0}
                documents={commitment.documents.map((link) => link.document)}
                  />
                ))}
              </ul>
            )}
          </Section>

          {closed.length > 0 ? (
            <Section>
              <SectionTitle count={closed.length}>Cerrados</SectionTitle>
              <ul className="flex flex-col gap-3">
                {closed.map((commitment) => (
                  <CommitmentItem
                    key={commitment.id}
                    commitment={commitment}
                    actualMinutes={minutes.get(commitment.id) ?? 0}
                documents={commitment.documents.map((link) => link.document)}
                  />
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <Card className="xl:sticky xl:top-20">
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
      </div>
    </div>
  );
}
