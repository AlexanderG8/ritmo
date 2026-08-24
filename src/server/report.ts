import { prisma } from "@/lib/prisma";
import { formatDate, formatMinutes } from "@/lib/dates";
import { categoryLabel, cycleStatusLabel, statusLabel } from "@/lib/labels";
import { isDocumented } from "@/server/commitments";
import { frontmatter } from "@/server/export";
import { minutesByCommitment, weekBlockStats } from "@/server/focus";
import { categoryDistribution } from "@/server/history";
import { formatPercent, weekMetrics, type WeekMetrics } from "@/server/metrics";
import type {
  CommitmentStatus,
  CycleStatus,
  WorkCategory,
} from "@/generated/prisma/enums";

export type ReportCommitment = {
  id: string;
  title: string;
  category: WorkCategory;
  status: CommitmentStatus;
  plannedMinutes: number | null;
  actualMinutes: number;
  documented: boolean;
};

export type WeeklyReport = {
  cycleId: string;
  weekStart: Date;
  weekEnd: Date;
  status: CycleStatus;
  capacityMinutes: number | null;
  metrics: WeekMetrics;
  planned: ReportCommitment[];
  unplanned: ReportCommitment[];
  categories: { category: WorkCategory; minutes: number }[];
  workedMinutes: number;
  distractions: number;
  interruptedMinutes: number;
  protectedShare: number | null;
  blockers: {
    description: string;
    resolved: boolean;
    commitmentTitle: string | null;
  }[];
  retroWentWell: string | null;
  retroToImprove: string | null;
};

/**
 * Todo lo que la semana puede demostrar, en una sola estructura. No calcula
 * ninguna métrica por su cuenta: reutiliza `weekMetrics()` y
 * `categoryDistribution()` para que el informe no pueda decir un número
 * distinto del que muestra la app.
 *
 * Los descartados aparecen en la lista aunque no cuenten para el cumplimiento:
 * un informe que esconde lo que abandonaste no sirve para rendir cuentas.
 */
export async function weeklyReport(
  cycleId: string,
): Promise<WeeklyReport | null> {
  const cycle = await prisma.weeklyCycle.findUnique({
    where: { id: cycleId },
    include: {
      commitments: {
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        include: { documents: { select: { documentId: true } } },
      },
      blockers: {
        orderBy: [{ resolved: "asc" }, { createdAt: "asc" }],
        include: { commitment: { select: { title: true } } },
      },
    },
  });

  if (!cycle) return null;

  const metrics = weekMetrics(cycle, cycle.commitments);

  const [minutes, categories, blocks] = await Promise.all([
    minutesByCommitment(cycle.commitments.map((commitment) => commitment.id)),
    categoryDistribution(cycle.weekStart, cycle.weekEnd),
    weekBlockStats(cycle.weekStart, cycle.weekEnd),
  ]);

  const toReport = (
    commitment: (typeof cycle.commitments)[number],
  ): ReportCommitment => ({
    id: commitment.id,
    title: commitment.title,
    category: commitment.category,
    status: commitment.status,
    plannedMinutes: commitment.plannedMinutes,
    actualMinutes: minutes.get(commitment.id) ?? 0,
    documented: isDocumented(commitment),
  });

  return {
    cycleId: cycle.id,
    weekStart: cycle.weekStart,
    weekEnd: cycle.weekEnd,
    status: cycle.status,
    capacityMinutes: cycle.capacityMinutes,
    metrics,
    planned: cycle.commitments
      .filter((commitment) => commitment.wasPlanned)
      .map(toReport),
    unplanned: cycle.commitments
      .filter((commitment) => !commitment.wasPlanned)
      .map(toReport),
    categories,
    workedMinutes: blocks.workedMinutes,
    distractions: blocks.distractions,
    interruptedMinutes: blocks.interruptedMinutes,
    protectedShare: blocks.protectedShare,
    blockers: cycle.blockers.map((blocker) => ({
      description: blocker.description,
      resolved: blocker.resolved,
      commitmentTitle: blocker.commitment?.title ?? null,
    })),
    retroWentWell: cycle.retroWentWell,
    retroToImprove: cycle.retroToImprove,
  };
}

export function reportTitle(report: WeeklyReport): string {
  return `Semana del ${formatDate(report.weekStart)} al ${formatDate(report.weekEnd)}`;
}

function table(head: string[], rows: string[][]): string[] {
  return [
    `| ${head.join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ];
}

const COMMITMENT_HEAD = [
  "Compromiso",
  "Categoría",
  "Estado",
  "Estimado",
  "Real",
  "Documentado",
];

function commitmentRows(commitments: ReportCommitment[]): string[][] {
  return commitments.map((commitment) => [
    // Una barra vertical en el título rompería la tabla markdown.
    commitment.title.replace(/\|/g, "\\|"),
    categoryLabel[commitment.category],
    statusLabel[commitment.status],
    commitment.plannedMinutes ? formatMinutes(commitment.plannedMinutes) : "—",
    formatMinutes(commitment.actualMinutes),
    commitment.documented ? "Sí" : "No",
  ]);
}

/**
 * El informe en markdown. Es la vía por la que los datos de la semana salen de
 * la app: si mañana Ritmo desaparece, esto sigue siendo un archivo legible.
 */
export function renderWeeklyReportMarkdown(report: WeeklyReport): string {
  const { metrics } = report;

  const parts: string[] = [
    frontmatter({
      semana: `${formatDate(report.weekStart, "yyyy-MM-dd")} / ${formatDate(report.weekEnd, "yyyy-MM-dd")}`,
      estado: cycleStatusLabel[report.status],
      cumplimiento: formatPercent(metrics.compliance),
      trabajo_no_planificado: formatPercent(metrics.unplannedShare),
      arrastre: String(metrics.carriedOver),
      tiempo_registrado: formatMinutes(report.workedMinutes),
      exportado: new Date().toISOString(),
    }),
    "",
    `# ${reportTitle(report)}`,
    "",
    "## Resumen",
    "",
    ...table(
      ["Métrica", "Valor", "Meta"],
      [
        [
          "Cumplimiento",
          `${formatPercent(metrics.compliance)} (${metrics.plannedDone} de ${metrics.plannedTotal})`,
          "≥ 80%",
        ],
        [
          "Trabajo no planificado",
          `${formatPercent(metrics.unplannedShare)} (${metrics.unplannedTotal} tareas)`,
          "Conocerlo",
        ],
        ["Arrastre", String(metrics.carriedOver), "≤ 1 por semana"],
        [
          "Compromiso vs capacidad",
          formatPercent(metrics.commitmentRatio),
          "70–90%",
        ],
        ["Deuda de documentación", String(metrics.docDebt), "0"],
        [
          "Tiempo registrado",
          formatMinutes(report.workedMinutes),
          report.capacityMinutes
            ? `Capacidad declarada ${formatMinutes(report.capacityMinutes)}`
            : "Sin capacidad declarada",
        ],
        ["Bloques protegidos", formatPercent(report.protectedShare), "≥ 70%"],
        ["Distracciones", String(report.distractions), "Tendencia a la baja"],
      ],
    ),
    "",
    "## Compromisos planificados",
    "",
  ];

  parts.push(
    ...(report.planned.length === 0
      ? ["_No se planificó nada esta semana._"]
      : table(COMMITMENT_HEAD, commitmentRows(report.planned))),
    "",
    "## Trabajo no planificado",
    "",
    ...(report.unplanned.length === 0
      ? ["_Nada entró a mitad de semana._"]
      : [
          ...table(COMMITMENT_HEAD, commitmentRows(report.unplanned)),
          "",
          `Interrupciones dentro de bloques de foco: ${formatMinutes(report.interruptedMinutes)}.`,
        ]),
    "",
    "## Dónde se fue el tiempo",
    "",
    ...(report.categories.length === 0
      ? ["_No se cerró ningún bloque de foco._"]
      : table(
          ["Categoría", "Tiempo"],
          report.categories.map((row) => [
            categoryLabel[row.category],
            formatMinutes(row.minutes),
          ]),
        )),
    "",
    "## Bloqueos",
    "",
    ...(report.blockers.length === 0
      ? ["_Ninguno registrado._"]
      : report.blockers.map(
          (blocker) =>
            `- ${blocker.resolved ? "[Resuelto] " : ""}${blocker.description}${
              blocker.commitmentTitle ? ` (${blocker.commitmentTitle})` : ""
            }`,
        )),
    "",
  );

  if (report.retroWentWell || report.retroToImprove) {
    parts.push(
      "## Retro",
      "",
      "**Qué salió bien**",
      "",
      report.retroWentWell ?? "—",
      "",
      "**Qué hay que mejorar**",
      "",
      report.retroToImprove ?? "—",
      "",
    );
  }

  return parts.join("\n");
}
