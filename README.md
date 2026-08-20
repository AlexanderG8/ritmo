# Ritmo

**Sistema personal de rendición de cuentas profesional.**

> Forzar rendición de cuentas semanal cuando no hay jefe que la exija.

## Qué problema resuelve

Un puesto cómodo, sin presión y sin nadie que pregunte "¿documentaste?" es una
trampa: la disciplina se erosiona sin que nadie lo note, hasta que tres meses
después alguien pregunta por qué no hay documentación de nada.

Ritmo **no es un gestor de tareas**. La diferencia es el *enforcement*: no te deja
cerrar una tarea sin documentarla, distingue lo que no cumpliste de lo que te
interrumpieron, y te enseña sin adornos el porcentaje de compromisos que
incumpliste.

## Cómo funciona

| Cuándo | Qué |
|---|---|
| **Lunes**, 15 min | Declaras tu capacidad real y defines 3-5 compromisos concretos |
| **Durante la semana** | Cronometras bloques de foco, cuentas distracciones, registras bloqueos |
| **Cada día** | Registras energía, concentración y un logro obligatorio |
| **Al cerrar una tarea** | Escribes la documentación — o la tarea no se cierra |
| **Viernes** | Arrastras o descartas lo abierto, escribes la retro y cierras la semana |

Al iniciar la semana ocurre lo importante: **todo lo que entre después queda
marcado automáticamente como no planificado**. Esa etiqueta no la eliges tú, así
que una incidencia del miércoles no puede disfrazarse de tarea prevista el lunes.

Y al cerrar el viernes, lo arrastrado **nace de nuevo en la semana siguiente
apuntando a la tarea que no se hizo**: el arrastre no se borra reescribiendo la
tarea.

## Las métricas que importan

| Métrica | Meta | Qué te dice |
|---|---|---|
| **Cumplimiento** (solo sobre lo planificado) | ≥ 80% | Si la semana valió |
| **Trabajo no planificado** | conocerlo | Si el problema es tu disciplina o la carga de soporte |
| **Arrastre** | ≤ 1 por semana | Si te sobre-comprometes o simplemente no cumples |
| **Compromiso vs capacidad** | 70-90% | Que cumplir el 100% de casi nada no cuente como cumplir |
| **Deuda de documentación** | 0 | Por diseño debería ser imposible que no lo sea |

## Pantallas

- **Hoy** — bloques de foco con cronómetro, contador de distracciones, cierre del día
- **Semana** — compromisos, métricas, bloqueos, y los rituales de lunes y viernes
- **Documentos** — editor Markdown, vinculación N:M con compromisos, exportación a `.md`
- **Métricas** — doce semanas de tendencias y distribución real del tiempo

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript strict ·
Tailwind CSS v4 · shadcn/ui · Prisma 7 · Neon (PostgreSQL 18) · Zod · Recharts

Detalle completo, con versiones y motivos, en
[`docs/UML-ACHITEC-TEC.md`](docs/UML-ACHITEC-TEC.md).

## Puesta en marcha

Desarrollado con Node.js 24 y npm 11. Requiere una base de datos Neon.

```bash
npm install
```

Copia `.env.example` a `.env` y rellena las cuatro variables: `DATABASE_URL`
(pooled), `DIRECT_URL` (directa), `APP_PASSWORD` y `AUTH_SECRET`. Después:

```bash
npm run db:migrate
```

```bash
npm run dev
```

La aplicación queda en `http://localhost:3000`, detrás de la contraseña que
definiste. Los pasos completos, incluido el despliegue en Vercel, están en
[`docs/SETUP.md`](docs/SETUP.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:migrate` | Crea y aplica una migración |
| `npm run db:deploy` | Aplica migraciones en producción |
| `npm run db:studio` | Prisma Studio |
| `npm run check:dod` | Verifica la regla de documentación y el ciclo semanal |
| `npm run check:fase2` | Bloques de foco, zona horaria y registro diario |
| `npm run check:fase3` | Documentos, vinculación y exportación |
| `npm run check:fase4` | Métricas agregadas e historial |
| `npm run check:fase5` | Retro, cierre de ciclo y arrastre |

Las cinco suites suman **115 comprobaciones** y se ejecutan contra la base de
datos real: siembran sus datos y los borran al terminar.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/Ejemplos de Uso.md`](docs/Ejemplos%20de%20Uso.md) | Qué hace y **por qué** cada función de cada pantalla |
| [`docs/UML-ACHITEC-TEC.md`](docs/UML-ACHITEC-TEC.md) | UML de la base de datos, arquitectura y tecnologías |
| [`docs/PLAN.md`](docs/PLAN.md) | El plan por fases y la fórmula de cada métrica |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Sistema de diseño |
| [`docs/SETUP.md`](docs/SETUP.md) | Puesta en marcha y despliegue |

## Una advertencia que forma parte del proyecto

Construir una app de productividad es la forma más elegante de procrastinar. Por
eso el plan se diseñó en fases donde la primera ya era usable en una semana, y
por eso la condición sigue en pie: **la herramienta refuerza el hábito, no lo
crea**. Si la semana no se cierra el viernes con su retro, esto es un proyecto
bonito en lugar de una herramienta.
