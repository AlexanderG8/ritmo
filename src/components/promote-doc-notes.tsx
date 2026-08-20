"use client";

import { useActionState, useState } from "react";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/field";
import { FormError } from "@/components/form-message";
import { docTypeLabel } from "@/lib/labels";
import {
  promoteDocNotesAction,
  type ActionState,
} from "@/actions/documents";

/**
 * Asciende las notas embebidas de un compromiso (Fase 1) a un documento real.
 * Las notas solo se limpian cuando el documento ya existe y está vinculado.
 */
export function PromoteDocNotes({
  commitmentId,
  defaultTitle,
}: {
  commitmentId: string;
  defaultTitle: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    promoteDocNotesAction,
    {},
  );
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <FileUp aria-hidden className="size-4" />
        Ascender a documento
      </Button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <input type="hidden" name="commitmentId" value={commitmentId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor={`promote-title-${commitmentId}`} label="Título">
          <Input
            id={`promote-title-${commitmentId}`}
            name="title"
            defaultValue={defaultTitle}
            required
          />
        </Field>
        <Field htmlFor={`promote-type-${commitmentId}`} label="Tipo">
          <Select
            id={`promote-type-${commitmentId}`}
            name="type"
            defaultValue="FEATURE"
          >
            {Object.entries(docTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        htmlFor={`promote-module-${commitmentId}`}
        label="Módulo"
        hint="Opcional. Dónde vive esto."
      >
        <Input
          id={`promote-module-${commitmentId}`}
          name="module"
          aria-describedby={`promote-module-${commitmentId}-hint`}
        />
      </Field>

      <FormError>{state.error}</FormError>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ascendiendo…" : "Crear documento"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
