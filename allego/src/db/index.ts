import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { allegoDb?: Db };

function getDb(): Db {
  if (globalForDb.allegoDb) return globalForDb.allegoDb;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL n'est pas défini");
  // prepare: false est requis par le pooler de Supabase (mode transaction).
  const pg = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
  globalForDb.allegoDb = drizzle(pg, { schema });
  return globalForDb.allegoDb;
}

// Connexion créée au premier usage, pour que `next build` fonctionne sans base de données.
export const db = new Proxy({} as Db, {
  get: (_, prop) => Reflect.get(getDb(), prop),
});

export { schema };
