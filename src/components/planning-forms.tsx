"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  setCapacityAction,
  startWeekAction,
  type ActionState,
} from "@/actions/commitments";

export function CapacityForm({
  cycleId,
  capacityMinutes,
}: {
  cycleId: string;
  capacityMinutes: number | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    setCapacityAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="cycleId" value={cycleId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacityMinutes">
          Minutos realmente disponibles esta semana
        </Label>
        <Input
          id="capacityMinutes"
          name="capacityMinutes"
          type="number"
          min={60}
          step={30}
          defaultValue={capacityMinutes ?? ""}
          placeholder="1200"
          required
        />
        <p className="text-muted-foreground text-xs">
          No son tus horas de contrato. Descuenta soporte, reuniones e
          interrupciones. Si pones el número bonito, la métrica miente.
        </p>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button
        type="submit"
        variant="secondary"
        disabled={pending}
        className="self-start"
      >
        {pending ? "Guardando…" : "Guardar capacidad"}
      </Button>
    </form>
  );
}

export function StartWeekForm({ cycleId }: { cycleId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    startWeekAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="cycleId" value={cycleId} />
      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Iniciando…" : "Iniciar la semana"}
      </Button>
    </form>
  );
}
