import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Inbox, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartTable } from "@/components/charts/chart-card";
import { EmptyState } from "@/components/empty-state";
import { Metric } from "@/components/metric";
import { PageHeader } from "@/components/page-header";
import { ProjectDelete } from "@/components/project-delete";
import { ProjectForm } from "@/components/project-form";
import { Section, SectionTitle } from "@/components/section";
import { formatDate, formatMinutes } from "@/lib/dates";
import {
  categoryLabel,
  docTypeLabel,
  projectStatusLabel,
  statusLabel,
} from "@/lib/labels";
import { formatPercent } from "@/server/metrics";
import { getProject, projectMetrics } from "@/server/projects";

export const dynamic = "force-dynamic";

export default async function ProyectoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;

  const project = await getProject(id);
  if (!project) notFound();

  const metrics = await projectMetrics(id);
  const editing = editar === "1";

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title={project.name}
        description={
          project.module
            ? `${project.module}${project.description ? ` · ${project.description}` : ""}`
            : (project.description ?? "Sin descripción")
        }
        aside={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/proyectos">
                <ArrowLeft aria-hidden className="size-4" />
                Proyectos
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={editing ? `/proyectos/${id}` : `/proyectos/${id}?editar=1`}>
                <Pencil aria-hidden className="size-4" />
                {editing ? "Cancelar" : "Editar"}
              </Link>
            </Button>
            <Badge
              variant={project.status === "ACTIVE" ? "secondary" : "outline"}
            >
              {projectStatusLabel[project.status]}
            </Badge>
          </div>
        }
      />

      {editing ? (
        <Section>
          <SectionTitle>Editar proyecto</SectionTitle>
          <div className="bg-card ring-foreground/10 rounded-lg p-4 ring-1">
            <ProjectForm
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                module: project.module,
                status: project.status,
              }}
            />
          </div>
          <ProjectDelete projectId={project.id} name={project.name} />
        </Section>
      ) : null}

      <Section>
        <SectionTitle>Lo que llevas invertido</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            emphasis="primary"
            label="Tiempo real"
            value={formatMinutes(metrics.actualMinutes)}
            hint={
              metrics.plannedMinutes > 0
                ? `Estimado ${formatMinutes(metrics.plannedMinutes)}`
                : "Sin estimaciones registradas"
            }
            target="De bloques de foco cerrados"
          />
          <Metric
            emphasis="primary"
            label="Compromisos cerrados"
            value={`${metrics.done} de ${metrics.total}`}
            hint={
              metrics.open === 1
                ? "1 sigue abierto"
                : `${metrics.open} siguen abiertos`
            }
            target={`Cumplimiento ${formatPercent(metrics.compliance)}`}
            tone={
              metrics.compliance === null
                ? "neutral"
                : metrics.compliance >= 0.8
                  ? "good"
                  : "warn"
            }
          />
          <Metric
            emphasis="primary"
            label="Semanas tocadas"
            value={
              metrics.firstWeek && metrics.lastWeek
                ? formatDate(metrics.firstWeek, "d MMM")
                : "—"
            }
            hint={
              metrics.lastWeek
                ? `Última vez: ${formatDate(metrics.lastWeek, "d MMM yyyy")}`
                : "Todavía sin compromisos"
            }
            target="Desde la primera semana"
          />
        </div>
      </Section>

      {metrics.byCategory.length > 0 ? (
        <Section>
          <SectionTitle>Dónde se fue el tiempo</SectionTitle>
          <div className="overflow-x-auto text-sm">
            <ChartTable
              head={["Categoría", "Tiempo"]}
              rows={metrics.byCategory.map((row) => [
                categoryLabel[row.category],
                formatMinutes(row.minutes),
              ])}
            />
          </div>
        </Section>
      ) : null}

      <Section>
        <SectionTitle count={project.commitments.length}>
          Compromisos
        </SectionTitle>
        {project.commitments.length === 0 ? (
          <EmptyState icon={Inbox}>
            Ningún compromiso apunta a este proyecto todavía. Se asigna al
            crearlo, desde la semana.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {project.commitments.map((commitment) => (
              <li
                key={commitment.id}
                className="bg-card ring-foreground/10 flex flex-wrap items-start justify-between gap-3 rounded-lg p-4 ring-1"
              >
                <div className="min-w-0">
                  <p className="text-sm text-pretty">{commitment.title}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {categoryLabel[commitment.category]}
                    <span aria-hidden> · </span>
                    Semana del {formatDate(commitment.cycle.weekStart)}
                    {commitment.plannedMinutes ? (
                      <>
                        <span aria-hidden> · </span>
                        {formatMinutes(commitment.plannedMinutes)} estimados
                      </>
                    ) : null}
                  </p>
                </div>
                <Badge
                  variant={
                    commitment.status === "DONE" ? "secondary" : "outline"
                  }
                >
                  {statusLabel[commitment.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section>
        <SectionTitle count={project.documents.length}>
          Documentos
        </SectionTitle>
        {project.documents.length === 0 ? (
          <EmptyState icon={FileText}>
            Sin documentación propia. Un proyecto sin un solo documento es un
            proyecto que solo existe en tu cabeza.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {project.documents.map((document) => (
              <li
                key={document.id}
                className="bg-card ring-foreground/10 flex flex-wrap items-start justify-between gap-3 rounded-lg p-4 ring-1"
              >
                <div className="min-w-0">
                  <Link
                    href={`/docs/${document.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {document.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Actualizado el {formatDate(document.updatedAt)}
                  </p>
                </div>
                <Badge variant="outline">{docTypeLabel[document.type]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
