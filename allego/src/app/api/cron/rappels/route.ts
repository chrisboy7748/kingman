import { NextResponse, type NextRequest } from "next/server";
import { lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { purgeRateLimits } from "@/lib/rate-limit";
import { sendTrialReminders } from "@/lib/reminders";

/**
 * Tâche quotidienne, appelée par Vercel Cron (voir vercel.json) : rappels de fin d'essai
 * et ménage des tentatives de connexion et des liens de réinitialisation expirés.
 * Vercel envoie automatiquement l'en-tête Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  const sent = await sendTrialReminders();
  await purgeRateLimits();
  await db.delete(schema.passwordResets).where(lt(schema.passwordResets.expiresAt, new Date(Date.now() - 86_400_000)));
  return NextResponse.json({ rappelsEnvoyes: sent });
}
