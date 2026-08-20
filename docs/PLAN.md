# Ritmo — Plan corregido

> Una sola frase: **forzar rendición de cuentas semanal cuando no hay jefe que la exija.**
>
> No es un to-do list. La diferencia es el *enforcement*: la app no deja cerrar una
> tarea sin documentar, y muestra sin piedad el % de compromisos incumplidos.

**Regla de vida del proyecto:** si a las 2 semanas Ritmo no está desplegada y en uso
real, el proyecto falló aunque el código sea bonito. Construir la app es la forma más
elegante de procrastinar que existe.

**Condición previa:** el ciclo semanal arranca **en papel esta semana**, sin esperar a
la app. La herramienta refuerza el hábito; no lo crea.

---

## 1. Correcciones aplicadas al plan original

| # | Problema del plan original | Corrección |
|---|---|---|
| 1 | Modelaba solo trabajo planificado; el soporte reactivo (la función principal) no existía en las métricas | `Commitment.wasPlanned` + `FocusBlock.interruptedMinutes` + métrica **% de trabajo no planificado** |
| 2 | El DoD (la regla más importante) llegaba en Fase 3, ~4 semanas | `Commitment.docNotes` desde **Fase 1**: el DoD nace con la app |
| 3 | `Commitment ↔ Document` era 1:1 (`documentId @unique`) | Tabla intermedia `CommitmentDocument` (N:N) |
| 4 | Auth en Fase 5, con documentación de la empresa dentro | Auth en **Fase 0**. Export a markdown en **Fase 3** |
| 5 | `estimatedHours Decimal` vs `actualMinutes Int` | **Minutos en todo el schema** (`plannedMinutes`) |
| 6 | `Commitment.actualMinutes` duplicaba la suma de `FocusBlock` | Columna eliminada; se calcula con aggregate |
| 7 | Cumplimiento ≥80% premiaba comprometerse a poco | `WeeklyCycle.capacityMinutes` + métrica de sub-compromiso |
| 8 | Validación del DoD suelta en el Server Action | Un **único** `completeCommitment()`; ningún otro punto cambia el estado |

### Pendiente de confirmar (no es código)

- [ ] Verificar con la empresa que no hay política que impida guardar documentación
      interna en una BD personal en la nube. Es una pregunta de dos minutos.

---

## 2. Stack

- Next.js 15 (App Router) + TypeScript `strict`
- Tailwind CSS v4 + shadcn/ui
- Prisma ORM + Neon Postgres (**dos URLs**: pooled para runtime, direct para migrate — es el error nº1 al empezar con Neon)
- Server Actions para todas las mutaciones, con `revalidatePath`
- Zod + react-hook-form
- Recharts
- `date-fns` + `date-fns-tz`, todo normalizado a `America/Lima` **en el servidor**. Nunca confiar en la zona del cliente
- Deploy: Vercel + Neon (free tier)
- Auth: `middleware.ts` con password única en env var, **desde la Fase 0**
- Sin estado global: RSC + `searchParams` para filtros. Nada de Zustand ni Redux

---

## 3. La línea de código más importante del proyecto

Vive en **una sola** función de servicio. Todo cambio de estado pasa por aquí; si
mañana aparece un segundo punto de actualización, la regla se cae sin que te enteres.

```ts
// src/server/commitments/complete.ts
export async function completeCommitment(id: string) {
  const c = await prisma.commitment.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });

  const documented = Boolean(c.docNotes?.trim()) || c._count.documents > 0;

  if (c.requiresDoc && !documented) {
    throw new ValidationError("No puedes cerrar esta tarea sin documentación.");
  }

  return prisma.commitment.update({
    where: { id },
    data: { status: "DONE", completedAt: new Date() },
  });
}
```

Todo lo demás es adorno.

---

## 4. Rutas

```
/                     Dashboard (métricas + estado de la semana)
/hoy                  Plan del día: bloques, timer, win, check-in
/semana               Ciclo actual: compromisos, blockers
/semana/planificar    Ritual del lunes (15 min)
/semana/retro         Ritual del viernes
/semana/historial     Ciclos cerrados
/tareas/[id]          Detalle de compromiso
/docs                 Listado + búsqueda
/docs/nuevo           Editor markdown
/docs/[id]            Ver / editar
/metricas             Gráficos de tendencia
```

---

## 5. Métricas

| Métrica | Cálculo | Meta |
|---|---|---|
| **Cumplimiento semanal** | `DONE / total`, **solo `wasPlanned = true`** | ≥ 80% |
| **Trabajo no planificado** | minutos de `wasPlanned = false` + `interruptedMinutes` ÷ minutos totales | conocerlo |
| **Sub-compromiso** | `SUM(plannedMinutes) / capacityMinutes` | 70–90% |
| Deuda de documentación | tareas `DONE` sin doc ni `docNotes` | 0 (imposible por diseño) |
| Racha | semanas consecutivas con ≥80% | ↑ |
| Distracciones/semana | `SUM(distractions)` | ↓ tendencia |
| Tiempo protegido | % de bloques con `wasProtected = true` | ≥ 70% |
| Distribución por categoría | minutos reales por `WorkCategory` | equilibrio |
| **Arrastre** | tareas `CARRIED_OVER` | ≤ 1/semana |

Las dos que importan de verdad:

- **Arrastre** te dice si te sobre-comprometes o simplemente no cumples.
- **Trabajo no planificado** te dice si el problema eres tú o es la carga de soporte.
  Es además el único dato con el que puedes defender tu tiempo ante la empresa.

Y por eso existe **sub-compromiso**: cumplir el 100% de tres tareas triviales no es
cumplir. Sin esa métrica, el sistema premia la cobardía.

---

## 6. Fases

| Fase | Contenido | Criterio de salida |
|---|---|---|
| **0** — Setup ✅ | `create-next-app` TS+Tailwind → proyecto Neon → Prisma init con driver adapter → shadcn init → **middleware de auth** → deploy | Hay un deploy vivo y protegido con password. Sin esto no se pasa a Fase 1 |
| **1** — Núcleo utilizable ✅ | `WeeklyCycle` + `Commitment` con CRUD, `wasPlanned`, `docNotes`, **`completeCommitment()` con el DoD activo**, `/semana` y `/semana/planificar` | Un ciclo semanal real completado con la app. No se construye nada más hasta que eso ocurra |
| **2** — Bloques y diario ✅ | `FocusBlock` + `DailyLog` + `/hoy` con timer, contador de distracciones, win diario | Una semana registrando bloques |
| **3** — Documentación real ✅ | `Document`, editor markdown, N:N, ascenso de `docNotes`, **export a markdown** | La documentación puede salir de la app en archivos |
| **4** — Métricas | Dashboard Recharts, agregados, historial | Las 3 métricas clave visibles |
| **5** — Pulido ✅ | Retro del viernes, bloqueos, arrastre automático | El ciclo semanal se cierra solo y arrastra a la semana siguiente |

---

## 7. Decisiones fijadas

- **Fechas:** `@db.Date` para días, `DateTime` para timestamps. Normalizar a
  `America/Lima` en servidor.
- **Semana:** lunes a viernes. El fin de semana no existe en el modelo — es una
  decisión deliberada, no un olvido.
- **`getCurrentCycle()`** crea el ciclo si no existe. Idempotente.
- **Neon:** `DATABASE_URL` pooled + `DIRECT_URL` directa. Verificar la sintaxis
  vigente del driver adapter en la doc de Prisma al montar la Fase 0 (la API cambió
  de nombre recientemente; no copiarla de memoria).
- **Server Actions** para mutaciones. Route Handlers solo si algún día hace falta API pública.
- **Un único punto de cambio de estado** de `Commitment`.
