import type { NextRequest } from "next/server";
import { isoDay } from "@/lib/dates";
import { getCurrentCycle } from "@/server/cycles";
import { renderWeeklyReportMarkdown, weeklyReport } from "@/server/report";

export const dynamic = "force-dynamic";

/**
 * El informe de la semana como archivo. Sin `?cycle=`, la semana en curso.
 * Mismo contrato que la exportación de documentos: markdown plano, descarga
 * directa y nada cacheado.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("cycle");
  const cycleId = requested ?? (await getCurrentCycle()).id;

  const report = await weeklyReport(cycleId);
  if (!report) {
    return new Response("Semana no encontrada", { status: 404 });
  }

  return new Response(renderWeeklyReportMarkdown(report), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="ritmo-semana-${isoDay(report.weekStart)}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
