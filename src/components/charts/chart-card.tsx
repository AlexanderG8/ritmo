import type { ReactNode } from "react";

/**
 * Marco de gráfico. Todo gráfico viene con su tabla equivalente: el valor
 * nunca queda accesible solo por el color o por el tooltip.
 */
export function ChartCard({
  title,
  description,
  children,
  table,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  table?: ReactNode;
}) {
  return (
    // `min-w-0`: sin esto, el ResponsiveContainer de recharts empuja la celda del
    // grid más allá del ancho disponible y la página gana scroll horizontal.
    <figure className="bg-card ring-foreground/10 flex min-w-0 flex-col gap-3 rounded-lg p-4 ring-1">
      <figcaption className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-xs text-pretty">
            {description}
          </p>
        ) : null}
      </figcaption>

      {children}

      {table ? (
        <details className="text-xs">
          <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer">
            Ver como tabla
          </summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      ) : null}
    </figure>
  );
}

export function ChartTable({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-muted-foreground">
          {head.map((label) => (
            <th key={label} className="border-border border-b px-2 py-1 font-medium">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="numeric">
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className="border-border/60 border-b px-2 py-1"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
