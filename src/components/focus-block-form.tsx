"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/field";
import { categoryLabel } from "@/lib/labels";
import {
  createFocusBlockAction,
  type ActionState,
} from "@/actions/today";

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
        <div className="flex flex-col gap-2">
          <Label htmlFor="plannedStart">Desde</Label>
          <Input
            id="plannedStart"
            name="plannedStart"
            type="time"
            defaultValue="09:00"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plannedEnd">Hasta</Label>
          <Input
            id="plannedEnd"
            name="plannedEnd"
            type="time"
            defaultValue="10:30"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="blockCategory">Categoría</Label>
          <Select id="blockCategory" name="category" defaultValue="DESARROLLO">
            {Object.entries(categoryLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="commitmentId">Compromiso (opcional)</Label>
        <Select id="commitmentId" name="commitmentId" defaultValue="">
          <option value="">Sin vincular</option>
          {commitments.map((commitment) => (
            <option key={commitment.id} value={commitment.id}>
              {commitment.title}
            </option>
          ))}
        </Select>
        <p className="text-muted-foreground text-xs">
          Vincularlo es lo que hace que el tiempo real aparezca en la semana.
        </p>
      </div>

      {state.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creando…" : "Planificar bloque"}
      </Button>
    </form>
  );
}
