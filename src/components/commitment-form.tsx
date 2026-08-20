"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/field";
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">
          {unplanned ? "Qué entró sin estar planificado" : "Compromiso"}
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Concreto y verificable, no 'avanzar en X'"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categoría</Label>
          <Select id="category" name="category" defaultValue="DESARROLLO">
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select id="priority" name="priority" defaultValue="2">
            {Object.entries(priorityLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="plannedMinutes">Estimado (min)</Label>
          <Input
            id="plannedMinutes"
            name="plannedMinutes"
            type="number"
            min={15}
            max={2400}
            step={15}
            placeholder="90"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Detalle (opcional)</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requiresDoc"
          defaultChecked
          className="size-4"
        />
        Exige documentación para cerrarse
      </label>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Agregar"}
      </Button>
    </form>
  );
}
