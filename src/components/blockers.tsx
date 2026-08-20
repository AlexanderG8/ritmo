"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/field";
import { FormError } from "@/components/form-message";
import {
  createBlockerAction,
  deleteBlockerAction,
  resolveBlockerAction,
  type ActionState,
} from "@/actions/retro";

export type BlockerView = {
  id: string;
  description: string;
  resolved: boolean;
  commitmentTitle: string | null;
};

export function Blockers({
  cycleId,
  blockers,
  commitments,
  readOnly = false,
}: {
  cycleId: string;
  blockers: BlockerView[];
  commitments: { id: string; title: string }[];
  readOnly?: boolean;
}) {
  const [createState, create, creating] = useActionState<ActionState, FormData>(
    createBlockerAction,
    {},
  );
  const [resolveState, resolve] = useActionState<ActionState, FormData>(
    resolveBlockerAction,
    {},
  );
  const [deleteState, remove] = useActionState<ActionState, FormData>(
    deleteBlockerAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (createState.ok) formRef.current?.reset();
  }, [createState.ok]);

  return (
    <div className="flex flex-col gap-4">
      {blockers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ningún bloqueo registrado. O la semana fue limpia, o no estás
          anotando lo que te frena.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blockers.map((blocker) => (
            <li
              key={blocker.id}
              className="flex flex-wrap items-start justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={
                    blocker.resolved
                      ? "text-muted-foreground line-through"
                      : "text-pretty"
                  }
                >
                  {blocker.description}
                </span>
                {blocker.commitmentTitle ? (
                  <span className="text-muted-foreground text-xs">
                    {blocker.commitmentTitle}
                  </span>
                ) : null}
              </span>

              <span className="flex items-center gap-1">
                {blocker.resolved ? (
                  <Badge variant="success">Resuelto</Badge>
                ) : readOnly ? (
                  <Badge variant="warning">Abierto</Badge>
                ) : (
                  <form action={resolve}>
                    <input type="hidden" name="id" value={blocker.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label={`Marcar resuelto: ${blocker.description}`}
                    >
                      <Check aria-hidden className="size-4" />
                      Resolver
                    </Button>
                  </form>
                )}

                {readOnly ? null : (
                  <form action={remove}>
                    <input type="hidden" name="id" value={blocker.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label={`Eliminar bloqueo: ${blocker.description}`}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </form>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <FormError>{resolveState.error ?? deleteState.error}</FormError>

      {readOnly ? null : (
        <form ref={formRef} action={create} className="flex flex-col gap-3">
          <input type="hidden" name="cycleId" value={cycleId} />

          <Field htmlFor="blockerDescription" label="Qué te bloqueó">
            <Textarea
              id="blockerDescription"
              name="description"
              rows={2}
              placeholder="Concreto: quién o qué, y desde cuándo"
              required
            />
          </Field>

          {commitments.length > 0 ? (
            <Field
              htmlFor="blockerCommitment"
              label="Compromiso afectado (opcional)"
            >
              <Select id="blockerCommitment" name="commitmentId" defaultValue="">
                <option value="">Ninguno en concreto</option>
                {commitments.map((commitment) => (
                  <option key={commitment.id} value={commitment.id}>
                    {commitment.title}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <FormError>{createState.error}</FormError>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={creating}
            className="self-start"
          >
            {creating ? "Registrando…" : "Registrar bloqueo"}
          </Button>
        </form>
      )}
    </div>
  );
}
