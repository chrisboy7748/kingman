import "server-only";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { accessState, hasAccess } from "@/lib/access";
import { ageFrom, calorieTarget } from "@/lib/health";
import { today } from "@/lib/dates";

export const getAccess = cache(async (userId: string, trialEndsAt: Date) => {
  const subs = await db.query.subscriptions.findMany({ where: eq(schema.subscriptions.userId, userId) });
  return accessState({ trialEndsAt }, subs);
});

/** Compte connecté ayant rempli son profil. Redirige vers le questionnaire sinon. */
export async function requireProfile() {
  const user = await requireUser();
  const profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, user.id) });
  if (!profile) redirect("/app/bienvenue");
  return { user, profile };
}

/** Comme requireProfile, et redirige vers l'abonnement si l'essai est terminé sans abonnement. */
export async function requireMember() {
  const { user, profile } = await requireProfile();
  const access = await getAccess(user.id, user.trialEndsAt);
  if (!hasAccess(access)) redirect("/app/abonnement");
  const latest = await db.query.weightEntries.findFirst({
    where: eq(schema.weightEntries.userId, user.id),
    orderBy: desc(schema.weightEntries.date),
  });
  const currentWeight = latest?.weightKg ?? profile.startWeightKg;
  const age = ageFrom(profile.birthDate, today());
  const target = calorieTarget({
    sex: profile.sex,
    weightKg: currentWeight,
    heightCm: profile.heightCm,
    age,
    activityLevel: profile.activityLevel,
    weeklyGoalKg: profile.weeklyGoalKg,
  });
  return { user, profile, access, currentWeight, age, target };
}
