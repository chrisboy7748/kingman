import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Point de contrôle pour un service de surveillance (UptimeRobot, Better Stack…). */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ statut: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ statut: "base de données injoignable" }, { status: 503 });
  }
}
