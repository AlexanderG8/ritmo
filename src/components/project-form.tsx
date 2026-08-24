"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/field";
import { FormError, FormSuccess } from "@/components/form-message";
import { projectStatusLabel } from "@/lib/labels";
import type { ProjectStatus } from "@/generated/prisma/enums";
import {
  createProjectAction,
  updateProjectAction,
  type ActionState,
} from "@/actions/projects";

export type ProjectDraft = {
  id: string;
  name: string;
  description: string | null;
  module: string | null;
  status: ProjectStatus;
};

export function ProjectForm({ project }: { project?: ProjectDraft }) {
  const editing = project !== undefined;
  const [state, action, pending] = useActionState<ActionState, FormData>(
    editing ? updateProjectAction : createProjectAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !editing) formRef.current?.reset();
  }, [state.ok, editing]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {editing ? <input type="hidden" name="id" value={project.id} /> : null}

      <Field htmlFor="name" label="Nombre">
        <Input
          id="name"
          name="name"
          defaultValue={project?.name}
          placeholder="App Órdenes de Pago"
          aria-invalid={state.error ? true : undefined}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          htmlFor="module"
          label="Módulo"
          hint="Dónde vive: “Exactus - CxC”, “Front interno”."
        >
          <Input
            id="module"
            name="module"
            defaultValue={project?.module ?? ""}
            aria-describedby="module-hint"
          />
        </Field>

        <Field htmlFor="status" label="Estado">
          <Select
            id="status"
            name="status"
            defaultValue={project?.status ?? "ACTIVE"}
          >
            {Object.entries(projectStatusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        htmlFor="description"
        label="Descripción (opcional)"
        hint="Qué es y para quién. Dos líneas bastan."
      >
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={project?.description ?? ""}
          aria-describedby="description-hint"
        />
      </Field>

      <FormError>{state.error}</FormError>
      {state.ok && editing ? <FormSuccess>Guardado.</FormSuccess> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {editing ? null : <Plus aria-hidden />}
        {pending
          ? "Guardando…"
          : editing
            ? "Guardar cambios"
            : "Crear proyecto"}
      </Button>
    </form>
  );
}
