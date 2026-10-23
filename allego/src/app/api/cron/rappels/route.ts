import { NextResponse, type NextRequest } from "next/server";
import { sendTrialReminders } from "@/lib/reminders";

/**
 * Appelé chaque jour par Vercel Cron (voir vercel.json).
 * Vercel envoie automatiquement l'en-tête Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  const sent = await sendTrialReminders();
  return NextResponse.json({ rappelsEnvoyes: sent });
}
