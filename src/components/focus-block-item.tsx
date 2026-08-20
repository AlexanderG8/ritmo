"use client";

import { useActionState, useEffect, useState } from "react";
import { Play, Square, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/form-message";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/dates";
import { categoryLabel } from "@/lib/labels";
import {
  addDistractionAction,
  deleteFocusBlockAction,
  startBlockAction,
  stopBlockAction,
  type ActionState,
} from "@/actions/today";

export type FocusBlockView = {
  id: string;
  category: keyof typeof categoryLabel;
  plannedStart: string;
  plannedEnd: string;
  actualStartIso: string | null;
  actualMinutes: number;
  distractions: number;
  interruptedMinutes: number;
  wasProtected: boolean;
  finished: boolean;
  commitmentTitle: string | null;
};

/**
 * Cronómetro. Monoespaciado y tabular: el ancho no baila al pasar los
 * segundos, que es lo que hace ilegible un contador que cambia cada segundo.
 */
function Elapsed({ startIso }: { startIso: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const start = new Date(startIso).getTime();
    const tick = () => setSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);

  const className =
    "numeric font-mono text-3xl leading-none font-semibold tracking-tight";

  if (seconds === null) return <span className={className}>··:··</span>;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <span role="timer" aria-label="Tiempo transcurrido" className={className}>
      {hours > 0 ? `${pad(hours)}:` : ""}
      {pad(minutes)}:{pad(rest)}
    </span>
  );
}

export function FocusBlockItem({ block }: { block: FocusBlockView }) {
  const [startState, start, starting] = useActionState<ActionState, FormData>(
    startBlockAction,
    {},
  );
  const [stopState, stop, stopping] = useActionState<ActionState, FormData>(
    stopBlockAction,
    {},
  );
  const [distractionState, distract] = useActionState<ActionState, FormData>(
    addDistractionAction,
    {},
  );
  const [deleteState, remove] = useActionState<ActionState, FormData>(
    deleteFocusBlockAction,
    {},
  );

  const running = block.actualStartIso !== null && !block.finished;
  const error =
    startState.error ??
    stopState.error ??
    distractionState.error ??
    deleteState.error;

  return (
    <li
      className={cn(
        "bg-card flex flex-col gap-3 rounded-lg p-4 ring-1",
        running ? "ring-foreground/30" : "ring-foreground/10",
        block.finished && "bg-card/60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="numeric text-sm font-medium">
            {block.plannedStart} – {block.plannedEnd}
          </p>
          <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span>{categoryLabel[block.category]}</span>
            <span aria-hidden>·</span>
            <span className="truncate">
              {block.commitmentTitle ?? "sin vincular"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {running ? (
            <Elapsed startIso={block.actualStartIso!} />
          ) : block.finished ? (
            <Badge variant={block.wasProtected ? "success" : "outline"}>
              <span className="numeric">
                {formatMinutes(block.actualMinutes)}
              </span>
              {block.wasProtected ? " protegido" : " interrumpido"}
            </Badge>
          ) : (
            <Badge variant="secondary">Sin iniciar</Badge>
          )}
        </div>
      </div>

      {block.finished ? (
        <p className="text-muted-foreground numeric text-xs">
          {block.distractions} distracciones
          {block.interruptedMinutes > 0
            ? ` · ${formatMinutes(block.interruptedMinutes)} perdidos por interrupción`
            : ""}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!running ? (
            <>
              <form action={start}>
                <input type="hidden" name="id" value={block.id} />
                <Button type="submit" size="sm" disabled={starting}>
                  <Play aria-hidden />
                  {starting ? "Iniciando…" : "Iniciar"}
                </Button>
              </form>
              <form action={remove} className="ml-auto">
                <input type="hidden" name="id" value={block.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar bloque"
                >
                  <Trash2 aria-hidden />
                </Button>
              </form>
            </>
          ) : (
            <>
              <form action={distract}>
                <input type="hidden" name="id" value={block.id} />
                <Button type="submit" variant="outline" size="sm">
                  <Zap aria-hidden />
                  Me distraje (
                  <span className="numeric">{block.distractions}</span>)
                </Button>
              </form>

              <form action={stop} className="flex items-center gap-2">
                <input type="hidden" name="id" value={block.id} />
                <Input
                  name="interruptedMinutes"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="h-7 w-20"
                  aria-label="Minutos perdidos por interrupción"
                  aria-describedby={`interrupt-hint-${block.id}`}
                />
                <Button type="submit" size="sm" disabled={stopping}>
                  <Square aria-hidden />
                  {stopping ? "Cerrando…" : "Terminar"}
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      {running ? (
        <p
          id={`interrupt-hint-${block.id}`}
          className="text-muted-foreground max-w-prose text-xs text-pretty"
        >
          El número junto a &quot;Terminar&quot; son los minutos que te robó una
          interrupción. Cero significa bloque protegido.
        </p>
      ) : null}

      <FormError>{error}</FormError>
    </li>
  );
}
