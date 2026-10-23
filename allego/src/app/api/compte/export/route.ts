import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { today } from "@/lib/dates";

/** Export RGPD : toutes les données du compte connecté, au format JSON. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "non connecté" }, { status: 401 });

  const [profile, weights, food, activities, subscriptions] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(schema.profiles.userId, user.id) }),
    db.query.weightEntries.findMany({ where: eq(schema.weightEntries.userId, user.id), orderBy: asc(schema.weightEntries.date) }),
    db.query.foodEntries.findMany({ where: eq(schema.foodEntries.userId, user.id), orderBy: asc(schema.foodEntries.date) }),
    db.query.activityEntries.findMany({ where: eq(schema.activityEntries.userId, user.id), orderBy: asc(schema.activityEntries.date) }),
    db.query.subscriptions.findMany({ where: eq(schema.subscriptions.userId, user.id) }),
  ]);

  const data = {
    exporteLe: new Date().toISOString(),
    compte: {
      prenom: user.name,
      email: user.email,
      creeLe: user.createdAt,
      consentementDonneesSante: user.healthConsentAt,
      finEssai: user.trialEndsAt,
    },
    profil: profile ?? null,
    pesees: weights.map(({ date, weightKg }) => ({ date, poidsKg: weightKg })),
    journal: food.map(({ date, meal, name, calories, proteinG, carbsG, fatG }) => ({
      date, repas: meal, aliment: name, kcal: calories, proteinesG: proteinG, glucidesG: carbsG, lipidesG: fatG,
    })),
    activites: activities.map(({ date, type, durationMin, caloriesBurned }) => ({ date, activite: type, minutes: durationMin, kcal: caloriesBurned })),
    abonnements: subscriptions.map(({ paypalSubscriptionId, plan, status, currentPeriodEnd, createdAt }) => ({
      idPaypal: paypalSubscriptionId, formule: plan, statut: status, finPeriode: currentPeriodEnd, creeLe: createdAt,
    })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="allego-mes-donnees-${today()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
