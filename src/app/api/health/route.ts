import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Nunca prerenderizar: consultaría la base de datos durante el build.
export const dynamic = "force-dynamic";

// Criterio de salida de la Fase 0: esta ruta responde ok:true en producción.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, db: "down", error: (error as Error).message },
      { status: 503 },
    );
  }
}
