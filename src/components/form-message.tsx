import { CircleAlert, Check } from "lucide-react";

/** Error de validación. Siempre con role="alert" y siempre junto al control. */
export function FormError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="text-destructive flex items-start gap-2 text-sm text-pretty"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Confirmación. Breve y sin adjetivos. */
export function FormSuccess({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="status" className="text-success flex items-center gap-2 text-sm">
      <Check aria-hidden className="size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
