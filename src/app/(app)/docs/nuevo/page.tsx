import { DocumentForm } from "@/components/document-form";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { assignableProjects } from "@/server/projects";

export const dynamic = "force-dynamic";

export default async function NuevoDocumentoPage() {
  const projects = await assignableProjects();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
      <PageHeader
        title="Nuevo documento"
        description="10-15 minutos. Ni más, ni al final del día."
      />
      <Section>
        <DocumentForm projects={projects} />
      </Section>
    </div>
  );
}
