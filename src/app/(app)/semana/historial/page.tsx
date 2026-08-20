import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes } from "@/lib/dates";
import { cycleStatusLabel } from "@/lib/labels";
import { formatPercent } from "@/server/metrics";
import { pastCycles } from "@/server/history";

export const dynamic = "force-dynamic";

export default async function HistorialPage() {
  const cycles = await pastCycles();

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title="Historial"
        description="Las semanas que ya pasaron, con el número que sacaron."
      />

      <Section>
        <SectionTitle count={cycles.length}>Semanas anteriores</SectionTitle>

        {cycles.length === 0 ? (
          <EmptyState icon={History}>
            Todavía no hay ninguna semana anterior. El historial se construye
            solo: dentro de siete días esta pantalla ya dirá algo de ti.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {cycles.map(({ cycle, metrics }) => (
              <li
                key={cycle.id}
                className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-4 ring-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(cycle.weekStart)} – {formatDate(cycle.weekEnd)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {metrics.plannedDone} de {metrics.plannedTotal}{" "}
                      compromisos planificados
                      {metrics.unplannedTotal > 0
                        ? metrics.unplannedTotal === 1
                          ? " · 1 no planificado"
                          : ` · ${metrics.unplannedTotal} no planificados`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {cycleStatusLabel[cycle.status]}
                  </Badge>
                </div>

                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      Cumplimiento
                    </dt>
                    <dd className="numeric text-sm font-medium">
                      {formatPercent(metrics.compliance)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      No planificado
                    </dt>
                    <dd className="numeric text-sm font-medium">
                      {formatPercent(metrics.unplannedShare)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Arrastre</dt>
                    <dd className="numeric text-sm font-medium">
                      {metrics.carriedOver}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      Comprometido
                    </dt>
                    <dd className="numeric text-sm font-medium">
                      {formatMinutes(metrics.committedMinutes)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
