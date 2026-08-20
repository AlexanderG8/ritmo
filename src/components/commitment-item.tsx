"use client";

import { useActionState, useState } from "react";
import { Check, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/field";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/form-message";
import { formatMinutes } from "@/lib/dates";
import {
  categoryLabel,
  manualStatuses,
  priorityLabel,
  statusLabel,
} from "@/lib/labels";
import type { CommitmentStatus } from "@/generated/prisma/enums";
import type { Commitment } from "@/generated/prisma/client";
import {
  changeStatusAction,
  completeCommitmentAction,
  deleteCommitmentAction,
  saveDocNotesAction,
  type ActionState,
} from "@/actions/commitments";

/** El color del estado dice lo mismo que la palabra, nunca algo distinto. */
const statusTone: Record<
  CommitmentStatus,
  "default" | "secondary" | "outline" | "success" | "warning"
> = {
  PLANNED: "outline",
  IN_PROGRESS: "secondary",
  BLOCKED: "warning",
  DONE: "success",
  CARRIED_OVER: "warning",
  DROPPED: "outline",
};

export function CommitmentItem({
  commitment,
  actualMinutes,
}: {
  commitment: Commitment;
  actualMinutes: number;
}) {
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
    <li className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-4 ring-1">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p
            className={
              isDone
                ? "text-muted-foreground text-sm line-through"
                : "text-sm font-medium text-pretty"
            }
          >
            {commitment.title}
          </p>
          <div className="text-muted-foreground numeric mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span>{categoryLabel[commitment.category]}</span>
            <span aria-hidden>·</span>
            <span>{priorityLabel[commitment.priority]}</span>
            {commitment.plannedMinutes ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  {formatMinutes(actualMinutes)} de{" "}
                  {formatMinutes(commitment.plannedMinutes)}
                </span>
              </>
            ) : actualMinutes > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span>{formatMinutes(actualMinutes)} reales</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {!commitment.wasPlanned ? (
            <Badge variant="outline">No planificado</Badge>
          ) : null}
          <Badge variant={statusTone[commitment.status]}>
            {statusLabel[commitment.status]}
          </Badge>
        </div>
      </div>

      {!isDone ? (
        <div className="flex flex-wrap items-center gap-2">
          <form action={changeStatus}>
            <input type="hidden" name="id" value={commitment.id} />
            <Select
              name="status"
              aria-label={`Estado de "${commitment.title}"`}
              defaultValue={commitment.status}
              className="h-7 w-36 text-sm"
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
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              // La deuda de documentación se avisa donde se resuelve, no con
              // una etiqueta más en una fila ya llena.
              commitment.requiresDoc &&
                !documented &&
                "border-warning/40 text-warning hover:text-warning",
            )}
          >
            {documented ? <Check aria-hidden /> : <FileText aria-hidden />}
            Documentar
          </Button>

          <form action={completeAction}>
            <input type="hidden" name="id" value={commitment.id} />
            <Button type="submit" size="sm" disabled={completing}>
              {completing ? "Cerrando…" : "Cerrar"}
            </Button>
          </form>

          <form action={remove} className="ml-auto">
            <input type="hidden" name="id" value={commitment.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label={`Eliminar "${commitment.title}"`}
            >
              <Trash2 aria-hidden />
            </Button>
          </form>
        </div>
      ) : null}

      {open || (!isDone && doneState.error) ? (
        <form action={saveDocs} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={commitment.id} />
          <label htmlFor={`docNotes-${commitment.id}`} className="sr-only">
            Documentación de &quot;{commitment.title}&quot;
          </label>
          <Textarea
            id={`docNotes-${commitment.id}`}
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
        <details className="group/doc">
          <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer items-center gap-1.5 text-xs">
            <FileText aria-hidden className="size-3.5" />
            Documentación
          </summary>
          <p className="border-border mt-2 border-l-2 pl-3 text-sm whitespace-pre-wrap">
            {commitment.docNotes}
          </p>
        </details>
      ) : null}

      <FormError>{error}</FormError>
    </li>
  );
}
