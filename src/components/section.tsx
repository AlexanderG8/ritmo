import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn("flex flex-col gap-3", className)} {...props} />
  );
}

/**
 * Título de sección: rótulo corto en mayúsculas. Deliberadamente más
 * discreto que el H1 y que el número de una métrica — la sección organiza,
 * no compite por la atención.
 */
export function SectionTitle({
  children,
  count,
  aside,
}: {
  children: ReactNode;
  count?: number;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="text-muted-foreground flex items-baseline gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
        {children}
        {count !== undefined ? (
          <span className="text-foreground numeric font-semibold">{count}</span>
        ) : null}
      </h2>
      {aside ? (
        <div className="text-muted-foreground text-xs">{aside}</div>
      ) : null}
    </div>
  );
}
