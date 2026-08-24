import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartTable } from "@/components/charts/chart-card";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes, todayInLima } from "@/lib/dates";
import { categoryLabel, cycleStatusLabel, statusLabel } from "@/lib/labels";
import { getCurrentCycle } from "@/server/cycles";
import { formatPercent } from "@/server/metrics";
import {
  reportTitle,
  weeklyReport,
  type ReportCommitment,
} from "@/server/report";

export const dynamic = "force-dynamic";

const COMMITMENT_HEAD = [
  "Compromiso",
  "Categoría",
  "Estado",
  "Estimado",
  "Real",
  "Documentado",
];

function commitmentRows(commitments: ReportCommitment[]): string[][] {
  return commitments.map((commitment) => [
    commitment.title,
    categoryLabel[commitment.category],
    statusLabel[commitment.status],
    commitment.plannedMinutes ? formatMinutes(commitment.plannedMinutes) : "—",
    formatMinutes(commitment.actualMinutes),
    commitment.documented ? "Sí" : "No",
  ]);
}

function Nothing({ children }: { children: string }) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}

export default async function InformePage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { cycle } = await searchParams;
  const cycleId = cycle ?? (await getCurrentCycle()).id;

  const report = await weeklyReport(cycleId);
  if (!report) notFound();

  const { metrics } = report;
  // Una semana sin un solo compromiso no merece color: no hay dato detrás.
  const hasData = report.planned.length + report.unplanned.length > 0;

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title={reportTitle(report)}
        description={`${cycleStatusLabel[report.status]} · ${
          report.capacityMinutes
            ? `capacidad declarada ${formatMinutes(report.capacityMinutes)}`
            : "sin capacidad declarada"
        }`}
        aside={
          <div className="flex items-center gap-2 print:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link href="/semana">
                <ArrowLeft aria-hidden className="size-4" />
                Semana
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a
                href={`/api/semana/informe?cycle=${report.cycleId}`}
                download
              >
                <Download aria-hidden className="size-4" />
                Descargar .md
              </a>
            </Button>
            <PrintButton />
          </div>
        }
      />

      <Section>
        <SectionTitle>Resumen</SectionTitle>
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

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Tiempo registrado"
            value={formatMinutes(report.workedMinutes)}
            hint={`${formatMinutes(report.interruptedMinutes)} perdidos por interrupciones`}
            target={
              report.capacityMinutes
                ? `De ${formatMinutes(report.capacityMinutes)} declarados`
                : "Sin capacidad declarada"
            }
          />
          <Metric
            label="Bloques protegidos"
            value={formatPercent(report.protectedShare)}
            hint="Terminaron sin interrupción"
            target="Meta ≥ 70%"
            tone={
              report.protectedShare === null
                ? "neutral"
                : report.protectedShare >= 0.7
                  ? "good"
                  : "bad"
            }
          />
          <Metric
            label="Distracciones"
            value={String(report.distractions)}
            hint="Las que contaste tú, en el momento"
            target="Tendencia a la baja"
          />
        </div>
      </Section>

      <Section>
        <SectionTitle count={report.planned.length}>
          Compromisos planificados
        </SectionTitle>
        {report.planned.length === 0 ? (
          <Nothing>No se planificó nada esta semana.</Nothing>
        ) : (
          <div className="overflow-x-auto text-sm">
            <ChartTable
              head={COMMITMENT_HEAD}
              rows={commitmentRows(report.planned)}
            />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle count={report.unplanned.length}>
          Trabajo no planificado
        </SectionTitle>
        {report.unplanned.length === 0 ? (
          <Nothing>Nada entró a mitad de semana.</Nothing>
        ) : (
          <div className="overflow-x-auto text-sm">
            <ChartTable
              head={COMMITMENT_HEAD}
              rows={commitmentRows(report.unplanned)}
            />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle>Dónde se fue el tiempo</SectionTitle>
        {report.categories.length === 0 ? (
          <Nothing>No se cerró ningún bloque de foco.</Nothing>
        ) : (
          <div className="overflow-x-auto text-sm">
            <ChartTable
              head={["Categoría", "Tiempo"]}
              rows={report.categories.map((row) => [
                categoryLabel[row.category],
                formatMinutes(row.minutes),
              ])}
            />
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle count={report.blockers.length}>Bloqueos</SectionTitle>
        {report.blockers.length === 0 ? (
          <Nothing>Ninguno registrado.</Nothing>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {report.blockers.map((blocker, index) => (
              <li key={index} className="flex flex-col">
                <span className="text-pretty">{blocker.description}</span>
                <span className="text-muted-foreground text-xs">
                  {blocker.resolved ? "Resuelto" : "Sin resolver"}
                  {blocker.commitmentTitle
                    ? ` · ${blocker.commitmentTitle}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {report.retroWentWell || report.retroToImprove ? (
        <Section>
          <SectionTitle>Retro</SectionTitle>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">
                Qué salió bien
              </dt>
              <dd className="mt-1 text-sm text-pretty">
                {report.retroWentWell ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">
                Qué hay que mejorar
              </dt>
              <dd className="mt-1 text-sm text-pretty">
                {report.retroToImprove ?? "—"}
              </dd>
            </div>
          </dl>
        </Section>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Generado por Ritmo el {formatDate(todayInLima(), "d 'de' MMMM 'de' yyyy")}.
        El cumplimiento se calcula solo sobre lo que se planificó el lunes.
      </p>
    </div>
  );
}
