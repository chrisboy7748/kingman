import "server-only";
import { headers } from "next/headers";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/db";

/** Vrai si `key` a déjà atteint `limit` tentatives sur la période. */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.rateLimitEvents)
    .where(and(eq(schema.rateLimitEvents.key, key), gt(schema.rateLimitEvents.createdAt, new Date(Date.now() - windowMs))));
  return n >= limit;
}

export async function recordAttempt(key: string) {
  await db.insert(schema.rateLimitEvents).values({ key });
}

/** Supprime les tentatives de plus d'un jour. */
export async function purgeRateLimits() {
  await db.delete(schema.rateLimitEvents).where(lt(schema.rateLimitEvents.createdAt, new Date(Date.now() - 86_400_000)));
}

/** Adresse IP du visiteur, telle que transmise par l'hébergeur. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
}
