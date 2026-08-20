"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { FormError, FormSuccess } from "@/components/form-message";
import { saveDailyLogAction, type ActionState } from "@/actions/today";

const scale = [1, 2, 3, 4, 5];

/**
 * Escala 1-5 como grupo de radios en vez de <select>: se responde de un
 * clic, se ve entera y las cifras quedan tabulares.
 */
function ScaleField({
  name,
  legend,
  defaultValue,
  hint,
}: {
  name: string;
  legend: string;
  defaultValue: number;
  hint?: ReactNode;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="text-sm leading-none font-medium">{legend}</legend>
      <div className="mt-1.5 flex gap-1">
        {scale.map((value) => (
          <label key={value} className="min-w-0 flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={value === defaultValue}
              className="peer sr-only"
            />
            <span className="border-input peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary peer-focus-visible:outline-ring numeric flex h-8 items-center justify-center rounded-lg border text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
              {value}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p className="text-muted-foreground text-xs text-pretty">{hint}</p>
      ) : null}
    </fieldset>
  );
}

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
        <ScaleField
          name="energyLevel"
          legend="Energía (1-5)"
          defaultValue={log?.energyLevel ?? 3}
        />
        <ScaleField
          name="focusRating"
          legend="Concentración (1-5)"
          defaultValue={log?.focusRating ?? 3}
          hint="Autoevaluación honesta. Inflarla no engaña a nadie más que a ti."
        />
      </div>

      <Field htmlFor="win" label="Logro del día (obligatorio)">
        <Textarea
          id="win"
          name="win"
          rows={2}
          defaultValue={log?.win ?? ""}
          placeholder="Algo concreto que hoy quedó mejor que ayer"
          aria-invalid={state.error ? true : undefined}
          required
        />
      </Field>

      <Field htmlFor="friction" label="Qué te frenó (opcional)">
        <Textarea
          id="friction"
          name="friction"
          rows={2}
          defaultValue={log?.friction ?? ""}
        />
      </Field>

      <FormError>{state.error}</FormError>
      {state.ok ? <FormSuccess>Guardado.</FormSuccess> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : log ? "Actualizar registro" : "Registrar día"}
      </Button>
    </form>
  );
}
