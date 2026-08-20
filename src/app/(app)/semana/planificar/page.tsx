import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
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
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { CapacityForm, StartWeekForm } from "@/components/planning-forms";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes } from "@/lib/dates";
import { categoryLabel, priorityLabel } from "@/lib/labels";
import { getCurrentCycleWithCommitments } from "@/server/cycles";

export const dynamic = "force-dynamic";

/**
 * Paso del ritual. El número sale del título y pasa a un marcador propio:
 * así se lee como una secuencia, no como tres tarjetas sueltas.
 */
function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="grid-cols-[auto_1fr] items-start gap-x-3">
        <span
          aria-hidden
          className="bg-secondary text-secondary-foreground numeric row-span-2 flex size-6 items-center justify-center rounded-full text-xs font-semibold"
        >
          {number}
        </span>
        <CardTitle>
          <span className="sr-only">Paso {number}. </span>
          {title}
        </CardTitle>
        <CardDescription className="col-start-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="sm:pl-[calc(var(--card-spacing)+2.25rem)]">
        {children}
      </CardContent>
    </Card>
  );
}

export default async function PlanificarPage() {
  const { cycle, commitments } = await getCurrentCycleWithCommitments();

  const planned = commitments.filter((c) => c.wasPlanned);
  const committedMinutes = planned.reduce(
    (sum, c) => sum + (c.plannedMinutes ?? 0),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Ritual del lunes"
        description={
          <>
            15 minutos. Semana del {formatDate(cycle.weekStart)} al{" "}
            {formatDate(cycle.weekEnd)}.
          </>
        }
      />

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
          <Step
            number={1}
            title="Declara tu capacidad"
            description="Sin esto no se puede saber si te comprometes a poco."
          >
            <CapacityForm
              cycleId={cycle.id}
              capacityMinutes={cycle.capacityMinutes}
            />
          </Step>

          <Step
            number={2}
            title="Define 3 a 5 compromisos"
            description={
              <>
                Concretos. &quot;Avanzar en el módulo&quot; no es un compromiso;
                &quot;cerrar la pantalla de aprobación de OP&quot; sí.
              </>
            }
          >
            <CommitmentForm cycleId={cycle.id} unplanned={false} />
          </Step>

          <Section>
            <SectionTitle
              count={planned.length}
              aside={
                <span className="numeric">
                  {formatMinutes(committedMinutes)}
                  {cycle.capacityMinutes
                    ? ` de ${formatMinutes(cycle.capacityMinutes)}`
                    : ""}
                </span>
              }
            >
              Comprometido
            </SectionTitle>

            {planned.length === 0 ? (
              <EmptyState icon={ClipboardList}>
                Todavía nada. Una semana sin compromisos escritos es una semana
                sin rendición de cuentas.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {planned.map((commitment) => (
                  <li
                    key={commitment.id}
                    className="bg-card ring-foreground/10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg p-3 text-sm ring-1"
                  >
                    <span className="min-w-0 flex-1 text-pretty">
                      {commitment.title}
                    </span>
                    <span className="text-muted-foreground numeric flex shrink-0 items-center gap-2 text-xs">
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
          </Section>

          <Step
            number={3}
            title="Arranca"
            description="A partir de aquí, todo lo que entre queda marcado como no planificado. Ese es el punto."
          >
            <StartWeekForm cycleId={cycle.id} />
          </Step>
        </>
      )}
    </div>
  );
}
