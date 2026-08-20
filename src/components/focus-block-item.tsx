"use client";

import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function Elapsed({ startIso }: { startIso: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    const start = new Date(startIso).getTime();
    const tick = () => setSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);

  if (seconds === null) return <span className="tabular-nums">··:··</span>;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return (
    <span className="tabular-nums">
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
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium tabular-nums">
            {block.plannedStart} – {block.plannedEnd}
          </p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span>{categoryLabel[block.category]}</span>
            {block.commitmentTitle ? (
              <>
                <span>·</span>
                <span>{block.commitmentTitle}</span>
              </>
            ) : (
              <>
                <span>·</span>
                <span>sin vincular</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {running ? (
            <Badge className="font-mono">
              <Elapsed startIso={block.actualStartIso!} />
            </Badge>
          ) : block.finished ? (
            <Badge variant={block.wasProtected ? "default" : "outline"}>
              {formatMinutes(block.actualMinutes)}
              {block.wasProtected ? " protegido" : " interrumpido"}
            </Badge>
          ) : (
            <Badge variant="secondary">Sin iniciar</Badge>
          )}
        </div>
      </div>

      {block.finished ? (
        <p className="text-muted-foreground mt-3 text-xs">
          {block.distractions} distracciones
          {block.interruptedMinutes > 0
            ? ` · ${formatMinutes(block.interruptedMinutes)} perdidos por interrupción`
            : ""}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!running ? (
            <>
              <form action={start}>
                <input type="hidden" name="id" value={block.id} />
                <Button type="submit" size="sm" disabled={starting}>
                  {starting ? "Iniciando…" : "Iniciar"}
                </Button>
              </form>
              <form action={remove} className="ml-auto">
                <input type="hidden" name="id" value={block.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Eliminar
                </Button>
              </form>
            </>
          ) : (
            <>
              <form action={distract}>
                <input type="hidden" name="id" value={block.id} />
                <Button type="submit" variant="outline" size="sm">
                  Me distraje ({block.distractions})
                </Button>
              </form>

              <form action={stop} className="flex items-center gap-2">
                <input type="hidden" name="id" value={block.id} />
                <Input
                  name="interruptedMinutes"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="h-8 w-24"
                  aria-label="Minutos perdidos por interrupción"
                />
                <Button type="submit" size="sm" disabled={stopping}>
                  {stopping ? "Cerrando…" : "Terminar"}
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      {running ? (
        <p className="text-muted-foreground mt-2 text-xs">
          El número junto a &quot;Terminar&quot; son los minutos que te robó una
          interrupción. Cero significa bloque protegido.
        </p>
      ) : null}

      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
    </li>
  );
}
