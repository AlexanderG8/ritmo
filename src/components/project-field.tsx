import { Field, Select } from "@/components/field";

export type ProjectOption = { id: string; name: string };

/**
 * Selector de proyecto. Opcional a propósito: no todo compromiso pertenece a
 * un proyecto, y forzar uno llenaría la lista de proyectos falsos. Si todavía
 * no hay ninguno, el campo no aparece.
 */
export function ProjectField({
  projects,
  defaultValue,
  hint,
}: {
  projects: ProjectOption[];
  defaultValue?: string | null;
  hint?: string;
}) {
  if (projects.length === 0) return null;

  return (
    <Field htmlFor="projectId" label="Proyecto (opcional)" hint={hint}>
      <Select
        id="projectId"
        name="projectId"
        defaultValue={defaultValue ?? ""}
        aria-describedby={hint ? "projectId-hint" : undefined}
      >
        <option value="">Sin proyecto</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
