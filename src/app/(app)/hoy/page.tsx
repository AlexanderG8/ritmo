import { CalendarOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyCheckin } from "@/components/daily-checkin";
import { EmptyState } from "@/components/empty-state";
import { FocusBlockForm } from "@/components/focus-block-form";
import {
  FocusBlockItem,
  type FocusBlockView,
} from "@/components/focus-block-item";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes, formatTime, todayInLima } from "@/lib/dates";
import { getCurrentCycleWithCommitments } from "@/server/cycles";
import { getTodayLog } from "@/server/daily";
import { getTodayBlocks } from "@/server/focus";

export const dynamic = "force-dynamic";

export default async function HoyPage() {
  const [blocks, log, { commitments }] = await Promise.all([
    getTodayBlocks(),
    getTodayLog(),
    getCurrentCycleWithCommitments(),
  ]);

  const open = commitments
    .filter((c) => c.status !== "DONE" && c.status !== "DROPPED")
    .map((c) => ({ id: c.id, title: c.title }));

  const views: FocusBlockView[] = blocks.map((block) => ({
    id: block.id,
    category: block.category,
    plannedStart: formatTime(block.plannedStart),
    plannedEnd: formatTime(block.plannedEnd),
    actualStartIso: block.actualStart?.toISOString() ?? null,
    actualMinutes: block.actualMinutes,
    distractions: block.distractions,
    interruptedMinutes: block.interruptedMinutes,
    wasProtected: block.wasProtected,
    finished: block.actualEnd !== null,
    commitmentTitle: block.commitment?.title ?? null,
  }));

  const finished = blocks.filter((block) => block.actualEnd !== null);
  const workedMinutes = finished.reduce((sum, b) => sum + b.actualMinutes, 0);
  const protectedCount = finished.filter((b) => b.wasProtected).length;
  const distractions = blocks.reduce((sum, b) => sum + b.distractions, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={
          <span className="first-letter:uppercase">
            {formatDate(todayInLima(), "EEEE d 'de' MMMM")}
          </span>
        }
        description="Bloques de foco y registro del día."
      />

      <Section>
        <SectionTitle>Cómo va el día</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Tiempo registrado"
            value={formatMinutes(workedMinutes)}
            hint={`${finished.length} bloques cerrados`}
          />
          <Metric
            label="Bloques protegidos"
            value={
              finished.length === 0 ? "—" : `${protectedCount}/${finished.length}`
            }
            hint="Sin interrupciones de soporte"
            target="Meta ≥ 70%"
            tone={
              finished.length === 0
                ? "neutral"
                : protectedCount / finished.length >= 0.7
                  ? "good"
                  : "bad"
            }
          />
          <Metric
            label="Distracciones"
            value={String(distractions)}
            hint="Cuéntalas en el momento, no al final"
            tone={
              blocks.length > 0 && distractions === 0 ? "good" : "neutral"
            }
          />
        </div>
      </Section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Section className="min-w-0">
          <SectionTitle count={views.length}>Bloques</SectionTitle>
          {views.length === 0 ? (
            <EmptyState icon={CalendarOff}>
              Sin bloques hoy. Un día sin bloques planificados es un día que se
              va en reaccionar.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {views.map((block) => (
                <FocusBlockItem key={block.id} block={block} />
              ))}
            </ul>
          )}
        </Section>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Planificar un bloque</CardTitle>
              <CardDescription>
                90 minutos de desarrollo, 30-45 de documentación. Protegidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FocusBlockForm commitments={open} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cierre del día</CardTitle>
              <CardDescription>
                El logro es obligatorio. No se cierra el día sin uno.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DailyCheckin log={log} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
