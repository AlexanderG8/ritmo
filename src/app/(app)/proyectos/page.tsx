import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/project-form";
import { Section, SectionTitle } from "@/components/section";
import { projectStatusLabel } from "@/lib/labels";
import { listProjects } from "@/server/projects";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const projects = await listProjects();
  const live = projects.filter((project) => project.status !== "ARCHIVED");
  const archived = projects.filter((project) => project.status === "ARCHIVED");

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title="Proyectos"
        description="La semana dice si cumpliste. El proyecto dice cuánto tiempo lleva."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Section>
            <SectionTitle count={live.length}>En curso</SectionTitle>
            {live.length === 0 ? (
              <EmptyState icon={FolderKanban}>
                Todavía no hay proyectos. Crea uno y empieza a colgarle
                compromisos y documentos: es la única forma de saber cuánto
                tiempo real se te ha ido en cada cosa.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {live.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </ul>
            )}
          </Section>

          {archived.length > 0 ? (
            <Section>
              <SectionTitle count={archived.length}>Archivados</SectionTitle>
              <ul className="flex flex-col gap-3">
                {archived.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo proyecto</CardTitle>
              <CardDescription>
                Algo que dura más de una semana. Si cabe en un solo compromiso,
                no es un proyecto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
}: {
  project: Awaited<ReturnType<typeof listProjects>>[number];
}) {
  return (
    <li className="bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-4 ring-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/proyectos/${project.id}`}
            className="text-sm font-medium hover:underline"
          >
            {project.name}
          </Link>
          <p className="text-muted-foreground mt-1 text-xs">
            {project.module ? `${project.module} · ` : ""}
            {project._count.commitments === 1
              ? "1 compromiso"
              : `${project._count.commitments} compromisos`}
            {" · "}
            {project._count.documents === 1
              ? "1 documento"
              : `${project._count.documents} documentos`}
          </p>
        </div>
        <Badge variant={project.status === "ACTIVE" ? "secondary" : "outline"}>
          {projectStatusLabel[project.status]}
        </Badge>
      </div>

      {project.description ? (
        <p className="text-muted-foreground text-xs text-pretty">
          {project.description}
        </p>
      ) : null}
    </li>
  );
}
