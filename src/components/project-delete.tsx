"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-message";
import { deleteProjectAction, type ActionState } from "@/actions/projects";

export function ProjectDelete({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    deleteProjectAction,
    {},
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={projectId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`Eliminar ${name}`}
        >
          <Trash2 aria-hidden className="size-4" />
          {pending ? "Eliminando…" : "Eliminar"}
        </Button>
      </form>
      <FormError>{state.error}</FormError>
    </div>
  );
}
