import { cn } from "@/lib/utils";

type Tone = "neutral" | "good" | "warn" | "bad";

const toneValue: Record<Tone, string> = {
  neutral: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground/40",
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
};

/** El color nunca es el único portador del dato: se dice también en texto. */
const toneText: Record<Tone, string | null> = {
  neutral: null,
  good: "En meta.",
  warn: "En el límite.",
  bad: "Fuera de meta.",
};

/**
 * Tarjeta de métrica. El número es lo más grande de la pantalla: es lo que
 * la app tiene que decirte. `emphasis="primary"` se reserva para las
 * métricas que deciden si la semana valió o no.
 */
export function Metric({
  label,
  value,
  hint,
  target,
  tone = "neutral",
  emphasis = "secondary",
}: {
  label: string;
  value: string;
  hint?: string;
  target?: string;
  tone?: Tone;
  emphasis?: "primary" | "secondary";
}) {
  const primary = emphasis === "primary";

  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 flex flex-col rounded-lg p-4 ring-1",
        primary && "ring-foreground/20",
      )}
    >
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-[0.04em] uppercase">
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", toneDot[tone])}
        />
        <span className="truncate">{label}</span>
      </p>

      <p
        className={cn(
          "numeric mt-2 leading-none font-semibold tracking-tight",
          primary ? "text-4xl" : "text-3xl",
          toneValue[tone],
        )}
      >
        {value}
        {toneText[tone] ? (
          <span className="sr-only"> — {toneText[tone]}</span>
        ) : null}
      </p>

      {hint ? (
        <p className="text-muted-foreground mt-2 text-xs text-pretty">{hint}</p>
      ) : null}

      {target ? (
        <p className="text-muted-foreground/80 numeric mt-auto pt-2 text-xs">
          {target}
        </p>
      ) : null}
    </div>
  );
}
