"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/field";
import { FormError } from "@/components/form-message";
import { categoryLabel } from "@/lib/labels";
import { createFocusBlockAction, type ActionState } from "@/actions/today";

export function FocusBlockForm({
  commitments,
}: {
  commitments: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createFocusBlockAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field htmlFor="plannedStart" label="Desde">
          <Input
            id="plannedStart"
            name="plannedStart"
            type="time"
            defaultValue="09:00"
            required
          />
        </Field>
        <Field htmlFor="plannedEnd" label="Hasta">
          <Input
            id="plannedEnd"
            name="plannedEnd"
            type="time"
            defaultValue="10:30"
            required
          />
        </Field>
        <Field htmlFor="blockCategory" label="Categoría">
          <Select id="blockCategory" name="category" defaultValue="DESARROLLO">
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        htmlFor="commitmentId"
        label="Compromiso (opcional)"
        hint="Vincularlo es lo que hace que el tiempo real aparezca en la semana."
      >
        <Select
          id="commitmentId"
          name="commitmentId"
          defaultValue=""
          aria-describedby="commitmentId-hint"
        >
          <option value="">Sin vincular</option>
          {commitments.map((commitment) => (
            <option key={commitment.id} value={commitment.id}>
              {commitment.title}
            </option>
          ))}
        </Select>
      </Field>

      <FormError>{state.error}</FormError>

      <Button type="submit" disabled={pending} className="self-start">
        <Plus aria-hidden />
        {pending ? "Creando…" : "Planificar bloque"}
      </Button>
    </form>
  );
}
