// Applique les migrations de la base de données (dossier drizzle/).
// Sur Vercel, il est lancé à chaque déploiement de production (voir vercel.json),
// et ignoré pour les déploiements de prévisualisation pour ne pas toucher la base réelle.
//
//   npm run db:migrate

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    console.log(`Migrations ignorées pour un déploiement « ${process.env.VERCEL_ENV} ».`);
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL n'est pas défini.");
  // prepare: false pour fonctionner aussi à travers le pooler de Supabase.
  const pg = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  await migrate(drizzle(pg), { migrationsFolder: "drizzle" });
  await pg.end();
  console.log("Base de données à jour.");
}

main().catch((err) => {
  console.error("Échec des migrations :", err instanceof Error ? err.message : err);
  process.exit(1);
});
