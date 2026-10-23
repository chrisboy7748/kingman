"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/plans";

export type FormState = { error?: string; ok?: string } | null;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  email: z.email("Cette adresse e-mail n'est pas valide.").trim().toLowerCase(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200),
  healthConsent: z.literal("on", { error: "Votre accord est nécessaire pour enregistrer vos mesures." }),
  terms: z.literal("on", { error: "Acceptez les conditions générales pour continuer." }),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) return { error: "Un compte existe déjà avec cette adresse. Connectez-vous." };

  const now = new Date();
  const [user] = await db
    .insert(schema.users)
    .values({
      name,
      email,
      passwordHash: await hashPassword(password),
      healthConsentAt: now,
      trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 86_400_000),
    })
    .onConflictDoNothing()
    .returning();
  if (!user) return { error: "Un compte existe déjà avec cette adresse. Connectez-vous." };

  await startSession(user.id);
  redirect("/app/bienvenue");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const { email, password } = loginSchema.parse(Object.fromEntries(formData));
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  await startSession(user.id);
  redirect("/app");
}

export async function logout() {
  await endSession();
  redirect("/");
}
