"use client";

/** Tooltip con los tokens del sistema. El texto nunca lleva el color del dato. */
export function ChartTooltip({
  active,
  label,
  payload,
  format,
}: {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string; name?: string }[];
  format: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  const value = payload[0]?.value;

  return (
    <div className="bg-card ring-foreground/15 rounded-lg px-2.5 py-1.5 text-xs shadow-sm ring-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="numeric font-medium">
        {typeof value === "number" ? format(value) : "—"}
      </p>
    </div>
  );
}
