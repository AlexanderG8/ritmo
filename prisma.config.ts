import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// La `url` de este archivo es la que usa el CLI de Prisma para migraciones.
// En Neon debe ser la conexión DIRECTA (sin pooler): migrar a través del
// pooler falla. El runtime, en cambio, usa la pooled (src/lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
