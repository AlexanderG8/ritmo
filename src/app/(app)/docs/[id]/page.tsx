import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentDelete } from "@/components/document-delete";
import { DocumentForm } from "@/components/document-form";
import { DocumentLinks } from "@/components/document-links";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { formatDate } from "@/lib/dates";
import { docTypeLabel } from "@/lib/labels";
import { getCurrentCycleWithCommitments } from "@/server/cycles";
import { getDocument } from "@/server/documents";
import { assignableProjects } from "@/server/projects";

export const dynamic = "force-dynamic";

export default async function DocumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;

  const document = await getDocument(id);
  if (!document) notFound();

  const projects = await assignableProjects();

  const editing = editar === "1";
  const linked = document.commitments.map((link) => link.commitment);
  const linkedIds = new Set(linked.map((commitment) => commitment.id));

  const { commitments } = await getCurrentCycleWithCommitments();
  const linkable = commitments
    .filter((commitment) => !linkedIds.has(commitment.id))
    .map((commitment) => ({ id: commitment.id, title: commitment.title }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
      <PageHeader
        title={document.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>{docTypeLabel[document.type]}</span>
            {document.module ? (
              <>
                <span aria-hidden>·</span>
                <span>{document.module}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>Actualizado el {formatDate(document.updatedAt)}</span>
          </span>
        }
        aside={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={`/api/docs/export?document=${document.id}`} download>
                <Download aria-hidden className="size-4" />
                Exportar
              </a>
            </Button>
            <Button asChild size="sm" variant={editing ? "ghost" : "default"}>
              <Link href={editing ? `/docs/${document.id}` : `/docs/${document.id}?editar=1`}>
                <Pencil aria-hidden className="size-4" />
                {editing ? "Ver" : "Editar"}
              </Link>
            </Button>
          </div>
        }
      />

      {document.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {document.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <Section>
        {editing ? (
          <DocumentForm
            projects={projects}
            document={{
              id: document.id,
              title: document.title,
              type: document.type,
              module: document.module,
              projectId: document.projectId,
              contentMd: document.contentMd,
              tags: document.tags,
            }}
          />
        ) : (
          <article className="bg-card ring-foreground/10 rounded-lg p-4 ring-1">
            <Markdown>{document.contentMd}</Markdown>
          </article>
        )}
      </Section>

      <Card>
        <CardHeader>
          <CardTitle>Compromisos vinculados</CardTitle>
          <CardDescription>
            Mientras este documento sea la única prueba de un compromiso
            cerrado, la app no te dejará desvincularlo ni borrarlo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentLinks
            documentId={document.id}
            linked={linked}
            linkable={linkable}
          />
        </CardContent>
      </Card>

      <Section>
        <DocumentDelete documentId={document.id} title={document.title} />
      </Section>
    </div>
  );
}
