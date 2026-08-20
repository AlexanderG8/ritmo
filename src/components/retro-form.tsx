"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/form-message";
import { categoryLabel } from "@/lib/labels";
import type { WorkCategory } from "@/generated/prisma/enums";
import { closeCycleAction, type ActionState } from "@/actions/retro";

export type OpenCommitment = {
  id: string;
  title: string;
  category: WorkCategory;
};

export function RetroForm({
  cycleId,
  open,
}: {
  cycleId: string;
  open: OpenCommitment[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    closeCycleAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="cycleId" value={cycleId} />

      {open.length > 0 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">
            Qué haces con lo que quedó abierto ({open.length})
          </legend>
          <p className="text-muted-foreground text-xs text-pretty">
            Lo que marques se arrastra a la semana siguiente y cuenta como
            arrastre. Lo que no marques se descarta conscientemente. No hay una
            tercera opción: dejarlo flotando es lo que hacías antes.
          </p>

          <ul className="flex flex-col gap-2">
            {open.map((commitment) => (
              <li key={commitment.id}>
                <label className="bg-card ring-foreground/10 flex items-start gap-3 rounded-lg p-3 text-sm ring-1">
                  <input
                    type="checkbox"
                    name="carryOver"
                    value={commitment.id}
                    defaultChecked
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-pretty">{commitment.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {categoryLabel[commitment.category]}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="text-sm">
          No queda nada abierto. Esta semana se cierra limpia.
        </p>
      )}

      <Field
        htmlFor="wentWell"
        label="Qué salió bien"
        hint="Concreto. No sirve un &ldquo;estuvo bien&rdquo;."
      >
        <Textarea
          id="wentWell"
          name="wentWell"
          rows={3}
          aria-describedby="wentWell-hint"
          required
        />
      </Field>

      <Field
        htmlFor="toImprove"
        label="Qué hay que mejorar"
        hint="Una cosa accionable la semana que viene, no una queja."
      >
        <Textarea
          id="toImprove"
          name="toImprove"
          rows={3}
          aria-describedby="toImprove-hint"
          required
        />
      </Field>

      <FormError>{state.error}</FormError>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Cerrando…" : "Cerrar la semana"}
      </Button>
    </form>
  );
}
