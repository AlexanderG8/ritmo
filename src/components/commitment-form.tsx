"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxField, Field, Select } from "@/components/field";
import { FormError } from "@/components/form-message";
import { categoryLabel, priorityLabel } from "@/lib/labels";
import {
  createCommitmentAction,
  type ActionState,
} from "@/actions/commitments";

export function CommitmentForm({
  cycleId,
  unplanned,
}: {
  cycleId: string;
  unplanned: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCommitmentAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="cycleId" value={cycleId} />

      <Field
        htmlFor="title"
        label={unplanned ? "Qué entró sin estar planificado" : "Compromiso"}
      >
        <Input
          id="title"
          name="title"
          placeholder="Concreto y verificable, no 'avanzar en X'"
          aria-invalid={state.error ? true : undefined}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field htmlFor="category" label="Categoría">
          <Select id="category" name="category" defaultValue="DESARROLLO">
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="priority" label="Prioridad">
          <Select id="priority" name="priority" defaultValue="2">
            {Object.entries(priorityLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="plannedMinutes" label="Estimado (min)">
          <Input
            id="plannedMinutes"
            name="plannedMinutes"
            type="number"
            min={15}
            max={2400}
            step={15}
            placeholder="90"
          />
        </Field>
      </div>

      <Field htmlFor="description" label="Detalle (opcional)">
        <Textarea id="description" name="description" rows={2} />
      </Field>

      <CheckboxField name="requiresDoc" defaultChecked>
        Exige documentación para cerrarse
      </CheckboxField>

      <FormError>{state.error}</FormError>

      <Button type="submit" disabled={pending} className="self-start">
        <Plus aria-hidden />
        {pending ? "Guardando…" : "Agregar"}
      </Button>
    </form>
  );
}
