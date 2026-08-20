import type { ReactNode } from "react";

/**
 * Encabezado de página: una sola H1 por pantalla, el contexto justo debajo
 * y el estado o la acción primaria alineados a la derecha.
 */
export function PageHeader({
  title,
  description,
  aside,
}: {
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl leading-tight font-semibold tracking-tight text-balance sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1.5 text-sm">{description}</p>
        ) : null}
      </div>
      {aside ? (
        <div className="flex shrink-0 items-center gap-2">{aside}</div>
      ) : null}
    </header>
  );
}
