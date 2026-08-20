import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Estado vacío. No consuela ni celebra: enuncia el hecho y, si existe,
 * ofrece la salida. El texto se conserva tal cual está escrito.
 */
export function EmptyState({
  icon: Icon,
  children,
  action,
}: {
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
        />
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          {children}
        </p>
      </div>
      {action ? <div className="pl-7">{action}</div> : null}
    </div>
  );
}
