# Fase 0 — Setup

Estado: el proyecto local está listo y compila. Faltan **tus** dos pasos de cuenta
(Neon y Vercel), que requieren tu login y no puedo hacer por ti.

## Lo que ya está hecho

- Next.js 16.3.1 (App Router, Turbopack) + TypeScript + Tailwind v4
- shadcn/ui inicializado (preset Nova sobre Radix) con `button`, `input`, `card`, `label`
- Prisma 7.9.1 + `@prisma/adapter-neon`, schema completo generado
- Auth por contraseña única en `src/proxy.ts` — toda la app queda detrás del login
- `/api/health` para comprobar la conexión a la base de datos
- `npm run build` y `npm run lint` pasan en limpio

## Paso 1 — Crear la base de datos en Neon

1. Entra a <https://console.neon.tech> y crea un proyecto (región más cercana a Lima).
2. En **Connection Details** copia **dos** cadenas distintas:
   - La **pooled**: el host contiene `-pooler`. Va en `DATABASE_URL`.
   - La **directa**: el mismo host **sin** `-pooler`. Va en `DIRECT_URL`.
3. Pégalas en el archivo `.env` (ya existe, con placeholders).

> Este es el error nº1 al empezar con Neon: usar la pooled para migraciones.
> Con Prisma 7 la separación es explícita: la pooled la usa el adapter en runtime
> (`src/lib/prisma.ts`), la directa la usa el CLI vía `prisma.config.ts`.

## Paso 2 — Definir tu contraseña

En `.env`, cambia `APP_PASSWORD` por la contraseña que usarás para entrar.
`AUTH_SECRET` ya viene generado aleatoriamente; no hace falta tocarlo.

## Paso 3 — Primera migración

```bash
npm run db:migrate -- --name init
```

Luego comprueba que la app levanta y que `/api/health` responde `{"ok":true}`:

```bash
npm run dev
```

## Paso 4 — Deploy a Vercel

1. Sube el repo a GitHub (`git remote add origin …` && `git push -u origin main`).
2. En <https://vercel.com/new> importa el repositorio.
3. Añade las **cuatro** variables de entorno en Vercel: `DATABASE_URL`,
   `DIRECT_URL`, `APP_PASSWORD`, `AUTH_SECRET`. Márcalas para los tres entornos
   (Production, Preview y Development).
4. Deploy.

> **Las variables tienen que existir antes del primer build, no solo en
> ejecución.** `src/generated` no se versiona, así que el `postinstall` del
> proyecto ejecuta `prisma generate` durante la instalación; y `prisma.config.ts`
> resuelve `env("DIRECT_URL")` al cargarse. Sin `DIRECT_URL` el build falla con
> `PrismaConfigEnvError: Cannot resolve environment variable: DIRECT_URL`, antes
> incluso de compilar Next.

**Criterio de salida de la Fase 0:** el deploy está vivo, pide contraseña, y
`/api/health` responde `{"ok":true,"db":"up"}` en producción. Hasta que eso ocurra,
no se empieza la Fase 1.

## Notas honestas

- `npm audit` reporta 3 vulnerabilidades *high* (`deepmerge-ts`), todas dentro del
  CLI de Prisma, que es `devDependency` y no llega al bundle de producción. La
  única forma de "arreglarlas" hoy es bajar a Prisma 6, que es peor remedio que la
  enfermedad. Se revisa cuando Prisma actualice la dependencia.
- El plan asumía Next 15 y Prisma 6. Las versiones actuales son Next 16 y Prisma 7,
  y ambas traen cambios que rompen lo que decía el plan original:
  `middleware.ts` → `proxy.ts`, `prisma-client-js` → `prisma-client` con `output`
  obligatorio, y `url`/`directUrl` fuera del `datasource`. Ya están aplicados.
