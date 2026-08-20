"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/field";
import { FormError, FormSuccess } from "@/components/form-message";
import { Markdown } from "@/components/markdown";
import { docTypeLabel } from "@/lib/labels";
import type { DocType } from "@/generated/prisma/enums";
import {
  createDocumentAction,
  updateDocumentAction,
  type ActionState,
} from "@/actions/documents";

export type DocumentDraft = {
  id: string;
  title: string;
  type: DocType;
  module: string | null;
  contentMd: string;
  tags: string[];
};

const plantilla = `## Qué hace

## Cómo se usa

## Decisiones técnicas

## Pendientes conocidos
`;

export function DocumentForm({ document }: { document?: DocumentDraft }) {
  const editing = document !== undefined;
  const [state, action, pending] = useActionState<ActionState, FormData>(
    editing ? updateDocumentAction : createDocumentAction,
    {},
  );
  const [content, setContent] = useState(document?.contentMd ?? plantilla);
  const [preview, setPreview] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {editing ? <input type="hidden" name="id" value={document.id} /> : null}

      <Field htmlFor="title" label="Título">
        <Input
          id="title"
          name="title"
          defaultValue={document?.title}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="type" label="Tipo">
          <Select
            id="type"
            name="type"
            defaultValue={document?.type ?? "FEATURE"}
          >
            {Object.entries(docTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          htmlFor="module"
          label="Módulo"
          hint="Dónde vive esto: “App Órdenes de Pago”, “Exactus - CxC”."
        >
          <Input
            id="module"
            name="module"
            defaultValue={document?.module ?? ""}
            aria-describedby="module-hint"
          />
        </Field>
      </div>

      <Field
        htmlFor="tags"
        label="Etiquetas"
        hint="Separadas por comas. Máximo 10."
      >
        <Input
          id="tags"
          name="tags"
          defaultValue={document?.tags.join(", ") ?? ""}
          aria-describedby="tags-hint"
        />
      </Field>

      <Field
        htmlFor="contentMd"
        label="Contenido"
        hint="Markdown. Qué hace, cómo se usa, decisiones técnicas y pendientes."
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={preview ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setPreview(false)}
              aria-pressed={!preview}
            >
              Escribir
            </Button>
            <Button
              type="button"
              variant={preview ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreview(true)}
              aria-pressed={preview}
            >
              Vista previa
            </Button>
          </div>

          {preview ? (
            <div className="bg-card ring-foreground/10 min-h-64 rounded-lg p-4 ring-1">
              {content.trim() ? (
                <Markdown>{content}</Markdown>
              ) : (
                <p className="text-muted-foreground text-sm">Nada que ver.</p>
              )}
            </div>
          ) : (
            <Textarea
              id="contentMd"
              name="contentMd"
              rows={18}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              aria-describedby="contentMd-hint"
              className="font-mono"
              required
            />
          )}

          {/* El textarea no se monta en vista previa: el valor viaja igual. */}
          {preview ? (
            <input type="hidden" name="contentMd" value={content} />
          ) : null}
        </div>
      </Field>

      <FormError>{state.error}</FormError>
      {state.ok ? <FormSuccess>Guardado.</FormSuccess> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? "Guardando…"
          : editing
            ? "Guardar cambios"
            : "Crear documento"}
      </Button>
    </form>
  );
}
