"use client";

import { useActionState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/field";
import { FormError } from "@/components/form-message";
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
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="cycleId" value={cycleId} />

      <Field
        htmlFor="capacityMinutes"
        label="Minutos realmente disponibles esta semana"
        hint="No son tus horas de contrato. Descuenta soporte, reuniones e interrupciones. Si pones el número bonito, la métrica miente."
        error={state.error}
        className="max-w-xs"
      >
        <Input
          id="capacityMinutes"
          name="capacityMinutes"
          type="number"
          min={60}
          step={30}
          defaultValue={capacityMinutes ?? ""}
          placeholder="1200"
          aria-describedby="capacityMinutes-hint"
          aria-invalid={state.error ? true : undefined}
          required
        />
      </Field>

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
      <FormError>{state.error}</FormError>
      <Button type="submit" disabled={pending} className="self-start">
        <Play aria-hidden />
        {pending ? "Iniciando…" : "Iniciar la semana"}
      </Button>
    </form>
  );
}
