import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DailyCheckin } from "@/components/daily-checkin";
import { FocusBlockForm } from "@/components/focus-block-form";
import {
  FocusBlockItem,
  type FocusBlockView,
} from "@/components/focus-block-item";
import { Metric } from "@/components/metric";
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
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatDate(todayInLima(), "EEEE d 'de' MMMM")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Bloques de foco y registro del día.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric
          label="Tiempo registrado"
          value={formatMinutes(workedMinutes)}
          hint={`${finished.length} bloques cerrados`}
        />
        <Metric
          label="Bloques protegidos"
          value={
            finished.length === 0
              ? "—"
              : `${protectedCount}/${finished.length}`
          }
          hint="Sin interrupciones de soporte"
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
          tone={distractions === 0 ? "good" : "neutral"}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Bloques ({views.length})</h2>
        {views.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin bloques hoy. Un día sin bloques planificados es un día que se
            va en reaccionar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {views.map((block) => (
              <FocusBlockItem key={block.id} block={block} />
            ))}
          </ul>
        )}
      </section>

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
    </main>
  );
}
