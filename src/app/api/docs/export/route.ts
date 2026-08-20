import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportDocument, exportEverything, slugify } from "@/server/export";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("document");

  if (id) {
    const [doc, markdown] = await Promise.all([
      prisma.document.findUnique({ where: { id }, select: { title: true } }),
      exportDocument(id),
    ]);

    if (!doc || markdown === null) {
      return new Response("Documento no encontrado", { status: 404 });
    }

    return markdownResponse(markdown, `${slugify(doc.title)}.md`);
  }

  const markdown = await exportEverything();
  const today = new Date().toISOString().slice(0, 10);
  return markdownResponse(markdown, `ritmo-documentacion-${today}.md`);
}

function markdownResponse(body: string, filename: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
