import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/** Remet à zéro la base de test puis applique les migrations. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://allego:allego@localhost:5432/allego_test";
  const pg = postgres(url, { max: 1, onnotice: () => {} });
  await pg.unsafe("DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;");
  await migrate(drizzle(pg), { migrationsFolder: "drizzle" });
  await pg.end();
}
