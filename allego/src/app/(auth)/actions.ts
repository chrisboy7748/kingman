"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { endSession, hashPassword, startSession, verifyPassword } from "@/lib/auth";
import { TRIAL_DAYS } from "@/lib/plans";
import { sendEmailSafely } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { requestPasswordReset, resetPassword } from "@/lib/password-reset";

/** `values` renvoie les saisies après une erreur, pour que le formulaire ne se vide pas. */
export type FormState = { error?: string; ok?: string; values?: Record<string, string> } | null;

const echo = (formData: FormData, keys: string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));

const signupSchema = z.object({
  name: z.string().trim().min(1, "Indiquez votre prénom.").max(80),
  email: z.email("Cette adresse e-mail n'est pas valide.").trim().toLowerCase(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200),
  healthConsent: z.literal("on", { error: "Votre accord est nécessaire pour enregistrer vos mesures." }),
  terms: z.literal("on", { error: "Acceptez les conditions générales pour continuer." }),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, ["name", "email", "healthConsent", "terms"]);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) return { error: "Un compte existe déjà avec cette adresse. Connectez-vous.", values };

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
  if (!user) return { error: "Un compte existe déjà avec cette adresse. Connectez-vous.", values };

  await sendEmailSafely(welcomeEmail(user, user.trialEndsAt));
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
    return { error: "E-mail ou mot de passe incorrect.", values: { email } };
  }
  await startSession(user.id);
  redirect("/app");
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function forgotPassword(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Cette adresse e-mail n'est pas valide.", values: echo(formData, ["email"]) };
  await requestPasswordReset(email.data);
  // Même réponse que le compte existe ou non.
  return {
    ok: "Si un compte existe pour cette adresse, vous allez recevoir un e-mail avec un lien valable une heure. Pensez à regarder dans les indésirables.",
  };
}

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Les deux mots de passe ne sont pas identiques." });

export async function chooseNewPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const userId = await resetPassword(parsed.data.token, parsed.data.password);
  if (!userId) return { error: "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau." };
  await startSession(userId);
  redirect("/app");
}
