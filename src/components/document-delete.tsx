"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-message";
import { deleteDocumentAction, type ActionState } from "@/actions/documents";

export function DocumentDelete({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    deleteDocumentAction,
    {},
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={documentId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={pending}
          aria-label={`Eliminar ${title}`}
        >
          <Trash2 aria-hidden className="size-4" />
          {pending ? "Eliminando…" : "Eliminar"}
        </Button>
      </form>
      <FormError>{state.error}</FormError>
    </div>
  );
}
