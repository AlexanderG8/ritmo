import Link from "next/link";
import { Download, FileText, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { Field, Select } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { Section, SectionTitle } from "@/components/section";
import { formatDate } from "@/lib/dates";
import { docTypeLabel } from "@/lib/labels";
import { listDocuments } from "@/server/documents";
import type { DocType } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || undefined;
  const type =
    params.tipo && params.tipo in docTypeLabel
      ? (params.tipo as DocType)
      : undefined;

  const documents = await listDocuments({ query, type });

  return (
    <div className="flex flex-col gap-8 py-6">
      <PageHeader
        title="Documentación"
        description="Lo que hiciste, cómo funciona y por qué lo decidiste así."
        aside={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href="/api/docs/export" download>
                <Download aria-hidden className="size-4" />
                Exportar todo
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/docs/nuevo">
                <Plus aria-hidden className="size-4" />
                Nuevo
              </Link>
            </Button>
          </div>
        }
      />

      <Section>
        <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
          <Field htmlFor="q" label="Buscar">
            <Input
              id="q"
              name="q"
              defaultValue={query ?? ""}
              placeholder="Título, módulo, contenido o etiqueta"
            />
          </Field>

          <Field htmlFor="tipo" label="Tipo">
            <Select id="tipo" name="tipo" defaultValue={type ?? ""}>
              <option value="">Todos</option>
              {Object.entries(docTypeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Button type="submit" variant="secondary" size="sm">
            <Search aria-hidden className="size-4" />
            Buscar
          </Button>
        </form>
      </Section>

      <Section>
        <SectionTitle count={documents.length}>Documentos</SectionTitle>

        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            action={
              <Button asChild size="sm">
                <Link href="/docs/nuevo">Escribir el primero</Link>
              </Button>
            }
          >
            {query || type
              ? "Nada coincide con esa búsqueda."
              : "Todavía no hay documentación. El día que te vayas de la empresa, esto es lo único que quedará de tu trabajo."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {documents.map((document) => (
              <li
                key={document.id}
                className="bg-card ring-foreground/10 rounded-lg p-4 ring-1"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/docs/${document.id}`}
                      className="text-sm font-medium text-pretty hover:underline"
                    >
                      {document.title}
                    </Link>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span>{docTypeLabel[document.type]}</span>
                      {document.module ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>{document.module}</span>
                        </>
                      ) : null}
                      <span aria-hidden>·</span>
                      <span>{formatDate(document.updatedAt)}</span>
                      {document._count.commitments > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {document._count.commitments === 1
                              ? "1 compromiso"
                              : `${document._count.commitments} compromisos`}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  {document.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
