"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/account";
import { addDays, isIsoDate, today } from "@/lib/dates";
import { findFood, MEALS } from "@/lib/foods";
import { findActivity } from "@/lib/activities";
import { activityCalories } from "@/lib/health";
import type { FormState } from "@/app/(auth)/actions";

/** Date saisie : ni dans le futur, ni plus d'un an en arrière. */
const entryDate = z
  .string()
  .refine(isIsoDate, "Indiquez une date valide.")
  .refine((d) => d <= today(), "La date ne peut pas être dans le futur.")
  .refine((d) => d >= addDays(today(), -366), "La date doit dater de moins d'un an.");

const kg = z
  .string()
  .trim()
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(z.number({ error: "Saisissez votre poids en kg, par exemple 72,4." }).min(35, "Le poids doit être compris entre 35 et 300 kg.").max(300, "Le poids doit être compris entre 35 et 300 kg."))
  .transform((v) => Math.round(v * 10) / 10);

const mealKey = z.enum(Object.keys(MEALS) as [keyof typeof MEALS, ...(keyof typeof MEALS)[]], {
  error: "Choisissez un repas.",
});

const optionalGrams = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
  .pipe(z.number().min(0).max(500).nullable())
  .transform((v) => (v === null ? null : Math.round(v)));

export async function addWeight(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember();
  const parsed = z.object({ date: entryDate, weightKg: kg }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { date, weightKg } = parsed.data;
  await db
    .insert(schema.weightEntries)
    .values({ userId: user.id, date, weightKg })
    .onConflictDoUpdate({ target: [schema.weightEntries.userId, schema.weightEntries.date], set: { weightKg } });
  revalidatePath("/app", "layout");
  return { ok: "Pesée enregistrée." };
}

export async function deleteWeight(formData: FormData) {
  const { user } = await requireMember();
  const id = z.uuid().parse(formData.get("id"));
  await db.delete(schema.weightEntries).where(and(eq(schema.weightEntries.id, id), eq(schema.weightEntries.userId, user.id)));
  revalidatePath("/app", "layout");
}

export async function addFoodFromList(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember();
  const parsed = z
    .object({
      date: entryDate,
      meal: mealKey,
      foodId: z.string().min(1, "Choisissez un aliment."),
      portions: z.coerce.number({ error: "Indiquez un nombre de portions." }).min(0.5, "Indiquez entre 0,5 et 10 portions.").max(10, "Indiquez entre 0,5 et 10 portions."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { date, meal, foodId, portions } = parsed.data;
  const food = findFood(foodId);
  if (!food) return { error: "Choisissez un aliment de la liste." };

  await db.insert(schema.foodEntries).values({
    userId: user.id,
    date,
    meal,
    name: portions === 1 ? `${food.name}, ${food.portion}` : `${food.name}, ${portions.toString().replace(".", ",")} × ${food.portion}`,
    calories: Math.round(food.kcal * portions),
    proteinG: Math.round(food.proteinG * portions),
    carbsG: Math.round(food.carbsG * portions),
    fatG: Math.round(food.fatG * portions),
  });
  revalidatePath("/app", "layout");
  return { ok: `Ajouté au journal : ${food.name}.` };
}

export async function addFoodCustom(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireMember();
  const parsed = z
    .object({
      date: entryDate,
      meal: mealKey,
      name: z.string().trim().min(1, "Indiquez ce que vous avez mangé.").max(120),
      calories: z.coerce.number({ error: "Indiquez les calories." }).int("Indiquez un nombre entier de calories.").min(0, "Les calories doivent être comprises entre 0 et 5 000.").max(5000, "Les calories doivent être comprises entre 0 et 5 000."),
      proteinG: optionalGrams,
      carbsG: optionalGrams,
      fatG: optionalGrams,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.insert(schema.foodEntries).values({ userId: user.id, ...parsed.data });
  revalidatePath("/app", "layout");
  return { ok: `Ajouté au journal : ${parsed.data.name}.` };
}

export async function deleteFood(formData: FormData) {
  const { user } = await requireMember();
  const id = z.uuid().parse(formData.get("id"));
  await db.delete(schema.foodEntries).where(and(eq(schema.foodEntries.id, id), eq(schema.foodEntries.userId, user.id)));
  revalidatePath("/app", "layout");
}

export async function addActivity(_: FormState, formData: FormData): Promise<FormState> {
  const { user, currentWeight } = await requireMember();
  const parsed = z
    .object({
      date: entryDate,
      activityId: z.string().min(1, "Choisissez une activité."),
      durationMin: z.coerce.number({ error: "Indiquez une durée en minutes." }).int("Indiquez un nombre entier de minutes.").min(5, "La durée doit être comprise entre 5 et 600 minutes.").max(600, "La durée doit être comprise entre 5 et 600 minutes."),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { date, activityId, durationMin } = parsed.data;
  const activity = findActivity(activityId);
  if (!activity) return { error: "Choisissez une activité de la liste." };

  const caloriesBurned = activityCalories(activity.met, currentWeight, durationMin);
  await db.insert(schema.activityEntries).values({ userId: user.id, date, type: activity.label, durationMin, caloriesBurned });
  revalidatePath("/app", "layout");
  return { ok: `Activité ajoutée : ${activity.label}, environ ${caloriesBurned} kcal dépensées.` };
}

export async function deleteActivity(formData: FormData) {
  const { user } = await requireMember();
  const id = z.uuid().parse(formData.get("id"));
  await db.delete(schema.activityEntries).where(and(eq(schema.activityEntries.id, id), eq(schema.activityEntries.userId, user.id)));
  revalidatePath("/app", "layout");
}
