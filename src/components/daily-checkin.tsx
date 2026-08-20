"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/field";
import { saveDailyLogAction, type ActionState } from "@/actions/today";

const scale = [1, 2, 3, 4, 5];

export function DailyCheckin({
  log,
}: {
  log: {
    energyLevel: number;
    focusRating: number;
    win: string;
    friction: string | null;
  } | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveDailyLogAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="energyLevel">Energía (1-5)</Label>
          <Select
            id="energyLevel"
            name="energyLevel"
            defaultValue={String(log?.energyLevel ?? 3)}
          >
            {scale.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="focusRating">Concentración (1-5)</Label>
          <Select
            id="focusRating"
            name="focusRating"
            defaultValue={String(log?.focusRating ?? 3)}
          >
            {scale.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <p className="text-muted-foreground text-xs">
            Autoevaluación honesta. Inflarla no engaña a nadie más que a ti.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="win">Logro del día (obligatorio)</Label>
        <Textarea
          id="win"
          name="win"
          rows={2}
          defaultValue={log?.win ?? ""}
          placeholder="Algo concreto que hoy quedó mejor que ayer"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="friction">Qué te frenó (opcional)</Label>
        <Textarea
          id="friction"
          name="friction"
          rows={2}
          defaultValue={log?.friction ?? ""}
        />
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Guardado.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : log ? "Actualizar registro" : "Registrar día"}
      </Button>
    </form>
  );
}
