"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/field";
import { formatMinutes } from "@/lib/dates";
import {
  categoryLabel,
  manualStatuses,
  priorityLabel,
  statusLabel,
} from "@/lib/labels";
import type { Commitment } from "@/generated/prisma/client";
import {
  changeStatusAction,
  completeCommitmentAction,
  deleteCommitmentAction,
  saveDocNotesAction,
  type ActionState,
} from "@/app/semana/actions";

export function CommitmentItem({ commitment }: { commitment: Commitment }) {
  const [docNotes, setDocNotes] = useState(commitment.docNotes ?? "");
  const [open, setOpen] = useState(false);

  const [doneState, completeAction, completing] = useActionState<
    ActionState,
    FormData
  >(completeCommitmentAction, {});
  const [docState, saveDocs, savingDocs] = useActionState<ActionState, FormData>(
    saveDocNotesAction,
    {},
  );
  const [statusState, changeStatus] = useActionState<ActionState, FormData>(
    changeStatusAction,
    {},
  );
  const [deleteState, remove] = useActionState<ActionState, FormData>(
    deleteCommitmentAction,
    {},
  );

  const isDone = commitment.status === "DONE";
  const documented = docNotes.trim().length > 0;
  const error =
    doneState.error ?? docState.error ?? statusState.error ?? deleteState.error;

  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={
              isDone ? "text-muted-foreground line-through" : "font-medium"
            }
          >
            {commitment.title}
          </p>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span>{categoryLabel[commitment.category]}</span>
            <span>·</span>
            <span>{priorityLabel[commitment.priority]}</span>
            {commitment.plannedMinutes ? (
              <>
                <span>·</span>
                <span>{formatMinutes(commitment.plannedMinutes)}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!commitment.wasPlanned ? (
            <Badge variant="outline">No planificado</Badge>
          ) : null}
          <Badge variant={isDone ? "default" : "secondary"}>
            {statusLabel[commitment.status]}
          </Badge>
        </div>
      </div>

      {!isDone ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <form action={changeStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={commitment.id} />
            <Select
              name="status"
              defaultValue={commitment.status}
              className="h-8 w-40"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {manualStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </Select>
          </form>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen((value) => !value)}
          >
            {documented ? "Documentación ✓" : "Documentar"}
          </Button>

          <form action={completeAction}>
            <input type="hidden" name="id" value={commitment.id} />
            <Button type="submit" size="sm" disabled={completing}>
              {completing ? "Cerrando…" : "Cerrar"}
            </Button>
          </form>

          <form action={remove} className="ml-auto">
            <input type="hidden" name="id" value={commitment.id} />
            <Button type="submit" variant="ghost" size="sm">
              Eliminar
            </Button>
          </form>
        </div>
      ) : null}

      {open || (!isDone && doneState.error) ? (
        <form action={saveDocs} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="id" value={commitment.id} />
          <Textarea
            name="docNotes"
            rows={5}
            value={docNotes}
            onChange={(event) => setDocNotes(event.target.value)}
            placeholder={
              "Qué hace\nCómo se usa\nDecisiones técnicas\nPendientes conocidos"
            }
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={savingDocs}
            className="self-start"
          >
            {savingDocs ? "Guardando…" : "Guardar documentación"}
          </Button>
        </form>
      ) : null}

      {isDone && commitment.docNotes ? (
        <details className="mt-3">
          <summary className="text-muted-foreground cursor-pointer text-sm">
            Documentación
          </summary>
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {commitment.docNotes}
          </p>
        </details>
      ) : null}

      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}
    </li>
  );
}
