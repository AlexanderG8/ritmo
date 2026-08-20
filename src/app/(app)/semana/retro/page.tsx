import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Blockers } from "@/components/blockers";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { RetroForm } from "@/components/retro-form";
import { Section } from "@/components/section";
import { formatDate, formatMinutes } from "@/lib/dates";
import { getCurrentCycle } from "@/server/cycles";
import { listBlockers } from "@/server/blockers";
import { getRetroData } from "@/server/retro";
import { formatPercent, weekMetrics } from "@/server/metrics";

export const dynamic = "force-dynamic";

export default async function RetroPage() {
  const current = await getCurrentCycle();
  const [{ cycle, open }, blockers] = await Promise.all([
    getRetroData(current.id),
    listBlockers(current.id),
  ]);

  const metrics = weekMetrics(cycle, cycle.commitments);
  const closed = cycle.status === "CLOSED";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
      <PageHeader
        title="Ritual del viernes"
        description={
          <>
            Semana del {formatDate(cycle.weekStart)} al{" "}
            {formatDate(cycle.weekEnd)}. El número ya está puesto; esto es
            mirarlo.
          </>
        }
      />

      <Section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
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
            emphasis="primary"
          />
          <Metric
            label="No planificado"
            value={formatPercent(metrics.unplannedShare)}
            hint={
              metrics.unplannedTotal === 1
                ? "1 tarea entró a mitad de semana"
                : `${metrics.unplannedTotal} tareas entraron a mitad de semana`
            }
            target="Conocerlo"
            emphasis="primary"
          />
          <Metric
            label="Sin cerrar"
            value={String(open.length)}
            hint="Se arrastra o se descarta, hoy"
            target="Meta ≤ 1"
            tone={open.length <= 1 ? "good" : "bad"}
          />
          <Metric
            label="Comprometido"
            value={formatMinutes(metrics.committedMinutes)}
            hint={
              cycle.capacityMinutes
                ? `De ${formatMinutes(cycle.capacityMinutes)} declarados`
                : "Sin capacidad declarada"
            }
            target="70-90% de la capacidad"
          />
        </div>
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Bloqueos de la semana</CardTitle>
          <CardDescription>
            Lo que te frenó. Es la tercera pregunta del auto-Scrum y la que más
            se olvida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Blockers
            cycleId={cycle.id}
            blockers={blockers.map((blocker) => ({
              id: blocker.id,
              description: blocker.description,
              resolved: blocker.resolved,
              commitmentTitle: blocker.commitment?.title ?? null,
            }))}
            commitments={open.map((commitment) => ({
              id: commitment.id,
              title: commitment.title,
            }))}
            readOnly={closed}
          />
        </CardContent>
      </Card>

      {closed ? (
        <Card>
          <CardHeader>
            <CardTitle>Semana cerrada</CardTitle>
            <CardDescription>
              {cycle.closedAt
                ? `Cerrada el ${formatDate(cycle.closedAt)}.`
                : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div>
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                Qué salió bien
              </h3>
              <p className="mt-1 whitespace-pre-wrap">{cycle.retroWentWell}</p>
            </div>
            <div>
              <h3 className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                Qué hay que mejorar
              </h3>
              <p className="mt-1 whitespace-pre-wrap">{cycle.retroToImprove}</p>
            </div>
            <Button asChild variant="secondary" className="self-start">
              <Link href="/semana/historial">Ver el historial</Link>
            </Button>
          </CardContent>
        </Card>
      ) : cycle.status === "PLANNING" ? (
        <Card>
          <CardHeader>
            <CardTitle>Esta semana nunca arrancó</CardTitle>
            <CardDescription>
              No hay retro que hacer sobre una semana que no se planificó.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/semana/planificar">Ir a planificar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cerrar la semana</CardTitle>
            <CardDescription>
              Al cerrar, lo arrastrado nace en la semana siguiente apuntando a
              la tarea que no se hizo. El arrastre no se borra reescribiendo la
              tarea: ese es el punto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RetroForm
              cycleId={cycle.id}
              open={open.map((commitment) => ({
                id: commitment.id,
                title: commitment.title,
                category: commitment.category,
              }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
