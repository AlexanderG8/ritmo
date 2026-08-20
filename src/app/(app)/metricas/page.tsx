import { ChartLine } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { Section, SectionTitle } from "@/components/section";
import { ChartCard, ChartTable } from "@/components/charts/chart-card";
import {
  CategoryChart,
  ComplianceChart,
  CountChart,
  ShareTrendChart,
  type WeekPoint,
} from "@/components/charts/week-charts";
import { formatDate, formatMinutes } from "@/lib/dates";
import { categoryLabel } from "@/lib/labels";
import { formatPercent } from "@/server/metrics";
import {
  categoryDistribution,
  currentStreak,
  weekHistory,
} from "@/server/history";

export const dynamic = "force-dynamic";

/** Promedio ignorando las semanas sin dato: una semana vacía no es un 0%. */
function average(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}

export default async function MetricasPage() {
  const history = await weekHistory(12);

  const categories =
    history.length > 0
      ? await categoryDistribution(
          history[0].weekStart,
          history[history.length - 1].weekEnd,
        )
      : [];

  const streak = currentStreak(history);
  const closed = history.filter((week) => !week.isCurrent);

  const points: WeekPoint[] = history.map((week) => ({
    label: week.label,
    compliance: week.compliance,
    unplannedShare: week.unplannedShare,
    carriedOver: week.carriedOver,
    distractions: week.distractions,
  }));

  const withCompliance = points.filter((point) => point.compliance !== null);
  const enoughForTrend = history.length >= 2;

  const avgCompliance = average(closed.map((week) => week.compliance));
  const avgUnplanned = average(closed.map((week) => week.unplannedShare));
  const totalCarried = closed.reduce((sum, week) => sum + week.carriedOver, 0);

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title="Métricas"
        description="Doce semanas. Lo que no se sostiene en el tiempo no es un hábito."
      />

      <Section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Racha"
            value={streak === 1 ? "1 semana" : `${streak} semanas`}
            hint="Consecutivas cumpliendo la meta"
            target="Sube o vuelve a cero"
            tone={streak === 0 ? "neutral" : "good"}
            emphasis="primary"
          />
          <Metric
            label="Cumplimiento medio"
            value={formatPercent(avgCompliance)}
            hint={`${closed.length} semanas cerradas`}
            target="Meta ≥ 80%"
            tone={
              avgCompliance === null
                ? "neutral"
                : avgCompliance >= 0.8
                  ? "good"
                  : "bad"
            }
            emphasis="primary"
          />
          <Metric
            label="Trabajo no planificado"
            value={formatPercent(avgUnplanned)}
            hint="Promedio de lo que no elegiste tú"
            target="Conocerlo, no bajarlo a cero"
            emphasis="primary"
          />
          <Metric
            label="Arrastre acumulado"
            value={String(totalCarried)}
            hint="Tareas que pasaron de semana"
            target="Meta ≤ 1 por semana"
            tone={
              closed.length === 0
                ? "neutral"
                : totalCarried <= closed.length
                  ? "good"
                  : "bad"
            }
          />
        </div>
      </Section>

      {!enoughForTrend ? (
        <Section>
          <EmptyState icon={ChartLine}>
            Con una sola semana registrada no hay tendencia que mostrar. Vuelve
            cuando lleves dos.
          </EmptyState>
        </Section>
      ) : (
        <Section>
          <SectionTitle>Tendencias</SectionTitle>

          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            {withCompliance.length >= 2 ? (
              <ChartCard
                title="Cumplimiento por semana"
                description="Solo sobre lo que te comprometiste el lunes."
                table={
                  <ChartTable
                    head={["Semana", "Cumplimiento"]}
                    rows={withCompliance.map((point) => [
                      point.label,
                      formatPercent(point.compliance),
                    ])}
                  />
                }
              >
                <ComplianceChart data={points} />
              </ChartCard>
            ) : null}

            <ChartCard
              title="Trabajo no planificado"
              description="Cuánto de cada semana entró sin que lo decidieras tú. Es el dato con el que puedes defender tu tiempo."
              table={
                <ChartTable
                  head={["Semana", "No planificado"]}
                  rows={points.map((point) => [
                    point.label,
                    formatPercent(point.unplannedShare),
                  ])}
                />
              }
            >
              <ShareTrendChart data={points} dataKey="unplannedShare" />
            </ChartCard>

            <ChartCard
              title="Arrastre"
              description="Tareas que no se hicieron y pasaron a la semana siguiente. Te dice si te sobre-comprometes o si simplemente no cumples."
              table={
                <ChartTable
                  head={["Semana", "Arrastradas"]}
                  rows={points.map((point) => [point.label, point.carriedOver])}
                />
              }
            >
              <CountChart
                data={points}
                dataKey="carriedOver"
                threshold={{ value: 1, label: "Meta ≤ 1" }}
              />
            </ChartCard>

            <ChartCard
              title="Distracciones"
              description="Las que contaste tú, en el momento."
              table={
                <ChartTable
                  head={["Semana", "Distracciones"]}
                  rows={points.map((point) => [
                    point.label,
                    point.distractions,
                  ])}
                />
              }
            >
              <CountChart data={points} dataKey="distractions" />
            </ChartCard>
          </div>
        </Section>
      )}

      <Section>
        <SectionTitle>Dónde se fue el tiempo</SectionTitle>

        {categories.length === 0 ? (
          <EmptyState icon={ChartLine}>
            Todavía no has cerrado ningún bloque de foco. Sin bloques no se sabe
            en qué se te va el día.
          </EmptyState>
        ) : (
          <ChartCard
            title="Minutos reales por categoría"
            description={`Del ${formatDate(history[0].weekStart)} al ${formatDate(history[history.length - 1].weekEnd)}.`}
            table={
              <ChartTable
                head={["Categoría", "Tiempo"]}
                rows={categories.map((row) => [
                  categoryLabel[row.category],
                  formatMinutes(row.minutes),
                ])}
              />
            }
          >
            <CategoryChart
              data={categories.map((row) => ({
                label: categoryLabel[row.category],
                minutes: row.minutes,
              }))}
            />
          </ChartCard>
        )}
      </Section>
    </div>
  );
}
