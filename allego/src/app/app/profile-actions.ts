"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { ageFrom, checkGoal, WEEKLY_GOALS } from "@/lib/health";
import { isIsoDate, today } from "@/lib/dates";
import type { FormState } from "@/app/(auth)/actions";

const decimal = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => Number(v.replace(",", ".")))
    .pipe(
      z
        .number({ error: `${label} : saisissez un nombre.` })
        .min(min, `${label} : la valeur doit être comprise entre ${min} et ${max}.`)
        .max(max, `${label} : la valeur doit être comprise entre ${min} et ${max}.`),
    )
    .transform((v) => Math.round(v * 10) / 10);

const profileSchema = z.object({
  sex: z.enum(["femme", "homme"], { error: "Indiquez votre sexe." }),
  birthDate: z.string().refine(isIsoDate, "Indiquez votre date de naissance."),
  heightCm: z.coerce
    .number({ error: "Taille : saisissez un nombre." })
    .int("Taille : saisissez un nombre entier de centimètres.")
    .min(120, "Taille : la valeur doit être comprise entre 120 et 230 cm.")
    .max(230, "Taille : la valeur doit être comprise entre 120 et 230 cm."),
  targetWeightKg: decimal("Poids visé", 35, 250),
  activityLevel: z.enum(["sedentaire", "leger", "modere", "actif"], { error: "Choisissez votre niveau d'activité." }),
  weeklyGoalKg: z.coerce
    .number()
    .refine((v) => (WEEKLY_GOALS as readonly number[]).includes(v), "Choisissez un rythme de perte."),
});

const createSchema = profileSchema.extend({ weightKg: decimal("Poids actuel", 35, 300) });

export async function saveProfile(mode: "create" | "edit", _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const day = today();

  if (mode === "create") {
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { weightKg, ...p } = parsed.data;
    const check = checkGoal({ age: ageFrom(p.birthDate, day), heightCm: p.heightCm, weightKg, targetWeightKg: p.targetWeightKg });
    if (!check.ok) return { error: check.reason };

    await db.transaction(async (tx) => {
      await tx
        .insert(schema.profiles)
        .values({ userId: user.id, ...p, startWeightKg: weightKg })
        .onConflictDoUpdate({ target: schema.profiles.userId, set: { ...p, startWeightKg: weightKg, updatedAt: new Date() } });
      await tx
        .insert(schema.weightEntries)
        .values({ userId: user.id, date: day, weightKg })
        .onConflictDoUpdate({
          target: [schema.weightEntries.userId, schema.weightEntries.date],
          set: { weightKg },
        });
    });
    redirect("/app");
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;
  const profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, user.id) });
  if (!profile) redirect("/app/bienvenue");
  const latest = await db.query.weightEntries.findFirst({
    where: eq(schema.weightEntries.userId, user.id),
    orderBy: desc(schema.weightEntries.date),
  });
  const weightKg = latest?.weightKg ?? profile.startWeightKg;
  const check = checkGoal({ age: ageFrom(p.birthDate, day), heightCm: p.heightCm, weightKg, targetWeightKg: p.targetWeightKg });
  if (!check.ok) return { error: check.reason };

  await db.update(schema.profiles).set({ ...p, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  revalidatePath("/app", "layout");
  return { ok: "Profil enregistré. Votre objectif calorique a été recalculé." };
}
