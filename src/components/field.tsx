import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/form-message";

/**
 * <select> nativo con el mismo aspecto que el Input de shadcn. Nativo a
 * propósito: se envía con el form sin estado en cliente.
 */
export function Select({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2 py-1 text-base transition-colors outline-none md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Campo de formulario: etiqueta asociada, control y ayuda. Todo control de
 * la app va dentro de un Field — no hay etiquetas sueltas ni placeholders
 * haciendo de etiqueta.
 *
 * La ayuda recibe el id `${htmlFor}-hint`; el control debe apuntarlo con
 * aria-describedby.
 */
export function Field({
  htmlFor,
  label,
  hint,
  error,
  className,
  children,
}: {
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p
          id={`${htmlFor}-hint`}
          className="text-muted-foreground text-xs text-pretty"
        >
          {hint}
        </p>
      ) : null}
      <FormError>{error}</FormError>
    </div>
  );
}

/** Casilla nativa con etiqueta asociada por envoltura. */
export function CheckboxField({
  name,
  defaultChecked,
  children,
  hint,
}: {
  name: string;
  defaultChecked?: boolean;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex w-fit items-center gap-2 text-sm font-medium select-none">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="border-input accent-primary size-4 rounded-[4px]"
        />
        {children}
      </label>
      {hint ? (
        <p className="text-muted-foreground text-xs text-pretty">{hint}</p>
      ) : null}
    </div>
  );
}
