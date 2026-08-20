import { DocumentForm } from "@/components/document-form";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";

export default function NuevoDocumentoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
      <PageHeader
        title="Nuevo documento"
        description="10-15 minutos. Ni más, ni al final del día."
      />
      <Section>
        <DocumentForm />
      </Section>
    </div>
  );
}
