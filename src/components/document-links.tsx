"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/field";
import { FormError } from "@/components/form-message";
import { statusLabel } from "@/lib/labels";
import type { CommitmentStatus } from "@/generated/prisma/enums";
import {
  linkDocumentAction,
  unlinkDocumentAction,
  type ActionState,
} from "@/actions/documents";

type LinkedCommitment = {
  id: string;
  title: string;
  status: CommitmentStatus;
};

export function DocumentLinks({
  documentId,
  linked,
  linkable,
}: {
  documentId: string;
  linked: LinkedCommitment[];
  linkable: { id: string; title: string }[];
}) {
  const [linkState, link, linking] = useActionState<ActionState, FormData>(
    linkDocumentAction,
    {},
  );
  const [unlinkState, unlink] = useActionState<ActionState, FormData>(
    unlinkDocumentAction,
    {},
  );

  return (
    <div className="flex flex-col gap-4">
      {linked.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Sin compromisos vinculados. Un documento suelto documenta menos que
          uno atado al trabajo que lo produjo.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {linked.map((commitment) => (
            <li
              key={commitment.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-pretty">{commitment.title}</span>
                <Badge
                  variant={commitment.status === "DONE" ? "success" : "outline"}
                >
                  {statusLabel[commitment.status]}
                </Badge>
              </span>

              <form action={unlink}>
                <input type="hidden" name="documentId" value={documentId} />
                <input type="hidden" name="commitmentId" value={commitment.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  aria-label={`Desvincular ${commitment.title}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <FormError>{unlinkState.error}</FormError>

      {linkable.length > 0 ? (
        <form action={link} className="flex flex-col gap-3">
          <input type="hidden" name="documentId" value={documentId} />
          <Field htmlFor="commitmentId" label="Vincular un compromiso">
            <Select id="commitmentId" name="commitmentId" required>
              {linkable.map((commitment) => (
                <option key={commitment.id} value={commitment.id}>
                  {commitment.title}
                </option>
              ))}
            </Select>
          </Field>
          <FormError>{linkState.error}</FormError>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={linking}
            className="self-start"
          >
            {linking ? "Vinculando…" : "Vincular"}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground text-xs">
          No queda ningún compromiso de esta semana por vincular.{" "}
          <Link href="/semana" className="underline underline-offset-2">
            Ver la semana
          </Link>
        </p>
      )}
    </div>
  );
}
